import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function docker(args:string[]){
  const result=await runProcess("docker",args,{timeoutMs:30000});
  if(result.code!==0) throw new Error(result.stderr.trim() || `docker exited with ${result.code}`);
  return result.stdout.trim();
}

export const dockerPlugin:JarvisPlugin={
  id:"docker",
  name:"Docker",
  version:"0.1.0",
  description:"Docker CLI monitoring and container control.",
  tools:[
    {
      name:"docker.ps",
      description:"List Docker containers.",
      capability:"docker.read",
      async execute(){
        const out=await docker(["ps","-a","--format","{{json .}}"]);
        return out?out.split("\n").map((line)=>JSON.parse(line)):[];
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
    ...(["start","stop","restart"] as const).map((action)=>({
      name:`docker.${action}`,
      description:`${action} a Docker container.`,
      capability:"docker.control",
      async execute(input:unknown){
        const value=z.object({container:z.string().min(1)}).parse(input);
        return {output:await docker([action,value.container])};
      }
    }))
  ]
};
