import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { JarvisDatabase } from "../storage/database.js";

const now=()=>new Date().toISOString();

export class SecretVault {
  private readonly key:Buffer;

  constructor(
    private readonly database:JarvisDatabase,
    dataDir:string,
    configuredKey:string
  ){
    this.key=this.loadKey(dataDir,configuredKey);
  }

  private loadKey(dataDir:string,configuredKey:string){
    if(configuredKey){
      return createHash("sha256").update(configuredKey,"utf8").digest();
    }

    fs.mkdirSync(dataDir,{recursive:true});
    const filename=path.join(dataDir,"secrets.key");

    if(fs.existsSync(filename)){
      const raw=fs.readFileSync(filename);
      if(raw.length!==32) throw new Error("Invalid Jarvis secrets.key length");
      return raw;
    }

    const key=randomBytes(32);
    fs.writeFileSync(filename,key,{mode:0o600});
    try{fs.chmodSync(filename,0o600);}catch{}
    return key;
  }

  set(name:string,value:string){
    const iv=randomBytes(12);
    const cipher=createCipheriv("aes-256-gcm",this.key,iv);
    const ciphertext=Buffer.concat([
      cipher.update(value,"utf8"),
      cipher.final()
    ]);
    const authTag=cipher.getAuthTag();

    this.database.db.prepare(
      `INSERT INTO secrets (name,ciphertext,iv,auth_tag,updated_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(name) DO UPDATE SET
         ciphertext=excluded.ciphertext,
         iv=excluded.iv,
         auth_tag=excluded.auth_tag,
         updated_at=excluded.updated_at`
    ).run(
      name,
      ciphertext.toString("base64"),
      iv.toString("base64"),
      authTag.toString("base64"),
      now()
    );

    return {name,updatedAt:now()};
  }

  get(name:string):string|undefined{
    const row=this.database.db.prepare(
      "SELECT ciphertext,iv,auth_tag FROM secrets WHERE name=?"
    ).get(name) as {
      ciphertext:string;
      iv:string;
      auth_tag:string;
    }|undefined;

    if(!row) return undefined;

    const decipher=createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(row.iv,"base64")
    );
    decipher.setAuthTag(Buffer.from(row.auth_tag,"base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(row.ciphertext,"base64")),
      decipher.final()
    ]).toString("utf8");
  }

  list(){
    return this.database.db.prepare(
      "SELECT name,updated_at FROM secrets ORDER BY name"
    ).all();
  }

  delete(name:string){
    return this.database.db.prepare(
      "DELETE FROM secrets WHERE name=?"
    ).run(name).changes>0;
  }

  has(name:string){
    return Boolean(this.database.db.prepare(
      "SELECT 1 FROM secrets WHERE name=?"
    ).get(name));
  }
}
