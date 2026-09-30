import { z } from "zod";
import { config } from "../config.js";
import { GithubIntegration } from "../integrations/github.js";
import type { JarvisPlugin } from "./plugin-registry.js";

export function createGithubPlugin():JarvisPlugin{
  const github=new GithubIntegration(config.githubToken);
  const repo=z.object({owner:z.string().min(1),repo:z.string().min(1)});
  return {
    id:"github",
    name:"GitHub",
    version:"0.1.0",
    tools:[
      {name:"github.repos",description:"List repositories for the token user.",capability:"development.read",async execute(input){const v=z.object({limit:z.number().int().min(1).max(100).default(50)}).parse(input ?? {});return github.repos(v.limit);}},
      {name:"github.repo",description:"Read repository metadata.",capability:"development.read",async execute(input){const v=repo.parse(input);return github.repo(v.owner,v.repo);}},
      {name:"github.issues",description:"List repository issues.",capability:"development.read",async execute(input){const v=repo.extend({state:z.enum(["open","closed","all"]).default("open")}).parse(input);return github.issues(v.owner,v.repo,v.state);}},
      {name:"github.pulls",description:"List repository pull requests.",capability:"development.read",async execute(input){const v=repo.extend({state:z.enum(["open","closed","all"]).default("open")}).parse(input);return github.pulls(v.owner,v.repo,v.state);}},
      {name:"github.actions",description:"List recent GitHub Actions runs.",capability:"development.read",async execute(input){const v=repo.parse(input);return github.runs(v.owner,v.repo);}},
      {name:"github.issue.create",description:"Create a repository issue.",capability:"development.write",async execute(input){const v=repo.extend({title:z.string().min(1),body:z.string().optional()}).parse(input);return github.createIssue(v.owner,v.repo,v.title,v.body);}}
    ]
  };
}
