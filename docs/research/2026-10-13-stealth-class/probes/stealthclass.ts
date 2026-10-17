// Предлагаемый класс «Стелс»: корпуса S/M/L и модули класса; кандидатные ТТХ для опытов ГД
import type { CandidateCatalogV3, ShipFitV3, HullV3, ModuleItemV3 } from "../../../../src/model/v3/types";
import type { Change } from "./helpers";

export type Size = "S" | "M" | "L";
const K: Record<Size, number> = { S: 1, M: 4, L: 16 }; // масса/площадь/мощность ×4 за ступень (ADR-0041)
const T: Record<Size, number> = { S: 1, M: 3, L: 9 };  // тяга ×3 за ступень, как у гражданских двигателей Лабы S→M

export const HULL = {
  massT: { S: 40, M: 160, L: 640 },               // канон: оболочка Stealth S 40 т; ×4
  hotelW: { S: 200e3, M: 800e3, L: 3200e3 },       // как у гражданских того же размера
  passiveM2: { S: 120, M: 480, L: 1920 },          // ≈0,26 гражданской (456/1826/7303)
  shell: 0.5,
  bufferJ: { S: 0.4e9, M: 1.6e9, L: 6.4e9 },        // окно сессии: покой ≈30 мин, манёвр 10–15 мин (опыт 10); эталон U2 ~2 ГДж
  radiatorM2: { S: 441, M: 1764, L: 7056 },        // встроенный активный, назад
  radiatorAuxW: { S: 150e3, M: 600e3, L: 2400e3 },
  ramT: { S: 0.8, M: 3.2, L: 12.8 },               // канон G5: RAM S 0,80 т
  cargoM3: { S: 6, M: 24, L: 96 },
  slots: { S: { power: 3, payload: 1, st: 3 }, M: { power: 4, payload: 2, st: 4 }, L: { power: 5, payload: 2, st: 5 } },
};
export const ENGINE = { thrust: 0.8, hostFraction: 0.3, mass: 1.2 }; // «тихий» водородный двигатель против гражданского

const origin = (unit: string) => ({ kind: "experimental" as const, unit, sourceRef: "scratchpad stealth class proposal 2026-10-13", note: "Кандидат ГД, не канон" });
const setNum = (it: ModuleItemV3, k: string, v: number) => { it.numerics[k] = v; it.origins["numerics." + k] = origin("SI"); };
const scaleMass = (it: ModuleItemV3, f: number) => { it.materials.forEach((m, i) => { m.massKg *= f; it.origins["materials." + i + ".massKg"] = origin("kg"); }); };
const clone = (c: CandidateCatalogV3, id: string) => structuredClone(c.items[id]) as ModuleItemV3;

// Модули L и стелс-модули добавляются в инвентарь каталога
export const addItems = (c: CandidateCatalogV3) => {
  const put = (it: ModuleItemV3) => { c.items[it.id] = it; };
  const toL = (mId: string, lId: string, f: { mass: number; nums: Record<string, number> }) => {
    const it = clone(c, mId); it.id = lId; it.label = it.label + " (L, кандидат)"; it.size = "L"; scaleMass(it, f.mass);
    for (const [k, m] of Object.entries(f.nums)) setNum(it, k, it.numerics[k] * m);
    for (const s of it.surfaces) s.areaM2 *= 4;
    put(it);
  };
  toL("generator-hydrogen-M", "generator-hydrogen-L", { mass: 4, nums: { powerW: 4 } });
  toL("battery-M", "battery-L", { mass: 4, nums: { capacityJ: 4 } });
  toL("tank-hydrogen-M", "tank-hydrogen-L", { mass: 4, nums: { fuelCapacityKg: 4 } });
  toL("buffer-M", "buffer-L", { mass: 4, nums: { capacityJ: 4, chargePowerW: 4, dischargePowerW: 4 } });
  toL("radiator-active-M", "radiator-active-L", { mass: 4, nums: { auxW: 4 } });
  toL("engine-hydrogen-M-single", "engine-hydrogen-L-single", { mass: 4, nums: { forceN: 3 } });
  toL("engine-hydrogen-M-pair", "engine-hydrogen-L-pair", { mass: 4, nums: { forceN: 3 } });
  toL("cargo-universal-M", "cargo-universal-L", { mass: 5, nums: { cargoM3: 8 } });
  for (const size of ["S", "M", "L"] as Size[]) {
    // Тихий водородный двигатель: тяга ×0,8, в корпус 30 % потерь вместо 70 %, масса ×1,2
    for (const form of ["single", "pair"]) {
      const it = clone(c, `engine-hydrogen-${size}-${form}`); it.id = `engine-hydrogen-stealth-${size}-${form}`; it.label = `Тихий водородный двигатель ${size}`; it.class = "Stealth" as never;
      setNum(it, "forceN", it.numerics.forceN * ENGINE.thrust); setNum(it, "hostFraction", ENGINE.hostFraction); scaleMass(it, ENGINE.mass); put(it);
    }
    // Гиродины M/L: момент и мощность ×4 за ступень — поворот крупного стелса медленнее
    if (size !== "S") { const g = clone(c, "gyrodyne-S"); g.id = `gyrodyne-${size}`; g.size = size; g.label = `Гиродины ${size}`; setNum(g, "torqueNm", g.numerics.torqueNm * K[size]); setNum(g, "powerW", g.numerics.powerW * K[size]); scaleMass(g, K[size]); put(g); }
    // Сенсор и EM-экран M/L (общий пробел каталога, не стелс-модули)
    if (size !== "S") { const s = clone(c, "sensor-S"); s.id = `sensor-${size}`; s.size = size; s.label = `Сенсор ${size}`; setNum(s, "powerW", s.numerics.powerW * K[size]); put(s); }
    if (size !== "S") { const s = clone(c, "shielding-S"); s.id = `shielding-${size}`; s.size = size; s.label = `EM-экран ${size}`; setNum(s, "powerW", s.numerics.powerW * K[size]); scaleMass(s, K[size]); put(s); }
  }
};

