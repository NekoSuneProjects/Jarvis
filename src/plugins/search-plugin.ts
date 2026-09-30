import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createSearchPlugin():JarvisPlugin{
  const search=new SearxngIntegration(config.searxngUrl);
  return {
    id:"search",
    name:"Web Search",
    version:"0.1.0",
    description:"SearXNG-backed real-time web search.",
    tools:[{
      name:"web.search",
      description:"Search the web through the configured SearXNG instance.",
      capability:"web.search",
      async execute(input){
        const value=z.object({
          query:z.string().min(1),
          categories:z.string().optional(),
          language:z.string().optional(),
          safesearch:z.union([z.literal(0),z.literal(1),z.literal(2)]).optional(),
          limit:z.number().int().min(1).max(50).default(10)
        }).parse(input);
        return {
          provider:"searxng",
          results:await search.search(value.query,value)
        };
      }
    }]
  };
}
