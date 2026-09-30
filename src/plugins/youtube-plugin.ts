import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createYoutubePlugin():JarvisPlugin{
  const search=new SearxngIntegration(config.searxngUrl);
  return {
    id:"youtube",
    name:"YouTube",
    version:"0.1.0",
    description:"Search YouTube through SearXNG and return playable video links.",
    tools:[
      {
        name:"youtube.search",
        description:"Search YouTube videos without a YouTube API key.",
        capability:"media.read",
        parameters:{
          type:"object",
          properties:{
            query:{type:"string"},
            limit:{type:"integer",minimum:1,maximum:20}
          },
          required:["query"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          const results=await search.search(`site:youtube.com/watch ${value.query}`,{
            categories:"videos",
            limit:value.limit
          });
          return results.filter((item)=>/youtube\.com\/watch|youtu\.be\//i.test(item.url));
        }
      }
    ]
  };
}
