export class KodiIntegration {
  private id=1;

  constructor(
    private readonly endpoint:string,
    private readonly username:string,
    private readonly password:string
  ){}

  get configured(){return Boolean(this.endpoint);}

  async call(method:string,params:unknown={}){
    if(!this.configured) throw new Error("Kodi is not configured");
    const headers:Record<string,string>={"content-type":"application/json"};
    if(this.username||this.password){
      headers.authorization=`Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
    }

    const response=await fetch(this.endpoint,{
      method:"POST",
      headers,
      body:JSON.stringify({jsonrpc:"2.0",id:this.id++,method,params}),
      signal:AbortSignal.timeout(15000)
    });
    if(!response.ok) throw new Error(`Kodi HTTP ${response.status}`);
    const body=await response.json() as {result?:unknown;error?:unknown};
    if(body.error) throw new Error(`Kodi RPC error: ${JSON.stringify(body.error)}`);
    return body.result;
  }

  properties(){return this.call("Application.GetProperties",{properties:["volume","muted","name","version"]});}
  players(){return this.call("Player.GetActivePlayers");}
  playPause(playerid:number,play?:boolean){return this.call("Player.PlayPause",{playerid,play:play??"toggle"});}
  stop(playerid:number){return this.call("Player.Stop",{playerid});}
  volume(volume:number){return this.call("Application.SetVolume",{volume:Math.round(Math.max(0,Math.min(100,volume)))});}
}
