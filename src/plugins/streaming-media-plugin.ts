import { z } from "zod";
import { config } from "../config.js";
import { SearxngIntegration } from "../integrations/searxng.js";
import type { BrowserAutomation } from "../browser/automation.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createStreamingMediaPlugin(browser:BrowserAutomation):JarvisPlugin{
  const search=new SearxngIntegration(config.searxngUrl);
  const ytMusicQueue:string[]=[];
  const soundCloudQueue:string[]=[];
  let ytMusicCurrent:string|null=null;
  let soundCloudCurrent:string|null=null;

  const siteSearch=(site:string,query:string,limit:number)=>search.search(
    `site:${site} ${query}`,
    {categories:"videos",limit}
  );

  return {
    id:"streaming-media",
    name:"Streaming Media",
    version:"0.1.0",
    description:"YouTube Music and SoundCloud search, browser playback and queue helpers.",
    tools:[
      {
        name:"youtube_music.search",
        description:"Search YouTube Music songs.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return siteSearch("music.youtube.com",value.query,value.limit);
        }
      },
      {
        name:"youtube_music.playlists",
        description:"Search YouTube Music playlists.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return siteSearch("music.youtube.com/playlist",value.query,value.limit);
        }
      },
      {
        name:"youtube_music.play",
        description:"Open a YouTube Music URL in the Jarvis browser.",
        capability:"media.control",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          ytMusicCurrent=value.url;
          return browser.open(value.url);
        }
      },
      {
        name:"youtube_music.queue.add",
        description:"Queue a YouTube Music URL.",
        capability:"media.control",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          ytMusicQueue.push(value.url);
          return {queue:[...ytMusicQueue]};
        }
      },
      {
        name:"youtube_music.current",
        description:"Read current YouTube Music URL and queue.",
        capability:"media.read",
        async execute(){return {current:ytMusicCurrent,queue:[...ytMusicQueue]};}
      },
      {
        name:"soundcloud.search",
        description:"Search SoundCloud tracks.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return siteSearch("soundcloud.com",value.query,value.limit);
        }
      },
      {
        name:"soundcloud.artists",
        description:"Search SoundCloud artists/users.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return siteSearch("soundcloud.com",`${value.query} artist`,value.limit);
        }
      },
      {
        name:"soundcloud.playlists",
        description:"Search SoundCloud playlists/sets.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(20).default(10)}).parse(input);
          return siteSearch("soundcloud.com",`${value.query} playlist`,value.limit);
        }
      },
      {
        name:"soundcloud.play",
        description:"Open a SoundCloud track in the Jarvis browser.",
        capability:"media.control",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          soundCloudCurrent=value.url;
          return browser.open(value.url);
        }
      },
      {
        name:"soundcloud.queue.add",
        description:"Queue a SoundCloud URL.",
        capability:"media.control",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          soundCloudQueue.push(value.url);
          return {queue:[...soundCloudQueue]};
        }
      },
      {
        name:"soundcloud.queue",
        description:"Read current SoundCloud URL and queue.",
        capability:"media.read",
        async execute(){return {current:soundCloudCurrent,queue:[...soundCloudQueue]};}
      },
      {
        name:"soundcloud.open",
        description:"Return an external SoundCloud URL.",
        capability:"media.read",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          return {url:value.url,external:true};
        }
      }
    ]
  };
}
