import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { z } from "zod";
import JSZip from "jszip";
import { config } from "./config.js";
import { BrowserAutomation } from "./browser/automation.js";
import type { AiProvider, ChatMessage } from "./ai/types.js";
import { AssistantStore } from "./assistant/store.js";
import { JarvisAgent } from "./agent/jarvis-agent.js";
import { Scheduler } from "./assistant/scheduler.js";
import { RoutineEngine } from "./assistant/routine-engine.js";
import { EventBus } from "./events/event-bus.js";
import { DeviceRegistry } from "./devices/device-registry.js";
import { DiscoveryService } from "./devices/discovery.js";
import { IntegrationManager } from "./integrations/manager.js";
import { HomeAssistantIntegration } from "./integrations/home-assistant.js";
import { MqttIntegration } from "./integrations/mqtt.js";
import { PermissionManager } from "./permissions/permission-manager.js";
import { createAssistantPlugin } from "./plugins/assistant-plugin.js";
import { androidPlugin } from "./plugins/android-plugin.js";
import { createBrowserPlugin } from "./plugins/browser-plugin.js";
import { createDiscordPlugin } from "./plugins/discord-plugin.js";
import { createDiscoveryPlugin } from "./plugins/discovery-plugin.js";
import { createDocumentsPlugin } from "./plugins/documents-plugin.js";
import { createDevicesPlugin } from "./plugins/devices-plugin.js";
import { computerPlugin } from "./plugins/computer-plugin.js";
import { desktopInputPlugin } from "./plugins/desktop-input-plugin.js";
import { dockerPlugin } from "./plugins/docker-plugin.js";
import { filesPlugin } from "./plugins/files-plugin.js";
import { createGithubPlugin } from "./plugins/github-plugin.js";
import { createGooglePlugin } from "./plugins/google-plugin.js";
import { createHomeAssistantPlugin } from "./plugins/home-assistant-plugin.js";
import { createMemoryPlugin } from "./plugins/memory-plugin.js";
import { createMapsPlugin } from "./plugins/maps-plugin.js";
import { createNotificationsPlugin } from "./plugins/notifications-plugin.js";
import { createNativeNotificationPlugin } from "./plugins/native-notification-plugin.js";
import { createMqttPlugin } from "./plugins/mqtt-plugin.js";
import { createMonitoringPlugin } from "./plugins/monitoring-plugin.js";
import { createMediaServersPlugin } from "./plugins/media-servers-plugin.js";
import { createLanSmartHomePlugin } from "./plugins/lan-smart-home-plugin.js";
import { createSearchPlugin } from "./plugins/search-plugin.js";
import { powerPlugin } from "./plugins/power-plugin.js";
import { createSpotifyPlugin } from "./plugins/spotify-plugin.js";
import { shellPlugin } from "./plugins/shell-plugin.js";
import { createSshPlugin } from "./plugins/ssh-plugin.js";
import { createWeatherPlugin } from "./plugins/weather-plugin.js";
import { utilitiesPlugin } from "./plugins/utilities-plugin.js";
import { createYoutubePlugin } from "./plugins/youtube-plugin.js";
import { wolPlugin } from "./plugins/wol-plugin.js";
import { windowPlugin } from "./plugins/window-plugin.js";
import { PiperTtsProvider } from "./voice/piper.js";
import { EdgeTtsProvider } from "./voice/edge-tts.js";
import { PluginRegistry } from "./plugins/plugin-registry.js";
import { systemPlugin } from "./plugins/system-plugin.js";
import { JarvisDatabase } from "./storage/database.js";
import { SecretVault } from "./security/secret-vault.js";
import { ToolRouter } from "./tools/tool-router.js";
import { workspacePath } from "./utils/workspace-path.js";
import { runProcess } from "./utils/process.js";

