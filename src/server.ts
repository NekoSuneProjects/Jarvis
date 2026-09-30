import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { config } from "./config.js";
import type { AiProvider, ChatMessage } from "./ai/types.js";
import { AssistantStore } from "./assistant/store.js";
import { Scheduler } from "./assistant/scheduler.js";
import { EventBus } from "./events/event-bus.js";
import { IntegrationManager } from "./integrations/manager.js";
import { HomeAssistantIntegration } from "./integrations/home-assistant.js";
import { MqttIntegration } from "./integrations/mqtt.js";
import { PermissionManager } from "./permissions/permission-manager.js";
import { createAssistantPlugin } from "./plugins/assistant-plugin.js";
import { PluginRegistry } from "./plugins/plugin-registry.js";
import { systemPlugin } from "./plugins/system-plugin.js";
import { JarvisDatabase } from "./storage/database.js";
import { ToolRouter } from "./tools/tool-router.js";

export async function createServer(ai: AiProvider) {
  const app = Fastify({ logger: true });
  await app.register(websocket);

  const database = new JarvisDatabase();
  const store = new AssistantStore(database);
  const events = new EventBus();
  const scheduler = new Scheduler(store, events);
  const permissions = new PermissionManager();
  const plugins = new PluginRegistry();
  const tools = new ToolRouter(permissions);
  const integrations = new IntegrationManager();

  const assistantPlugin = createAssistantPlugin(store);
  plugins.register(systemPlugin);
  plugins.register(assistantPlugin);
  tools.registerMany(systemPlugin.tools);
  tools.registerMany(assistantPlugin.tools);

  const homeAssistant = new HomeAssistantIntegration({
    baseUrl: config.homeAssistant.url,
    token: config.homeAssistant.token
  });

  const mqtt = new MqttIntegration(
    {
      url: config.mqtt.url,
      username: config.mqtt.username,
      password: config.mqtt.password
    },
    events
  );

  integrations.register(homeAssistant);
  integrations.register(mqtt);

  scheduler.start();
  void integrations.connectEnabled();

  app.addHook("onClose", async () => {
    scheduler.stop();
    await integrations.disconnectAll();
    database.close();
  });

  app.get("/health", async () => {
    const aiHealth = await ai.health();

    return {
      ok: true,
      service: "nekosune-jarvis",
      assistant: config.assistantName,
      ai: {
        provider: ai.id,
        ...aiHealth
      },
      integrations: integrations.list().map((item) => ({
        id: item.id,
        state: item.state
      }))
    };
  });

  app.get("/api/v1/events", { websocket: true }, (socket) => {
    const unsubscribe = events.subscribe((event) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    });

    socket.on("close", unsubscribe);
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

  app.get("/api/v1/integrations", async () => ({
    integrations: await Promise.all(
      integrations.list().map(async (item) => ({
        id: item.id,
        name: item.name,
        state: item.state,
        capabilities: item.capabilities,
        health: await item.health()
      }))
    )
  }));

  app.get("/api/v1/tools", async () => ({
    tools: tools.list()
  }));

  app.post<{ Body: { input?: unknown }; Params: { name: string } }>(
    "/api/v1/tools/:name/execute",
    async (request, reply) => {
      try {
        const result = await tools.execute(request.params.name, request.body?.input);
        store.audit("api", `tool:${request.params.name}`, request.body?.input);
        return { ok: true, result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed";

        if (message.startsWith("Unknown tool:")) {
          return reply.code(404).send({ ok: false, error: message });
        }

        if (
          message.startsWith("Permission denied:") ||
          message.startsWith("Permission requires approval:")
        ) {
          return reply.code(403).send({ ok: false, error: message });
        }

        throw error;
      }
    }
  );

  app.get("/api/v1/notes", async () => ({ notes: store.listNotes() }));
  app.post<{ Body: { title: string; body?: string; tags?: string[] } }>("/api/v1/notes", async (request) => ({
    note: store.createNote(request.body.title, request.body.body ?? "", request.body.tags ?? [])
  }));
  app.delete<{ Params: { id: string } }>("/api/v1/notes/:id", async (request) => ({
    ok: store.deleteNote(Number(request.params.id))
  }));

  app.get<{ Params: { name: string } }>("/api/v1/lists/:name", async (request) =>
    store.getList(request.params.name)
  );
  app.post<{ Params: { name: string }; Body: { text: string } }>("/api/v1/lists/:name/items", async (request) => ({
    item: store.addListItem(request.params.name, request.body.text)
  }));
  app.patch<{ Params: { id: string }; Body: { checked: boolean } }>("/api/v1/list-items/:id", async (request) => ({
    ok: store.checkListItem(Number(request.params.id), request.body.checked)
  }));
  app.delete<{ Params: { name: string } }>("/api/v1/lists/:name/checked", async (request) => ({
    removed: store.clearChecked(request.params.name)
  }));

  app.get("/api/v1/timers", async () => ({ timers: store.listTimers() }));
  app.post<{ Body: { name?: string; durationMs: number } }>("/api/v1/timers", async (request) => ({
    timer: store.createTimer(request.body.name ?? "Timer", request.body.durationMs)
  }));

  app.get("/api/v1/alarms", async () => ({ alarms: store.listAlarms() }));
  app.post<{ Body: { name?: string; fireAt: string; repeatRule?: string } }>("/api/v1/alarms", async (request) => ({
    alarm: store.createAlarm(request.body.name ?? "Alarm", request.body.fireAt, request.body.repeatRule)
  }));

  app.get("/api/v1/reminders", async () => ({ reminders: store.listReminders() }));
  app.post<{ Body: { text: string; fireAt: string; repeatRule?: string } }>("/api/v1/reminders", async (request) => ({
    reminder: store.createReminder(request.body.text, request.body.fireAt, request.body.repeatRule)
  }));
  app.post<{ Params: { id: string } }>("/api/v1/reminders/:id/complete", async (request) => ({
    ok: store.completeReminder(Number(request.params.id))
  }));

  app.get("/api/v1/home-assistant/states", async (_request, reply) => {
    permissions.assertAllowed("smart-home.read");
    if (homeAssistant.state === "disabled") return reply.code(503).send({ error: "Home Assistant is not configured" });
    return homeAssistant.states();
  });

  app.post<{ Body: { entityId: string; action: "on" | "off"; data?: Record<string, unknown> } }>(
    "/api/v1/home-assistant/entity",
    async (request, reply) => {
      try {
        permissions.assertAllowed("smart-home.control");
        const result =
          request.body.action === "on"
            ? await homeAssistant.turnOn(request.body.entityId, request.body.data)
            : await homeAssistant.turnOff(request.body.entityId);
        return { ok: true, result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Home Assistant action failed";
        if (message.startsWith("Permission")) return reply.code(403).send({ ok: false, error: message });
        throw error;
      }
    }
  );

  app.post<{ Body: { topic: string; payload: string; retain?: boolean; qos?: 0 | 1 | 2 } }>(
    "/api/v1/mqtt/publish",
    async (request, reply) => {
      try {
        permissions.assertAllowed("mqtt.publish");
        await mqtt.publish(request.body.topic, request.body.payload, {
          retain: request.body.retain,
          qos: request.body.qos
        });
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "MQTT publish failed";
        if (message.startsWith("Permission")) return reply.code(403).send({ ok: false, error: message });
        throw error;
      }
    }
  );

  app.post<{ Body: { topic: string; qos?: 0 | 1 | 2 } }>("/api/v1/mqtt/subscribe", async (request) => {
    permissions.assertAllowed("mqtt.subscribe");
    await mqtt.subscribe(request.body.topic, request.body.qos ?? 0);
    return { ok: true };
  });

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
