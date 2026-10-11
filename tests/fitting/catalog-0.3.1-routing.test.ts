import { expect, it } from "vitest";
import * as versions from "../../src/model/v3/types";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { catalogHasItem, isShipModelCatalogVersion } from "../../src/fitting/editions";
import { compileFit, compileFitToShipModelV01 } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import type { CandidateCatalogV3, ShipFitV3 } from "../../src/model/v3/types";

const next = "ship-fitting-0.3.1";
it("supported V3 versions are explicit, current is 0.3.1, and old default stays literal", () => {
  expect((versions as any).SHIP_MODEL_CATALOG_VERSIONS).toEqual(["ship-fitting-0.3.0", "ship-fitting-0.3.1"]);
  expect((versions as any).CURRENT_SHIP_MODEL_CATALOG).toBe("ship-fitting-0.3.1");
  expect(isShipModelCatalogVersion("ship-fitting-0.3.0")).toBe(true);
  expect(isShipModelCatalogVersion("ship-fitting-0.3.1")).toBe(true);
  expect(loadCandidateCatalog().version).toBe("ship-fitting-0.2.3");
});
it.each(["ship-fitting-0.3.2", "ship-fitting-0.3", "", null])("unknown version %s never falls back", version => {
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
  const unknown = structuredClone(c); (unknown as any).version = "ship-fitting-0.3.2";
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
