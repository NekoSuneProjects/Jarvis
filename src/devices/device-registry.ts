import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { JarvisDatabase } from "../storage/database.js";
import { config } from "../config.js";

const now=()=>new Date().toISOString();
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");

export interface RegisterDeviceInput {
  pairingCode:string;
  name:string;
  platform:string;
  arch:string;
  capabilities?:string[];
  metadata?:Record<string,unknown>;
}

export class DeviceRegistry {
  constructor(private readonly database:JarvisDatabase) {}

  register(input:RegisterDeviceInput){
    if(!config.pairingCode) throw new Error("Device pairing is disabled until JARVIS_PAIRING_CODE is configured");

    const expected=Buffer.from(config.pairingCode);
    const actual=Buffer.from(input.pairingCode);
    if(expected.length!==actual.length || !timingSafeEqual(expected,actual)){
      throw new Error("Invalid pairing code");
    }

    const id=randomUUID();
    const token=randomBytes(32).toString("base64url");
    this.database.db.prepare(
      `INSERT INTO devices
       (id,name,platform,arch,token_hash,capabilities_json,metadata_json,created_at,last_seen_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      input.name,
      input.platform,
      input.arch,
      hash(token),
      JSON.stringify(input.capabilities ?? []),
      JSON.stringify(input.metadata ?? {}),
      now(),
      now()
    );

    return {id,token};
  }

  authenticate(id:string,token:string){
    const row=this.database.db.prepare(
      "SELECT token_hash,revoked FROM devices WHERE id=?"
    ).get(id) as {token_hash:string;revoked:number}|undefined;
    if(!row || row.revoked) return false;
    const actual=hash(token);
    return timingSafeEqual(Buffer.from(row.token_hash),Buffer.from(actual));
  }

  heartbeat(id:string,metadata:Record<string,unknown>={}){
    return this.database.db.prepare(
      "UPDATE devices SET last_seen_at=?,metadata_json=? WHERE id=? AND revoked=0"
    ).run(now(),JSON.stringify(metadata),id).changes>0;
  }

  list(){
    return this.database.db.prepare(
      "SELECT id,name,platform,arch,capabilities_json,metadata_json,last_seen_at,created_at,revoked FROM devices ORDER BY name"
    ).all().map((row:any)=>({
      ...row,
      capabilities:JSON.parse(row.capabilities_json),
      metadata:JSON.parse(row.metadata_json),
      revoked:Boolean(row.revoked),
      capabilities_json:undefined,
      metadata_json:undefined
    }));
  }

  revoke(id:string){
    return this.database.db.prepare("UPDATE devices SET revoked=1 WHERE id=?").run(id).changes>0;
  }
}
