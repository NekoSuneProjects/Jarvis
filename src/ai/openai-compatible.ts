import { config } from "../config.js";
import type {
  AiProvider,
  AiToolCall,
  ChatMessage,
  ChatRequest,
  ChatResponse
} from "./types.js";

type CompletionResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        id?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }>;
};

export class OpenAiCompatibleProvider implements AiProvider {
  public readonly id = config.ai.provider;

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    if (config.ai.apiKey) {
      headers.authorization = `Bearer ${config.ai.apiKey}`;
    }

    return headers;
  }

  private wireMessage(message: ChatMessage) {
    if (message.role === "tool") {
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.toolCallId
      };
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments)
          }
        }))
      };
    }

    return {
      role: message.role,
      content: message.content
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ai.timeoutMs);

    try {
      const response = await fetch(`${config.ai.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        signal: controller.signal,
        body: JSON.stringify({
          model: config.ai.model,
          messages: request.messages.map((message) => this.wireMessage(message)),
          temperature: request.temperature ?? config.ai.temperature,
          stream: false,
          ...(request.tools?.length
            ? {
                tools: request.tools.map((tool) => ({
                  type: "function",
                  function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                  }
                })),
                tool_choice: "auto"
              }
            : {})
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`AI request failed (${response.status}): ${body.slice(0, 500)}`);
      }

      const data = (await response.json()) as CompletionResponse;
      const message = data.choices?.[0]?.message;
      const toolCalls: AiToolCall[] = (message?.tool_calls ?? [])
        .filter((call) => call.function?.name)
        .map((call, index) => {
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(call.function?.arguments || "{}") as Record<string, unknown>;
          } catch {
            parsed = {};
          }
          return {
            id: call.id ?? `tool_call_${index}`,
            name: call.function!.name!,
            arguments: parsed
          };
        });

      const content = message?.content?.trim() ?? "";

      if (!content && toolCalls.length === 0) {
        throw new Error("AI provider returned an empty response");
      }

      return {
        content,
        model: data.model ?? config.ai.model,
        provider: this.id,
        toolCalls
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${config.ai.baseUrl}/models`, {
          headers: this.headers(),
          signal: controller.signal
        });

        if (!response.ok) {
          return { ok: false, detail: `HTTP ${response.status}` };
        }

        return { ok: true };
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
