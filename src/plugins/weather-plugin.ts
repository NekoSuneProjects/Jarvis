import { z } from "zod";
import { WeatherIntegration } from "../integrations/weather.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createWeatherPlugin():JarvisPlugin{
  const weather=new WeatherIntegration();
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
