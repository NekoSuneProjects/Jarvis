import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function docker(args:string[],timeoutMs=30000,host?:string){
  const full=host?["-H",host,...args]:args;
  const result=await runProcess("docker",full,{timeoutMs});
  if(result.code!==0) throw new Error(result.stderr.trim() || `docker exited with ${result.code}`);
  return result.stdout.trim();
}

function jsonLines(out:string){
  return out?out.split("\n").filter(Boolean).map((line)=>JSON.parse(line)):[];
}

export const dockerPlugin:JarvisPlugin={
  id:"docker",
  name:"Docker",
  version:"0.2.0",
  description:"Docker CLI monitoring, containers, images and Compose control.",
  tools:[
    {
      name:"docker.ps",
      description:"List Docker containers, optionally from a remote Docker daemon.",
      capability:"docker.read",
      async execute(input){
        const value=z.object({host:z.string().optional()}).parse(input ?? {});
        return jsonLines(await docker(["ps","-a","--format","{{json .}}"],30000,value.host));
      }
    },
    {
      name:"docker.logs",
      description:"Read recent logs from a Docker container.",
      capability:"docker.read",
      async execute(input){
        const value=z.object({container:z.string().min(1),tail:z.number().int().min(1).max(5000).default(100)}).parse(input);
        return {logs:await docker(["logs","--tail",String(value.tail),value.container])};
      }
    },
    {
      name:"docker.inspect",
      description:"Inspect a Docker container or image.",
      capability:"docker.read",
      async execute(input){
        const value=z.object({target:z.string().min(1)}).parse(input);
        return JSON.parse(await docker(["inspect",value.target]));
      }
    },
    {
      name:"docker.stats",
      description:"Read one-shot Docker container resource statistics.",
      capability:"docker.read",
      async execute(){
        return jsonLines(await docker(["stats","--no-stream","--format","{{json .}}"]));
      }
    },
    {
      name:"docker.images",
      description:"List local Docker images.",
      capability:"docker.read",
      async execute(){
        return jsonLines(await docker(["images","--format","{{json .}}"]));
      }
    },
    {
      name:"docker.pull",
      description:"Pull a Docker image. Requires control permission.",
      capability:"docker.control",
      async execute(input){
        const value=z.object({image:z.string().min(1)}).parse(input);
        return {output:await docker(["pull",value.image],120000)};
      }
    },
    {
      name:"docker.container.remove",
      description:"Remove a Docker container. Requires control permission.",
      capability:"docker.control",
      async execute(input){
        const value=z.object({container:z.string().min(1),force:z.boolean().default(false),confirm:z.literal(true),host:z.string().optional()}).parse(input);
        const args=["rm"];
        if(value.force) args.push("-f");
        args.push(value.container);
        return {output:await docker(args,30000,value.host)};
      }
    },
    {
      name:"docker.image.remove",
      description:"Remove a Docker image. Requires control permission.",
      capability:"docker.control",
      async execute(input){
        const value=z.object({image:z.string().min(1),force:z.boolean().default(false),confirm:z.literal(true),host:z.string().optional()}).parse(input);
        const args=["image","rm"];
        if(value.force) args.push("-f");
        args.push(value.image);
        return {output:await docker(args,30000,value.host)};
      }
    },
    {
      name:"docker.compose.list",
      description:"List Docker Compose projects known to the local Docker engine.",
      capability:"docker.read",
      async execute(){
        const out=await docker(["compose","ls","--format","json"]);
        try{return JSON.parse(out);}catch{return {raw:out};}
      }
    },
    ...(["start","stop","restart"] as const).map((action)=>({
      name:`docker.${action}`,
      description:`${action} a Docker container.`,
      capability:"docker.control",
      async execute(input:unknown){
        const value=z.object({container:z.string().min(1)}).parse(input);
        return {output:await docker([action,value.container])};
      }
    })),
    {
      name:"docker.compose.ps",
      description:"List services in a Docker Compose project.",
      capability:"docker.read",
      async execute(input){
        const value=z.object({file:z.string().min(1),project:z.string().optional()}).parse(input);
        const args=["compose","-f",value.file];
        if(value.project) args.push("-p",value.project);
        args.push("ps","--format","json");
        const out=await docker(args);
        try{return JSON.parse(out);}catch{return {raw:out};}
      }
    },
    ...(["up","down","restart","pull"] as const).map((action)=>({
      name:`docker.compose.${action}`,
      description:`${action} a Docker Compose project. Requires control permission.`,
      capability:"docker.control",
      async execute(input:unknown){
        const value=z.object({
          file:z.string().min(1),
          project:z.string().optional(),
          detach:z.boolean().default(true)
        }).parse(input);
        const args=["compose","-f",value.file];
        if(value.project) args.push("-p",value.project);
        args.push(action);
        if(action==="up" && value.detach) args.push("-d");
        return {output:await docker(args,120000)};
      }
    }))
  ]
};
