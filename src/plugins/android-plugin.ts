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
    .replace(/[&|<>;()$]/g,(ch)=>"\\"+ch);
}

export const androidPlugin:JarvisPlugin={
  id:"android",
  name:"Android ADB",
  version:"0.1.0",
  description:"ADB-based Android device inspection and control.",
  tools:[
    {
      name:"android.devices",
      description:"List ADB-connected Android/Android TV devices.",
      capability:"android.read",
      async execute(){
        return parseDevices(await adb(undefined,["devices","-l"]));
      }
    },
    {
      name:"android.pair",
      description:"Pair to an Android or Android TV device using wireless ADB pairing.",
      capability:"android.control",
      async execute(input){
        const value=z.object({host:z.string().min(1),code:z.string().min(1)}).parse(input);
        const result=await runProcess(config.adbBin,["pair",value.host,value.code],{timeoutMs:30000});
        if(result.code!==0) throw new Error(result.stderr.trim() || "adb pair failed");
        return {ok:true,output:result.stdout.trim()};
      }
    },
    {
      name:"android.connect",
      description:"Connect to a paired Android or Android TV device over ADB.",
      capability:"android.control",
      async execute(input){
        const value=z.object({host:z.string().min(1)}).parse(input);
        const result=await runProcess(config.adbBin,["connect",value.host],{timeoutMs:30000});
        if(result.code!==0) throw new Error(result.stderr.trim() || "adb connect failed");
        return {ok:true,output:result.stdout.trim()};
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
      name:"android.battery",
      description:"Read Android battery/charging state.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional()}).parse(input??{});
        return {raw:await adb(value.serial,["shell","dumpsys","battery"])};
      }
    },
    {
      name:"android.network",
      description:"Read Android network interfaces and connectivity state.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional()}).parse(input??{});
        const [ip,connectivity]=await Promise.all([
          adb(value.serial,["shell","ip","addr"]),
          adb(value.serial,["shell","dumpsys","connectivity"])
        ]);
        return {ip,connectivity};
      }
    },
    {
      name:"android.notification.post",
      description:"Post a local notification to a connected Android device using cmd notification.",
      capability:"android.control",
      async execute(input){
        const value=z.object({
          serial:z.string().optional(),
          tag:z.string().default("jarvis"),
          title:z.string().min(1),
          text:z.string().default("")
        }).parse(input);
        await adb(value.serial,["shell","cmd","notification","post","-t",value.title,value.tag,value.text]);
        return {ok:true,tag:value.tag};
      }
    },
    {
      name:"android.notifications",
      description:"Read Android notification manager state where ADB permissions allow it.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional()}).parse(input??{});
        return {raw:await adb(value.serial,["shell","dumpsys","notification","--noredact"])};
      }
    },
    {
      name:"android.bluetooth",
      description:"Read Android Bluetooth manager state.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().optional()}).parse(input??{});
        return {raw:await adb(value.serial,["shell","dumpsys","bluetooth_manager"])};
      }
    },
    {
      name:"android.permission.microphone",
      description:"Grant or revoke RECORD_AUDIO for an installed Android package.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),package:z.string().min(1),grant:z.boolean().default(true)}).parse(input);
        await adb(value.serial,["shell","pm",value.grant?"grant":"revoke",value.package,"android.permission.RECORD_AUDIO"]);
        return {ok:true};
      }
    },
    {
      name:"android.permission.notifications",
      description:"Grant or revoke POST_NOTIFICATIONS for an Android package.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),package:z.string().min(1),grant:z.boolean().default(true)}).parse(input);
        await adb(value.serial,["shell","pm",value.grant?"grant":"revoke",value.package,"android.permission.POST_NOTIFICATIONS"]);
        return {ok:true};
      }
    },
    {
      name:"android.media",
      description:"Send Android media remote key events.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),action:z.enum(["play_pause","play","pause","next","previous","stop","volume_up","volume_down"])}).parse(input);
        const key={play_pause:"KEYCODE_MEDIA_PLAY_PAUSE",play:"KEYCODE_MEDIA_PLAY",pause:"KEYCODE_MEDIA_PAUSE",next:"KEYCODE_MEDIA_NEXT",previous:"KEYCODE_MEDIA_PREVIOUS",stop:"KEYCODE_MEDIA_STOP",volume_up:"KEYCODE_VOLUME_UP",volume_down:"KEYCODE_VOLUME_DOWN"}[value.action];
        await adb(value.serial,["shell","input","keyevent",key]);
        return {ok:true,action:value.action};
      }
    },
    {
      name:"android.alarm.set",
      description:"Create an Android local alarm using the standard SET_ALARM intent.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),hour:z.number().int().min(0).max(23),minute:z.number().int().min(0).max(59),message:z.string().default("Jarvis alarm")}).parse(input);
        await adb(value.serial,["shell","am","start","-a","android.intent.action.SET_ALARM","--ei","android.intent.extra.alarm.HOUR",String(value.hour),"--ei","android.intent.extra.alarm.MINUTES",String(value.minute),"--es","android.intent.extra.alarm.MESSAGE",value.message]);
        return {ok:true};
      }
    },
    {
      name:"android.timer.set",
      description:"Create an Android local timer using the standard SET_TIMER intent.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),seconds:z.number().int().positive(),message:z.string().default("Jarvis timer")}).parse(input);
        await adb(value.serial,["shell","am","start","-a","android.intent.action.SET_TIMER","--ei","android.intent.extra.alarm.LENGTH",String(value.seconds),"--es","android.intent.extra.alarm.MESSAGE",value.message]);
        return {ok:true};
      }
    },
    {
      name:"android.deeplink",
      description:"Open an Android deep link/URL.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),url:z.string().min(1)}).parse(input);
        await adb(value.serial,["shell","am","start","-a","android.intent.action.VIEW","-d",value.url]);
        return {ok:true,url:value.url};
      }
    },
    {
      name:"android.service.start",
      description:"Start an Android service or foreground service component.",
      capability:"android.control",
      async execute(input){
        const value=z.object({serial:z.string().optional(),component:z.string().min(1),foreground:z.boolean().default(true)}).parse(input);
        await adb(value.serial,["shell","am",value.foreground?"start-foreground-service":"startservice","-n",value.component]);
        return {ok:true,foreground:value.foreground};
      }
    },
    {
      name:"android.presence",
      description:"Check whether a selected Android device is currently connected through ADB.",
      capability:"android.read",
      async execute(input){
        const value=z.object({serial:z.string().min(1)}).parse(input);
        const devices=parseDevices(await adb(undefined,["devices","-l"]));
        const device=devices.find((item)=>item.serial===value.serial);
        return {present:Boolean(device&&device.state==="device"),device:device??null};
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
