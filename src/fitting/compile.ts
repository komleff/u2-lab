import type { ValidationResult } from "../catalog/schema";
import type { ShipFit, CandidateCatalog, ResolvedShip } from "./types";
import { validateFit, installedInstances } from "./validate";
import { fitHull } from "./editions";
import { compileShipModelFit } from "../model/v3/schema";
import type { CandidateCatalogV3, ShipFitV3, ResolvedShipV3 } from "../model/v3/types";
import type { CompilationChange, PromotedFitV3, ModuleItemV3 } from "../model/v3/types";
export function compileFit(f: ShipFitV3, c: CandidateCatalogV3): ValidationResult<ResolvedShipV3>;
export function compileFit(f: ShipFit, c: CandidateCatalog): ValidationResult<ResolvedShip>;
export function compileFit(
  input: ShipFit | ShipFitV3,
  catalog: CandidateCatalog | CandidateCatalogV3,
): ValidationResult<ResolvedShip | ResolvedShipV3> {
  if (catalog.version === "ship-fitting-0.3.0") return compileShipModelFit(input, catalog);
  const f = input as ShipFit, c = catalog as CandidateCatalog;
  const v = validateFit(f, c);
  if (!v.readiness.canRun)
    return {
      ok: false,
      errors: v.issues.filter(
        (i) => i.severity === "error" || i.code === "MISSING",
      ),
    };
  const h = structuredClone(fitHull(f, c)!);
  const roster = installedInstances(f, c);
  const materials = [
    ...h.materials.map((m) => ({ ...m, id: "shell:" + m.id })),
    ...roster.flatMap((i) =>
      i.item.materials.map((m) => ({ ...m, id: i.id + ":" + m.id })),
    ),
  ];
  const resources: ResolvedShip["resources"] = {
    diesel: { capacityKg: 0, energyJKg: 43e6, consumerIds: [], tankIds: [] },
    hydrogen: { capacityKg: 0, energyJKg: 120e6, consumerIds: [], tankIds: [] },
  };
  const cargoCapacityM3 = { universal: 0, bulk: 0, liquid: 0 };
  let batteryCapacityJ = 0;
  const bufferCapacityJ: Record<string, number> = {},
    origins = { ...h.origins };
  for (const i of roster) {
    const m = i.item;
    if (m.family === "cargo")
      cargoCapacityM3[m.cargoType!] += m.numerics.cargoM3;
    if (i.enabled && m.family === "battery")
      batteryCapacityJ += m.numerics.capacityJ;
    if (i.enabled && m.family === "buffer")
      bufferCapacityJ[i.id] = m.numerics.capacityJ;
    if (i.enabled && m.species) {
      const r = resources[m.species];
      if (m.family === "tank") {
        r.capacityKg += m.numerics.fuelCapacityKg;
        r.tankIds.push(i.id);
      } else r.consumerIds.push(i.id);
    }
    for (const [k, o] of Object.entries(m.origins)) origins[i.id + "." + k] = o;
  }
  return {
    ok: true,
    value: structuredClone({
      hull: h,
      fit: f,
      instances: roster,
      dryMassKg: materials.reduce((n, m) => n + m.massKg, 0),
      heatCapacityJK: materials.reduce((n, m) => n + m.massKg * m.cpJKgK, 0),
      materials,
      batteryCapacityJ,
      bufferCapacityJ,
      cargoCapacityM3,
      resources,
      origins,
    }),
  };
}

/** Единственная явная граница old fit → ship-model; parsers её не вызывают. */
export function compileFitToShipModelV01(
  source: ShipFit,
  sourceCatalog: CandidateCatalog,
  targetCatalog: CandidateCatalogV3,
  options: { variantTemplates?: Record<string, string> } = {},
): ValidationResult<PromotedFitV3> {
  const old = compileFit(source, sourceCatalog);
  if (!old.ok) return old;
  const localVariants: Record<string, ModuleItemV3> = {};
  for (const [id, item] of Object.entries(source.localVariants)) {
    const template = targetCatalog.items[options.variantTemplates?.[id] ?? ""];
    // Нельзя угадать неизвестный SKU или выдать изменённую регуляторную схему за
    // сохранённое измерение. Монтажная/TTX база локального варианта выбирается явно.
    if (!template || template.thermalRole !== "ordinary" || template.family !== item.family || template.size !== item.size || template.formFactor !== item.formFactor || template.propulsionType !== item.propulsionType || template.species !== item.species)
      return { ok: false, errors: [{ path: "localVariants." + id, code: "PROMOTION_TEMPLATE", message: "Нужен явный совместимый 0.3.0 template для локального ordinary варианта; регулятор требует отдельного авторского снимка" }] };
    const variant = structuredClone(template);
    Object.assign(variant, { id, label: item.label, class: item.class, generation: item.generation, materials: structuredClone(item.materials), numerics: structuredClone(item.numerics), gate: structuredClone(item.gate) });
    variant.origins = { ...variant.origins, ...structuredClone(item.origins) };
    for (const [path, origin] of Object.entries(variant.origins)) if (origin.kind === "derived" && !origin.derivation)
      variant.origins[path] = { ...origin, derivation: "Буквальная копия sourceSnapshot; исходный вывод сохранён в sourceRef" };
    localVariants[id] = variant;
  }
  const fit: ShipFitV3 = {
    schemaVersion: "u2-ship-fit/2", catalogVersion: "ship-fitting-0.3.0", fitRevision: source.fitRevision + 1,
    hullId: source.hullId, assignments: structuredClone(source.assignments), instances: structuredClone(source.instances), localVariants,
    builtinModes: structuredClone(source.builtinModes ?? {}),
    initial: { chargeFraction: source.initial.chargeFraction, fuelFraction: { diesel: source.initial.fuelFraction.diesel ?? 0, hydrogen: source.initial.fuelFraction.hydrogen ?? 0 } },
  };
  const compiled = compileShipModelFit(fit, targetCatalog);
  if (!compiled.ok) return compiled;
  const changes: CompilationChange[] = [];
  const diff = (before: unknown, after: unknown, path: string) => {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const origin = path.split(".").some(k => k === "origin" || k === "origins");
    if (!origin && before && after && typeof before === "object" && typeof after === "object") {
      const a = before as Record<string, unknown>, b = after as Record<string, unknown>;
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[key], b[key], path ? path + "." + key : key);
    } else changes.push({ path, kind: origin ? "origin" : typeof before === "number" || typeof after === "number" ? "numeric" : "structural", before: before === undefined ? null : structuredClone(before), after: after === undefined ? null : structuredClone(after) });
  };
  diff(old.value, compiled.value, "ship");
  return { ok: true, value: structuredClone({ fit, ship: compiled.value, changes, sourceSnapshot: source }) };
}
