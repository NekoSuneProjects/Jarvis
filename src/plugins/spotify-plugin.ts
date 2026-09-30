import { z } from "zod";
import { config } from "../config.js";
import { SpotifyIntegration } from "../integrations/spotify.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createSpotifyPlugin():JarvisPlugin{
  const spotify=new SpotifyIntegration(config.spotifyAccessToken);
  return {
    id:"spotify",
    name:"Spotify",
    version:"0.2.0",
    description:"Spotify search, playback, queue, library and playlist controls using OAuth.",
    tools:[
      {name:"spotify.current",description:"Read current Spotify playback.",capability:"media.read",async execute(){return spotify.currentPlayback();}},
      {
        name:"spotify.search",description:"Search Spotify.",capability:"media.read",
        async execute(input){
          const v=z.object({query:z.string().min(1),type:z.string().default("track,artist,album,playlist"),limit:z.number().int().min(1).max(50).default(10)}).parse(input);
          return spotify.search(v.query,v.type,v.limit);
        }
      },
      {name:"spotify.play",description:"Start/resume Spotify playback.",capability:"media.control",async execute(input){const v=z.object({contextUri:z.string().optional(),uris:z.array(z.string()).optional()}).parse(input??{});return spotify.play(v.contextUri,v.uris);}},
      {name:"spotify.pause",description:"Pause Spotify playback.",capability:"media.control",async execute(){return spotify.pause();}},
      {name:"spotify.next",description:"Skip to the next track.",capability:"media.control",async execute(){return spotify.next();}},
      {name:"spotify.previous",description:"Go to the previous track.",capability:"media.control",async execute(){return spotify.previous();}},
      {name:"spotify.volume",description:"Set Spotify volume 0-100.",capability:"media.control",async execute(input){const v=z.object({percent:z.number().min(0).max(100)}).parse(input);return spotify.volume(v.percent);}},
      {name:"spotify.seek",description:"Seek current Spotify playback.",capability:"media.control",async execute(input){const v=z.object({positionMs:z.number().min(0)}).parse(input);return spotify.seek(v.positionMs);}},
      {name:"spotify.queue.add",description:"Add a track URI to the Spotify queue.",capability:"media.control",async execute(input){const v=z.object({uri:z.string().min(1)}).parse(input);return spotify.queue(v.uri);}},
      {name:"spotify.queue.read",description:"Read the current Spotify queue.",capability:"media.read",async execute(){return spotify.queueState();}},
      {name:"spotify.devices",description:"List Spotify Connect playback devices.",capability:"media.read",async execute(){return spotify.devices();}},
      {name:"spotify.transfer",description:"Transfer playback to a Spotify Connect device.",capability:"media.control",async execute(input){const v=z.object({deviceId:z.string().min(1),play:z.boolean().default(false)}).parse(input);return spotify.transfer(v.deviceId,v.play);}},
      {name:"spotify.recent",description:"Read recently played Spotify tracks.",capability:"media.read",async execute(input){const v=z.object({limit:z.number().int().min(1).max(50).default(20)}).parse(input??{});return spotify.recent(v.limit);}},
      {name:"spotify.liked",description:"Read liked/saved Spotify tracks.",capability:"media.read",async execute(input){const v=z.object({limit:z.number().int().min(1).max(50).default(20),offset:z.number().int().min(0).default(0)}).parse(input??{});return spotify.liked(v.limit,v.offset);}},
      {name:"spotify.like",description:"Save Spotify track IDs to the user's library.",capability:"media.control",async execute(input){const v=z.object({ids:z.array(z.string()).min(1).max(50)}).parse(input);return spotify.like(v.ids);}},
      {name:"spotify.unlike",description:"Remove Spotify track IDs from the user's library.",capability:"media.control",async execute(input){const v=z.object({ids:z.array(z.string()).min(1).max(50)}).parse(input);return spotify.unlike(v.ids);}},
      {
        name:"spotify.playlist.create",description:"Create a Spotify playlist.",capability:"media.control",
        async execute(input){
          const v=z.object({name:z.string().min(1),description:z.string().default(""),public:z.boolean().default(false)}).parse(input);
          const me=await spotify.me() as any;
          return spotify.createPlaylist(me.id,v.name,v.description,v.public);
        }
      },
      {name:"spotify.playlist.add",description:"Add track URIs to a Spotify playlist.",capability:"media.control",async execute(input){const v=z.object({playlistId:z.string().min(1),uris:z.array(z.string()).min(1).max(100)}).parse(input);return spotify.addPlaylistItems(v.playlistId,v.uris);}},
      {name:"spotify.playlist.remove",description:"Remove track URIs from a Spotify playlist.",capability:"media.control",async execute(input){const v=z.object({playlistId:z.string().min(1),uris:z.array(z.string()).min(1).max(100)}).parse(input);return spotify.removePlaylistItems(v.playlistId,v.uris);}}
    ]
  };
}
