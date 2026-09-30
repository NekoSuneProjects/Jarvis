#!/usr/bin/env node
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync=promisify(execFile);
const core=(process.env.JARVIS_CORE_URL ?? "http://127.0.0.1:3000").replace(/\/$/,"");
const pairingCode=process.env.JARVIS_PAIRING_CODE ?? "";
const name=process.env.JARVIS_AGENT_NAME ?? os.hostname();
const stateDir=process.env.JARVIS_AGENT_DATA ?? path.join(os.homedir(),".nekosune-jarvis");
const stateFile=path.join(stateDir,"agent.json");
const heartbeatSeconds=Math.max(5,Number(process.env.JARVIS_AGENT_HEARTBEAT_SECONDS ?? 30));

async function jsonRequest(url,init={}){
  const response=await fetch(core+url,{
    ...init,
    headers:{"content-type":"application/json",...(init.headers ?? {})}
  });
  if(!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.status===204?null:response.json();
}

async function loadState(){
  try{return JSON.parse(await fs.readFile(stateFile,"utf8"));}catch{return null;}
}

async function saveState(state){
  await fs.mkdir(stateDir,{recursive:true});
  await fs.writeFile(stateFile,JSON.stringify(state,null,2),"utf8");
}

async function register(){
  if(!pairingCode) throw new Error("Set JARVIS_PAIRING_CODE for first-time registration");
  const result=await jsonRequest("/api/v1/agents/register",{
    method:"POST",
    body:JSON.stringify({
      pairingCode,
      name,
      platform:process.platform,
      arch:process.arch,
      capabilities:["system.stats","heartbeat","system.info","process.list","app.open","url.open"],
      metadata:{release:os.release()}
    })
  });
  await saveState(result);
  return result;
}

function headers(state){
  return {
    authorization:`Bearer ${state.token}`,
    "x-jarvis-device-id":state.id
  };
}

function stats(){
  const cpus=os.cpus();
  return {
    hostname:os.hostname(),
    platform:process.platform,
    arch:process.arch,
    release:os.release(),
    uptimeSeconds:os.uptime(),
    memory:{total:os.totalmem(),free:os.freemem()},
    cpu:{model:cpus[0]?.model ?? "unknown",cores:cpus.length,load:os.loadavg()}
  };
}

async function heartbeat(state){
  await jsonRequest("/api/v1/agents/heartbeat",{
    method:"POST",
    headers:headers(state),
    body:JSON.stringify({metadata:stats()})
  });
}

function openDetached(command,args=[]){
  const child=spawn(command,args,{detached:true,stdio:"ignore",shell:false,windowsHide:true});
  child.unref();
}

function openUrl(url){
  if(process.platform==="win32") openDetached("rundll32.exe",["url.dll,FileProtocolHandler",url]);
  else if(process.platform==="darwin") openDetached("open",[url]);
  else openDetached("xdg-open",[url]);
}

async function executeCommand(job){
  switch(job.command){
    case "system.info":
      return stats();
    case "process.list":{
      const result=process.platform==="win32"
        ? await execFileAsync("tasklist",["/FO","CSV","/NH"],{windowsHide:true,maxBuffer:2_000_000})
        : await execFileAsync("ps",["-eo","pid,ppid,comm,%cpu,%mem"],{maxBuffer:2_000_000});
      return {raw:result.stdout};
    }
    case "app.open":{
      const command=String(job.args?.command ?? "");
      if(!command) throw new Error("app.open requires args.command");
      const args=Array.isArray(job.args?.args)?job.args.args.map(String):[];
      openDetached(command,args);
      return {ok:true};
    }
    case "url.open":{
      const url=String(job.args?.url ?? "");
      if(!/^https?:\/\//i.test(url)) throw new Error("url.open requires an http(s) URL");
      openUrl(url);
      return {ok:true};
    }
    default:
      throw new Error(`Unsupported remote command: ${job.command}`);
  }
}

async function processCommands(state){
  const payload=await jsonRequest("/api/v1/agents/commands",{
    headers:headers(state)
  });

  for(const job of payload?.commands ?? []){
    let ok=true;
    let result;
    try{
      result=await executeCommand(job);
    }catch(error){
      ok=false;
      result={error:error instanceof Error?error.message:String(error)};
    }

    await jsonRequest(`/api/v1/agents/commands/${encodeURIComponent(job.id)}/result`,{
      method:"POST",
      headers:headers(state),
      body:JSON.stringify({ok,result})
    });
  }
}

let state=await loadState();
if(!state) state=await register();

console.log(`Jarvis agent paired as ${state.id}`);

while(true){
  try{
    await heartbeat(state);
    await processCommands(state);
    console.log(`[${new Date().toISOString()}] heartbeat ok`);
  }catch(error){
    console.error(`[${new Date().toISOString()}] agent cycle failed:`,error.message);
  }
  await new Promise(resolve=>setTimeout(resolve,heartbeatSeconds*1000));
}
