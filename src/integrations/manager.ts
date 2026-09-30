import type { JarvisIntegration } from "./types.js";

export class IntegrationManager {
  private readonly integrations = new Map<string, JarvisIntegration>();

  register(integration: JarvisIntegration): void {
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration already registered: ${integration.id}`);
    }
    this.integrations.set(integration.id, integration);
  }

  get(id:string) {
    return this.integrations.get(id);
  }

  list() {
    return [...this.integrations.values()];
  }

  async connectEnabled(): Promise<void> {
    for (const integration of this.integrations.values()) {
      try {
        await integration.connect();
      } catch {
        integration.state = "error";
      }
    }
  }

  async disconnectAll(): Promise<void> {
    await Promise.allSettled([...this.integrations.values()].map((item) => item.disconnect()));
  }
}
