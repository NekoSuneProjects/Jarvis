export class PlexIntegration {
  constructor(private readonly baseUrl:string,private readonly token:string){}

  get configured(){return Boolean(this.baseUrl&&this.token);}

  private async request(path:string){
    if(!this.configured) throw new Error("Plex is not configured");
    const separator=path.includes("?")?"&":"?";
    const response=await fetch(
      this.baseUrl.replace(/\/$/,"")+path+`${separator}X-Plex-Token=${encodeURIComponent(this.token)}`,
      {
        headers:{accept:"application/json"},
        signal:AbortSignal.timeout(15000)
      }
    );
    if(!response.ok) throw new Error(`Plex HTTP ${response.status}: ${await response.text()}`);
    const text=await response.text();
    try{return JSON.parse(text);}catch{return {raw:text};}
  }

  identity(){return this.request("/identity");}
  libraries(){return this.request("/library/sections");}
  search(query:string){return this.request(`/hubs/search?query=${encodeURIComponent(query)}&limit=20`);}
  sessions(){return this.request("/status/sessions");}
  recentlyAdded(limit=20){return this.request(`/library/recentlyAdded?X-Plex-Container-Size=${limit}`);}
  continueWatching(){return this.request("/hubs/home/continueWatching");}
  clients(){return this.request("/clients");}
  async playerCommand(playerUrl:string,command:"play"|"pause"|"stop",clientIdentifier?:string){
    if(!this.token) throw new Error("Plex token is not configured");
    const url=new URL(`/player/playback/${command}`,playerUrl);
    url.searchParams.set("X-Plex-Token",this.token);
    url.searchParams.set("X-Plex-Client-Identifier",clientIdentifier ?? "nekosune-jarvis");
    const response=await fetch(url,{method:"GET",signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error(`Plex player HTTP ${response.status}: ${await response.text()}`);
    return {ok:true,command};
  }

  async playMedia(playerUrl:string,input:{
    key:string;
    machineIdentifier:string;
    serverAddress:string;
    serverPort?:number;
    serverProtocol?:"http"|"https";
    clientIdentifier?:string;
  }){
    if(!this.token) throw new Error("Plex token is not configured");
    const url=new URL("/player/playback/playMedia",playerUrl);
    url.searchParams.set("key",input.key);
    url.searchParams.set("machineIdentifier",input.machineIdentifier);
    url.searchParams.set("address",input.serverAddress);
    url.searchParams.set("port",String(input.serverPort ?? 32400));
    url.searchParams.set("protocol",input.serverProtocol ?? "http");
    url.searchParams.set("providerIdentifier","com.plexapp.plugins.library");
    url.searchParams.set("X-Plex-Token",this.token);
    url.searchParams.set("X-Plex-Client-Identifier",input.clientIdentifier ?? "nekosune-jarvis");
    const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error(`Plex playMedia HTTP ${response.status}: ${await response.text()}`);
    return {ok:true};
  }

  async discoverServers(){
    if(!this.token) throw new Error("Plex token is not configured");
    const response=await fetch("https://plex.tv/api/v2/resources?includeHttps=1&includeRelay=1",{
      headers:{
        "X-Plex-Token":this.token,
        accept:"application/json"
      },
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`Plex resources HTTP ${response.status}`);
    const text=await response.text();
    try{return JSON.parse(text);}catch{return {raw:text};}
  }
}
