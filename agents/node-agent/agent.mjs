#!/usr/bin/env node
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

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
  return response.json();
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
      capabilities:["system.stats","heartbeat"],
      metadata:{release:os.release()}
    })
  });
  await saveState(result);
  return result;
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
    headers:{
      authorization:`Bearer ${state.token}`,
      "x-jarvis-device-id":state.id
    },
    body:JSON.stringify({metadata:stats()})
  });
}

let state=await loadState();
if(!state) state=await register();

console.log(`Jarvis agent paired as ${state.id}`);

while(true){
  try{
    await heartbeat(state);
    console.log(`[${new Date().toISOString()}] heartbeat ok`);
  }catch(error){
    console.error(`[${new Date().toISOString()}] heartbeat failed:`,error.message);
  }
  await new Promise(resolve=>setTimeout(resolve,heartbeatSeconds*1000));
}
