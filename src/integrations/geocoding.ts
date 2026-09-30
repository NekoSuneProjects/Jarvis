export interface GeocodingResult {
  id?:number;
  name:string;
  latitude:number;
  longitude:number;
  country?:string;
  admin1?:string;
  timezone?:string;
}

export class GeocodingIntegration {
  async search(name:string,count=5):Promise<GeocodingResult[]>{
    const url=new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name",name);
    url.searchParams.set("count",String(count));
    url.searchParams.set("language","en");
    url.searchParams.set("format","json");

    const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error(`Geocoding HTTP ${response.status}`);
    const body=await response.json() as {results?:GeocodingResult[]};
    return body.results ?? [];
  }
}
