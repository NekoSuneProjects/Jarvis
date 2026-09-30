import type { AssistantStore } from "./store.js";
import type { EventBus } from "../events/event-bus.js";
import type { ToolRouter } from "../tools/tool-router.js";

export type RoutineAction =
  | { type:"tool"; tool:string; input?:unknown }
  | { type:"delay"; ms:number }
  | { type:"event"; event:string; payload?:unknown };

export class RoutineEngine {
  constructor(
    private readonly store:AssistantStore,
    private readonly tools:ToolRouter,
    private readonly events:EventBus
  ) {}

  async run(id:number){
    const row=this.store.getRoutine(id) as {
      id:number;
      name:string;
      enabled:number;
      actions_json:string;
      conditions_json:string;
    } | undefined;

    if(!row) throw new Error("Routine not found");
    if(!row.enabled) throw new Error("Routine is disabled");

    const actions=JSON.parse(row.actions_json) as RoutineAction[];
    this.events.publish("routine.started",{id:row.id,name:row.name});

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
  }
}
