import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import { runProcess } from "../utils/process.js";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function adb(serial:string|undefined,args:string[],timeoutMs=30000){
  const full=serial?["-s",serial,...args]:args;
  const result=await runProcess(config.adbBin,full,{timeoutMs});
  if(result.code!==0) throw new Error(result.stderr.trim() || `adb exited with ${result.code}`);
  return result.stdout;
}

function parseDevices(output:string){
  return output.split(/\r?\n/).slice(1).filter(Boolean).map((line)=>{
    const [serial,state,...rest]=line.trim().split(/\s+/);
    const attributes:Record<string,string>={};
    for(const token of rest){
      const i=token.indexOf(":");
      if(i>0) attributes[token.slice(0,i)]=token.slice(i+1);
    }
    return {serial,state,...attributes};
  });
}

function safeInputText(text:string){
  return text
    .replace(/%/g,"%25")
    .replace(/ /g,"%s")
    .replace(/[&|<>;()$]/g,(ch)=>"\\\"+ch);
}

export const androidPlugin:JarvisPlugin={
  id:"android",
  name:"Android ADB",
  version:"0.1.0",
  description:"ADB-based Android device inspection and control.",
  tools:[
    {
      name:"android.devices",
      description:"List ADB-connected Android devices.",
      capability:"android.read",
      async execute(){
        return parseDevices(await adb(undefined,["devices","-l"]));
      }
    },
    {
      name:"android.packages",
      description:"List installed Android package names.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional(),filter:z.string().optional()}).parse(input??{});
        const out=await adb(value.serial,["shell","pm","list","packages"]);
        let packages=out.split(/\r?\n/).filter(Boolean).map((line)=>line.replace(/^package:/,""));
        if(value.filter){
          const q=value.filter.toLowerCase();
          packages=packages.filter((pkg)=>pkg.toLowerCase().includes(q));
        }
        return packages;
      }
    },
    {
      name:"android.current_app",
      description:"Read the current focused Android app/window.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional()}).parse(input??{});
        const out=await adb(value.serial,["shell","dumpsys","window","windows"]);
        const line=out.split(/\r?\n/).find((item)=>
          item.includes("mCurrentFocus") || item.includes("mFocusedApp")
        );
        return {raw:line?.trim() ?? ""};
      }
    },
    {
      name:"android.launch",
      description:"Launch an Android app package using its launcher intent.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),package:z.string().min(1)}).parse(input);
        const out=await adb(value.serial,[
          "shell","monkey","-p",value.package,
          "-c","android.intent.category.LAUNCHER","1"
        ]);
        return {ok:true,output:out};
      }
    },
    {
      name:"android.tap",
      description:"Tap Android screen coordinates.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),x:z.number().int(),y:z.number().int()}).parse(input);
        await adb(value.serial,["shell","input","tap",String(value.x),String(value.y)]);
        return {ok:true};
      }
    },
    {
      name:"android.swipe",
      description:"Swipe between Android screen coordinates.",
      capability:"android.control",
      async execute(input){
        const value=z.object({
          serial:z.string().optional(),
          x1:z.number().int(),y1:z.number().int(),
          x2:z.number().int(),y2:z.number().int(),
          durationMs:z.number().int().min(1).max(10000).default(300)
        }).parse(input);
        await adb(value.serial,[
          "shell","input","swipe",
          String(value.x1),String(value.y1),
          String(value.x2),String(value.y2),
          String(value.durationMs)
        ]);
        return {ok:true};
      }
    },
    {
      name:"android.text",
      description:"Type text into the focused Android control.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),text:z.string().max(5000)}).parse(input);
        await adb(value.serial,["shell","input","text",safeInputText(value.text)]);
        return {ok:true};
      }
    },
    {
      name:"android.keyevent",
      description:"Send an Android keyevent name or numeric code.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),key:z.union([z.string(),z.number().int()])}).parse(input);
        await adb(value.serial,["shell","input","keyevent",String(value.key)]);
        return {ok:true};
      }
    },
    {
      name:"android.screenshot",
      description:"Capture an Android screenshot into the Jarvis workspace.",
      capability:"android.read",
      async execute(input){
        const value=z.object({
          serial:z.string().optional(),
          path:z.string().default("android/screenshot.png")
        }).parse(input??{});
        const remote="/sdcard/Download/jarvis-screenshot.png";
        const target=workspacePath(value.path);
        await fs.mkdir(path.dirname(target),{recursive:true});
        await adb(value.serial,["shell","screencap","-p",remote]);
        await adb(value.serial,["pull",remote,target],60000);
        await adb(value.serial,["shell","rm","-f",remote]).catch(()=>{});
        return {ok:true,path:value.path};
      }
    },
    {
      name:"android.install",
      description:"Install or replace an APK from the Jarvis workspace.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),path:z.string().min(1)}).parse(input);
        const apk=workspacePath(value.path);
        const out=await adb(value.serial,["install","-r",apk],120000);
        return {ok:true,output:out};
      }
    }
  ]
};
