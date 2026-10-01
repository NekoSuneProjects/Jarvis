import fs from "node:fs";
import path from "node:path";

export class RotatingJsonLog {
  private bytes=0;

  constructor(
    private readonly file:string,
    private readonly maxBytes=5*1024*1024,
    private readonly backups=3
  ){
    fs.mkdirSync(path.dirname(file),{recursive:true});
    try{this.bytes=fs.statSync(file).size;}catch{}
  }

  write(record:unknown){
    const line=JSON.stringify({at:new Date().toISOString(),...record as any})+"\n";
    const size=Buffer.byteLength(line);
    if(this.bytes+size>this.maxBytes) this.rotate();
    fs.appendFileSync(this.file,line,"utf8");
    this.bytes+=size;
  }

  private rotate(){
    for(let i=this.backups-1;i>=1;i--){
      const from=`${this.file}.${i}`;
      const to=`${this.file}.${i+1}`;
      if(fs.existsSync(from)) fs.renameSync(from,to);
    }
    if(fs.existsSync(this.file)) fs.renameSync(this.file,`${this.file}.1`);
    this.bytes=0;
  }
}
