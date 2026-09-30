export class RadioIntegration {
  private readonly baseUrl="https://de1.api.radio-browser.info/json";

  async search(query:string,limit=20){
    const params=new URLSearchParams({
      name:query,
      limit:String(limit),
      hidebroken:"true",
      order:"clickcount",
      reverse:"true"
    });
    const response=await fetch(`${this.baseUrl}/stations/search?${params}`,{
      headers:{"user-agent":"NekoSuneJarvis/0.1"},
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`Radio Browser HTTP ${response.status}`);
    return response.json();
  }

  async top(limit=20){
    const response=await fetch(`${this.baseUrl}/stations/topclick/${limit}`,{
      headers:{"user-agent":"NekoSuneJarvis/0.1"},
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`Radio Browser HTTP ${response.status}`);
    return response.json();
  }
}
