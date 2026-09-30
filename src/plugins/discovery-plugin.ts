import { z } from "zod";
import type { DiscoveryService } from "../devices/discovery.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createDiscoveryPlugin(discovery:DiscoveryService):JarvisPlugin{
  return {
    id:"discovery",
    name:"Device Discovery",
    version:"0.1.0",
    description:"Discover local-network services using mDNS/Bonjour and SSDP/UPnP.",
    tools:[
      {
        name:"discovery.mdns",
        description:"Scan the local network for mDNS/Bonjour services, optionally by service type.",
        capability:"devices.read",
        parameters:{
          type:"object",
          properties:{
            type:{type:"string"},
            durationMs:{type:"integer",minimum:500,maximum:15000}
          },
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            type:z.string().optional(),
            durationMs:z.number().int().min(500).max(15000).default(3000)
          }).parse(input ?? {});
          return discovery.mdnsScan(value);
        }
      },
      {
        name:"discovery.ssdp",
        description:"Scan the local network for SSDP/UPnP devices and services.",
        capability:"devices.read",
        parameters:{
          type:"object",
          properties:{
            target:{type:"string"},
            durationMs:{type:"integer",minimum:500,maximum:15000}
          },
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            target:z.string().default("ssdp:all"),
            durationMs:z.number().int().min(500).max(15000).default(3000)
          }).parse(input ?? {});
          return discovery.ssdpScan(value.durationMs,value.target);
        }
      }
    ]
  };
}
