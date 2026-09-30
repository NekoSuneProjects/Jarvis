import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
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

async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "NekoSune-Jarvis/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Downloaded file from ${url} was empty`);
  }

  const tempPath = `${destination}.download`;
  await fs.writeFile(tempPath, buffer);
  await fs.rename(tempPath, destination);
}

export class PiperTtsProvider implements TtsProvider {
  readonly id = "piper";

  private get voice(): VoiceDefinition {
    return VOICES[config.piper.voice];
  }

  private get modelDirectory(): string {
    return path.resolve(config.dataDir, "models", "piper", this.voice.id);
  }

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

  async available(): Promise<boolean> {
    try {
      await this.ensureVoiceDownloaded();
      return true;
    } catch (error) {
      console.error("[piper] Jarvis voice unavailable:", error);
      return false;
    }
  }

  async synthesize(request: TtsRequest): Promise<{ outputPath: string }> {
    const { modelPath } = await this.ensureVoiceDownloaded();
    await fs.mkdir(path.dirname(path.resolve(request.outputPath)), { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        config.piper.bin,
        ["--model", modelPath, "--output_file", request.outputPath],
        {
          shell: false,
          windowsHide: true
        }
      );

      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
      child.on("error", reject);
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
