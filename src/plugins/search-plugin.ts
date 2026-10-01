import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { JarvisPlugin } from "./plugin-registry.js";
import type { AiProvider } from "../ai/types.js";
import type { AssistantStore } from "../assistant/store.js";

const common=z.object({
  query:z.string().min(1),
  language:z.string().optional(),
  safesearch:z.union([z.literal(0),z.literal(1),z.literal(2)]).optional(),
  limit:z.number().int().min(1).max(50).default(10),
  timeRange:z.enum(["day","month","year"]).optional()
});

export function createSearchPlugin(ai:AiProvider,store:AssistantStore):JarvisPlugin{
  const search=new SearxngIntegration(config.searxngUrl);

  const run=(category?:string)=>(input:unknown)=>{
    const value=common.parse(input);
    return search.search(value.query,{
      categories:category,
      language:value.language,
      safesearch:value.safesearch,
      limit:value.limit,
      timeRange:value.timeRange
    });
  };

  const prefs=()=>store.getSetting<{blocked:string[];favorites:string[]}>("news.sources",{blocked:[],favorites:[]}) ?? {blocked:[],favorites:[]};
  const filterNews=(items:any[])=>{
    const p=prefs();
    const seen=new Set<string>();
    return items.filter((item)=>{
      let host="";
      try{host=new URL(item.url).hostname.replace(/^www\./,"");}catch{}
      if(p.blocked.some((source)=>host===source||host.endsWith(`.${source}`))) return false;
      const key=(item.url||item.title||"").toLowerCase();
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b)=>{
      const host=(item:any)=>{try{return new URL(item.url).hostname.replace(/^www\./,"");}catch{return "";}};
      const fav=(item:any)=>p.favorites.some((source)=>host(item)===source||host(item).endsWith(`.${source}`));
      return Number(fav(b))-Number(fav(a));
    });
  };

  return {
    id:"search",
    name:"Web Search",
    version:"0.2.0",
    description:"SearXNG-backed real-time web/news/image/video search.",
    tools:[
      {
        name:"web.search",
        description:"Search the general web through the configured SearXNG instance.",
        capability:"web.search",
        execute:run()
      },
      {
        name:"web.search.news",
        description:"Search recent news sources through SearXNG.",
        capability:"web.search",
        execute:run("news")
      },
      {
        name:"web.search.images",
        description:"Search images through SearXNG and return image/thumbnail metadata when available.",
        capability:"web.search",
        execute:run("images")
      },
      {
        name:"web.search.videos",
        description:"Search video sources through SearXNG.",
        capability:"web.search",
        execute:run("videos")
      },
      {
        name:"web.search.summarize",
        description:"Search the web and summarise the result set using the configured AI provider.",
        capability:"web.search",
        async execute(input){
          const value=common.extend({prompt:z.string().default("Summarise the key findings with source URLs.")}).parse(input);
          const results=await search.search(value.query,{language:value.language,safesearch:value.safesearch,limit:value.limit,timeRange:value.timeRange});
          const response=await ai.chat({messages:[{role:"user",content:`${value.prompt}\n\n${results.map((item,i)=>`[${i+1}] ${item.title}\n${item.url}\n${item.content??""}`).join("\n\n")}`}]});
          return {summary:response.content,results};
        }
      },
      {
        name:"news.sources",
        description:"Get or update blocked/favourite news sources.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({
            blocked:z.array(z.string()).optional(),
            favorites:z.array(z.string()).optional()
          }).parse(input??{});
          const current=prefs();
          const next={blocked:value.blocked??current.blocked,favorites:value.favorites??current.favorites};
          store.setSetting("news.sources",next);
          return next;
        }
      },
      {
        name:"news.briefing",
        description:"Create an AI-summarised deduplicated news briefing with source preferences.",
        capability:"web.search",
        async execute(input){
          const value=z.object({
            topics:z.array(z.string()).default(["technology","gaming","world"]),
            perTopic:z.number().int().min(1).max(20).default(8)
          }).parse(input??{});
          const gathered:any[]=[];
          for(const topic of value.topics){
            gathered.push(...await search.search(topic,{categories:"news",limit:value.perTopic,timeRange:"day"}));
          }
          const results=filterNews(gathered);
          const response=await ai.chat({messages:[{role:"user",content:`Create a concise daily news briefing from these results. Keep source URLs with each item.\n\n${results.map((item,i)=>`[${i+1}] ${item.title}\n${item.url}\n${item.content??""}`).join("\n\n")}`}]});
          return {briefing:response.content,results};
        }
      },
      {
        name:"web.search.site",
        description:"Search within a specific site/domain.",
        capability:"web.search",
        async execute(input){
          const value=common.extend({site:z.string().min(1)}).parse(input);
          return search.search(`site:${value.site} ${value.query}`,{
            language:value.language,
            safesearch:value.safesearch,
            limit:value.limit,
            timeRange:value.timeRange
          });
        }
      }
    ]
  };
}
