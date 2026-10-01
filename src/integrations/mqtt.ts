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
  private readonly seenTopics=new Map<string,{payload:string;at:string}>();

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
        const text=payload.toString("utf8");
        this.seenTopics.set(topic,{payload:text,at:new Date().toISOString()});
        if(this.seenTopics.size>2000){
          const first=this.seenTopics.keys().next().value;
          if(first) this.seenTopics.delete(first);
        }
        this.events.publish("mqtt.message",{topic,payload:text});
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

  topics(prefix=""){
    return [...this.seenTopics.entries()]
      .filter(([topic])=>!prefix || topic.startsWith(prefix))
      .map(([topic,value])=>({topic,...value}))
      .sort((a,b)=>b.at.localeCompare(a.at));
  }

  async discoverHomeAssistant(){
    await this.subscribe("homeassistant/#",0);
    return {ok:true,topic:"homeassistant/#"};
  }

  publishJarvisState(state:Record<string,unknown>){
    return this.publish("jarvis/state",JSON.stringify(state),{retain:true,qos:1});
  }

  publishVoiceEvent(event:string,payload:unknown){
    return this.publish(`jarvis/voice/${event}`,JSON.stringify(payload ?? {}),{retain:false,qos:0});
  }

  subscribe(topic:string,qos:0|1|2=0):Promise<void>{
    if(!this.client?.connected) throw new Error("MQTT is not connected");
    return new Promise((resolve,reject)=>{
      this.client!.subscribe(topic,{qos},(error)=>error?reject(error):resolve());
    });
  }
}
