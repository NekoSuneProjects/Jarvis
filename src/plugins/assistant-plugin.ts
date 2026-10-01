import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import { workspacePath } from "../utils/workspace-path.js";
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
        name:"assistant.alarm.snooze",
        description:"Snooze an alarm by a duration in milliseconds.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive(),durationMs:z.number().int().positive()}).parse(input);
          return {ok:store.updateAlarmFireAt(value.id,new Date(Date.now()+value.durationMs).toISOString())};
        }
      },
      {
        name:"assistant.alarm.dismiss",
        description:"Dismiss/delete an alarm by ID.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.deleteAlarm(value.id)};
        }
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
        name:"assistant.note.update",
        description:"Edit a note title, body, tags or pinned state.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({
            id:z.number().int().positive(),
            title:z.string().min(1).optional(),
            body:z.string().optional(),
            tags:z.array(z.string()).optional(),
            pinned:z.boolean().optional()
          }).parse(input);
          return store.updateNote(value.id,value);
        }
      },
      {
        name:"assistant.note.search",
        description:"Search notes by title, body or tags.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(500).default(100)}).parse(input);
          return store.searchNotes(value.query,value.limit);
        }
      },
      {
        name:"assistant.note.export_markdown",
        description:"Export a note as Markdown in the Jarvis workspace.",
        capability:"files.write",
        async execute(input){
          const value=z.object({id:z.number().int().positive(),path:z.string().min(1)}).parse(input);
          const note=store.getNote(value.id) as {title:string;body:string;tags:string}|undefined;
          if(!note) throw new Error("Note not found");
          const target=workspacePath(value.path);
          await fs.mkdir(path.dirname(target),{recursive:true});
          let tags:string[]=[];
          try{tags=JSON.parse(note.tags) as string[];}catch{}
          const markdown=[
            `# ${note.title}`,
            tags.length?`\nTags: ${tags.map((tag)=>`#${tag}`).join(" ")}\n`:"",
            note.body
          ].join("\n");
          await fs.writeFile(target,markdown,"utf8");
          return {ok:true,path:value.path,format:"markdown"};
        }
      },
      {
        name:"assistant.note.create_markdown",
        description:"Create a note whose body is Markdown.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({title:z.string().min(1),markdown:z.string(),tags:z.array(z.string()).default([])}).parse(input);
          return store.createNote(value.title,value.markdown,value.tags);
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
      },
      {
        name:"assistant.list.remove",
        description:"Remove a list item by ID.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({id:z.number().int().positive()}).parse(input);
          return {ok:store.removeListItem(value.id)};
        }
      },
      {
        name:"assistant.list.share",
        description:"Render a named list as shareable plain text.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({list:z.string().min(1)}).parse(input);
          const list=store.getList(value.list) as any;
          const text=[`# ${value.list}`,...(list.items ?? []).map((item:any)=>`${item.checked?"[x]":"[ ]"} ${item.text}`)].join("\n");
          return {name:value.list,text,items:list.items ?? []};
        }
      },
      {
        name:"assistant.list.read_aloud",
        description:"Prepare a named list as a speech-friendly sentence payload.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({list:z.string().min(1),includeChecked:z.boolean().default(false)}).parse(input);
          const list=store.getList(value.list) as any;
          const items=(list.items ?? []).filter((item:any)=>value.includeChecked || !item.checked);
          const text=items.length
            ? `${value.list}: ${items.map((item:any)=>item.text).join(", ")}`
            : `${value.list} is empty.`;
          return {text,items};
        }
      }
    ]
  };
}
