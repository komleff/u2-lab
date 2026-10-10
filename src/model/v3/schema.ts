import type { ValidationResult } from "../../catalog/schema";
import type { CandidateCatalogV3, ResolvedInstanceV3, ResolvedShipV3, ShipFitV3, RunSpecV3, StateV3, EnvironmentV3, ModuleItemV3, HullV3, ThermalSurface } from "./types";
import { CATALOG_V3, MODEL_V3, SCHEMA_V3 } from "./types";
import type { FieldOrigin } from "../../fitting/types";

type Issue = { path: string; code: string; message: string };
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const categories = ["propulsion", "power", "payload", "sensors-thermal"];
const classes = ["Civilian", "Industrial", "Sport", "Military", "Stealth", "UNKNOWN"];
const modes = ["Efficient", "Combat", "Masking"];
const families = ["engine", "generator", "solar", "battery", "tank", "mining", "cargo", "radiator", "buffer", "h2", "thermoinverter", "pump-radiator", "furnace", "electric-heater", "shielding", "gyrodyne", "ram", "shell", "sensor", "radar", "transmitter"];
class Check {
  errors: Issue[] = [];
  bad(path: string, message: string, code = "INVALID_V3") { this.errors.push({ path, code, message }); }
  exact(v: unknown, path: string, required: string[], optional: string[] = []): v is Record<string, any> {
    if (!object(v)) { this.bad(path, "Требуется объект"); return false; }
    if (required.some(k => !Object.hasOwn(v,k)) || Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) { this.bad(path, "Неизвестные или пропущенные поля"); return false; }
    return true;
  }
  number(v: unknown, path: string, low = 0, high = Infinity, integer = false) { if (typeof v !== "number" || !Number.isFinite(v) || v < low || v > high || integer && !Number.isInteger(v)) this.bad(path,"Нужно конечное SI число в допустимом диапазоне"); }
  positive(v: unknown, path: string) { this.number(v,path); if (!(typeof v === "number" && v > 0)) this.bad(path,"Нужно число >0"); }
  flag(v: unknown, path: string) { if (typeof v !== "boolean") this.bad(path,"Нужно boolean"); }
  text(v: unknown, path: string) { if (typeof v !== "string" || !v.trim()) this.bad(path,"Нужен непустой identifier"); }
  choice(v: unknown, path: string, allowed: readonly unknown[]) { if (!allowed.includes(v)) this.bad(path,"Неизвестное значение"); }
  list(v: unknown, path: string): v is any[] { if (!Array.isArray(v)) { this.bad(path,"Нужен массив"); return false; } return true; }
  origin(v: unknown, path: string) {
    if (!this.exact(v,path,["kind","unit","sourceRef"],["range","note","derivation"])) return;
    this.choice(v.kind,path+".kind",["canonical","derived","experimental"]); this.text(v.unit,path+".unit"); this.text(v.sourceRef,path+".sourceRef");
    if (v.kind === "derived") this.text(v.derivation,path+".derivation");
    if (v.range !== undefined && (!Array.isArray(v.range) || v.range.length !== 2 || !v.range.every((n: unknown) => typeof n === "number" && Number.isFinite(n)) || v.range[0] > v.range[1])) this.bad(path+".range","Неверный диапазон кандидата");
  }
  numericOrigins(v: unknown, origins: Record<string, FieldOrigin>, path: string, field = "") {
    if (typeof v === "number") { this.number(v,path, -Infinity); this.origin(origins?.[field],path+".origins"); }
    else if (v && typeof v === "object") for (const [k,x] of Object.entries(v)) if (!["origins","origin"].includes(k)) this.numericOrigins(x,origins,path+"."+k,field?field+"."+k:k);
  }
  result<T>(value: T): ValidationResult<T> { return this.errors.length ? { ok: false, errors: this.errors } : { ok: true, value: structuredClone(value) }; }
}
function surfaceChecks(c: Check, input: unknown, path: string, family?: string) {
  if (!c.exact(input,path,["id","areaM2","emissivity","active","closable","builtin","circuitOwner","irProfile","origins"])) return;
  const s = input as ThermalSurface; c.text(s.id,path+".id"); c.positive(s.areaM2,path+".areaM2"); c.number(s.emissivity,path+".emissivity",Number.MIN_VALUE,1);
  for (const k of ["active","closable","builtin"] as const) c.flag(s[k],path+"."+k);
  if (!s.active && s.closable) c.bad(path+".closable","Пассивная поверхность не закрывается");
  if (c.exact(s.circuitOwner,path+".circuitOwner",["kind"],s.circuitOwner?.kind === "pump-radiator" ? ["instanceId"] : [])) {
    c.choice(s.circuitOwner.kind,path+".circuitOwner.kind",["common-ti","pump-radiator"]);
    if (s.circuitOwner.kind === "pump-radiator") { c.text(s.circuitOwner.instanceId,path+".circuitOwner.instanceId"); if (family && (family !== "pump-radiator" || s.circuitOwner.instanceId !== "self")) c.bad(path+".circuitOwner","Свои панели закрепляются только за своим насосом"); }
    else if (family === "pump-radiator") c.bad(path+".circuitOwner","Панели насосного радиатора не входят в общий TI");
  }
  if (c.exact(s.irProfile,path+".irProfile",["version","kind","aftFraction"])) {
    c.choice(s.irProfile.version,path+".irProfile.version",["radiator-ir/1"]); c.choice(s.irProfile.kind,path+".irProfile.kind",["omnidirectional","aft-directed"]); c.number(s.irProfile.aftFraction,path+".irProfile.aftFraction",0,1);
    if (s.irProfile.kind === "omnidirectional" && s.irProfile.aftFraction !== 0) c.bad(path+".irProfile","Обычная поверхность остаётся всенаправленной");
  }
  c.numericOrigins(s,s.origins,path);
}
function materialChecks(c: Check, materials: unknown, path: string) {
  if (!c.list(materials,path)) return;
  const ids = new Set(); if (!materials.length) c.bad(path,"Нужен сухой bill");
  materials.forEach((m,i) => { const p=path+"."+i; if (!c.exact(m,p,["id","massKg","cpJKgK","contents","origin"])) return; c.text(m.id,p+".id"); if(ids.has(m.id)) c.bad(p+".id","Повтор материала"); ids.add(m.id); c.positive(m.massKg,p+".massKg"); c.positive(m.cpJKgK,p+".cpJKgK"); c.choice(m.contents,p+".contents",["dry"]); c.origin(m.origin,p+".origin"); });
}
function itemChecks(c: Check, input: unknown, path: string) {
  if (!c.exact(input,path,["id","label","category","size","family","formFactor","class","generation","generationState","materials","numerics","gate","thermalRole","durability","surfaces","origins"],["species","propulsionType","cargoType"])) return;
  const m=input as ModuleItemV3; c.text(m.id,path+".id"); c.text(m.label,path+".label"); c.choice(m.category,path+".category",categories); c.choice(m.size,path+".size",sizes.slice(0,-1)); c.choice(m.family,path+".family",families); c.choice(m.class,path+".class",classes); c.number(m.generation,path+".generation",0,Infinity,true); c.choice(m.generationState,path+".generationState",["authored"]); c.choice(m.formFactor,path+".formFactor",["single","pair"]); c.choice(m.thermalRole,path+".thermalRole",["ordinary","regulator"]);
  materialChecks(c,m.materials,path+".materials");
  if (c.exact(m.gate,path+".gate",["low","workLow","workHigh","high","restartLow","restartHigh"])) { for(const[k,n]of Object.entries(m.gate))c.positive(n,path+".gate."+k);const g=m.gate;if(!(g.low<g.workLow&&g.workLow<=g.workHigh&&g.workHigh<g.high&&g.low<g.restartLow&&g.restartLow<=g.restartHigh&&g.restartHigh<g.high))c.bad(path+".gate","Неверный порядок четырёх thermal границ и restart band"); }
  if(c.exact(m.durability,path+".durability",["behavior","emergencyDepthR","wearPerWorkSecond","failurePeriodSeconds","cooldownSeconds"])) { c.choice(m.durability.behavior,path+".durability.behavior",["repairable-active","passive","hull","armor","vital"]);c.positive(m.durability.emergencyDepthR,path+".durability.emergencyDepthR");c.number(m.durability.wearPerWorkSecond,path+".durability.wearPerWorkSecond");c.positive(m.durability.failurePeriodSeconds,path+".durability.failurePeriodSeconds");c.number(m.durability.cooldownSeconds,path+".durability.cooldownSeconds"); }
  if (!object(m.numerics)) c.bad(path+".numerics","Нужны SI параметры"); else {
    for(const[k,n]of Object.entries(m.numerics))c.number(n,path+".numerics."+k);
    const required: Record<string,string[]>={engine:["forceN","alpha","efficiency","hostFraction","powerW","pathEfficiency"],generator:["powerW","efficiency","pathEfficiency","exportFraction"],solar:["areaM2","efficiency"],battery:["capacityJ"],tank:["fuelCapacityKg"],mining:["powerW","efficiency"],cargo:["cargoM3"],radiator:["auxW"],buffer:["capacityJ","chargePowerW","dischargePowerW"],h2:["coolingW","auxW","qJKg"],thermoinverter:["maximumBusPowerW","maximumCoolingW","copEfficiency","driveEfficiency","evaporatorConductanceWPerK","condenserConductanceWPerK","maximumHotK"],"pump-radiator":["maximumBusPowerW","maximumCoolingW","copEfficiency","driveEfficiency","evaporatorConductanceWPerK","condenserConductanceWPerK","maximumHotK","auxW"],furnace:["heatingW","efficiency","auxW"],"electric-heater":["powerW","efficiency"],shielding:["powerW","emTransmission","antennaTransmission"],gyrodyne:["powerW","torqueNm"],ram:["radarTransmission"],shell:["powerW","managedBodyFraction"],sensor:["powerW"],radar:["powerW"],transmitter:["powerW"]};
    for(const k of required[m.family]??[])c.number(m.numerics[k],path+".numerics."+k);
    for(const k of ["efficiency","pathEfficiency","copEfficiency","driveEfficiency"])if(Object.hasOwn(m.numerics,k))c.number(m.numerics[k],path+".numerics."+k,Number.MIN_VALUE,1);
    for(const k of ["hostFraction","exportFraction","emTransmission","antennaTransmission","radarTransmission","managedBodyFraction"])if(Object.hasOwn(m.numerics,k))c.number(m.numerics[k],path+".numerics."+k,0,1);
    for(const k of ["capacityJ","qJKg","evaporatorConductanceWPerK","condenserConductanceWPerK","maximumHotK"])if(Object.hasOwn(m.numerics,k))c.positive(m.numerics[k],path+".numerics."+k);
  }
  if(m.species!==undefined)c.choice(m.species,path+".species",["diesel","hydrogen"]);
  if(["generator","tank","h2","furnace"].includes(m.family)&&!m.species)c.bad(path+".species","Нужен operating species");
  if(m.family==="h2"&&m.species!=="hydrogen")c.bad(path+".species","H₂ требует hydrogen");
  if(m.family==="engine") {c.choice(m.propulsionType,path+".propulsionType",["diesel","hydrogen","electric"]);if(m.propulsionType==="electric"?m.species!==undefined:m.species!==m.propulsionType)c.bad(path+".species","Propulsion type и species не согласованы");}
  if(m.family==="cargo")c.choice(m.cargoType,path+".cargoType",["universal","bulk","liquid"]);
  if(c.list(m.surfaces,path+".surfaces")){const ids=new Set();m.surfaces.forEach((s,i)=>{surfaceChecks(c,s,path+".surfaces."+i,m.family);if(ids.has(s?.id))c.bad(path+".surfaces","Повтор поверхности");ids.add(s?.id);});if(["radiator","pump-radiator"].includes(m.family)&&!m.surfaces.length)c.bad(path+".surfaces","Радиатору нужна собственная площадь");if(!["radiator","pump-radiator"].includes(m.family)&&m.surfaces.length)c.bad(path+".surfaces","Это изделие не создаёт радиаторную поверхность");}
  c.numericOrigins(m,m.origins,path);
}
function hullChecks(c:Check,input:unknown,path:string){
  if(!c.exact(input,path,["id","label","size","class","generation","architecture","slots","builtins","materials","hullPowerW","bodyExchangeAreaM2","bodyEmissivity","hullPassiveRadiator","modes","origins"]))return;
  const h=input as HullV3;c.text(h.id,path+".id");c.text(h.label,path+".label");c.choice(h.size,path+".size",["S","M","L"]);c.choice(h.class,path+".class",classes);c.choice(h.architecture,path+".architecture",["U","D","H","E","A"]);c.number(h.generation,path+".generation",0,Infinity,true);c.number(h.hullPowerW,path+".hullPowerW");c.positive(h.bodyExchangeAreaM2,path+".bodyExchangeAreaM2");c.number(h.bodyEmissivity,path+".bodyEmissivity",Number.MIN_VALUE,1);materialChecks(c,h.materials,path+".materials");
  if(h.hullPassiveRadiator!==null){surfaceChecks(c,h.hullPassiveRadiator,path+".hullPassiveRadiator");if(h.hullPassiveRadiator?.active||h.hullPassiveRadiator?.closable||!h.hullPassiveRadiator?.builtin||h.hullPassiveRadiator?.circuitOwner.kind!=="common-ti")c.bad(path+".hullPassiveRadiator","Собственный passive radiator несъёмен, открыт и допускается к общему TI");}
  if(c.list(h.modes,path+".modes")){h.modes.forEach((m,i)=>c.choice(m,path+".modes."+i,modes));if(!h.modes.includes("Efficient")||new Set(h.modes).size!==h.modes.length)c.bad(path+".modes","Нужен Efficient без повторов");}
  if(c.list(h.slots,path+".slots")){const ids=new Set();h.slots.forEach((s,i)=>{const p=path+".slots."+i;if(!c.exact(s,p,["id","category","size","families","mandatory","formFactor"],["role"]))return;c.text(s.id,p+".id");if(ids.has(s.id))c.bad(p+".id","Повтор слота");ids.add(s.id);c.choice(s.category,p+".category",categories);c.choice(s.size,p+".size",sizes.slice(0,-1));c.flag(s.mandatory,p+".mandatory");c.choice(s.formFactor,p+".formFactor",["single","pair"]);if(c.list(s.families,p+".families"))s.families.forEach((f,j)=>c.choice(f,p+".families."+j,families));if(s.role!==undefined)c.choice(s.role,p+".role",["march","retro","strafe","turn"]);});}
  if(c.list(h.builtins,path+".builtins")){const ids=new Set();h.builtins.forEach((b,i)=>{const p=path+".builtins."+i;if(!c.exact(b,p,["id","item"],["role"]))return;c.text(b.id,p+".id");if(ids.has(b.id))c.bad(p+".id","Повтор встроенного экземпляра");ids.add(b.id);itemChecks(c,b.item,p+".item");});}
  c.numericOrigins(h,h.origins,path);
}
export function validateCatalogV3(input:unknown):ValidationResult<CandidateCatalogV3>{const c=new Check();if(c.exact(input,"catalog",["version","hulls","items","presets"])){
  c.choice(input.version,"catalog.version",[CATALOG_V3]);if(c.list(input.hulls,"catalog.hulls")){const ids=new Set();input.hulls.forEach((h:any,i:number)=>{hullChecks(c,h,"catalog.hulls."+i);if(ids.has(h?.id))c.bad("catalog.hulls."+i+".id","Повтор корпуса");ids.add(h?.id);});}
  if(!object(input.items))c.bad("catalog.items","Нужен inventory");else for(const[id,item]of Object.entries(input.items)){itemChecks(c,item,"catalog.items."+id);if(id!==(item as any)?.id)c.bad("catalog.items."+id+".id","Inventory key не совпадает с ID");}
  if(!object(input.presets))c.bad("catalog.presets","Нужны пресеты");
}return c.result(input as CandidateCatalogV3);}
export function validateShipModelFit(input:unknown,catalog:CandidateCatalogV3,requireRunnable=false):ValidationResult<ShipFitV3>{
  const c=new Check(),cv=validateCatalogV3(catalog);if(!cv.ok){c.errors.push(...cv.errors);return c.result(input as ShipFitV3);}
  if(!c.exact(input,"fit",["schemaVersion","fitRevision","catalogVersion","hullId","assignments","instances","localVariants","builtinModes","initial"]))return c.result(input as ShipFitV3);
  const f=input as ShipFitV3;c.choice(f.schemaVersion,"schemaVersion",["u2-ship-fit/2"]);c.choice(f.catalogVersion,"catalogVersion",[CATALOG_V3]);c.number(f.fitRevision,"fitRevision",1,Infinity,true);
  const h=catalog.hulls?.find(h=>h.id===f.hullId);if(!h){c.bad("hullId","Неизвестный корпус");return c.result(f);}
  if(!object(f.assignments)||!object(f.instances)||!object(f.localVariants)||!object(f.builtinModes)){c.bad("fit","Нужны records fitting");return c.result(f);}
  for(const[id,item]of Object.entries(f.localVariants)){itemChecks(c,item,"localVariants."+id);if(item?.id!==id)c.bad("localVariants."+id+".id","Variant key не совпадает с ID");}
  const used=new Set(h.builtins.map(b=>b.id)),roster:ModuleItemV3[]=[];
  for(const[slotId,id]of Object.entries(f.assignments)){const p="assignments."+slotId,s=h.slots.find(s=>s.id===slotId),i=f.instances[id];if(used.has(id))c.bad(p,"Повтор экземпляра");used.add(id);if(!s){c.bad(p,"Неизвестный слот");continue;}if(!c.exact(i,"instances."+id,["id","itemId","enabled"],["variant","mode"]))continue;c.flag(i.enabled,"instances."+id+".enabled");if(i.id!==id)c.bad("instances."+id+".id","Instance key не совпадает с ID");const m=f.localVariants[i.itemId]??catalog.items[i.itemId];if(!m){c.bad("instances."+id+".itemId","Нет изделия в этой edition");continue;}roster.push(m);if(m.category!==s.category||!s.families.includes(m.family)||m.formFactor!==s.formFactor||sizes.indexOf(m.size)>sizes.indexOf(s.size))c.bad(p,"Несовместимые category/family/form factor/size");if(requireRunnable&&s.mandatory&&!i.enabled)c.bad(p,"Обязательный слот выключен");}
  for(const id of Object.keys(f.instances))if(!Object.values(f.assignments).includes(id)||h.builtins.some(b=>b.id===id))c.bad("instances."+id,"Неназначенный или встроенный экземпляр");
  for(const[id,mode]of Object.entries(f.builtinModes)){if(!c.exact(mode,"builtinModes."+id,["enabled"],["mode"]))continue;c.flag(mode.enabled,"builtinModes."+id+".enabled");if(!h.builtins.some(b=>b.id===id&&!['battery','tank','cargo'].includes(b.item.family)))c.bad("builtinModes."+id,"Встроенный stock нельзя снять или выключить");}
  if(c.exact(f.initial,"initial",["chargeFraction","fuelFraction"])){c.number(f.initial.chargeFraction,"initial.chargeFraction",0,1);if(c.exact(f.initial.fuelFraction,"initial.fuelFraction",["diesel","hydrogen"]))for(const sp of ['diesel','hydrogen']as const)c.number(f.initial.fuelFraction[sp],"initial.fuelFraction."+sp,0,1);}
  const installed=[...h.builtins.map(b=>b.item),...roster],engines=installed.filter(m=>m.family==='engine');if(new Set(engines.map(m=>m.propulsionType)).size>1)c.bad("instances","Все двигательные роли должны иметь один propulsion type");
  for(const m of engines)if((['E','A'].includes(h.architecture)&&m.propulsionType!=='electric')||(['D','H'].includes(h.architecture)&&!['electric',h.architecture==='D'?'diesel':'hydrogen'].includes(m.propulsionType!)))c.bad('instances','Несовместимый с architecture propulsion type');
  const enabled=[...h.builtins.filter(b=>f.builtinModes[b.id]?.enabled!==false).map(b=>b.item),...Object.values(f.instances).filter(i=>i?.enabled).map(i=>f.localVariants[i.itemId]??catalog.items[i.itemId]).filter(Boolean)];
  if(requireRunnable){for(const s of h.slots.filter(s=>s.mandatory))if(!f.assignments[s.id])c.bad("assignments."+s.id,"Не установлен обязательный модуль");if(!enabled.some(m=>m.family==='battery'))c.bad("instances","Нужен включённый аккумулятор");for(const m of enabled)if(m.species&&m.family!=='tank'&&!enabled.some(t=>t.family==='tank'&&t.species===m.species))c.bad("instances","Потребителю нужен включённый operating tank");}
  return c.result(f);
}

