export class JellyfinIntegration {
  constructor(private readonly baseUrl:string,private readonly apiKey:string){}

  get configured(){return Boolean(this.baseUrl&&this.apiKey);}

  private async request(path:string){
    if(!this.configured) throw new Error("Jellyfin is not configured");
    const response=await fetch(this.baseUrl.replace(/\/$/,"")+path,{
      headers:{"X-Emby-Token":this.apiKey},
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`Jellyfin HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  info(){return this.request("/System/Info");}

  search(query:string,limit=20){
    const params=new URLSearchParams({
      searchTerm:query,
      Recursive:"true",
      Limit:String(limit),
      Fields:"Overview,Path,MediaSources,PrimaryImageAspectRatio"
    });
    return this.request(`/Items?${params}`);
  }

  sessions(){return this.request("/Sessions");}
}
