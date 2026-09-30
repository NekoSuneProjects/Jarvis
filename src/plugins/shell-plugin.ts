import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function shell(command:string,cwd?:string,timeoutMs=30000){
  if(process.platform==="win32"){
    return runProcess("powershell.exe",["-NoProfile","-Command",command],{cwd,timeoutMs});
  }
  return runProcess("/bin/sh",["-lc",command],{cwd,timeoutMs});
}

export const shellPlugin:JarvisPlugin={
  id:"shell",
  name:"Local Shell",
  version:"0.1.0",
  description:"Explicitly approved local command execution and process termination.",
  tools:[
    {
      name:"system.shell.exec",
      description:"Execute a local shell command. Requires explicit shell approval.",
      capability:"system.shell",
      parameters:{
        type:"object",
        properties:{
          command:{type:"string"},
          cwd:{type:"string"},
          timeoutMs:{type:"integer",minimum:1000,maximum:120000}
        },
        required:["command"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          command:z.string().min(1).max(20000),
          cwd:z.string().optional(),
          timeoutMs:z.number().int().min(1000).max(120000).default(30000)
        }).parse(input);
        const result=await shell(value.command,value.cwd,value.timeoutMs);
        return {
          code:result.code,
          stdout:result.stdout,
          stderr:result.stderr
        };
      }
    },
    {
      name:"system.process.kill",
      description:"Terminate a local process by PID. Requires explicit shell approval.",
      capability:"system.shell",
      parameters:{
        type:"object",
        properties:{
          pid:{type:"integer",minimum:1},
          force:{type:"boolean"}
        },
        required:["pid"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          pid:z.number().int().positive(),
          force:z.boolean().default(false)
        }).parse(input);

        if(process.platform==="win32"){
          const args=["/PID",String(value.pid),"/T"];
          if(value.force) args.push("/F");
          const result=await runProcess("taskkill",args,{timeoutMs:10000});
          if(result.code!==0) throw new Error(result.stderr || "Unable to terminate process");
          return {ok:true,pid:value.pid,output:result.stdout};
        }

        const signal=value.force?"SIGKILL":"SIGTERM";
        process.kill(value.pid,signal);
        return {ok:true,pid:value.pid,signal};
      }
    }
  ]
};
