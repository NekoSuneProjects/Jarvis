import { z } from "zod";
import type { AssistantStore } from "../assistant/store.js";
import type { EventBus } from "../events/event-bus.js";
import { runProcess } from "../utils/process.js";
import type { JarvisPlugin } from "./plugin-registry.js";

function xmlEscape(value:string){
  return value
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&apos;");
}

async function nativeNotify(title:string,body:string){
  if(process.platform==="win32"){
    const safeTitle=xmlEscape(title);
    const safeBody=xmlEscape(body);
    const script=`
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null
      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml('<toast><visual><binding template="ToastGeneric"><text>${safeTitle}</text><text>${safeBody}</text></binding></visual></toast>')
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('NekoSune Jarvis').Show($toast)
    `;
    const result=await runProcess("powershell.exe",["-NoProfile","-Command",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error(result.stderr || "Windows toast failed");
    return;
  }

  if(process.platform==="darwin"){
    const script=`display notification ${JSON.stringify(body)} with title ${JSON.stringify(title)}`;
    const result=await runProcess("osascript",["-e",script],{timeoutMs:10000});
    if(result.code!==0) throw new Error(result.stderr || "macOS notification failed");
    return;
  }

  const result=await runProcess("notify-send",["--app-name=NekoSune Jarvis",title,body],{timeoutMs:10000});
  if(result.code!==0) throw new Error(result.stderr || "notify-send failed; install libnotify-bin");
}

export function createNativeNotificationPlugin(
  store:AssistantStore,
  events:EventBus
):JarvisPlugin{
  return {
    id:"native-notifications",
    name:"Native Notifications",
    version:"0.1.0",
    description:"Persistent Jarvis notifications plus native desktop toast delivery.",
    tools:[{
      name:"notifications.desktop",
      description:"Create a persistent Jarvis notification and attempt a native desktop toast.",
      capability:"notifications.send",
      parameters:{
        type:"object",
        properties:{
          title:{type:"string"},
          body:{type:"string"},
          priority:{type:"string",enum:["low","normal","high","critical"]}
        },
        required:["title","body"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          title:z.string().min(1),
          body:z.string(),
          priority:z.enum(["low","normal","high","critical"]).default("normal")
        }).parse(input);

        const notification=store.createNotification(
          value.title,value.body,value.priority,"desktop"
        );
        events.publish("notification.created",notification);

        try{
          await nativeNotify(value.title,value.body);
          return {ok:true,native:true,notification};
        }catch(error){
          return {
            ok:true,
            native:false,
            nativeError:error instanceof Error?error.message:String(error),
            notification
          };
        }
      }
    }]
  };
}
