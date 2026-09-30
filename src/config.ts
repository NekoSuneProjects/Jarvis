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

  JARVIS_DATA_DIR: z.string().default("./data"),

  HOME_ASSISTANT_URL: z.string().default(""),
  HOME_ASSISTANT_TOKEN: z.string().default(""),

  MQTT_URL: z.string().default(""),
  MQTT_USERNAME: z.string().default(""),
  MQTT_PASSWORD: z.string().default(""),

  SEARXNG_URL: z.string().default(""),
  SPOTIFY_ACCESS_TOKEN: z.string().default(""),
  JARVIS_FILES_ROOT: z.string().default("./workspace"),

  PIPER_BIN: z.string().default("piper"),
  PIPER_MODEL: z.string().default(""),

  BROWSER_EXECUTABLE_PATH: z.string().default(""),
  BROWSER_CHANNEL: z.string().default("chrome"),
  BROWSER_HEADLESS: z.string().default("false"),

  GOOGLE_ACCESS_TOKEN: z.string().default(""),
  DISCORD_BOT_TOKEN: z.string().default(""),
  GITHUB_TOKEN: z.string().default(""),

  JARVIS_PAIRING_CODE: z.string().default(""),
  AGENT_HEARTBEAT_SECONDS: z.coerce.number().int().min(5).max(3600).default(30)
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
  dataDir: parsed.data.JARVIS_DATA_DIR,
  homeAssistant: {
    url: parsed.data.HOME_ASSISTANT_URL,
    token: parsed.data.HOME_ASSISTANT_TOKEN
  },
  mqtt: {
    url: parsed.data.MQTT_URL,
    username: parsed.data.MQTT_USERNAME,
    password: parsed.data.MQTT_PASSWORD
  },
  searxngUrl: parsed.data.SEARXNG_URL,
  spotifyAccessToken: parsed.data.SPOTIFY_ACCESS_TOKEN,
  filesRoot: parsed.data.JARVIS_FILES_ROOT,
  piper: {
    bin: parsed.data.PIPER_BIN,
    model: parsed.data.PIPER_MODEL
  },
  browser: {
    executablePath: parsed.data.BROWSER_EXECUTABLE_PATH,
    channel: parsed.data.BROWSER_CHANNEL,
    headless: parsed.data.BROWSER_HEADLESS.toLowerCase() === "true"
  },
  googleAccessToken: parsed.data.GOOGLE_ACCESS_TOKEN,
  discordBotToken: parsed.data.DISCORD_BOT_TOKEN,
  githubToken: parsed.data.GITHUB_TOKEN,
  pairingCode: parsed.data.JARVIS_PAIRING_CODE,
  agentHeartbeatSeconds: parsed.data.AGENT_HEARTBEAT_SECONDS
} as const;
