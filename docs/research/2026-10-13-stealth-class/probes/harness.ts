// Общая обвязка опытов: прогон пресета на движке v3 и съём рядов
import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCandidateCatalog, getPresetFit } from "../../../../src/fitting/catalog";
import { makeShipModelMiningRun, type ShipModelConditions } from "../../../../src/scenarios/fitting";
import { createShipModelRun, runShipModelChunk } from "../../../../src/runner/ship-model-run";
import { observerPreset, OBSERVER_PRESET_IDS } from "../../../../src/signatures/presets";
import type { CandidateCatalogV3, ShipFitV3, HullV3 } from "../../../../src/model/v3/types";

// Сводки опытов — в results/ исследования; сырые ряды прогонов — во временный каталог
export const OUT = "docs/research/2026-10-13-stealth-class/results";
export const RAW = join(tmpdir(), "u2-lab-stealth-class");
mkdirSync(RAW, { recursive: true });
export const catalog = () => structuredClone(loadCandidateCatalog("ship-fitting-0.3.1"));

// Дистанция обнаружения, м: R = sqrt(P / (4π·порог))
export function ranges(irW: number, emW: number) {
  const r: Record<string, { irKm: number; emKm: number }> = {};
  for (const id of OBSERVER_PRESET_IDS) {
    const p = observerPreset(id);
    r[id] = { irKm: Math.sqrt(Math.max(0, irW) / (4 * Math.PI * p.ir.detectWm2)) / 1000, emKm: Math.sqrt(Math.max(0, emW) / (4 * Math.PI * p.em.detectWm2)) / 1000 };
  }
  return r;
}

export type Sample = { t: number; T: number; bufferJ: number; chargeJ: number; dieselKg: number; h2Kg: number; irW: number; emW: number; paths: Record<string, number> };

export function run(id: string, preset: string, cond: ShipModelConditions, opts: { sampleEvery?: number; change?: (c: CandidateCatalogV3, f: ShipFitV3, h: HullV3) => void } = {}) {
  const c = catalog(), f = getPresetFit(preset, c.version) as ShipFitV3, h = c.hulls.find((x) => x.id === f.hullId)!;
  opts.change?.(c, f, h);
  const spec = makeShipModelMiningRun(f, c, cond);
  if (!spec.ok) throw Error(id + ": " + spec.errors.map((e) => e.path + " " + e.message).join("; "));
  const ctx = createShipModelRun(id, spec.value);
  const every = opts.sampleEvery ?? 60, samples: Sample[] = [];
  const take = () => {
    const s = ctx.state, sig = ctx.signatures.last;
    const paths: Record<string, number> = {};
    for (const p of sig?.paths ?? []) paths[p.kind] = (paths[p.kind] ?? 0) + p.projectedContrastW;
    samples.push({ t: s.timeSeconds, T: s.temperatureK, bufferJ: Object.values(s.buffers).reduce((n, b) => n + b.storedJ, 0), chargeJ: s.chargeJ, dieselKg: s.fuelKg.diesel, h2Kg: s.fuelKg.hydrogen, irW: sig?.receiverIrW ?? 0, emW: sig?.observedEmW ?? 0, paths });
  };
  while (!ctx.done) { runShipModelChunk(ctx, every); take(); }
  const stats = ctx.signatures.version === "ship-signatures/2" ? ctx.signatures.statistics : null;
  const result = {
    id, preset, durationSeconds: spec.value.durationSeconds,
    hull: { id: h.id, massKg: h.materials.reduce((n, m) => n + m.massKg, 0), bodyAreaM2: h.bodyExchangeAreaM2 },
    massKg: spec.value.resolvedShip.dryMassKg + Object.values(spec.value.initialState.fuelKg).reduce((n, x) => n + x, 0),
    marchN: spec.value.resolvedShip.instances.filter((i) => i.role === "march").reduce((n, i) => n + (i.item.numerics.forceN ?? 0), 0),
    retroN: spec.value.resolvedShip.instances.filter((i) => i.role === "retro").reduce((n, i) => n + (i.item.numerics.forceN ?? 0), 0),
    cargoM3: spec.value.resolvedShip.cargoCapacityM3,
    batteryJ: spec.value.resolvedShip.batteryCapacityJ, bufferCapJ: Object.values(spec.value.resolvedShip.bufferCapacityJ).reduce((n, x) => n + x, 0),
    firstConstraint: ctx.metrics.firstConstraint, maxT: ctx.metrics.maximumTemperatureK,
    meanIrW: stats?.receiverIrW.meanW ?? null, maxIrW: stats?.receiverIrW.maxW ?? null, meanEmW: stats?.observedEmW.meanW ?? null, maxEmW: stats?.observedEmW.maxW ?? null,
    meanRanges: ranges(stats?.receiverIrW.meanW ?? 0, stats?.observedEmW.meanW ?? 0),
    events: ctx.events.items().slice(0, 40).map((e) => `${e.timeSeconds}s ${e.kind} ${e.message}`),
    samples,
  };
  writeFileSync(`${RAW}/${id}.json`, JSON.stringify(result, null, 1));
  return result;
}

export function brief(r: ReturnType<typeof run>) {
  const s = r.samples, last = s[s.length - 1];
  const pick = (t: number) => s.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
  const marks = [600, 3600, 3 * 3600, r.durationSeconds].filter((t) => t <= r.durationSeconds).map((t) => { const x = pick(t); return `${(x.t / 3600).toFixed(2)}h T=${x.T.toFixed(1)}K buf=${(x.bufferJ / 1e9).toFixed(2)}GJ chg=${(x.chargeJ / r.batteryJ * 100).toFixed(0)}% IR=${(x.irW / 1e3).toFixed(1)}kW EM=${x.emW.toFixed(1)}W`; });
  const mr = r.meanRanges;
  return `${r.id}: maxT=${r.maxT.toFixed(1)}K first=${r.firstConstraint ?? "—"}\n  ${marks.join("\n  ")}\n  meanIR=${((r.meanIrW ?? 0) / 1e3).toFixed(1)}kW meanEM=${(r.meanEmW ?? 0).toFixed(1)}W  ranges IR/EM km: ` +
    Object.entries(mr).map(([k, v]) => `${k} ${v.irKm.toFixed(1)}/${v.emKm.toFixed(1)}`).join(" | ") + `\n  last paths: ${JSON.stringify(Object.fromEntries(Object.entries(last.paths).map(([k, v]) => [k, Math.round(v)])))}`;
}
