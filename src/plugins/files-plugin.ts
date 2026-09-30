import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import type { JarvisPlugin } from "./plugin-registry.js";

function safePath(relative:string){
  const root=path.resolve(config.filesRoot);
  const target=path.resolve(root,relative);
  if(target!==root && !target.startsWith(root+path.sep)) throw new Error("Path escapes JARVIS_FILES_ROOT");
  return target;
}

export const filesPlugin:JarvisPlugin={
  id:"files",
  name:"Files",
  version:"0.1.0",
  description:"Sandboxed text and JSON file access under JARVIS_FILES_ROOT.",
  tools:[
    {
      name:"files.list",
      description:"List a folder under the Jarvis workspace.",
      capability:"files.read",
      async execute(input){
        const value=z.object({path:z.string().default(".")}).parse(input ?? {});
        const dir=safePath(value.path);
        const entries=await fs.readdir(dir,{withFileTypes:true});
        return entries.map((entry)=>({name:entry.name,type:entry.isDirectory()?"directory":"file"}));
      }
    },
    {
      name:"files.read_text",
      description:"Read a UTF-8 text file from the Jarvis workspace.",
      capability:"files.read",
      async execute(input){
        const value=z.object({path:z.string().min(1)}).parse(input);
        return {path:value.path,content:await fs.readFile(safePath(value.path),"utf8")};
      }
    },
    {
      name:"files.write_text",
      description:"Write a UTF-8 text file in the Jarvis workspace.",
      capability:"files.write",
      async execute(input){
        const value=z.object({path:z.string().min(1),content:z.string()}).parse(input);
        const target=safePath(value.path);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await fs.writeFile(target,value.content,"utf8");
        return {ok:true,path:value.path};
      }
    }
  ]
};
