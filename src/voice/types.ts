export interface TtsRequest {
  text:string;
  outputPath:string;
}

export interface TtsProvider {
  readonly id:string;
  available():Promise<boolean>;
  synthesize(request:TtsRequest):Promise<{outputPath:string}>;
}
