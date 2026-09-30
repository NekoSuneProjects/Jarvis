export type IntegrationState = "disabled" | "disconnected" | "connecting" | "connected" | "error";

export interface IntegrationHealth {
  ok: boolean;
  detail?: string;
}

export interface JarvisIntegration {
  readonly id: string;
  readonly name: string;
  readonly capabilities: string[];
  state: IntegrationState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  health(): Promise<IntegrationHealth>;
}
