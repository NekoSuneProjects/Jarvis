import fs from "node:fs/promises";
import path from "node:path";
import { chromium, firefox, type Browser, type BrowserContext, type Page } from "playwright-core";
import { config } from "../config.js";

export class BrowserAutomation {
  private browser?:Browser;
  private context?:BrowserContext;
  private page?:Page;
  private readonly actionTimes:number[]=[];

  private guardAction(){
    const cutoff=Date.now()-60000;
    while(this.actionTimes.length && this.actionTimes[0]<cutoff) this.actionTimes.shift();
    if(this.actionTimes.length>=config.browser.maxActionsPerMinute){
      throw new Error("Browser anti-loop protection triggered: too many actions in one minute");
    }
    this.actionTimes.push(Date.now());
  }

  private async ensurePage():Promise<Page>{
    if(this.page && !this.page.isClosed()) return this.page;

    const engine=config.browser.engine==="firefox"?firefox:chromium;
    await fs.mkdir(path.resolve(config.browser.profileDir),{recursive:true});
    this.context=await engine.launchPersistentContext(path.resolve(config.browser.profileDir),{
      headless:config.browser.headless,
      acceptDownloads:true,
      ...(config.browser.executablePath
        ? {executablePath:config.browser.executablePath}
        : config.browser.engine==="chromium"
          ? {channel:config.browser.channel as "chrome"}
          : {})
    });
    this.page=this.context.pages()[0] ?? await this.context.newPage();
    return this.page;
  }

  async available(){
    try{
      const engine=config.browser.engine==="firefox"?firefox:chromium;
      const browser=await engine.launch({
        headless:true,
        ...(config.browser.executablePath
          ? {executablePath:config.browser.executablePath}
          : config.browser.engine==="chromium"
            ? {channel:config.browser.channel as "chrome"}
            : {})
      });
      await browser.close();
      return {ok:true};
    }catch(error){
      return {ok:false,error:error instanceof Error?error.message:String(error)};
    }
  }

  async open(url:string,newTab=false){
    this.guardAction();
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
    this.guardAction();
    const page=await this.ensurePage();
    await page.locator(selector).first().click({timeout:15000});
    return {ok:true,url:page.url()};
  }

  async type(selector:string,text:string,clear=true){
    this.guardAction();
    const page=await this.ensurePage();
    const locator=page.locator(selector).first();
    if(clear) await locator.fill(text,{timeout:15000});
    else await locator.pressSequentially(text,{delay:20});
    return {ok:true};
  }

  async select(selector:string,value:string){
    this.guardAction();
    const page=await this.ensurePage();
    const selected=await page.locator(selector).first().selectOption(value);
    return {ok:true,selected};
  }

  async check(selector:string,checked=true){
    this.guardAction();
    const page=await this.ensurePage();
    const locator=page.locator(selector).first();
    if(checked) await locator.check({timeout:15000});
    else await locator.uncheck({timeout:15000});
    return {ok:true};
  }

  async upload(selector:string,files:string[]){
    this.guardAction();
    const page=await this.ensurePage();
    await page.locator(selector).first().setInputFiles(files);
    return {ok:true,files};
  }

  async downloadClick(selector:string,downloadDir:string){
    this.guardAction();
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
    await this.context?.close();
    await this.browser?.close();
    this.browser=undefined;
    this.context=undefined;
    this.page=undefined;
  }
}
