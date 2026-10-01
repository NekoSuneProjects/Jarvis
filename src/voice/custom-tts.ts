import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { config } from "../config.js";
import type { TtsProvider,TtsRequest } from "./types.js";

function voiceMap():Record<string,string>{
  try{
    const parsed=JSON.parse(config.customTts.voiceMapJson);
    return parsed && typeof parsed==="object" ? parsed : {};
  }catch{return {};}
}

export class CustomTtsProvider implements TtsProvider{
  readonly id="custom";

  async available():Promise<boolean>{
    if(!config.customTts.url) return false;
    try{
      const response=await fetch(config.customTts.url,{
        method:"OPTIONS",
        headers:config.customTts.apiKey?{authorization:`Bearer ${config.customTts.apiKey}`}:{},
        signal:AbortSignal.timeout(5000)
      });
      return response.ok || [400,404,405].includes(response.status);
    }catch{return false;}
  }

  async synthesize(request:TtsRequest):Promise<{outputPath:string}>{
    if(!config.customTts.url) throw new Error("CUSTOM_TTS_URL is not configured");
    const mapping=voiceMap();
    const voice=request.voice ? (mapping[request.voice] ?? request.voice) : undefined;
    const response=await fetch(config.customTts.url,{
      method:"POST",
      headers:{
        "content-type":"application/json",
        ...(config.customTts.apiKey?{authorization:`Bearer ${config.customTts.apiKey}`}:{})
      },
      body:JSON.stringify({
        text:request.text,
        voice,
        rate:request.rate,
        pitch:request.pitch,
        volume:request.volume,
        format:config.customTts.format
      }),
      signal:AbortSignal.timeout(120000)
    });
    if(!response.ok) throw new Error(`Custom TTS HTTP ${response.status}: ${await response.text()}`);
    if(!response.body) throw new Error("Custom TTS returned no audio body");

    const output=path.resolve(request.outputPath);
    await fs.mkdir(path.dirname(output),{recursive:true});
    await pipeline(Readable.fromWeb(response.body as any),createWriteStream(output));
    return {outputPath:request.outputPath};
  }
}
