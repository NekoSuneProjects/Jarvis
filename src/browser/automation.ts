import { chromium, type Browser, type Page } from "playwright-core";
import { config } from "../config.js";

export class BrowserAutomation {
  private browser?:Browser;
  private page?:Page;

  private async ensurePage():Promise<Page>{
    if(this.page && !this.page.isClosed()) return this.page;

    this.browser=await chromium.launch({
      headless:config.browser.headless,
      ...(config.browser.executablePath
        ? {executablePath:config.browser.executablePath}
        : {channel:config.browser.channel})
    });
    this.page=await this.browser.newPage();
    return this.page;
  }

  async open(url:string){
    const page=await this.ensurePage();
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    return {url:page.url(),title:await page.title()};
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

  async screenshot(outputPath:string){
    const page=await this.ensurePage();
    await page.screenshot({path:outputPath,fullPage:false});
    return {path:outputPath};
  }

  async close(){
    await this.browser?.close();
    this.browser=undefined;
    this.page=undefined;
  }
}
