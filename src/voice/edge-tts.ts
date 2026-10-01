import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { runProcess } from "../utils/process.js";
import type { TtsProvider, TtsRequest } from "./types.js";

export interface EdgeVoice {
  Name?:string;
  ShortName?:string;
  Gender?:string;
  Locale?:string;
  SuggestedCodec?:string;
  FriendlyName?:string;
}

export class EdgeTtsProvider implements TtsProvider {
  readonly id="edge";

  async available():Promise<boolean>{
    try{
      const result=await runProcess(config.edgeTts.bin,["--version"],{timeoutMs:5000});
      return result.code===0;
    }catch{
      return false;
    }
  }

  async voices():Promise<EdgeVoice[]>{
    const result=await runProcess(config.edgeTts.bin,["--list-voices"],{timeoutMs:30000});
    if(result.code!==0) throw new Error(result.stderr || "Unable to list Edge TTS voices");

    // Python edge-tts prints a fixed-column table. Parse it conservatively.
    const lines=result.stdout.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
    const voices:EdgeVoice[]=[];
    for(const line of lines){
      const match=line.match(/^([a-z]{2,3}-[A-Z]{2,3}-\S+Neural)\s+(Male|Female)\s+(.+)$/);
      if(match){
        voices.push({
          ShortName:match[1],
          Gender:match[2],
          FriendlyName:match[3],
          Locale:match[1].split("-").slice(0,2).join("-")
        });
      }
    }
    return voices;
  }

  private async runSynthesis(request:TtsRequest,voice:string):Promise<{outputPath:string}>{
    const rate=request.rate ?? config.edgeTts.rate;
    const pitch=request.pitch ?? config.edgeTts.pitch;
    const volume=request.volume ?? "+0%";
    const result=await runProcess(config.edgeTts.bin,[
      "--text",request.text,
      "--voice",voice,
      `--rate=${rate}`,
      `--pitch=${pitch}`,
      `--volume=${volume}`,
      "--write-media",request.outputPath
    ],{timeoutMs:120000});
    if(result.code!==0) throw new Error(result.stderr || `Edge TTS exited with ${result.code}`);
    return {outputPath:request.outputPath};
  }

  async synthesize(request:TtsRequest):Promise<{outputPath:string}>{
    await fs.mkdir(path.dirname(path.resolve(request.outputPath)),{recursive:true});
    const voice=request.voice ?? config.edgeTts.voice;
    try{
      return await this.runSynthesis(request,voice);
    }catch(error){
      if(voice===config.edgeTts.voice) throw error;
      console.warn(`[edge-tts] Voice ${voice} failed; falling back to ${config.edgeTts.voice}`);
      return this.runSynthesis(request,config.edgeTts.voice);
    }
  }

  async preview(voice:string,text="Jarvis Edge TTS voice preview."){
    const outputPath=path.resolve(config.dataDir,"tts","edge-preview.mp3");
    return this.synthesize({text,voice,outputPath});
  }
}
