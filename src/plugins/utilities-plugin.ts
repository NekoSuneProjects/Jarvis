import convert from "convert-units";
import { evaluate } from "mathjs";
import { z } from "zod";
import { GeocodingIntegration } from "../integrations/geocoding.js";
import { WeatherIntegration } from "../integrations/weather.js";
import type { JarvisPlugin } from "./plugin-registry.js";

const geocoding=new GeocodingIntegration();
const weather=new WeatherIntegration();

export const utilitiesPlugin:JarvisPlugin={
  id:"utilities",
  name:"Utilities",
  version:"0.1.0",
  description:"Fast deterministic time, date, calculation, conversion and place/weather utilities.",
  tools:[
    {
      name:"utility.time",
      description:"Get current local date/time for an IANA timezone. Use system local timezone if omitted.",
      capability:"utility.read",
      parameters:{
        type:"object",
        properties:{timezone:{type:"string"}},
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({timezone:z.string().optional()}).parse(input ?? {});
        const now=new Date();
        const timezone=value.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        const formatted=new Intl.DateTimeFormat("en-GB",{
          timeZone:timezone,
          dateStyle:"full",
          timeStyle:"long"
        }).format(now);
        return {iso:now.toISOString(),timezone,formatted};
      }
    },
    {
      name:"utility.calculate",
      description:"Calculate a mathematical expression using mathjs.",
      capability:"utility.read",
      parameters:{
        type:"object",
        properties:{expression:{type:"string"}},
        required:["expression"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({expression:z.string().min(1).max(500)}).parse(input);
        const result=evaluate(value.expression);
        if(typeof result==="function") throw new Error("Function results are not allowed");
        return {expression:value.expression,result:String(result)};
      }
    },
    {
      name:"utility.convert",
      description:"Convert a numeric value between units such as km/miles, C/F, kg/lb, ml/l.",
      capability:"utility.read",
      parameters:{
        type:"object",
        properties:{
          value:{type:"number"},
          from:{type:"string"},
          to:{type:"string"}
        },
        required:["value","from","to"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          value:z.number(),
          from:z.string().min(1),
          to:z.string().min(1)
        }).parse(input);
        const result=convert(value.value).from(value.from as never).to(value.to as never);
        return {...value,result};
      }
    },
    {
      name:"place.search",
      description:"Find latitude/longitude and timezone for a city or place name.",
      capability:"utility.read",
      parameters:{
        type:"object",
        properties:{
          name:{type:"string"},
          limit:{type:"integer",minimum:1,maximum:10}
        },
        required:["name"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({name:z.string().min(1),limit:z.number().int().min(1).max(10).default(5)}).parse(input);
        return geocoding.search(value.name,value.limit);
      }
    },
    {
      name:"weather.place",
      description:"Find a place by name and return its current weather.",
      capability:"weather.read",
      parameters:{
        type:"object",
        properties:{place:{type:"string"}},
        required:["place"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({place:z.string().min(1)}).parse(input);
        const [place]=await geocoding.search(value.place,1);
        if(!place) throw new Error("Place not found");
        return {
          place,
          weather:await weather.current(place.latitude,place.longitude)
        };
      }
    }
  ]
};
