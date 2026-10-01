import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { DeviceRegistry } from "../devices/device-registry.js";
import type { JarvisPlugin } from "./plugin-registry.js";

type Group={name:string;deviceIds:string[]};

export function createMultiRoomPlugin(store:AssistantStore,devices:DeviceRegistry):JarvisPlugin{
  const groups=()=>store.getSetting<Record<string,Group>>("audio.groups",{}) ?? {};
  const speakerDevices=()=> (devices.list() as any[]).filter((device)=>
    !device.revoked && (
      device.capabilities?.includes("audio.play") ||
      device.capabilities?.includes("tts.speak") ||
      device.metadata?.speaker===true
    )
  );

  const resolveTargets=(input:{deviceIds?:string[];group?:string;room?:string;all?:boolean})=>{
    const available=speakerDevices();
    if(input.all) return available.map((d)=>d.id);
    if(input.deviceIds?.length) return input.deviceIds;
    if(input.group){
      const group=groups()[input.group];
      if(!group) throw new Error(`Unknown speaker group: ${input.group}`);
      return group.deviceIds;
    }
    if(input.room) return available.filter((d)=>d.metadata?.room===input.room).map((d)=>d.id);
    return [];
  };

  const send=(ids:string[],command:string,args:Record<string,unknown>)=>
    ids.map((deviceId)=>devices.enqueueCommand(deviceId,command,args));

  return {
    id:"multi-room",
    name:"Multi-room Audio & Announcements",
    version:"0.1.0",
    description:"Coordinate audio, volume and spoken announcements across paired Jarvis agents.",
    tools:[
      {
        name:"audio.speakers",
        description:"Discover paired Jarvis speaker-capable devices with room metadata.",
        capability:"devices.read",
        async execute(){return speakerDevices();}
      },
      {
        name:"audio.groups",
        description:"List saved speaker groups.",
        capability:"devices.read",
        async execute(){return groups();}
      },
      {
        name:"audio.group.set",
        description:"Create or replace a speaker group.",
        capability:"devices.manage",
        async execute(input){
          const value=z.object({name:z.string().min(1),deviceIds:z.array(z.string()).min(1)}).parse(input);
          const all=groups();
          all[value.name]={name:value.name,deviceIds:value.deviceIds};
          store.setSetting("audio.groups",all);
          return {ok:true,group:all[value.name]};
        }
      },
      {
        name:"audio.play",
        description:"Play an audio/media URL in one room, group, selected devices or everywhere.",
        capability:"media.control",
        async execute(input){
          const value=z.object({
            url:z.string().min(1),
            deviceIds:z.array(z.string()).optional(),
            group:z.string().optional(),
            room:z.string().optional(),
            all:z.boolean().default(false)
          }).parse(input);
          const ids=resolveTargets(value);
          if(!ids.length) throw new Error("No speaker targets selected");
          return {commands:send(ids,"audio.play",{url:value.url}),targets:ids};
        }
      },
      {
        name:"audio.volume",
        description:"Set volume for one room, group, selected devices or all speakers.",
        capability:"media.control",
        async execute(input){
          const value=z.object({
            percent:z.number().min(0).max(100),
            deviceIds:z.array(z.string()).optional(),
            group:z.string().optional(),
            room:z.string().optional(),
            all:z.boolean().default(false)
          }).parse(input);
          const ids=resolveTargets(value);
          if(!ids.length) throw new Error("No speaker targets selected");
          return {commands:send(ids,"audio.volume",{percent:value.percent}),targets:ids};
        }
      },
      {
        name:"audio.spotify_handoff",
        description:"Open a Spotify URI or URL on selected Jarvis speakers/devices.",
        capability:"media.control",
        async execute(input){
          const value=z.object({
            uri:z.string().min(1),
            deviceIds:z.array(z.string()).optional(),
            group:z.string().optional(),
            room:z.string().optional(),
            all:z.boolean().default(false)
          }).parse(input);
          const ids=resolveTargets(value);
          return {commands:send(ids,"audio.play",{url:value.uri}),targets:ids};
        }
      },
      {
        name:"announcement.send",
        description:"Speak an announcement in one room, group, selected devices or everywhere, optionally with a chime and volume ducking.",
        capability:"notifications.send",
        async execute(input){
          const value=z.object({
            text:z.string().min(1),
            deviceIds:z.array(z.string()).optional(),
            group:z.string().optional(),
            room:z.string().optional(),
            all:z.boolean().default(false),
            chimeUrl:z.string().optional(),
            duckVolume:z.number().min(0).max(100).optional(),
            restoreVolume:z.number().min(0).max(100).optional(),
            emergency:z.boolean().default(false)
          }).parse(input);
          const ids=resolveTargets(value);
          if(!ids.length) throw new Error("No announcement targets selected");
          const commands=[];
          if(value.duckVolume!==undefined) commands.push(...send(ids,"audio.volume",{percent:value.duckVolume}));
          if(value.chimeUrl) commands.push(...send(ids,"audio.play",{url:value.chimeUrl}));
          commands.push(...send(ids,"tts.speak",{text:value.text}));
          commands.push(...send(ids,"notification.send",{
            title:value.emergency?"Emergency announcement":"Jarvis announcement",
            body:value.text
          }));
          if(value.restoreVolume!==undefined) commands.push(...send(ids,"audio.volume",{percent:value.restoreVolume}));
          return {ok:true,targets:ids,commands,emergency:value.emergency};
        }
      }
    ]
  };
}