export async function createServer(ai: AiProvider) {
  const app = Fastify({ logger: true });
  await app.register(websocket);

  const database = new JarvisDatabase();
  const store = new AssistantStore(database);
  const secrets = new SecretVault(database, config.dataDir, config.secretKey);
  const events = new EventBus();
  const devices = new DeviceRegistry(database);
  const discovery = new DiscoveryService();
  const scheduler = new Scheduler(store, events);
  const permissions = new PermissionManager();
  const plugins = new PluginRegistry(database);
  const tools = new ToolRouter(permissions, plugins);
  const integrations = new IntegrationManager();
  const routines = new RoutineEngine(store, tools, events);
  const agent = new JarvisAgent(ai, tools, events, store);
  const metrics={
    websocketConnections:0,
    tts:{count:0,totalMs:0,lastMs:0},
    ai:{count:0,totalMs:0,lastMs:0}
  };
  const startupDiagnostics=[{
    at:new Date().toISOString(),
    node:process.version,
    platform:process.platform,
    arch:process.arch,
    dataDir:config.dataDir,
    aiProvider:ai.id
  }];

  const browser = new BrowserAutomation();
  const assistantPlugin = createAssistantPlugin(store);
  const browserPlugin = createBrowserPlugin(browser);
  const devicesPlugin = createDevicesPlugin(devices);
  const discoveryPlugin = createDiscoveryPlugin(discovery);
  const documentsPlugin = createDocumentsPlugin(ai);
  const discordPlugin = createDiscordPlugin();
  const githubPlugin = createGithubPlugin();
  const googlePlugin = createGooglePlugin();
  const memoryPlugin = createMemoryPlugin(store);
  const mapsPlugin = createMapsPlugin(store);
  const monitoringPlugin = createMonitoringPlugin(store,events);
  const mediaServersPlugin = createMediaServersPlugin();
  const lanSmartHomePlugin = createLanSmartHomePlugin();
  const notificationsPlugin = createNotificationsPlugin(store, events);
  const nativeNotificationPlugin = createNativeNotificationPlugin(store, events);
  const searchPlugin = createSearchPlugin();
  const weatherPlugin = createWeatherPlugin(store);
  const youtubePlugin = createYoutubePlugin();
  const spotifyPlugin = createSpotifyPlugin();
  const sshPlugin = createSshPlugin();
  const builtInPlugins = [
    systemPlugin,
    assistantPlugin,
    androidPlugin,
    browserPlugin,
    computerPlugin,
    desktopInputPlugin,
    devicesPlugin,
    discoveryPlugin,
    discordPlugin,
    documentsPlugin,
    filesPlugin,
    githubPlugin,
    googlePlugin,
    memoryPlugin,
    mapsPlugin,
    mediaServersPlugin,
    lanSmartHomePlugin,
    monitoringPlugin,
    nativeNotificationPlugin,
    notificationsPlugin,
    powerPlugin,
    dockerPlugin,
    wolPlugin,
    searchPlugin,
    shellPlugin,
    weatherPlugin,
    windowPlugin,
    youtubePlugin,
    utilitiesPlugin,
    spotifyPlugin,
    sshPlugin
  ];

  for (const plugin of builtInPlugins) {
    plugins.register(plugin);
    tools.registerMany(plugin.tools, plugin.id);
  }

  const piper = new PiperTtsProvider();
  const savedPiperVoice=store.getSetting<"en_GB-jarvis-medium"|"en_GB-jarvis-high">("piperVoice");
  if(savedPiperVoice) piper.setVoice(savedPiperVoice);
  const edgeTts = new EdgeTtsProvider();

  app.addHook("onSend", async (request,reply,payload)=>{
    reply.header("x-request-id",request.id);
    return payload;
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!config.apiToken) return;
    if (request.url === "/health") return;

    // Remote agents have their own per-device bearer tokens.
    if (request.url.startsWith("/api/v1/agents/")) return;

    const authorization = request.headers.authorization ?? "";
    const bearer = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
    const queryToken =
      typeof (request.query as any)?.token === "string"
        ? (request.query as any).token
        : "";

    if (bearer !== config.apiToken && queryToken !== config.apiToken) {
      return reply.code(401).send({
        ok: false,
        error: "Jarvis API authentication required"
      });
    }
  });

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

  const homeAssistantPlugin = createHomeAssistantPlugin(homeAssistant);
  const mqttPlugin = createMqttPlugin(mqtt);
  plugins.register(homeAssistantPlugin);
  plugins.register(mqttPlugin);
  tools.registerMany(homeAssistantPlugin.tools, homeAssistantPlugin.id);
  tools.registerMany(mqttPlugin.tools, mqttPlugin.id);

  discovery.advertise(config.port);
  scheduler.start();
  routines.start();
  void integrations.connectEnabled();

  app.addHook("onClose", async () => {
    scheduler.stop();
    routines.stop();
    discovery.close();
    await integrations.disconnectAll();
    await browser.close();
    database.close();
  });

  app.get("/health", async () => {
    const aiHealth = await ai.health();
    const piperAvailable = await piper.available();
    const browserHealth = await browser.available();
    let adbHealth:{ok:boolean;detail?:string}={ok:false};
    try{
      const adb=await runProcess(config.adbBin,["version"],{timeoutMs:5000});
      adbHealth={ok:adb.code===0,detail:(adb.stdout||adb.stderr).trim().slice(0,500)};
    }catch(error){
      adbHealth={ok:false,detail:error instanceof Error?error.message:String(error)};
    }

    let databaseOk=true;
    let databaseDetail="ok";
    try{
      database.db.prepare("SELECT 1 AS ok").get();
    }catch(error){
      databaseOk=false;
      databaseDetail=error instanceof Error?error.message:String(error);
    }

    let dataDirectoryWritable=true;
    let dataDirectoryDetail="ok";
    try{
      await fs.mkdir(config.dataDir,{recursive:true});
      const probe=`${config.dataDir}/.jarvis-health-${randomUUID()}`;
      await fs.writeFile(probe,"ok","utf8");
      await fs.unlink(probe);
    }catch(error){
      dataDirectoryWritable=false;
      dataDirectoryDetail=error instanceof Error?error.message:String(error);
    }

    const integrationHealth = await Promise.all(
      integrations.list().map(async (item)=>({
        id:item.id,
        state:item.state,
        capabilities:item.capabilities,
        health:await item.health()
      }))
    );
    const smartHome=integrationHealth.filter((item)=>
      item.capabilities.some((capability)=>capability.startsWith("smart-home"))
    );
    const degraded =
      !aiHealth.ok ||
      !piperAvailable ||
      !databaseOk ||
      !dataDirectoryWritable ||
      integrationHealth.some((item)=>item.health.ok===false);

    return {
      ok: !degraded,
      degraded,
      service: "nekosune-jarvis",
      assistant: config.assistantName,
      ai: {
        provider: ai.id,
        reachable: aiHealth.ok,
        ...aiHealth
      },
      piper: {
        available: piperAvailable,
        selectedVoice: config.piper.voice
      },
      database: {
        ok: databaseOk,
        detail: databaseDetail
      },
      dataDirectory: {
        path: config.dataDir,
        writable: dataDirectoryWritable,
        detail: dataDirectoryDetail
      },
      browserAutomation:browserHealth,
      adb:adbHealth,
      startupDiagnostics,
      metrics,
      smartHome,
      integrations: integrationHealth
    };
  });

  app.get("/api/v1/events", { websocket: true }, (socket) => {
    metrics.websocketConnections++;
    const unsubscribe = events.subscribe((event) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    });

    socket.on("close", ()=>{
      metrics.websocketConnections=Math.max(0,metrics.websocketConnections-1);
      unsubscribe();
    });
  });

  app.post("/api/v1/system/shutdown", async () => {
    store.audit("api","system.graceful_shutdown",{});
    setImmediate(()=>void app.close());
    return {ok:true};
  });

  app.get("/api/v1/metrics", async () => ({
    websocketConnections:metrics.websocketConnections,
    tts:{
      ...metrics.tts,
      averageMs:metrics.tts.count?metrics.tts.totalMs/metrics.tts.count:0
    },
    ai:{
      ...metrics.ai,
      averageMs:metrics.ai.count?metrics.ai.totalMs/metrics.ai.count:0
    }
  }));

  app.get("/api/v1/diagnostics/export", async (_request,reply) => {
    const zip=new JSZip();
    zip.file("health.json",JSON.stringify({
      startupDiagnostics,
      metrics,
      settings:store.listSettings(),
      integrations:await Promise.all(integrations.list().map(async(item)=>({
        id:item.id,
        state:item.state,
        health:await item.health()
      })))
    },null,2));
    zip.file("audit.json",JSON.stringify(store.listAudit(1000),null,2));
    const buffer=await zip.generateAsync({type:"nodebuffer"});
    reply.header("content-type","application/zip");
    reply.header("content-disposition",'attachment; filename="jarvis-diagnostics.zip"');
    return reply.send(buffer);
  });

  const settingSchema=z.object({
    assistantName:z.string().min(1).max(100).optional(),
    aiEndpoint:z.string().url().optional(),
    aiModel:z.string().min(1).max(200).optional(),
    ttsProvider:z.enum(["piper","edge"]).optional(),
    piperVoice:z.enum(["en_GB-jarvis-medium","en_GB-jarvis-high"]).optional(),
    wakeWordMode:z.enum(["always","push-to-talk","disabled"]).optional(),
    memoryEnabled:z.boolean().optional()
  }).strict();

  app.get("/api/v1/settings", async () => ({
    defaults:{
      assistantName:config.assistantName,
      aiEndpoint:config.ai.baseUrl,
      aiModel:config.ai.model,
      ttsProvider:"piper",
      piperVoice:config.piper.voice,
      wakeWordMode:"always",
      memoryEnabled:true
    },
    settings:store.listSettings()
  }));

  app.patch<{ Body: unknown }>("/api/v1/settings", async (request, reply) => {
    const parsed=settingSchema.safeParse(request.body ?? {});
    if(!parsed.success){
      return reply.code(400).send({
        ok:false,
        error:"Invalid settings",
        details:parsed.error.flatten().fieldErrors
      });
    }
    const entries=Object.entries(parsed.data).map(([key,value])=>({key,value}));
    store.importSettings(entries);
    if(parsed.data.piperVoice) piper.setVoice(parsed.data.piperVoice);
    store.audit("api","settings.update",{keys:entries.map((entry)=>entry.key)});
    events.publish("settings.updated",{keys:entries.map((entry)=>entry.key)});
    return {ok:true,settings:store.listSettings()};
  });

  app.post<{ Body: { settings?: Array<{ key:string; value:unknown }> } }>(
    "/api/v1/settings/import",
    async (request, reply) => {
      const entries=request.body?.settings ?? [];
      const object=Object.fromEntries(entries.map((entry)=>[entry.key,entry.value]));
      const parsed=settingSchema.partial().safeParse(object);
      if(!parsed.success){
        return reply.code(400).send({
          ok:false,
          error:"Invalid settings import",
          details:parsed.error.flatten().fieldErrors
        });
      }
      const imported=Object.entries(parsed.data).map(([key,value])=>({key,value}));
      store.importSettings(imported);
      store.audit("api","settings.import",{keys:imported.map((entry)=>entry.key)});
      events.publish("settings.updated",{keys:imported.map((entry)=>entry.key)});
      return {ok:true,settings:store.listSettings()};
    }
  );

  app.get("/api/v1/settings/export", async () => ({
    settings:store.listSettings()
  }));

  app.delete("/api/v1/settings", async () => {
    store.resetSettings();
    store.audit("api","settings.reset",{});
    events.publish("settings.updated",{reset:true});
    return {ok:true};
  });

  app.get("/api/v1/permissions", async () => ({
    permissions: permissions.list(),
    toolRules: permissions.listToolRules(),
    emergencyStop: permissions.emergencyStop
  }));

  app.patch<{ Params:{ tool:string }; Body:{ decision:"allow"|"ask"|"deny" } }>(
    "/api/v1/permissions/tools/:tool",
    async (request)=>{
      permissions.setTool(request.params.tool,request.body.decision);
      store.audit("api","permission.tool.update",{tool:request.params.tool,decision:request.body.decision});
      events.publish("permission.tool.updated",{tool:request.params.tool,decision:request.body.decision});
      return {ok:true};
    }
  );

  app.post<{ Params:{ tool:string } }>(
    "/api/v1/permissions/tools/:tool/approve-once",
    async (request)=>{
      permissions.approveOnce(request.params.tool);
      store.audit("api","permission.tool.approve_once",{tool:request.params.tool});
      return {ok:true};
    }
  );

  app.post<{ Body:{ enabled:boolean } }>(
    "/api/v1/emergency-stop",
    async (request)=>{
      permissions.setEmergencyStop(request.body.enabled);
      store.setSetting("emergencyStop",request.body.enabled);
      store.audit("api","emergency-stop",{enabled:request.body.enabled});
      events.publish("emergency-stop",{enabled:request.body.enabled});
      return {ok:true,enabled:request.body.enabled};
    }
  );

  app.get("/api/v1/secrets", async () => {
    permissions.assertAllowed("secrets.manage");
    return { secrets: secrets.list() };
  });

  app.post<{ Body: { name: string; value: string } }>(
    "/api/v1/secrets",
    async (request, reply) => {
      try {
        permissions.assertAllowed("secrets.manage");
        const name = request.body.name.trim();
        if (!name) {
          return reply.code(400).send({ error: "Secret name is required" });
        }
        const entry = secrets.set(name, request.body.value);
        store.audit("api", "secret.set", { name });
        events.publish("secret.updated", { name });
        return { ok: true, secret: entry };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Secret update failed";
        return reply.code(message.startsWith("Permission") ? 403 : 400).send({
          ok: false,
          error: message
        });
      }
    }
  );

  app.delete<{ Params: { name: string } }>(
    "/api/v1/secrets/:name",
    async (request, reply) => {
      try {
        permissions.assertAllowed("secrets.manage");
        const ok = secrets.delete(request.params.name);
        if (ok) {
          store.audit("api", "secret.delete", { name: request.params.name });
          events.publish("secret.deleted", { name: request.params.name });
        }
        return { ok };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Secret delete failed";
        return reply.code(message.startsWith("Permission") ? 403 : 400).send({
          ok: false,
          error: message
        });
      }
    }
  );

  app.get<{ Querystring: { limit?: string; actor?: string; action?: string } }>(
    "/api/v1/audit",
    async (request) => ({
      entries: store.listAudit(
        Math.max(1, Math.min(1000, Number(request.query.limit ?? 200))),
        request.query.actor,
        request.query.action
      )
    })
  );

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
    plugins: plugins.listStatus().map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled,
      tools: plugin.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        capability: tool.capability
      }))
    }))
  }));

  app.patch<{ Params: { id: string }; Body: { enabled: boolean } }>(
    "/api/v1/plugins/:id",
    async (request, reply) => {
      try {
        plugins.setEnabled(request.params.id, request.body.enabled);
        store.audit("api", "plugin.enabled", {
          pluginId: request.params.id,
          enabled: request.body.enabled
        });
        events.publish("plugin.updated", {
          pluginId: request.params.id,
          enabled: request.body.enabled
        });
        return { ok: true };
      } catch (error) {
        return reply.code(404).send({
          ok: false,
          error: error instanceof Error ? error.message : "Plugin update failed"
        });
      }
    }
  );

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

  app.get("/api/v1/ai/models", async (_request, reply) => {
    if (!ai.models) {
      return reply.code(501).send({
        error: "AI provider does not support model discovery"
      });
    }

    return {
      provider: ai.id,
      selected: config.ai.model,
      models: await ai.models()
    };
  });

  app.post<{ Body: { input: string | string[]; model?: string } }>(
    "/api/v1/ai/embeddings",
    async (request, reply) => {
      if (!ai.embeddings) {
        return reply.code(501).send({
          error: "AI provider does not support embeddings"
        });
      }

      return ai.embeddings(request.body.input, request.body.model);
    }
  );

  app.post<{
    Body: {
      prompt: string;
      images: string[];
      model?: string;
    };
  }>("/api/v1/ai/vision", async (request, reply) => {
    if (!ai.vision) {
      return reply.code(501).send({
        error: "AI provider does not support vision"
      });
    }

    const mimeFor = (filename: string) => {
      const lower = filename.toLowerCase();
      if (lower.endsWith(".png")) return "image/png";
      if (lower.endsWith(".webp")) return "image/webp";
      if (lower.endsWith(".gif")) return "image/gif";
      return "image/jpeg";
    };

    const images = await Promise.all(
      request.body.images.map(async (relative) => ({
        mimeType: mimeFor(relative),
        base64: (await fs.readFile(workspacePath(relative))).toString("base64")
      }))
    );

    return ai.vision(request.body.prompt, images, request.body.model);
  });

  app.get("/api/v1/voice", async () => ({
    selectedPiperVoice:piper.voiceId,
    piperVoices:PiperTtsProvider.voices,
    providers: [
      {
        id: piper.id,
        available: await piper.available(),
        offline: true
      },
      {
        id: edgeTts.id,
        available: await edgeTts.available(),
        offline: false
      }
    ]
  }));

  app.put<{ Body:{ voice:"en_GB-jarvis-medium"|"en_GB-jarvis-high" } }>(
    "/api/v1/voice/piper/voice",
    async (request)=>{
      piper.setVoice(request.body.voice);
      store.setSetting("piperVoice",request.body.voice);
      events.publish("voice.piper.changed",{voice:request.body.voice});
      return {ok:true,voice:piper.voiceId};
    }
  );

  app.post<{ Body:{ text?:string; voice?:"en_GB-jarvis-medium"|"en_GB-jarvis-high" } }>(
    "/api/v1/voice/piper/preview",
    async (request)=>{
      if(request.body.voice) piper.setVoice(request.body.voice);
      const outputPath=`${config.dataDir}/tts/piper-preview-${Date.now()}.wav`;
      const result=await piper.synthesize({
        text:request.body.text ?? "Jarvis voice preview.",
        outputPath
      });
      return {ok:true,voice:piper.voiceId,...result};
    }
  );

  app.delete<{ Querystring:{ voice?:"en_GB-jarvis-medium"|"en_GB-jarvis-high" } }>(
    "/api/v1/voice/piper/cache",
    async (request)=>piper.cleanupCache(request.query.voice)
  );

  app.get("/api/v1/voice/edge/voices", async (_request, reply) => {
    try {
      return { voices: await edgeTts.voices() };
    } catch (error) {
      return reply.code(503).send({
        voices: [],
        error: error instanceof Error ? error.message : "Unable to list voices"
      });
    }
  });

  app.post<{
    Body: {
      text: string;
      provider?: "piper" | "edge";
      outputPath?: string;
      voice?: string;
      rate?: string;
      pitch?: string;
      volume?: string;
    };
  }>("/api/v1/voice/tts", async (request, reply) => {
    const started=Date.now();
    try {
      const provider = request.body.provider ?? (
        await piper.available() ? "piper" : "edge"
      );
      const outputPath = request.body.outputPath ?? (
        provider === "edge"
          ? `${config.dataDir}/tts/output.mp3`
          : `${config.dataDir}/tts/output.wav`
      );
      const selected = provider === "edge" ? edgeTts : piper;
      const result = await selected.synthesize({
        text: request.body.text,
        outputPath,
        voice: request.body.voice,
        rate: request.body.rate,
        pitch: request.body.pitch,
        volume: request.body.volume
      });
      const elapsed=Date.now()-started;
      metrics.tts.count++;
      metrics.tts.totalMs+=elapsed;
      metrics.tts.lastMs=elapsed;
      events.publish("voice.tts.completed", {
        provider,
        latencyMs:elapsed,
        ...result
      });
      return { ok: true, provider, latencyMs:elapsed, ...result };
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

  app.post<{
    Body: {
      pairingCode: string;
      name: string;
      platform: string;
      arch: string;
      capabilities?: string[];
      metadata?: Record<string, unknown>;
    };
  }>("/api/v1/agents/register", async (request, reply) => {
    try {
      const result = devices.register(request.body);
      events.publish("device.paired", {
        id: result.id,
        name: request.body.name,
        platform: request.body.platform
      });
      store.audit("device", "device.paired", {
        id: result.id,
        name: request.body.name
      });
      return result;
    } catch (error) {
      return reply.code(403).send({
        error: error instanceof Error ? error.message : "Device pairing failed"
      });
    }
  });

  app.post<{ Body: { metadata?: Record<string, unknown> } }>(
    "/api/v1/agents/heartbeat",
    async (request, reply) => {
      const deviceId = request.headers["x-jarvis-device-id"]?.toString() ?? "";
      const authorization = request.headers.authorization ?? "";
      const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : "";

      if (!deviceId || !token || !devices.authenticate(deviceId, token)) {
        return reply.code(401).send({ error: "Invalid device credentials" });
      }

      devices.heartbeat(deviceId, request.body?.metadata ?? {});
      events.publish("device.heartbeat", {
        id: deviceId,
        metadata: request.body?.metadata ?? {}
      });
      return { ok: true };
    }
  );

  app.get("/api/v1/agents/commands", async (request, reply) => {
    const deviceId = request.headers["x-jarvis-device-id"]?.toString() ?? "";
    const authorization = request.headers.authorization ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!deviceId || !token || !devices.authenticate(deviceId, token)) {
      return reply.code(401).send({ error: "Invalid device credentials" });
    }

    return { commands: devices.pendingCommands(deviceId) };
  });

  app.post<{
    Params: { id: string };
    Body: { ok: boolean; result?: unknown };
  }>("/api/v1/agents/commands/:id/result", async (request, reply) => {
    const deviceId = request.headers["x-jarvis-device-id"]?.toString() ?? "";
    const authorization = request.headers.authorization ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!deviceId || !token || !devices.authenticate(deviceId, token)) {
      return reply.code(401).send({ error: "Invalid device credentials" });
    }

    const ok = devices.completeCommand(
      deviceId,
      request.params.id,
      request.body.ok,
      request.body.result ?? null
    );

    events.publish("device.command.result", {
      deviceId,
      commandId: request.params.id,
      ok: request.body.ok,
      result: request.body.result ?? null
    });

    return { ok };
  });

  app.get<{ Params: { id: string } }>("/api/v1/devices/:id/commands", async (request) => {
    permissions.assertAllowed("devices.read");
    return { commands: devices.listCommands(request.params.id) };
  });

  app.post<{
    Params: { id: string };
    Body: { command: string; args?: Record<string, unknown> };
  }>("/api/v1/devices/:id/commands", async (request, reply) => {
    try {
      permissions.assertAllowed("devices.manage");
      const command = devices.enqueueCommand(
        request.params.id,
        request.body.command,
        request.body.args ?? {}
      );
      events.publish("device.command.queued", command);
      return { ok: true, command };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to queue command";
      return reply.code(message.startsWith("Permission") ? 403 : 400).send({
        ok: false,
        error: message
      });
    }
  });

  app.get("/api/v1/devices", async () => {
    permissions.assertAllowed("devices.read");
    return { devices: devices.list() };
  });

  app.post<{ Params: { id: string } }>(
    "/api/v1/devices/:id/revoke",
    async (request, reply) => {
      try {
        permissions.assertAllowed("devices.manage");
        const ok = devices.revoke(request.params.id);
        if (ok) events.publish("device.revoked", { id: request.params.id });
        return { ok };
      } catch (error) {
        return reply.code(403).send({
          ok: false,
          error: error instanceof Error ? error.message : "Permission denied"
        });
      }
    }
  );

  app.get<{ Querystring: { q?: string; limit?: string } }>("/api/v1/conversations", async (request) => ({
    conversations: request.query.q
      ? store.searchConversations(
          request.query.q,
          Math.max(1,Math.min(500,Number(request.query.limit ?? 50)))
        )
      : store.listConversations(
          Math.max(1,Math.min(500,Number(request.query.limit ?? 50)))
        )
  }));

  app.get<{ Params: { id: string } }>("/api/v1/conversations/:id/messages", async (request) => ({
    messages: store.conversationMessages(request.params.id, 100)
  }));

  app.get<{ Params: { id: string } }>("/api/v1/conversations/:id/export", async (request, reply) => {
    const exported=store.exportConversation(request.params.id);
    if(!exported) return reply.code(404).send({error:"Conversation not found"});
    return exported;
  });

  app.delete<{ Params: { id: string } }>("/api/v1/conversations/:id", async (request) => ({
    ok: store.deleteConversation(request.params.id)
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

  app.post<{ Params: { id: string } }>("/api/v1/timers/:id/pause", async (request) => ({
    ok: store.pauseTimer(Number(request.params.id))
  }));
  app.post<{ Params: { id: string } }>("/api/v1/timers/:id/resume", async (request) => ({
    ok: store.resumeTimer(Number(request.params.id))
  }));
  app.post<{ Params: { id: string }; Body: { deltaMs: number } }>("/api/v1/timers/:id/add-time", async (request) => ({
    ok: store.addTimerTime(Number(request.params.id), request.body.deltaMs)
  }));
  app.delete<{ Params: { id: string } }>("/api/v1/timers/:id", async (request) => ({
    ok: store.cancelTimer(Number(request.params.id))
  }));

  app.get("/api/v1/alarms", async () => ({ alarms: store.listAlarms() }));
  app.post<{ Body: { name?: string; fireAt: string; repeatRule?: string } }>("/api/v1/alarms", async (request) => ({
    alarm: store.createAlarm(request.body.name ?? "Alarm", request.body.fireAt, request.body.repeatRule)
  }));

  app.delete<{ Params: { id: string } }>("/api/v1/alarms/:id", async (request) => ({
    ok: store.deleteAlarm(Number(request.params.id))
  }));

  app.get<{ Querystring: { unreadOnly?: string } }>("/api/v1/notifications", async (request) => {
    permissions.assertAllowed("notifications.read");
    return {
      notifications: store.listNotifications(
        100,
        request.query.unreadOnly === "true"
      )
    };
  });

  app.post<{ Body: { title: string; body?: string; priority?: string; source?: string } }>(
    "/api/v1/notifications",
    async (request) => {
      permissions.assertAllowed("notifications.send");
      const notification = store.createNotification(
        request.body.title,
        request.body.body ?? "",
        request.body.priority ?? "normal",
        request.body.source ?? "api"
      );
      events.publish("notification.created", notification);
      return { notification };
    }
  );

  app.patch<{ Params: { id: string }; Body: { read: boolean } }>(
    "/api/v1/notifications/:id",
    async (request) => ({
      ok: store.markNotificationRead(Number(request.params.id), request.body.read)
    })
  );

  app.post<{ Params: { key: string }; Body: unknown }>(
    "/api/v1/routines/webhook/:key",
    async (request) => ({
      ok: true,
      results: await routines.triggerWebhook(request.params.key, request.body)
    })
  );

  app.get("/api/v1/routines", async () => ({ routines: store.listRoutines() }));
  app.get("/api/v1/routines/export", async () => ({ routines: store.exportRoutines() }));
  app.post<{ Body: { routines: Array<{ name:string; enabled?:boolean; trigger:unknown; actions:unknown[]; conditions?:unknown[] }> } }>(
    "/api/v1/routines/import",
    async (request) => ({
      routines: store.importRoutines(request.body.routines ?? [])
    })
  );
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

  app.post<{ Params: { id: string }; Body: { durationMs: number } }>("/api/v1/reminders/:id/snooze", async (request) => ({
    ok: store.snoozeReminder(Number(request.params.id), request.body.durationMs)
  }));
  app.delete<{ Params: { id: string } }>("/api/v1/reminders/:id", async (request) => ({
    ok: store.deleteReminder(Number(request.params.id))
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
      const started=Date.now();
      permissions.assertAllowed("assistant.chat");

      const supplied = request.body?.messages;

      if (supplied && supplied.length > 0) {
        const response = await agent.chat(supplied);
        const elapsed=Date.now()-started;
        metrics.ai.count++;
        metrics.ai.totalMs+=elapsed;
        metrics.ai.lastMs=elapsed;
        return {
          ...response,
          latencyMs:elapsed,
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

      const elapsed=Date.now()-started;
      metrics.ai.count++;
      metrics.ai.totalMs+=elapsed;
      metrics.ai.lastMs=elapsed;
      return {
        ...response,
        latencyMs:elapsed,
        conversationId
      };
    }
  );

  return app;
}
