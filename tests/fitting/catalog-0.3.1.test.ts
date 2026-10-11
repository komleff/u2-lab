import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import { validateCatalogV3 } from "../../src/model/v3/schema";
import type { CandidateCatalogV3, ModuleItemV3, ShipFitV3 } from "../../src/model/v3/types";

const next = "ship-fitting-0.3.1";
const manifest = [
  ["sputnik-d", "Северин Спутник · D (дизель)"],
  ["sputnik-e", "Северин Спутник · E (электро)"],
  ["pony-d", "Дизельный Пони · D (дизель)"],
  ["ermak-d", "Демирмаш Ермак · D (дизель)"],
  ["ermak-h", "Демирмаш Ермак · H (водород)"],
  ["ermak-e", "Демирмаш Ермак · E (электро)"],
  ["volna-m-h", "Северин Волна M · H (водород)"],
  ["titan-d", "Демирмаш Титан · D (дизель)"],
  ["titan-h", "Демирмаш Титан · H (водород)"],
  ["titan-e", "Демирмаш Титан · E (электро)"],
  ["severin-mir-d", "Северин Мир · D (дизель)"],
  ["severin-mir-h", "Северин Мир · H (водород)"],
  ["severin-mir-e", "Северин Мир · E (электро)"],
  ["stealth-reference", "Стелс-сборка"],
];
const legacySources = [
  ["sputnik-d", "sputnik", "ship-fitting-0.2.4"],
  ["pony-d", "pony", "ship-fitting-0.2.4"],
  ["ermak-d", "industrial-S:1:D", "ship-fitting-0.2.5"],
  ["ermak-h", "industrial-S:1:H", "ship-fitting-0.2.5"],
  ["ermak-e", "industrial-S:1:E", "ship-fitting-0.2.5"],
  ["volna-m-h", "civilian-M:2:H", "ship-fitting-0.2.5"],
  ["titan-d", "industrial-M:2:D", "ship-fitting-0.2.5"],
  ["titan-h", "industrial-M:2:H", "ship-fitting-0.2.5"],
  ["titan-e", "industrial-M:2:E", "ship-fitting-0.2.5"],
  ["severin-mir-d", "severin-mir:2:D", "ship-fitting-0.2.5"],
  ["severin-mir-h", "severin-mir:2:H", "ship-fitting-0.2.5"],
  ["severin-mir-e", "severin-mir:2:E", "ship-fitting-0.2.5"],
] as const;
function compiled(id: string) {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3, f = getPresetFit(id, next) as ShipFitV3;
  const v = validateFit(f, c); expect(v.valid, JSON.stringify(v)).toBe(true); expect(v.readiness.canRun).toBe(true);
  const result = compileFit(f, c); expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw Error("compile");
  return result.value;
}
it("manifest is an exact ordered bijection, catalogs are detached and only S/M hulls/items exist", () => {
  const c = loadCandidateCatalog(next) as CandidateCatalogV3;
  expect((c as any).presetOptions).toEqual(manifest.map(([id, label]) => ({ id, label })));
  expect(Object.keys(c.presets)).toEqual(manifest.map(([id]) => id));
  expect(validateCatalogV3(c).ok).toBe(true);
  expect(c.hulls.every(h => ["S", "M"].includes(h.size))).toBe(true);
  expect(Object.values(c.items).every(i => ["XS", "S", "M"].includes(i.size))).toBe(true);
  c.items["battery-S"].numerics.capacityJ = 1;
  expect((loadCandidateCatalog(next) as CandidateCatalogV3).items["battery-S"].numerics.capacityJ).not.toBe(1);
});
it.each(manifest)("%s is a runnable version-stamped preset with an exclusive material/stock/surface graph", id => {
  const ship = compiled(id);
  expect(ship.fit.catalogVersion).toBe("ship-fitting-0.3.1");
  expect(ship.catalogVersion).toBe("ship-fitting-0.3.1");
  expect(["S", "M"]).toContain(ship.hull.size);
  expect(ship.dryMassKg).toBe([...ship.hull.materials, ...ship.instances.flatMap(i => i.item.materials)].reduce((s, m) => s + m.massKg, 0));
  expect(new Set(ship.surfaces.map(s => s.id)).size).toBe(ship.surfaces.length);
});
it.each(legacySources)("%s preserves every %s mounted identity/numeric/material/gate/local variant and named builtin", (id, sourceId, version) => {
  const source = getPresetFit(sourceId, version), old = loadCandidateCatalog(version), before = structuredClone(source);
  const oldResult = compileFit(source, old); expect(oldResult.ok).toBe(true); if (!oldResult.ok) throw Error("source");
  const ship = compiled(id);
  expect(ship.fit.assignments).toEqual(source.assignments);
  expect(ship.fit.instances).toEqual(source.instances);
  expect(ship.fit.builtinModes).toEqual(source.builtinModes ?? {});
  expect(Object.keys(ship.fit.localVariants)).toEqual(Object.keys(source.localVariants));
  for (const row of oldResult.value.instances) {
    const target = ship.instances.find(i => i.id === row.id); expect(target, row.id).toBeDefined();
    const oldItem = row.item;
    expect(target!.builtin).toBe(row.builtin);
    expect(target!.enabled).toBe(row.enabled);
    expect(target!.item).toMatchObject({ id: oldItem.id, label: oldItem.label, size: oldItem.size, family: oldItem.family, formFactor: oldItem.formFactor, class: oldItem.class, generation: oldItem.generation, materials: oldItem.materials, gate: oldItem.gate });
    // Тот же SKU сохраняет собственные model-specific поля 0.3.0;
    // новый/локальный SKU переносит legacy numerics буквально.
    const previous = loadCandidateCatalog("ship-fitting-0.3.0");
    const sameSku = previous.items[oldItem.id] ?? previous.hulls.flatMap(h => h.builtins).find(b => b.item.id === oldItem.id)?.item;
    if (!sameSku) expect(target!.item.numerics).toMatchObject(oldItem.numerics);
    else expect(target!.item.numerics).toEqual(sameSku.numerics);
  }
  expect(source).toEqual(before);
});
it("Sputnik D/E have exact and disjoint removable diesel/electric powertrains plus civil laser/bulk S", () => {
  const d = compiled("sputnik-d"), e = compiled("sputnik-e");
  const removable = (s: typeof d) => s.instances.filter(i => !i.builtin).map(i => i.item);
  for (const s of [d, e]) {
    expect(s.instances.filter(i => i.item.id === "mining-civil-S")).toHaveLength(1);
    expect(s.instances.filter(i => i.item.id === "cargo-bulk-S")).toHaveLength(1);
    expect(s.instances.find(i => i.id === "builtin:electric-heater")!.item).toEqual(loadCandidateCatalog("ship-fitting-0.3.0").hulls.find(h => h.id === "sputnik")!.builtins.find(b => b.id === "builtin:electric-heater")!.item);
  }
  expect(removable(d).filter(i => i.family === "engine").map(i => i.propulsionType)).toEqual(["diesel", "diesel", "diesel", "diesel"]);
  expect(removable(d).filter(i => i.category === "power").map(i => i.id)).toEqual(["battery-XS", "generator-diesel-XS", "tank-diesel-S"]);
  expect(removable(d).some(i => i.family === "solar" || i.propulsionType === "electric")).toBe(false);
  expect(removable(e).filter(i => i.family === "engine").map(i => i.propulsionType)).toEqual(["electric", "electric", "electric", "electric"]);
  expect(removable(e).filter(i => i.category === "power").map(i => i.id)).toEqual(["battery-S", "solar-S"]);
  expect(removable(e).some(i => i.species === "diesel" || i.propulsionType === "diesel")).toBe(false);
});
it("Pony retains its own local variants and builtin laser, Volna keeps its literal cryotank", () => {
  const pony = compiled("pony-d");
  expect(Object.keys(pony.fit.localVariants).sort()).toEqual(["pony-battery", "pony-generator", "pony-engine-march", "pony-engine-retro", "pony-engine-strafe", "pony-engine-turn"].sort());
  expect(pony.instances.find(i => i.id === "builtin:laser")!.item).toMatchObject({id:"pony-laser", class:"UNKNOWN", generation:0, numerics:{powerW:1e6, efficiency:0.35}});
  expect(pony.instances.filter(i => i.item.family === "engine").every(i => i.item.id.startsWith("pony-engine-"))).toBe(true);
  const volna = compiled("volna-m-h");
  expect(volna.instances.find(i => i.id === "builtin:cryotank")!.item).toMatchObject({id:"builtin-cryotank-civilian-M", species:"hydrogen", numerics:{fuelCapacityKg:4377.0845148}});
  expect(volna.instances.some(i => !i.builtin && i.item.family === "tank")).toBe(false);
});
it.each(["d", "h", "e"])("Ermak/Titan %s retain industrial mining size/count; Mir has actual distinct typed power/fuel", architecture => {
  for (const [hull, size, count] of [["ermak", "S", 1], ["titan", "M", 2]] as const) {
    const miners = compiled(`${hull}-${architecture}`).instances.filter(i => i.item.family === "mining");
    expect(miners).toHaveLength(count);
    expect(miners.every(i => i.item.id === `mining-industrial-${size}` && i.item.class === "Industrial")).toBe(true);
  }
  const mir = compiled(`severin-mir-${architecture}`);
  expect(mir.instances.filter(i => i.item.family === "engine").every(i => i.item.propulsionType === ({d:"diesel",h:"hydrogen",e:"electric"}[architecture]))).toBe(true);
  expect(mir.instances.filter(i => i.item.category === "power").map(i => i.item.id)).toEqual(architecture === "e" ? ["battery-M", "solar-M"] : ["battery-M", `generator-${architecture === "d" ? "diesel" : "hydrogen"}-M`, `tank-${architecture === "d" ? "diesel" : "hydrogen"}-M`]);
});
it("stealth fit/hull/items are content-identical except the catalog stamp; all old asset bytes are pinned", () => {
  const old = loadCandidateCatalog("ship-fitting-0.3.0"), ship = compiled("stealth-reference");
  expect({...ship.fit, catalogVersion:"ship-fitting-0.3.0"}).toEqual(getPresetFit("stealth-reference", "ship-fitting-0.3.0"));
  expect(ship.hull).toEqual(old.hulls.find(h => h.id === "stealth-reference"));
  for (const i of ship.instances) {
    const item = old.items[i.item.id] ?? old.hulls.find(h => h.id === "stealth-reference")!.builtins.find(b => b.id === i.id)!.item;
    expect(i.item).toEqual(item as ModuleItemV3);
  }
  const digests = {hulls:"fe92013798eb3ac38d83978ed3b87736d5be6b5910a29734eae63878cce3784e",items:"bdb3d20067e0abdc54e19a469f5e1a33cf386b2453024d982409c869550d1f33",presets:"3b313105efdd5f11d7c451245edf603ce2ef8838c944be51e816d573310e78c3"};
  for (const [name, digest] of Object.entries(digests)) expect(createHash("sha256").update(readFileSync(`src/fitting/data/${name}-0.3.0.json`)).digest("hex")).toBe(digest);
  expect((old as any).presetOptions).toEqual([{id:"sputnik",label:"Спутник"},{id:"severin-mir",label:"Мир"},{id:"stealth-reference",label:"Стелс-сборка"}]);
});
