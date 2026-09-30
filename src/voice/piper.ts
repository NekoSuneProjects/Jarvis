import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { config } from "../config.js";
import type { TtsProvider, TtsRequest } from "./types.js";

export class PiperTtsProvider implements TtsProvider {
  readonly id="piper";

  async available():Promise<boolean>{
    if(!config.piper.model) return false;
    try {
      await fs.access(config.piper.model);
      return true;
    } catch {
      return false;
    }
  }

  async synthesize(request:TtsRequest):Promise<{outputPath:string}>{
    if(!(await this.available())) throw new Error("Piper model is not configured or missing");
    await fs.mkdir(new URL(".",`file://${request.outputPath}`).pathname,{recursive:true}).catch(()=>{});

    await new Promise<void>((resolve,reject)=>{
      const child=spawn(config.piper.bin,["--model",config.piper.model,"--output_file",request.outputPath],{
        shell:false,
        windowsHide:true
      });
      let stderr="";
      child.stderr.on("data",(chunk)=>stderr+=chunk.toString());
      child.on("error",reject);
      child.on("close",(code)=>code===0?resolve():reject(new Error(stderr || `Piper exited with ${code}`)));
      child.stdin.end(request.text);
    });

    return {outputPath:request.outputPath};
  }
}
