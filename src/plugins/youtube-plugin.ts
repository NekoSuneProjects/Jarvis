import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createYoutubePlugin():JarvisPlugin{
  const search=new SearxngIntegration(config.searxngUrl);
  const queue:string[]=[];
  return {
    id:"youtube",
    name:"YouTube",
    version:"0.1.0",
    description:"Search YouTube through SearXNG and return playable video links.",
    tools:[
      {
        name:"youtube.metadata",
        description:"Read public YouTube video and channel metadata through oEmbed.",
        capability:"media.read",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          const endpoint=new URL("https://www.youtube.com/oembed");
          endpoint.searchParams.set("url",value.url);
          endpoint.searchParams.set("format","json");
          const response=await fetch(endpoint,{signal:AbortSignal.timeout(10000)});
          if(!response.ok) throw new Error(`YouTube oEmbed HTTP ${response.status}`);
          return response.json();
        }
      },
      {
        name:"youtube.playlists.search",
        description:"Search public YouTube playlists through SearXNG.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return search.search(`site:youtube.com/playlist ${value.query}`,{categories:"videos",limit:value.limit});
        }
      },
      {
        name:"youtube.queue.add",
        description:"Add a YouTube URL to Jarvis's lightweight queue.",
        capability:"media.control",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          queue.push(value.url);
          return {queue:[...queue]};
        }
      },
      {
        name:"youtube.queue",
        description:"Read the queued YouTube URLs.",
        capability:"media.read",
        async execute(){return {queue:[...queue]};}
      },
      {
        name:"youtube.open",
        description:"Return/openable YouTube URL and optional seek URL.",
        capability:"media.read",
        async execute(input){
          const value=z.object({url:z.string().url(),startSeconds:z.number().int().min(0).optional()}).parse(input);
          const url=new URL(value.url);
          if(value.startSeconds!==undefined) url.searchParams.set("t",String(value.startSeconds));
          return {url:url.toString(),external:true};
        }
      },
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
