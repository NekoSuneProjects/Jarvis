export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface AiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  toolCallId?: string;
  toolCalls?: AiToolCall[];
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  tools?: AiToolDefinition[];
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  toolCalls: AiToolCall[];
}

export interface AiProvider {
  readonly id: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}
