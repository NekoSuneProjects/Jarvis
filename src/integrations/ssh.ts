import fs from "node:fs/promises";
import { Client } from "ssh2";

export interface SshHostConfig {
  host:string;
  port?:number;
  username:string;
  password?:string;
  privateKeyPath?:string;
}

export class SshIntegration {
  constructor(private readonly hosts:Record<string,SshHostConfig>){}

  listHosts(){
    return Object.entries(this.hosts).map(([name,host])=>({
      name,
      host:host.host,
      port:host.port ?? 22,
      username:host.username,
      auth:host.privateKeyPath?"key":host.password?"password":"agent/none"
    }));
  }

  private async connectionConfig(name:string){
    const host=this.hosts[name];
    if(!host) throw new Error(`Unknown SSH host: ${name}`);
    return {
      host:host.host,
      port:host.port ?? 22,
      username:host.username,
      ...(host.password?{password:host.password}:{}),
      ...(host.privateKeyPath?{privateKey:await fs.readFile(host.privateKeyPath)}:{})
    };
  }

  async exec(name:string,command:string,timeoutMs=30000){
    const config=await this.connectionConfig(name);

    return new Promise<{stdout:string;stderr:string;code:number|null}>((resolve,reject)=>{
      const client=new Client();
      let settled=false;
      const timer=setTimeout(()=>{
        if(settled) return;
        settled=true;
        client.end();
        reject(new Error("SSH command timed out"));
      },timeoutMs);

      const finish=(fn:()=>void)=>{
        if(settled) return;
        settled=true;
        clearTimeout(timer);
        fn();
      };

      client.on("ready",()=>{
        client.exec(command,(error,stream)=>{
          if(error){
            finish(()=>reject(error));
            return;
          }
          let stdout="";
          let stderr="";
          let exitCode:number|null=null;
          stream.on("data",(chunk:Buffer)=>stdout+=chunk.toString());
          stream.stderr.on("data",(chunk:Buffer)=>stderr+=chunk.toString());
          stream.on("exit",(code:number)=>{exitCode=code;});
          stream.on("close",()=>{
            client.end();
            finish(()=>resolve({stdout,stderr,code:exitCode}));
          });
        });
      });

      client.on("error",(error)=>finish(()=>reject(error)));
      client.connect(config);
    });
  }

  async test(name:string){
    const result=await this.exec(name,"printf JARVIS_SSH_OK",10000);
    return {ok:result.stdout.includes("JARVIS_SSH_OK")};
  }
}
