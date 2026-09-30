import { config } from "../config.js";
import type { AiProvider, ChatRequest, ChatResponse } from "./types.js";

type CompletionResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
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
          messages: request.messages,
          temperature: request.temperature ?? config.ai.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`AI request failed (${response.status}): ${body.slice(0, 500)}`);
      }

      const data = (await response.json()) as CompletionResponse;
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("AI provider returned an empty response");
      }

      return {
        content,
        model: data.model ?? config.ai.model,
        provider: this.id
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
