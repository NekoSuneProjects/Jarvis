import Fastify from "fastify";
import { config } from "./config.js";
import type { AiProvider, ChatMessage } from "./ai/types.js";
import { PermissionManager } from "./permissions/permission-manager.js";
import { PluginRegistry } from "./plugins/plugin-registry.js";

export function createServer(ai: AiProvider) {
  const app = Fastify({ logger: true });
  const permissions = new PermissionManager();
  const plugins = new PluginRegistry();

  app.get("/health", async () => {
    const aiHealth = await ai.health();

    return {
      ok: true,
      service: "nekosune-jarvis",
      assistant: config.assistantName,
      ai: {
        provider: ai.id,
        ...aiHealth
      }
    };
  });

  app.get("/api/v1/permissions", async () => ({
    permissions: permissions.list()
  }));

  app.get("/api/v1/plugins", async () => ({
    plugins: plugins.list().map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      tools: plugin.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        capability: tool.capability
      }))
    }))
  }));

  app.post<{ Body: { message?: string; messages?: ChatMessage[] } }>(
    "/api/v1/chat",
    async (request, reply) => {
      permissions.assertAllowed("assistant.chat");

      const supplied = request.body?.messages;
      const messages: ChatMessage[] =
        supplied && supplied.length > 0
          ? supplied
          : request.body?.message
            ? [{ role: "user", content: request.body.message }]
            : [];

      if (messages.length === 0) {
        return reply.code(400).send({
          error: "Provide either message or messages"
        });
      }

      const response = await ai.chat({
        messages: [
          {
            role: "system",
            content: `You are ${config.assistantName}, a helpful personal assistant.`
          },
          ...messages
        ]
      });

      return response;
    }
  );

  return app;
}
