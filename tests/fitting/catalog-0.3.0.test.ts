import { expect, it } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import * as compilation from "../../src/fitting/compile";
import { parseFitJson, serializeFit } from "../../src/io/fitting-json";
import { validateFit } from "../../src/fitting/validate";
import { catalogHasItem, isShipModelCatalogVersion } from "../../src/fitting/editions";
import { validateCatalogV3 } from "../../src/model/v3/schema";

const version = "ship-fitting-0.3.0";
it("/2 fit readers and edition dispatch reach new validators without changing legacy defaults", () => {
  const c=loadCandidateCatalog(version), f=getPresetFit("sputnik",version);
  expect(parseFitJson(serializeFit(f as any),c as any)).toEqual({ok:true,value:f});
  expect(validateFit(f as any,c as any).readiness.canRun).toBe(true);
  expect(isShipModelCatalogVersion(version)).toBe(true);expect(catalogHasItem(version,"gyrodyne-S")).toBe(true);
  expect(loadCandidateCatalog().version).toBe("ship-fitting-0.2.3");
  expect(parseFitJson(serializeFit(f as any),loadCandidateCatalog()).ok).toBe(false);
});
it("explicit promotion returns a new fit, validated ship and structural/numeric/origin diff", () => {
  const source=getPresetFit("sputnik","ship-fitting-0.2.4"), old=loadCandidateCatalog("ship-fitting-0.2.4"), c=loadCandidateCatalog(version), before=structuredClone(source);
  const promote=(compilation as any).compileFitToShipModelV01;expect(typeof promote).toBe("function");
  const r=promote(source,old,c,{variantTemplates:{"reference-retro-engine-diesel-S-single":"engine-diesel-S-single"}});
  expect(r.ok,JSON.stringify(r.errors)).toBe(true);if(!r.ok)throw Error("promotion");
  expect(r.value.fit.schemaVersion).toBe("u2-ship-fit/2");expect(r.value.fit.catalogVersion).toBe(version);
  expect(r.value.fit.fitRevision).toBe(source.fitRevision+1);expect(r.value.fit).not.toBe(source);
  expect(r.value.sourceSnapshot).toEqual(source);expect(source).toEqual(before);
  expect(new Set(r.value.changes.map((x:any)=>x.kind))).toEqual(new Set(["structural","numeric","origin"]));
  expect(r.value.ship.instances.find((i:any)=>i.id==="fit:retro").item.numerics.forceN).toBe(source.localVariants[source.instances["fit:retro"].itemId].numerics.forceN);
  expect(parseFitJson(serializeFit(r.value.fit),c as any).ok).toBe(true);
  expect(compileFit(source as any,c as any).ok).toBe(false);
});
it("promotion refuses invalid source or an unmapped local variant atomically", () => {
  const promote=(compilation as any).compileFitToShipModelV01;expect(typeof promote).toBe("function");
  const source=getPresetFit("sputnik","ship-fitting-0.2.4"), old=loadCandidateCatalog("ship-fitting-0.2.4"), c=loadCandidateCatalog(version), before=structuredClone(source);
  const r=promote(source,old,c);expect(r.ok).toBe(false);expect(r.errors[0].path).toContain("localVariants");expect(source).toEqual(before);
  source.initial.chargeFraction=-1;expect(promote(source,old,c).ok).toBe(false);
});
it.each(["sputnik", "severin-mir", "stealth-reference"])("%s compiles a separate ship-model catalog without promoting legacy fits", id => {
  const catalog = loadCandidateCatalog(version as never) as any;
  const fit = getPresetFit(id, version as never) as any;
  const result = compileFit(fit, catalog) as any;
  expect(result.ok, JSON.stringify(result.errors)).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.errors));
  expect(fit.schemaVersion).toBe("u2-ship-fit/2");
  expect(result.value.catalogVersion).toBe(version);
  expect(result.value.hull.bodyExchangeAreaM2).toBeGreaterThan(0);
  const roster = result.value.instances;
  const mass = result.value.materials.reduce((sum: number, m: any) => sum + m.massKg, 0);
  const capacity = result.value.materials.reduce((sum: number, m: any) => sum + m.massKg * m.cpJKgK, 0);
  expect(result.value.dryMassKg).toBe(mass);
  expect(result.value.heatCapacityJK).toBe(capacity);
  expect(roster.some((i: any) => i.item.family === "battery")).toBe(true);
  expect(catalog.items["radiator-passive-S"].category).toBe("sensors-thermal");
  if (id === "stealth-reference") {
    expect(roster.filter((i: any) => ["buffer", "ram", "shell"].includes(i.item.family)).map((i: any) => i.item.family).sort()).toEqual(["buffer", "ram", "shell"]);
    expect(result.value.surfaces).toEqual([]);
    expect(result.value.hull.hullPassiveRadiator).toBeNull();
  } else expect(result.value.surfaces.some((s: any) => s.id === "hull:passive-radiator")).toBe(true);
});
const invalid: [string, (fit: any, c: any) => void, string][] = [
  ["null-item-gate", (_,c)=>c.items["battery-S"].gate=null,"gate"],
  ["missing-item-materials", (_,c)=>delete c.items["battery-S"].materials,"battery-S"],
  ["disabled-battery", f=>f.instances[f.assignments["power-1"]].enabled=false,"instances"],
  ["missing-origin", (_, c) => delete c.items["battery-S"].origins["numerics.capacityJ"], "origins"],
  ["unknown-origin-kind", (_, c) => c.items["battery-S"].origins["numerics.capacityJ"].kind = "approved-by-tests", "origins"],
  ["nonfinite-area", (_, c) => c.hulls[0].bodyExchangeAreaM2 = NaN, "bodyExchangeAreaM2"],
  ["negative-material", (_, c) => c.hulls[0].materials[0].massKg = -1, "massKg"],
  ["wrong-gates", (_, c) => c.items["battery-S"].gate.workLow = c.items["battery-S"].gate.low, "gate"],
  ["orphan-instance", f => f.instances.orphan = { id: "orphan", itemId: "battery-S", enabled: true }, "instances"],
  ["duplicate-instance", f => f.assignments["power-3"] = f.assignments["power-1"], "assignments"],
  ["negative-stock", f => f.initial.chargeFraction = -0.1, "initial"],
  ["unknown-circuit", (f,c) => { const item=c.items["pump-radiator-S"]; item.surfaces[0].circuitOwner.instanceId="somebody-else"; f.instances[f.assignments["signature-1"]].itemId=item.id; }, "circuitOwner"],
  ["own-panels-in-common-ti", (f,c) => { const item=c.items["pump-radiator-S"]; item.surfaces[0].circuitOwner={kind:"common-ti"}; f.instances[f.assignments["signature-1"]].itemId=item.id; }, "circuitOwner"],
  ["unbounded-shell", (_,c) => c.items["shell-S"].numerics.managedBodyFraction = 1.1, "managedBodyFraction"],
];
it.each(invalid)("catalog 0.3.0 %s fails before compiling and preserves input", (_, change, key) => {
  const c=loadCandidateCatalog(version as never) as any, f=getPresetFit("sputnik",version as never) as any; change(f,c); const before=structuredClone({f,c});
  const result=compileFit(f,c) as any; expect(result.ok).toBe(false); expect(result.errors.some((e:any)=>e.path.includes(key))).toBe(true); expect({f,c}).toEqual(before);
});
it("Military structure can carry buffer and aft builtins without turning ordinary fitted radiator directional",()=>{
  const c=loadCandidateCatalog(version),f=getPresetFit("sputnik",version),h=c.hulls.find(h=>h.id===f.hullId)!;
  h.class="Military";h.modes=["Efficient","Combat"];
  h.hullPassiveRadiator!.irProfile={version:"radiator-ir/1",kind:"aft-directed",aftFraction:0.8};
  h.builtins.push({id:"builtin:buffer",item:structuredClone(c.items["buffer-S"])});
  h.origins["hullPassiveRadiator.irProfile.aftFraction"]={kind:"experimental",unit:"1",sourceRef:"tests/fitting/catalog-0.3.0.test.ts: synthetic Military structure only"};
  for(const[path,o]of Object.entries(c.items["buffer-S"].origins))h.origins["builtins."+(h.builtins.length-1)+".item."+path]=o;
  const result=compileFit(f,c);expect(result.ok,JSON.stringify(!result.ok&&result.errors)).toBe(true);if(!result.ok)throw Error("compile");
  expect(result.value.surfaces.find(s=>s.id.startsWith("fit:"))!.irProfile.kind).toBe("omnidirectional");
  expect(result.value.bufferCapacityJ["builtin:buffer"]).toBeGreaterThan(0);
  expect(c.hulls.filter(h=>h.class==="Military")).toHaveLength(1);
  expect(loadCandidateCatalog(version).hulls.some(h=>h.class==="Military")).toBe(false);
});
it("shielding/gyrodyne keep physical cost; buffer off retains stock graph and contributes mass, not stored-J inertia",()=>{
  const c=loadCandidateCatalog(version), f=getPresetFit("stealth-reference",version), a=compileFit(f,c);if(!a.ok)throw Error("compile");
  for(const family of ["shielding","gyrodyne"]){const i=a.value.instances.find(i=>i.item.family===family)!;expect(i.slotId).toBeTruthy();expect(i.item.numerics.powerW).toBeGreaterThan(0);expect(i.item.materials[0].massKg).toBeGreaterThan(0);}
  f.builtinModes["builtin:buffer-S"]={enabled:false};const b=compileFit(f,c);if(!b.ok)throw Error("compile");
  expect(b.value.bufferCapacityJ).toEqual(a.value.bufferCapacityJ);expect(b.value.heatCapacityJK).toBe(a.value.heatCapacityJK);
  expect(validateCatalogV3(c).ok).toBe(true);
});
it("new numeric origins carry actual dimensions, including candidate thermal/durability/surface fields",()=>{
  const c=loadCandidateCatalog(version);
  for(const m of Object.values(c.items)){
    expect(m.origins["gate.workHigh"].unit,m.id).toBe("K");
    expect(m.origins["durability.cooldownSeconds"].unit,m.id).toBe("s");
    expect(m.origins["durability.wearPerWorkSecond"].unit,m.id).toBe("1/s");
    for(const s of m.surfaces)expect(s.origins.areaM2.unit,m.id).toBe("m²");
  }
});
