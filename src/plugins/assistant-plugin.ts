import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createAssistantPlugin(store:AssistantStore):JarvisPlugin {
  return {
    id:"assistant",
    name:"Assistant",
    version:"0.1.0",
    description:"Local timers, alarms, reminders, notes and lists.",
    tools:[
      {
        name:"assistant.timer.create",
        description:"Create a named countdown timer.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({name:z.string().default("Timer"),durationMs:z.number().positive()}).parse(input);
          return store.createTimer(value.name,value.durationMs);
        }
      },
      {
        name:"assistant.alarm.create",
        description:"Create an alarm using an ISO-8601 fire time.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({name:z.string().default("Alarm"),fireAt:z.string().datetime(),repeatRule:z.string().optional()}).parse(input);
          return store.createAlarm(value.name,value.fireAt,value.repeatRule);
        }
      },
      {
        name:"assistant.reminder.create",
        description:"Create a reminder using an ISO-8601 fire time.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({text:z.string().min(1),fireAt:z.string().datetime(),repeatRule:z.string().optional()}).parse(input);
          return store.createReminder(value.text,value.fireAt,value.repeatRule);
        }
      },
      {
        name:"assistant.note.create",
        description:"Create a local note.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({title:z.string().min(1),body:z.string().default(""),tags:z.array(z.string()).default([])}).parse(input);
          return store.createNote(value.title,value.body,value.tags);
        }
      },
      {
        name:"assistant.list.add",
        description:"Add an item to a named list.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({list:z.string().min(1),text:z.string().min(1)}).parse(input);
          return store.addListItem(value.list,value.text);
        }
      }
    ]
  };
}
