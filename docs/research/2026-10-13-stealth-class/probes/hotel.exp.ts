// Опыт 13: национальный КПД потребителя распространяется на собственные системы корабля (ND:368 «КПД источника и потребителя»)
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { OUT } from "./harness";
import { compose, type Change } from "./helpers";
import { stealthHull, fit, type Size } from "./stealthclass";
import { nationalize, NAMES, DEPTH, LOSS_SHIFT, type Nation } from "./national";
import { measure } from "./session";

const sz = (s: Size, x: string) => `${x}-${s}`;
const uniform = (size: Size) => {
  const slots: Record<string, string> = {
    march: `engine-hydrogen-stealth-${size}-single`, retro: `engine-hydrogen-stealth-${size}-single`, strafe: `engine-hydrogen-stealth-${size}-pair`, turn: sz(size, "gyrodyne"),
    "power-1": sz(size, "generator-hydrogen"), "power-2": sz(size, "battery"), "power-3": sz(size, "tank-hydrogen"),
    "signature-1": sz(size, "sensor"), "signature-2": sz(size, "shielding"),
  };
  if (size !== "S") slots["power-4"] = sz(size, "tank-hydrogen");
  if (size === "L") slots["power-5"] = sz(size, "tank-hydrogen");
  return fit(slots);
};
const sign: Record<Nation, number> = { RU: -1, CN: 0, EN: 1 };
// Та же услуга собственных систем при национальном КПД: потребление ×(1 + знак·A·D)
const hotel = (n: Nation, size: Size): Change => (_c, _f, h) => { h.hullPowerW *= 1 + sign[n] * LOSS_SHIFT * DEPTH[size]; };

test("hotel efficiency", () => {
  mkdirSync(OUT, { recursive: true });
  const all: Record<string, unknown> = {};
  for (const size of ["S", "M", "L"] as Size[]) for (const n of ["EN", "RU", "CN"] as Nation[]) {
    all[`${n}-${size}`] = { name: NAMES[n][size], role: "единая сборка, КПД нужд", ...measure(`HT-${n}-${size}`, size, compose(stealthHull(size), uniform(size), nationalize(n, size), hotel(n, size))) };
    writeFileSync(`${OUT}/hotel.json`, JSON.stringify(all, null, 1));
  }
});
