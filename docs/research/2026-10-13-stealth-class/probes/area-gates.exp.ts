// Опыт 15: пассивная площадь стелса S (120/170/230 м²) и температурные пороги в масштабе сессии (≤60 мин)
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { run, OUT, ranges } from "./harness";
import { compose, type Change } from "./helpers";
import { stealthHull, fit } from "./stealthclass";
import { nationalize } from "./national";
import { VFA } from "./session";

const base: Change = compose(stealthHull("S"), fit({
  march: "engine-hydrogen-stealth-S-single", retro: "engine-hydrogen-stealth-S-single", strafe: "engine-hydrogen-stealth-S-pair", turn: "gyrodyne-S",
  "power-1": "generator-hydrogen-S", "power-2": "battery-S", "power-3": "tank-hydrogen-S", "signature-1": "sensor-S", "signature-2": "shielding-S",
}), nationalize("CN", "S"));
const area = (a: number): Change => (_c, _f, h) => { h.bodyExchangeAreaM2 = a; };
const cold = { radiativeBackgroundK: 50, backgroundSourceId: "cold-bg", thermalField: { sourceId: "cold-field", temperatureK: 50, coefficientWPerM2K: 30 }, solarFluxWm2: 0, solarSourceId: null, energyInputs: [], directHeat: [] };
const km = (w: number, ch: "irKm" | "emKm") => { const r = ranges(ch === "irKm" ? w : 0, ch === "emKm" ? w : 0); return `${r["S-dedicated-G1"][ch].toFixed(1)}/${r["M-dedicated-G1"][ch].toFixed(1)}`; };
const at = (r: ReturnType<typeof run>, t: number) => r.samples.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
const fullAt = (r: ReturnType<typeof run>) => r.samples.find((x) => x.bufferJ >= r.bufferCapJ * 0.999)?.t ?? null;

test("area and gates", () => {
  mkdirSync(OUT, { recursive: true });
  const H = 3600, rows = ["площадь S м² | маскировка покой: IR/EM на 10 мин (S/M) | окно покоя мин | T на 60 мин | манёвры: окно мин, T на 60 мин, IR нос на 60 мин | обычный: T 30/60 мин, IR на 30 мин | ледяное ядро h=30, маскировка: T на 30/60 мин"];
  for (const a of [120, 170, 230]) {
    const ch = compose(base, area(a));
    const idle = run(`AG-${a}-idle`, "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Masking", action: "idle" }, { sampleEvery: 10, change: ch });
    const acc = Math.round(VFA.S / (idle.marchN / idle.massKg)), brk = Math.round(VFA.S / (idle.retroN / idle.massKg));
    const pulses = run(`AG-${a}-pulses`, "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Masking", repeat: true, phases: [
      { id: "accel", action: "maneuver", mode: "Masking", durationSeconds: acc, requests: { "fit:march": 1 }, environment: null },
      { id: "coast1", action: "idle", mode: "Masking", durationSeconds: 120, requests: {}, environment: null },
      { id: "brake", action: "maneuver", mode: "Masking", durationSeconds: brk, requests: { "fit:retro": 1 }, environment: null },
      { id: "coast2", action: "idle", mode: "Masking", durationSeconds: 120, requests: {}, environment: null }] }, { sampleEvery: 10, change: ch });
    const eff = run(`AG-${a}-eff`, "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Efficient", action: "idle" }, { sampleEvery: 10, change: ch });
    const ice = run(`AG-${a}-ice`, "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Masking", action: "idle", environment: cold as never }, { sampleEvery: 10, change: ch });
    const i10 = at(idle, 600), p60 = at(pulses, H), e30 = at(eff, 1800);
    rows.push(`${a} | ${km(i10.irW, "irKm")} / ${km(i10.emW, "emKm")} | ${((fullAt(idle) ?? H) / 60).toFixed(0)} | ${at(idle, H).T.toFixed(0)} | ${((fullAt(pulses) ?? H) / 60).toFixed(0)}, ${p60.T.toFixed(0)}, ${km(p60.irW, "irKm")} | ${e30.T.toFixed(0)}/${at(eff, H).T.toFixed(0)}, ${km(e30.irW, "irKm")} | ${at(ice, 1800).T.toFixed(0)}/${at(ice, H).T.toFixed(0)}`);
    writeFileSync(`${OUT}/area-gates.txt`, rows.join("\n"));
  }
});
