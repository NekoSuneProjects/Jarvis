import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
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
      name:"files.delete",
      description:"Delete a file or directory inside the Jarvis workspace. Requires file-write permission.",
      capability:"files.write",
      async execute(input){
        const value=z.object({path:z.string().min(1),recursive:z.boolean().default(false)}).parse(input);
        await fs.rm(workspacePath(value.path),{recursive:value.recursive,force:false});
        return {ok:true,path:value.path};
      }
    }
  ]
};
