export interface JarvisTool {
  name: string;
  description: string;
  capability: string;
  execute(input: unknown): Promise<unknown>;
}

export interface JarvisPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  tools: JarvisTool[];
}

export class PluginRegistry {
  private readonly plugins = new Map<string, JarvisPlugin>();

  register(plugin: JarvisPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin already registered: ${plugin.id}`);
    }

    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): JarvisPlugin | undefined {
    return this.plugins.get(id);
  }

  list(): JarvisPlugin[] {
    return [...this.plugins.values()];
  }

  tools(): JarvisTool[] {
    return this.list().flatMap((plugin) => plugin.tools);
  }
}
