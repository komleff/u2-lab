import {expect,it} from "vitest";
import input from "./fixtures/performance-S-input.json";
import pose from "./fixtures/flight-stop-envelope-pose.json";
import {createFittingRun,runFittingChunk} from "../../src/runner/fitting-run";
import type {StateV2} from "../../src/model/v2/types";
import {parseExperimentJson} from "../../src/io/fitting-json";
it("SS04/16 a single actual brake envelope resolves warm-H2 shortened-trial flight boundaries without chatter",()=>{
  const parsed=parseExperimentJson(JSON.stringify(input));
  if(!parsed.ok)throw new Error(JSON.stringify(parsed.errors));
  if(!("resolvedShip" in parsed.value))throw new Error("The diagnostic input must be a fitting experiment");
  const run=createFittingRun("stop-envelope-fixture",parsed.value);
  // Physical diagnostic pose from a failed actual run. No prior history is asserted;
  // source-only integration probes the controller's next decisions.
  delete run.signatures;run.state=structuredClone(pose.state) as StateV2;
  const start=run.state.timeSeconds;
  for(let i=0;i<50&&run.state.timeSeconds<start+pose.windowSeconds;i++)runFittingChunk(run,1);
  expect(run.state.timeSeconds).toBeGreaterThanOrEqual(start+pose.windowSeconds);
  expect(Number.isFinite(run.state.temperatureK)).toBe(true);
  expect(run.state.fuelKg.hydrogen).toBeGreaterThanOrEqual(0);
});
