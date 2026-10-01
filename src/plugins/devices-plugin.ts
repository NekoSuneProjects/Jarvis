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
        name:"devices.add",
        description:"Manually add a Jarvis-managed device record.",
        capability:"devices.manage",
        async execute(input){
          const value=z.object({
            name:z.string().min(1),
            platform:z.string().default("manual"),
            arch:z.string().default("unknown"),
            capabilities:z.array(z.string()).default([]),
            metadata:z.record(z.unknown()).default({})
          }).parse(input);
          return devices.addManual(value);
        }
      },
      {
        name:"devices.update",
        description:"Rename a device or update room/icon metadata.",
        capability:"devices.manage",
        async execute(input){
          const value=z.object({
            deviceId:z.string().min(1),
            name:z.string().min(1).optional(),
            room:z.string().optional(),
            icon:z.string().optional(),
            metadata:z.record(z.unknown()).optional()
          }).parse(input);
          return {ok:devices.updateDevice(value.deviceId,value)};
        }
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
