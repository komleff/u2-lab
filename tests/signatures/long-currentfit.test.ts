import {expect,it} from "vitest";
import {getPresetFit,loadCandidateCatalog} from "../../src/fitting/catalog";
import {freshMissionConditions,makeMissionRun} from "../../src/scenarios/mission";
import {signatureSpec} from "../../src/signatures/config";
import {createRun,runChunk,result} from "../../src/runner/run";
import {parseResultJson} from "../../src/io/fitting-result";
it("SS12/16 same literal current Pony source keeps positive accepted clock across stationary approach/mining/service",{timeout:20000},()=>{
  const catalog=loadCandidateCatalog("ship-fitting-0.2.5"),fit=getPresetFit("pony:1",catalog.version);
  const built=makeMissionRun(fit,catalog,{...freshMissionConditions(fit,catalog),distanceM:0,targetM3:10000,durationSeconds:3600,stepSeconds:.1});
  if(!built.ok)throw Error(JSON.stringify(built.errors));const spec=signatureSpec(built.value);spec.signatures!.radarEnabled=true;
  const run=createRun("long-pony",spec);while(!run.done)runChunk(run,20000);
  expect(run.state.timeSeconds).toBe(3600);expect(run.signatures!.timeS).toBe(3600);
  const parsed=parseResultJson(JSON.stringify(result(run),(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));
  expect(parsed.ok,parsed.ok?"":JSON.stringify(parsed.errors)).toBe(true);
});
