import type { JarvisDatabase } from "../storage/database.js";

export interface JarvisTool {
  name: string;
  description: string;
  capability: string;
  parameters?: Record<string, unknown>;
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

  constructor(private readonly database?:JarvisDatabase) {}

  register(plugin: JarvisPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin already registered: ${plugin.id}`);
    }

    this.plugins.set(plugin.id, plugin);

    if(this.database){
      this.database.db.prepare(
        `INSERT INTO plugin_settings (plugin_id,enabled,updated_at)
         VALUES (?,1,?)
         ON CONFLICT(plugin_id) DO NOTHING`
      ).run(plugin.id,new Date().toISOString());
    }
  }

  get(id: string): JarvisPlugin | undefined {
    return this.plugins.get(id);
  }

  isEnabled(id:string):boolean {
    if(!this.plugins.has(id)) return false;
    if(!this.database) return true;
    const row=this.database.db.prepare(
      "SELECT enabled FROM plugin_settings WHERE plugin_id=?"
    ).get(id) as {enabled:number}|undefined;
    return row ? Boolean(row.enabled) : true;
  }

  setEnabled(id:string,enabled:boolean):void {
    if(!this.plugins.has(id)) throw new Error(`Unknown plugin: ${id}`);
    if(!this.database) return;
    this.database.db.prepare(
      `INSERT INTO plugin_settings (plugin_id,enabled,updated_at)
       VALUES (?,?,?)
       ON CONFLICT(plugin_id) DO UPDATE SET
         enabled=excluded.enabled,
         updated_at=excluded.updated_at`
    ).run(id,enabled?1:0,new Date().toISOString());
  }

  list(): JarvisPlugin[] {
    return [...this.plugins.values()];
  }

  listStatus(){
    return this.list().map((plugin)=>({
      ...plugin,
      enabled:this.isEnabled(plugin.id)
    }));
  }

  tools(): JarvisTool[] {
    return this.list()
      .filter((plugin)=>this.isEnabled(plugin.id))
      .flatMap((plugin) => plugin.tools);
  }
}
