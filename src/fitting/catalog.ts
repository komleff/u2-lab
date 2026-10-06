import { isKnownCatalogVersion, hullsForEdition } from "./editions";
import itemData from "./data/modules.json" with { type: "json" };
import additions from "./data/modules-0.2.1.json" with { type: "json" };
import type {
  CandidateCatalog,
  FieldOrigin,
  ModuleItem,
  ShipFit,
} from "./types";
export function loadCandidateCatalog(
  version: CandidateCatalog["version"] = "ship-fitting-0.2.2",
): CandidateCatalog {
  if (!isKnownCatalogVersion(version)) throw new Error("Неизвестная версия каталога: " + version);
  return structuredClone({
    version,
    hulls: hullsForEdition(version),
    items: version === "ship-fitting-0.2.0" ? itemData : { ...itemData, ...additions },
  }) as unknown as CandidateCatalog;
}
export function getPresetFit(
  id: string,
  version: CandidateCatalog["version"] = "ship-fitting-0.2.2",
): ShipFit {
  const c = loadCandidateCatalog(version);
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
