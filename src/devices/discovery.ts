import dgram from "node:dgram";
import os from "node:os";
import { Bonjour, type Service } from "bonjour-service";

export interface SsdpDevice {
  address:string;
  port:number;
  headers:Record<string,string>;
}

export class DiscoveryService {
  private readonly bonjour=new Bonjour(undefined,(error:Error)=>{
    console.warn("mDNS error:",error.message);
  });
  private published?:ReturnType<Bonjour["publish"]>;

  advertise(port:number){
    if(this.published) return;
    this.published=this.bonjour.publish({
      name:`NekoSune Jarvis - ${os.hostname()}`,
      type:"nekosune-jarvis",
      protocol:"tcp",
      port,
      txt:{
        version:"0.1.0",
        api:"v1"
      }
    });
  }

  async mdnsScan(options:{type?:string;durationMs?:number}={}){
    const services=new Map<string,Service>();
    const duration=Math.max(500,Math.min(options.durationMs ?? 3000,15000));
    const browser=this.bonjour.find(
      {type:options.type ?? "http"},
      (service)=>{
        services.set(service.fqdn ?? `${service.name}:${service.port}`,service);
      }
    );

    await new Promise((resolve)=>setTimeout(resolve,duration));
    browser.stop();

    return [...services.values()].map((service)=>({
      name:service.name,
      type:service.type,
      protocol:service.protocol,
      host:service.host,
      port:service.port,
      fqdn:service.fqdn,
      addresses:service.addresses,
      txt:service.txt
    }));
  }

  async ssdpScan(durationMs=3000,target="ssdp:all"):Promise<SsdpDevice[]>{
    const socket=dgram.createSocket("udp4");
    const devices=new Map<string,SsdpDevice>();
    const duration=Math.max(500,Math.min(durationMs,15000));

    const message=Buffer.from([
      "M-SEARCH * HTTP/1.1",
      "HOST: 239.255.255.250:1900",
      'MAN: "ssdp:discover"',
      "MX: 2",
      `ST: ${target}`,
      "",
      ""
    ].join("\r\n"));

    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=()=>{
        if(done) return;
        done=true;
        socket.close();
        resolve([...devices.values()]);
      };

      socket.on("message",(msg,rinfo)=>{
        const lines=msg.toString("utf8").split(/\r?\n/);
        const headers:Record<string,string>={};
        for(const line of lines.slice(1)){
          const index=line.indexOf(":");
          if(index<=0) continue;
          headers[line.slice(0,index).trim().toLowerCase()]=line.slice(index+1).trim();
        }
        const key=headers.usn ?? headers.location ?? `${rinfo.address}:${rinfo.port}`;
        devices.set(key,{
          address:rinfo.address,
          port:rinfo.port,
          headers
        });
      });

      socket.once("error",(error)=>{
        if(done) return;
        done=true;
        socket.close();
        reject(error);
      });

      socket.bind(()=>{
        socket.setBroadcast(true);
        socket.send(message,1900,"239.255.255.250",(error)=>{
          if(error){
            if(!done){
              done=true;
              socket.close();
              reject(error);
            }
          }
        });
      });

      setTimeout(finish,duration);
    });
  }

  close(){
    try{this.published?.stop();}catch{}
    this.published=undefined;
    this.bonjour.destroy();
  }
}
