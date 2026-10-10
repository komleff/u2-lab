import {expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {createRun,runChunk,result} from "../../src/runner/run";
import {initialStateV2} from "../../src/model/v2/step";
import type {RunSpecV2} from "../../src/model/v2/types";
const goldens=[
  {size:"S",spec:"f82c464f460c93abb5f7071a9d12c424eafdc03d4fd8a8096623aec9693bf251",initialState:"90e36f8a9b0c81d3da7b5d0211afe553f7869e9625b1ee0c766c9eb5d4a2938f",result:"693103cc5bdcef414b54df6b8a3eccf2cc0aee52fb9fc885e75bd72e7b934382"},
  {size:"M",spec:"1ba3e77cc31a672be8e51ffd6cc43637d00b1ee7832278ea607e0d5c3a77e19e",initialState:"affcbd050138218ffcbe3e36cf54ddb58360671b1d91ce02a4b583ddbd439a33",result:"15b727a08d5d1de6895620fbef6b0aaa25b72f9a5a62502fca9f4a348d2e5875"},
];
// Golden получен независимым frozen9cd executable, не текущим helper.
const hash=(x:unknown)=>createHash("sha256").update(JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v)).digest("hex");
it.each(goldens)("SS13/16 $size literal old spec/state/result keeps frozen9cd bytes",golden=>{
  const spec=JSON.parse(readFileSync("tests/signatures/fixtures/performance-"+golden.size+"-input.json","utf8")) as RunSpecV2;
  spec.schemaVersion="u2-lab/2";spec.modelVersion="ship-fitting-mission-0.2.2";delete spec.signatures;
  for(const key of Object.keys(spec.origins))if(key.startsWith("signatures."))delete spec.origins[key];spec.durationSeconds=2;
  expect(hash(spec)).toBe(golden.spec);expect(hash(initialStateV2(spec))).toBe(golden.initialState);
  const run=createRun("legacy-literal-"+golden.size,spec);while(!run.done)runChunk(run,20000);
  expect(hash(result(run))).toBe(golden.result);
});
