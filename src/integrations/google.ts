export class GoogleIntegration {
  constructor(private readonly accessToken:string) {}

  get configured(){return Boolean(this.accessToken);}

  private async request(base:string,path:string,init:RequestInit={}){
    if(!this.accessToken) throw new Error("Google integration is not configured");
    const response=await fetch(base+path,{
      ...init,
      headers:{
        authorization:`Bearer ${this.accessToken}`,
        "content-type":"application/json",
        ...(init.headers ?? {})
      },
      signal:AbortSignal.timeout(20000)
    });
    if(response.status===204) return null;
    if(!response.ok) throw new Error(`Google API HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  gmailSearch(q:string,maxResults=20){
    const params=new URLSearchParams({q,maxResults:String(maxResults)});
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages?${params}`);
  }

  gmailMessage(id:string){
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`);
  }

  gmailSend(rawRfc822:string){
    const raw=Buffer.from(rawRfc822,"utf8").toString("base64url");
    return this.request("https://gmail.googleapis.com","/gmail/v1/users/me/messages/send",{
      method:"POST",
      body:JSON.stringify({raw})
    });
  }

  calendarEvents(calendarId="primary",timeMin=new Date().toISOString(),maxResults=20){
    const params=new URLSearchParams({
      timeMin,
      maxResults:String(maxResults),
      singleEvents:"true",
      orderBy:"startTime"
    });
    return this.request("https://www.googleapis.com",`/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  }

  calendarCreate(calendarId:string,event:Record<string,unknown>){
    return this.request("https://www.googleapis.com",`/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,{
      method:"POST",
      body:JSON.stringify(event)
    });
  }

  driveFiles(q?:string,pageSize=50){
    const params=new URLSearchParams({
      pageSize:String(pageSize),
      fields:"files(id,name,mimeType,modifiedTime,webViewLink,webContentLink,size)"
    });
    if(q) params.set("q",q);
    return this.request("https://www.googleapis.com",`/drive/v3/files?${params}`);
  }

  driveFile(id:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,modifiedTime,webViewLink,webContentLink,size`);
  }
}
