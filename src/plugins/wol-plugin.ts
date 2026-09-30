import dgram from "node:dgram";
import { z } from "zod";
import type { JarvisPlugin } from "./plugin-registry.js";

function magicPacket(mac:string){
  const clean=mac.replace(/[:-]/g,"");
  if(!/^[0-9a-fA-F]{12}$/.test(clean)) throw new Error("Invalid MAC address");
  const macBytes=Buffer.from(clean,"hex");
  return Buffer.concat([Buffer.alloc(6,0xff),...Array.from({length:16},()=>macBytes)]);
}

async function send(mac:string,address:string,port:number){
  const socket=dgram.createSocket("udp4");
  const packet=magicPacket(mac);
  await new Promise<void>((resolve,reject)=>{
    socket.bind(()=>{
      socket.setBroadcast(true);
      socket.send(packet,port,address,(error)=>{
        socket.close();
        error?reject(error):resolve();
      });
    });
    socket.once("error",reject);
  });
}

export const wolPlugin:JarvisPlugin={
  id:"wake-on-lan",
  name:"Wake-on-LAN",
  version:"0.1.0",
  tools:[{
    name:"network.wol",
    description:"Send a Wake-on-LAN magic packet.",
    capability:"network.wol",
    async execute(input){
      const value=z.object({
        mac:z.string(),
        address:z.string().default("255.255.255.255"),
        port:z.number().int().min(1).max(65535).default(9)
      }).parse(input);
      await send(value.mac,value.address,value.port);
      return {ok:true};
    }
  }]
};
