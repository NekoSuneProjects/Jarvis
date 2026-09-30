import fs from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";

const AUDIO_EXTENSIONS=new Set([".mp3",".flac",".m4a",".aac",".wav",".ogg",".opus",".wma"]);

export interface LocalTrack {
  path:string;
  title:string;
  artist?:string;
  album?:string;
  duration?:number;
}

export class LocalMusicIntegration {
  constructor(private readonly root:string){}

  get configured(){return Boolean(this.root);}

  private async files(dir:string,depth=0):Promise<string[]>{
    if(depth>8) return [];
    const entries=await fs.readdir(dir,{withFileTypes:true});
    const out:string[]=[];
    for(const entry of entries){
      const target=path.join(dir,entry.name);
      if(entry.isDirectory()) out.push(...await this.files(target,depth+1));
      else if(AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(target);
    }
    return out;
  }

  async scan(limit=5000):Promise<LocalTrack[]>{
    if(!this.configured) throw new Error("LOCAL_MUSIC_DIR is not configured");
    const paths=(await this.files(path.resolve(this.root))).slice(0,limit);
    const tracks:LocalTrack[]=[];
    for(const filename of paths){
      try{
        const meta=await parseFile(filename,{duration:true,skipCovers:true});
        tracks.push({
          path:filename,
          title:meta.common.title ?? path.basename(filename,path.extname(filename)),
          artist:meta.common.artist,
          album:meta.common.album,
          duration:meta.format.duration
        });
      }catch{
        tracks.push({
          path:filename,
          title:path.basename(filename,path.extname(filename))
        });
      }
    }
    return tracks;
  }

  async search(query:string,limit=50){
    const q=query.toLowerCase();
    const tracks=await this.scan();
    return tracks.filter((track)=>
      track.title.toLowerCase().includes(q) ||
      track.artist?.toLowerCase().includes(q) ||
      track.album?.toLowerCase().includes(q)
    ).slice(0,limit);
  }
}
