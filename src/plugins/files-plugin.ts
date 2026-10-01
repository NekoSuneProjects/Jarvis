import fs from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import { z } from "zod";
import JSZip from "jszip";
import { config } from "../config.js";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function walk(dir:string,root:string,query:string,results:Array<{path:string;type:string}>,limit:number,depth=0){
  if(depth>12 || results.length>=limit) return;
  const entries=await fs.readdir(dir,{withFileTypes:true});
  for(const entry of entries){
    if(results.length>=limit) break;
    const target=path.join(dir,entry.name);
    const relative=path.relative(root,target);
    if(entry.name.toLowerCase().includes(query.toLowerCase())){
      results.push({path:relative,type:entry.isDirectory()?"directory":"file"});
    }
    if(entry.isDirectory()) await walk(target,root,query,results,limit,depth+1);
  }
}

const watchers=new Map<string,{watcher:FSWatcher;events:Array<{at:string;event:string;filename:string|null}>}>();

export const filesPlugin:JarvisPlugin={
  id:"files",
  name:"Files",
  version:"0.2.0",
  description:"Sandboxed file management under JARVIS_FILES_ROOT.",
  tools:[
    {
      name:"files.list",
      description:"List a folder under the Jarvis workspace.",
      capability:"files.read",
      async execute(input){
        const value=z.object({path:z.string().default(".")}).parse(input ?? {});
        const dir=workspacePath(value.path);
        const entries=await fs.readdir(dir,{withFileTypes:true});
        return entries.map((entry)=>({name:entry.name,type:entry.isDirectory()?"directory":"file"}));
      }
    },
    {
      name:"files.search",
      description:"Recursively search the Jarvis workspace by file or directory name.",
      capability:"files.read",
      async execute(input){
        const value=z.object({
          query:z.string().min(1),
          path:z.string().default("."),
          limit:z.number().int().min(1).max(1000).default(100)
        }).parse(input);
        const root=workspacePath(value.path);
        const results:Array<{path:string;type:string}>=[];
        await walk(root,root,value.query,results,value.limit);
        return results;
      }
    },
    {
      name:"files.read_text",
      description:"Read a UTF-8 text file from the Jarvis workspace.",
      capability:"files.read",
      async execute(input){
        const value=z.object({path:z.string().min(1)}).parse(input);
        return {path:value.path,content:await fs.readFile(workspacePath(value.path),"utf8")};
      }
    },
    {
      name:"files.write_text",
      description:"Write a UTF-8 text file in the Jarvis workspace.",
      capability:"files.write",
      async execute(input){
        const value=z.object({path:z.string().min(1),content:z.string()}).parse(input);
        const target=workspacePath(value.path);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await fs.writeFile(target,value.content,"utf8");
        return {ok:true,path:value.path};
      }
    },
    {
      name:"files.mkdir",
      description:"Create a directory in the Jarvis workspace.",
      capability:"files.write",
      async execute(input){
        const value=z.object({path:z.string().min(1)}).parse(input);
        await fs.mkdir(workspacePath(value.path),{recursive:true});
        return {ok:true,path:value.path};
      }
    },
    {
      name:"files.copy",
      description:"Copy a file inside the Jarvis workspace.",
      capability:"files.write",
      async execute(input){
        const value=z.object({from:z.string().min(1),to:z.string().min(1)}).parse(input);
        const source=workspacePath(value.from);
        const target=workspacePath(value.to);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await fs.copyFile(source,target);
        return {ok:true,from:value.from,to:value.to};
      }
    },
    {
      name:"files.move",
      description:"Move or rename a file/folder inside the Jarvis workspace.",
      capability:"files.write",
      async execute(input){
        const value=z.object({from:z.string().min(1),to:z.string().min(1)}).parse(input);
        const source=workspacePath(value.from);
        const target=workspacePath(value.to);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await fs.rename(source,target);
        return {ok:true,from:value.from,to:value.to};
      }
    },
    {
      name:"files.zip",
      description:"Create a ZIP archive from workspace files or folders.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          paths:z.array(z.string().min(1)).min(1),
          output:z.string().min(1)
        }).parse(input);
        const zip=new JSZip();
        const add=async(relative:string,prefix="")=>{
          const absolute=workspacePath(relative);
          const stat=await fs.stat(absolute);
          if(stat.isDirectory()){
            for(const entry of await fs.readdir(absolute,{withFileTypes:true})){
              await add(path.join(relative,entry.name),path.join(prefix,path.basename(relative)));
            }
          }else{
            const archivePath=path.join(prefix,path.basename(relative)).replace(/\\/g,"/");
            zip.file(archivePath,await fs.readFile(absolute));
          }
        };
        for(const item of value.paths) await add(item);
        const target=workspacePath(value.output);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await fs.writeFile(target,await zip.generateAsync({type:"nodebuffer"}));
        return {ok:true,path:value.output};
      }
    },
    {
      name:"files.watch.start",
      description:"Start watching a workspace file or directory for changes.",
      capability:"files.read",
      async execute(input){
        const value=z.object({id:z.string().min(1),path:z.string().default("."),recursive:z.boolean().default(false)}).parse(input);
        if(watchers.has(value.id)) throw new Error("Watcher ID already exists");
        const events:Array<{at:string;event:string;filename:string|null}>=[];
        const watcher=watch(workspacePath(value.path),{recursive:value.recursive},(event,filename)=>{
          events.push({at:new Date().toISOString(),event,filename:filename?.toString() ?? null});
          if(events.length>500) events.splice(0,events.length-500);
        });
        watchers.set(value.id,{watcher,events});
        return {ok:true,id:value.id,path:value.path};
      }
    },
    {
      name:"files.watch.events",
      description:"Read queued events from a workspace file watcher.",
      capability:"files.read",
      async execute(input){
        const value=z.object({id:z.string().min(1),clear:z.boolean().default(true)}).parse(input);
        const current=watchers.get(value.id);
        if(!current) throw new Error("Watcher not found");
        const events=[...current.events];
        if(value.clear) current.events.length=0;
        return {id:value.id,events};
      }
    },
    {
      name:"files.watch.stop",
      description:"Stop a workspace file watcher.",
      capability:"files.read",
      async execute(input){
        const value=z.object({id:z.string().min(1)}).parse(input);
        const current=watchers.get(value.id);
        if(!current) return {ok:false};
        current.watcher.close();
        watchers.delete(value.id);
        return {ok:true};
      }
    },
    {
      name:"files.delete",
      description:"Delete a file or directory inside the Jarvis workspace. Requires explicit confirmation.",
      capability:"files.delete",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          recursive:z.boolean().default(false),
          confirm:z.literal(true)
        }).parse(input);
        await fs.rm(workspacePath(value.path),{recursive:value.recursive,force:false});
        return {ok:true,path:value.path};
      }
    }
  ]
};