export function compileShipModelFit(input: unknown, catalog: CandidateCatalogV3): ValidationResult<ResolvedShipV3> {
  const fit = input as ShipFitV3;
  const validated = validateShipModelFit(input,catalog,true);
  if (!validated.ok) return validated;
  if (fit?.schemaVersion !== "u2-ship-fit/2" || fit.catalogVersion !== CATALOG_V3 || catalog.version !== CATALOG_V3)
    return { ok: false, errors: [{ path: "schemaVersion", code: "SHIP_MODEL_SCHEMA", message: "Нужна явная компиляция fitting в catalog 0.3.0" }] };
  const hull = structuredClone(catalog.hulls.find(h => h.id === fit.hullId));
  if (!hull) return { ok: false, errors: [{ path: "hullId", code: "HULL", message: "Неизвестный корпус" }] };
  const instances: ResolvedInstanceV3[] = hull.builtins.map(b => ({ id: b.id, item: structuredClone(b.item), enabled: fit.builtinModes[b.id]?.enabled ?? true, builtin: true, ...(b.role ? { role: b.role } : {}) }));
  for (const [slotId, id] of Object.entries(fit.assignments)) {
    const instance = fit.instances[id], slot = hull.slots.find(s => s.id === slotId);
    const item = instance && (fit.localVariants[instance.itemId] ?? catalog.items[instance.itemId]);
    if (!slot || !instance || !item) return { ok: false, errors: [{ path: "assignments." + slotId, code: "MOUNT", message: "Неизвестный слот, экземпляр или изделие" }] };
    instances.push({ id, item: structuredClone(item), enabled: instance.enabled, builtin: false, slotId, ...(slot.role ? { role: slot.role } : {}) });
  }
  const materials = [...hull.materials.map(m => ({ ...m, id: "shell:" + m.id })), ...instances.flatMap(i => i.item.materials.map(m => ({ ...m, id: i.id + ":" + m.id })))];
  const resources: ResolvedShipV3["resources"] = { diesel: { capacityKg: 0, energyJKg: 43e6, tankIds: [], consumerIds: [] }, hydrogen: { capacityKg: 0, energyJKg: 120e6, tankIds: [], consumerIds: [] } };
  const cargoCapacityM3 = { universal: 0, bulk: 0, liquid: 0 }, bufferCapacityJ: Record<string, number> = {}, origins = { ...hull.origins };
  let batteryCapacityJ = 0;
  for (const i of instances) {
    if (i.item.family === "cargo") cargoCapacityM3[i.item.cargoType!] += i.item.numerics.cargoM3;
    if (i.enabled && i.item.family === "battery") batteryCapacityJ += i.item.numerics.capacityJ;
    if (i.item.family === "buffer") bufferCapacityJ[i.id] = i.item.numerics.capacityJ;
    if (i.enabled && i.item.species) { const r = resources[i.item.species]; if (i.item.family === "tank") { r.capacityKg += i.item.numerics.fuelCapacityKg; r.tankIds.push(i.id); } else r.consumerIds.push(i.id); }
    for (const [path, origin] of Object.entries(i.item.origins)) origins[i.id + "." + path] = origin;
  }
  const surfaces = [...(hull.hullPassiveRadiator ? [hull.hullPassiveRadiator] : []), ...instances.flatMap(i => i.item.surfaces.map(s => ({ ...structuredClone(s), id: i.id + ":" + s.id, builtin: i.builtin, circuitOwner: s.circuitOwner.kind === "pump-radiator" ? { kind: "pump-radiator" as const, instanceId: i.id } : s.circuitOwner })))];
  const derived=(unit:string,derivation:string):FieldOrigin=>({kind:'derived',unit,sourceRef:'src/model/v3/schema.ts: compileShipModelFit; frozen installed dry bill/stock graph',derivation});
  origins.dryMassKg=derived('kg','sum(materials.massKg), каждый installed dry bill ровно один раз');
  origins.heatCapacityJK=derived('J/K','sum(materials.massKg * materials.cpJKgK); без fuel/cargo contents и stored buffer J');
  origins.batteryCapacityJ=derived('J','sum(enabled battery capacityJ)');
  for(const[id]of Object.entries(bufferCapacityJ))origins['bufferCapacityJ.'+id]=derived('J','installed buffer capacityJ, сохраняется и в выключенном состоянии');
  for(const type of ['universal','bulk','liquid'])origins['cargoCapacityM3.'+type]=derived('m³','sum(installed cargo cargoM3 по типу)');
  for(const sp of ['diesel','hydrogen']){origins['resources.'+sp+'.capacityKg']=derived('kg','sum(enabled operating tank fuelCapacityKg)');origins['resources.'+sp+'.energyJKg']={kind:'experimental',unit:'J/kg',sourceRef:'src/fitting/compile.ts: frozen 0.2.x fuel energy anchor',note:'Явно перенесённый энергетический якорь Лабы, не новый канонический паспорт'};}
  return { ok: true, value: structuredClone({ catalogVersion: CATALOG_V3, hull, fit, instances, materials, dryMassKg: materials.reduce((n,m) => n+m.massKg,0), heatCapacityJK: materials.reduce((n,m) => n+m.massKg*m.cpJKgK,0), batteryCapacityJ, bufferCapacityJ, cargoCapacityM3, resources, surfaces, origins }) };
}

