import { fetchWithRetry } from "../utils/http.js";

export interface WeatherNow {
  latitude:number;
  longitude:number;
  temperature:number|null;
  apparentTemperature:number|null;
  precipitation:number|null;
  weatherCode:number|null;
  windSpeed:number|null;
  timezone:string;
}

export interface WeatherForecast {
  latitude:number;
  longitude:number;
  timezone:string;
  hourly:{
    time:string[];
    precipitationProbability:Array<number|null>;
    precipitation:Array<number|null>;
    windSpeed:Array<number|null>;
    temperature:Array<number|null>;
  };
  daily:{
    time:string[];
    weatherCode:Array<number|null>;
    temperatureMax:Array<number|null>;
    temperatureMin:Array<number|null>;
    precipitationProbabilityMax:Array<number|null>;
    sunrise:string[];
    sunset:string[];
    windSpeedMax:Array<number|null>;
  };
}

export class WeatherIntegration {
  async current(latitude:number,longitude:number):Promise<WeatherNow>{
    const url=new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",String(latitude));
    url.searchParams.set("longitude",String(longitude));
    url.searchParams.set("current","temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m");
    url.searchParams.set("timezone","auto");

    const response=await fetchWithRetry(url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const body=await response.json() as any;
    return {
      latitude:body.latitude,
      longitude:body.longitude,
      temperature:body.current?.temperature_2m ?? null,
      apparentTemperature:body.current?.apparent_temperature ?? null,
      precipitation:body.current?.precipitation ?? null,
      weatherCode:body.current?.weather_code ?? null,
      windSpeed:body.current?.wind_speed_10m ?? null,
      timezone:body.timezone ?? "UTC"
    };
  }

  async forecast(latitude:number,longitude:number,days=7):Promise<WeatherForecast>{
    const url=new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",String(latitude));
    url.searchParams.set("longitude",String(longitude));
    url.searchParams.set("hourly","temperature_2m,precipitation_probability,precipitation,wind_speed_10m");
    url.searchParams.set("daily","weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max");
    url.searchParams.set("forecast_days",String(Math.max(1,Math.min(16,days))));
    url.searchParams.set("timezone","auto");

    const response=await fetchWithRetry(url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error(`Weather HTTP ${response.status}`);
    const body=await response.json() as any;
    return {
      latitude:body.latitude,
      longitude:body.longitude,
      timezone:body.timezone ?? "UTC",
      hourly:{
        time:body.hourly?.time ?? [],
        precipitationProbability:body.hourly?.precipitation_probability ?? [],
        precipitation:body.hourly?.precipitation ?? [],
        windSpeed:body.hourly?.wind_speed_10m ?? [],
        temperature:body.hourly?.temperature_2m ?? []
      },
      daily:{
        time:body.daily?.time ?? [],
        weatherCode:body.daily?.weather_code ?? [],
        temperatureMax:body.daily?.temperature_2m_max ?? [],
        temperatureMin:body.daily?.temperature_2m_min ?? [],
        precipitationProbabilityMax:body.daily?.precipitation_probability_max ?? [],
        sunrise:body.daily?.sunrise ?? [],
        sunset:body.daily?.sunset ?? [],
        windSpeedMax:body.daily?.wind_speed_10m_max ?? []
      }
    };
  }
}
