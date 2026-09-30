import { config } from "../config.js";
import type { AiProvider, ChatMessage } from "../ai/types.js";
import type { EventBus } from "../events/event-bus.js";
import type { AssistantStore } from "../assistant/store.js";
import type { ToolRouter } from "../tools/tool-router.js";

export class JarvisAgent {
  constructor(
    private readonly ai: AiProvider,
    private readonly tools: ToolRouter,
    private readonly events: EventBus,
    private readonly store: AssistantStore
  ) {}

  async chat(messages: ChatMessage[]) {
    const working: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are ${config.assistantName}, a helpful personal assistant. ` +
          "Use available tools when they are useful. Never claim a tool action succeeded unless the tool result confirms it. " +
          "If a tool reports that approval is required, explain which capability needs approval instead of pretending it ran."
      },
      ...messages
    ];

    this.events.publish("voice.thinking", {});
    const trace: Array<{ tool: string; ok: boolean; error?: string }> = [];

    for (let step = 0; step < 8; step++) {
      const response = await this.ai.chat({
        messages: working,
        tools: this.tools.aiDefinitions()
      });

      if (response.toolCalls.length === 0) {
        this.events.publish("voice.idle", {});
        return {
          content: response.content,
          model: response.model,
          provider: response.provider,
          trace
        };
      }

      working.push({
        role: "assistant",
        content: response.content,
        toolCalls: response.toolCalls
      });

      for (const call of response.toolCalls) {
        this.events.publish("tool.requested", {
          id: call.id,
          name: call.name,
          arguments: call.arguments
        });

        try {
          const result = await this.tools.execute(call.name, call.arguments);
          trace.push({ tool: call.name, ok: true });
          this.store.audit("agent", `tool:${call.name}`, call.arguments);
          this.events.publish("tool.completed", {
            id: call.id,
            name: call.name,
            result
          });

          working.push({
            role: "tool",
            toolCallId: call.id,
            content: JSON.stringify({ ok: true, result })
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Tool execution failed";
          trace.push({ tool: call.name, ok: false, error: message });
          this.events.publish("tool.failed", {
            id: call.id,
            name: call.name,
            error: message
          });

          working.push({
            role: "tool",
            toolCallId: call.id,
            content: JSON.stringify({
              ok: false,
              error: message,
              requiresApproval:
                message.startsWith("Permission requires approval:")
            })
          });
        }
      }
    }

    this.events.publish("voice.idle", {});
    return {
      content:
        "I reached the maximum number of tool steps for this request. Please narrow the request or check the tool permissions.",
      model: config.ai.model,
      provider: this.ai.id,
      trace
    };
  }
}
