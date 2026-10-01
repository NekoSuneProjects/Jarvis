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
      capabilities:[
        "system.stats","heartbeat","system.info","process.list","app.open","url.open",
        "screenshot.capture","notification.send","file.read","file.write",
        "power.lock","power.sleep","power.restart","power.shutdown",
        "audio.play","audio.volume","tts.speak"
      ],
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

async function screenshotCapture(){
  const target=path.join(stateDir,`screenshot-${Date.now()}.png`);
  await fs.mkdir(stateDir,{recursive:true});
  if(process.platform==="win32"){
    const script=`Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp=New-Object System.Drawing.Bitmap $b.Width,$b.Height; $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size); $bmp.Save('${target.replace(/'/g,"''")}'); $g.Dispose(); $bmp.Dispose()`;
    await execFileAsync("powershell.exe",["-NoProfile","-Command",script],{windowsHide:true});
  }else if(process.platform==="darwin"){
    await execFileAsync("screencapture",["-x",target]);
  }else{
    try{await execFileAsync("grim",[target]);}
    catch{await execFileAsync("import",["-window","root",target]);}
  }
  const bytes=await fs.readFile(target);
  await fs.rm(target,{force:true});
  return {mimeType:"image/png",base64:bytes.toString("base64")};
}

async function nativeNotify(title,body){
  if(process.platform==="win32"){
    const escaped=(v)=>String(v).replace(/'/g,"''");
    const script=`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${escaped(body)}','${escaped(title)}') | Out-Null`;
    await execFileAsync("powershell.exe",["-NoProfile","-Command",script],{windowsHide:true});
  }else if(process.platform==="darwin"){
    await execFileAsync("osascript",["-e",`display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`]);
  }else{
    await execFileAsync("notify-send",[title,body]);
  }
  return {ok:true};
}

async function powerAction(action){
  if(process.platform==="win32"){
    if(action==="lock") return execFileAsync("rundll32.exe",["user32.dll,LockWorkStation"]);
    if(action==="sleep") return execFileAsync("powershell.exe",["-NoProfile","-Command","Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend',$false,$false)"]);
    return execFileAsync("shutdown.exe",[action==="restart"?"/r":"/s","/t","0"]);
  }
  if(process.platform==="darwin"){
    const script=action==="lock"?'tell application "System Events" to keystroke "q" using {control down, command down}':action==="sleep"?'tell application "System Events" to sleep':action==="restart"?'tell application "System Events" to restart':'tell application "System Events" to shut down';
    return execFileAsync("osascript",["-e",script]);
  }
  return execFileAsync("systemctl",[action==="lock"?"lock-session":action==="sleep"?"suspend":action==="restart"?"reboot":"poweroff"]);
}

async function speak(text){
  if(process.platform==="win32"){
    const escaped=String(text).replace(/'/g,"''");
    return execFileAsync("powershell.exe",["-NoProfile","-Command",`Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('${escaped}')`]);
  }
  if(process.platform==="darwin") return execFileAsync("say",[String(text)]);
  try{return await execFileAsync("spd-say",[String(text)]);}
  catch{return execFileAsync("espeak",[String(text)]);}
}

async function setVolume(percent){
  const p=Math.max(0,Math.min(100,Number(percent)));
  if(process.platform==="win32"){
    const script=`$w=New-Object -ComObject WScript.Shell; 1..${Math.ceil(50)} | % {$w.SendKeys([char]174)}; 1..${Math.round(p/2)} | % {$w.SendKeys([char]175)}`;
    return execFileAsync("powershell.exe",["-NoProfile","-Command",script]);
  }
  if(process.platform==="darwin") return execFileAsync("osascript",["-e",`set volume output volume ${Math.round(p)}`]);
  try{return await execFileAsync("wpctl",["set-volume","@DEFAULT_AUDIO_SINK@",`${p}%`]);}
  catch{return execFileAsync("pactl",["set-sink-volume","@DEFAULT_SINK@",`${p}%`]);}
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
    case "screenshot.capture":
      return screenshotCapture();
    case "notification.send":
      return nativeNotify(String(job.args?.title??"Jarvis"),String(job.args?.body??""));
    case "file.read":{
      const file=path.resolve(String(job.args?.path??""));
      const bytes=await fs.readFile(file);
      return {path:file,base64:bytes.toString("base64")};
    }
    case "file.write":{
      const file=path.resolve(String(job.args?.path??""));
      await fs.mkdir(path.dirname(file),{recursive:true});
      await fs.writeFile(file,Buffer.from(String(job.args?.base64??""),"base64"));
      return {ok:true,path:file};
    }
    case "power.lock": await powerAction("lock"); return {ok:true};
    case "power.sleep": await powerAction("sleep"); return {ok:true};
    case "power.restart": await powerAction("restart"); return {ok:true};
    case "power.shutdown": await powerAction("shutdown"); return {ok:true};
    case "audio.play":{
      const url=String(job.args?.url??"");
      if(!url) throw new Error("audio.play requires args.url");
      openUrl(url);
      return {ok:true,url};
    }
    case "audio.volume": await setVolume(job.args?.percent??50); return {ok:true};
    case "tts.speak": await speak(String(job.args?.text??"")); return {ok:true};
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
