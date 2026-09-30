export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
}

export interface AiProvider {
  readonly id: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  health(): Promise<{ ok: boolean; detail?: string }>;
}
