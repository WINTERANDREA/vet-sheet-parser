declare module "jschardet" {
  export function detect(input: Buffer | Uint8Array | string): {
    encoding?: string;
    confidence: number;
  };
}
