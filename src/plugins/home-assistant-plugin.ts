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
        name:"home_assistant.devices",
        description:"Group Home Assistant entities into device-oriented views.",
        capability:"smart-home.read",
        async execute(){return homeAssistant.devices();}
      },
      {
        name:"home_assistant.areas",
        description:"Group Home Assistant entities into room/area views.",
        capability:"smart-home.read",
        async execute(){return homeAssistant.areas();}
      },
      {
        name:"home_assistant.presence",
        description:"Read Home Assistant person and device_tracker presence.",
        capability:"smart-home.read",
        async execute(){return homeAssistant.presence();}
      },
      {
        name:"home_assistant.alarms",
        description:"Read Home Assistant alarm control panel states.",
        capability:"smart-home.read",
        async execute(){return homeAssistant.alarms();}
      },
      {
        name:"home_assistant.alarm",
        description:"Control a Home Assistant alarm panel.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            entityId:z.string().min(1),
            action:z.enum(["arm_away","arm_home","arm_night","disarm"]),
            code:z.string().optional()
          }).parse(input);
          const service={
            arm_away:"alarm_arm_away",
            arm_home:"alarm_arm_home",
            arm_night:"alarm_arm_night",
            disarm:"alarm_disarm"
          }[value.action];
          return homeAssistant.callService("alarm_control_panel",service,{
            entity_id:value.entityId,
            ...(value.code?{code:value.code}:{})
          });
        }
      },
      {
        name:"home_assistant.media_players",
        description:"Read Home Assistant media_player states.",
        capability:"smart-home.read",
        async execute(){return homeAssistant.mediaPlayers();}
      },
      {
        name:"home_assistant.media",
        description:"Control a Home Assistant media player.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            entityId:z.string().min(1),
            action:z.enum(["play","pause","stop","next","previous","volume"]),
            volume:z.number().min(0).max(1).optional()
          }).parse(input);
          const service={
            play:"media_play",pause:"media_pause",stop:"media_stop",
            next:"media_next_track",previous:"media_previous_track",volume:"volume_set"
          }[value.action];
          return homeAssistant.callService("media_player",service,{
            entity_id:value.entityId,
            ...(value.action==="volume"?{volume_level:value.volume??0.5}:{})
          });
        }
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
        name:"home_assistant.light.set",
        description:"Set Home Assistant light brightness, RGB color, color temperature or Kelvin.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            entityId:z.string().min(1),
            on:z.boolean().default(true),
            brightness:z.number().int().min(0).max(255).optional(),
            brightnessPct:z.number().min(0).max(100).optional(),
            rgbColor:z.tuple([z.number().int().min(0).max(255),z.number().int().min(0).max(255),z.number().int().min(0).max(255)]).optional(),
            colorTempKelvin:z.number().int().positive().optional(),
            colorTempMired:z.number().int().positive().optional()
          }).parse(input);
          if(!value.on) return homeAssistant.turnOff(value.entityId);
          const data:Record<string,unknown>={};
          if(value.brightness!==undefined) data.brightness=value.brightness;
          if(value.brightnessPct!==undefined) data.brightness_pct=value.brightnessPct;
          if(value.rgbColor) data.rgb_color=value.rgbColor;
          if(value.colorTempKelvin!==undefined) data.color_temp_kelvin=value.colorTempKelvin;
          if(value.colorTempMired!==undefined) data.color_temp=value.colorTempMired;
          return homeAssistant.turnOn(value.entityId,data);
        }
      },
      {
        name:"home_assistant.sensors",
        description:"List Home Assistant sensor and binary_sensor entity states.",
        capability:"smart-home.read",
        async execute(){
          const states=await homeAssistant.states() as Array<{entity_id?:string}>;
          return states.filter((item)=>item.entity_id?.startsWith("sensor.") || item.entity_id?.startsWith("binary_sensor."));
        }
      },
      {
        name:"home_assistant.automation.run",
        description:"Trigger a Home Assistant automation by entity ID.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({entityId:z.string().min(1)}).parse(input);
          return homeAssistant.callService("automation","trigger",{entity_id:value.entityId});
        }
      },
      {
        name:"home_assistant.script.run",
        description:"Run a Home Assistant script by entity ID.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({entityId:z.string().min(1),variables:z.record(z.unknown()).default({})}).parse(input);
          return homeAssistant.callService("script","turn_on",{entity_id:value.entityId,variables:value.variables});
        }
      },
      {
        name:"home_assistant.scene.run",
        description:"Activate a Home Assistant scene by entity ID.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({entityId:z.string().min(1)}).parse(input);
          return homeAssistant.callService("scene","turn_on",{entity_id:value.entityId});
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
