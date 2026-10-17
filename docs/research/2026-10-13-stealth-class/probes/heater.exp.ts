// Опыт 6: нужна ли стелсу электропечь — холодные поля 50 K (h = 5/15/30), маскировка и обычный режим, с печью и без
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { run, OUT } from "./harness";
import { builtinAftRadiator, passiveArea, compose, type Change } from "./helpers";
import type { ShipFitV3 } from "../../../../src/model/v3/types";

const inst = (slot: string, itemId: string) => ({ id: "fit:" + slot, itemId, enabled: true }) as ShipFitV3["instances"][string];
const h2Scout: Change = (_c, f, h) => {
  h.materials[0].massKg = 40000;
  const slots: Record<string, string> = { march: "engine-hydrogen-S-single", retro: "engine-hydrogen-S-single", strafe: "engine-hydrogen-S-pair", turn: "gyrodyne-S", "power-1": "generator-hydrogen-S", "power-2": "battery-S", "power-3": "tank-hydrogen-S", "signature-1": "sensor-S" };
  f.assignments = {}; f.instances = {};
  for (const [slot, item] of Object.entries(slots)) { f.assignments[slot] = "fit:" + slot; f.instances["fit:" + slot] = inst(slot, item); }
};
const noHeater: Change = (_c, _f, h) => {
  const i = h.builtins.findIndex((b) => b.item.family === "electric-heater");
  h.builtins.splice(i, 1);
  for (const k of Object.keys(h.origins)) if (k.startsWith("builtins.")) delete h.origins[k];
  h.builtins.forEach((b, index) => { for (const [path, value] of Object.entries(b.item.origins)) h.origins["builtins." + index + ".item." + path] = structuredClone(value); });
};
const field = (h: number) => ({ radiativeBackgroundK: 50, backgroundSourceId: "cold-bg", thermalField: { sourceId: "cold-field", temperatureK: 50, coefficientWPerM2K: h }, solarFluxWm2: 0, solarSourceId: null, energyInputs: [], directHeat: [] });

test("heater", () => {
  mkdirSync(OUT, { recursive: true });
  const H = 3600, lines: string[] = ["config | field h | mode | T start→min→end K | buffer GJ end | charge % end | H2 kg end | first constraint"];
  const base = compose(h2Scout, passiveArea(120), builtinAftRadiator(0.5));
  for (const [cname, change] of [["with-heater", base], ["no-heater", compose(base, noHeater)]] as [string, Change][]) {
    for (const h of [5, 15, 30]) for (const mode of ["Masking", "Efficient"] as const) {
      const r = run(`heat-${cname}-h${h}-${mode}`, "stealth-reference", { durationSeconds: 3 * H, temperatureK: 300, mode, action: "idle", environment: field(h) as never }, { sampleEvery: 300, change });
      const s = r.samples, last = s[s.length - 1], minT = Math.min(...s.map((x) => x.T));
      lines.push(`${cname} | ${h} | ${mode} | 300→${minT.toFixed(1)}→${last.T.toFixed(1)} | ${(last.bufferJ / 1e9).toFixed(2)} | ${(last.chargeJ / r.batteryJ * 100).toFixed(0)} | ${last.h2Kg.toFixed(0)} | ${r.firstConstraint ?? "—"}`);
      writeFileSync(`${OUT}/heater.txt`, lines.join("\n"));
    }
  }
});
