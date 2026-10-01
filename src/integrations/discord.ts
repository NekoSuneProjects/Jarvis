export class DiscordIntegration {
  constructor(private readonly botToken:string) {}

  get configured(){return Boolean(this.botToken);}

  private async request(path:string,init:RequestInit={}){
    if(!this.botToken) throw new Error("Discord bot token is not configured");
    const response=await fetch(`https://discord.com/api/v10${path}`,{
      ...init,
      headers:{
        authorization:`Bot ${this.botToken}`,
        "content-type":"application/json",
        "user-agent":"NekoSuneJarvis/0.1",
        ...(init.headers ?? {})
      },
      signal:AbortSignal.timeout(15000)
    });
    if(response.status===204) return null;
    if(!response.ok) throw new Error(`Discord HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  me(){return this.request("/users/@me");}
  guilds(){return this.request("/users/@me/guilds");}
  channels(guildId:string){return this.request(`/guilds/${encodeURIComponent(guildId)}/channels`);}
  messages(channelId:string,limit=25){
    return this.request(`/channels/${encodeURIComponent(channelId)}/messages?limit=${limit}`);
  }
  send(channelId:string,content:string){
    return this.request(`/channels/${encodeURIComponent(channelId)}/messages`,{
      method:"POST",
      body:JSON.stringify({content})
    });
  }
  reply(channelId:string,messageId:string,content:string){
    return this.request(`/channels/${encodeURIComponent(channelId)}/messages`,{
      method:"POST",
      body:JSON.stringify({content,message_reference:{message_id:messageId}})
    });
  }
  searchGuild(guildId:string,content:string,limit=25){
    const params=new URLSearchParams({content,limit:String(Math.max(1,Math.min(25,limit)))});
    return this.request(`/guilds/${encodeURIComponent(guildId)}/messages/search?${params}`);
  }
  async dmChannel(userId:string){
    return this.request("/users/@me/channels",{
      method:"POST",
      body:JSON.stringify({recipient_id:userId})
    }) as Promise<{id:string}>;
  }
  async sendDm(userId:string,content:string){
    const channel=await this.dmChannel(userId);
    return this.send(channel.id,content);
  }
  async readDm(userId:string,limit=25){
    const channel=await this.dmChannel(userId);
    return this.messages(channel.id,limit);
  }
  searchMentions(guildId:string,userId:string,limit=25){
    const params=new URLSearchParams({mentions:userId,limit:String(Math.max(1,Math.min(25,limit)))});
    return this.request(`/guilds/${encodeURIComponent(guildId)}/messages/search?${params}`);
  }
}
