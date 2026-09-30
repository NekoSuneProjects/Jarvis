import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  JARVIS_HOST: z.string().default("127.0.0.1"),
  JARVIS_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  JARVIS_NAME: z.string().min(1).default("Neko"),

  AI_PROVIDER: z.enum(["ollama", "openai-compatible"]).default("ollama"),
  AI_BASE_URL: z.string().url().default("http://127.0.0.1:11434/v1"),
  AI_MODEL: z.string().min(1).default("qwen2.5:3b"),
  AI_API_KEY: z.string().default(""),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  JARVIS_DATA_DIR: z.string().default("./data")
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid Jarvis configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  host: parsed.data.JARVIS_HOST,
  port: parsed.data.JARVIS_PORT,
  assistantName: parsed.data.JARVIS_NAME,
  ai: {
    provider: parsed.data.AI_PROVIDER,
    baseUrl: parsed.data.AI_BASE_URL.replace(/\/$/, ""),
    model: parsed.data.AI_MODEL,
    apiKey: parsed.data.AI_API_KEY,
    temperature: parsed.data.AI_TEMPERATURE,
    timeoutMs: parsed.data.AI_TIMEOUT_MS
  },
  dataDir: parsed.data.JARVIS_DATA_DIR
} as const;