const reindex = (h: HullV3) => {
  for (const k of Object.keys(h.origins)) if (k.startsWith("builtins.")) delete h.origins[k];
  h.builtins.forEach((b, i) => { for (const [p, v] of Object.entries(b.item.origins)) h.origins["builtins." + i + ".item." + p] = structuredClone(v); });
};

// Корпус класса «Стелс» размера size поверх stealth-reference
export const stealthHull = (size: Size): Change => (c, _f, h) => {
  addItems(c);
  const k = K[size], sl = HULL.slots[size], z = size;
  h.size = size; h.class = "Stealth" as never; h.label = `Стелс ${size} · кандидат ГД`; h.generation = 1;
  h.materials[0].massKg = HULL.massT[size] * 1000; h.hullPowerW = HULL.hotelW[size]; h.bodyExchangeAreaM2 = HULL.passiveM2[size];
  const st = h.slots.find((s) => s.category === "sensors-thermal")!, pw = h.slots.find((s) => s.category === "power")!, pl = h.slots.find((s) => s.category === "payload")!;
  const prop = h.slots.filter((s) => s.category === "propulsion").map((s) => ({ ...structuredClone(s), size: z }));
  const many = (proto: typeof st, n: number, prefix: string) => Array.from({ length: n }, (_, i) => ({ ...structuredClone(proto), id: `${prefix}-${i + 1}`, size: z }));
  h.slots = [...prop, ...many(pw, sl.power, "power"), ...many(pl, sl.payload, "payload"), ...many(st, sl.st, "signature")];
  const cargo = structuredClone(h.builtins.find((b) => b.item.family === "cargo")!); cargo.item.id = `builtin-cargo-stealth-${size}`; cargo.item.label = `Встроенный трюм стелса ${size}`; cargo.item.size = z; setNum(cargo.item, "cargoM3", HULL.cargoM3[size]); scaleMass(cargo.item, k);
  const buf = clone(c, size === "S" ? "buffer-S" : size === "M" ? "buffer-M" : "buffer-L"); buf.id = `builtin-buffer-stealth-${size}`;
  { const ratio = HULL.bufferJ[size] / buf.numerics.capacityJ; setNum(buf, "capacityJ", HULL.bufferJ[size]); scaleMass(buf, ratio); } // ёмкость под окно сессии, масса ∝ ёмкости
  const ram = structuredClone(h.builtins.find((b) => b.item.family === "ram")!.item); ram.id = `builtin-ram-${size}`; ram.size = z; setNum(ram, "radarTransmission", 0.25); ram.materials[0].massKg = HULL.ramT[size] * 1000; ram.origins["materials.0.massKg"] = origin("kg");
  const shell = structuredClone(h.builtins.find((b) => b.item.family === "shell")!.item); shell.id = `builtin-shell-${size}`; shell.size = z; setNum(shell, "powerW", shell.numerics.powerW * k); scaleMass(shell, k);
  const rad = clone(c, size === "S" ? "radiator-active-S" : size === "M" ? "radiator-active-M" : "radiator-active-L"); rad.id = `builtin-radiator-aft-${size}`; rad.label = `Встроенный активный радиатор ${size}, назад`;
  for (const s of rad.surfaces) { s.irProfile = { version: "radiator-ir/1", kind: "aft-directed", aftFraction: 1 }; s.areaM2 = HULL.radiatorM2[size]; s.builtin = true; }
  setNum(rad, "auxW", HULL.radiatorAuxW[size]); scaleMass(rad, 0.5);
  h.builtins = [{ id: "builtin:cargo", item: cargo.item }, { id: "builtin:buffer", item: buf }, { id: "builtin:ram", item: ram }, { id: "builtin:shell", item: shell }, { id: "builtin:radiator-aft", item: rad }];
  reindex(h);
};

const inst = (slot: string, itemId: string) => ({ id: "fit:" + slot, itemId, enabled: true }) as ShipFitV3["instances"][string];
export const fit = (slots: Record<string, string>): Change => (_c, f) => {
  f.assignments = {}; f.instances = {};
  for (const [slot, item] of Object.entries(slots)) { f.assignments[slot] = "fit:" + slot; f.instances["fit:" + slot] = inst(slot, item); }
};
// Сборка по умолчанию: тихий водородный разведчик
export const defaultFit = (size: Size, quiet = true): Change => {
  const e = (form: string) => quiet ? `engine-hydrogen-stealth-${size}-${form}` : `engine-hydrogen-${size}-${form}`;
  const slots: Record<string, string> = { march: e("single"), retro: e("single"), strafe: e("pair"), turn: size === "S" ? "gyrodyne-S" : `gyrodyne-${size}`,
    "power-1": `generator-hydrogen-${size}`, "power-2": `battery-${size}`, "power-3": `tank-hydrogen-${size}`, "signature-1": size === "S" ? "sensor-S" : `sensor-${size}` };
  if (size !== "S") slots["power-4"] = `tank-hydrogen-${size}`;
  return fit(slots);
};
