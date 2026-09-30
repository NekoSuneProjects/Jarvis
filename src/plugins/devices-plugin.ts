import { z } from "zod";
import type { DeviceRegistry } from "../devices/device-registry.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createDevicesPlugin(devices:DeviceRegistry):JarvisPlugin{
  return {
    id:"devices",
    name:"Devices",
    version:"0.1.0",
    description:"Paired Jarvis device inspection and remote command queue.",
    tools:[
      {
        name:"devices.list",
        description:"List paired Jarvis devices and their latest telemetry.",
        capability:"devices.read",
        parameters:{type:"object",properties:{},additionalProperties:false},
        async execute(){return devices.list();}
      },
      {
        name:"devices.command",
        description:"Queue an allowlisted command on a paired Jarvis agent.",
        capability:"devices.manage",
        parameters:{
          type:"object",
          properties:{
            deviceId:{type:"string"},
            command:{
              type:"string",
              enum:["system.info","process.list","app.open","url.open"]
            },
            args:{type:"object"}
          },
          required:["deviceId","command"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            deviceId:z.string().min(1),
            command:z.enum(["system.info","process.list","app.open","url.open"]),
            args:z.record(z.unknown()).default({})
          }).parse(input);
          return devices.enqueueCommand(value.deviceId,value.command,value.args);
        }
      }
    ]
  };
}
