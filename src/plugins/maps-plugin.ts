import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { JarvisPlugin } from "./plugin-registry.js";

type SavedLocation={name:string;latitude:number;longitude:number;address?:string};

async function geocode(query:string,limit=5){
  const url=new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q",query);
  url.searchParams.set("format","jsonv2");
  url.searchParams.set("limit",String(limit));
  const response=await fetch(url,{
    headers:{"user-agent":"NekoSuneJarvis/0.1"},
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  return response.json();
}

async function route(from:{latitude:number;longitude:number},to:{latitude:number;longitude:number},profile:"driving"|"walking"|"cycling"){
  const osrmProfile=profile==="driving"?"driving":"driving";
  const url=new URL(`https://router.project-osrm.org/route/v1/${osrmProfile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}`);
  url.searchParams.set("overview","false");
  url.searchParams.set("steps","true");
  const response=await fetch(url,{
    headers:{"user-agent":"NekoSuneJarvis/0.1"},
    signal:AbortSignal.timeout(20000)
  });
  if(!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
  const body=await response.json() as any;
  const first=body.routes?.[0];
  if(!first) throw new Error("No route found");
  return {
    provider:"osrm",
    profile,
    distanceMeters:first.distance,
    durationSeconds:first.duration,
    legs:first.legs ?? []
  };
}

export function createMapsPlugin(store:AssistantStore):JarvisPlugin{
  const readSaved=()=>store.getSetting<Record<string,SavedLocation>>("maps.savedLocations",{}) ?? {};
  const writeSaved=(value:Record<string,SavedLocation>)=>store.setSetting("maps.savedLocations",value);

  return {
    id:"maps",
    name:"Maps & Directions",
    version:"0.1.0",
    description:"OpenStreetMap geocoding, OSRM directions, travel time, distance and saved locations.",
    tools:[
      {
        name:"maps.geocode",
        description:"Resolve a place/address using OpenStreetMap Nominatim.",
        capability:"utility.read",
        async execute(input){
          const value=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(10).default(5)}).parse(input);
          return geocode(value.query,value.limit);
        }
      },
      {
        name:"maps.directions",
        description:"Get route distance and travel time between coordinates.",
        capability:"utility.read",
        async execute(input){
          const value=z.object({
            from:z.object({latitude:z.number(),longitude:z.number()}),
            to:z.object({latitude:z.number(),longitude:z.number()}),
            profile:z.enum(["driving","walking","cycling"]).default("driving")
          }).parse(input);
          return route(value.from,value.to,value.profile);
        }
      },
      {
        name:"maps.saved.list",
        description:"List saved locations such as Home or Work.",
        capability:"utility.read",
        async execute(){return readSaved();}
      },
      {
        name:"maps.saved.set",
        description:"Save a named location.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({
            name:z.string().min(1),
            latitude:z.number(),
            longitude:z.number(),
            address:z.string().optional()
          }).parse(input);
          const saved=readSaved();
          saved[value.name.toLowerCase()]={...value};
          writeSaved(saved);
          return {ok:true,location:saved[value.name.toLowerCase()]};
        }
      },
      {
        name:"maps.saved.remove",
        description:"Remove a saved location.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({name:z.string().min(1)}).parse(input);
          const saved=readSaved();
          const key=value.name.toLowerCase();
          const existed=key in saved;
          delete saved[key];
          writeSaved(saved);
          return {ok:existed};
        }
      },
      {
        name:"maps.android_navigation",
        description:"Create an Android Google Maps navigation intent URI for a destination.",
        capability:"utility.read",
        async execute(input){
          const value=z.object({
            latitude:z.number(),
            longitude:z.number(),
            mode:z.enum(["d","w","b"]).default("d")
          }).parse(input);
          const uri=`google.navigation:q=${value.latitude},${value.longitude}&mode=${value.mode}`;
          return {uri,platform:"android"};
        }
      },
      {
        name:"maps.open_external",
        description:"Create an external OpenStreetMap route URL.",
        capability:"utility.read",
        async execute(input){
          const value=z.object({
            from:z.object({latitude:z.number(),longitude:z.number()}),
            to:z.object({latitude:z.number(),longitude:z.number()})
          }).parse(input);
          const url=`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${value.from.latitude}%2C${value.from.longitude}%3B${value.to.latitude}%2C${value.to.longitude}`;
          return {url};
        }
      }
    ]
  };
}
