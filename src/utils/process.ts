import { spawn } from "node:child_process";

export interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function runProcess(command:string,args:string[],options:{cwd?:string;timeoutMs?:number}={}):Promise<ProcessResult>{
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{cwd:options.cwd,shell:false,windowsHide:true});
    let stdout="";
    let stderr="";
    const timeout=options.timeoutMs
      ? setTimeout(()=>child.kill(),options.timeoutMs)
      : undefined;

    child.stdout.on("data",(chunk)=>{stdout+=chunk.toString();});
    child.stderr.on("data",(chunk)=>{stderr+=chunk.toString();});
    child.on("error",(error)=>{
      if(timeout) clearTimeout(timeout);
      reject(error);
    });
    child.on("close",(code)=>{
      if(timeout) clearTimeout(timeout);
      resolve({code:code ?? -1,stdout,stderr});
    });
  });
}
