import { config } from "../config.js";
import { fetchWithRetry } from "../utils/http.js";
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
      const response = await fetchWithRetry(`${config.ai.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        signal: controller.signal,
        body: JSON.stringify({
          model: request.model ?? config.ai.model,
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
        model: data.model ?? request.model ?? config.ai.model,
        provider: this.id,
        toolCalls
      };
    } finally {
      clearTimeout(timeout);
    }
  }


  async models() {
    const response = await fetchWithRetry(`${config.ai.baseUrl}/models`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`AI model discovery failed (HTTP ${response.status})`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id?: string; owned_by?: string; created?: number }>;
    };

    return (data.data ?? [])
      .filter((model) => Boolean(model.id))
      .map((model) => ({
        id: model.id!,
        ownedBy: model.owned_by,
        created: model.created
      }));
  }

  async embeddings(input: string | string[], model?: string) {
    const response = await fetchWithRetry(`${config.ai.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      signal: AbortSignal.timeout(config.ai.timeoutMs),
      body: JSON.stringify({
        model: model ?? config.ai.model,
        input
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `AI embeddings failed (${response.status}): ${body.slice(0, 500)}`
      );
    }

    const data = (await response.json()) as {
      model?: string;
      data?: Array<{ embedding?: number[]; index?: number }>;
    };

    const rows = [...(data.data ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0)
    );

    return {
      model: data.model ?? model ?? config.ai.model,
      embeddings: rows.map((row) => row.embedding ?? []),
      provider: this.id
    };
  }


  async vision(prompt:string,images:Array<{mimeType:string;base64:string}>,model?:string):Promise<ChatResponse>{
    const response=await fetchWithRetry(`${config.ai.baseUrl}/chat/completions`,{
      method:"POST",
      headers:this.headers(),
      signal:AbortSignal.timeout(config.ai.timeoutMs),
      body:JSON.stringify({
        model:model ?? config.ai.model,
        messages:[{
          role:"user",
          content:[
            {type:"text",text:prompt},
            ...images.map((image)=>({
              type:"image_url",
              image_url:{
                url:`data:${image.mimeType};base64,${image.base64}`
              }
            }))
          ]
        }],
        stream:false
      })
    });

    if(!response.ok){
      const body=await response.text();
      throw new Error(`AI vision request failed (${response.status}): ${body.slice(0,500)}`);
    }

    const data=(await response.json()) as CompletionResponse;
    const content=data.choices?.[0]?.message?.content?.trim() ?? "";
    if(!content) throw new Error("AI provider returned an empty vision response");

    return {
      content,
      model:data.model ?? model ?? config.ai.model,
      provider:this.id,
      toolCalls:[]
    };
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetchWithRetry(`${config.ai.baseUrl}/models`, {
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
