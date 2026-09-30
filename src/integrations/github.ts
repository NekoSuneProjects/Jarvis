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
}
