import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function run(command:string,args:string[],timeoutMs=30000){
  const result=await runProcess(command,args,{timeoutMs});
  if(result.code!==0) throw new Error(result.stderr || `${command} exited with ${result.code}`);
  return {stdout:result.stdout,stderr:result.stderr,code:result.code};
}

export const platformAdminPlugin:JarvisPlugin={
  id:"platform-admin",
  name:"Platform Administration",
  version:"0.1.0",
  description:"Windows and Linux platform-specific service, audio, Bluetooth and autostart helpers.",
  tools:[
    {
      name:"windows.cmd",
      description:"Run a Windows CMD command.",
      capability:"system.shell",
      async execute(input){
        if(process.platform!=="win32") throw new Error("Windows CMD is only available on Windows");
        const value=z.object({command:z.string().min(1),timeoutMs:z.number().int().min(1000).max(120000).default(30000)}).parse(input);
        return run("cmd.exe",["/d","/s","/c",value.command],value.timeoutMs);
      }
    },
    {
      name:"windows.services",
      description:"Query or control a Windows service.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="win32") throw new Error("Windows services are only available on Windows");
        const value=z.object({name:z.string().default(""),action:z.enum(["query","start","stop"]).default("query")}).parse(input??{});
        if(value.action==="query") return run("sc.exe",["query",value.name||"state=","all"]);
        return run("sc.exe",[value.action,value.name]);
      }
    },
    {
      name:"windows.task_scheduler",
      description:"List, run, enable or disable a Windows scheduled task.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="win32") throw new Error("Task Scheduler is only available on Windows");
        const value=z.object({task:z.string().default(""),action:z.enum(["list","run","enable","disable"]).default("list")}).parse(input??{});
        if(value.action==="list") return run("schtasks.exe",["/Query","/FO","CSV","/V"]);
        const flag={run:"/Run",enable:"/Change",disable:"/Change"}[value.action];
        const args=[flag,"/TN",value.task];
        if(value.action==="enable") args.push("/ENABLE");
        if(value.action==="disable") args.push("/DISABLE");
        return run("schtasks.exe",args);
      }
    },
    {
      name:"windows.bluetooth",
      description:"List Windows Bluetooth devices through PowerShell.",
      capability:"system.read",
      async execute(){
        if(process.platform!=="win32") throw new Error("Windows Bluetooth is only available on Windows");
        return run("powershell.exe",["-NoProfile","-Command","Get-PnpDevice -Class Bluetooth | Select-Object Status,FriendlyName,InstanceId | ConvertTo-Json -Depth 3"]);
      }
    },
    {
      name:"windows.autostart",
      description:"Create or remove a Jarvis Windows Startup command.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="win32") throw new Error("Windows autostart is only available on Windows");
        const value=z.object({enabled:z.boolean(),command:z.string().min(1)}).parse(input);
        const startup=path.join(process.env.APPDATA??"", "Microsoft","Windows","Start Menu","Programs","Startup","NekoSune Jarvis.cmd");
        if(value.enabled){
          await fs.mkdir(path.dirname(startup),{recursive:true});
          await fs.writeFile(startup,`@echo off\r\nstart "" ${value.command}\r\n`,"utf8");
        }else await fs.rm(startup,{force:true});
        return {ok:true,path:startup,enabled:value.enabled};
      }
    },
    {
      name:"linux.audio",
      description:"Set Linux default sink volume using PipeWire wpctl with PulseAudio pactl fallback.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="linux") throw new Error("Linux audio control is only available on Linux");
        const value=z.object({percent:z.number().min(0).max(150)}).parse(input);
        try{return await run("wpctl",["set-volume","@DEFAULT_AUDIO_SINK@",`${value.percent}%`]);}
        catch{return run("pactl",["set-sink-volume","@DEFAULT_SINK@",`${value.percent}%`]);}
      }
    },
    {
      name:"linux.systemd",
      description:"List, inspect, start, stop, restart, enable or disable a systemd service.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="linux") throw new Error("systemd is only available on Linux");
        const value=z.object({service:z.string().default(""),action:z.enum(["list","status","start","stop","restart","enable","disable"]).default("list")}).parse(input??{});
        if(value.action==="list") return run("systemctl",["list-units","--type=service","--all","--no-pager"]);
        return run("systemctl",[value.action,value.service,"--no-pager"]);
      }
    },
    {
      name:"linux.bluetooth",
      description:"List Linux Bluetooth controllers and paired devices.",
      capability:"system.read",
      async execute(){
        if(process.platform!=="linux") throw new Error("Linux Bluetooth is only available on Linux");
        const [controllers,devices]=await Promise.all([
          run("bluetoothctl",["list"]),
          run("bluetoothctl",["devices"])
        ]);
        return {controllers,devices};
      }
    },
    {
      name:"linux.autostart",
      description:"Create or remove a Linux XDG autostart desktop entry.",
      capability:"system.admin",
      async execute(input){
        if(process.platform!=="linux") throw new Error("Linux autostart is only available on Linux");
        const value=z.object({enabled:z.boolean(),command:z.string().min(1)}).parse(input);
        const file=path.join(os.homedir(),".config","autostart","nekosune-jarvis.desktop");
        if(value.enabled){
          await fs.mkdir(path.dirname(file),{recursive:true});
          await fs.writeFile(file,`[Desktop Entry]\nType=Application\nName=NekoSune Jarvis\nExec=${value.command}\nX-GNOME-Autostart-enabled=true\n`,"utf8");
        }else await fs.rm(file,{force:true});
        return {ok:true,path:file,enabled:value.enabled};
      }
    }
  ]
};
