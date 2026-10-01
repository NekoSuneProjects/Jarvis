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
        name:"jellyfin.browse",
        description:"Browse Jellyfin media.",
        capability:"media.read",
        async execute(input){
          const value=z.object({limit:z.number().int().min(1).max(500).default(100)}).parse(input ?? {});
          return jellyfin.browse(value.limit);
        }
      },
      {
        name:"jellyfin.latest",
        description:"Read recently added Jellyfin media.",
        capability:"media.read",
        async execute(input){
          const value=z.object({limit:z.number().int().min(1).max(100).default(20)}).parse(input ?? {});
          return jellyfin.latest(value.limit);
        }
      },
      {
        name:"jellyfin.resume",
        description:"Read continue-watching items for a Jellyfin user.",
        capability:"media.read",
        async execute(input){
          const value=z.object({userId:z.string().min(1),limit:z.number().int().min(1).max(100).default(20)}).parse(input);
          return jellyfin.resume(value.userId,value.limit);
        }
      },
      {
        name:"jellyfin.users",
        description:"List Jellyfin user profiles.",
        capability:"media.read",
        async execute(){return jellyfin.users();}
      },
      {
        name:"jellyfin.libraries",
        description:"Read Jellyfin library status.",
        capability:"media.read",
        async execute(){return jellyfin.libraries();}
      },
      {
        name:"jellyfin.play",
        description:"Play one or more Jellyfin items on a selected active session/device.",
        capability:"media.control",
        async execute(input){
          const value=z.object({sessionId:z.string().min(1),itemIds:z.array(z.string().min(1)).min(1)}).parse(input);
          return jellyfin.play(value.sessionId,value.itemIds);
        }
      },
      {
        name:"jellyfin.pause",
        description:"Pause a Jellyfin playback session.",
        capability:"media.control",
        async execute(input){const value=z.object({sessionId:z.string().min(1)}).parse(input);return jellyfin.playbackCommand(value.sessionId,"Pause");}
      },
      {
        name:"jellyfin.resume_playback",
        description:"Resume a Jellyfin playback session.",
        capability:"media.control",
        async execute(input){const value=z.object({sessionId:z.string().min(1)}).parse(input);return jellyfin.playbackCommand(value.sessionId,"Unpause");}
      },
      {
        name:"jellyfin.stop",
        description:"Stop a Jellyfin playback session.",
        capability:"media.control",
        async execute(input){const value=z.object({sessionId:z.string().min(1)}).parse(input);return jellyfin.playbackCommand(value.sessionId,"Stop");}
      },
      {
        name:"jellyfin.sessions",
        description:"Read active Jellyfin sessions.",
        capability:"media.read",
        async execute(){return jellyfin.sessions();}
      },
      {
        name:"plex.discover",
        description:"Discover Plex resources/servers for the configured account token.",
        capability:"media.read",
        async execute(){return plex.discoverServers();}
      },
      {
        name:"plex.recent",
        description:"Read recently added Plex media.",
        capability:"media.read",
        async execute(input){const value=z.object({limit:z.number().int().min(1).max(100).default(20)}).parse(input??{});return plex.recentlyAdded(value.limit);}
      },
      {
        name:"plex.continue",
        description:"Read Plex continue-watching hub.",
        capability:"media.read",
        async execute(){return plex.continueWatching();}
      },
      {
        name:"plex.clients",
        description:"List Plex player clients known to the server.",
        capability:"media.read",
        async execute(){return plex.clients();}
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
        name:"kodi.navigate",
        description:"Send a Kodi navigation action.",
        capability:"media.control",
        async execute(input){
          const value=z.object({action:z.enum(["up","down","left","right","select","back","home","info","contextmenu"])}).parse(input);
          return kodi.input(value.action);
        }
      },
      {
        name:"kodi.search",
        description:"Search Kodi movie, episode and music libraries.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(200).default(50)}).parse(input);
          return kodi.search(value.query,value.limit);
        }
      },
      {
        name:"kodi.open",
        description:"Open/play a Kodi file or library item.",
        capability:"media.control",
        async execute(input){
          const value=z.object({
            file:z.string().optional(),
            movieid:z.number().int().optional(),
            episodeid:z.number().int().optional(),
            songid:z.number().int().optional()
          }).refine((v)=>Boolean(v.file||v.movieid!==undefined||v.episodeid!==undefined||v.songid!==undefined),"Provide a Kodi item").parse(input);
          return kodi.open(value);
        }
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
