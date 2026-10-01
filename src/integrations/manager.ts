import type { EventBus } from "../events/event-bus.js";
import type { JarvisIntegration } from "./types.js";

type IntegrationLog = {
  at:string;
  integrationId:string;
  level:"info"|"warn"|"error";
  message:string;
};

export class IntegrationManager {
  private readonly integrations = new Map<string, JarvisIntegration>();
  private readonly logs:IntegrationLog[]=[];
  private readonly pollers=new Map<string,NodeJS.Timeout>();
  private reconnectAttempts=0;
  private reconnectSuccesses=0;

  constructor(private readonly events?:EventBus) {}

  private log(integrationId:string,level:IntegrationLog["level"],message:string){
    const entry={at:new Date().toISOString(),integrationId,level,message};
    this.logs.push(entry);
    if(this.logs.length>1000) this.logs.splice(0,this.logs.length-1000);
    this.events?.publish("integration.log",entry);
    if(level==="error"){
      this.events?.publish("integration.error",{integrationId,message});
      this.events?.publish("notification.created",{
        title:`Integration error: ${integrationId}`,
        body:message,
        priority:"high",
        source:"integration"
      });
    }
  }

  register(integration: JarvisIntegration): void {
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration already registered: ${integration.id}`);
    }
    this.integrations.set(integration.id, integration);
    this.log(integration.id,"info","registered");
  }

  get(id:string) {
    return this.integrations.get(id);
  }

  list() {
    return [...this.integrations.values()];
  }

  listLogs(integrationId?:string,limit=200){
    const rows=integrationId?this.logs.filter((row)=>row.integrationId===integrationId):this.logs;
    return rows.slice(-Math.max(1,Math.min(limit,1000)));
  }

  async connectOne(id:string):Promise<void>{
    const integration=this.integrations.get(id);
    if(!integration) throw new Error(`Unknown integration: ${id}`);
    this.log(id,"info","connecting");
    try{
      await integration.connect();
      this.log(id,"info",`state=${integration.state}`);
    }catch(error){
      integration.state="error";
      const message=error instanceof Error?error.message:String(error);
      this.log(id,"error",message);
      throw error;
    }
  }

  async reconnect(id:string):Promise<void>{
    this.reconnectAttempts++;
    const integration=this.integrations.get(id);
    if(!integration) throw new Error(`Unknown integration: ${id}`);
    try{await integration.disconnect();}catch{}
    await this.connectOne(id);
    this.reconnectSuccesses++;
  }

  reconnectMetrics(){
    return {
      attempts:this.reconnectAttempts,
      successes:this.reconnectSuccesses,
      failures:this.reconnectAttempts-this.reconnectSuccesses
    };
  }

  async connectEnabled(): Promise<void> {
    for (const integration of this.integrations.values()) {
      try {
        await this.connectOne(integration.id);
      } catch {
        // connectOne already records state/log/error notification.
      }
    }
  }

  schedulePolling(id:string,intervalMs:number,fn:()=>Promise<void>|void){
    this.stopPolling(id);
    const ms=Math.max(1000,intervalMs);
    const timer=setInterval(async()=>{
      try{await fn();}
      catch(error){
        this.log(id,"error",error instanceof Error?error.message:String(error));
      }
    },ms);
    this.pollers.set(id,timer);
    this.log(id,"info",`scheduled polling every ${ms}ms`);
  }

  stopPolling(id:string){
    const timer=this.pollers.get(id);
    if(timer) clearInterval(timer);
    this.pollers.delete(id);
  }

  async disconnectAll(): Promise<void> {
    for(const id of this.pollers.keys()) this.stopPolling(id);
    await Promise.allSettled([...this.integrations.values()].map(async(item)=>{
      try{
        await item.disconnect();
        this.log(item.id,"info","disconnected");
      }catch(error){
        this.log(item.id,"warn",error instanceof Error?error.message:String(error));
      }
    }));
  }
}
