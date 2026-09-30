export class SpotifyIntegration {
  constructor(private readonly accessToken:string) {}

  get configured():boolean {
    return Boolean(this.accessToken);
  }

  private async request(path:string,init:RequestInit={}){
    if(!this.accessToken) throw new Error("Spotify is not configured");
    const response=await fetch(`https://api.spotify.com/v1${path}`,{
      ...init,
      headers:{
        authorization:`Bearer ${this.accessToken}`,
        "content-type":"application/json",
        ...(init.headers ?? {})
      },
      signal:AbortSignal.timeout(15000)
    });
    if(response.status===204) return null;
    if(!response.ok) throw new Error(`Spotify HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  currentPlayback(){return this.request("/me/player");}
  pause(){return this.request("/me/player/pause",{method:"PUT"});}
  play(contextUri?:string,uris?:string[]){
    return this.request("/me/player/play",{method:"PUT",body:JSON.stringify({
      ...(contextUri?{context_uri:contextUri}:{}),
      ...(uris?{uris}:{})
    })});
  }
  next(){return this.request("/me/player/next",{method:"POST"});}
  previous(){return this.request("/me/player/previous",{method:"POST"});}
  volume(percent:number){return this.request(`/me/player/volume?volume_percent=${Math.max(0,Math.min(100,Math.round(percent)))}`,{method:"PUT"});}
  search(query:string,type="track,artist,album,playlist",limit=10){
    const params=new URLSearchParams({q:query,type,limit:String(limit)});
    return this.request(`/search?${params}`);
  }
}
