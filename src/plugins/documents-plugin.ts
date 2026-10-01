import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import JSZip from "jszip";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  ImageRun
} from "docx";
import ExcelJS from "exceljs";
import { z } from "zod";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";
import type { AiProvider } from "../ai/types.js";

async function ensureParent(file:string){
  await fs.mkdir(path.dirname(file),{recursive:true});
}

export function createDocumentsPlugin(ai:AiProvider):JarvisPlugin{
return {
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
      name:"documents.pdf.summarize",
      description:"Extract text from a PDF and summarise it with the configured AI provider.",
      capability:"files.read",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          prompt:z.string().default("Summarise this PDF clearly and concisely.")
        }).parse(input);
        const parser=new PDFParse({data:await fs.readFile(workspacePath(value.path))});
        try{
          const result=await parser.getText();
          const text=(result as any).text ?? String(result);
          const response=await ai.chat({
            messages:[{
              role:"user",
              content:`${value.prompt}\n\nPDF text:\n${text.slice(0,120000)}`
            }]
          });
          return {summary:response.content,provider:response.provider,model:response.model};
        }finally{
          await parser.destroy().catch(()=>{});
        }
      }
    },
    {
      name:"documents.pdf.append",
      description:"Append a page to an existing PDF with text, an optional image and a simple table.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          title:z.string().optional(),
          paragraphs:z.array(z.string()).default([]),
          imagePath:z.string().optional(),
          table:z.array(z.array(z.string())).optional()
        }).parse(input);
        const file=workspacePath(value.path);
        const pdf=await PDFDocument.load(await fs.readFile(file));
        const font=await pdf.embedFont(StandardFonts.Helvetica);
        const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
        const page=pdf.addPage([595.28,841.89]);
        let y=790;
        if(value.title){
          page.drawText(value.title,{x:50,y,size:18,font:bold});
          y-=34;
        }
        for(const paragraph of value.paragraphs){
          for(const line of paragraph.match(/.{1,80}(?:\s+|$)/g) ?? [paragraph]){
            page.drawText(line.trim(),{x:50,y,size:10,font});
            y-=16;
          }
          y-=6;
        }
        if(value.table?.length){
          const colCount=Math.max(...value.table.map((row)=>row.length));
          const colWidth=480/Math.max(1,colCount);
          for(const row of value.table){
            let x=50;
            for(let i=0;i<colCount;i++){
              const text=String(row[i] ?? "").slice(0,40);
              page.drawRectangle({x,y:y-16,width:colWidth,height:20,borderWidth:0.5});
              page.drawText(text,{x:x+3,y:y-10,size:8,font});
              x+=colWidth;
            }
            y-=20;
          }
          y-=12;
        }
        if(value.imagePath){
          const imageBytes=await fs.readFile(workspacePath(value.imagePath));
          const lower=value.imagePath.toLowerCase();
          const image=lower.endsWith(".png")?await pdf.embedPng(imageBytes):await pdf.embedJpg(imageBytes);
          const scale=Math.min(480/image.width,Math.max(1,Math.min(300,y-60))/image.height,1);
          page.drawImage(image,{x:50,y:Math.max(40,y-image.height*scale),width:image.width*scale,height:image.height*scale});
        }
        await fs.writeFile(file,await pdf.save());
        return {ok:true,path:value.path};
      }
    },
    {
      name:"documents.pdf.export",
      description:"Copy/export a PDF to another workspace path.",
      capability:"files.write",
      async execute(input){
        const value=z.object({from:z.string().min(1),to:z.string().min(1)}).parse(input);
        const target=workspacePath(value.to);
        await ensureParent(target);
        await fs.copyFile(workspacePath(value.from),target);
        return {ok:true,path:value.to};
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
      name:"documents.docx.replace_text",
      description:"Edit an existing DOCX by replacing text in document XML.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          replacements:z.record(z.string())
        }).parse(input);
        const file=workspacePath(value.path);
        const zip=await JSZip.loadAsync(await fs.readFile(file));
        const doc=zip.file("word/document.xml");
        if(!doc) throw new Error("DOCX document.xml not found");
        let xml=await doc.async("string");
        for(const [from,to] of Object.entries(value.replacements)){
          xml=xml.split(from).join(to);
        }
        zip.file("word/document.xml",xml);
        await fs.writeFile(file,await zip.generateAsync({type:"nodebuffer"}));
        return {ok:true,path:value.path};
      }
    },
    {
      name:"documents.docx.build",
      description:"Create DOCX content with headings, paragraphs, tables and images.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          blocks:z.array(z.union([
            z.object({type:z.literal("paragraph"),text:z.string()}),
            z.object({type:z.literal("heading"),text:z.string(),level:z.number().int().min(1).max(6).default(1)}),
            z.object({type:z.literal("table"),rows:z.array(z.array(z.string())).min(1)}),
            z.object({type:z.literal("image"),path:z.string().min(1),width:z.number().int().positive().default(400),height:z.number().int().positive().default(300)})
          ]))
        }).parse(input);
        const children:any[]=[];
        for(const block of value.blocks){
          if(block.type==="paragraph") children.push(new Paragraph({text:block.text}));
          else if(block.type==="heading"){
            const levels=[HeadingLevel.HEADING_1,HeadingLevel.HEADING_2,HeadingLevel.HEADING_3,HeadingLevel.HEADING_4,HeadingLevel.HEADING_5,HeadingLevel.HEADING_6];
            children.push(new Paragraph({text:block.text,heading:levels[block.level-1]}));
          }else if(block.type==="table"){
            children.push(new Table({
              rows:block.rows.map((row)=>new TableRow({
                children:row.map((cell)=>new TableCell({children:[new Paragraph({text:cell})]}))
              }))
            }));
          }else if(block.type==="image"){
            children.push(new Paragraph({
              children:[new ImageRun({
                type:block.path.toLowerCase().endsWith(".png") ? "png" : "jpg",
                data:await fs.readFile(workspacePath(block.path)),
                transformation:{width:block.width,height:block.height}
              })]
            }));
          }
        }
        const file=workspacePath(value.path);
        await ensureParent(file);
        const doc=new Document({sections:[{children}]});
        await fs.writeFile(file,await Packer.toBuffer(doc));
        return {ok:true,path:value.path};
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
      name:"documents.xlsx.table",
      description:"Create an XLSX workbook containing an Excel table.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          sheet:z.string().default("Sheet1"),
          tableName:z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).default("JarvisTable"),
          columns:z.array(z.string()).min(1),
          rows:z.array(z.array(z.any()))
        }).parse(input);
        const file=workspacePath(value.path);
        await ensureParent(file);
        const workbook=new ExcelJS.Workbook();
        const sheet=workbook.addWorksheet(value.sheet);
        sheet.addTable({
          name:value.tableName,
          ref:"A1",
          headerRow:true,
          totalsRow:false,
          style:{theme:"TableStyleMedium2",showRowStripes:true},
          columns:value.columns.map((name)=>({name})),
          rows:value.rows
        });
        await workbook.xlsx.writeFile(file);
        return {ok:true,path:value.path};
      }
    },
    {
      name:"documents.pptx.build",
      description:"Create PowerPoint slides with text, images, charts and a named theme.",
      capability:"files.write",
      async execute(input){
        const value=z.object({
          path:z.string().min(1),
          title:z.string().default("Jarvis Presentation"),
          theme:z.object({
            headFontFace:z.string().default("Aptos Display"),
            bodyFontFace:z.string().default("Aptos")
          }).optional(),
          slides:z.array(z.object({
            title:z.string().min(1),
            bullets:z.array(z.string()).default([]),
            imagePath:z.string().optional(),
            chart:z.object({
              labels:z.array(z.string()).min(1),
              values:z.array(z.number()).min(1),
              name:z.string().default("Series")
            }).optional()
          }))
        }).parse(input);
        const file=workspacePath(value.path);
        await ensureParent(file);
        const module=await import("pptxgenjs");
        const PptxCtor:any=(module as any).default ?? module;
        const pptx:any=new PptxCtor();
        pptx.layout="LAYOUT_WIDE";
        pptx.author="NekoSune Jarvis";
        pptx.title=value.title;
        if(value.theme){
          pptx.theme={
            headFontFace:value.theme.headFontFace,
            bodyFontFace:value.theme.bodyFontFace,
            lang:"en-GB"
          };
        }
        for(const item of value.slides){
          const slide=pptx.addSlide();
          slide.addText(item.title,{x:0.6,y:0.35,w:12,h:0.7,fontSize:28,bold:true});
          if(item.bullets.length){
            slide.addText(item.bullets.map((text)=>({text,options:{bullet:{indent:18}}})),{x:0.8,y:1.3,w:6,h:5.3,fontSize:18,breakLine:true});
          }
          if(item.imagePath){
            slide.addImage({path:workspacePath(item.imagePath),x:7.1,y:1.3,w:5.4,h:3.2});
          }
          if(item.chart){
            slide.addChart(pptx.ChartType?.bar ?? "bar",[{name:item.chart.name,labels:item.chart.labels,values:item.chart.values}],{x:7.1,y:4.7,w:5.4,h:2.2});
          }
        }
        await pptx.writeFile({fileName:file});
        return {ok:true,path:value.path};
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
        const module=await import("pptxgenjs");
        const PptxCtor:any=(module as any).default ?? module;
        const pptx=new PptxCtor();
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
}
