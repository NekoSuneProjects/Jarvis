export interface TtsRequest {
  text:string;
  outputPath:string;
  voice?:string;
  rate?:string;
  pitch?:string;
  volume?:string;
}

export interface TtsProvider {
  readonly id:string;
  available():Promise<boolean>;
  synthesize(request:TtsRequest):Promise<{outputPath:string}>;
}
