// Опыт 14: итоговые рекомендуемые сборки девяти именных корпусов — экран у всех, национальный КПД собственных систем
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { OUT } from "./harness";
import { compose, type Change } from "./helpers";
import { stealthHull, fit, type Size } from "./stealthclass";
import { nationalize, NAMES, DEPTH, LOSS_SHIFT, type Nation } from "./national";
import { measure } from "./session";

const sz = (s: Size, x: string) => `${x}-${s}`;
export const FINAL: Record<Nation, Record<Size, { role: string; payload: string[]; st: string[] }>> = {
  EN: { S: { role: "Курьер", payload: ["cargo-universal"], st: ["sensor", "shielding"] },
        M: { role: "Контрабандист и радиоразведчик", payload: ["cargo-universal"], st: ["sensor", "sensor", "shielding"] },
        L: { role: "Прорыватель блокады", payload: ["cargo-universal", "cargo-universal"], st: ["sensor", "shielding"] } },
  RU: { S: { role: "Наблюдатель", payload: [], st: ["sensor", "sensor", "shielding"] },
        M: { role: "Разведчик-прибор", payload: [], st: ["sensor", "sensor", "sensor", "shielding"] },
        L: { role: "Станция наблюдения", payload: [], st: ["sensor", "sensor", "sensor", "sensor", "shielding"] } },
  CN: { S: { role: "Следопыт", payload: [], st: ["sensor", "shielding"] },
        M: { role: "Универсал", payload: ["cargo-universal"], st: ["sensor", "shielding"] },
        L: { role: "Скрытый транспорт-разведчик", payload: ["cargo-universal"], st: ["sensor", "sensor", "shielding"] } },
};
const roleFit = (n: Nation, size: Size) => {
  const r = FINAL[n][size], slots: Record<string, string> = {
    march: `engine-hydrogen-stealth-${size}-single`, retro: `engine-hydrogen-stealth-${size}-single`, strafe: `engine-hydrogen-stealth-${size}-pair`, turn: sz(size, "gyrodyne"),
    "power-1": sz(size, "generator-hydrogen"), "power-2": sz(size, "battery"), "power-3": sz(size, "tank-hydrogen"),
  };
  if (size !== "S") slots["power-4"] = sz(size, "tank-hydrogen");
  if (size === "L") slots["power-5"] = sz(size, "tank-hydrogen");
  r.payload.forEach((x, i) => { slots[`payload-${i + 1}`] = sz(size, x); });
  r.st.forEach((x, i) => { slots[`signature-${i + 1}`] = sz(size, x); });
  return fit(slots);
};
const sign: Record<Nation, number> = { RU: -1, CN: 0, EN: 1 };
const hotel = (n: Nation, size: Size): Change => (_c, _f, h) => { h.hullPowerW *= 1 + sign[n] * LOSS_SHIFT * DEPTH[size]; };

test("final fits", () => {
  mkdirSync(OUT, { recursive: true });
  const all: Record<string, unknown> = {};
  for (const size of ["S", "M", "L"] as Size[]) for (const n of ["EN", "RU", "CN"] as Nation[]) {
    all[`${n}-${size}`] = { name: NAMES[n][size], role: FINAL[n][size].role, ...measure(`F-${n}-${size}`, size, compose(stealthHull(size), roleFit(n, size), nationalize(n, size), hotel(n, size))) };
    writeFileSync(`${OUT}/final.json`, JSON.stringify(all, null, 1));
  }
});
