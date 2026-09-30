import { OpenAiCompatibleProvider } from "./ai/openai-compatible.js";
import { config } from "./config.js";
import { createServer } from "./server.js";

const ai = new OpenAiCompatibleProvider();
const server = await createServer(ai);

try {
  await server.listen({
    host: config.host,
    port: config.port
  });

  console.log(
    `NekoSune Jarvis is running at http://${config.host}:${config.port}`
  );
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
