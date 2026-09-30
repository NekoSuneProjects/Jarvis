import { z } from "zod";
import type { HomeAssistantIntegration } from "../integrations/home-assistant.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createHomeAssistantPlugin(homeAssistant:HomeAssistantIntegration):JarvisPlugin{
  return {
    id:"home-assistant",
    name:"Home Assistant",
    version:"0.1.0",
    description:"Read and control Home Assistant entities and services.",
    tools:[
      {
        name:"home_assistant.states",
        description:"List Home Assistant entity states.",
        capability:"smart-home.read",
        parameters:{type:"object",properties:{},additionalProperties:false},
        async execute(){return homeAssistant.states();}
      },
      {
        name:"home_assistant.state",
        description:"Read one Home Assistant entity state.",
        capability:"smart-home.read",
        parameters:{
          type:"object",
          properties:{entityId:{type:"string"}},
          required:["entityId"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({entityId:z.string().min(1)}).parse(input);
          return homeAssistant.entityState(value.entityId);
        }
      },
      {
        name:"home_assistant.turn_on",
        description:"Turn on a Home Assistant entity, optionally with service data such as brightness or color.",
        capability:"smart-home.control",
        parameters:{
          type:"object",
          properties:{
            entityId:{type:"string"},
            data:{type:"object"}
          },
          required:["entityId"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            entityId:z.string().min(1),
            data:z.record(z.unknown()).default({})
          }).parse(input);
          return homeAssistant.turnOn(value.entityId,value.data);
        }
      },
      {
        name:"home_assistant.turn_off",
        description:"Turn off a Home Assistant entity.",
        capability:"smart-home.control",
        parameters:{
          type:"object",
          properties:{entityId:{type:"string"}},
          required:["entityId"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({entityId:z.string().min(1)}).parse(input);
          return homeAssistant.turnOff(value.entityId);
        }
      },
      {
        name:"home_assistant.call_service",
        description:"Call an arbitrary Home Assistant domain service with structured data.",
        capability:"smart-home.control",
        parameters:{
          type:"object",
          properties:{
            domain:{type:"string"},
            service:{type:"string"},
            data:{type:"object"}
          },
          required:["domain","service"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            domain:z.string().min(1),
            service:z.string().min(1),
            data:z.record(z.unknown()).default({})
          }).parse(input);
          return homeAssistant.callService(value.domain,value.service,value.data);
        }
      }
    ]
  };
}
