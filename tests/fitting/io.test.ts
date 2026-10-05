import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
import {
  parseFitJson,
  serializeFit,
  parseExperimentJson,
  serializeExperiment,
} from "../../src/io/fitting-json";
import { createRun, runChunk, result } from "../../src/runner/run";
import { exportFittingTelemetryCsv } from "../../src/io/fitting-csv";
const c = loadCandidateCatalog();
it("roundtrips duplicate/builtin/localvariant origins and replay never reads latest catalog", () => {
  const f = getPresetFit("pony:3");
  f.builtinModes = { "builtin:laser": { enabled: false } };
  f.localVariants.local = {
    ...structuredClone(c.items["mining-civil-S"]),
    id: "local",
    label: "<img src=x onerror=alert(1)>",
  };
  f.instances[f.assignments["payload-1"]].itemId = "local";
  const p = parseFitJson(serializeFit(f), c);
  expect(p).toEqual({ ok: true, value: f });
  const s = makeMiningRun(f, c, { durationSeconds: 12 });
  if (!s.ok) throw Error("missing");
  const saved = serializeExperiment(s.value);
  c.items["mining-civil-S"].numerics.powerW = 99999999;
  const x = parseExperimentJson(saved);
  if (!x.ok) throw Error("parse missing");
  expect(x.value).toEqual(s.value);
  expect((x.value as any).selectedWorkGroup).toContain("builtin:laser");
});
it("unknown schema/model reject, unknown catalog requires explicit supported snapshot replay", () => {
  const local = loadCandidateCatalog(),
    f = getPresetFit("sputnik");
  f.catalogVersion = "future-catalog";
  expect(parseFitJson(serializeFit(f), local).ok).toBe(false);
  const r = makeMiningRun(getPresetFit("sputnik"), local);
  if (!r.ok) throw Error("missing");
  const s = structuredClone(r.value);
  s.catalogVersion = "future-catalog";
  s.resolvedShip.fit.catalogVersion = "future-catalog";
  expect(parseExperimentJson(JSON.stringify(s)).ok).toBe(false);
  const replay = parseExperimentJson(JSON.stringify(s), {
    allowSnapshotReplay: true,
  });
  expect(replay.ok).toBe(true);
  if (replay.ok) expect((replay.value as any).snapshotReplayOnly).toBe(true);
  for (const field of ["schemaVersion", "modelVersion"]) {
    const x = structuredClone(r.value);
    (x as any)[field] = "unknown";
    expect(
      parseExperimentJson(JSON.stringify(x), { allowSnapshotReplay: true }).ok,
    ).toBe(false);
  }
});
it("revalidates selected group and numerical bill after replay; CSV exports typed units and full metrics", () => {
  const local = loadCandidateCatalog(),
    s = makeMiningRun(getPresetFit("industrial-M:3"), local, {
      durationSeconds: 12,
    });
  if (!s.ok) throw Error("missing");
  const malformed = structuredClone(s.value);
  malformed.selectedWorkGroup = malformed.selectedWorkGroup.slice(0, 1);
  expect(parseExperimentJson(JSON.stringify(malformed)).ok).toBe(false);
  const badBill = structuredClone(s.value);
  badBill.resolvedShip.heatCapacityJK += 1e9;
  expect(parseExperimentJson(JSON.stringify(badBill)).ok).toBe(false);
  const r = createRun("CSV", s.value);
  while (!r.done) runChunk(r, 1000);
  const csv = exportFittingTelemetryCsv(result(r));
  for (const unit of ["_K", "_kg", "_N", "_J", "_W", "_SCU/s", "_SCU"])
    expect(csv).toContain(unit);
  expect(csv).toContain("u2-lab-trace/2");
  expect(csv).toContain("selectedWorkGroup");
  expect(csv).toContain("kUseHorizon");
  expect(csv).toContain("installedMassKg:fit:payload-3");
});
it("snapshot rejects cloned stock/capacity graph, missing numeric provenance and aliased duplicate requests", () => {
  for (const mutate of [
    (s: any) => (s.resolvedShip.resources.diesel.capacityKg *= 2),
    (s: any) => (s.resolvedShip.batteryCapacityJ *= 2),
    (s: any) =>
      (s.resolvedShip.instances.find(
        (i: any) => i.item.family === "mining",
      ).item.origins = {}),
    (s: any) => {
      s.scenario.phases[0].requests["fit:march"] = 1;
    },
  ]) {
    const v = makeMiningRun(getPresetFit("sputnik"), loadCandidateCatalog());
    if (!v.ok) throw Error("missing");
    mutate(v.value);
    expect(parseExperimentJson(JSON.stringify(v.value)).ok).toBe(false);
  }
});
