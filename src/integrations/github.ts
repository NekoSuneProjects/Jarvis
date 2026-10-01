export class GithubIntegration {
  constructor(private readonly token:string) {}

  get configured(){return Boolean(this.token);}

  private async request(path:string,init:RequestInit={}){
    if(!this.token) throw new Error("GitHub token is not configured");
    const response=await fetch(`https://api.github.com${path}`,{
      ...init,
      headers:{
        authorization:`Bearer ${this.token}`,
        accept:"application/vnd.github+json",
        "x-github-api-version":"2022-11-28",
        "content-type":"application/json",
        ...(init.headers ?? {})
      },
      signal:AbortSignal.timeout(15000)
    });
    if(response.status===204) return null;
    if(!response.ok) throw new Error(`GitHub HTTP ${response.status}: ${await response.text()}`);
    return response.json();
  }

  repos(limit=50){return this.request(`/user/repos?sort=updated&per_page=${limit}`);}
  repo(owner:string,name:string){return this.request(`/repos/${owner}/${name}`);}
  issues(owner:string,name:string,state="open"){return this.request(`/repos/${owner}/${name}/issues?state=${state}&per_page=50`);}
  pulls(owner:string,name:string,state="open"){return this.request(`/repos/${owner}/${name}/pulls?state=${state}&per_page=50`);}
  runs(owner:string,name:string){return this.request(`/repos/${owner}/${name}/actions/runs?per_page=20`);}
  createIssue(owner:string,name:string,title:string,body?:string){
    return this.request(`/repos/${owner}/${name}/issues`,{method:"POST",body:JSON.stringify({title,body})});
  }
  searchRepositories(query:string,limit=20){
    return this.request(`/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`);
  }
  updateIssue(owner:string,name:string,number:number,fields:{title?:string;body?:string;state?:"open"|"closed"}){
    return this.request(`/repos/${owner}/${name}/issues/${number}`,{method:"PATCH",body:JSON.stringify(fields)});
  }
  commentIssue(owner:string,name:string,number:number,body:string){
    return this.request(`/repos/${owner}/${name}/issues/${number}/comments`,{method:"POST",body:JSON.stringify({body})});
  }
  createPull(owner:string,name:string,title:string,head:string,base:string,body?:string,draft=false){
    return this.request(`/repos/${owner}/${name}/pulls`,{method:"POST",body:JSON.stringify({title,head,base,body,draft})});
  }
  pull(owner:string,name:string,number:number){
    return this.request(`/repos/${owner}/${name}/pulls/${number}`);
  }
  reviews(owner:string,name:string,number:number){
    return this.request(`/repos/${owner}/${name}/pulls/${number}/reviews`);
  }
  createReview(owner:string,name:string,number:number,body:string,event:"APPROVE"|"REQUEST_CHANGES"|"COMMENT"){
    return this.request(`/repos/${owner}/${name}/pulls/${number}/reviews`,{method:"POST",body:JSON.stringify({body,event})});
  }
  workflowRun(owner:string,name:string,runId:number){
    return this.request(`/repos/${owner}/${name}/actions/runs/${runId}`);
  }
  workflowJobs(owner:string,name:string,runId:number){
    return this.request(`/repos/${owner}/${name}/actions/runs/${runId}/jobs`);
  }
  rerunWorkflow(owner:string,name:string,runId:number){
    return this.request(`/repos/${owner}/${name}/actions/runs/${runId}/rerun`,{method:"POST"});
  }
  releases(owner:string,name:string){
    return this.request(`/repos/${owner}/${name}/releases?per_page=50`);
  }
  createRelease(owner:string,name:string,tag:string,releaseName?:string,body?:string,draft=false,prerelease=false){
    return this.request(`/repos/${owner}/${name}/releases`,{method:"POST",body:JSON.stringify({tag_name:tag,name:releaseName,body,draft,prerelease})});
  }
  branches(owner:string,name:string){
    return this.request(`/repos/${owner}/${name}/branches?per_page=100`);
  }
  async createBranch(owner:string,name:string,branch:string,from:string){
    const ref=await this.request(`/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(from)}`) as any;
    return this.request(`/repos/${owner}/${name}/git/refs`,{method:"POST",body:JSON.stringify({ref:`refs/heads/${branch}`,sha:ref.object.sha})});
  }
}
