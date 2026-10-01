import { z } from "zod";
import { config } from "../config.js";
import { GithubIntegration } from "../integrations/github.js";
import { runProcess } from "../utils/process.js";
import { workspacePath } from "../utils/workspace-path.js";
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
      {name:"github.issue.create",description:"Create a repository issue.",capability:"development.write",async execute(input){const v=repo.extend({title:z.string().min(1),body:z.string().optional()}).parse(input);return github.createIssue(v.owner,v.repo,v.title,v.body);}},
      {name:"github.repo.search",description:"Search public or accessible GitHub repositories.",capability:"development.read",async execute(input){const v=z.object({query:z.string().min(1),limit:z.number().int().min(1).max(100).default(20)}).parse(input);return github.searchRepositories(v.query,v.limit);}},
      {name:"github.issue.update",description:"Update an issue title, body, or state.",capability:"development.write",async execute(input){const v=repo.extend({number:z.number().int().positive(),title:z.string().optional(),body:z.string().optional(),state:z.enum(["open","closed"]).optional()}).parse(input);return github.updateIssue(v.owner,v.repo,v.number,{title:v.title,body:v.body,state:v.state});}},
      {name:"github.issue.comment",description:"Comment on an issue.",capability:"development.write",async execute(input){const v=repo.extend({number:z.number().int().positive(),body:z.string().min(1)}).parse(input);return github.commentIssue(v.owner,v.repo,v.number,v.body);}},
      {name:"github.pull.create",description:"Create a pull request.",capability:"development.write",async execute(input){const v=repo.extend({title:z.string().min(1),head:z.string().min(1),base:z.string().min(1),body:z.string().optional(),draft:z.boolean().default(false)}).parse(input);return github.createPull(v.owner,v.repo,v.title,v.head,v.base,v.body,v.draft);}},
      {name:"github.pull.get",description:"Read pull request details.",capability:"development.read",async execute(input){const v=repo.extend({number:z.number().int().positive()}).parse(input);return github.pull(v.owner,v.repo,v.number);}},
      {name:"github.pull.reviews",description:"Read pull request reviews.",capability:"development.read",async execute(input){const v=repo.extend({number:z.number().int().positive()}).parse(input);return github.reviews(v.owner,v.repo,v.number);}},
      {name:"github.pull.review",description:"Submit a pull request review.",capability:"development.write",async execute(input){const v=repo.extend({number:z.number().int().positive(),body:z.string().default(""),event:z.enum(["APPROVE","REQUEST_CHANGES","COMMENT"])}).parse(input);return github.createReview(v.owner,v.repo,v.number,v.body,v.event);}},
      {name:"github.actions.run",description:"Read one workflow run and its jobs.",capability:"development.read",async execute(input){const v=repo.extend({runId:z.number().int().positive()}).parse(input);return {run:await github.workflowRun(v.owner,v.repo,v.runId),jobs:await github.workflowJobs(v.owner,v.repo,v.runId)};}},
      {name:"github.actions.logs",description:"Download a GitHub Actions run log archive as base64 ZIP data.",capability:"development.read",async execute(input){const v=repo.extend({runId:z.number().int().positive()}).parse(input);return github.workflowLogs(v.owner,v.repo,v.runId);}},
      {name:"github.actions.rerun",description:"Re-run a GitHub Actions workflow run.",capability:"development.write",async execute(input){const v=repo.extend({runId:z.number().int().positive()}).parse(input);await github.rerunWorkflow(v.owner,v.repo,v.runId);return {ok:true};}},
      {name:"github.releases",description:"List repository releases.",capability:"development.read",async execute(input){const v=repo.parse(input);return github.releases(v.owner,v.repo);}},
      {name:"github.release.create",description:"Create a GitHub release.",capability:"development.write",async execute(input){const v=repo.extend({tag:z.string().min(1),name:z.string().optional(),body:z.string().optional(),draft:z.boolean().default(false),prerelease:z.boolean().default(false)}).parse(input);return github.createRelease(v.owner,v.repo,v.tag,v.name,v.body,v.draft,v.prerelease);}},
      {name:"github.branches",description:"List repository branches.",capability:"development.read",async execute(input){const v=repo.parse(input);return github.branches(v.owner,v.repo);}},
      {name:"github.branch.create",description:"Create a branch from an existing branch.",capability:"development.write",async execute(input){const v=repo.extend({branch:z.string().min(1),from:z.string().default("main")}).parse(input);return github.createBranch(v.owner,v.repo,v.branch,v.from);}},
      {name:"github.clone",description:"Clone a GitHub repository into the Jarvis workspace.",capability:"development.write",async execute(input){
        const v=repo.extend({path:z.string().min(1),branch:z.string().optional(),depth:z.number().int().min(1).max(1000).default(1)}).parse(input);
        const target=workspacePath(v.path);
        const args=["clone","--depth",String(v.depth)];
        if(v.branch) args.push("--branch",v.branch);
        args.push(`https://github.com/${v.owner}/${v.repo}.git`,target);
        const result=await runProcess("git",args,{timeoutMs:120000});
        if(result.code!==0) throw new Error(result.stderr || "git clone failed");
        return {ok:true,path:v.path,output:result.stdout};
      }},
      {name:"github.pull_local",description:"Pull the current branch in a cloned repository under the Jarvis workspace.",capability:"development.write",async execute(input){
        const v=z.object({path:z.string().min(1),remote:z.string().default("origin"),branch:z.string().optional()}).parse(input);
        const args=["-C",workspacePath(v.path),"pull",v.remote];
        if(v.branch) args.push(v.branch);
        const result=await runProcess("git",args,{timeoutMs:120000});
        if(result.code!==0) throw new Error(result.stderr || "git pull failed");
        return {ok:true,output:result.stdout};
      }},
      {name:"github.commit_local",description:"Commit staged/all changes in a cloned repository under the Jarvis workspace.",capability:"development.write",async execute(input){
        const v=z.object({path:z.string().min(1),message:z.string().min(1),all:z.boolean().default(true)}).parse(input);
        const cwd=workspacePath(v.path);
        if(v.all){
          const add=await runProcess("git",["-C",cwd,"add","-A"],{timeoutMs:30000});
          if(add.code!==0) throw new Error(add.stderr || "git add failed");
        }
        const result=await runProcess("git",["-C",cwd,"commit","-m",v.message],{timeoutMs:30000});
        if(result.code!==0) throw new Error(result.stderr || "git commit failed");
        return {ok:true,output:result.stdout};
      }},
      {name:"github.push_local",description:"Push a cloned repository branch to GitHub.",capability:"development.write",async execute(input){
        const v=z.object({path:z.string().min(1),remote:z.string().default("origin"),branch:z.string().optional(),setUpstream:z.boolean().default(false)}).parse(input);
        const cwd=workspacePath(v.path);
        const args=["-C",cwd,"push"];
        if(v.setUpstream) args.push("-u");
        args.push(v.remote);
        if(v.branch) args.push(v.branch);
        const result=await runProcess("git",args,{timeoutMs:120000});
        if(result.code!==0) throw new Error(result.stderr || "git push failed");
        return {ok:true,output:result.stdout};
      }}
    ]
  };
}
