import type { JarvisIntegration, IntegrationHealth, IntegrationState } from "./types.js";

export interface HomeAssistantOptions {
  baseUrl: string;
  token: string;
}

export class HomeAssistantIntegration implements JarvisIntegration {
  readonly id = "home-assistant";
  readonly name = "Home Assistant";
  readonly capabilities = ["smart-home.read", "smart-home.control"];
  state: IntegrationState = "disconnected";

  constructor(private readonly options: HomeAssistantOptions) {}

  private headers() {
    return {
      authorization: `Bearer ${this.options.token}`,
      "content-type": "application/json"
    };
  }

  private async request(path:string, init:RequestInit={}) {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/,"")}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init.headers ?? {}) }
    });
    if (!response.ok) throw new Error(`Home Assistant HTTP ${response.status}: ${await response.text()}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async connect(): Promise<void> {
    if (!this.options.baseUrl || !this.options.token) {
      this.state = "disabled";
      return;
    }
    this.state = "connecting";
    await this.request("/api/");
    this.state = "connected";
  }

  async disconnect(): Promise<void> {
    this.state = this.options.baseUrl ? "disconnected" : "disabled";
  }

  async health(): Promise<IntegrationHealth> {
    try {
      await this.request("/api/");
      return { ok: true };
    } catch (error) {
      return { ok:false, detail:error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async states() {
    return this.request("/api/states");
  }

  async entityState(entityId:string) {
    return this.request(`/api/states/${encodeURIComponent(entityId)}`);
  }

  async callService(domain:string, service:string, data:Record<string,unknown>={}) {
    return this.request(`/api/services/${encodeURIComponent(domain)}/${encodeURIComponent(service)}`, {
      method:"POST",
      body:JSON.stringify(data)
    });
  }

  async turnOn(entityId:string, data:Record<string,unknown>={}) {
    const domain=entityId.split(".")[0] ?? "homeassistant";
    return this.callService(domain,"turn_on",{entity_id:entityId,...data});
  }

  async turnOff(entityId:string) {
    const domain=entityId.split(".")[0] ?? "homeassistant";
    return this.callService(domain,"turn_off",{entity_id:entityId});
  }
}
