import {expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import manifest from "./fixtures/manifest.json";
import motion from "./fixtures/analytic-moving-radar.json";
import {parseExperimentJson} from "../../src/io/fitting-json";
import {parseResultJson} from "../../src/io/fitting-result";
import {restoreFittingRun} from "../../src/runner/fitting-run";
import {runChunk,result} from "../../src/runner/run";
import {exportObserverJson,exportObserverCsv,exportSignatureCsv} from "../../src/signatures/io";
const read=(name:string)=>readFileSync("tests/signatures/fixtures/"+name,"utf8");
it("SS15 literal versioned handoff hashes/inputs/checkpoints/exports remain reproducible and allowlisted",()=>{
  for(const file of manifest.files)expect(createHash("sha256").update(read(file.path)).digest("hex"),file.path).toBe(file.sha256);
  for(const name of ["bench-input.json","performance-S-input.json","performance-M-input.json"])expect(parseExperimentJson(read(name)).ok,name).toBe(true);
  const checkpoint=parseResultJson(read("two-ping-checkpoint.json")),received=parseResultJson(read("received-result.json"));
  expect(checkpoint.ok,checkpoint.ok?"":JSON.stringify(checkpoint.errors)).toBe(true);expect(received.ok,received.ok?"":JSON.stringify(received.errors)).toBe(true);
  if(!checkpoint.ok||!received.ok)throw Error("handoff invalid");
  expect(checkpoint.value.signatures!.radar.pending.map(p=>p.pulseId)).toEqual([1,2]);
  const resumed=restoreFittingRun(checkpoint.value);runChunk(resumed,103);
  expect(result(resumed)).toEqual(received.value);
  expect(exportObserverJson(received.value)).toBe(read("observer-view.json"));expect(exportObserverCsv(received.value)).toBe(read("observer-view.csv"));expect(exportSignatureCsv(received.value)).toBe(read("gd-trace.csv"));
  expect(read("observer-view.json")).not.toMatch(/emittedAt|targetId|sourceCount|trueRange|temperature|geometry|spec/);
});
it("SS07/15 constant-velocity handoff is an independent analytic fixture, not moving runtime",()=>{
  expect(motion.scope).toBe("analytic_only_not_runtime");
  for(const pulse of motion.pulses){
    const expectedReflection=(motion.initialRangeM+motion.cPrimeMS*pulse.emittedAtS)/(motion.cPrimeMS-motion.constantVelocityMS);
    const expectedRange=motion.initialRangeM+motion.constantVelocityMS*expectedReflection;
    for(const [actual,expected] of [[pulse.reflectedAtS,expectedReflection],[pulse.receivedAtS,expectedReflection+expectedRange/motion.cPrimeMS],[pulse.reflectionRangeM,expectedRange]])expect(Math.abs(actual-expected)).toBeLessThanOrEqual(1e-6*Math.abs(expected)+1e-12*Math.abs(expected));
  }
});
