import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph
} from "docx";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import { z } from "zod";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";

async function ensureParent(file:string){
  await fs.mkdir(path.dirname(file),{recursive:true});
}

export const documentsPlugin:JarvisPlugin={
  id:"documents",
  name:"Documents",
  version:"0.1.0",
  description:"Create PDF, Word, Excel and PowerPoint files in the Jarvis workspace.",
  tools:[
    {
      name:"documents.pdf.create",
      description:"Create a simple text PDF.",
      capability:"files.write",
      parameters:{
        type:"object",
        properties:{
          path:{type:"string"},
          title:{type:"string"},
          paragraphs:{type:"array",items:{type:"string"}}
        },
        required:["path","title"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          title:z.string().min(1),
          paragraphs:z.array(z.string()).default([])
        }).parse(input);

        const file=workspacePath(value.path);
        await ensureParent(file);

        const pdf=await PDFDocument.create();
        const font=await pdf.embedFont(StandardFonts.Helvetica);
        const bold=await pdf.embedFont(StandardFonts.HelveticaBold);

        let page=pdf.addPage([595.28,841.89]);
        let y=790;

        const drawLine=(text:string,size:number,isBold=false)=>{
          if(y<60){
            page=pdf.addPage([595.28,841.89]);
            y=790;
          }
          page.drawText(text.slice(0,120),{
            x:50,y,size,font:isBold?bold:font
          });
          y-=size+10;
        };

        drawLine(value.title,20,true);
        y-=8;
        for(const paragraph of value.paragraphs){
          for(const line of paragraph.match(/.{1,85}(?:\s+|$)/g) ?? [paragraph]){
            drawLine(line.trim(),11,false);
          }
          y-=8;
        }

        await fs.writeFile(file,await pdf.save());
        return {ok:true,path:file};
      }
    },
    {
      name:"documents.docx.create",
      description:"Create a Word DOCX with a title and paragraphs.",
      capability:"files.write",
      parameters:{
        type:"object",
        properties:{
          path:{type:"string"},
          title:{type:"string"},
          paragraphs:{type:"array",items:{type:"string"}}
        },
        required:["path","title"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          title:z.string().min(1),
          paragraphs:z.array(z.string()).default([])
        }).parse(input);

        const file=workspacePath(value.path);
        await ensureParent(file);
        const doc=new Document({
          sections:[{
            children:[
              new Paragraph({text:value.title,heading:HeadingLevel.TITLE}),
              ...value.paragraphs.map((text)=>new Paragraph({text}))
            ]
          }]
        });
        await fs.writeFile(file,await Packer.toBuffer(doc));
        return {ok:true,path:file};
      }
    },
    {
      name:"documents.xlsx.create",
      description:"Create an Excel XLSX workbook from rows.",
      capability:"files.write",
      parameters:{
        type:"object",
        properties:{
          path:{type:"string"},
          sheet:{type:"string"},
          rows:{type:"array",items:{type:"array",items:{}}}
        },
        required:["path","rows"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          sheet:z.string().default("Sheet1"),
          rows:z.array(z.array(z.any()))
        }).parse(input);

        const file=workspacePath(value.path);
        await ensureParent(file);
        const workbook=new ExcelJS.Workbook();
        const sheet=workbook.addWorksheet(value.sheet);
        for(const row of value.rows) sheet.addRow(row);
        await workbook.xlsx.writeFile(file);
        return {ok:true,path:file};
      }
    },
    {
      name:"documents.pptx.create",
      description:"Create a PowerPoint presentation from slide titles and bullet text.",
      capability:"files.write",
      parameters:{
        type:"object",
        properties:{
          path:{type:"string"},
          title:{type:"string"},
          slides:{
            type:"array",
            items:{
              type:"object",
              properties:{
                title:{type:"string"},
                bullets:{type:"array",items:{type:"string"}}
              },
              required:["title"]
            }
          }
        },
        required:["path","title","slides"],
        additionalProperties:false
      },
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          title:z.string().min(1),
          slides:z.array(z.object({
            title:z.string().min(1),
            bullets:z.array(z.string()).default([])
          }))
        }).parse(input);

        const file=workspacePath(value.path);
        await ensureParent(file);
        const pptx=new PptxGenJS();
        pptx.layout="LAYOUT_WIDE";
        pptx.author="NekoSune Jarvis";
        pptx.subject=value.title;
        pptx.title=value.title;

        for(const item of value.slides){
          const slide=pptx.addSlide();
          slide.addText(item.title,{x:0.6,y:0.45,w:12.1,h:0.7,fontSize:28,bold:true});
          if(item.bullets.length){
            slide.addText(
              item.bullets.map((text)=>({text,options:{bullet:{indent:18}}})),
              {x:0.9,y:1.5,w:11.5,h:5.1,fontSize:20,breakLine:true}
            );
          }
        }

        await pptx.writeFile({fileName:file});
        return {ok:true,path:file};
      }
    }
  ]
};
