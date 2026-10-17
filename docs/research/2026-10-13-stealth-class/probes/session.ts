// Замеры стелс-сборки в масштабе игровой сессии (15–60 мин): окна маскировки, дальности, расход
import { run, ranges } from "./harness";
import type { Change } from "./helpers";
import type { Size } from "./stealthclass";

export const VFA: Record<Size, number> = { S: 250, M: 225, L: 200 }; // гражданские S/M/L, каталог 0.2.4
const km = (w: number, ch: "irKm" | "emKm") => { const r = ranges(ch === "irKm" ? w : 0, ch === "emKm" ? w : 0); return { S: r["S-dedicated-G1"][ch], M: r["M-dedicated-G1"][ch] }; };
const fullAt = (r: ReturnType<typeof run>) => r.samples.find((x) => x.bufferJ >= r.bufferCapJ * 0.999)?.t ?? null;

export function measure(id: string, size: Size, change: Change, retroN?: number) {
  const H = 3600;
  const idle = run(`${id}-mask-idle`, "stealth-reference", { durationSeconds: 2 * H, temperatureK: 300, mode: "Masking", action: "idle" }, { sampleEvery: 10, change });
  const a = idle.marchN / idle.massKg;
  const retro = retroN ?? idle.retroN, b = retro / idle.massKg;
  const tAcc = Math.max(1, Math.round(VFA[size] / a)), tBrk = Math.max(1, Math.round(VFA[size] / b)), coast = 120, cycle = tAcc + tBrk + 2 * coast;
  const pulses = (aspect: number, dur: number) => run(`${id}-pulses-${aspect}`, "stealth-reference", { durationSeconds: dur, temperatureK: 300, mode: "Masking", repeat: true,
    observer: { presetId: "S-dedicated-G1", rangeM: 16000, aspectDeg: aspect },
    phases: [
      { id: "accel", action: "maneuver", mode: "Masking", durationSeconds: tAcc, requests: { "fit:march": 1 }, environment: null },
      { id: "coast1", action: "idle", mode: "Masking", durationSeconds: coast, requests: {}, environment: null },
      { id: "brake", action: "maneuver", mode: "Masking", durationSeconds: tBrk, requests: { "fit:retro": 1 }, environment: null },
      { id: "coast2", action: "idle", mode: "Masking", durationSeconds: coast, requests: {}, environment: null },
    ] }, { sampleEvery: 1, change });
  const nose = pulses(0, 2 * H), tail = pulses(180, cycle);
  const eff = run(`${id}-eff`, "stealth-reference", { durationSeconds: 1800, temperatureK: 300, mode: "Efficient", action: "idle" }, { sampleEvery: 60, change });
  const tIdle = fullAt(idle), tAct = fullAt(nose);
  const win = nose.samples.filter((x) => tAct === null || x.t <= tAct);
  const inBurn = (t: number) => { const p = t % cycle; return (p > 0 && p <= tAcc) || (p > tAcc + coast && p <= tAcc + coast + tBrk); };
  const burnIr = Math.max(...win.filter((x) => inBurn(x.t)).map((x) => x.irW)), burnEm = Math.max(...win.filter((x) => inBurn(x.t)).map((x) => x.emW));
  const idleIr = idle.samples.find((x) => x.t >= 600)!.irW, idleEm = idle.samples.find((x) => x.t >= 600)!.emW;
  const eff30 = eff.samples[eff.samples.length - 1];
  const h2PerCycle = (win[0].h2Kg - win[win.length - 1].h2Kg) / Math.max(1, win[win.length - 1].t / cycle);
  return {
    massT: idle.massKg / 1000, accel: a, brake: b, tAcc, tBrk, cycle,
    idleWindowMin: tIdle === null ? null : tIdle / 60, activeWindowMin: tAct === null ? null : tAct / 60, cycles: tAct === null ? null : tAct / cycle,
    maskIdle: { ir: km(idleIr, "irKm"), em: km(idleEm, "emKm") },
    burnNose: { ir: km(burnIr, "irKm"), em: km(burnEm, "emKm") }, burnTail: km(tail.maxIrW ?? 0, "irKm"),
    normal30: { T: eff30.T, ir: km(eff30.irW, "irKm"), em: km(eff30.emW, "emKm") },
    h2PerCycleKg: h2PerCycle, bufferGJ: idle.bufferCapJ / 1e9, cargoM3: idle.cargoM3 as number,
  };
}
