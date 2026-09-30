import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import clipboard from "clipboardy";
import screenshot from "screenshot-desktop";
import { z } from "zod";
import { config } from "../config.js";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

function detached(command:string,args:string[]=[]){
  const child=spawn(command,args,{detached:true,stdio:"ignore",shell:false,windowsHide:true});
  child.unref();
}

function openUrl(url:string){
  if(process.platform==="win32") detached("rundll32.exe",["url.dll,FileProtocolHandler",url]);
  else if(process.platform==="darwin") detached("open",[url]);
  else detached("xdg-open",[url]);
}

async function processList(){
  if(process.platform==="win32") return runProcess("tasklist",["/FO","CSV","/NH"],{timeoutMs:10000});
  return runProcess("ps",["-eo","pid,ppid,comm,%cpu,%mem"],{timeoutMs:10000});
}

export const computerPlugin:JarvisPlugin={
  id:"computer",
  name:"Computer",
  version:"0.1.0",
  description:"Cross-platform desktop utility tools.",
  tools:[
    {
      name:"computer.open_url",
      description:"Open a URL in the default browser.",
      capability:"computer.open_app",
      async execute(input){
        const value=z.object({url:z.string().url()}).parse(input);
        openUrl(value.url);
        return {ok:true};
      }
    },
    {
      name:"computer.open_app",
      description:"Launch a program using an executable and argument array.",
      capability:"computer.open_app",
      async execute(input){
        const value=z.object({command:z.string().min(1),args:z.array(z.string()).default([])}).parse(input);
        detached(value.command,value.args);
        return {ok:true};
      }
    },
    {
      name:"system.processes",
      description:"List running processes.",
      capability:"system.read",
      async execute(){
        const result=await processList();
        if(result.code!==0) throw new Error(result.stderr);
        return {raw:result.stdout};
      }
    },
    {
      name:"computer.clipboard.read",
      description:"Read clipboard text.",
      capability:"computer.clipboard",
      async execute(){return {text:await clipboard.read()};}
    },
    {
      name:"computer.clipboard.write",
      description:"Write clipboard text.",
      capability:"computer.clipboard",
      async execute(input){
        const value=z.object({text:z.string()}).parse(input);
        await clipboard.write(value.text);
        return {ok:true};
      }
    },
    {
      name:"computer.screenshot",
      description:"Capture the desktop to a PNG file.",
      capability:"computer.screenshot",
      async execute(input){
        const value=z.object({filename:z.string().default("screenshot.png")}).parse(input ?? {});
        const output=path.resolve(config.dataDir,"screenshots",path.basename(value.filename));
        await fs.mkdir(path.dirname(output),{recursive:true});
        const image=await screenshot({format:"png"});
        await fs.writeFile(output,image);
        return {path:output};
      }
    }
  ]
};
