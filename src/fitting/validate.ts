import { fitItem, fitHull, isKnownCatalogVersion } from "./editions";
import { validateShipModelFit } from "../model/v3/schema";
import type { ShipFitV3, CandidateCatalogV3 } from "../model/v3/types";
import type {
  ShipFit,
  CandidateCatalog,
  FitValidation,
  FitIssue,
  ModuleItem,
  ResolvedInstance,
} from "./types";
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
export function installedInstances(
  f: ShipFit,
  c: CandidateCatalog,
): ResolvedInstance[] {
  const h = fitHull(f, c);
  if (!h) return [];
  return [
    ...h.builtins.map((b) => ({
      id: b.id,
      item: structuredClone(b.item),
      enabled: f.builtinModes?.[b.id]?.enabled ?? true,
      builtin: true,
      role: b.role,
    })),
    ...Object.entries(f.assignments).flatMap(([slotId, id]) => {
      const i = f.instances[id],
        s = h.slots.find((s) => s.id === slotId);
      const item = i && fitItem(f, c, i.itemId);
      return i && item && s
        ? [
            {
              id: i.id,
              item: structuredClone(item),
              enabled: i.enabled,
              builtin: false,
              slotId,
              role: s.role,
            },
          ]
        : [];
    }),
  ];
}
export function itemIssues(m: ModuleItem, path: string): FitIssue[] {
  const issues: FitIssue[] = [];
  const bad = (code: string, message: string, p = path) =>
    issues.push({ path: p, code, message, severity: "error" });
  if (!m || !m.numerics || !m.gate || !Array.isArray(m.materials)) {
    bad("ITEM", "Неполное изделие");
    return issues;
  }
  for (const [k, n] of Object.entries(m.numerics)) {
    if (
      !m.origins?.["numerics." + k]?.sourceRef ||
      !m.origins?.["numerics." + k]?.unit
    )
      bad(
        "ORIGIN",
        "Нужно происхождение и единица SI поля",
        path + ".numerics." + k,
      );
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0)
      bad(
        "NUMBER",
        "Нужно конечное неотрицательное SI число",
        path + ".numerics." + k,
      );
  }
  for (const k of [
    "efficiency",
    "exportFraction",
    "pathEfficiency",
    "hostFraction",
    "copEfficiency",
  ])
    if (
      m.numerics[k] !== undefined &&
      !(m.numerics[k] >= 0 && m.numerics[k] <= 1)
    )
      bad("RANGE", "Доля должна быть в [0,1]");
  for (const n of Object.values(m.gate))
    if (!Number.isFinite(n) || n <= 0)
      bad("GATE", "Невалидная температура gate");
  const g = m.gate;
  if (
    !(
      g.low < (g.workLow ?? g.low) &&
      (g.workLow ?? g.low) <= g.workHigh &&
      g.workHigh < g.high &&
      g.restartLow > g.low &&
      g.restartHigh < g.high &&
      g.restartLow <= g.restartHigh
    )
  )
    bad("GATE", "Неверный порядок thermal границ");
  if (
    !m.materials.length ||
    m.materials.some(
      (b) =>
        !(
          b.massKg > 0 &&
          b.cpJKgK > 0 &&
          Number.isFinite(b.massKg) &&
          Number.isFinite(b.cpJKgK) &&
          b.contents === "dry" &&
          b.origin?.sourceRef
        ),
    )
  )
    bad("BILL", "Полный сухой bill обязателен");
  if (m.species !== undefined && !["diesel", "hydrogen"].includes(m.species))
    bad("SPECIES", "Неизвестный operating species");
  if (m.family === "h2" && m.species !== "hydrogen")
    bad("SPECIES", "H₂ cooler требует hydrogen");
  if (["generator", "tank"].includes(m.family) && !m.species)
    bad("SPECIES", "Требуется operating species");
  if (
    m.family === "engine" &&
    (!m.propulsionType ||
      !["diesel", "hydrogen", "electric"].includes(m.propulsionType) ||
      (m.propulsionType !== "electric" && m.species !== m.propulsionType) ||
      (m.propulsionType === "electric" && m.species !== undefined))
  )
    bad("SPECIES", "Propulsion type и operating species не согласованы");
  const required: Partial<Record<ModuleItem["family"], string[]>> = {
    engine: [
      "forceN",
      "alpha",
      "efficiency",
      "hostFraction",
      "powerW",
      ...(m.propulsionType === "electric" ? ["pathEfficiency"] : []),
    ],
    generator: ["powerW", "efficiency", "pathEfficiency", "exportFraction"],
    battery: ["capacityJ"],
    tank: ["fuelCapacityKg"],
    mining: ["powerW", "efficiency"],
    cargo: ["cargoM3"],
    radiator: ["areaM2", "auxW"],
    buffer: ["capacityJ", "coolingW", "absorbAboveK", "releaseBelowK"],
    h2: ["coolingW", "auxW", "qJKg"],
    thermoinverter: ["coolingW", "hotK", "areaM2", "copEfficiency"],
    solar: ["areaM2", "efficiency"],
  };
  if (!required[m.family]) bad("FAMILY", "Неизвестное семейство");
  for (const k of required[m.family] ?? [])
    if (!Number.isFinite(m.numerics[k]))
      bad("NUMBER", "Обязательное SI поле: " + k, path + ".numerics." + k);
  if (
    ["generator", "mining", "solar", "engine"].includes(m.family) &&
    !(m.numerics.efficiency > 0)
  )
    bad("RANGE", "КПД должен быть >0");
  if (m.family === "generator" && !(m.numerics.pathEfficiency > 0))
    bad("RANGE", "Path efficiency должен быть >0");
  for (const key of [
    ...(m.family === "engine" && m.propulsionType === "electric"
      ? ["pathEfficiency"]
      : []),
    ...(m.family === "thermoinverter" ? ["copEfficiency"] : []),
  ])
    if (
      !(
        Number.isFinite(m.numerics[key]) &&
        m.numerics[key] > 0 &&
        m.numerics[key] <= 1
      )
    )
      bad(
        "RANGE",
        "Коэффициент должен быть конечным в (0,1]",
        path + ".numerics." + key,
      );
  if (m.family === "h2" && !(m.numerics.qJKg > 0))
    bad("RANGE", "q должно быть >0");
  return issues;
}
export function validateFit(f: ShipFit, c: CandidateCatalog): FitValidation;
export function validateFit(f: ShipFitV3, c: CandidateCatalogV3): FitValidation;
export function validateFit(f: ShipFit, c: CandidateCatalog): FitValidation;
export function validateFit(input: ShipFit | ShipFitV3, catalog: CandidateCatalog | CandidateCatalogV3): FitValidation {
  if (catalog.version === "ship-fitting-0.3.0") {
    const valid = validateShipModelFit(input, catalog), ready = validateShipModelFit(input, catalog, true);
    const issues = (valid.ok ? [] : valid.errors).map(e => ({ ...e, severity: "error" as const }));
    const readiness = (ready.ok ? [] : ready.errors).filter(e => valid.ok || !issues.some(i => i.path === e.path && i.message === e.message));
    return { valid: valid.ok, issues: [...issues, ...readiness.map(e => ({...e,severity:"warning" as const}))], readiness: { complete: ready.ok, canRun: ready.ok, missing: readiness.map(e=>e.path), resourceWarnings: [] } };
  }
  const f = input as ShipFit, c = catalog as CandidateCatalog;
  const issues: FitIssue[] = [],
    missing: string[] = [],
    warnings: FitIssue[] = [];
  const bad = (path: string, code: string, message: string) =>
    issues.push({ path, code, message, severity: "error" });
  const finish = (): FitValidation => ({
    valid: !issues.length,
    issues: [
      ...issues,
      ...missing.map((p) => ({
        path: p,
        code: "MISSING",
        message: "Не установлено: " + p,
        severity: "warning" as const,
      })),
      ...warnings,
    ],
    readiness: {
      complete: !missing.length,
      canRun: !issues.length && !missing.length,
      missing,
      resourceWarnings: warnings,
    },
  });
  if (
    !f ||
    f.schemaVersion !== "u2-ship-fit/1" ||
    !isKnownCatalogVersion(f.catalogVersion) ||
    !isKnownCatalogVersion(c.version) ||
    !f.assignments ||
    !f.instances ||
    !f.localVariants ||
    !f.initial
  ) {
    bad("$", "SCHEMA", "Неизвестная версия или неполный fitting");
    return finish();
  }
  if (!Number.isInteger(f.fitRevision) || f.fitRevision < 1)
    bad("fitRevision", "REVISION", "Нужна положительная ревизия");
  const h = fitHull(f, c);
  if (!h) {
    bad("hullId", "HULL", "Неизвестный корпус");
    return finish();
  }
  const used = new Set(h.builtins.map((b) => b.id));
  for (const [id, mode] of Object.entries(f.builtinModes ?? {}))
    if (
      !h.builtins.some(
        (b) =>
          b.id === id && !["battery", "tank", "cargo"].includes(b.item.family),
      ) ||
      typeof mode.enabled !== "boolean"
    )
      bad(
        "builtinModes." + id,
        "BUILTIN_MODE",
        "Недопустимый режим встроенного изделия",
      );
  for (const [slotId, id] of Object.entries(f.assignments)) {
    const s = h.slots.find((s) => s.id === slotId);
    if (!s) {
      bad(
        "assignments." + slotId,
        "SLOT",
        "Встроенный или неизвестный слот нельзя изменить",
      );
      continue;
    }
    if (used.has(id))
      bad(
        "assignments." + slotId,
        "DUPLICATE_ID",
        "Экземпляр уже назначен или принадлежит корпусу",
      );
    used.add(id);
    const i = f.instances[id];
    if (!i || i.id !== id || typeof i.enabled !== "boolean") {
      bad("instances." + id, "INSTANCE", "Неизвестный или неверный экземпляр");
      continue;
    }
    const m = fitItem(f, c, i.itemId);
    if (!m) {
      bad("instances." + id, "ITEM", "Неизвестное изделие");
      continue;
    }
    issues.push(...itemIssues(m, "instances." + id));
    if (m.category !== s.category || !s.families.includes(m.family))
      bad(
        "assignments." + slotId,
        "CATEGORY",
        "Семейство не поддерживается слотом",
      );
    if (m.formFactor !== s.formFactor)
      bad(
        "assignments." + slotId,
        "FORM_FACTOR",
        "Нужен " +
          (s.formFactor === "pair" ? "парный" : "одиночный") +
          " модуль",
      );
    if (
      sizes.indexOf(m.size) > sizes.indexOf(s.size) ||
      !sizes.includes(m.size)
    )
      bad("assignments." + slotId, "SIZE", "Калибр изделия превышает слот");
    if (m.size === "XXL")
      bad("assignments." + slotId, "INACTIVE_SIZE", "XXL — неактивный резерв");
    if (
      ["E", "A"].includes(h.architecture) &&
      ((m.family === "tank" || m.family === "generator") && !(h.architecture === "E" && ["ship-fitting-0.2.3","ship-fitting-0.2.4","ship-fitting-0.2.5"].includes(f.catalogVersion)) ||
        (m.propulsionType && m.propulsionType !== "electric"))
    )
      bad(
        "assignments." + slotId,
        "ARCHITECTURE",
        "Архитектура не допускает operating fuel",
      );
    if (
      ["D", "H"].includes(h.architecture) &&
      m.family === "engine" &&
      ![h.architecture === "H" ? "hydrogen" : "diesel", "electric"].includes(m.propulsionType!)
    )
      bad(
        "assignments." + slotId,
        "ARCHITECTURE",
        h.architecture + " допускает " + (h.architecture === "H" ? "водородные" : "дизельные") + " или однородные электрические движители",
      );
  }
  for (const id of Object.keys(f.instances))
    if (
      !Object.values(f.assignments).includes(id) ||
      h.builtins.some((b) => b.id === id)
    )
      bad(
        "instances." + id,
        "INSTANCE",
        "Экземпляр не назначен либо конфликтует со встроенным",
      );
  const roster = installedInstances(f, c);
  for (const s of h.slots.filter((s) => s.mandatory))
    if (!roster.some((i) => i.slotId === s.id && i.enabled)) missing.push(s.id);
  if (!roster.some((i) => i.item.family === "battery" && i.enabled))
    missing.push("battery");
  const engines = roster.filter((i) => i.item.family === "engine");
  if (new Set(engines.map((i) => i.item.propulsionType)).size > 1)
    bad(
      "instances",
      "PROPULSION_TYPE",
      "Все четыре роли должны иметь один propulsion type",
    );
  for (const i of roster)
    if (
      i.enabled &&
      i.item.species &&
      i.item.family !== "tank" &&
      !roster.some(
        (t) =>
          t.enabled &&
          t.item.family === "tank" &&
          t.item.species === i.item.species,
      )
    )
      missing.push("Power tank " + i.item.species);
  const fractions = [
    f.initial.chargeFraction,
    ...Object.values(f.initial.fuelFraction ?? {}),
  ];
  if (fractions.some((v) => !Number.isFinite(v) || v! < 0 || v! > 1))
    bad("initial", "STOCK", "Запас должен быть долей [0,1]");
  if (f.initial.chargeFraction === 0)
    warnings.push({
      path: "initial.chargeFraction",
      code: "ZERO_STOCK",
      message: "Аккумулятор пуст: фактическая работа зависит от источников",
      severity: "warning",
    });
  for (const s of ["diesel", "hydrogen"] as const)
    if (
      roster.some((i) => i.item.family === "tank" && i.item.species === s) &&
      (f.initial.fuelFraction?.[s] ?? 1) === 0
    )
      warnings.push({
        path: "initial.fuelFraction." + s,
        code: "ZERO_STOCK",
        message: "Нет operating " + s,
        severity: "warning",
      });
  return finish();
}
