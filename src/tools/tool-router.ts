import type { AiToolDefinition } from "../ai/types.js";
import type { JarvisTool, PluginRegistry } from "../plugins/plugin-registry.js";
import { PermissionManager } from "../permissions/permission-manager.js";

interface RegisteredTool {
  tool:JarvisTool;
  pluginId:string;
}

export class ToolRouter {
  private readonly tools = new Map<string, RegisteredTool>();

  constructor(
    private readonly permissions: PermissionManager,
    private readonly plugins:PluginRegistry
  ) {}

  register(tool: JarvisTool,pluginId:string): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, {tool,pluginId});
  }

  registerMany(tools: JarvisTool[],pluginId:string): void {
    for (const tool of tools) {
      this.register(tool,pluginId);
    }
  }

  private enabledEntries(){
    return [...this.tools.values()].filter(({pluginId})=>this.plugins.isEnabled(pluginId));
  }

  list(): Array<Pick<JarvisTool, "name" | "description" | "capability" | "parameters"> & {pluginId:string}> {
    return this.enabledEntries().map(
      ({tool:{name, description, capability, parameters},pluginId}) => ({
        name,
        description,
        capability,
        parameters,
        pluginId
      })
    );
  }

  aiDefinitions(): AiToolDefinition[] {
    return this.enabledEntries().map(({tool}) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? {
        type: "object",
        additionalProperties: true
      }
    }));
  }

  async execute(name: string, input: unknown): Promise<unknown> {
    const registered = this.tools.get(name);

    if (!registered) {
      throw new Error(`Unknown tool: ${name}`);
    }

    if(!this.plugins.isEnabled(registered.pluginId)){
      throw new Error(`Plugin disabled: ${registered.pluginId}`);
    }

    this.permissions.assertToolAllowed(name,registered.tool.capability);
    return registered.tool.execute(input);
  }
}
