import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { BrowserAutomation } from "../browser/automation.js";
import { config } from "../config.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createBrowserPlugin(browser:BrowserAutomation):JarvisPlugin{
  return {
    id:"browser",
    name:"Browser",
    version:"0.1.0",
    description:"Playwright browser automation using an installed Chrome/Chromium.",
    tools:[
      {
        name:"browser.open",
        description:"Navigate the automation browser to a URL.",
        capability:"browser.navigate",
        async execute(input){
          const value=z.object({url:z.string().url()}).parse(input);
          return browser.open(value.url);
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
        name:"browser.screenshot",
        description:"Capture the active browser page.",
        capability:"browser.read",
        async execute(input){
          const value=z.object({filename:z.string().default("browser.png")}).parse(input ?? {});
          const output=path.resolve(config.dataDir,"screenshots",path.basename(value.filename));
          await fs.mkdir(path.dirname(output),{recursive:true});
          return browser.screenshot(output);
        }
      }
    ]
  };
}
