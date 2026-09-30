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
}
