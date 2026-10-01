import { fetchWithRetry } from "../utils/http.js";

export class GoogleIntegration {
  constructor(private readonly accessToken:string) {}

  get configured(){return Boolean(this.accessToken);}

  private async request(base:string,path:string,init:RequestInit={}){
    if(!this.accessToken) throw new Error("Google integration is not configured");
    const response=await fetchWithRetry(base+path,{
      ...init,
      headers:{
        authorization:`Bearer ${this.accessToken}`,
        ...(init.body && typeof init.body==="string" ? {"content-type":"application/json"} : {}),
        ...(init.headers ?? {})
      },
      signal:AbortSignal.timeout(30000)
    });
    if(response.status===204) return null;
    if(!response.ok) throw new Error(`Google API HTTP ${response.status}: ${await response.text()}`);
    const contentType=response.headers.get("content-type") ?? "";
    if(contentType.includes("application/json")) return response.json();
    return response.arrayBuffer();
  }

  gmailSearch(q:string,maxResults=20){
    const params=new URLSearchParams({q,maxResults:String(maxResults)});
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages?${params}`);
  }

  gmailMessage(id:string){
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`);
  }

  gmailSend(rawRfc822:string,threadId?:string){
    const raw=Buffer.from(rawRfc822,"utf8").toString("base64url");
    return this.request("https://gmail.googleapis.com","/gmail/v1/users/me/messages/send",{
      method:"POST",
      body:JSON.stringify({raw,...(threadId?{threadId}:{})})
    });
  }

  gmailDraft(rawRfc822:string,threadId?:string){
    const raw=Buffer.from(rawRfc822,"utf8").toString("base64url");
    return this.request("https://gmail.googleapis.com","/gmail/v1/users/me/drafts",{
      method:"POST",
      body:JSON.stringify({message:{raw,...(threadId?{threadId}:{})}})
    });
  }

  gmailModify(id:string,addLabelIds:string[]=[],removeLabelIds:string[]=[]){
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages/${encodeURIComponent(id)}/modify`,{
      method:"POST",
      body:JSON.stringify({addLabelIds,removeLabelIds})
    });
  }

  gmailDelete(id:string){
    return this.request("https://gmail.googleapis.com",`/gmail/v1/users/me/messages/${encodeURIComponent(id)}`,{method:"DELETE"});
  }

  gmailLabels(){
    return this.request("https://gmail.googleapis.com","/gmail/v1/users/me/labels");
  }

  gmailCreateLabel(name:string){
    return this.request("https://gmail.googleapis.com","/gmail/v1/users/me/labels",{
      method:"POST",
      body:JSON.stringify({name,labelListVisibility:"labelShow",messageListVisibility:"show"})
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

  calendarUpdate(calendarId:string,eventId:string,event:Record<string,unknown>){
    return this.request("https://www.googleapis.com",`/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,{
      method:"PATCH",
      body:JSON.stringify(event)
    });
  }

  calendarRsvp(calendarId:string,eventId:string,email:string,responseStatus:"accepted"|"declined"|"tentative"|"needsAction"){
    return this.calendarUpdate(calendarId,eventId,{
      attendees:[{email,responseStatus}]
    });
  }

  calendarDelete(calendarId:string,eventId:string){
    return this.request("https://www.googleapis.com",`/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,{
      method:"DELETE"
    });
  }

  calendarList(){
    return this.request("https://www.googleapis.com","/calendar/v3/users/me/calendarList");
  }

  calendarFreeBusy(timeMin:string,timeMax:string,calendarIds:string[]){
    return this.request("https://www.googleapis.com","/calendar/v3/freeBusy",{
      method:"POST",
      body:JSON.stringify({
        timeMin,
        timeMax,
        items:calendarIds.map((id)=>({id}))
      })
    });
  }

  driveFiles(q?:string,pageSize=50){
    const params=new URLSearchParams({
      pageSize:String(pageSize),
      fields:"files(id,name,mimeType,modifiedTime,parents,webViewLink,webContentLink,size)"
    });
    if(q) params.set("q",q);
    return this.request("https://www.googleapis.com",`/drive/v3/files?${params}`);
  }

  driveFile(id:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,modifiedTime,parents,webViewLink,webContentLink,size`);
  }

  driveDownload(id:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}?alt=media`);
  }

  driveExport(id:string,mimeType:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(mimeType)}`);
  }

  driveCreateGoogleFile(name:string,mimeType:string,parentId?:string){
    return this.request("https://www.googleapis.com","/drive/v3/files",{
      method:"POST",
      body:JSON.stringify({name,mimeType,...(parentId?{parents:[parentId]}:{})})
    });
  }

  driveShare(id:string,email:string,role:"reader"|"commenter"|"writer"="reader"){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}/permissions?sendNotificationEmail=true`,{
      method:"POST",
      body:JSON.stringify({type:"user",role,emailAddress:email})
    });
  }

  driveComments(id:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}/comments?fields=comments(id,content,createdTime,modifiedTime,resolved,author,quotedFileContent,replies)`);
  }

  driveReplyComment(id:string,commentId:string,content:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/replies`,{
      method:"POST",
      body:JSON.stringify({content})
    });
  }

  driveCreateFolder(name:string,parentId?:string){
    return this.request("https://www.googleapis.com","/drive/v3/files",{
      method:"POST",
      body:JSON.stringify({
        name,
        mimeType:"application/vnd.google-apps.folder",
        ...(parentId?{parents:[parentId]}:{})
      })
    });
  }

  driveRename(id:string,name:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}`,{
      method:"PATCH",
      body:JSON.stringify({name})
    });
  }

  driveMove(id:string,newParentId:string,oldParentIds:string[]=[]){
    const params=new URLSearchParams({addParents:newParentId,fields:"id,name,parents"});
    if(oldParentIds.length) params.set("removeParents",oldParentIds.join(","));
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}?${params}`,{
      method:"PATCH"
    });
  }

  driveDelete(id:string){
    return this.request("https://www.googleapis.com",`/drive/v3/files/${encodeURIComponent(id)}`,{method:"DELETE"});
  }

  driveUpload(name:string,bytes:Uint8Array,mimeType="application/octet-stream",parentId?:string){
    const boundary="jarvis_"+Date.now().toString(36);
    const metadata=JSON.stringify({name,...(parentId?{parents:[parentId]}:{})});
    const header=Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer=Buffer.from(`\r\n--${boundary}--`);
    const body=Buffer.concat([header,Buffer.from(bytes),footer]);

    return this.request(
      "https://www.googleapis.com",
      "/upload/drive/v3/files?uploadType=multipart",
      {
        method:"POST",
        headers:{"content-type":`multipart/related; boundary=${boundary}`},
        body
      }
    );
  }
}
