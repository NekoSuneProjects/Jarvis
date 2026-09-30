import { z } from "zod";
import { config } from "../config.js";
import { GoogleIntegration } from "../integrations/google.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createGooglePlugin():JarvisPlugin{
  const google=new GoogleIntegration(config.googleAccessToken);
  return {
    id:"google",
    name:"Google",
    version:"0.1.0",
    description:"Gmail, Google Calendar and Google Drive using a configured OAuth access token.",
    tools:[
      {
        name:"gmail.search",
        description:"Search Gmail messages.",
        capability:"communication.read",
        async execute(input){
          const value=z.object({query:z.string().default(""),limit:z.number().int().min(1).max(100).default(20)}).parse(input ?? {});
          return google.gmailSearch(value.query,value.limit);
        }
      },
      {
        name:"gmail.message",
        description:"Read one Gmail message by ID.",
        capability:"communication.read",
        async execute(input){
          const value=z.object({id:z.string().min(1)}).parse(input);
          return google.gmailMessage(value.id);
        }
      },
      {
        name:"gmail.send_raw",
        description:"Send an RFC822 email through Gmail.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({raw:z.string().min(1)}).parse(input);
          return google.gmailSend(value.raw);
        }
      },
      {
        name:"calendar.events",
        description:"Read upcoming Google Calendar events.",
        capability:"calendar.read",
        async execute(input){
          const value=z.object({
            calendarId:z.string().default("primary"),
            timeMin:z.string().datetime().optional(),
            limit:z.number().int().min(1).max(100).default(20)
          }).parse(input ?? {});
          return google.calendarEvents(value.calendarId,value.timeMin ?? new Date().toISOString(),value.limit);
        }
      },
      {
        name:"calendar.create",
        description:"Create a Google Calendar event.",
        capability:"calendar.write",
        async execute(input){
          const value=z.object({calendarId:z.string().default("primary"),event:z.record(z.unknown())}).parse(input);
          return google.calendarCreate(value.calendarId,value.event);
        }
      },
      {
        name:"drive.search",
        description:"Search/list Google Drive files.",
        capability:"drive.read",
        async execute(input){
          const value=z.object({query:z.string().optional(),limit:z.number().int().min(1).max(100).default(50)}).parse(input ?? {});
          return google.driveFiles(value.query,value.limit);
        }
      },
      {
        name:"drive.file",
        description:"Read Google Drive file metadata.",
        capability:"drive.read",
        async execute(input){
          const value=z.object({id:z.string().min(1)}).parse(input);
          return google.driveFile(value.id);
        }
      }
    ]
  };
}
