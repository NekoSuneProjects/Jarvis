import { EventEmitter } from "node:events";

export interface JarvisEvent<T = unknown> {
  type: string;
  at: string;
  payload: T;
}

export class EventBus {
  private readonly emitter = new EventEmitter();

  publish<T>(type: string, payload: T): void {
    const event: JarvisEvent<T> = {
      type,
      at: new Date().toISOString(),
      payload
    };

    this.emitter.emit("event", event);
    this.emitter.emit(type, event);
  }

  subscribe(listener: (event: JarvisEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }
}