function same(a: unknown,b:unknown): boolean {
  const ordered=(x:unknown):unknown=>Array.isArray(x)?x.map(ordered):object(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,ordered(v)])):x;
  return JSON.stringify(ordered(a))===JSON.stringify(ordered(b));
}
function resolvedChecks(c:Check,input:unknown,path:string):input is ResolvedShipV3{
  if(!c.exact(input,path,["catalogVersion","hull","fit","instances","materials","dryMassKg","heatCapacityJK","batteryCapacityJ","bufferCapacityJ","cargoCapacityM3","resources","surfaces","origins"]))return false;
  const s=input as ResolvedShipV3;c.choice(s.catalogVersion,path+".catalogVersion",[CATALOG_V3]);hullChecks(c,s.hull,path+".hull");
  for(const key of ['dryMassKg','heatCapacityJK','batteryCapacityJ','bufferCapacityJ','cargoCapacityM3','resources']as const)c.numericOrigins(s[key],s.origins,path+'.'+key,key);
  if(!c.list(s.instances,path+".instances"))return false;
  const ids=new Set<string>(),items:Record<string,ModuleItemV3>={};
  for(const[i,row]of s.instances.entries()){const p=path+".instances."+i;if(!c.exact(row,p,["id","item","enabled","builtin"],["slotId","role"]))continue;c.text(row.id,p+".id");if(ids.has(row.id))c.bad(p+".id","Повтор экземпляра");ids.add(row.id);c.flag(row.enabled,p+".enabled");c.flag(row.builtin,p+".builtin");itemChecks(c,row.item,p+".item");if(row.item)items[row.item.id]=row.item;}
  const compiled=compileShipModelFit(s.fit,{version:CATALOG_V3,hulls:[s.hull],items,presets:{}});
  if(!compiled.ok)c.errors.push(...compiled.errors.map(e=>({...e,path:path+".fit."+e.path})));
  else for(const key of ["instances","materials","dryMassKg","heatCapacityJK","batteryCapacityJ","bufferCapacityJ","cargoCapacityM3","resources","surfaces"]as const)if(!same(s[key],compiled.value[key]))c.bad(path+"."+key,"Не соответствует installed roster и exclusive bill/stock/surface graph");
  if(c.list(s.surfaces,path+".surfaces")){const seen=new Set();for(const[i,surface]of s.surfaces.entries()){surfaceChecks(c,surface,path+".surfaces."+i);if(seen.has(surface?.id))c.bad(path+".surfaces","Повтор поверхности");seen.add(surface?.id);const owner=surface?.circuitOwner;if(owner?.kind==='pump-radiator'&&!s.instances.some(i=>i.id===owner.instanceId&&i.item.family==='pump-radiator'))c.bad(path+".surfaces."+i+".circuitOwner","Неизвестный владелец контура");}}
  return true;
}
function environmentChecks(c:Check,input:unknown,path:string){
  if(!c.exact(input,path,["radiativeBackgroundK","backgroundSourceId","thermalField","solarFluxWm2","solarSourceId","energyInputs","directHeat"]))return;
  const e=input as EnvironmentV3;c.positive(e.radiativeBackgroundK,path+".radiativeBackgroundK");c.number(e.solarFluxWm2,path+".solarFluxWm2");
  const ids=new Set<string>();const source=(id:unknown,p:string)=>{c.text(id,p);if(typeof id==='string'){if(ids.has(id))c.bad(p,"Повтор representation одного источника");ids.add(id);}};source(e.backgroundSourceId,path+".backgroundSourceId");
  if(e.solarFluxWm2>0)source(e.solarSourceId,path+".solarSourceId");else if(e.solarSourceId!==null)source(e.solarSourceId,path+".solarSourceId");
  if(e.thermalField!==null&&c.exact(e.thermalField,path+".thermalField",["temperatureK","coefficientWPerM2K","sourceId"])){c.positive(e.thermalField.temperatureK,path+".thermalField.temperatureK");c.number(e.thermalField.coefficientWPerM2K,path+".thermalField.coefficientWPerM2K");source(e.thermalField.sourceId,path+".thermalField.sourceId");}
  for(const key of ['energyInputs','directHeat']as const)if(c.list(e[key],path+"."+key))e[key].forEach((row,i)=>{const p=path+"."+key+"."+i;if(!c.exact(row,p,["sourceId","powerW",...(key==='energyInputs'?['representation']:[])]))return;c.number(row.powerW,p+".powerW");source(row.sourceId,p+".sourceId");if(key==='energyInputs')c.choice((row as any).representation,p+".representation",['electric','heat']);});
}
function stateChecks(c:Check,input:unknown,ship:ResolvedShipV3,path:string){
  if(!c.exact(input,path,["schemaVersion","modelVersion","stateVersion","timeSeconds","phaseIndex","phaseElapsedSeconds","mode","maskingEntryTemperatureK","temperatureK","chargeJ","fuelKg","buffers","governor","generator","modules","surfaceOpen","rng"]))return;
  const s=input as StateV3;c.choice(s.schemaVersion,path+".schemaVersion",[SCHEMA_V3]);c.choice(s.modelVersion,path+".modelVersion",[MODEL_V3]);c.choice(s.stateVersion,path+".stateVersion",['ship-state/1']);
  for(const key of ['timeSeconds','phaseIndex','phaseElapsedSeconds']as const)c.number(s[key],path+"."+key,0,Infinity,true);
  c.choice(s.mode,path+".mode",ship.hull.modes);c.positive(s.temperatureK,path+".temperatureK");c.number(s.chargeJ,path+".chargeJ",0,ship.batteryCapacityJ);
  if(s.maskingEntryTemperatureK!==null)c.positive(s.maskingEntryTemperatureK,path+".maskingEntryTemperatureK");else if(s.mode==='Masking')c.bad(path+".maskingEntryTemperatureK","В Masking нужна сохранённая температура входа");
  if(c.exact(s.fuelKg,path+".fuelKg",['diesel','hydrogen']))for(const sp of ['diesel','hydrogen']as const)c.number(s.fuelKg[sp],path+".fuelKg."+sp,0,ship.resources[sp].capacityKg);
  if(c.exact(s.buffers,path+".buffers",Object.keys(ship.bufferCapacityJ)))for(const[id,cap]of Object.entries(ship.bufferCapacityJ)){const row=s.buffers[id],p=path+".buffers."+id;if(!c.exact(row,p,['storedJ','minimumCaptureK']))continue;c.number(row.storedJ,p+".storedJ",0,cap);if(row.storedJ===0){if(row.minimumCaptureK!==null)c.bad(p+".minimumCaptureK","Пустой буфер сбрасывает метку");}else c.positive(row.minimumCaptureK,p+".minimumCaptureK");}
  if(c.exact(s.governor,path+".governor",['coolingStageId','heatingStageId','recoveringBuffer'])){c.flag(s.governor.recoveringBuffer,path+".governor.recoveringBuffer");for(const k of ['coolingStageId','heatingStageId']as const)if(s.governor[k]!==null)c.choice(s.governor[k],path+".governor."+k,['radiation','active-radiator','common-ti','pump-radiator','buffer-absorb','buffer-release','h2','furnace','electric-heater','combat-group','masking-buffer']);}
  if(c.exact(s.generator,path+".generator",['permission','normalOn']))for(const k of ['permission','normalOn']as const)c.flag(s.generator[k],path+".generator."+k);
  if(c.exact(s.modules,path+".modules",ship.instances.map(i=>i.id)))for(const i of ship.instances){const p=path+".modules."+i.id,row=s.modules[i.id];if(!c.exact(row,p,['durabilityR','firstNegativeCrossing','emergencyExposureSeconds','cooldownSeconds','restartAuthorized','thermalStopped']))continue;c.number(row.durabilityR,p+".durabilityR",-Infinity);for(const k of ['firstNegativeCrossing','restartAuthorized','thermalStopped']as const)c.flag(row[k],p+"."+k);for(const k of ['emergencyExposureSeconds','cooldownSeconds']as const)c.number(row[k],p+"."+k);}
  if(c.exact(s.surfaceOpen,path+".surfaceOpen",ship.surfaces.map(s=>s.id)))for(const surface of ship.surfaces){c.flag(s.surfaceOpen[surface.id],path+".surfaceOpen."+surface.id);if(!surface.closable&&!s.surfaceOpen[surface.id])c.bad(path+".surfaceOpen."+surface.id,"Пассивная поверхность постоянно открыта");}
  if(c.exact(s.rng,path+".rng",['algorithm','seed','state'])){c.choice(s.rng.algorithm,path+".rng.algorithm",['xorshift32/1']);c.number(s.rng.seed,path+".rng.seed",1,0xffffffff,true);c.number(s.rng.state,path+".rng.state",1,0xffffffff,true);}
}
export function validateStateV3(input:unknown,ship:ResolvedShipV3):ValidationResult<StateV3>{const c=new Check();try{stateChecks(c,input,ship,'state');}catch{c.bad('state','Неполный state или физический контекст');}return c.result(input as StateV3);}
export function validateRunSpecV3(input:unknown):ValidationResult<RunSpecV3>{
  const c=new Check();try{
    if(!c.exact(input,'$',['schemaVersion','modelVersion','catalogVersion','units','approvedBaseline','resolvedShip','origins','environment','initialState','receiverProfile','observer','scenario','durationSeconds','stepSeconds']))return c.result(input as RunSpecV3);
    const s=input as RunSpecV3;c.choice(s.schemaVersion,'schemaVersion',[SCHEMA_V3]);c.choice(s.modelVersion,'modelVersion',[MODEL_V3]);c.choice(s.catalogVersion,'catalogVersion',[CATALOG_V3]);c.choice(s.units,'units',['SI']);c.choice(s.approvedBaseline,'approvedBaseline',[false]);c.choice(s.receiverProfile,'receiverProfile',['positive-only','absolute-contrast']);c.choice(s.stepSeconds,'stepSeconds',[1]);c.number(s.durationSeconds,'durationSeconds',1,Infinity,true);
    if(resolvedChecks(c,s.resolvedShip,'resolvedShip'))stateChecks(c,s.initialState,s.resolvedShip,'initialState');
    environmentChecks(c,s.environment,'environment');
    if(c.exact(s.observer,'observer',['presetId','rangeM','aspectDeg'])){c.text(s.observer.presetId,'observer.presetId');c.positive(s.observer.rangeM,'observer.rangeM');c.number(s.observer.aspectDeg,'observer.aspectDeg',-Infinity);}
    if(c.exact(s.scenario,'scenario',['name','repeat','phases'])){c.text(s.scenario.name,'scenario.name');c.flag(s.scenario.repeat,'scenario.repeat');if(c.list(s.scenario.phases,'scenario.phases')){const ids=new Set();if(!s.scenario.phases.length)c.bad('scenario.phases','Нужна фаза');for(const[i,p]of s.scenario.phases.entries()){const path='scenario.phases.'+i;if(!c.exact(p,path,['id','action','durationSeconds','requests','environment']))continue;c.text(p.id,path+'.id');if(ids.has(p.id))c.bad(path+'.id','Повтор фазы');ids.add(p.id);c.choice(p.action,path+'.action',['idle','work','maneuver','recovery']);c.number(p.durationSeconds,path+'.durationSeconds',1,Infinity,true);if(p.environment!==null)environmentChecks(c,p.environment,path+'.environment');if(!object(p.requests))c.bad(path+'.requests','Нужен record запросов');else for(const[id,duty]of Object.entries(p.requests)){c.number(duty,path+'.requests.'+id,0,1);if(!s.resolvedShip.instances.some(i=>i.id===id))c.bad(path+'.requests.'+id,'Неизвестный установленный instance');}}}}
    const current=s.scenario.phases[s.initialState.phaseIndex];if(!current)c.bad('initialState.phaseIndex','Сохранённый index вне сценария');else if(s.initialState.phaseElapsedSeconds>current.durationSeconds)c.bad('initialState.phaseElapsedSeconds','Сохранённое время вне фазы');
    for(const[key,value]of Object.entries(s))if(!['origins','resolvedShip'].includes(key))c.numericOrigins(value,s.origins,key,key);
  }catch{c.bad('$','Неполный ship-model snapshot');}
  return c.result(input as RunSpecV3);
}
