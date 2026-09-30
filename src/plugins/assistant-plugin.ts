import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createAssistantPlugin(store:AssistantStore):JarvisPlugin {
  return {
    id:"assistant",
    name:"Assistant",
    version:"0.2.0",
    description:"Local timers, alarms, reminders, notes and lists.",
    tools:[
      {
        name:"assistant.timer.create",
        description:"Create a named countdown timer.",
        capability:"assistant.local",
        parameters:{
          type:"object",
          properties:{name:{type:"string"},durationMs:{type:"number",exclusiveMinimum:0}},
          required:["durationMs"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({name:z.string().default("Timer"),durationMs:z.number().positive()}).parse(input);
          return store.createTimer(value.name,value.durationMs);
        }
      },
      {
        name:"assistant.timer.list",
        description:"List active/paused timers.",
        capability:"assistant.local",
        async execute(){return store.listTimers();}
      },
      {
        name:"assistant.timer.pause",
        description:"Pause a running timer by ID.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.pauseTimer(value.id)};
        }
      },
      {
        name:"assistant.timer.resume",
        description:"Resume a paused timer by ID.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.resumeTimer(value.id)};
        }
      },
      {
        name:"assistant.timer.add_time",
        description:"Add or subtract milliseconds from a timer.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive(),deltaMs:z.number().int()}).parse(input);
          return {ok:store.addTimerTime(value.id,value.deltaMs)};
        }
      },
      {
        name:"assistant.timer.cancel",
        description:"Cancel a running or paused timer.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.cancelTimer(value.id)};
        }
      },
      {
        name:"assistant.alarm.create",
        description:"Create an alarm using an ISO-8601 fire time and optional RRULE such as FREQ=DAILY.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({name:z.string().default("Alarm"),fireAt:z.string().datetime(),repeatRule:z.string().optional()}).parse(input);
          return store.createAlarm(value.name,value.fireAt,value.repeatRule);
        }
      },
      {
        name:"assistant.alarm.list",
        description:"List enabled alarms.",
        capability:"assistant.local",
        async execute(){return store.listAlarms();}
      },
      {
        name:"assistant.alarm.cancel",
        description:"Delete an alarm by ID.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.deleteAlarm(value.id)};
        }
      },
      {
        name:"assistant.reminder.create",
        description:"Create a reminder using an ISO-8601 fire time and optional RRULE.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({text:z.string().min(1),fireAt:z.string().datetime(),repeatRule:z.string().optional()}).parse(input);
          return store.createReminder(value.text,value.fireAt,value.repeatRule);
        }
      },
      {
        name:"assistant.reminder.list",
        description:"List incomplete reminders.",
        capability:"assistant.local",
        async execute(){return store.listReminders();}
      },
      {
        name:"assistant.reminder.snooze",
        description:"Snooze a reminder by a duration in milliseconds.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive(),durationMs:z.number().int().positive()}).parse(input);
          return {ok:store.snoozeReminder(value.id,value.durationMs)};
        }
      },
      {
        name:"assistant.reminder.complete",
        description:"Mark a reminder complete.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.completeReminder(value.id)};
        }
      },
      {
        name:"assistant.reminder.delete",
        description:"Delete a reminder.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.deleteReminder(value.id)};
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
