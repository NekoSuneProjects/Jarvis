export interface SearxResult {
  title:string;
  url:string;
  content?:string;
  engine?:string;
  score?:number;
}

export class SearxngIntegration {
  constructor(private readonly baseUrl:string) {}

  get configured():boolean {
    return Boolean(this.baseUrl);
  }

  async search(query:string,options:{categories?:string;language?:string;safesearch?:0|1|2;limit?:number}={}):Promise<SearxResult[]>{
    if(!this.baseUrl) throw new Error("SearXNG is not configured");
    const url=new URL("/search",this.baseUrl);
    url.searchParams.set("q",query);
    url.searchParams.set("format","json");
    if(options.categories) url.searchParams.set("categories",options.categories);
    if(options.language) url.searchParams.set("language",options.language);
    if(options.safesearch!==undefined) url.searchParams.set("safesearch",String(options.safesearch));

    const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error(`SearXNG HTTP ${response.status}`);
    const body=await response.json() as {results?:SearxResult[]};
    return (body.results ?? []).slice(0,options.limit ?? 10);
  }
}
