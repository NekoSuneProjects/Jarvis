import { z } from "zod";
import type { MqttIntegration } from "../integrations/mqtt.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createMqttPlugin(mqtt:MqttIntegration):JarvisPlugin{
  return {
    id:"mqtt",
    name:"MQTT",
    version:"0.1.0",
    description:"Publish and subscribe through the configured MQTT broker.",
    tools:[
      {
        name:"mqtt.topics",
        description:"Browse recently seen MQTT topics and payloads.",
        capability:"mqtt.subscribe",
        async execute(input){
          const value=z.object({prefix:z.string().default("")}).parse(input ?? {});
          return mqtt.topics(value.prefix);
        }
      },
      {
        name:"mqtt.discovery.home_assistant",
        description:"Subscribe to Home Assistant MQTT discovery topics.",
        capability:"mqtt.subscribe",
        async execute(){return mqtt.discoverHomeAssistant();}
      },
      {
        name:"mqtt.jarvis.state",
        description:"Publish retained Jarvis state to MQTT.",
        capability:"mqtt.publish",
        async execute(input){
          const value=z.object({state:z.record(z.unknown())}).parse(input);
          await mqtt.publishJarvisState(value.state);
          return {ok:true};
        }
      },
      {
        name:"mqtt.jarvis.voice_event",
        description:"Publish a Jarvis voice-assistant event to MQTT.",
        capability:"mqtt.publish",
        async execute(input){
          const value=z.object({event:z.string().min(1),payload:z.unknown().optional()}).parse(input);
          await mqtt.publishVoiceEvent(value.event,value.payload ?? {});
          return {ok:true};
        }
      },
      {
        name:"tasmota.mqtt.discover",
        description:"Discover Tasmota devices by subscribing to common tele/stat discovery topics.",
        capability:"mqtt.subscribe",
        async execute(){
          await mqtt.subscribe("tele/+/LWT",0);
          await mqtt.subscribe("tele/+/STATE",0);
          await mqtt.subscribe("stat/+/RESULT",0);
          return {
            tele:mqtt.topics("tele/"),
            stat:mqtt.topics("stat/")
          };
        }
      },
      {
        name:"tasmota.mqtt.command",
        description:"Send a Tasmota MQTT command to cmnd/<device>/<command>.",
        capability:"smart-home.control",
        async execute(input){
          const value=z.object({
            device:z.string().min(1),
            command:z.string().min(1),
            payload:z.union([z.string(),z.number(),z.boolean()]).default("")
          }).parse(input);
          const topic=`cmnd/${value.device}/${value.command}`;
          await mqtt.publish(topic,String(value.payload),{qos:0,retain:false});
          return {ok:true,topic,payload:String(value.payload)};
        }
      },
      {
        name:"mqtt.publish",
        description:"Publish an MQTT message.",
        capability:"mqtt.publish",
        parameters:{
          type:"object",
          properties:{
            topic:{type:"string"},
            payload:{type:"string"},
            retain:{type:"boolean"},
            qos:{type:"integer",enum:[0,1,2]}
          },
          required:["topic","payload"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            topic:z.string().min(1),
            payload:z.string(),
            retain:z.boolean().default(false),
            qos:z.union([z.literal(0),z.literal(1),z.literal(2)]).default(0)
          }).parse(input);
          await mqtt.publish(value.topic,value.payload,{
            retain:value.retain,
            qos:value.qos
          });
          return {ok:true};
        }
      },
      {
        name:"mqtt.subscribe",
        description:"Subscribe Jarvis to an MQTT topic or wildcard.",
        capability:"mqtt.subscribe",
        parameters:{
          type:"object",
          properties:{
            topic:{type:"string"},
            qos:{type:"integer",enum:[0,1,2]}
          },
          required:["topic"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            topic:z.string().min(1),
            qos:z.union([z.literal(0),z.literal(1),z.literal(2)]).default(0)
          }).parse(input);
          await mqtt.subscribe(value.topic,value.qos);
          return {ok:true};
        }
      }
    ]
  };
}
