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
}
