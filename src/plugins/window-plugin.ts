import { z } from "zod";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

type WindowInfo={
  id?:string;
  pid?:number;
  title:string;
  process?:string;
};

async function windowsList():Promise<WindowInfo[]>{
  const script=`
    Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } |
    Select-Object Id,ProcessName,MainWindowTitle |
    ConvertTo-Json -Compress
  `;
  const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "Unable to list windows");
  const parsed=result.stdout.trim()?JSON.parse(result.stdout):[];
  const rows=Array.isArray(parsed)?parsed:[parsed];
  return rows.map((row:any)=>({
    pid:Number(row.Id),
    process:String(row.ProcessName ?? ""),
    title:String(row.MainWindowTitle ?? "")
  }));
}

async function linuxList():Promise<WindowInfo[]>{
  const result=await runProcess("wmctrl",["-lp"],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "wmctrl is required on Linux");
  return result.stdout.split(/\r?\n/).filter(Boolean).map((line)=>{
    const match=line.match(/^(0x[0-9a-f]+)\s+\S+\s+(\d+)\s+\S+\s+(.*)$/i);
    return {
      id:match?.[1],
      pid:match?.[2]?Number(match[2]):undefined,
      title:match?.[3] ?? line
    };
  });
}

async function macList():Promise<WindowInfo[]>{
  const script='tell application "System Events" to get name of every process whose background only is false';
  const result=await runProcess("osascript",["-e",script],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "Unable to list apps");
  return result.stdout.split(",").map((name)=>({title:name.trim()})).filter((x)=>x.title);
}

async function listWindows(){
  if(process.platform==="win32") return windowsList();
  if(process.platform==="darwin") return macList();
  return linuxList();
}

async function focus(title:string){
  if(process.platform==="win32"){
    const escaped=title.replace(/'/g,"''");
    const script=`
      $ws = New-Object -ComObject WScript.Shell;
      if (-not $ws.AppActivate('${escaped}')) { exit 2 }
    `;
    const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error("Window not found");
    return;
  }
  if(process.platform==="darwin"){
    const script=`tell application "${title.replace(/"/g,'\\\"')}" to activate`;
    const result=await runProcess("osascript",["-e",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error(result.stderr || "Window not found");
    return;
  }
  const result=await runProcess("wmctrl",["-a",title],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "Window not found");
}

async function closeWindow(title:string){
  if(process.platform==="win32"){
    const escaped=title.replace(/'/g,"''");
    const script=`
      $p = Get-Process | Where-Object { $_.MainWindowTitle -like '*${escaped}*' } | Select-Object -First 1;
      if (-not $p) { exit 2 }
      if (-not $p.CloseMainWindow()) { exit 3 }
    `;
    const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error("Window not found or could not close");
    return;
  }
  if(process.platform==="darwin"){
    const script=`tell application "${title.replace(/"/g,'\\\"')}" to quit`;
    const result=await runProcess("osascript",["-e",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error(result.stderr || "Unable to close app");
    return;
  }
  const result=await runProcess("wmctrl",["-c",title],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "Window not found");
}

async function windowState(title:string,state:"minimize"|"maximize"|"restore"){
  if(process.platform==="win32"){
    const escaped=title.replace(/'/g,"''");
    const show=state==="minimize"?2:state==="maximize"?3:9;
    const script=`
      Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32ShowWindow {
        [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
      }
"@;
      $p = Get-Process | Where-Object { $_.MainWindowTitle -like '*${escaped}*' } | Select-Object -First 1;
      if (-not $p) { exit 2 }
      [Win32ShowWindow]::ShowWindowAsync($p.MainWindowHandle, ${show}) | Out-Null
    `;
    const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error("Window not found");
    return;
  }

  if(process.platform==="darwin"){
    if(state==="minimize"){
      const script=`tell application "System Events" to tell process "${title.replace(/"/g,'\\\"')}" to set value of attribute "AXMinimized" of window 1 to true`;
      const result=await runProcess("osascript",["-e",script],{timeoutMs:10000});
      if(result.code!==0) throw new Error(result.stderr || "Unable to minimize");
      return;
    }
    await focus(title);
    return;
  }

  const action=state==="maximize"
    ? ["-r",title,"-b","add,maximized_vert,maximized_horz"]
    : state==="restore"
      ? ["-r",title,"-b","remove,maximized_vert,maximized_horz"]
      : ["-r",title,"-b","add,hidden"];
  const result=await runProcess("wmctrl",action,{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "Window operation failed");
}

export const windowPlugin:JarvisPlugin={
  id:"windows",
  name:"Window Control",
  version:"0.1.0",
  description:"Cross-platform application window discovery and control.",
  tools:[
    {
      name:"computer.windows.list",
      description:"List visible application windows.",
      capability:"computer.window",
      async execute(){return listWindows();}
    },
    {
      name:"computer.window.focus",
      description:"Focus/activate a visible application window by title.",
      capability:"computer.window",
      async execute(input){
        const value=z.object({title:z.string().min(1)}).parse(input);
        await focus(value.title);
        return {ok:true};
      }
    },
    {
      name:"computer.window.close",
      description:"Ask a visible application window to close.",
      capability:"computer.window",
      async execute(input){
        const value=z.object({title:z.string().min(1)}).parse(input);
        await closeWindow(value.title);
        return {ok:true};
      }
    },
    {
      name:"computer.window.state",
      description:"Minimize, maximize or restore a visible window.",
      capability:"computer.window",
      async execute(input){
        const value=z.object({
          title:z.string().min(1),
          state:z.enum(["minimize","maximize","restore"])
        }).parse(input);
        await windowState(value.title,value.state);
        return {ok:true,state:value.state};
      }
    }
  ]
};
