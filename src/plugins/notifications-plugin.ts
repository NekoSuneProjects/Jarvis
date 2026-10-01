import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { EventBus } from "../events/event-bus.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createNotificationsPlugin(store:AssistantStore,events:EventBus):JarvisPlugin{
  const inQuietHours=()=>{
    const quiet=store.getSetting<{enabled:boolean;start:string;end:string}>("notifications.quietHours",{enabled:false,start:"22:00",end:"07:00"});
    if(!quiet?.enabled) return false;
    const hhmm=new Date().toTimeString().slice(0,5);
    return quiet.start<=quiet.end
      ? hhmm>=quiet.start && hhmm<quiet.end
      : hhmm>=quiet.start || hhmm<quiet.end;
  };
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
          const suppressed=inQuietHours() && !["high","critical"].includes(value.priority);
          if(!suppressed) events.publish("notification.created",notification);
          return {...(notification as any),suppressed};
        }
      },
      {
        name:"notifications.list",
        description:"Read Jarvis notifications.",
        capability:"notifications.read",
        async execute(input){
          const value=z.object({
            limit:z.number().int().min(1).max(500).default(100),
            unreadOnly:z.boolean().default(false),
            minPriority:z.enum(["low","normal","high","critical"]).default("low")
          }).parse(input ?? {});
          return store.listNotifications(value.limit,value.unreadOnly,value.minPriority);
        }
      },
      {
        name:"notifications.quiet_hours",
        description:"Configure notification quiet hours; high/critical alerts still pass through.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({
            enabled:z.boolean(),
            start:z.string().regex(/^\d{2}:\d{2}$/).default("22:00"),
            end:z.string().regex(/^\d{2}:\d{2}$/).default("07:00")
          }).parse(input);
          store.setSetting("notifications.quietHours",value);
          return {ok:true,...value};
        }
      }
    ]
  };
}
