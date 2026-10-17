import { it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { getPresetFit as getPreset, loadCandidateCatalog as loadCatalog } from "../../src/fitting/catalog";
const loadCandidateCatalog = () => loadCatalog("ship-fitting-0.2.0");
const getPresetFit = (id: string) => getPreset(id, "ship-fitting-0.2.0");
import {
  makeMiningRun,
  compareMiningConditions,
} from "../../src/scenarios/fitting";
import { createRun, runChunk, result } from "../../src/runner/run";
import type { RunSpecV2 } from "../../src/model/v2/types";
import { worstRun } from "./worst-fit";
const execute = (s: RunSpecV2) => {
  const r = createRun("matrix", s);
  while (!r.done) runChunk(r, 10000);
  return result(r);
};
const outcome = (r: ReturnType<typeof execute>) =>
  r.metrics.firstTargetSeconds === null
    ? "не завершена в горизонте"
    : r.metrics.firstLimiter
      ? "выполнена с ограничениями"
      : "выполнена";

function annotateSensitivity(base: RunSpecV2, s: RunSpecV2, id: string) {
  const walk = (before: unknown, after: unknown, path: string) => {
    if (typeof after === "number" && after !== before) {
      const origin = {
        kind: "experimental" as const,
        sourceRef: "lab:ship-fitting-sensitivity/" + id,
        note: "Явное крайнее условие чувствительности; не вероятность и не canonical override",
        unit: /cpJKgK$/.test(path)
          ? "J/(kg·K)"
          : /heatCapacityJK$/.test(path)
            ? "J/K"
            : /Kg$|fuelKg\./.test(path)
              ? "kg"
              : /densityKgM3$/.test(path)
                ? "kg/m³"
                : /K$/.test(path)
                  ? "K"
                  : /J$/.test(path)
                    ? "J"
                    : /cargoM3\./.test(path)
                      ? "m³"
                      : "1",
      };
      s.origins[path] = origin;
    } else if (after && typeof after === "object") {
      for (const [key, value] of Object.entries(after)) {
        if (key !== "origins" && key !== "origin")
          walk(
            (before as Record<string, unknown> | undefined)?.[key],
            value,
            path ? path + "." + key : key,
          );
      }
    }
  };
  walk(base, s, "");
  for (const [index, i] of s.resolvedShip.instances.entries()) {
    for (const [mIndex, m] of i.item.materials.entries()) {
      const original =
        base.resolvedShip.instances[index].item.materials[mIndex];
      if (original.cpJKgK !== m.cpJKgK || original.massKg !== m.massKg) {
        m.origin = {
          ...m.origin,
          kind: "experimental",
          sourceRef: "lab:ship-fitting-sensitivity/" + id,
        };
        for (const field of ["cpJKgK", "massKg"] as const)
          if (original[field] !== m[field])
            i.item.origins["materials." + mIndex + "." + field] = {
              ...m.origin,
              unit: field === "massKg" ? "kg" : "J/(kg·K)",
            };
      }
    }
  }
  for (const [index, m] of s.resolvedShip.materials.entries())
    if (
      m.cpJKgK !== base.resolvedShip.materials[index].cpJKgK ||
      m.massKg !== base.resolvedShip.materials[index].massKg
    )
      m.origin = {
        ...m.origin,
        kind: "experimental",
        sourceRef: "lab:ship-fitting-sensitivity/" + id,
      };
  for (const [index, m] of s.resolvedShip.hull.materials.entries())
    if (
      m.cpJKgK !== base.resolvedShip.hull.materials[index].cpJKgK ||
      m.massKg !== base.resolvedShip.hull.materials[index].massKg
    )
      m.origin = {
        ...m.origin,
        kind: "experimental",
        sourceRef: "lab:ship-fitting-sensitivity/" + id,
      };
}
it("controlled Pony and IndustrialM1/2/3 plus L3hold record failed/incomplete outcomes and declared conditions", () => {
  const catalog = loadCandidateCatalog(),
    series: any[] = [];
  for (const hull of ["pony", "industrial-M"]) {
    let first: RunSpecV2 | undefined;
    for (const count of [1, 2, 3]) {
      const v = makeMiningRun(getPresetFit(hull + ":" + count), catalog, {
        durationSeconds: 600,
        targetM3: 1000,
        stepSeconds: 0.01,
      });
      if (!v.ok) throw Error("not ready");
      if (first)
        expect(compareMiningConditions(first, v.value).comparable).toBe(true);
      else first = v.value;
      const r = execute(v.value);
      expect(r.metrics.kUseHorizon).toBeGreaterThanOrEqual(0);
      expect(r.metrics.kUseHorizon).toBeLessThanOrEqual(1);
      expect(Number.isFinite(r.metrics.scuPerHour!)).toBe(true);
      series.push({
        id: hull + ":" + count,
        spec: r.spec,
        metrics: r.metrics,
        state: r.state,
        events: r.events,
        retention: r.retention,
        status: outcome(r),
      });
    }
  }
  const l = makeMiningRun(getPresetFit("industrial-L:3"), catalog, {
    durationSeconds: 600,
    targetM3: 1000,
  });
  if (!l.ok) throw Error("L");
  expect(l.value.resolvedShip.cargoCapacityM3.bulk).toBe(192);
  const lResult = execute(l.value);
  series.push({
    id: "industrial-L:3+hold",
    spec: l.value,
    metrics: lResult.metrics,
    state: lResult.state,
    events: lResult.events,
    retention: lResult.retention,
    status: outcome(lResult),
  });
  if (process.env.U2_FITTING_MATRIX_PATH)
    writeFileSync(
      process.env.U2_FITTING_MATRIX_PATH,
      JSON.stringify(
        {
          model: "ship-fitting-ledger-0.2",
          source: "cdc490e3517c8455f662f82579c45813cdbb9a76",
          note: "Детерминированный lab experiment; не рейтинг/production proof",
          series,
        },
        null,
        2,
      ) + "\n",
    );
});
it("hot background, cargo-first, zero resources and sensitivity endpoints expose actual limiting channels", () => {
  const base = worstRun(60, 0.01),
    cases: any[] = [];
  const configs: [string, (s: RunSpecV2) => void][] = [
    ["hot-background", (s) => (s.environment.effectiveBackgroundK = 600)],
    ["h2-depletion", (s) => (s.initial.fuelKg.hydrogen = 0.01)],
    ["cargo-first", (s) => (s.initial.cargoM3.ore = 383.99)],
    [
      "three-laser-9MW-vs8MW",
      (s) => {
        s.initial.chargeJ = 0;
        const gen = s.resolvedShip.instances.find(
          (i) => i.item.species === "hydrogen" && i.item.family === "generator",
        )!;
        gen.enabled = false;
        s.resolvedShip.resources.hydrogen.consumerIds =
          s.resolvedShip.resources.hydrogen.consumerIds.filter(
            (id) => id !== gen.id,
          );
      },
    ],
    [
      "zero-stock",
      (s) => {
        s.initial.chargeJ = 0;
        s.initial.fuelKg.diesel = 0;
        s.initial.fuelKg.hydrogen = 0;
      },
    ],
    [
      "cp-low",
      (s) => {
        for (const m of s.resolvedShip.materials) m.cpJKgK = 350;
        for (const m of s.resolvedShip.hull.materials) m.cpJKgK = 350;
        for (const i of s.resolvedShip.instances)
          for (const m of i.item.materials) m.cpJKgK = 350;
        s.resolvedShip.heatCapacityJK = s.resolvedShip.materials.reduce(
          (n, m) => n + m.massKg * m.cpJKgK,
          0,
        );
      },
    ],
    [
      "cp-high",
      (s) => {
        for (const m of s.resolvedShip.materials) m.cpJKgK = 900;
        for (const m of s.resolvedShip.hull.materials) m.cpJKgK = 900;
        for (const i of s.resolvedShip.instances)
          for (const m of i.item.materials) m.cpJKgK = 900;
        s.resolvedShip.heatCapacityJK = s.resolvedShip.materials.reduce(
          (n, m) => n + m.massKg * m.cpJKgK,
          0,
        );
      },
    ],
    [
      "shell-mass-low",
      (s) => {
        const delta = s.resolvedShip.hull.materials[0].massKg * -0.25;
        s.resolvedShip.hull.materials[0].massKg += delta;
        s.resolvedShip.materials[0].massKg += delta;
        s.resolvedShip.dryMassKg += delta;
        s.resolvedShip.heatCapacityJK +=
          delta * s.resolvedShip.materials[0].cpJKgK;
      },
    ],
    [
      "shell-mass-high",
      (s) => {
        const delta = s.resolvedShip.hull.materials[0].massKg * 0.25;
        s.resolvedShip.hull.materials[0].massKg += delta;
        s.resolvedShip.materials[0].massKg += delta;
        s.resolvedShip.dryMassKg += delta;
        s.resolvedShip.heatCapacityJK +=
          delta * s.resolvedShip.materials[0].cpJKgK;
      },
    ],
    ["ore-density-low", (s) => (s.process.densityKgM3 = 1000)],
    ["ore-density-high", (s) => (s.process.densityKgM3 = 3000)],
    ["return-heat-low", (s) => (s.process.returnFraction = 0.3)],
    ["return-heat-high", (s) => (s.process.returnFraction = 0.4)],
  ];
  for (const [id, mutate] of configs) {
    const s = structuredClone(base);
    mutate(s);
    annotateSensitivity(base, s, id);
    const r = execute(s);
    expect(Math.abs(r.metrics.energyResidualJ), id).toBeLessThan(
      Math.max(1, 1e-6 * r.metrics.sourceEnergyJ),
    );
    if (id === "zero-stock") expect(r.metrics.usefulWork).toBe(0);
    if (id === "cargo-first")
      expect(r.metrics.firstLimiter?.causes).toContain("cargo");
    cases.push({
      id,
      spec: s,
      metrics: r.metrics,
      state: r.state,
      events: r.events,
      retention: r.retention,
      status: outcome(r),
    });
  }
  if (process.env.U2_FITTING_SENSITIVITY_PATH)
    writeFileSync(
      process.env.U2_FITTING_SENSITIVITY_PATH,
      JSON.stringify(
        {
          model: "ship-fitting-ledger-0.2",
          source: "cdc490e3517c8455f662f82579c45813cdbb9a76",
          note: "Endpoints — чувствительность, не вероятность. Все изменённые параметры experimental.",
          cases,
        },
        null,
        2,
      ) + "\n",
    );
});
