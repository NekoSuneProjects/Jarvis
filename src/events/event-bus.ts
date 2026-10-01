import { EventEmitter } from "node:events";

export interface JarvisEvent<T = unknown> {
  type: string;
  at: string;
  payload: T;
}

export class EventBus {
  private readonly emitter = new EventEmitter();
  private readonly history:JarvisEvent[]=[];

  publish<T>(type: string, payload: T): void {
    const event: JarvisEvent<T> = {
      type,
      at: new Date().toISOString(),
      payload
    };

    this.history.push(event as JarvisEvent);
    if(this.history.length>2000) this.history.splice(0,this.history.length-2000);
    this.emitter.emit("event", event);
    this.emitter.emit(type, event);
  }

  subscribe(listener: (event: JarvisEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }

  recent(limit=100,type?:string):JarvisEvent[]{
    const rows=type?this.history.filter((event)=>event.type===type):this.history;
    return rows.slice(-Math.max(1,Math.min(limit,2000)));
  }

  clearHistory():void{
    this.history.length=0;
  }
}
