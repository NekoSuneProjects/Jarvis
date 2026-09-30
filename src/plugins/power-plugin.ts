import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function run(command:"lock"|"sleep"|"restart"|"shutdown"){
  if(process.platform==="win32"){
    if(command==="lock"){
      const result=await runProcess("rundll32.exe",["user32.dll,LockWorkStation"],{timeoutMs:5000});
      if(result.code!==0) throw new Error(result.stderr || "Lock failed");
      return;
    }
    if(command==="sleep"){
      const script='Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState("Suspend",$false,$false)';
      const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:5000});
      if(result.code!==0) throw new Error(result.stderr || "Sleep failed");
      return;
    }
    const args=command==="restart"
      ? ["/r","/t","0"]
      : ["/s","/t","0"];
    const result=await runProcess("shutdown.exe",args,{timeoutMs:5000});
    if(result.code!==0) throw new Error(result.stderr || `${command} failed`);
    return;
  }

  if(process.platform==="darwin"){
    const script=command==="lock"
      ? 'tell application "System Events" to keystroke "q" using {control down, command down}'
      : command==="sleep"
        ? 'tell application "System Events" to sleep'
        : command==="restart"
          ? 'tell application "System Events" to restart'
          : 'tell application "System Events" to shut down';
    const result=await runProcess("osascript",["-e",script],{timeoutMs:5000});
    if(result.code!==0) throw new Error(result.stderr || `${command} failed`);
    return;
  }

  const args=command==="lock"
    ? ["lock-session"]
    : command==="sleep"
      ? ["suspend"]
      : command==="restart"
        ? ["reboot"]
        : ["poweroff"];
  const result=await runProcess("systemctl",args,{timeoutMs:5000});
  if(result.code!==0) throw new Error(result.stderr || `${command} failed`);
}

export const powerPlugin:JarvisPlugin={
  id:"power",
  name:"System Power",
  version:"0.1.0",
  description:"Permission-gated local lock/sleep/restart/shutdown controls.",
  tools:[
    ...(["lock","sleep","restart","shutdown"] as const).map((command)=>({
      name:`system.power.${command}`,
      description:`${command} the local computer. Requires explicit approval.`,
      capability:"system.power",
      parameters:{type:"object",properties:{},additionalProperties:false},
      async execute(){
        await run(command);
        return {ok:true,command};
      }
    }))
  ]
};
