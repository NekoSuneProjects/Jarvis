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
  seek(positionMs:number){return this.request(`/me/player/seek?position_ms=${Math.max(0,Math.round(positionMs))}`,{method:"PUT"});}
  queue(uri:string){return this.request(`/me/player/queue?uri=${encodeURIComponent(uri)}`,{method:"POST"});}
  queueState(){return this.request("/me/player/queue");}
  devices(){return this.request("/me/player/devices");}
  transfer(deviceId:string,play=false){
    return this.request("/me/player",{method:"PUT",body:JSON.stringify({device_ids:[deviceId],play})});
  }
  recent(limit=20){
    return this.request(`/me/player/recently-played?limit=${Math.max(1,Math.min(50,limit))}`);
  }
  search(query:string,type="track,artist,album,playlist",limit=10){
    const params=new URLSearchParams({q:query,type,limit:String(limit)});
    return this.request(`/search?${params}`);
  }
  liked(limit=20,offset=0){
    return this.request(`/me/tracks?limit=${Math.max(1,Math.min(50,limit))}&offset=${Math.max(0,offset)}`);
  }
  like(ids:string[]){
    return this.request(`/me/tracks?ids=${ids.map(encodeURIComponent).join(",")}`,{method:"PUT"});
  }
  unlike(ids:string[]){
    return this.request(`/me/tracks?ids=${ids.map(encodeURIComponent).join(",")}`,{method:"DELETE"});
  }
  me(){return this.request("/me");}
  createPlaylist(userId:string,name:string,description="",isPublic=false){
    return this.request(`/users/${encodeURIComponent(userId)}/playlists`,{
      method:"POST",
      body:JSON.stringify({name,description,public:isPublic})
    });
  }
  addPlaylistItems(playlistId:string,uris:string[]){
    return this.request(`/playlists/${encodeURIComponent(playlistId)}/tracks`,{
      method:"POST",
      body:JSON.stringify({uris})
    });
  }
  removePlaylistItems(playlistId:string,uris:string[]){
    return this.request(`/playlists/${encodeURIComponent(playlistId)}/tracks`,{
      method:"DELETE",
      body:JSON.stringify({tracks:uris.map((uri)=>({uri}))})
    });
  }
}
