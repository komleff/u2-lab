import { finite, nonnegative } from "./domain";
import { curveBounds, curveMean, type EvaluatedCurve } from "./history";
import type { SignatureBucket, SourceChannel } from "./runtime";

export function signatureBinEdges(horizonS: number): number[] {
  finite(horizonS, "signature horizon");
  if (!(horizonS > 0)) throw new RangeError("Signature horizon must be positive");
  const edges=[0];
  for(let i=1;i<=100;i++) {
    // Умножение на долю не переполняет MAX_VALUE; subnormal края сливаются точно.
    const edge=i===100?horizonS:horizonS*(i/100);
    if(edge!==edges.at(-1))edges.push(edge);
  }
  return edges;
}

function clippedMean(curve: EvaluatedCurve, from: number, to: number): number {
  const pieces="pieces" in curve?curve.pieces:[{from:0,to:1,curve}];
  const used=pieces.filter(p=>Math.min(to,p.to)>Math.max(from,p.from));
  // MIN_VALUE × clipped span может underflow до деления: константа известна буквально.
  if(used.length&&used.every(p=>p.curve.b===0&&p.curve.c===0&&p.curve.a===used[0].curve.a))return used[0].curve.a;
  return finite(curveMean(curve,from,to),"clipped mean");
}
function weightedMean(a: number, b: number, da: number, db: number): number {
  if(a===b)return a;
  const scale=Math.max(Math.abs(a),Math.abs(b));
  return finite((((a/scale)*da+(b/scale)*db)/(da+db))*scale,"bin mean");
}

export function appendSignatureBins(buckets: SignatureBucket[], curves: Record<SourceChannel,EvaluatedCurve>, startS: number, endS: number, horizonS: number): void {
  const edges=signatureBinEdges(horizonS);
  nonnegative(startS,"bin interval start");finite(endS,"bin interval end");
  if(!(endS>startS)||endS>horizonS||(buckets.at(-1)?.endS??0)!==startS)throw new RangeError("Signature bins require a continuous observed prefix within H");
  for(let i=1;i<edges.length;i++) {
    const start=Math.max(startS,edges[i-1]),end=Math.min(endS,edges[i]);
    if(!(end>start))continue;
    const from=(start-startS)/(endS-startS),to=(end-startS)/(endS-startS),values={} as SignatureBucket["values"];
    const previous=buckets.at(-1),same=previous?.startS===edges[i-1],da=same?previous!.endS-previous!.startS:0;
    for(const channel of Object.keys(curves) as SourceChannel[]) {
      const bounds=curveBounds(curves[channel],from,to),mean=clippedMean(curves[channel],from,to);
      finite(bounds.min,"bin minimum");finite(bounds.max,"bin maximum");
      const prior=same?previous!.values[channel]:undefined;
      values[channel]={mean:prior?weightedMean(prior.mean,mean,da,end-start):mean,min:prior?Math.min(prior.min,bounds.min):bounds.min,max:prior?Math.max(prior.max,bounds.max):bounds.max};
    }
    if(same){previous!.endS=end;previous!.values=values;}
    else buckets.push({startS:edges[i-1],endS:end,values});
  }
}
