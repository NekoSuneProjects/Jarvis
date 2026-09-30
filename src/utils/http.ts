export interface RetryOptions {
  retries?:number;
  baseDelayMs?:number;
  maxDelayMs?:number;
  retryStatuses?:number[];
}

function delay(ms:number){
  return new Promise((resolve)=>setTimeout(resolve,ms));
}

function retryAfterMs(response:Response):number|undefined{
  const value=response.headers.get("retry-after");
  if(!value) return undefined;

  const seconds=Number(value);
  if(Number.isFinite(seconds)) return Math.max(0,seconds*1000);

  const date=Date.parse(value);
  if(Number.isFinite(date)) return Math.max(0,date-Date.now());
  return undefined;
}

export async function fetchWithRetry(
  input:string|URL|Request,
  init:RequestInit={},
  options:RetryOptions={}
):Promise<Response>{
  const retries=options.retries ?? 2;
  const baseDelayMs=options.baseDelayMs ?? 400;
  const maxDelayMs=options.maxDelayMs ?? 5000;
  const retryStatuses=new Set(options.retryStatuses ?? [408,425,429,500,502,503,504]);

  let lastError:unknown;

  for(let attempt=0;attempt<=retries;attempt++){
    try{
      const response=await fetch(input,init);
      if(!retryStatuses.has(response.status) || attempt===retries){
        return response;
      }

      const retryAfter=retryAfterMs(response);
      const backoff=Math.min(maxDelayMs,baseDelayMs*(2**attempt));
      await delay(retryAfter ?? backoff);
    }catch(error){
      lastError=error;
      if(attempt===retries) throw error;
      await delay(Math.min(maxDelayMs,baseDelayMs*(2**attempt)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("HTTP request failed");
}
