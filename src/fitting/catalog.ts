import { isKnownCatalogVersion, hullsForEdition } from "./editions";
import defaultSputnik from "./data/default-sputnik-0.2.4.json" with { type:"json" };
import defaultErmak from "./data/default-ermak-0.2.4.json" with { type:"json" };
import defaultPony from "./data/default-diesel-pony-0.2.4.json" with { type:"json" };
import itemData from "./data/modules.json" with { type: "json" };
import additions from "./data/modules-0.2.1.json" with { type: "json" };
import medium from "./data/modules-0.2.3.json" with { type: "json" };
import type {
  CandidateCatalog,
  FieldOrigin,
  ModuleItem,
  ShipFit,
} from "./types";
export function loadCandidateCatalog(
  version: CandidateCatalog["version"] = "ship-fitting-0.2.3",
): CandidateCatalog {
  if (!isKnownCatalogVersion(version)) throw new Error("Неизвестная версия каталога: " + version);
  return structuredClone({
    version,
    hulls: hullsForEdition(version),
    items: version === "ship-fitting-0.2.0" ? itemData : ["ship-fitting-0.2.3","ship-fitting-0.2.4","ship-fitting-0.2.5"].includes(version) ? { ...itemData, ...additions, ...medium } : { ...itemData, ...additions },
  }) as unknown as CandidateCatalog;
}
export function getPresetFit(
  id: string,
  version: CandidateCatalog["version"] = "ship-fitting-0.2.3",
): ShipFit {
  const c = loadCandidateCatalog(version);
  if (version === "ship-fitting-0.2.5") return mediumPreset(id, c);
  if (version === "ship-fitting-0.2.4") {
    const [hullId,count]=id.split(":");
    const supplied: Record<string,unknown> = {sputnik:defaultSputnik,"industrial-S":defaultErmak,pony:defaultPony};
    if (supplied[hullId] && (count===undefined || count==="1")) {
      const fit=structuredClone(supplied[hullId]) as ShipFit;
      fit.catalogVersion=version;fit.fitRevision=1;return fit;
    }
    const fit=getPresetFit((hullId==="severin-mir"?"civilian-M":hullId)+(count?":"+count:""),"ship-fitting-0.2.3");
    fit.catalogVersion=version;fit.hullId=hullId;
    for(const [slot,instanceId] of Object.entries(fit.assignments)) if(fit.instances[instanceId].itemId==="buffer-S") {delete fit.assignments[slot];delete fit.instances[instanceId];}
    return fit;
  }
  const current = version !== "ship-fitting-0.2.0";
  const [hullId, countText] = id.split(":");
  const h = c.hulls.find((h) => h.id === hullId);
  if (!h) throw new Error("Неизвестный корпус: " + id);
  const f: ShipFit = {
    schemaVersion: "u2-ship-fit/1",
    fitRevision: 1,
    catalogVersion: c.version,
    hullId,
    assignments: {},
    instances: {},
    localVariants: {},
    initial: { chargeFraction: 1, fuelFraction: { diesel: 1, hydrogen: 1 } },
  };
  const put = (slot: string, itemId: string) => {
    const instanceId = "fit:" + slot;
    f.assignments[slot] = instanceId;
    f.instances[instanceId] = { id: instanceId, itemId, enabled: true };
  };
  const engineSize = h.size === "L" ? "M" : h.size;
  const type = h.architecture === "E" ? "electric" : "diesel";
  for (const role of ["march", "retro", "strafe", "turn"])
    put(
      role,
      current && hullId === "industrial-M"
        ? `engine-diesel-industrial-M-${["strafe", "turn"].includes(role) ? "pair" : role}`
        : `engine-${type}-${engineSize}-${["strafe", "turn"].includes(role) ? "pair" : "single"}`,
    );
  if (hullId === "pony") {
    const local = (id: string, base: string, patch: Partial<ModuleItem>) => {
      f.localVariants[id] = {
        ...structuredClone(c.items[base]),
        ...patch,
        id,
        class: "UNKNOWN",
        generation: 0,
      };
      return id;
    };
    put(
      "power-1",
      local("pony-battery", "battery-XS", {
        numerics: { capacityJ: 10e9 },
        origins: {
          ...c.items["battery-XS"].origins,
          "numerics.capacityJ": {
            kind: "derived",
            unit: "J",
            sourceRef:
              "U2@cdc490e3517c8455f662f82579c45813cdbb9a76:docs/gdd/gdd_survival_pony_power_buffer_balance_v0.1_draft.md§1",
            derivation:
              "9e9 / 0.9 = 10e9 stored J; usable anchor после discharge efficiency",
            note: "UNKNOWN/G0 anchor; сухой bill XS остаётся лабораторной гипотезой",
          },
        },
      }),
    );
    put("power-2", local("pony-generator", "generator-diesel-XS", {}));
    for (const role of ["march", "retro", "strafe", "turn"]) {
      const base = f.instances[f.assignments[role]].itemId;
      put(role, local("pony-engine-" + role, base, {}));
    }
  } else if (h.architecture === "E") {
    put("power-1", "solar-S");
  } else {
    put("power-1", "battery-XS");
    put("power-2", "generator-diesel-" + (h.size === "S" ? "S" : "M"));
    put("power-3", "tank-diesel-" + (h.size === "S" ? "S" : "M"));
  }
  // Референсная меньшая тяга принадлежит явному варианту, а не роли слота:
  // одинаковый установленный SKU обязан сохранять свой полный сухой bill и ТТХ.
  if (!(current && hullId === "industrial-M")) {
    referenceRetro(f, c, put);
  }
  put("signature-1", "radiator-passive-" + (h.size === "S" ? "S" : "M"));
  if (h.slots.some((s) => s.id === "signature-2"))
    put("signature-2", "buffer-S");
  const n = countText === undefined ? 1 : Number(countText);
  const removable = Math.max(0, n - (hullId === "pony" ? 1 : 0));
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    removable > h.slots.filter((s) => s.category === "payload").length
  )
    throw new Error("Число лазеров превышает слоты");
  const laserIds: Record<string, string> = {
    sputnik: "mining-civil-S",
    "industrial-S": "mining-industrial-S",
    "civilian-M": "mining-civil-M",
    "industrial-M": "mining-industrial-M",
    "industrial-L": "mining-industrial-L",
  };
  let laserId = current ? laserIds[hullId] : "mining-civil-S";
  if (current && hullId === "pony" && removable > 0) {
    const anchor = structuredClone(h.builtins.find((b) => b.item.family === "mining")!.item);
    laserId = "pony-removable-laser-S-G0";
    anchor.id = laserId;
    anchor.label = "Локальный лазер Pony S/G0 · UNKNOWN";
    for (const key of ["numerics.powerW", "numerics.efficiency", "materials.0.massKg"]) {
      anchor.origins[key] = {
        ...anchor.origins[key],
        kind: "derived",
        derivation: "Копия существующего builtin S/G0 anchor для съёмной установки",
        note: "Явный локальный preset вариант UNKNOWN/G0; установка и material/cp — lab candidate, не новый canonical SKU.",
      };
    }
    f.localVariants[laserId] = anchor;
  }
  for (let i = 1; i <= removable; i++) put("payload-" + i, laserId);
  if (hullId === "industrial-L" && n === 3) put("payload-4", "cargo-bulk-M");
  return f;
}

