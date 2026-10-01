import { z } from "zod";
import type { HomeAssistantIntegration } from "../integrations/home-assistant.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createTuyaPlugin(homeAssistant:HomeAssistantIntegration):JarvisPlugin{
  const discover=async()=>{
    const states=await homeAssistant.states() as any[];
    return states.filter((state)=>{
      const text=JSON.stringify(state.attributes ?? {}).toLowerCase();
      return text.includes("tuya") || text.includes("smart life");
    });
  };

  return {
    id:"tuya",
    name:"Tuya via Home Assistant",
    version:"0.1.0",
    description:"Tuya/Smart Life device discovery and control through Home Assistant.",
    tools:[
      {
        name:"tuya.discover",
        description:"Discover Tuya/Smart Life entities exposed by Home Assistant.",
        capability:"smart-home.read",
        async execute(){return discover();}
      },
      {
        name:"tuya.state",
        description:"Read a Tuya entity state from Home Assistant.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({entityId:z.string().min(1)}).parse(input);
          return homeAssistant.entityState(value.entityId);
        }
      },
      {
        name:"tuya.switch",
        description:"Control a Tuya switch entity through Home Assistant.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({entityId:z.string().min(1),on:z.boolean()}).parse(input);
          return value.on?homeAssistant.turnOn(value.entityId):homeAssistant.turnOff(value.entityId);
        }
      },
      {
        name:"tuya.light",
        description:"Control a Tuya light through Home Assistant.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            entityId:z.string().min(1),
            on:z.boolean().default(true),
            brightnessPct:z.number().min(0).max(100).optional(),
            rgbColor:z.tuple([z.number().int().min(0).max(255),z.number().int().min(0).max(255),z.number().int().min(0).max(255)]).optional()
          }).parse(input);
          if(!value.on) return homeAssistant.turnOff(value.entityId);
          return homeAssistant.turnOn(value.entityId,{
            ...(value.brightnessPct!==undefined?{brightness_pct:value.brightnessPct}:{}),
            ...(value.rgbColor?{rgb_color:value.rgbColor}:{})
          });
        }
      },
      {
        name:"tuya.sensors",
        description:"Read discovered Tuya sensor entities through Home Assistant.",
        capability:"smart-home.read",
        async execute(){
          return (await discover()).filter((state:any)=>
            state.entity_id?.startsWith("sensor.") || state.entity_id?.startsWith("binary_sensor.")
          );
        }
      },
      {
        name:"tuya.energy",
        description:"Read Tuya energy/power sensor entities through Home Assistant.",
        capability:"smart-home.read",
        async execute(){
          return (await discover()).filter((state:any)=>{
            const id=String(state.entity_id ?? "").toLowerCase();
            const cls=String(state.attributes?.device_class ?? "").toLowerCase();
            return /power|energy|current|voltage/.test(id) || /power|energy|current|voltage/.test(cls);
          });
        }
      }
    ]
  };
}
