import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createMemoryPlugin(store:AssistantStore):JarvisPlugin{
  return {
    id:"memory",
    name:"Memory",
    version:"0.1.0",
    description:"Persistent user-approved long-term memory.",
    tools:[
      {
        name:"memory.search",
        description:"Search Jarvis long-term memory.",
        capability:"memory.read",
        parameters:{
          type:"object",
          properties:{
            query:{type:"string"},
            category:{type:"string"},
            limit:{type:"integer",minimum:1,maximum:50}
          },
          required:["query"],
          additionalProperties:false
        },
        async execute(input){
          if(store.getSetting<boolean>("memoryEnabled",true)===false){
            throw new Error("Memory is disabled in settings");
          }
          const value=z.object({
            query:z.string(),
            category:z.string().optional(),
            limit:z.number().int().min(1).max(50).default(20)
          }).parse(input);
          return store.searchMemories(value.query,value.category,value.limit);
        }
      },
      {
        name:"memory.remember",
        description:"Store or update a non-sensitive long-term memory when the user explicitly asks Jarvis to remember it.",
        capability:"memory.write",
        parameters:{
          type:"object",
          properties:{
            category:{type:"string"},
            key:{type:"string"},
            value:{type:"string"}
          },
          required:["category","key","value"],
          additionalProperties:false
        },
        async execute(input){
          if(store.getSetting<boolean>("memoryEnabled",true)===false){
            throw new Error("Memory is disabled in settings");
          }
          const value=z.object({
            category:z.string().min(1).default("general"),
            key:z.string().min(1),
            value:z.string().min(1)
          }).parse(input);
          return store.remember(value.category,value.key,value.value);
        }
      }
    ]
  };
}
