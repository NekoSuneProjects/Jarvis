import { OpenAiCompatibleProvider } from "./ai/openai-compatible.js";
import type { AiProvider, ChatRequest, ChatResponse } from "./ai/types.js";
import { config } from "./config.js";
import { createServer } from "./server.js";

type FallbackConfig={
  id?:string;
  baseUrl:string;
  apiKey?:string;
  model?:string;
};

class FallbackAiProvider implements AiProvider {
  readonly id:string;
  constructor(private readonly providers:AiProvider[]){
    if(!providers.length) throw new Error("At least one AI provider is required");
    this.id=providers.map((provider)=>provider.id).join(" -> ");
  }

  async chat(request:ChatRequest):Promise<ChatResponse>{
    const errors:string[]=[];
    for(const provider of this.providers){
      try{return await provider.chat(request);}
      catch(error){errors.push(`${provider.id}: ${error instanceof Error?error.message:String(error)}`);}
    }
    throw new Error(`All AI providers failed: ${errors.join(" | ")}`);
  }

  async health(){
    const results=await Promise.all(this.providers.map(async(provider)=>({
      id:provider.id,
      ...(await provider.health())
    })));
    return {
      ok:results.some((result)=>result.ok),
      detail:JSON.stringify(results)
    };
  }
}

let fallbackConfigs:FallbackConfig[]=[];
try{
  const parsed=JSON.parse(config.ai.fallbacksJson) as unknown;
  if(Array.isArray(parsed)) fallbackConfigs=parsed as FallbackConfig[];
}catch(error){
  console.warn("Invalid AI_FALLBACKS_JSON:",error);
}

const primary=new OpenAiCompatibleProvider();
const fallbacks=fallbackConfigs
  .filter((item)=>item?.baseUrl)
  .map((item)=>new OpenAiCompatibleProvider({
    id:item.id ?? "fallback",
    baseUrl:item.baseUrl,
    apiKey:item.apiKey ?? "",
    model:item.model ?? config.ai.model
  }));

const ai:AiProvider=fallbacks.length
  ? new FallbackAiProvider([primary,...fallbacks])
  : primary;

const server = await createServer(ai);

try {
  await server.listen({
    host: config.host,
    port: config.port
  });

  console.log(
    `NekoSune Jarvis is running at http://${config.host}:${config.port}`
  );
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
