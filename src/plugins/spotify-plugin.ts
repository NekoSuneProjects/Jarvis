import { z } from "zod";
import { config } from "../config.js";
import { SpotifyIntegration } from "../integrations/spotify.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createSpotifyPlugin():JarvisPlugin{
  const spotify=new SpotifyIntegration(config.spotifyAccessToken);
  return {
    id:"spotify",
    name:"Spotify",
    version:"0.1.0",
    description:"Spotify search and playback controls using an OAuth access token.",
    tools:[
      {
        name:"spotify.current",
        description:"Read current Spotify playback.",
        capability:"media.read",
        async execute(){return spotify.currentPlayback();}
      },
      {
        name:"spotify.search",
        description:"Search Spotify.",
        capability:"media.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),type:z.string().default("track,artist,album,playlist"),limit:z.number().int().min(1).max(50).default(10)}).parse(input);
          return spotify.search(value.query,value.type,value.limit);
        }
      },
      {
        name:"spotify.play",
        description:"Start or resume Spotify playback.",
        capability:"media.control",
        async execute(input){
          const value=z.object({contextUri:z.string().optional(),uris:z.array(z.string()).optional()}).parse(input ?? {});
          return spotify.play(value.contextUri,value.uris);
        }
      },
      {
        name:"spotify.pause",
        description:"Pause Spotify playback.",
        capability:"media.control",
        async execute(){return spotify.pause();}
      },
      {
        name:"spotify.next",
        description:"Skip to the next Spotify track.",
        capability:"media.control",
        async execute(){return spotify.next();}
      },
      {
        name:"spotify.previous",
        description:"Go to the previous Spotify track.",
        capability:"media.control",
        async execute(){return spotify.previous();}
      },
      {
        name:"spotify.volume",
        description:"Set Spotify volume between 0 and 100.",
        capability:"media.control",
        async execute(input){
          const value=z.object({percent:z.number().min(0).max(100)}).parse(input);
          return spotify.volume(value.percent);
        }
      }
    ]
  };
}
