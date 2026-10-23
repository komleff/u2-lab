import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import { parseFitJson, serializeFit } from "../../src/io/fitting-json";
import { validateCatalogV3 } from "../../src/model/v3/schema";
import { makeShipModelMiningRun } from "../../src/scenarios/fitting";
import { stepV3 } from "../../src/model/v3/step";
import * as versions from "../../src/model/v3/types";
import type { CandidateCatalogV3, ShipFitV3, ShipModelCatalogVersion } from "../../src/model/v3/types";

const next = "ship-fitting-0.3.2", previous = "ship-fitting-0.3.1";
const files = ["hulls", "items", "presets", "preset-manifest"] as const;
const raw = (name: string, version: string) => JSON.parse(readFileSync(`src/fitting/data/${name}-${version.replace("ship-fitting-", "")}.json`, "utf8"));
const heating = ["electric-heater", "furnace"];
const U2 = "U2@cdc490e3517c8455f662f82579c45813cdbb9a76:";
function compiled(id: string, version: ShipModelCatalogVersion = next, change: (fit: ShipFitV3) => void = () => {}) {
  const c = loadCandidateCatalog(version), f = getPresetFit(id, version); change(f);
  const v = validateFit(f, c); expect(v.valid, JSON.stringify(v)).toBe(true); expect(v.readiness.canRun).toBe(true);
  const result = compileFit(f, c); expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw Error("compile");
  return result.value;
}
it("0.3.2 is current and the version table keeps 0.3.0/0.3.1 readable", () => {
  expect(versions.SHIP_MODEL_CATALOG_VERSIONS).toEqual(["ship-fitting-0.3.0", previous, next]);
  expect(versions.CURRENT_SHIP_MODEL_CATALOG).toBe(next);
  for (const version of versions.SHIP_MODEL_CATALOG_VERSIONS) expect(validateCatalogV3(loadCandidateCatalog(version)).ok).toBe(true);
  for (const name of files) expect(existsSync(`src/fitting/data/${name}-0.3.2.json`), name).toBe(true);
});
it("ST2-01 ни у одного корпуса 0.3.2 нет встроенного средства прогрева; пресеты нагреватель не добавляют", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3;
  for (const h of c.hulls) expect(h.builtins.filter(b => heating.includes(b.item.family)).map(b => b.id), h.id).toEqual([]);
  for (const id of Object.keys(c.presets)) expect(compiled(id).instances.filter(i => heating.includes(i.item.family)).map(i => i.id), id).toEqual([]);
});
it("ST2-02 все файлы 0.3.1 байт-в-байт; у сборок 0.3.1 встроенная печь на месте", () => {
  const digests = {
    hulls: "b257c2964d8a36d4c7a434a2efc66a579df1cff05523bf82dd64d8dce25a7d5a",
    items: "f3b987ebdef34e79e68f707fe5f244daea0f44a26ecb050d0b61b80a63231a2f",
    presets: "2592b52c6ae503eaeb060b2c05a4eb37ddc90c73fc8931defa41e7c01dd37788",
    "preset-manifest": "cd23263d57a5a3b6e06e8860d0bed2abd8082fc105ed8392a7509d4c61c7f777",
  };
  for (const [name, digest] of Object.entries(digests)) expect(createHash("sha256").update(readFileSync(`src/fitting/data/${name}-0.3.1.json`)).digest("hex"), name).toBe(digest);
  for (const id of ["sputnik-d", "sputnik-e", "severin-mir-d", "severin-mir-h", "severin-mir-e", "stealth-reference"]) {
    const ship = compiled(id, previous);
    expect(ship.instances.find(i => i.id === "builtin:electric-heater")?.item.family, id).toBe("electric-heater");
  }
  const old = loadCandidateCatalog(previous) as CandidateCatalogV3;
  expect(old.items["shielding-S"].numerics.antennaTransmission).toBe(0.8);
  expect(old.items["ram-S"].numerics.radarTransmission).toBe(0.2);
  expect(old.items["ram-S"].materials[0].massKg).toBe(50);
});
it("ST2-03 тот же список пресетов; каждый пресет 0.3.2 — монтаж 0.3.1 с новой версией", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3, old = loadCandidateCatalog(previous) as CandidateCatalogV3;
  expect(c.presetOptions).toEqual(old.presetOptions);
  expect(Object.keys(c.presets)).toEqual(Object.keys(old.presets));
  for (const [id, fit] of Object.entries(old.presets)) expect(getPresetFit(id, next)).toEqual({ ...fit, catalogVersion: next });
});
it("0.3.2 = 0.3.1 буквально, кроме обогрева трёх корпусов, антенн экрана и RAM по канону", () => {
  const hulls = raw("hulls", previous), items = raw("items", previous), presets = raw("presets", previous);
  // Ожидаемое отличие задано тестом независимо от генератора данных.
  const strip = new Map([["sputnik", 1], ["severin-mir", 1], ["stealth-reference", 4]]);
  for (const h of hulls) {
    const index = strip.get(h.id); if (index === undefined) continue;
    expect(h.builtins[index].id).toBe("builtin:electric-heater"); expect(h.builtins).toHaveLength(index + 1);
    h.builtins.splice(index, 1);
    for (const key of Object.keys(h.origins)) if (key.startsWith(`builtins.${index}.`)) delete h.origins[key];
  }
  const expected = raw("items", next);
  const ram = (item: any, mirror?: Record<string, unknown>, prefix = "") => {
    item.numerics.radarTransmission = 0.25; item.materials[0].massKg = 800;
    item.materials[0].origin = expected["ram-S"].materials[0].origin;
    for (const key of ["materials.0.massKg", "numerics.radarTransmission"]) { item.origins[key] = expected["ram-S"].origins[key]; if (mirror) mirror[prefix + key] = expected["ram-S"].origins[key]; }
  };
  ram(items["ram-S"]);
  const stealth = hulls.find((h: any) => h.id === "stealth-reference");
  ram(stealth.builtins[2].item, stealth.origins, "builtins.2.item.");
  items["shielding-S"].numerics.antennaTransmission = 1;
  items["shielding-S"].origins["numerics.antennaTransmission"] = expected["shielding-S"].origins["numerics.antennaTransmission"];
  for (const fit of Object.values(presets) as any[]) fit.catalogVersion = next;
  expect(raw("hulls", next)).toEqual(hulls);
  expect(expected).toEqual(items);
  expect(raw("presets", next)).toEqual(presets);
  expect(raw("preset-manifest", next)).toEqual(raw("preset-manifest", previous));
});
it("ST2-05 экран 0.3.2 не ослабляет собственный приём: antennaTransmission = 1 с происхождением", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3, shield = c.items["shielding-S"];
  expect(shield.numerics.antennaTransmission).toBe(1);
  expect(shield.origins["numerics.antennaTransmission"]).toMatchObject({ kind: "experimental", unit: "1" });
  expect(shield.origins["numerics.antennaTransmission"].sourceRef).toContain("docs/product/stealth-class-v0.1.md§2");
  expect(shield.origins["numerics.antennaTransmission"].note).toContain("Антенны вне экрана, решение оператора 2026-10-13");
  expect(shield.numerics.emTransmission).toBe(0.2);
  for (const [version, expectedTransmission] of [[next, 1], [previous, 0.8]] as const) {
    const catalog = loadCandidateCatalog(version), built = makeShipModelMiningRun(getPresetFit("stealth-reference", version), catalog, { durationSeconds: 1, action: "idle" });
    expect(built.ok, JSON.stringify(built)).toBe(true); if (!built.ok) return;
    const r = stepV3(built.value, built.value.initialState, {}, "idle");
    expect(r.frames.length).toBeGreaterThan(0);
    for (const frame of r.frames) expect(frame.ownAntennaTransmission, version).toBe(expectedTransmission);
  }
});
it("ST2-06 RAM 0.3.2: ×0,25 и 800 кг с происхождением канона U2 — сменный и встроенный", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3;
  const builtin = c.hulls.find(h => h.id === "stealth-reference")!.builtins.find(b => b.id === "builtin:ram-S")!.item;
  for (const item of [c.items["ram-S"], builtin]) {
    expect(item.numerics.radarTransmission).toBe(0.25);
    expect(item.materials.map(m => m.massKg)).toEqual([800]);
    for (const origin of [item.origins["numerics.radarTransmission"], item.origins["materials.0.massKg"], item.materials[0].origin]) {
      expect(origin.kind).toBe("canonical");
      expect(origin.sourceRef).toContain(U2 + "docs/gdd/gdd_s_stealth_g5_signature_control_first_slice_v0.1_draft.md");
      expect(origin.sourceRef).toContain(U2 + "docs/gdd/gdd_signature_countermeasure_first_slice_v0.1_draft.md");
      expect(origin).not.toHaveProperty("range");
    }
  }
  const stealth = c.hulls.find(h => h.id === "stealth-reference")!;
  expect(stealth.origins["builtins.2.item.numerics.radarTransmission"]).toEqual(builtin.origins["numerics.radarTransmission"]);
  expect(stealth.origins["builtins.2.item.materials.0.massKg"]).toEqual(builtin.origins["materials.0.massKg"]);
  // Масса RAM входит в сухую массу собранного корабля буквально.
  const now = compiled("stealth-reference"), before = compiled("stealth-reference", previous);
  const heater = before.instances.find(i => i.id === "builtin:electric-heater")!.item.materials.reduce((s, m) => s + m.massKg, 0);
  expect(now.dryMassKg).toBeCloseTo(before.dryMassKg - heater + 750, 6);
});
it("сборка 0.3.2 со сменным нагревателем сохраняется и открывается буквально", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3;
  const ship = compiled("sputnik-d", next, f => { f.assignments["signature-2"] = "fit:signature-2"; f.instances["fit:signature-2"] = { id: "fit:signature-2", itemId: "electric-heater-S", enabled: true }; });
  const heater = ship.instances.find(i => i.item.family === "electric-heater")!;
  expect(heater).toMatchObject({ id: "fit:signature-2", builtin: false });
  const text = serializeFit(ship.fit), opened = parseFitJson(text, c);
  expect(opened.ok, JSON.stringify(opened)).toBe(true); if (!opened.ok) return;
  expect(serializeFit(opened.value)).toBe(text);
});
it("сборка 0.3.1 не мигрирует молча в 0.3.2; смешанные версии отклоняются", () => {
  const old = getPresetFit("sputnik-d", previous), text = serializeFit(old);
  const opened = parseFitJson(text, loadCandidateCatalog(previous));
  expect(opened.ok).toBe(true); if (!opened.ok) return;
  expect(serializeFit(opened.value)).toBe(text); expect(opened.value.catalogVersion).toBe(previous);
  expect(parseFitJson(text, loadCandidateCatalog(next)).ok).toBe(false);
  expect(parseFitJson(serializeFit(getPresetFit("sputnik-d", next)), loadCandidateCatalog(previous)).ok).toBe(false);
  for (const version of ["ship-fitting-0.3.3", "ship-fitting-0.3"]) {
    expect(versions.isShipModelCatalogVersion(version)).toBe(false);
    expect(() => loadCandidateCatalog(version as never)).toThrow("Неизвестная версия каталога");
  }
});
