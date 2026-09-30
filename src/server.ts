import { randomUUID } from "node:crypto";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { config } from "./config.js";
import { BrowserAutomation } from "./browser/automation.js";
import type { AiProvider, ChatMessage } from "./ai/types.js";
import { AssistantStore } from "./assistant/store.js";
import { JarvisAgent } from "./agent/jarvis-agent.js";
import { Scheduler } from "./assistant/scheduler.js";
import { RoutineEngine } from "./assistant/routine-engine.js";
import { EventBus } from "./events/event-bus.js";
import { IntegrationManager } from "./integrations/manager.js";
import { HomeAssistantIntegration } from "./integrations/home-assistant.js";
import { MqttIntegration } from "./integrations/mqtt.js";
import { PermissionManager } from "./permissions/permission-manager.js";
import { createAssistantPlugin } from "./plugins/assistant-plugin.js";
import { createBrowserPlugin } from "./plugins/browser-plugin.js";
import { createDiscordPlugin } from "./plugins/discord-plugin.js";
import { computerPlugin } from "./plugins/computer-plugin.js";
import { dockerPlugin } from "./plugins/docker-plugin.js";
import { filesPlugin } from "./plugins/files-plugin.js";
import { createGithubPlugin } from "./plugins/github-plugin.js";
import { createGooglePlugin } from "./plugins/google-plugin.js";
import { createMemoryPlugin } from "./plugins/memory-plugin.js";
import { createSearchPlugin } from "./plugins/search-plugin.js";
import { createSpotifyPlugin } from "./plugins/spotify-plugin.js";
import { createWeatherPlugin } from "./plugins/weather-plugin.js";
import { wolPlugin } from "./plugins/wol-plugin.js";
import { PiperTtsProvider } from "./voice/piper.js";
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
  const routines = new RoutineEngine(store, tools, events);
  const agent = new JarvisAgent(ai, tools, events, store);

  const browser = new BrowserAutomation();
  const assistantPlugin = createAssistantPlugin(store);
  const browserPlugin = createBrowserPlugin(browser);
  const discordPlugin = createDiscordPlugin();
  const githubPlugin = createGithubPlugin();
  const googlePlugin = createGooglePlugin();
  const memoryPlugin = createMemoryPlugin(store);
  const searchPlugin = createSearchPlugin();
  const weatherPlugin = createWeatherPlugin();
  const spotifyPlugin = createSpotifyPlugin();
  const builtInPlugins = [
    systemPlugin,
    assistantPlugin,
    browserPlugin,
    computerPlugin,
    discordPlugin,
    filesPlugin,
    githubPlugin,
    googlePlugin,
    dockerPlugin,
    wolPlugin,
    searchPlugin,
    weatherPlugin,
    spotifyPlugin
  ];

  for (const plugin of builtInPlugins) {
    plugins.register(plugin);
    tools.registerMany(plugin.tools);
  }

  const piper = new PiperTtsProvider();

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
    await browser.close();
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

  app.patch<{ Params: { capability: string }; Body: { decision: "allow" | "ask" | "deny" } }>(
    "/api/v1/permissions/:capability",
    async (request) => {
      permissions.set(request.params.capability, request.body.decision);
      store.audit("api", "permission.update", {
        capability: request.params.capability,
        decision: request.body.decision
      });
      events.publish("permission.updated", {
        capability: request.params.capability,
        decision: request.body.decision
      });
      return { ok: true };
    }
  );

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

  app.get("/api/v1/voice", async () => ({
    providers: [
      {
        id: piper.id,
        available: await piper.available()
      }
    ]
  }));

  app.post<{ Body: { text: string; outputPath?: string } }>("/api/v1/voice/tts", async (request, reply) => {
    try {
      const outputPath = request.body.outputPath ?? `${config.dataDir}/tts/output.wav`;
      const result = await piper.synthesize({
        text: request.body.text,
        outputPath
      });
      events.publish("voice.tts.completed", result);
      return { ok: true, ...result };
    } catch (error) {
      return reply.code(503).send({
        ok: false,
        error: error instanceof Error ? error.message : "TTS failed"
      });
    }
  });

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

  app.get("/api/v1/conversations", async () => ({
    conversations: store.listConversations()
  }));

  app.get<{ Params: { id: string } }>("/api/v1/conversations/:id/messages", async (request) => ({
    messages: store.conversationMessages(request.params.id, 100)
  }));

  app.get<{ Querystring: { category?: string } }>("/api/v1/memories", async (request) => {
    permissions.assertAllowed("memory.read");
    return { memories: store.listMemories(request.query.category) };
  });

  app.delete<{ Params: { id: string } }>("/api/v1/memories/:id", async (request, reply) => {
    try {
      permissions.assertAllowed("memory.write");
      return { ok: store.forgetMemory(Number(request.params.id)) };
    } catch (error) {
      return reply.code(403).send({
        ok: false,
        error: error instanceof Error ? error.message : "Memory permission denied"
      });
    }
  });

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

  app.get("/api/v1/routines", async () => ({ routines: store.listRoutines() }));
  app.post<{ Body: { name: string; trigger?: unknown; actions: unknown[]; conditions?: unknown[] } }>(
    "/api/v1/routines",
    async (request) => ({
      routine: store.createRoutine(
        request.body.name,
        request.body.trigger ?? { type: "manual" },
        request.body.actions,
        request.body.conditions ?? []
      )
    })
  );
  app.patch<{ Params: { id: string }; Body: { enabled: boolean } }>(
    "/api/v1/routines/:id",
    async (request) => ({
      ok: store.setRoutineEnabled(Number(request.params.id), request.body.enabled)
    })
  );
  app.post<{ Params: { id: string } }>("/api/v1/routines/:id/run", async (request, reply) => {
    try {
      return { ok: true, result: await routines.run(Number(request.params.id)) };
    } catch (error) {
      return reply.code(400).send({
        ok: false,
        error: error instanceof Error ? error.message : "Routine failed"
      });
    }
  });

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

  app.post<{ Body: { keyword?: string; deviceId?: string } }>(
    "/api/v1/satellite/wake",
    async (request) => {
      events.publish("voice.listening", {
        keyword: request.body.keyword ?? null,
        deviceId: request.body.deviceId ?? null
      });
      return { ok: true };
    }
  );

  app.post<{ Body: { state: string; deviceId?: string } }>(
    "/api/v1/satellite/state",
    async (request) => {
      const allowed = new Set(["idle", "listening", "thinking", "speaking", "error"]);
      const state = allowed.has(request.body.state) ? request.body.state : "idle";
      events.publish(`voice.${state}`, {
        deviceId: request.body.deviceId ?? null
      });
      return { ok: true, state };
    }
  );

  app.post<{ Body: { text: string; respond?: boolean; deviceId?: string } }>(
    "/api/v1/satellite/transcript",
    async (request) => {
      events.publish("voice.transcript", {
        text: request.body.text,
        deviceId: request.body.deviceId ?? null
      });

      if (!request.body.respond) {
        return { ok: true };
      }

      const conversationId = `satellite:${request.body.deviceId ?? "default"}`;
      const history = store.conversationMessages(conversationId, 24) as Array<{
        role: "user" | "assistant";
        content: string;
      }>;
      store.appendConversationMessage(conversationId, "user", request.body.text);

      const response = await agent.chat([
        ...history.map((item) => ({ role: item.role, content: item.content })),
        { role: "user", content: request.body.text }
      ]);

      store.appendConversationMessage(conversationId, "assistant", response.content);

      events.publish("voice.reply", {
        text: response.content,
        deviceId: request.body.deviceId ?? null
      });

      return {
        ok: true,
        reply: response.content,
        trace: response.trace,
        conversationId
      };
    }
  );

  app.post<{ Body: { message?: string; messages?: ChatMessage[]; conversationId?: string } }>(
    "/api/v1/chat",
    async (request, reply) => {
      permissions.assertAllowed("assistant.chat");

      const supplied = request.body?.messages;

      if (supplied && supplied.length > 0) {
        const response = await agent.chat(supplied);
        return {
          ...response,
          conversationId: request.body.conversationId ?? null
        };
      }

      if (!request.body?.message) {
        return reply.code(400).send({
          error: "Provide either message or messages"
        });
      }

      const conversationId = request.body.conversationId ?? randomUUID();
      const history = store.conversationMessages(conversationId, 30) as Array<{
        role: "user" | "assistant";
        content: string;
      }>;

      store.appendConversationMessage(conversationId, "user", request.body.message);

      const response = await agent.chat([
        ...history.map((item) => ({
          role: item.role,
          content: item.content
        } as ChatMessage)),
        { role: "user", content: request.body.message }
      ]);

      store.appendConversationMessage(conversationId, "assistant", response.content);

      return {
        ...response,
        conversationId
      };
    }
  );

  return app;
}
