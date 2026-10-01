import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { AssistantStore } from "../assistant/store.js";
import type { EventBus } from "../events/event-bus.js";
import type { HomeAssistantIntegration } from "../integrations/home-assistant.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function ping(host:string,timeoutMs=2000){
  const args=process.platform==="win32"
    ? ["-n","1","-w",String(timeoutMs),host]
    : ["-c","1","-W",String(Math.max(1,Math.ceil(timeoutMs/1000))),host];
  try{
    const result=await runProcess("ping",args,{timeoutMs:timeoutMs+1000});
    return result.code===0;
  }catch{return false;}
}

export function createPresencePlugin(
  store:AssistantStore,
  events:EventBus,
  homeAssistant:HomeAssistantIntegration
):JarvisPlugin{
  const profiles=()=>store.getSetting<Record<string,{
    hosts?:string[];
    haEntities?:string[];
    bluetoothIds?:string[];
  }>>("presence.profiles",{}) ?? {};

  return {
    id:"presence",
    name:"Home Presence",
    version:"0.1.0",
    description:"Privacy-controlled local presence detection using ping/Wi-Fi-style hosts and Home Assistant trackers.",
    tools:[
      {
        name:"presence.profiles",
        description:"List configured presence profiles without exposing unrelated settings.",
        capability:"devices.read",
        async execute(){return profiles();}
      },
      {
        name:"presence.profile.set",
        description:"Configure a user's local hosts, Home Assistant trackers and optional Bluetooth IDs.",
        capability:"devices.manage",
        async execute(input){
          const value=z.object({
            user:z.string().min(1),
            hosts:z.array(z.string()).default([]),
            haEntities:z.array(z.string()).default([]),
            bluetoothIds:z.array(z.string()).default([])
          }).parse(input);
          const all=profiles();
          all[value.user]={hosts:value.hosts,haEntities:value.haEntities,bluetoothIds:value.bluetoothIds};
          store.setSetting("presence.profiles",all);
          return {ok:true,user:value.user};
        }
      },
      {
        name:"presence.privacy",
        description:"Enable or disable presence tracking globally.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({enabled:z.boolean()}).parse(input);
          store.setSetting("presence.enabled",value.enabled);
          if(!value.enabled) store.setSetting("presence.state",{});
          return {ok:true,enabled:value.enabled};
        }
      },
      {
        name:"presence.check",
        description:"Check per-user Home/Away presence from configured hosts and Home Assistant trackers.",
        capability:"devices.read",
        async execute(input){
          const value=z.object({user:z.string().optional(),timeoutMs:z.number().int().min(250).max(10000).default(1500)}).parse(input??{});
          if(store.getSetting<boolean>("presence.enabled",true)===false){
            return {enabled:false,users:[]};
          }
          const all=profiles();
          const selected=value.user?Object.entries(all).filter(([name])=>name===value.user):Object.entries(all);
          const haStates=homeAssistant.state==="connected"
            ? await homeAssistant.presence().catch(()=>[]) as Array<any>
            : [];
          const previous=store.getSetting<Record<string,string>>("presence.state",{}) ?? {};
          const next={...previous};
          const users=[];
          for(const [user,profile] of selected){
            const hostResults=await Promise.all((profile.hosts??[]).map(async(host)=>({host,online:await ping(host,value.timeoutMs)})));
            const haResults=(profile.haEntities??[]).map((entityId)=>{
              const state=haStates.find((item)=>item.entity_id===entityId);
              return {entityId,state:state?.state??null,home:state?.state==="home"};
            });
            const home=hostResults.some((item)=>item.online)||haResults.some((item)=>item.home);
            const state=home?"home":"away";
            users.push({user,state,hosts:hostResults,homeAssistant:haResults,bluetoothIds:profile.bluetoothIds??[]});
            if(previous[user]!==state){
              events.publish(`presence.${state}`,{user,previous:previous[user]??null,state});
            }
            next[user]=state;
          }
          store.setSetting("presence.state",next);
          return {enabled:true,users};
        }
      }
    ]
  };
}
