import path from "node:path";
import { config } from "../config.js";

export function workspacePath(relative:string):string{
  const root=path.resolve(config.filesRoot);
  const target=path.resolve(root,relative);
  if(target!==root && !target.startsWith(root+path.sep)){
    throw new Error("Path escapes JARVIS_FILES_ROOT");
  }
  return target;
}
