import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BrowserAutomation } from "../browser/automation.js";
import { config } from "../config.js";
import { workspacePath } from "../utils/workspace-path.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createBrowserPlugin(browser:BrowserAutomation):JarvisPlugin{
  return {
    id:"browser",
    name:"Browser",
    version:"0.2.0",
    description:"Playwright browser automation using an installed Chrome/Chromium.",
    tools:[
      {
        name:"browser.open",
        description:"Navigate the automation browser to a URL, optionally in a new tab.",
        capability:"browser.navigate",
        async execute(input){
          const value=z.object({url:z.string().url(),newTab:z.boolean().default(false)}).parse(input);
          return browser.open(value.url,value.newTab);
        }
      },
      {
        name:"browser.tabs",
        description:"List open automation browser tabs.",
        capability:"browser.read",
        async execute(){return browser.tabs();}
      },
      {
        name:"browser.tab.switch",
        description:"Switch the active browser tab by zero-based index.",
        capability:"browser.navigate",
        async execute(input){
          const value=z.object({index:z.number().int().min(0)}).parse(input);
          return browser.switchTab(value.index);
        }
      },
      {
        name:"browser.tab.close",
        description:"Close a browser tab.",
        capability:"browser.navigate",
        async execute(input){
          const value=z.object({index:z.number().int().min(0).optional()}).parse(input ?? {});
          return browser.closeTab(value.index);
        }
      },
      {
        name:"browser.read",
        description:"Read visible text from the active page.",
        capability:"browser.read",
        async execute(){return browser.read();}
      },
      {
        name:"browser.click",
        description:"Click a CSS selector on the active page.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1)}).parse(input);
          return browser.click(value.selector);
        }
      },
      {
        name:"browser.type",
        description:"Type into a CSS selector.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1),text:z.string(),clear:z.boolean().default(true)}).parse(input);
          return browser.type(value.selector,value.text,value.clear);
        }
      },
      {
        name:"browser.select",
        description:"Select an option in a select element.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1),value:z.string()}).parse(input);
          return browser.select(value.selector,value.value);
        }
      },
      {
        name:"browser.check",
        description:"Check or uncheck a checkbox/radio locator.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1),checked:z.boolean().default(true)}).parse(input);
          return browser.check(value.selector,value.checked);
        }
      },
      {
        name:"browser.upload",
        description:"Upload workspace files to a file input.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1),files:z.array(z.string()).min(1)}).parse(input);
          const files=value.files.map(workspacePath);
          return browser.upload(value.selector,files);
        }
      },
      {
        name:"browser.download",
        description:"Click a selector and save its download into the Jarvis workspace downloads folder.",
        capability:"browser.interact",
        async execute(input){
          const value=z.object({selector:z.string().min(1),folder:z.string().default("downloads")}).parse(input);
          return browser.downloadClick(value.selector,workspacePath(value.folder));
        }
      },
      {
        name:"browser.screenshot",
        description:"Capture the active browser page.",
        capability:"browser.read",
        async execute(input){
          const value=z.object({filename:z.string().default("browser.png"),fullPage:z.boolean().default(false)}).parse(input ?? {});
          const output=path.resolve(config.dataDir,"screenshots",path.basename(value.filename));
          await fs.mkdir(path.dirname(output),{recursive:true});
          return browser.screenshot(output,value.fullPage);
        }
      }
    ]
  };
}
