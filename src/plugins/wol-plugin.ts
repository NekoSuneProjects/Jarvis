import dgram from "node:dgram";
import net from "node:net";
import { z } from "zod";
import type { JarvisPlugin } from "./plugin-registry.js";

function magicPacket(mac:string){
  const clean=mac.replace(/[:-]/g,"");
  if(!/^[0-9a-fA-F]{12}$/.test(clean)) throw new Error("Invalid MAC address");
  const macBytes=Buffer.from(clean,"hex");
  return Buffer.concat([Buffer.alloc(6,0xff),...Array.from({length:16},()=>macBytes)]);
}

async function tcpOnline(host:string,port=445,timeoutMs=1500){
  return new Promise<boolean>((resolve)=>{
    const socket=net.createConnection({host,port});
    const done=(value:boolean)=>{socket.destroy();resolve(value);};
    socket.setTimeout(timeoutMs);
    socket.once("connect",()=>done(true));
    socket.once("timeout",()=>done(false));
    socket.once("error",()=>done(false));
  });
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
  tools:[
  {
    name:"network.online",
    description:"Check whether a device accepts a TCP connection on the selected port.",
    capability:"devices.read",
    async execute(input){
      const value=z.object({host:z.string().min(1),port:z.number().int().min(1).max(65535).default(445),timeoutMs:z.number().int().min(100).max(10000).default(1500)}).parse(input);
      return {online:await tcpOnline(value.host,value.port,value.timeoutMs)};
    }
  },
  {
    name:"network.wol.wait",
    description:"Send Wake-on-LAN and wait for the target device to become reachable.",
    capability:"network.wol",
    async execute(input){
      const value=z.object({
        mac:z.string(),
        address:z.string().default("255.255.255.255"),
        wolPort:z.number().int().min(1).max(65535).default(9),
        host:z.string().min(1),
        probePort:z.number().int().min(1).max(65535).default(445),
        timeoutMs:z.number().int().min(1000).max(120000).default(60000)
      }).parse(input);
      await send(value.mac,value.address,value.wolPort);
      const deadline=Date.now()+value.timeoutMs;
      while(Date.now()<deadline){
        if(await tcpOnline(value.host,value.probePort,1200)) return {ok:true,online:true};
        await new Promise((resolve)=>setTimeout(resolve,1000));
      }
      return {ok:true,online:false};
    }
  },
  {
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
