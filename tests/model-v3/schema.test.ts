import { expect, it } from "vitest";
import * as schema from "../../src/model/v3/schema";
import { parseExperimentJson, serializeExperiment } from "../../src/io/fitting-json";
import { validateAnyRunSpec } from "../../src/catalog/schema";
import { fixture } from "./fixture";
import { createRun } from "../../src/runner/run";
import { createFittingRun } from "../../src/runner/fitting-run";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";

const validate = (input: unknown) => { expect(typeof (schema as any).validateRunSpecV3).toBe("function"); return (schema as any).validateRunSpecV3(input); };
it.each(["positive-only", "absolute-contrast"])("/4 positive parse/serialize keeps the independently selected %s receiver and complete state", profile => {
  const spec = fixture("stealth-reference"); spec.receiverProfile = profile as typeof spec.receiverProfile;
  const buffer = Object.values(spec.initialState.buffers)[0]; buffer.storedJ = 100; buffer.minimumCaptureK = 300;
  spec.origins[`initialState.buffers.${Object.keys(spec.initialState.buffers)[0]}.minimumCaptureK`] = { kind: "experimental", unit: "K", sourceRef: "tests/model-v3/schema.test.ts: continuation fixture" };
  const module = Object.values(spec.initialState.modules)[0]; module.durabilityR = -0.1; module.firstNegativeCrossing = true; module.emergencyExposureSeconds = 59; module.cooldownSeconds = 5;
  const before = structuredClone(spec), result = validate(spec); expect(result.ok, JSON.stringify(result.errors)).toBe(true); expect(result.value).toEqual(spec);
  expect(validateAnyRunSpec(spec)).toEqual({ ok: true, value: spec });
  expect(parseExperimentJson(serializeExperiment(spec))).toEqual({ ok: true, value: spec }); expect(spec).toEqual(before);
});
const malformed: [string, (s: any) => void, string][] = [
  ["fractional-step", s => s.stepSeconds = 0.1, "stepSeconds"],
  ["fractional-duration", s => s.durationSeconds = 1.5, "durationSeconds"],
  ["fractional-phase", s => s.scenario.phases[0].durationSeconds = 0.5, "scenario.phases.0.durationSeconds"],
  ["unknown-model", s => s.modelVersion = "ship-fitting-ledger-0.2", "modelVersion"],
  ["old-fit-new-model", s => s.resolvedShip.fit.schemaVersion = "u2-ship-fit/1", "resolvedShip.fit.schemaVersion"],
  ["old-catalog-new-model", s => s.catalogVersion = "ship-fitting-0.2.5", "catalogVersion"],
  ["missing-origin", s => delete s.origins["environment.radiativeBackgroundK"], "environment.radiativeBackgroundK"],
  ["nonfinite-temperature", s => s.initialState.temperatureK = Infinity, "initialState.temperatureK"],
  ["negative-charge", s => s.initialState.chargeJ = -1, "initialState.chargeJ"],
  ["charge-over-capacity", s => s.initialState.chargeJ += 1, "initialState.chargeJ"],
  ["unknown-stock", s => s.initialState.fuelKg.unpaid = 1, "initialState.fuelKg"],
  ["missing-rng-state", s => delete s.initialState.rng.state, "initialState.rng"],
  ["zero-rng-state", s => s.initialState.rng.state = 0, "initialState.rng.state"],
  ["future-state-field", s => s.initialState.future = true, "initialState"],
  ["missing-cooldown", s => delete s.initialState.modules["fit:march"].cooldownSeconds, "initialState.modules.fit:march"],
  ["duplicate-source", s => { s.environment.thermalField = { temperatureK: 600, coefficientWPerM2K: 10, sourceId: "background" }; }, "environment.thermalField.sourceId"],
  ["duplicate-surface", s => s.resolvedShip.surfaces.push(structuredClone(s.resolvedShip.surfaces[0])), "resolvedShip.surfaces"],
  ["wrong-material-credit", s => s.resolvedShip.heatCapacityJK += 1e6, "resolvedShip.heatCapacityJK"],
  ["passive-closure", s => s.initialState.surfaceOpen["hull:passive-radiator"] = false, "initialState.surfaceOpen.hull:passive-radiator"],
  ["invalid-receiver", s => s.receiverProfile = "next-version", "receiverProfile"],
  ["missing-resolved-origin", s => delete s.resolvedShip.origins["heatCapacityJK"], "resolvedShip.heatCapacityJK"],
  ["out-of-range-phase", s => s.initialState.phaseIndex = 99, "initialState.phaseIndex"],
  ["elapsed-outside-phase", s => s.initialState.phaseElapsedSeconds = 61, "initialState.phaseElapsedSeconds"],
];
it.each(malformed)("%s rejects atomically with its path", (_, mutate, path) => {
  const spec = fixture(); mutate(spec); const before = structuredClone(spec), result = validate(spec);
  expect(result.ok).toBe(false); expect(result.errors.some((e: any) => e.path === path || e.path.startsWith(path+"."))).toBe(true);
  expect(spec).toEqual(before); expect(parseExperimentJson(JSON.stringify(spec)).ok).toBe(false);
});
it.each([null, [], {}, {schemaVersion:"u2-lab/4"}])("malformed root fails atomically without exceptions", input=>{
  expect(validate(input).ok).toBe(false);
});
it("a nonempty buffer cannot lose its capture marker during import", () => {
  const spec = fixture("stealth-reference"), id = Object.keys(spec.initialState.buffers)[0]; spec.initialState.buffers[id].storedJ = 100;
  expect(validate(spec).ok).toBe(false); delete (spec.initialState.buffers[id] as any).minimumCaptureK; expect(validate(spec).ok).toBe(false);
});
it("legacy execution/workspace explicitly refuse /4 until the new runner exists", () => {
  const spec = fixture();
  expect(() => createRun("not-running", spec as any)).toThrow("u2-lab/4");
  expect(() => createFittingRun("not-running", spec as any)).toThrow("u2-lab/4");
  const w = new FittingWorkspace(getPresetFit("sputnik"), loadCandidateCatalog()), before = w.snapshot();
  const result = w.importDocument(serializeExperiment(spec)); expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors[0]).toMatchObject({ path: "schemaVersion" });
  expect(w.snapshot()).toEqual(before);
});
