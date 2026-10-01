export class JellyfinIntegration {
  constructor(private readonly baseUrl:string,private readonly apiKey:string){}

  get configured(){return Boolean(this.baseUrl&&this.apiKey);}

  private async request(path:string,init:RequestInit={}){
    if(!this.configured) throw new Error("Jellyfin is not configured");
    const response=await fetch(this.baseUrl.replace(/\/$/,"")+path,{
      ...init,
      headers:{
        "X-Emby-Token":this.apiKey,
        ...(init.body?{"content-type":"application/json"}:{}),
        ...(init.headers ?? {})
      },
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
  users(){return this.request("/Users");}
  libraries(){return this.request("/Library/VirtualFolders");}
  browse(limit=100){
    const params=new URLSearchParams({Recursive:"true",Limit:String(limit),Fields:"Overview,Path,MediaSources,PrimaryImageAspectRatio"});
    return this.request(`/Items?${params}`);
  }
  latest(limit=20){
    return this.request(`/Items/Latest?Limit=${limit}&Fields=Overview,Path,MediaSources,PrimaryImageAspectRatio`);
  }
  resume(userId:string,limit=20){
    const params=new URLSearchParams({Limit:String(limit),Recursive:"true",Fields:"Overview,Path,MediaSources,PrimaryImageAspectRatio"});
    return this.request(`/Users/${encodeURIComponent(userId)}/Items/Resume?${params}`);
  }
  play(sessionId:string,itemIds:string[]){
    return this.request(`/Sessions/${encodeURIComponent(sessionId)}/Playing`,{
      method:"POST",
      body:JSON.stringify({ItemIds:itemIds,PlayCommand:"PlayNow"})
    });
  }
  playbackCommand(sessionId:string,command:"Pause"|"Unpause"|"Stop"){
    return this.request(`/Sessions/${encodeURIComponent(sessionId)}/Playing/${command}`,{method:"POST"});
  }
}
