import { z } from "zod";
import { config } from "../config.js";
import {
  HueIntegration,
  ShellyIntegration,
  TasmotaIntegration,
  type NamedHttpDevice
} from "../integrations/lan-smart-home.js";
import type { JarvisPlugin } from "./plugin-registry.js";
import type { DiscoveryService } from "../devices/discovery.js";

function parseDevices(value:string):Record<string,NamedHttpDevice>{
  try{
    const parsed=JSON.parse(value);
    return parsed && typeof parsed==="object" ? parsed : {};
  }catch{
    return {};
  }
}

export function createLanSmartHomePlugin(discovery?:DiscoveryService):JarvisPlugin{
  const hue=new HueIntegration(config.hue.url,config.hue.username);
  const shelly=new ShellyIntegration(parseDevices(config.shellyDevicesJson));
  const tasmota=new TasmotaIntegration(parseDevices(config.tasmotaDevicesJson));

  return {
    id:"lan-smart-home",
    name:"LAN Smart Home",
    version:"0.1.0",
    description:"Direct local Hue, Shelly and Tasmota control without a cloud dependency.",
    tools:[
      {
        name:"hue.discover",
        description:"Discover Philips Hue bridges on the local network using SSDP/UPnP hints.",
        capability:"smart-home.read",
        async execute(){
          if(!discovery) return [];
          const devices=await discovery.ssdpScan(2500,"ssdp:all");
          return devices.filter((item:any)=>{
            const text=JSON.stringify(item).toLowerCase();
            return text.includes("philips hue") || text.includes("hue bridge") || text.includes("ipbridge");
          });
        }
      },
      {
        name:"hue.pair",
        description:"Pair with a Philips Hue bridge after the bridge link button is pressed.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({baseUrl:z.string().url(),deviceType:z.string().default("nekosune_jarvis#assistant")}).parse(input);
          return HueIntegration.pair(value.baseUrl,value.deviceType);
        }
      },
      {
        name:"hue.scenes",
        description:"List Philips Hue scenes.",
        capability:"smart-home.read",
        async execute(){return hue.scenes();}
      },
      {
        name:"hue.entertainment",
        description:"List Philips Hue entertainment zones.",
        capability:"smart-home.read",
        async execute(){return hue.entertainmentZones();}
      },
      {
        name:"hue.lights",
        description:"List Philips Hue lights from the configured local bridge.",
        capability:"smart-home.read",
        async execute(){return hue.lights();}
      },
      {
        name:"hue.groups",
        description:"List Philips Hue groups/rooms from the local bridge.",
        capability:"smart-home.read",
        async execute(){return hue.groups();}
      },
      {
        name:"hue.light.set",
        description:"Set a Hue light state. Supports on, bri, hue, sat, ct, xy and transitiontime.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            id:z.string().min(1),
            state:z.record(z.unknown())
          }).parse(input);
          return hue.lightState(value.id,value.state);
        }
      },
      {
        name:"hue.group.set",
        description:"Set a Hue group/room action.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            id:z.string().min(1),
            state:z.record(z.unknown())
          }).parse(input);
          return hue.groupAction(value.id,value.state);
        }
      },
      {
        name:"shelly.devices",
        description:"List configured Shelly devices.",
        capability:"smart-home.read",
        async execute(){return shelly.list();}
      },
      {
        name:"shelly.gen1.status",
        description:"Read status from a Shelly Gen1 device.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          return shelly.gen1Status(value.device);
        }
      },
      {
        name:"shelly.gen1.relay",
        description:"Control a Shelly Gen1 relay channel.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({device:z.string().min(1),id:z.number().int().min(0).default(0),on:z.boolean()}).parse(input);
          return shelly.gen1Relay(value.device,value.id,value.on);
        }
      },
      {
        name:"shelly.status",
        description:"Read Shelly device status.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          return shelly.status(value.device);
        }
      },
      {
        name:"shelly.info",
        description:"Read Shelly device information.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          return shelly.info(value.device);
        }
      },
      {
        name:"shelly.switch",
        description:"Turn a Shelly switch channel on/off, optionally with toggle-after seconds.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            id:z.number().int().min(0).default(0),
            on:z.boolean(),
            toggleAfter:z.number().positive().optional()
          }).parse(input);
          return shelly.switchSet(value.device,value.id,value.on,value.toggleAfter);
        }
      },
      {
        name:"tasmota.devices",
        description:"List configured Tasmota devices.",
        capability:"smart-home.read",
        async execute(){return tasmota.list();}
      },
      {
        name:"tasmota.status",
        description:"Read full Tasmota device status.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          return tasmota.status(value.device);
        }
      },
      {
        name:"tasmota.power",
        description:"Turn a Tasmota relay channel on/off.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            on:z.boolean(),
            index:z.number().int().min(1).max(32).default(1)
          }).parse(input);
          return tasmota.power(value.device,value.on,value.index);
        }
      },
      {
        name:"tasmota.dimmer",
        description:"Set Tasmota dimmer brightness 0-100.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            percent:z.number().min(0).max(100)
          }).parse(input);
          return tasmota.dimmer(value.device,value.percent);
        }
      },
      {
        name:"tasmota.command",
        description:"Send a raw Tasmota command. Requires smart-home control approval.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            command:z.string().min(1).max(1000)
          }).parse(input);
          return tasmota.command(value.device,value.command);
        }
      }
    ]
  };
}
