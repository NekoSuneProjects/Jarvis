export interface NamedHttpDevice {
  url:string;
  username?:string;
  password?:string;
}

function basicHeaders(device:NamedHttpDevice):Record<string,string>{
  if(!device.username && !device.password) return {};
  return {
    authorization:`Basic ${Buffer.from(`${device.username ?? ""}:${device.password ?? ""}`).toString("base64")}`
  };
}

export class HueIntegration {
  constructor(private readonly baseUrl:string,private readonly username:string){}

  get configured(){return Boolean(this.baseUrl&&this.username);}

  private async request(path:string,init:RequestInit={}){
    if(!this.configured) throw new Error("Hue bridge is not configured");
    const response=await fetch(
      `${this.baseUrl.replace(/\/$/,"")}/api/${encodeURIComponent(this.username)}${path}`,
      {
        ...init,
        headers:{"content-type":"application/json",...(init.headers??{})},
        signal:AbortSignal.timeout(10000)
      }
    );
    if(!response.ok) throw new Error(`Hue HTTP ${response.status}: ${await response.text()}`);
    const body=await response.json();
    if(Array.isArray(body) && body.some((item:any)=>item?.error)){
      throw new Error(`Hue API error: ${JSON.stringify(body)}`);
    }
    return body;
  }

  lights(){return this.request("/lights");}
  groups(){return this.request("/groups");}

  lightState(id:string,state:Record<string,unknown>){
    return this.request(`/lights/${encodeURIComponent(id)}/state`,{
      method:"PUT",
      body:JSON.stringify(state)
    });
  }

  groupAction(id:string,state:Record<string,unknown>){
    return this.request(`/groups/${encodeURIComponent(id)}/action`,{
      method:"PUT",
      body:JSON.stringify(state)
    });
  }
}

export class ShellyIntegration {
  constructor(private readonly devices:Record<string,NamedHttpDevice>){}

  list(){
    return Object.entries(this.devices).map(([name,device])=>({name,url:device.url}));
  }

  private device(name:string){
    const device=this.devices[name];
    if(!device) throw new Error(`Unknown Shelly device: ${name}`);
    return device;
  }

  async rpc(name:string,method:string,params:Record<string,unknown>={}){
    const device=this.device(name);
    const response=await fetch(`${device.url.replace(/\/$/,"")}/rpc`,{
      method:"POST",
      headers:{
        "content-type":"application/json",
        ...basicHeaders(device)
      } satisfies Record<string,string>,
      body:JSON.stringify({id:1,method,params}),
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok) throw new Error(`Shelly HTTP ${response.status}: ${await response.text()}`);
    const body=await response.json() as any;
    if(body.error) throw new Error(`Shelly RPC error: ${JSON.stringify(body.error)}`);
    return body.result;
  }

  status(name:string){return this.rpc(name,"Shelly.GetStatus");}
  info(name:string){return this.rpc(name,"Shelly.GetDeviceInfo");}
  switchSet(name:string,id:number,on:boolean,toggleAfter?:number){
    return this.rpc(name,"Switch.Set",{
      id,on,...(toggleAfter!==undefined?{toggle_after:toggleAfter}:{})
    });
  }
}

export class TasmotaIntegration {
  constructor(private readonly devices:Record<string,NamedHttpDevice>){}

  list(){
    return Object.entries(this.devices).map(([name,device])=>({name,url:device.url}));
  }

  private device(name:string){
    const device=this.devices[name];
    if(!device) throw new Error(`Unknown Tasmota device: ${name}`);
    return device;
  }

  async command(name:string,command:string){
    const device=this.device(name);
    const url=new URL("/cm",device.url);
    url.searchParams.set("cmnd",command);
    if(device.username) url.searchParams.set("user",device.username);
    if(device.password) url.searchParams.set("password",device.password);

    const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw new Error(`Tasmota HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  status(name:string){return this.command(name,"Status 0");}
  power(name:string,on:boolean,index=1){
    return this.command(name,`Power${index>1?index:""} ${on?"ON":"OFF"}`);
  }
  dimmer(name:string,percent:number){
    return this.command(name,`Dimmer ${Math.max(0,Math.min(100,Math.round(percent)))}`);
  }
}
