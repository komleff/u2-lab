import type { RunSpec, Gate } from "../model/types";
import { capacity } from "../model/types";
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: { path: string; code: string; message: string }[] };
export function validateRunSpec(input: unknown): ValidationResult<RunSpec> {
  const errors: { path: string; code: string; message: string }[] = [];
  const bad = (path: string, message: string) =>
    errors.push({ path, code: "INVALID", message });
  const p = input as RunSpec;
  if (!p || typeof p !== "object")
    return {
      ok: false,
      errors: [{ path: "$", code: "INVALID", message: "Нужен объект опыта" }],
    };
  if (p.units !== "SI") bad("units", "Поддерживаются только SI units");
  if (p.modelVersion !== "radiative-host-ledger-0.1")
    bad("modelVersion", "Неподдерживаемая версия модели");
  if (p.schemaVersion !== "u2-lab/1")
    bad("schemaVersion", "Неподдерживаемая версия");
  if (!p.modelVersion || !p.catalogVersion)
    bad("modelVersion", "Версии обязательны");
  if (p.approvedBaseline !== false)
    bad(
      "approvedBaseline",
      "Этот каталог содержит экспериментальные конфигурации",
    );
  const walk = (v: any, path: string) => {
    if (typeof v === "number") {
      if (!Number.isFinite(v) || v < 0)
        bad(path, "Требуется конечное неотрицательное SI число");
      if (
        !p.origins?.[path]?.sourceRef ||
        !["canonical", "derived", "experimental"].includes(
          p.origins?.[path]?.kind,
        )
      )
        bad(path, "Отсутствует provenance параметра");
    } else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v))
        if (k !== "origins") walk(x, path ? `${path}.${k}` : k);
  };
  walk(p, "");
  try {
    for (const key of ["stepSeconds", "durationSeconds"] as const)
      if (
        typeof p[key] !== "number" ||
        !Number.isFinite(p[key]) ||
        !(p[key] > 0)
      )
        bad(key, "Должно быть >0 s");
    const requiredNumber = (v: unknown, path: string) => {
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
        bad(path, "Обязательно конечное неотрицательное SI число");
    };
    const requiredGate = (value: unknown, path: string) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        bad(path, "Требуется объект thermal gate");
        return;
      }
      const g = value as Gate;
      for (const k of ["low", "high", "workHigh", "restartLow", "restartHigh"] as const)
        requiredNumber(g[k], `${path}.${k}`);
      if (g.workLow !== undefined)
        requiredNumber(g.workLow, `${path}.workLow`);
      if (
        !(
          g.low < g.restartLow &&
          g.restartLow < g.restartHigh &&
          g.restartHigh < g.high &&
          g.workHigh < g.high
        )
      )
        bad(path, "Неверный hysteresis corridor");
    };
    const s = p.ship;
    for (const k of [
      "heatCapacityJK",
      "dryMassKg",
      "hullPowerW",
      "hullRadiationM2",
      "cargoCapacity",
      "chargeEfficiency",
      "dischargeEfficiency",
    ] as const)
      requiredNumber(s[k], `ship.${k}`);
    for (const k of ["chargeJ", "temperatureK"] as const)
      requiredNumber(p.initial[k], `initial.${k}`);
    for (const [i, a] of s.accumulators.entries())
      requiredNumber(a.capacityJ, `ship.accumulators.${i}.capacityJ`);
    for (const k of [
      "effectiveBackgroundK",
      "solarFluxWm2",
      "linearWK",
    ] as const)
      requiredNumber(p.environment[k], `environment.${k}`);
    let bill = 0,
      mass = 0;
    const materialIds = new Set<string>();
    for (const [i, m] of s.thermalMaterials.entries()) {
      if (materialIds.has(m.id) || m.contents !== "dry")
        bad(
          `ship.thermalMaterials.${i}`,
          "Повтор материала или contents credit",
        );
      materialIds.add(m.id);
      requiredNumber(m.massKg, `ship.thermalMaterials.${i}.massKg`);
      requiredNumber(m.cpJKgK, `ship.thermalMaterials.${i}.cpJKgK`);
      bill += m.massKg * m.cpJKgK;
      mass += m.massKg;
    }
    if (!Number.isFinite(bill) || Math.abs(bill - s.heatCapacityJK) > 1e-8 * Math.max(1, bill))
      bad("ship.heatCapacityJK", "Не совпадает с dry mass × cp bill");
    if (!Number.isFinite(mass) || Math.abs(mass - s.dryMassKg) > 1e-8 * Math.max(1, mass))
      bad("ship.dryMassKg", "Не совпадает с dry material bill");
    if (!(s.heatCapacityJK > 0))
      bad("ship.heatCapacityJK", "Должно быть >0 J/K");
    if (!(capacity(s) > 0) || !Number.isFinite(capacity(s)))
      bad("ship.accumulators", "Суммарная ёмкость должна быть >0 J");
    for (const key of ["chargeEfficiency", "dischargeEfficiency"] as const)
      if (!(s[key] > 0 && s[key] <= 1)) bad(`ship.${key}`, "КПД (0,1]");
    if (!(p.initial.chargeJ >= 0 && p.initial.chargeJ <= capacity(s)))
      bad("initial.chargeJ", "Запас вне ёмкости");
    const ids = new Set<string>();
    for (const m of s.modules) {
      if (ids.has(m.id)) bad("ship.modules", "Повтор id");
      ids.add(m.id);
      if (
        ![
          "generator",
          "engine",
          "load",
          "radiator",
          "buffer",
          "h2",
          "thermoinverter",
          "solar",
        ].includes(m.kind)
      )
        bad(`ship.modules.${m.id}.kind`, "Неизвестный тип");
      if (!["Protected", "Active", "Background"].includes(m.policy))
        bad(`ship.modules.${m.id}.policy`, "Неверная policy");
      if (typeof m.enabled !== "boolean")
        bad(`ship.modules.${m.id}.enabled`, "Нужно boolean");
      for (const k of [
        "powerW",
        "efficiency",
        "exportFraction",
        "pathEfficiency",
        "forceN",
        "alpha",
        "hostFraction",
        "areaM2",
        "capacityJ",
        "coolingW",
        "auxW",
        "qJKg",
        "hotK",
        "copEfficiency",
        "workPerJ",
        "absorbAboveK",
        "releaseBelowK",
      ] as const)
        requiredNumber(m[k], `ship.modules.${m.id}.${k}`);
      if (
        (m.kind === "generator" &&
          !(m.efficiency > 0 && m.pathEfficiency > 0)) ||
        (m.kind === "h2" && !(m.qJKg > 0)) ||
        (m.kind === "thermoinverter" && !(m.copEfficiency > 0))
      )
        bad(`ship.modules.${m.id}`, "Нулевой знаменатель");
      if (m.kind === "h2" && m.species !== "hydrogen")
        bad(`ship.modules.${m.id}.species`, "H₂ cooler требует hydrogen");
      if (m.tankId) {
        const t = s.tanks.find((t) => t.id === m.tankId);
        if (!t || t.species !== m.species)
          bad(
            `ship.modules.${m.id}.tankId`,
            "Бак отсутствует или несовместимый species",
          );
      }
      if (["generator", "engine", "h2"].includes(m.kind) && !m.tankId)
        bad(`ship.modules.${m.id}.tankId`, "Обязателен бак");
      if (m.kind === "buffer" && m.releaseBelowK >= m.absorbAboveK)
        bad(`ship.modules.${m.id}`, "Buffer band должен быть упорядочен");
      if (
        m.efficiency > 1 ||
        m.pathEfficiency > 1 ||
        m.hostFraction > 1 ||
        m.exportFraction > 1
      )
        bad(`ship.modules.${m.id}`, "Доли должны быть ≤1");
      requiredGate(m.gate, `ship.modules.${m.id}.gate`);
    }
    const tanks = new Set<string>();
    for (const t of s.tanks) {
      if (tanks.has(t.id)) bad("ship.tanks", "Повтор баков");
      tanks.add(t.id);
      if (!["diesel", "hydrogen"].includes(t.species))
        bad(`ship.tanks.${t.id}.species`, "Неподдерживаемый species");
      requiredNumber(t.capacityKg, `ship.tanks.${t.id}.capacityKg`);
      requiredNumber(t.energyJKg, `ship.tanks.${t.id}.energyJKg`);
      if (t.gate !== undefined) requiredGate(t.gate, `ship.tanks.${t.id}.gate`);
      const q = p.initial.fuelKg[t.id];
      requiredNumber(q, `initial.fuelKg.${t.id}`);
      if (!(q >= 0 && q <= t.capacityKg))
        bad(`initial.fuelKg.${t.id}`, "Запас вне ёмкости");
      if (!(t.energyJKg > 0))
        bad(`ship.tanks.${t.id}.energyJKg`, "Требуется >0 J/kg");
    }
    for (const id of Object.keys(p.initial.fuelKg))
      if (!tanks.has(id)) bad(`initial.fuelKg.${id}`, "Нет физического бака");
    for (const [id, q] of Object.entries(p.initial.buffersJ)) {
      requiredNumber(q, `initial.buffersJ.${id}`);
      const m = s.modules.find((m) => m.id === id && m.kind === "buffer");
      if (!m || q > m.capacityJ)
        bad(`initial.buffersJ.${id}`, "Буфер отсутствует или переполнен");
    }
    const env = (e: RunSpec["environment"], path: string) => {
      for (const k of [
        "effectiveBackgroundK",
        "solarFluxWm2",
        "linearWK",
      ] as const)
        requiredNumber(e[k], `${path}.${k}`);
      const seen = new Set<string>([e.backgroundSourceId]);
      if (!e.backgroundSourceId)
        bad(path + ".backgroundSourceId", "Обязателен ID фонового источника");
      if (e.solarFluxWm2 > 0) {
        if (!e.solarSourceId || seen.has(e.solarSourceId))
          bad(path, "Повтор или отсутствующий solar source ID");
        seen.add(e.solarSourceId);
      }
      for (const [i, x] of [...e.directHeat, ...e.energyInputs].entries()) {
        requiredNumber(x.powerW, `${path}.inputs.${i}.powerW`);
        if (!x.sourceId) bad(path, "Обязателен ID входа");
        if (seen.has(x.sourceId)) bad(path, "Повторный учёт energy source");
        seen.add(x.sourceId);
      }
      for (const [i, x] of e.energyInputs.entries()) {
        requiredNumber(x.powerW, `${path}.energyInputs.${i}.powerW`);
        if (!["electric", "heat"].includes(x.representation))
          bad(
            `${path}.energyInputs.${i}.representation`,
            "Неверное представление EM energy",
          );
      }
      if (!["radiative", "linear-fog-experiment"].includes(e.law))
        bad(path + ".law", "Неподдерживаемый закон");
    };
    env(p.environment, "environment");
    requiredNumber(p.scenario.targetWork, "scenario.targetWork");
    if (typeof p.scenario.repeat !== "boolean")
      bad("scenario.repeat", "Обязательно boolean");
    if (!p.scenario.phases.length) bad("scenario.phases", "Нужна рабочая фаза");
    for (const [i, ph] of p.scenario.phases.entries()) {
      if (
        ![
          "idle",
          "approach",
          "work",
          "overload",
          "return",
          "recovery",
          "service",
        ].includes(ph.action)
      )
        bad(`scenario.phases.${i}.action`, "Неизвестная фаза");
      requiredNumber(ph.duty, `scenario.phases.${i}.duty`);
      requiredNumber(
        ph.durationSeconds,
        `scenario.phases.${i}.durationSeconds`,
      );
      if (!(ph.durationSeconds > 0) || ph.duty > 1)
        bad(`scenario.phases.${i}`, "Положительная длительность, duty [0,1]");
      if (ph.service)
        for (const k of ["unload", "charge", "refuel"] as const)
          if (typeof ph.service[k] !== "boolean")
            bad(`scenario.phases.${i}.service.${k}`, "Обязательно boolean");
      if (ph.environment)
        env(ph.environment, `scenario.phases.${i}.environment`);
    }
  } catch {
    bad("$", "Отсутствует обязательное поле или неверная структура");
  }
  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: structuredClone(p) };
}

// Диспетчер не переинтерпретирует числа legacy snapshot по текущему каталогу.
export function validateAnyRunSpec(input:unknown):ValidationResult<import('../model/v2/types').AnyRunSpec>{return (input as any)?.schemaVersion==='u2-lab/2'?validateRunSpecV2(input):validateRunSpec(input);}
import {validateRunSpecV2} from '../model/v2/step';
