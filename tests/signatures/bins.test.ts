import { describe, expect, it } from "vitest";
import { appendSignatureBins, signatureBinEdges } from "../../src/signatures/bins";
import { SOURCE_CHANNELS, type SignatureBucket, type SourceChannel } from "../../src/signatures/runtime";
import { transformCurve, type EvaluatedCurve } from "../../src/signatures/history";

const curves = (c: EvaluatedCurve) => Object.fromEntries(SOURCE_CHANNELS.map(k => [k, c])) as Record<SourceChannel, EvaluatedCurve>;
const constant = (a: number) => ({ a, b: 0, c: 0 });
const near = (a: number, b: number, reference: number) => expect(Math.abs(a-b)).toBeLessThanOrEqual(1e-12*Math.abs(reference));

describe("H01/02 uniform accepted-curve bins", () => {
  it.each([3600, 1.01e-10, Number.MAX_VALUE])("has 100 distinct finite intervals for H=%s", H => {
    const edges=signatureBinEdges(H);expect(edges).toHaveLength(101);expect(edges[0]).toBe(0);expect(edges.at(-1)).toBe(H);
    for(let i=1;i<edges.length;i++){expect(Number.isFinite(edges[i])).toBe(true);expect(edges[i]).toBeGreaterThan(edges[i-1]);}
  });
  it("exact-deduplicates subnormal edges without future zeros or a new duration floor",()=>{
    expect(signatureBinEdges(Number.MIN_VALUE)).toEqual([0,Number.MIN_VALUE]);
    const buckets:SignatureBucket[]=[];appendSignatureBins(buckets,curves(constant(-Number.MIN_VALUE)),0,Number.MIN_VALUE,Number.MIN_VALUE);
    expect(buckets).toHaveLength(1);expect(buckets[0].values.IRcontrast).toEqual({mean:-Number.MIN_VALUE,min:-Number.MIN_VALUE,max:-Number.MIN_VALUE});
    for(const H of [0,-1,Infinity,NaN])expect(()=>signatureBinEdges(H)).toThrow();
  });
  it("one frame crosses bins, exact edge has no double duration, partial mean uses observed time",()=>{
    const buckets:SignatureBucket[]=[];
    appendSignatureBins(buckets,curves({a:0,b:100,c:0}),0,100,100);
    expect(buckets).toHaveLength(100);
    for(let i=0;i<100;i++){near(buckets[i].startS,i,100);near(buckets[i].endS,i+1,100);near(buckets[i].values.EM.mean,i+.5,100);}
    const partial:SignatureBucket[]=[];
    appendSignatureBins(partial,curves(constant(10)),0,.25,100);
    appendSignatureBins(partial,curves(constant(20)),.25,.75,100);
    expect(partial).toHaveLength(1);expect(partial[0].startS).toBe(0);expect(partial[0].endS).toBe(.75);
    near(partial[0].values.EM.mean,50/3,20);
    appendSignatureBins(partial,curves(constant(20)),.75,1,100);expect(partial).toHaveLength(1);
    appendSignatureBins(partial,curves(constant(30)),1,1.25,100);expect(partial).toHaveLength(2);expect(partial[1].endS).toBe(1.25);
  });
  it.each([Number.MIN_VALUE,-Number.MIN_VALUE,1e-300,-1e-300,1e308,-1e308])("preserves clipped and weighted constant %s literally",value=>{
    const buckets:SignatureBucket[]=[];
    appendSignatureBins(buckets,curves(constant(value)),0,.1,100);
    appendSignatureBins(buckets,curves({pieces:[{from:0,to:.2,curve:constant(value)},{from:.2,to:1,curve:constant(value)}]}),.1,2.5,100);
    for(const b of buckets)expect(b.values.IRcontrast).toEqual({mean:value,min:value,max:value});
  });
  it("finite normalized weighting preserves cancellation and ordinary unequal weights",()=>{
    const buckets:SignatureBucket[]=[];
    appendSignatureBins(buckets,curves(constant(1e308)),0,.5,100);
    appendSignatureBins(buckets,curves(constant(-1e308)),.5,1,100);
    expect(buckets[0].values.EM).toEqual({mean:0,min:-1e308,max:1e308});
    const tiny:SignatureBucket[]=[];appendSignatureBins(tiny,curves(constant(Number.MIN_VALUE)),0,.5,100);appendSignatureBins(tiny,curves(constant(3*Number.MIN_VALUE)),.5,1,100);
    expect(tiny[0].values.EM.mean).toBe(2*Number.MIN_VALUE);
  });
  it("analytic clipping keeps interior extrema and transforms before averaging",()=>{
    const input={a:-1,b:4,c:-4}; // signed -4(x-.5)^2, interior maximum 0
    const buckets:SignatureBucket[]=[];appendSignatureBins(buckets,curves(input),0,2,100);
    near(buckets[0].values.IRcontrast.mean,-1/3,1);expect(buckets[0].values.IRcontrast.max).toBe(0);
    const crossing={a:-1,b:2,c:0}, positive:SignatureBucket[]=[], absolute:SignatureBucket[]=[];
    appendSignatureBins(positive,curves(transformCurve(crossing,"positive")),0,1,100);
    appendSignatureBins(absolute,curves(transformCurve(crossing,"absolute")),0,1,100);
    expect(positive[0].values.IRobserver.mean).toBe(.25);expect(absolute[0].values.IRobserver.mean).toBe(.5);
  });
  it("regular/irregular partitions of the same linear curve preserve per-bin means and extrema",()=>{
    const full:SignatureBucket[]=[],split:SignatureBucket[]=[];appendSignatureBins(full,curves({a:-100,b:200,c:0}),0,100,100);
    const cuts=[0,.125,.8,1,12.3,36,36.002,71.8,99.999,100];
    for(let i=1;i<cuts.length;i++)appendSignatureBins(split,curves({a:-100+2*cuts[i-1],b:2*(cuts[i]-cuts[i-1]),c:0}),cuts[i-1],cuts[i],100);
    expect(split).toHaveLength(full.length);
    for(let i=0;i<full.length;i++)for(const key of ["mean","min","max"] as const)near(split[i].values.IRcontrast[key],full[i].values.IRcontrast[key],100);
  });
});
