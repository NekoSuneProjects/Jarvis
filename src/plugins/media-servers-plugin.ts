import { z } from "zod";
import { config } from "../config.js";
import { JellyfinIntegration } from "../integrations/jellyfin.js";
import { PlexIntegration } from "../integrations/plex.js";
import { KodiIntegration } from "../integrations/kodi.js";
import { RadioIntegration } from "../integrations/radio.js";
import { LocalMusicIntegration } from "../integrations/local-music.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createMediaServersPlugin():JarvisPlugin{
  const jellyfin=new JellyfinIntegration(config.jellyfin.url,config.jellyfin.apiKey);
  const plex=new PlexIntegration(config.plex.url,config.plex.token);
  const kodi=new KodiIntegration(
    config.kodi.url,
    config.kodi.username,
    config.kodi.password
  );
  const radio=new RadioIntegration();
  const local=new LocalMusicIntegration(config.localMusicDir);

  return {
    id:"media-servers",
    name:"Media Servers",
    version:"0.1.0",
    description:"Jellyfin, Plex, Kodi, internet radio and local music tools.",
    tools:[
      {
        name:"jellyfin.search",
        description:"Search Jellyfin media.",
        capability:"media.read",
        parameters:{
          type:"object",
          properties:{query:{type:"string"},limit:{type:"integer",minimum:1,maximum:100}},
          required:["query"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(100).default(20)}).parse(input);
          return jellyfin.search(value.query,value.limit);
        }
      },
      {
        name:"jellyfin.sessions",
        description:"Read active Jellyfin sessions.",
        capability:"media.read",
        async execute(){return jellyfin.sessions();}
      },
      {
        name:"plex.search",
        description:"Search Plex media.",
        capability:"media.read",
        parameters:{
          type:"object",
          properties:{query:{type:"string"}},
          required:["query"],
          additionalProperties:false
        },
        async execute(input){
          const value=z.object({query:z.string().min(1)}).parse(input);
          return plex.search(value.query);
        }
      },
      {
        name:"plex.libraries",
        description:"List Plex libraries.",
        capability:"media.read",
        async execute(){return plex.libraries();}
      },
      {
        name:"plex.sessions",
        description:"Read active Plex sessions.",
        capability:"media.read",
        async execute(){return plex.sessions();}
      },
      {
        name:"kodi.status",
        description:"Read Kodi application and active player status.",
        capability:"media.read",
        async execute(){
          return {
            application:await kodi.properties(),
            players:await kodi.players()
          };
        }
      },
      {
        name:"kodi.play_pause",
        description:"Toggle or set Kodi playback state.",
        capability:"media.control",
        async execute(input){
          const value=z.object({playerId:z.number().int(),play:z.boolean().optional()}).parse(input);
          return kodi.playPause(value.playerId,value.play);
        }
      },
      {
        name:"kodi.stop",
        description:"Stop a Kodi player.",
        capability:"media.control",
        async execute(input){
          const value=z.object({playerId:z.number().int()}).parse(input);
          return kodi.stop(value.playerId);
        }
      },
      {
        name:"kodi.volume",
        description:"Set Kodi volume.",
        capability:"media.control",
        async execute(input){
          const value=z.object({volume:z.number().min(0).max(100)}).parse(input);
          return kodi.volume(value.volume);
        }
      },
      {
        name:"radio.search",
        description:"Search internet radio stations.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(100).default(20)}).parse(input);
          return radio.search(value.query,value.limit);
        }
      },
      {
        name:"radio.top",
        description:"List popular internet radio stations.",
        capability:"media.read",
        async execute(input){
          const value=z.object({limit:z.number().int().min(1).max(100).default(20)}).parse(input ?? {});
          return radio.top(value.limit);
        }
      },
      {
        name:"music.local.search",
        description:"Search the configured local music library.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(100).default(50)}).parse(input);
          return local.search(value.query,value.limit);
        }
      },
      {
        name:"music.local.scan",
        description:"Scan and read metadata from the configured local music library.",
        capability:"media.read",
        async execute(input){
          const value=z.object({limit:z.number().int().min(1).max(5000).default(1000)}).parse(input ?? {});
          return local.scan(value.limit);
        }
      }
    ]
  };
}
