import { expect, it } from "vitest";
import * as versions from "../../src/model/v3/types";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { catalogHasItem, isShipModelCatalogVersion } from "../../src/fitting/editions";
import { compileFit, compileFitToShipModelV01 } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import type { CandidateCatalogV3, ShipFitV3 } from "../../src/model/v3/types";
import { ShipModelWorkspace } from "../../src/app/ship-model-workspace";
import { serializeFit, serializeExperiment, serializeResultSnapshot } from "../../src/io/fitting-json";
import { makeShipModelMiningRun } from "../../src/scenarios/fitting";
import { createShipModelRun, runShipModelChunk, shipModelResult } from "../../src/runner/ship-model-run";
import { parseStoredResultJson } from "../../src/io/fitting-result";

const next = "ship-fitting-0.3.1", current = "ship-fitting-0.3.3";
it("supported V3 versions are explicit, current is 0.3.3, and old default stays literal", () => {
  expect((versions as any).SHIP_MODEL_CATALOG_VERSIONS).toEqual(["ship-fitting-0.3.0", "ship-fitting-0.3.1", "ship-fitting-0.3.2", current]);
  expect((versions as any).CURRENT_SHIP_MODEL_CATALOG).toBe(current);
  expect(isShipModelCatalogVersion("ship-fitting-0.3.0")).toBe(true);
  expect(isShipModelCatalogVersion("ship-fitting-0.3.1")).toBe(true);
  expect(isShipModelCatalogVersion("ship-fitting-0.3.2")).toBe(true);
  expect(loadCandidateCatalog().version).toBe("ship-fitting-0.2.3");
});
it.each(["ship-fitting-0.3.9", "ship-fitting-0.3", "", null])("unknown version %s never falls back", version => {
  expect(isShipModelCatalogVersion(version)).toBe(false);
  expect(() => loadCandidateCatalog(version as never)).toThrow("Неизвестная версия каталога");
  expect(() => getPresetFit("sputnik-d", version as never)).toThrow("Неизвестная версия каталога");
});
it("public entrypoints dispatch the new version; inventory and presets stay version-owned", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3, f = getPresetFit("sputnik-d", next) as ShipFitV3;
  expect(validateFit(f, c).readiness.canRun).toBe(true);
  const result = compileFit(f, c);
  expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw Error("compile");
  expect(result.value.catalogVersion).toBe("ship-fitting-0.3.1");
  expect(catalogHasItem("ship-fitting-0.3.1", "mining-industrial-S")).toBe(true);
  expect(catalogHasItem("ship-fitting-0.3.0", "mining-industrial-S")).toBe(false);
  expect(() => getPresetFit("sputnik", next)).toThrow("Неизвестная ship-model сборка");
  expect(() => getPresetFit("sputnik-d", "ship-fitting-0.3.0")).toThrow("Неизвестная ship-model сборка");
  expect(validateFit(f, loadCandidateCatalog("ship-fitting-0.3.0")).valid).toBe(false);
  const unknown = structuredClone(c); (unknown as any).version = "ship-fitting-0.3.9";
  expect(compileFit(f, unknown).ok).toBe(false);
  expect(validateFit(f, unknown).valid).toBe(false);
});
it("legacy promotion targets the requested version and errors name that target", () => {
  const source = getPresetFit("sputnik", "ship-fitting-0.2.4"), old = loadCandidateCatalog("ship-fitting-0.2.4");
  const target = loadCandidateCatalog(next) as CandidateCatalogV3, before = structuredClone(source);
  const missing = compileFitToShipModelV01(source, old, target);
  expect(missing.ok).toBe(false);
  if (missing.ok) throw Error("missing template accepted");
  expect(missing.errors[0].message).toContain("ship-fitting-0.3.1");
  const promoted = compileFitToShipModelV01(source, old, target, { variantTemplates: { "reference-retro-engine-diesel-S-single": "engine-diesel-S-single" } });
  expect(promoted.ok, JSON.stringify(promoted)).toBe(true);
  if (!promoted.ok) throw Error("promotion");
  expect(promoted.value.fit.catalogVersion).toBe("ship-fitting-0.3.1");
  expect(promoted.value.ship.catalogVersion).toBe("ship-fitting-0.3.1");
  expect(source).toEqual(before);
  expect(promoted.value.sourceSnapshot).toEqual(before);
});
const oldVersion = "ship-fitting-0.3.0";
const workspace = () => {
  const sourceCatalog = loadCandidateCatalog("ship-fitting-0.2.4");
  const w=new ShipModelWorkspace(getPresetFit("sputnik", sourceCatalog.version), sourceCatalog);w.selectWorkMode("stationary");return w;
};
it("workspace new presets and legacy promotion use current, without changing explicit old selection", () => {
  const w = workspace(); w.loadPreset("sputnik-d");
  expect(w.fit!.catalogVersion).toBe(current); expect(w.catalog.version).toBe(current);
  expect(w.prepare().catalogVersion).toBe(current);
  w.loadPreset("sputnik-d", next);
  expect(serializeFit(w.fit!)).toBe(serializeFit(getPresetFit("sputnik-d", next))); expect(w.prepare().catalogVersion).toBe(next);
  w.loadPreset("sputnik", oldVersion);
  expect(serializeFit(w.fit!)).toBe(serializeFit(getPresetFit("sputnik", oldVersion)));
  const before = serializeFit(w.fit!);
  for (const select of [() => w.loadPreset("sputnik"), () => w.loadPreset("sputnik-d", oldVersion), () => w.loadPreset("sputnik-d", "ship-fitting-0.3.9" as never)]) {
    expect(select).toThrow(); expect(serializeFit(w.fit!)).toBe(before);
  }
  const promoted = w.previewCompilation({ "reference-retro-engine-diesel-S-single": "engine-diesel-S-single" });
  expect(promoted.fit.catalogVersion).toBe(current); w.applyCompilation(); expect(w.prepare().catalogVersion).toBe(current);
});
it.each([oldVersion, next, "ship-fitting-0.3.2", current] as const)("fresh scenario builder stamps every owner %s", version => {
  const c = loadCandidateCatalog(version), f = getPresetFit(version === oldVersion ? "sputnik" : "sputnik-d", version);
  const built = makeShipModelMiningRun(f, c, { durationSeconds: 3 });
  expect(built.ok, JSON.stringify(built)).toBe(true); if (!built.ok) return;
  expect([built.value.catalogVersion, built.value.resolvedShip.catalogVersion, built.value.resolvedShip.fit.catalogVersion]).toEqual([version, version, version]);
  const run = createShipModelRun("actual-"+version, built.value); runShipModelChunk(run, 1);
  const literal = serializeResultSnapshot(shipModelResult(run, "paused")), opened = parseStoredResultJson(literal);
  expect(opened.ok, JSON.stringify(opened)).toBe(true); if (opened.ok) expect(serializeResultSnapshot(opened.value)).toBe(literal);
});
it("workspace operations resolve each fit, not the selected/global/current catalog", () => {
  const w = workspace(); w.importDocument(serializeFit(getPresetFit("sputnik", oldVersion)));
  w.updateConditions({ durationSeconds: 2 }); w.copyToB(); w.importDocument(serializeFit(getPresetFit("sputnik-d", next)));
  expect(w.catalog.version).toBe(next); expect(w.prepare().catalogVersion).toBe(next);
  const replacement = w.previewReplacement("payload-1", "mining-industrial-S"); expect(replacement.ok, JSON.stringify(replacement.errors)).toBe(true); w.applyReplacement();
  w.setEnabled("fit:signature-1", false); expect(w.fit!.catalogVersion).toBe(next);
  w.replaceScenario({ ...w.prepare().scenario, name: "version-owned B", durationSeconds: 2 });
  const b = serializeExperiment(w.prepare()); w.selectVariant("A"); expect(w.catalog.version).toBe(oldVersion);
  expect(w.previewReplacement("payload-1", "mining-industrial-S").ok).toBe(false);
  w.setEnabled("fit:signature-1", false); expect(w.prepare().catalogVersion).toBe(oldVersion);
  const spec = w.start("old-A"), run = createShipModelRun("old-A", spec); w.selectVariant("B");
  runShipModelChunk(run, 1); expect(w.acceptResult(shipModelResult(run, "paused"))).toBe(true); w.setStatus("paused");
  expect(w.active!.spec).toEqual(spec); expect(w.comparison.A!.spec.catalogVersion).toBe(oldVersion);
  expect(w.snapshotForRender().currentStale).toBe(false); expect(w.freeze()).toBe(true);
  const frozen = serializeResultSnapshot(w.frozen!); runShipModelChunk(run, 1); w.acceptResult(shipModelResult(run));
  expect(serializeExperiment(w.prepare())).toBe(b); expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);
  expect(w.snapshotForRender().frozenStale).toBe(false);
});
