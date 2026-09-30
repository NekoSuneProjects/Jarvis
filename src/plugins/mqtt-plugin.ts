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
