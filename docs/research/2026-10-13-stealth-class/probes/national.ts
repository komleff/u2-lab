// Именные стелс-корпуса трёх школ: национальный сдвиг только по разрешённым осям канона U2
import type { ModuleItemV3 } from "../../../../src/model/v3/types";
import type { Change } from "./helpers";
import type { Size } from "./stealthclass";

export type Nation = "EN" | "RU" | "CN";
export const NAMES: Record<Nation, Record<Size, string>> = {
  EN: { S: "Sinclair Pixel", M: "Sinclair Cipher", L: "Sinclair Veil" },
  RU: { S: "Тензор Компас", M: "Тензор Вектор", L: "Тензор Мираж" },
  CN: { S: "Guanzhao Cangji", M: "Guanzhao Yinxing", L: "Guanzhao Lixiang" },
};
export const DEPTH: Record<Size, number> = { S: 0.35, M: 0.55, L: 0.75 };    // канон-кандидат D_nat (national_depth_factors.csv)
// Профиль тяги класса «Стелс» относительно гражданского (канон EL:183): вперёд, назад, вбок
export const CLASS_PROFILE = { march: 0.85, retro: 0.35, strafe: 0.5 };
// Национальная раскладка относительно китайской на M (TTX:242–248), приводится к глубине размера
const LAYOUT_M: Record<Nation, { march: number; retro: number; strafe: number }> = {
  RU: { march: 0.85, retro: 1.10, strafe: 1.22 }, CN: { march: 1, retro: 1, strafe: 1 }, EN: { march: 1.15, retro: 0.90, strafe: 0.78 },
};
export const LOSS_SHIFT = 0.2;   // кандидат A: потери КПД ×(1 ∓ A·D); знак: RU −, EN +
export const MASS_SHIFT: Record<Nation, (d: number) => number> = { RU: () => 1.08, CN: () => 1, EN: (d) => 1 - 0.1 * d }; // RU: корпус +4 % по габариту (ND:272); EN: самая лёгкая конструкция
export const AREA_SHIFT: Record<Nation, number> = { RU: 1.08, CN: 1, EN: 1 };

const sign: Record<Nation, number> = { RU: -1, CN: 0, EN: 1 };
const origin = (unit: string) => ({ kind: "experimental" as const, unit, sourceRef: "scratchpad national stealth proposal 2026-10-13", note: "Кандидат ГД, не канон" });
const setNum = (it: ModuleItemV3, k: string, v: number) => { it.numerics[k] = v; it.origins["numerics." + k] = origin("SI"); };
const layout = (n: Nation, s: Size, axis: "march" | "retro" | "strafe") => 1 + (LAYOUT_M[n][axis] - 1) * DEPTH[s] / DEPTH.M;

// Применяется после stealthHull(size) и defaultFit(size): переписывает установленные двигатели, генератор и корпус
export const nationalize = (n: Nation, size: Size): Change => (c, f, h) => {
  const d = DEPTH[size], loss = (eta: number) => 1 - (1 - eta) * (1 + sign[n] * LOSS_SHIFT * d);
  h.label = `${NAMES[n][size]} · кандидат ГД`;
  h.materials[0].massKg *= MASS_SHIFT[n](d); h.origins["materials.0.massKg"] = origin("kg");
  h.bodyExchangeAreaM2 *= AREA_SHIFT[n];
  for (const slot of ["march", "retro", "strafe"] as const) {
    const id = f.instances["fit:" + slot].itemId, base = c.items[id];
    const it = structuredClone(base) as ModuleItemV3; it.id = `${id}-${n}-${slot}`; it.label = `${base.label} · ${n} · ${slot}`;
    const k = CLASS_PROFILE[slot] / 0.8 * layout(n, size, slot); // 0,8 — тихий двигатель уже ослаблен в stealthclass
    const eta = loss(base.numerics.efficiency);
    setNum(it, "forceN", base.numerics.forceN * k);
    setNum(it, "efficiency", eta);
    it.materials.forEach((m, i) => { m.massKg *= k * (eta / base.numerics.efficiency); it.origins["materials." + i + ".massKg"] = origin("kg"); }); // m ∝ F·η/η_ref (TTX:231)
    c.items[it.id] = it; f.instances["fit:" + slot].itemId = it.id;
  }
  const gid = f.instances["fit:power-1"].itemId, g = structuredClone(c.items[gid]) as ModuleItemV3;
  g.id = `${gid}-${n}`; setNum(g, "efficiency", loss(g.numerics.efficiency)); c.items[g.id] = g; f.instances["fit:power-1"].itemId = g.id;
};