function referenceRetro(f: ShipFit, c: CandidateCatalog, put: (slot: string, itemId: string) => void) {
    const retroBaseId = f.instances[f.assignments.retro].itemId;
    const retro = structuredClone(
      f.localVariants[retroBaseId] ?? c.items[retroBaseId],
    );
    const retroId = f.localVariants[retroBaseId]
      ? retroBaseId
      : "reference-retro-" + retroBaseId;
    const sourceRef =
      "U2@cdc490e3517c8455f662f82579c45813cdbb9a76:docs/specs/spec_engine_force_grid_v0.1.md§8.2";
    const scaledOrigin = (
      origin: FieldOrigin,
      value: number,
      unit: string,
    ): FieldOrigin => ({
      kind: "derived",
      sourceRef: sourceRef + "; база: " + origin.sourceRef,
      unit,
      derivation: `${retroBaseId}: ${value} × 0.4; гражданский reference назад/вперёд = 0.38/0.95`,
      note: "Явный локальный вариант лабораторного preset; пропорциональный bill и power сохранены как допущение. Это не коэффициент роли для любого SKU.",
      ...(origin.range
        ? { range: origin.range.map((v) => v * 0.4) as [number, number] }
        : {}),
    });
    for (const key of ["forceN", "powerW"]) {
      retro.origins["numerics." + key] = scaledOrigin(
        retro.origins["numerics." + key],
        retro.numerics[key],
        key === "forceN" ? "N" : "W",
      );
      retro.numerics[key] *= 0.4;
    }
    retro.materials.forEach((material, index) => {
      const field = `materials.${index}.massKg`;
      const origin = scaledOrigin(retro.origins[field], material.massKg, "kg");
      retro.origins[field] = origin;
      material.origin = {
        ...origin,
        note:
          origin.note +
          " Cp остаётся отдельной экспериментальной гипотезой исходного bill.",
      };
      material.massKg *= 0.4;
    });
    retro.id = retroId;
    retro.label = "Референсный ретро · " + retro.label;
    f.localVariants[retroId] = retro;
    put("retro", retroId);
}

