import mqtt, { type MqttClient } from "mqtt";
import type { EventBus } from "../events/event-bus.js";
import type { JarvisIntegration, IntegrationHealth, IntegrationState } from "./types.js";

export interface MqttOptions {
  url: string;
  username?: string;
  password?: string;
}

export class MqttIntegration implements JarvisIntegration {
  readonly id = "mqtt";
  readonly name = "MQTT";
  readonly capabilities = ["mqtt.publish", "mqtt.subscribe"];
  state: IntegrationState = "disconnected";
  private client?: MqttClient;

  constructor(private readonly options:MqttOptions, private readonly events:EventBus) {}

  async connect(): Promise<void> {
    if (!this.options.url) {
      this.state="disabled";
      return;
    }
    this.state="connecting";

    await new Promise<void>((resolve,reject)=>{
      const client=mqtt.connect(this.options.url,{
        username:this.options.username || undefined,
        password:this.options.password || undefined,
        reconnectPeriod:2000
      });
      this.client=client;

      const onError=(error:Error)=>{
        this.state="error";
        reject(error);
      };

      client.once("error",onError);
      client.once("connect",()=>{
        client.off("error",onError);
        this.state="connected";
        resolve();
      });
      client.on("message",(topic,payload)=>{
        this.events.publish("mqtt.message",{topic,payload:payload.toString("utf8")});
      });
      client.on("reconnect",()=>{this.state="connecting";});
      client.on("close",()=>{if(this.state!=="disabled") this.state="disconnected";});
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await new Promise<void>((resolve,reject)=>this.client!.end(false,{},(error)=>error?reject(error):resolve()));
    this.state="disconnected";
  }

  async health(): Promise<IntegrationHealth> {
    return {ok:this.state==="connected",detail:this.state};
  }

  publish(topic:string,payload:string,options:{retain?:boolean;qos?:0|1|2}={}):Promise<void>{
    if(!this.client?.connected) throw new Error("MQTT is not connected");
    return new Promise((resolve,reject)=>{
      this.client!.publish(topic,payload,options,(error)=>error?reject(error):resolve());
    });
  }

  subscribe(topic:string,qos:0|1|2=0):Promise<void>{
    if(!this.client?.connected) throw new Error("MQTT is not connected");
    return new Promise((resolve,reject)=>{
      this.client!.subscribe(topic,{qos},(error)=>error?reject(error):resolve());
    });
  }
}
