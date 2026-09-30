import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { EventBus } from "../events/event-bus.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createNotificationsPlugin(store:AssistantStore,events:EventBus):JarvisPlugin{
  return {
    id:"notifications",
    name:"Notifications",
    version:"0.1.0",
    description:"Persistent Jarvis notification center.",
    tools:[
      {
        name:"notifications.send",
        description:"Create a Jarvis notification visible to connected clients.",
        capability:"notifications.send",
        parameters:{
          type:"object",
          properties:{
            title:{type:"string"},
            body:{type:"string"},
            priority:{type:"string",enum:["low","normal","high","critical"]},
            source:{type:"string"}
          },
          required:["title","body"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            title:z.string().min(1),
            body:z.string(),
            priority:z.enum(["low","normal","high","critical"]).default("normal"),
            source:z.string().default("jarvis")
          }).parse(input);
          const notification=store.createNotification(
            value.title,value.body,value.priority,value.source
          );
          events.publish("notification.created",notification);
          return notification;
        }
      },
      {
        name:"notifications.list",
        description:"Read Jarvis notifications.",
        capability:"notifications.read",
        async execute(input){
          const value=z.object({
            limit:z.number().int().min(1).max(500).default(100),
            unreadOnly:z.boolean().default(false)
          }).parse(input ?? {});
          return store.listNotifications(value.limit,value.unreadOnly);
        }
      }
    ]
  };
}