function mediumPreset(id: string, c: CandidateCatalog): ShipFit {
  const [hullId, countText, code, extra] = id.split(":");
  const supported: Record<string, string[]> = {"civilian-M":["H","E"],"severin-mir":["D","H","E"],"industrial-M":["D","H","E"],"industrial-S":["D","H","E"]};
  // Ручной H-монтаж Мира и электрический гибрид H допустимы, но не добавляют штатные options.
  if (!supported[hullId]) {
    if (code !== undefined || extra !== undefined) throw new Error("Неизвестный тип сборки: " + id);
    const fit = getPresetFit(id, "ship-fitting-0.2.4"); fit.catalogVersion = c.version; return fit;
  }
  const propulsion = code ?? (hullId === "civilian-M" ? "H" : "D");
  if (extra !== undefined || !supported[hullId].includes(propulsion)) throw new Error("Неизвестный тип сборки: " + id);
  const count = countText === undefined ? (hullId === "industrial-S" ? 1 : 2) : Number(countText);
  const base = getPresetFit(hullId + ":" + count, "ship-fitting-0.2.4");
  base.catalogVersion = c.version;
  if (hullId === "industrial-S" && propulsion === "D" && count === 1) return base;
  const size = hullId === "industrial-S" ? "S" : "M";
  const put = (slot: string, itemId: string) => {
    const instanceId = "fit:" + slot;
    base.assignments[slot] = instanceId;
    base.instances[instanceId] = {id:instanceId,itemId,enabled:true};
  };
  // Меняется только штатный монтаж этой редакции; старые фабрики и глобальные SKU остаются буквальными.
  for (const [slot, instanceId] of Object.entries(base.assignments)) if (c.hulls.find(h=>h.id===hullId)!.slots.find(s=>s.id===slot)?.category === "power") {delete base.assignments[slot];delete base.instances[instanceId];}
  base.localVariants = {};
  const type = {D:"diesel",H:"hydrogen",E:"electric"}[propulsion]!;
  for (const role of ["march","retro","strafe","turn"]) put(role, hullId === "industrial-M" && propulsion === "D" ? `engine-diesel-industrial-M-${["strafe","turn"].includes(role)?"pair":role}` : `engine-${type}-${size}-${["strafe","turn"].includes(role)?"pair":"single"}`);
  if (!(hullId === "industrial-M" && propulsion === "D")) referenceRetro(base,c,put);
  put("power-1","battery-"+size);
  if (propulsion === "E") put("power-2","solar-"+size);
  else {
    put("power-2",`generator-${type}-${size}`);
    if (hullId !== "civilian-M") put("power-3",`tank-${type}-${size}`);
  }
  if (size === "M" && count < 3) put("payload-"+(count+1),"cargo-bulk-M");
  return base;
}
export type PresetOption = {id: string; label: string; fit: ShipFit};
export function presetOptions(c: CandidateCatalog): PresetOption[] {
  const fuelNames: Record<string,string> = {D:"дизель",H:"водород",E:"электро"};
  return c.hulls.flatMap(h => {
    const codes = c.version === "ship-fitting-0.2.5" ? ({"civilian-M":["H"],"severin-mir":["D","E"],"industrial-S":["D","H","E"],"industrial-M":["D","H","E"]} as Record<string,string[]>)[h.id] : undefined;
    if (codes) return codes.map(code=>{const count=h.size === "M"?2:1,id=`${h.id}:${count}:${code}`;return {id,label:`${h.label} · ${code} (${fuelNames[code]}) · ${count} лазер${count===1?"":"а"}`,fit:getPresetFit(id,c.version)};});
    const small = ["ship-fitting-0.2.4","ship-fitting-0.2.5"].includes(c.version) && h.size === "S";
    return Array.from({length:small?1:Math.min(3,h.slots.filter(s=>s.category === "payload").length+(h.id === "pony"?1:0))},(_,i)=>{const id=`${h.id}:${i+1}`;return {id,label:`${h.label} · ${small?"базовая сборка":`${i+1} лазер${i?"а":""}`}`,fit:getPresetFit(id,c.version)};});
  });
}
export function matchesPreset(fit: ShipFit, preset: ShipFit): boolean {
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)])) : value;
  const mount = (f: ShipFit) => ({catalogVersion:f.catalogVersion,hullId:f.hullId,assignments:f.assignments,instances:f.instances,localVariants:f.localVariants,builtinModes:f.builtinModes});
  return JSON.stringify(canonical(mount(fit))) === JSON.stringify(canonical(mount(preset)));
}
