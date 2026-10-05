import hullData from "./data/hulls.json" with { type: "json" };
import itemData from "./data/modules.json" with { type: "json" };
import type { CandidateCatalog, ModuleItem, ShipFit } from "./types";
export function loadCandidateCatalog(): CandidateCatalog {
  return structuredClone({
    version: "ship-fitting-0.2.0",
    hulls: hullData,
    items: itemData,
  }) as unknown as CandidateCatalog;
}
export function getPresetFit(id: string): ShipFit {
  const c = loadCandidateCatalog();
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
      `engine-${type}-${engineSize}-${["strafe", "turn"].includes(role) ? "pair" : "single"}`,
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
  for (let i = 1; i <= removable; i++) put("payload-" + i, "mining-civil-S");
  if (hullId === "industrial-L" && n === 3) put("payload-4", "cargo-bulk-M");
  return f;
}
