import type { AiToolDefinition } from "../ai/types.js";
import type { JarvisTool } from "../plugins/plugin-registry.js";
import { PermissionManager } from "../permissions/permission-manager.js";

export class ToolRouter {
  private readonly tools = new Map<string, JarvisTool>();

  constructor(private readonly permissions: PermissionManager) {}

  register(tool: JarvisTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  registerMany(tools: JarvisTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  list(): Array<Pick<JarvisTool, "name" | "description" | "capability" | "parameters">> {
    return [...this.tools.values()].map(
      ({ name, description, capability, parameters }) => ({
        name,
        description,
        capability,
        parameters
      })
    );
  }

  aiDefinitions(): AiToolDefinition[] {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? {
        type: "object",
        additionalProperties: true
      }
    }));
  }

  async execute(name: string, input: unknown): Promise<unknown> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    this.permissions.assertAllowed(tool.capability);
    return tool.execute(input);
  }
}
