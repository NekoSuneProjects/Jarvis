import { z } from "zod";
import type { JarvisPlugin } from "./plugin-registry.js";

type NutModule=typeof import("@nut-tree-fork/nut-js");
let cached:NutModule|undefined;

async function nut():Promise<NutModule>{
  cached ??= await import("@nut-tree-fork/nut-js");
  return cached;
}

function normalizeButton(value:"left"|"right"|"middle",Button:any){
  if(value==="right") return Button.RIGHT;
  if(value==="middle") return Button.MIDDLE;
  return Button.LEFT;
}

export const desktopInputPlugin:JarvisPlugin={
  id:"desktop-input",
  name:"Desktop Input",
  version:"0.1.0",
  description:"Cross-platform mouse and keyboard automation via nut.js fork.",
  tools:[
    {
      name:"computer.mouse.position",
      description:"Read the current mouse position.",
      capability:"computer.input",
      parameters:{type:"object",properties:{},additionalProperties:false},
      async execute(){
        const {mouse}=await nut();
        const position=await mouse.getPosition();
        return {x:position.x,y:position.y};
      }
    },
    {
      name:"computer.mouse.move",
      description:"Move the mouse to absolute screen coordinates.",
      capability:"computer.input",
      parameters:{
        type:"object",
        properties:{x:{type:"integer"},y:{type:"integer"}},
        required:["x","y"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({x:z.number().int(),y:z.number().int()}).parse(input);
        const {mouse,Point}=await nut();
        await mouse.setPosition(new Point(value.x,value.y));
        return {ok:true,...value};
      }
    },
    {
      name:"computer.mouse.click",
      description:"Click a mouse button one or more times at the current position.",
      capability:"computer.input",
      parameters:{
        type:"object",
        properties:{
          button:{type:"string",enum:["left","right","middle"]},
          count:{type:"integer",minimum:1,maximum:5}
        },
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          button:z.enum(["left","right","middle"]).default("left"),
          count:z.number().int().min(1).max(5).default(1)
        }).parse(input ?? {});
        const {mouse,Button}=await nut();
        const button=normalizeButton(value.button,Button);
        for(let i=0;i<value.count;i++) await mouse.click(button);
        return {ok:true,count:value.count,button:value.button};
      }
    },
    {
      name:"computer.mouse.scroll",
      description:"Scroll vertically. Positive is up, negative is down.",
      capability:"computer.input",
      parameters:{
        type:"object",
        properties:{amount:{type:"integer",minimum:-10000,maximum:10000}},
        required:["amount"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({amount:z.number().int().min(-10000).max(10000)}).parse(input);
        const {mouse}=await nut();
        if(value.amount>=0) await mouse.scrollUp(value.amount);
        else await mouse.scrollDown(Math.abs(value.amount));
        return {ok:true,amount:value.amount};
      }
    },
    {
      name:"computer.keyboard.type",
      description:"Type text into the currently focused application.",
      capability:"computer.input",
      parameters:{
        type:"object",
        properties:{text:{type:"string"}},
        required:["text"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({text:z.string().max(20000)}).parse(input);
        const {keyboard}=await nut();
        await keyboard.type(value.text);
        return {ok:true,length:value.text.length};
      }
    },
    {
      name:"computer.keyboard.keys",
      description:"Press a sequence or shortcut of named keys, for example CTRL+L or ALT+TAB.",
      capability:"computer.input",
      parameters:{
        type:"object",
        properties:{
          keys:{type:"array",items:{type:"string"},minItems:1,maxItems:8},
          mode:{type:"string",enum:["shortcut","sequence"]}
        },
        required:["keys"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          keys:z.array(z.string()).min(1).max(8),
          mode:z.enum(["shortcut","sequence"]).default("shortcut")
        }).parse(input);
        const {keyboard,Key}=await nut();
        const resolved=value.keys.map((name)=>{
          const key=(Key as any)[name.trim().toUpperCase()];
          if(key===undefined) throw new Error(`Unknown key: ${name}`);
          return key;
        });

        if(value.mode==="sequence"){
          for(const key of resolved) await keyboard.pressKey(key);
          for(const key of [...resolved].reverse()) await keyboard.releaseKey(key);
        }else{
          await keyboard.pressKey(...resolved);
          await keyboard.releaseKey(...[...resolved].reverse());
        }

        return {ok:true,keys:value.keys,mode:value.mode};
      }
    }
  ]
};
