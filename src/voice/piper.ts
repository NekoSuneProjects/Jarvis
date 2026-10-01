import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { config } from "../config.js";
import type { TtsProvider, TtsRequest } from "./types.js";

type JarvisVoiceId = "en_GB-jarvis-medium" | "en_GB-jarvis-high";

type VoiceDefinition = {
  id: JarvisVoiceId;
  onnxUrl: string;
  jsonUrl: string;
};

const VOICES: Record<JarvisVoiceId, VoiceDefinition> = {
  "en_GB-jarvis-medium": {
    id: "en_GB-jarvis-medium",
    onnxUrl:
      "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/medium/jarvis-medium.onnx",
    jsonUrl:
      "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/medium/jarvis-medium.onnx.json"
  },
  "en_GB-jarvis-high": {
    id: "en_GB-jarvis-high",
    onnxUrl:
      "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high/jarvis-high.onnx",
    jsonUrl:
      "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high/jarvis-high.onnx.json"
  }
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sha256(filePath:string){
  const data=await fs.readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const tempPath = `${destination}.download`;
  let offset=0;
  try{offset=(await fs.stat(tempPath)).size;}catch{}

  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "NekoSune-Jarvis/1.0",
      ...(offset>0?{range:`bytes=${offset}-`}:{})
    }
  });

  if (!response.ok && response.status!==206) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  if(offset>0 && response.status!==206){
    offset=0;
    await fs.rm(tempPath,{force:true});
  }

  const totalHeader=response.headers.get("content-length");
  const total=totalHeader ? Number(totalHeader)+offset : 0;
  const expectedEtag=(response.headers.get("etag") ?? "").replace(/^W\//,"").replace(/"/g,"");
  const handle=await fs.open(tempPath,offset>0?"a":"w");
  let received=offset;
  try{
    if(!response.body) throw new Error("Download response had no body");
    for await(const chunk of response.body as any){
      const buffer=Buffer.from(chunk);
      await handle.write(buffer);
      received+=buffer.length;
      if(total>0){
        const percent=Math.floor(received/total*100);
        if(percent%10===0) console.log(`[piper] download ${percent}% (${received}/${total})`);
      }
    }
  }finally{
    await handle.close();
  }

  if(received===0) throw new Error(`Downloaded file from ${url} was empty`);

  if(/^[a-f0-9]{64}$/i.test(expectedEtag)){
    const actual=await sha256(tempPath);
    if(actual.toLowerCase()!==expectedEtag.toLowerCase()){
      throw new Error(`Checksum mismatch for ${url}`);
    }
  }

  await fs.rename(tempPath, destination);
}

export class PiperTtsProvider implements TtsProvider {
  readonly id = "piper";
  private selectedVoice:JarvisVoiceId=config.piper.voice;

  get voiceId():JarvisVoiceId{return this.selectedVoice;}

  setVoice(voice:JarvisVoiceId){
    this.selectedVoice=voice;
    return this.selectedVoice;
  }

  private get voice(): VoiceDefinition {
    return VOICES[this.selectedVoice];
  }

  private get modelDirectory(): string {
    return path.resolve(config.dataDir, "models", "piper", this.voice.id);
  }

  static readonly voices=Object.keys(VOICES) as JarvisVoiceId[];

  private get modelPath(): string {
    return path.join(this.modelDirectory, `${this.voice.id}.onnx`);
  }

  private get configPath(): string {
    return `${this.modelPath}.json`;
  }

  async ensureVoiceDownloaded(): Promise<{ modelPath: string; configPath: string }> {
    await fs.mkdir(this.modelDirectory, { recursive: true });

    const modelExists = await exists(this.modelPath);
    const configExists = await exists(this.configPath);

    if (!modelExists) {
      console.log(`[piper] Downloading Jarvis voice model: ${this.voice.id}`);
      await downloadFile(this.voice.onnxUrl, this.modelPath);
    }

    if (!configExists) {
      console.log(`[piper] Downloading Jarvis voice config: ${this.voice.id}`);
      await downloadFile(this.voice.jsonUrl, this.configPath);
    }

    return {
      modelPath: this.modelPath,
      configPath: this.configPath
    };
  }

  async resolveBinary():Promise<string>{
    const candidates=[
      path.resolve(process.cwd(),"runtime","piper",process.platform==="win32"?"piper.exe":"piper"),
      path.resolve(process.cwd(),"piper",process.platform==="win32"?"piper.exe":"piper"),
      config.piper.bin
    ];
    for(const candidate of candidates){
      if(candidate===config.piper.bin && !candidate.includes(path.sep)) return candidate;
      if(await exists(candidate)) return candidate;
    }
    return config.piper.bin;
  }

  async cleanupCache(voice?:JarvisVoiceId){
    const root=path.resolve(config.dataDir,"models","piper");
    if(voice) await fs.rm(path.join(root,voice),{recursive:true,force:true});
    else await fs.rm(root,{recursive:true,force:true});
    return {ok:true,voice:voice ?? null};
  }

  async available(): Promise<boolean> {
    try {
      await this.ensureVoiceDownloaded();
      const binary=await this.resolveBinary();
      if(binary===config.piper.bin && !binary.includes(path.sep)) return true;
      return exists(binary);
    } catch (error) {
      console.error("[piper] Jarvis voice unavailable:", error);
      return false;
    }
  }

  async synthesize(request: TtsRequest): Promise<{ outputPath: string }> {
    const { modelPath } = await this.ensureVoiceDownloaded();
    await fs.mkdir(path.dirname(path.resolve(request.outputPath)), { recursive: true });

    const binary=await this.resolveBinary();
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        binary,
        ["--model", modelPath, "--output_file", request.outputPath],
        {
          shell: false,
          windowsHide: true
        }
      );

      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
      child.on("error",(error:any)=>{
        if(error?.code==="ENOENT") reject(new Error("Piper binary was not found. Install Piper or bundle it under runtime/piper."));
        else reject(error);
      });
      child.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(stderr || `Piper exited with ${code}`))
      );

      child.stdin.end(request.text);
    });

    return { outputPath: request.outputPath };
  }
}
