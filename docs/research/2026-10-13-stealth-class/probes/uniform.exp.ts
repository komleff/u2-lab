// Опыт 12: девять именных корпусов на ОДИНАКОВЫХ сборках — изолировать национальные различия
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { OUT } from "./harness";
import { compose } from "./helpers";
import { stealthHull, fit, type Size } from "./stealthclass";
import { nationalize, NAMES, type Nation } from "./national";
import { measure } from "./session";

const sz = (s: Size, x: string) => `${x}-${s}`;
// Единая сборка: тихие H2-двигатели, гиродины, H2-генератор, аккумулятор, баки, сенсор + EM-экран, без груза
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

test("uniform fits", () => {
  mkdirSync(OUT, { recursive: true });
  const all: Record<string, unknown> = {};
  for (const size of ["S", "M", "L"] as Size[]) for (const n of ["EN", "RU", "CN"] as Nation[]) {
    all[`${n}-${size}`] = { name: NAMES[n][size], role: "единая сборка", ...measure(`U-${n}-${size}`, size, compose(stealthHull(size), uniform(size), nationalize(n, size))) };
    writeFileSync(`${OUT}/uniform.json`, JSON.stringify(all, null, 1));
  }
});
