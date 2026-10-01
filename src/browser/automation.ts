import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { config } from "../config.js";

export class BrowserAutomation {
  private browser?:Browser;
  private context?:BrowserContext;
  private page?:Page;

  private async ensurePage():Promise<Page>{
    if(this.page && !this.page.isClosed()) return this.page;

    this.browser=await chromium.launch({
      headless:config.browser.headless,
      ...(config.browser.executablePath
        ? {executablePath:config.browser.executablePath}
        : {channel:config.browser.channel as "chrome"})
    });
    this.context=await this.browser.newContext({acceptDownloads:true});
    this.page=await this.context.newPage();
    return this.page;
  }

  async available(){
    try{
      const browser=await chromium.launch({
        headless:true,
        ...(config.browser.executablePath
          ? {executablePath:config.browser.executablePath}
          : {channel:config.browser.channel as "chrome"})
      });
      await browser.close();
      return {ok:true};
    }catch(error){
      return {ok:false,error:error instanceof Error?error.message:String(error)};
    }
  }

  async open(url:string,newTab=false){
    const current=await this.ensurePage();
    const page=newTab ? await this.context!.newPage() : current;
    this.page=page;
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    return {url:page.url(),title:await page.title()};
  }

  async tabs(){
    await this.ensurePage();
    return Promise.all((this.context?.pages() ?? []).map(async (page,index)=>({
      index,
      url:page.url(),
      title:await page.title(),
      active:page===this.page
    })));
  }

  async switchTab(index:number){
    await this.ensurePage();
    const pages=this.context?.pages() ?? [];
    if(!pages[index]) throw new Error("Browser tab not found");
    this.page=pages[index];
    await this.page.bringToFront();
    return {index,url:this.page.url(),title:await this.page.title()};
  }

  async closeTab(index?:number){
    await this.ensurePage();
    const pages=this.context?.pages() ?? [];
    const target=index===undefined ? this.page : pages[index];
    if(!target) throw new Error("Browser tab not found");
    await target.close();
    const remaining=this.context?.pages() ?? [];
    this.page=remaining.at(-1);
    return {ok:true,tabs:await this.tabs()};
  }

  async read(){
    const page=await this.ensurePage();
    return {
      url:page.url(),
      title:await page.title(),
      text:(await page.locator("body").innerText()).slice(0,100000)
    };
  }

  async click(selector:string){
    const page=await this.ensurePage();
    await page.locator(selector).first().click({timeout:15000});
    return {ok:true,url:page.url()};
  }

  async type(selector:string,text:string,clear=true){
    const page=await this.ensurePage();
    const locator=page.locator(selector).first();
    if(clear) await locator.fill(text,{timeout:15000});
    else await locator.pressSequentially(text,{delay:20});
    return {ok:true};
  }

  async select(selector:string,value:string){
    const page=await this.ensurePage();
    const selected=await page.locator(selector).first().selectOption(value);
    return {ok:true,selected};
  }

  async check(selector:string,checked=true){
    const page=await this.ensurePage();
    const locator=page.locator(selector).first();
    if(checked) await locator.check({timeout:15000});
    else await locator.uncheck({timeout:15000});
    return {ok:true};
  }

  async upload(selector:string,files:string[]){
    const page=await this.ensurePage();
    await page.locator(selector).first().setInputFiles(files);
    return {ok:true,files};
  }

  async downloadClick(selector:string,downloadDir:string){
    const page=await this.ensurePage();
    await fs.mkdir(downloadDir,{recursive:true});
    const [download]=await Promise.all([
      page.waitForEvent("download",{timeout:30000}),
      page.locator(selector).first().click({timeout:15000})
    ]);
    const suggested=path.basename(download.suggestedFilename());
    const target=path.join(downloadDir,suggested);
    await download.saveAs(target);
    return {path:target,suggestedFilename:suggested};
  }

  async screenshot(outputPath:string,fullPage=false){
    const page=await this.ensurePage();
    await page.screenshot({path:outputPath,fullPage});
    return {path:outputPath};
  }

  async close(){
    await this.browser?.close();
    this.browser=undefined;
    this.context=undefined;
    this.page=undefined;
  }
}
