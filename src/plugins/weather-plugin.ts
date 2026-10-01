import { z } from "zod";
import { WeatherIntegration } from "../integrations/weather.js";
import type { AssistantStore } from "../assistant/store.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createWeatherPlugin(store:AssistantStore):JarvisPlugin{
  const weather=new WeatherIntegration();
  const getLocations=()=>store.getSetting<Record<string,{latitude:number;longitude:number}>>("weather.locations",{}) ?? {};
  return {
    id:"weather",
    name:"Weather",
    version:"0.1.0",
    description:"Current weather using Open-Meteo without an API key.",
    tools:[
      {
        name:"weather.current",
        description:"Get current weather for latitude and longitude.",
        capability:"weather.read",
        async execute(input){
          const value=z.object({
            latitude:z.number().min(-90).max(90),
            longitude:z.number().min(-180).max(180)
          }).parse(input);
          return weather.current(value.latitude,value.longitude);
        }
      },
      {
        name:"weather.locations",
        description:"List saved weather locations and the configured home location.",
        capability:"weather.read",
        async execute(){
          return {
            locations:getLocations(),
            home:store.getSetting<string>("weather.homeLocation"),
            units:store.getSetting<"metric"|"imperial">("weather.units","metric")
          };
        }
      },
      {
        name:"weather.location.save",
        description:"Save a named weather location.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({name:z.string().min(1),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),home:z.boolean().default(false)}).parse(input);
          const locations=getLocations();
          locations[value.name]={latitude:value.latitude,longitude:value.longitude};
          store.setSetting("weather.locations",locations);
          if(value.home) store.setSetting("weather.homeLocation",value.name);
          return {ok:true,locations,home:store.getSetting<string>("weather.homeLocation")};
        }
      },
      {
        name:"weather.units",
        description:"Set metric or imperial weather unit preference.",
        capability:"assistant.local",
        async execute(input){
          const value=z.object({units:z.enum(["metric","imperial"])}).parse(input);
          store.setSetting("weather.units",value.units);
          return {ok:true,units:value.units};
        }
      },
      {
        name:"weather.alerts",
        description:"Derive local severe-weather warnings from forecast conditions.",
        capability:"weather.read",
        async execute(input){
          const value=z.object({
            latitude:z.number().min(-90).max(90),
            longitude:z.number().min(-180).max(180),
            days:z.number().int().min(1).max(7).default(3)
          }).parse(input);
          const forecast=await weather.forecast(value.latitude,value.longitude,value.days);
          const alerts=[];
          for(let i=0;i<forecast.daily.time.length;i++){
            const code=forecast.daily.weatherCode[i] ?? 0;
            const wind=forecast.daily.windSpeedMax[i] ?? 0;
            const rain=forecast.daily.precipitationProbabilityMax[i] ?? 0;
            const reasons:string[]=[];
            if([95,96,99].includes(code)) reasons.push("thunderstorm");
            if(wind>=60) reasons.push("strong wind");
            if(rain>=80) reasons.push("high precipitation probability");
            if(reasons.length) alerts.push({date:forecast.daily.time[i],reasons,weatherCode:code,windSpeedMax:wind,precipitationProbabilityMax:rain});
          }
          return {alerts};
        }
      },
      {
        name:"weather.forecast",
        description:"Get hourly and daily weather forecast including rain probability, wind, sunrise and sunset.",
        capability:"weather.read",
        async execute(input){
          const value=z.object({
            latitude:z.number().min(-90).max(90),
            longitude:z.number().min(-180).max(180),
            days:z.number().int().min(1).max(16).default(7)
          }).parse(input);
          return weather.forecast(value.latitude,value.longitude,value.days);
        }
      }
    ]
  };
}
