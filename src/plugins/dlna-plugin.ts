import { z } from "zod";
import type { DiscoveryService } from "../devices/discovery.js";
import type { JarvisPlugin } from "./plugin-registry.js";

type UpnpService={serviceType:string;controlURL:string};

async function description(location:string){
  const response=await fetch(location,{signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new Error(`UPnP description HTTP ${response.status}`);
  const xml=await response.text();
  const base=new URL(location);
  const services:UpnpService[]=[];
  const re=/<service>[\s\S]*?<serviceType>([^<]+)<\/serviceType>[\s\S]*?<controlURL>([^<]+)<\/controlURL>[\s\S]*?<\/service>/gi;
  let match:RegExpExecArray|null;
  while((match=re.exec(xml))){
    services.push({
      serviceType:match[1].trim(),
      controlURL:new URL(match[2].trim(),base).toString()
    });
  }
  const name=xml.match(/<friendlyName>([^<]+)<\/friendlyName>/i)?.[1] ?? location;
  const deviceType=xml.match(/<deviceType>([^<]+)<\/deviceType>/i)?.[1] ?? "";
  return {location,name,deviceType,services};
}

async function soap(service:UpnpService,action:string,args:Record<string,string|number>={}){
  const body=`<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body><u:${action} xmlns:u="${service.serviceType}">${Object.entries(args).map(([k,v])=>`<${k}>${String(v)}</${k}>`).join("")}</u:${action}></s:Body>
</s:Envelope>`;
  const response=await fetch(service.controlURL,{
    method:"POST",
    headers:{
      "content-type":'text/xml; charset="utf-8"',
      soapaction:`"${service.serviceType}#${action}"`
    },
    body,
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok) throw new Error(`UPnP SOAP ${action} HTTP ${response.status}: ${await response.text()}`);
  return response.text();
}

function findService(device:any,type:string){
  const service=device.services.find((s:UpnpService)=>s.serviceType.includes(type));
  if(!service) throw new Error(`UPnP service not found: ${type}`);
  return service;
}

export function createDlnaPlugin(discovery:DiscoveryService):JarvisPlugin{
  const discover=async()=>{
    const results=await discovery.ssdpScan(2500,"ssdp:all");
    const devices=[];
    for(const item of results){
      const location=item.headers.location;
      if(!location) continue;
      try{devices.push(await description(location));}catch{}
    }
    return devices;
  };

  return {
    id:"dlna",
    name:"DLNA / UPnP",
    version:"0.1.0",
    description:"Discover UPnP/DLNA devices, browse media servers and control renderers.",
    tools:[
      {
        name:"dlna.discover",
        description:"Discover DLNA/UPnP devices, renderers and media servers.",
        capability:"media.read",
        async execute(){
          const devices=await discover();
          return {
            devices,
            renderers:devices.filter((d)=>d.services.some((s)=>s.serviceType.includes("AVTransport"))),
            servers:devices.filter((d)=>d.services.some((s)=>s.serviceType.includes("ContentDirectory")))
          };
        }
      },
      {
        name:"dlna.browse",
        description:"Browse a DLNA ContentDirectory object.",
        capability:"media.read",
        async execute(input){
          const value=z.object({location:z.string().url(),objectId:z.string().default("0"),count:z.number().int().min(1).max(1000).default(200)}).parse(input);
          const device=await description(value.location);
          return {xml:await soap(findService(device,"ContentDirectory"),"Browse",{
            ObjectID:value.objectId,
            BrowseFlag:"BrowseDirectChildren",
            Filter:"*",
            StartingIndex:0,
            RequestedCount:value.count,
            SortCriteria:""
          })};
        }
      },
      {
        name:"dlna.play",
        description:"Set a media URI on a DLNA renderer and start playback.",
        capability:"media.control",
        async execute(input){
          const value=z.object({location:z.string().url(),url:z.string().url(),metadata:z.string().default("")}).parse(input);
          const device=await description(value.location);
          const av=findService(device,"AVTransport");
          await soap(av,"SetAVTransportURI",{InstanceID:0,CurrentURI:value.url,CurrentURIMetaData:value.metadata});
          await soap(av,"Play",{InstanceID:0,Speed:"1"});
          return {ok:true};
        }
      },
      ...(["Play","Pause","Stop"] as const).map((action)=>({
        name:`dlna.${action.toLowerCase()}`,
        description:`${action} a DLNA renderer.`,
        capability:"media.control",
        async execute(input:unknown){
          const value=z.object({location:z.string().url()}).parse(input);
          const device=await description(value.location);
          const av=findService(device,"AVTransport");
          return {xml:await soap(av,action,action==="Play"?{InstanceID:0,Speed:"1"}:{InstanceID:0})};
        }
      })),
      {
        name:"dlna.volume",
        description:"Set DLNA renderer master volume.",
        capability:"media.control",
        async execute(input){
          const value=z.object({location:z.string().url(),percent:z.number().min(0).max(100)}).parse(input);
          const device=await description(value.location);
          return {xml:await soap(findService(device,"RenderingControl"),"SetVolume",{
            InstanceID:0,Channel:"Master",DesiredVolume:Math.round(value.percent)
          })};
        }
      },
      {
        name:"dlna.status",
        description:"Read DLNA renderer playback and volume state.",
        capability:"media.read",
        async execute(input){
          const value=z.object({location:z.string().url()}).parse(input);
          const device=await description(value.location);
          const av=findService(device,"AVTransport");
          const rc=findService(device,"RenderingControl");
          const [transport,position,volume]=await Promise.all([
            soap(av,"GetTransportInfo",{InstanceID:0}),
            soap(av,"GetPositionInfo",{InstanceID:0}),
            soap(rc,"GetVolume",{InstanceID:0,Channel:"Master"})
          ]);
          return {transport,position,volume};
        }
      }
    ]
  };
}
