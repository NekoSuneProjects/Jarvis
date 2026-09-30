import { z } from "zod";
import { config } from "../config.js";
import { SshIntegration, type SshHostConfig } from "../integrations/ssh.js";
import type { JarvisPlugin } from "./plugin-registry.js";

function loadHosts():Record<string,SshHostConfig>{
  try{
    const parsed=JSON.parse(config.sshHostsJson);
    return parsed && typeof parsed==="object" ? parsed : {};
  }catch{
    return {};
  }
}

export function createSshPlugin():JarvisPlugin{
  const ssh=new SshIntegration(loadHosts());
  return {
    id:"ssh",
    name:"SSH",
    version:"0.1.0",
    description:"Run approved commands on configured SSH hosts.",
    tools:[
      {
        name:"ssh.hosts",
        description:"List configured SSH host aliases without revealing credentials.",
        capability:"development.read",
        parameters:{type:"object",properties:{},additionalProperties:false},
        async execute(){return ssh.listHosts();}
      },
      {
        name:"ssh.test",
        description:"Test SSH connectivity to a configured host.",
        capability:"development.read",
        parameters:{
          type:"object",
          properties:{host:{type:"string"}},
          required:["host"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({host:z.string().min(1)}).parse(input);
          return ssh.test(value.host);
        }
      },
      {
        name:"ssh.exec",
        description:"Execute a shell command on a configured SSH host. Requires approval.",
        capability:"system.shell",
        parameters:{
          type:"object",
          properties:{
            host:{type:"string"},
            command:{type:"string"},
            timeoutMs:{type:"integer",minimum:1000,maximum:120000}
          },
          required:["host","command"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({
            host:z.string().min(1),
            command:z.string().min(1).max(10000),
            timeoutMs:z.number().int().min(1000).max(120000).default(30000)
          }).parse(input);
          return ssh.exec(value.host,value.command,value.timeoutMs);
        }
      }
    ]
  };
}
