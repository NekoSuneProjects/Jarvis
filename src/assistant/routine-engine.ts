import type { AssistantStore } from "./store.js";
import type { EventBus, JarvisEvent } from "../events/event-bus.js";
import type { ToolRouter } from "../tools/tool-router.js";

export type RoutineAction =
  | { type:"tool"; tool:string; input?:unknown }
  | { type:"delay"; ms:number }
  | { type:"event"; event:string; payload?:unknown };

type RoutineRow = {
  id:number;
  name:string;
  enabled:number;
  trigger_json:string;
  actions_json:string;
  conditions_json:string;
};

type RoutineCondition = {
  path?:string;
  equals?:unknown;
  notEquals?:unknown;
  contains?:string;
};

export class RoutineEngine {
  private unsubscribe?:()=>void;
  private interval?:NodeJS.Timeout;
  private readonly running=new Set<number>();
  private readonly lastTimeRun=new Map<number,string>();

  constructor(
    private readonly store:AssistantStore,
    private readonly tools:ToolRouter,
    private readonly events:EventBus
  ) {}

  start(){
    if(this.unsubscribe) return;
    this.unsubscribe=this.events.subscribe((event)=>{
      void this.handleEvent(event);
    });
    this.interval=setInterval(()=>void this.checkTimeTriggers(),15000);
    void this.checkTimeTriggers();
  }

  stop(){
    this.unsubscribe?.();
    this.unsubscribe=undefined;
    if(this.interval) clearInterval(this.interval);
    this.interval=undefined;
  }

  private rows():RoutineRow[]{
    return this.store.listRoutines() as RoutineRow[];
  }

  private getPath(value:any,path?:string):unknown{
    if(!path) return value;
    return path.split(".").reduce((current:any,key)=>current?.[key],value);
  }

  private conditionsPass(row:RoutineRow,context:unknown):boolean{
    const conditions=JSON.parse(row.conditions_json || "[]") as RoutineCondition[];
    return conditions.every((condition)=>{
      const value=this.getPath(context,condition.path);
      if("equals" in condition && value!==condition.equals) return false;
      if("notEquals" in condition && value===condition.notEquals) return false;
      if(condition.contains!==undefined && !String(value ?? "").includes(condition.contains)) return false;
      return true;
    });
  }

  private mqttMatch(pattern:string,topic:string):boolean{
    const p=pattern.split("/");
    const t=topic.split("/");
    for(let i=0;i<p.length;i++){
      if(p[i]==="#") return true;
      if(t[i]===undefined) return false;
      if(p[i]!== "+" && p[i]!==t[i]) return false;
    }
    return p.length===t.length;
  }

  private async handleEvent(event:JarvisEvent){
    if(event.type.startsWith("routine.")) return;

    for(const row of this.rows()){
      if(!row.enabled || this.running.has(row.id)) continue;
      const trigger=JSON.parse(row.trigger_json || "{}") as any;
      let matches=false;

      if(trigger.type==="event"){
        matches=trigger.event===event.type;
      }else if(trigger.type==="mqtt" && event.type==="mqtt.message"){
        const topic=String((event.payload as any)?.topic ?? "");
        matches=this.mqttMatch(String(trigger.topic ?? ""),topic);
      }else if(trigger.type==="voice" && event.type==="voice.transcript"){
        const text=String((event.payload as any)?.text ?? "").toLowerCase();
        const phrase=String(trigger.phrase ?? "").toLowerCase();
        matches=Boolean(phrase) && (
          trigger.match==="exact" ? text.trim()===phrase.trim() : text.includes(phrase)
        );
      }

      if(matches && this.conditionsPass(row,event)){
        void this.run(row.id,{event});
      }
    }
  }

  private async checkTimeTriggers(){
    const now=new Date();
    const hhmm=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const dateKey=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}:${hhmm}`;

    for(const row of this.rows()){
      if(!row.enabled || this.running.has(row.id)) continue;
      const trigger=JSON.parse(row.trigger_json || "{}") as any;
      if(trigger.type!=="time" || trigger.at!==hhmm) continue;
      if(Array.isArray(trigger.days) && !trigger.days.includes(now.getDay())) continue;
      if(this.lastTimeRun.get(row.id)===dateKey) continue;
      this.lastTimeRun.set(row.id,dateKey);
      if(this.conditionsPass(row,{time:now.toISOString()})){
        void this.run(row.id,{time:now.toISOString()});
      }
    }
  }

  async triggerWebhook(key:string,payload:unknown){
    const matches=this.rows().filter((row)=>{
      if(!row.enabled) return false;
      const trigger=JSON.parse(row.trigger_json || "{}") as any;
      return trigger.type==="webhook" && trigger.key===key;
    });

    const results=[];
    for(const row of matches){
      if(this.conditionsPass(row,{payload})){
        results.push(await this.run(row.id,{webhook:key,payload}));
      }
    }
    return results;
  }

  async run(id:number,context:unknown={}){
    const row=this.store.getRoutine(id) as RoutineRow | undefined;
    if(!row) throw new Error("Routine not found");
    if(!row.enabled) throw new Error("Routine is disabled");
    if(this.running.has(id)) throw new Error("Routine is already running");
    if(!this.conditionsPass(row,context)) {
      return {id:row.id,name:row.name,skipped:true,reason:"conditions"};
    }

    this.running.add(id);
    this.events.publish("routine.started",{id:row.id,name:row.name});

    try{
      const actions=JSON.parse(row.actions_json) as RoutineAction[];
      const results:unknown[]=[];

      for(const action of actions){
        if(action.type==="delay"){
          const ms=Math.max(0,Math.min(action.ms,60*60*1000));
          await new Promise((resolve)=>setTimeout(resolve,ms));
          results.push({type:"delay",ms});
        }else if(action.type==="tool"){
          results.push(await this.tools.execute(action.tool,action.input));
        }else if(action.type==="event"){
          this.events.publish(action.event,action.payload ?? {});
          results.push({type:"event",event:action.event});
        }
      }

      this.events.publish("routine.completed",{id:row.id,name:row.name});
      this.store.audit("routine",`routine.run:${row.name}`,{id:row.id});
      return {id:row.id,name:row.name,results};
    }catch(error){
      this.events.publish("routine.failed",{
        id:row.id,
        name:row.name,
        error:error instanceof Error?error.message:String(error)
      });
      throw error;
    }finally{
      this.running.delete(id);
    }
  }
}
