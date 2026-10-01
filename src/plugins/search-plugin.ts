import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { JarvisPlugin } from "./plugin-registry.js";

const common=z.object({
  query:z.string().min(1),
  language:z.string().optional(),
  safesearch:z.union([z.literal(0),z.literal(1),z.literal(2)]).optional(),
  limit:z.number().int().min(1).max(50).default(10),
  timeRange:z.enum(["day","month","year"]).optional()
});

export function createSearchPlugin():JarvisPlugin{
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
