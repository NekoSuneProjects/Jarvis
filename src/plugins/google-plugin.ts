import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { config } from "../config.js";
import { GoogleIntegration } from "../integrations/google.js";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createGooglePlugin():JarvisPlugin{
  const google=new GoogleIntegration(config.googleAccessToken);
  return {
    id:"google",
    name:"Google",
    version:"0.2.0",
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
        name:"gmail.labels",
        description:"List Gmail labels.",
        capability:"communication.read",
        async execute(){return google.gmailLabels();}
      },
      {
        name:"gmail.send_raw",
        description:"Send an RFC822 email through Gmail, optionally in an existing thread.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({raw:z.string().min(1),threadId:z.string().optional()}).parse(input);
          return google.gmailSend(value.raw,value.threadId);
        }
      },
      {
        name:"gmail.draft_raw",
        description:"Create a Gmail draft from RFC822 content.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({raw:z.string().min(1),threadId:z.string().optional()}).parse(input);
          return google.gmailDraft(value.raw,value.threadId);
        }
      },
      {
        name:"gmail.modify",
        description:"Add/remove Gmail labels, including UNREAD and INBOX for read/archive workflows.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({
            id:z.string().min(1),
            addLabelIds:z.array(z.string()).default([]),
            removeLabelIds:z.array(z.string()).default([])
          }).parse(input);
          return google.gmailModify(value.id,value.addLabelIds,value.removeLabelIds);
        }
      },
      {
        name:"gmail.delete",
        description:"Permanently delete a Gmail message.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({id:z.string().min(1)}).parse(input);
          await google.gmailDelete(value.id);
          return {ok:true};
        }
      },
      {
        name:"gmail.label.create",
        description:"Create a Gmail label.",
        capability:"communication.send",
        async execute(input){
          const value=z.object({name:z.string().min(1)}).parse(input);
          return google.gmailCreateLabel(value.name);
        }
      },
      {
        name:"calendar.list",
        description:"List Google Calendars.",
        capability:"calendar.read",
        async execute(){return google.calendarList();}
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
        name:"calendar.update",
        description:"Patch an existing Google Calendar event.",
        capability:"calendar.write",
        async execute(input){
          const value=z.object({
            calendarId:z.string().default("primary"),
            eventId:z.string().min(1),
            event:z.record(z.unknown())
          }).parse(input);
          return google.calendarUpdate(value.calendarId,value.eventId,value.event);
        }
      },
      {
        name:"calendar.delete",
        description:"Delete a Google Calendar event.",
        capability:"calendar.write",
        async execute(input){
          const value=z.object({
            calendarId:z.string().default("primary"),
            eventId:z.string().min(1)
          }).parse(input);
          await google.calendarDelete(value.calendarId,value.eventId);
          return {ok:true};
        }
      },
      {
        name:"calendar.free_busy",
        description:"Query busy ranges for one or more Google Calendars.",
        capability:"calendar.read",
        async execute(input){
          const value=z.object({
            timeMin:z.string().datetime(),
            timeMax:z.string().datetime(),
            calendarIds:z.array(z.string()).min(1).default(["primary"])
          }).parse(input);
          return google.calendarFreeBusy(value.timeMin,value.timeMax,value.calendarIds);
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
      },
      {
        name:"drive.download",
        description:"Download a binary Drive file into the Jarvis workspace.",
        capability:"drive.read",
        async execute(input){
          const value=z.object({id:z.string().min(1),path:z.string().min(1)}).parse(input);
          const target=workspacePath(value.path);
          await fs.mkdir(path.dirname(target),{recursive:true});
          const bytes=await google.driveDownload(value.id);
          if(!(bytes instanceof ArrayBuffer)) throw new Error("Drive returned non-binary content");
          await fs.writeFile(target,Buffer.from(bytes));
          return {ok:true,path:value.path};
        }
      },
      {
        name:"drive.upload",
        description:"Upload a Jarvis workspace file to Google Drive.",
        capability:"drive.write",
        async execute(input){
          const value=z.object({
            path:z.string().min(1),
            name:z.string().optional(),
            mimeType:z.string().default("application/octet-stream"),
            parentId:z.string().optional()
          }).parse(input);
          const source=workspacePath(value.path);
          const bytes=await fs.readFile(source);
          return google.driveUpload(
            value.name ?? path.basename(source),
            bytes,
            value.mimeType,
            value.parentId
          );
        }
      },
      {
        name:"drive.folder.create",
        description:"Create a Google Drive folder.",
        capability:"drive.write",
        async execute(input){
          const value=z.object({name:z.string().min(1),parentId:z.string().optional()}).parse(input);
          return google.driveCreateFolder(value.name,value.parentId);
        }
      },
      {
        name:"drive.rename",
        description:"Rename a Google Drive file or folder.",
        capability:"drive.write",
        async execute(input){
          const value=z.object({id:z.string().min(1),name:z.string().min(1)}).parse(input);
          return google.driveRename(value.id,value.name);
        }
      },
      {
        name:"drive.move",
        description:"Move a Google Drive item to another parent folder.",
        capability:"drive.write",
        async execute(input){
          const value=z.object({
            id:z.string().min(1),
            newParentId:z.string().min(1),
            oldParentIds:z.array(z.string()).default([])
          }).parse(input);
          return google.driveMove(value.id,value.newParentId,value.oldParentIds);
        }
      },
      {
        name:"drive.delete",
        description:"Delete a Google Drive file or folder.",
        capability:"drive.write",
        async execute(input){
          const value=z.object({id:z.string().min(1)}).parse(input);
          await google.driveDelete(value.id);
          return {ok:true};
        }
      }
    ]
  };
}
