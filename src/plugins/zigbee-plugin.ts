import { z } from "zod";
import type { MqttIntegration } from "../integrations/mqtt.js";
import type { HomeAssistantIntegration } from "../integrations/home-assistant.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createZigbeePlugin(
  mqtt:MqttIntegration,
  homeAssistant:HomeAssistantIntegration
):JarvisPlugin{
  const topic=(device:string,suffix="") =>
    `zigbee2mqtt/${device}${suffix?"/"+suffix:""}`;

  return {
    id:"zigbee",
    name:"Zigbee",
    version:"0.1.0",
    description:"Zigbee support through Home Assistant and Zigbee2MQTT.",
    tools:[
      {
        name:"zigbee.home_assistant.entities",
        description:"List Home Assistant entities likely backed by Zigbee devices.",
        capability:"smart-home.read",
        async execute(){
          const states=await homeAssistant.states() as any[];
          return states.filter((state)=> {
            const attrs=state.attributes ?? {};
            const text=JSON.stringify(attrs).toLowerCase();
            return text.includes("zigbee") || text.includes("zha") || text.includes("zigbee2mqtt");
          });
        }
      },
      {
        name:"zigbee2mqtt.discover",
        description:"Subscribe to Zigbee2MQTT discovery/device topics and return recently seen discovery payloads.",
        capability:"mqtt.subscribe",
        async execute(){
          await mqtt.subscribe("zigbee2mqtt/bridge/#",0);
          await mqtt.subscribe("zigbee2mqtt/+/availability",0);
          return mqtt.topics("zigbee2mqtt/bridge");
        }
      },
      {
        name:"zigbee2mqtt.state",
        description:"Read recently seen MQTT state for a Zigbee2MQTT device.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          const matches=mqtt.topics(topic(value.device));
          return {device:value.device,topics:matches};
        }
      },
      {
        name:"zigbee2mqtt.set",
        description:"Control a Zigbee2MQTT device by publishing a structured /set payload.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({device:z.string().min(1),state:z.record(z.unknown())}).parse(input);
          await mqtt.publish(topic(value.device,"set"),JSON.stringify(value.state),{qos:0,retain:false});
          return {ok:true,device:value.device,state:value.state};
        }
      },
      {
        name:"zigbee2mqtt.light",
        description:"Control Zigbee2MQTT light power, brightness and color temperature.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            on:z.boolean().optional(),
            brightness:z.number().int().min(0).max(254).optional(),
            colorTemp:z.number().int().positive().optional()
          }).parse(input);
          const state:Record<string,unknown>={};
          if(value.on!==undefined) state.state=value.on?"ON":"OFF";
          if(value.brightness!==undefined) state.brightness=value.brightness;
          if(value.colorTemp!==undefined) state.color_temp=value.colorTemp;
          await mqtt.publish(topic(value.device,"set"),JSON.stringify(state),{qos:0,retain:false});
          return {ok:true,state};
        }
      },
      {
        name:"zigbee2mqtt.sensors",
        description:"Read cached sensor/state payloads for a Zigbee2MQTT device.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          return mqtt.topics(topic(value.device));
        }
      },
      {
        name:"zigbee2mqtt.button_events",
        description:"Subscribe to and read recent Zigbee2MQTT button/action events.",
        capability:"smart-home.read",
        async execute(input){
          const value=z.object({device:z.string().min(1)}).parse(input);
          await mqtt.subscribe(topic(value.device),0);
          return mqtt.topics(topic(value.device));
        }
      }
    ]
  };
}
