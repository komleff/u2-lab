import type { ValidationResult } from "../../catalog/schema";
import type { RunSpecV2, StateV2, StepResultV2, RequestFrame } from "./types";
import { CAUSES, MODEL_V2 } from "./types";
import { itemIssues } from "../../fitting/validate";
import { allocateCargo, commodities } from "../../fitting/cargo";
import { moduleBase } from "../../catalog/presets";
import type { Module, ShipConfig } from "../types";
import { stepPhysicsV2, type PhysicsShip, type PhysicsModule } from "./physics";
export function validateRunSpecV2(input: unknown): ValidationResult<RunSpecV2> {
  const s = input as RunSpecV2,
    errors: { path: string; code: string; message: string }[] = [];
  const bad = (path: string, message: string) =>
    errors.push({ path, code: "INVALID_V2", message });
  if (!s || typeof s !== "object")
    return {
      ok: false,
      errors: [
        { path: "$", code: "INVALID_V2", message: "Нужен объект опыта" },
      ],
    };
  try {
    if (
      s.schemaVersion !== "u2-lab/2" ||
      s.modelVersion !== MODEL_V2 ||
      s.units !== "SI" ||
      s.approvedBaseline !== false ||
      !s.catalogVersion
    )
      bad("$", "Неподдерживаемая версия опыта");
    const finite = (n: unknown) =>
      typeof n === "number" && Number.isFinite(n) && n >= 0;
    const walk = (v: unknown, path: string) => {
      if (typeof v === "number" && !Number.isFinite(v))
        bad(path, "Нефинитное число");
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v))
          if (k !== "origins") walk(x, path + "." + k);
    };
    walk(s, "$");
    const ship = s.resolvedShip;
    if (
      !finite(ship.hull.hullPowerW) ||
      !finite(ship.hull.hullRadiationM2) ||
      !finite(ship.dryMassKg) ||
      !finite(ship.heatCapacityJK) ||
      !finite(ship.batteryCapacityJ)
    )
      bad(
        "resolvedShip",
        "Неотрицательные finite SI ship numerics обязательны",
      );
    let mass = 0,
      C = 0;
    const materialIds = new Set<string>();
    for (const m of ship.materials) {
      if (
        materialIds.has(m.id) ||
        m.contents !== "dry" ||
        !finite(m.massKg) ||
        !finite(m.cpJKgK) ||
        m.massKg === 0 ||
        m.cpJKgK === 0
      )
        bad("resolvedShip.materials", "Неверный сухой bill");
      materialIds.add(m.id);
      mass += m.massKg;
      C += m.massKg * m.cpJKgK;
    }
    if (
      Math.abs(mass - ship.dryMassKg) > 1e-8 * Math.max(1, mass) ||
      Math.abs(C - ship.heatCapacityJK) > 1e-8 * Math.max(1, C) ||
      !(C > 0)
    )
      bad("resolvedShip", "Несогласованный mass/C bill");
    const ids = new Set<string>();
    for (const i of ship.instances) {
      if (ids.has(i.id)) bad("resolvedShip.instances", "Повтор instance ID");
      ids.add(i.id);
      errors.push(...itemIssues(i.item, "instances." + i.id));
    }

    const expectedMaterials = [
      ...ship.hull.materials.map((m) => ({ ...m, id: "shell:" + m.id })),
      ...ship.instances.flatMap((i) =>
        i.item.materials.map((m) => ({ ...m, id: i.id + ":" + m.id })),
      ),
    ];
    if (
      expectedMaterials.length !== ship.materials.length ||
      expectedMaterials.some(
        (m, index) =>
          m.id !== ship.materials[index]?.id ||
          m.massKg !== ship.materials[index]?.massKg ||
          m.cpJKgK !== ship.materials[index]?.cpJKgK,
      )
    )
      bad(
        "resolvedShip.materials",
        "Bill не соответствует installed roster ровно один раз",
      );
    const batteries = ship.instances
      .filter((i) => i.enabled && i.item.family === "battery")
      .reduce((n, i) => n + i.item.numerics.capacityJ, 0);
    if (
      !(batteries > 0) ||
      Math.abs(batteries - ship.batteryCapacityJ) >
        1e-8 * Math.max(1, batteries)
    )
      bad(
        "resolvedShip.batteryCapacityJ",
        "Ёмкость не соответствует аккумуляторам",
      );
    for (const sp of ["diesel", "hydrogen"] as const) {
      const tanks = ship.instances.filter(
        (i) => i.enabled && i.item.family === "tank" && i.item.species === sp,
      );
      const cap = tanks.reduce((n, i) => n + i.item.numerics.fuelCapacityKg, 0);
      const graph = ship.resources[sp];
      if (
        Math.abs(cap - graph.capacityKg) > 1e-8 * Math.max(1, cap) ||
        graph.energyJKg !== (sp === "diesel" ? 43e6 : 120e6) ||
        JSON.stringify(tanks.map((i) => i.id)) !== JSON.stringify(graph.tankIds)
      )
        bad(
          "resolvedShip.resources." + sp,
          "Typed stock graph не соответствует Power tanks",
        );
      const consumers = ship.instances.filter(
        (i) => i.enabled && i.item.species === sp && i.item.family !== "tank",
      );
      if (
        JSON.stringify(consumers.map((i) => i.id)) !==
          JSON.stringify(graph.consumerIds) ||
        (consumers.length && !tanks.length)
      )
        bad(
          "resolvedShip.resources." + sp,
          "Неверные ссылки operating consumers",
        );
    }
    const cargo = { universal: 0, bulk: 0, liquid: 0 };
    for (const i of ship.instances)
      if (i.item.family === "cargo")
        cargo[i.item.cargoType!] += i.item.numerics.cargoM3;
    for (const k of ["universal", "bulk", "liquid"] as const)
      if (cargo[k] !== ship.cargoCapacityM3[k])
        bad(
          "resolvedShip.cargoCapacityM3",
          "Capacity не соответствует cargo roster",
        );
    const buffers = Object.fromEntries(
      ship.instances
        .filter((i) => i.enabled && i.item.family === "buffer")
        .map((i) => [i.id, i.item.numerics.capacityJ]),
    );
    if (JSON.stringify(buffers) !== JSON.stringify(ship.bufferCapacityJ))
      bad("resolvedShip.bufferCapacityJ", "Буферы не соответствуют roster");
    const group = new Set(s.selectedWorkGroup);
    if (group.size !== s.selectedWorkGroup.length)
      bad("selectedWorkGroup", "Повтор mining ID");
    for (const id of group)
      if (
        !ship.instances.some((i) => i.id === id && i.item.family === "mining")
      )
        bad("selectedWorkGroup", "Нужен установленный mining ID");
    if (
      !(
        finite(s.durationSeconds) &&
        s.durationSeconds > 0 &&
        finite(s.stepSeconds) &&
        s.stepSeconds > 0 &&
        s.stepSeconds <= 1
      )
    )
      bad("durationSeconds", "Длительность>0, physicsdt∈(0,1]");
    if (!s.scenario.phases.length) bad("scenario.phases", "Пустой цикл");
    const phaseIds = new Set<string>();
    for (const p of s.scenario.phases) {
      if (
        !finite(p.durationSeconds) ||
        p.durationSeconds <= 0 ||
        phaseIds.has(p.id)
      )
        bad("scenario.phases", "Неверная длительность или duplicatephase ID");
      phaseIds.add(p.id);
      const frameIds = new Set<string>();
      for (const [key, duty] of Object.entries(p.requests)) {
        if (!finite(duty) || duty > 1) bad("requests." + key, "Duty∈[0,1]");
        const found = ship.instances.filter(
          (i) => i.id === key || i.role === key,
        );
        if (found.length === 1) {
          if (frameIds.has(found[0].id))
            bad("requests." + key, "Повтор ID/role запроса");
          frameIds.add(found[0].id);
        }
        if (found.length !== 1)
          bad("requests." + key, "Неизвестный или неоднозначный instance/role");
        else if (
          found[0].item.family === "mining" &&
          duty > 0 &&
          !group.has(found[0].id)
        )
          bad("requests." + key, "Mining request вне фиксированной группы");
      }
    }
    for (const [k, v] of Object.entries(s.process))
      if (k !== "id" && !finite(v))
        bad("process." + k, "Нужны конечные nonnegative параметры");
    if (
      !(
        s.process.energyJPerM3 > 0 &&
        s.process.workFactor > 0 &&
        s.process.densityKgM3 > 0 &&
        s.process.returnFraction >= 0 &&
        s.process.returnFraction <= 1
      )
    )
      bad("process", "Неверные process диапазоны");
    if (!finite(s.scenario.targetM3)) bad("targetM3", "Неверная цель");
    if (
      !finite(s.initial.temperatureK) ||
      s.initial.temperatureK <= 0 ||
      !finite(s.initial.chargeJ) ||
      s.initial.chargeJ > ship.batteryCapacityJ
    )
      bad("initial", "Запас заряда вне физической ёмкости");
    for (const species of ["diesel", "hydrogen"] as const) {
      const n = s.initial.fuelKg[species];
      if (!finite(n) || n > ship.resources[species].capacityKg)
        bad("initial.fuelKg." + species, "Запас вне физического контура");
    }
    for (const [id, n] of Object.entries(s.initial.buffersJ))
      if (
        !finite(n) ||
        !ship.bufferCapacityJ[id] ||
        n > ship.bufferCapacityJ[id]
      )
        bad("initial.buffersJ." + id, "Запас вне ёмкости буфера");
    if (!allocateCargo(ship, s.initial.cargoM3).ok)
      bad("initial.cargoM3", "Невалидный cargo");
    for (const e of [
      s.environment,
      ...s.scenario.phases.flatMap((p) =>
        p.environment ? [p.environment] : [],
      ),
    ]) {
      for (const k of [
        "effectiveBackgroundK",
        "solarFluxWm2",
        "linearWK",
      ] as const)
        if (!finite(e[k])) bad("environment." + k, "Неверное SI поле");
      if (!["radiative", "linear-fog-experiment"].includes(e.law))
        bad("environment.law", "Неизвестный обмен");
      const sourceIds = new Set<string>();
      for (const p of [...e.energyInputs, ...e.directHeat]) {
        if (!finite(p.powerW)) bad("environment", "Неверная внешняя мощность");
        if (sourceIds.has(p.sourceId))
          bad("environment", "Повтор representation одного источника");
        sourceIds.add(p.sourceId);
      }
      for (const p of e.energyInputs)
        if (!["electric", "heat"].includes(p.representation))
          bad("environment", "Неизвестный тип внешней энергии");
    }
  } catch {
    bad("$", "Неполный numerical snapshot");
  }
  return errors.length
    ? { ok: false, errors }
    : { ok: true, value: structuredClone(s) };
}
export function initialStateV2(s: RunSpecV2): StateV2 {
  const cargoM3 = { ...s.initial.cargoM3 };
  const cargo = Object.values(cargoM3).reduce((n, v) => n + v, 0);
  const cargoMass = Object.entries(cargoM3).reduce(
    (n, [id, v]) =>
      n +
      v *
        (id === "ore"
          ? s.process.densityKgM3
          : (commodities[id]?.densityKgM3 ?? 0)),
    0,
  );
  return {
    schemaVersion: "u2-lab/2",
    timeSeconds: 0,
    chargeJ: s.initial.chargeJ,
    temperatureK: s.initial.temperatureK,
    fuelKg: { ...s.initial.fuelKg },
    buffersJ: { ...s.initial.buffersJ },
    gates: {},
    cargo,
    cargoM3,
    currentMassKg:
      s.resolvedShip.dryMassKg +
      Object.values(s.initial.fuelKg).reduce((n, v) => n + v, 0) +
      cargoMass,
    usefulWork: 0,
    extractedByInstanceM3: Object.fromEntries(
      s.resolvedShip.instances
        .filter((i) => i.item.family === "mining")
        .map((i) => [i.id, 0]),
    ),
    consumptionKg: {},
    limitations: Object.fromEntries(
      s.resolvedShip.instances.map((i) => [
        i.id,
        Object.fromEntries(CAUSES.map((c) => [c, false])),
      ]),
    ) as StateV2["limitations"],
    phaseKey: "",
    constraints: [],
    cyclesCompleted: 0,
    miningStopSeconds: null,
  };
}
export function physicsShip(s: RunSpecV2, state: StateV2): PhysicsShip {
  const r = s.resolvedShip;
  const modules: PhysicsModule[] = r.instances
    .filter((i) => !["tank", "battery", "cargo"].includes(i.item.family))
    .map((i) => {
      const m = i.item;
      const kind =
        m.family === "mining" ||
        (m.family === "engine" && m.propulsionType === "electric")
          ? "load"
          : (m.family as Module["kind"]);
      const x = {
        ...moduleBase(i.id, kind),
        ...m.numerics,
        enabled: i.enabled,
        gate: { ...m.gate },
        tankId: m.species,
        species: m.species,
        output:
          m.family === "mining"
            ? "mining"
            : m.family === "engine" && m.propulsionType === "electric"
              ? "drive"
              : undefined,
      } as PhysicsModule;
      if (x.output === "drive")
        x.efficiency = m.numerics.pathEfficiency * m.numerics.efficiency;
      if (x.output === "mining")
        x.workPerJ =
          (s.process.extractFactor * s.process.softFactor) /
          (s.process.workFactor * s.process.energyJPerM3);
      return x;
    });
  const allocation = allocateCargo(r, state.cargoM3);
  if (!allocation.ok) throw Error("Недопустимое cargo state");
  const universalUsed = Object.values(allocation.value.universal).reduce(
    (n, v) => n + v,
    0,
  );
  const bulkUsed = Object.entries(allocation.value.specialized)
    .filter(([id]) => commodities[id]?.type === "bulk")
    .reduce((n, [, v]) => n + v, 0);
  const oreRemaining =
    r.cargoCapacityM3.bulk -
    bulkUsed +
    r.cargoCapacityM3.universal -
    universalUsed;
  return {
    label: r.hull.label,
    size: r.hull.size === "S" ? "S" : "M",
    heatCapacityJK: r.heatCapacityJK,
    dryMassKg: r.dryMassKg,
    thermalMaterials: r.materials,
    hullPowerW: r.hull.hullPowerW,
    hullRadiationM2: r.hull.hullRadiationM2,
    dischargeEfficiency: 0.9,
    chargeEfficiency: 1,
    accumulators: [{ id: "common", capacityJ: r.batteryCapacityJ }],
    tanks: (["diesel", "hydrogen"] as const)
      .filter((sp) => r.resources[sp].capacityKg > 0)
      .map((sp) => ({
        id: sp,
        species: sp,
        capacityKg: r.resources[sp].capacityKg,
        energyJKg: r.resources[sp].energyJKg,
        gate: r.instances.find(
          (i) => i.item.family === "tank" && i.item.species === sp,
        )!.item.gate,
      })),
    modules,
    cargoCapacity: state.cargo + oreRemaining,
    cargoLimitM3: state.cargo + oreRemaining,
    targetLimitM3: s.scenario.targetM3,
    returnFraction: s.process.returnFraction,
  };
}
export function stepV2(
  s: RunSpecV2,
  input: StateV2,
  dt: number,
  requests: RequestFrame,
): StepResultV2 {
  const frames = Object.entries(requests).map(([key, duty]) => {
    const matches = s.resolvedShip.instances.filter(
      (i) => i.id === key || i.role === key,
    );
    if (matches.length !== 1 || !Number.isFinite(duty) || duty < 0 || duty > 1)
      throw Error("Неверный request: " + key);
    const id = matches[0].id;
    if (
      matches[0].item.family === "mining" &&
      duty > 0 &&
      !s.selectedWorkGroup.includes(id)
    )
      throw Error("Mining request вне fixed group");
    return { moduleId: id, duty };
  });
  if (new Set(frames.map((f) => f.moduleId)).size !== frames.length)
    throw Error("Повтор request ID/role");
  const p = stepPhysicsV2(
    physicsShip(s, input),
    input,
    s.environment,
    frames,
    dt,
  );
  const state: StateV2 = {
    ...input,
    ...p.state,
    cargoM3: {
      ...input.cargoM3,
      ore: (input.cargoM3.ore ?? 0) + p.state.usefulWork - input.usefulWork,
    },
    extractedByInstanceM3: { ...input.extractedByInstanceM3 },
    consumptionKg: { ...input.consumptionKg },
    limitations: structuredClone(input.limitations),
  };
  for (const [k, v] of Object.entries(p.extractedByInstanceM3))
    state.extractedByInstanceM3[k] = (state.extractedByInstanceM3[k] ?? 0) + v;
  for (const [k, v] of Object.entries(p.consumptionKg))
    state.consumptionKg[k] = (state.consumptionKg[k] ?? 0) + v;
  state.currentMassKg =
    s.resolvedShip.dryMassKg +
    Object.values(state.fuelKg).reduce((n, v) => n + v, 0) +
    Object.entries(state.cargoM3).reduce(
      (n, [id, v]) =>
        n +
        v *
          (id === "ore"
            ? s.process.densityKgM3
            : (commodities[id]?.densityKgM3 ?? 0)),
      0,
    );
  for (const i of s.resolvedShip.instances)
    for (const c of CAUSES)
      state.limitations[i.id][c] =
        s.selectedWorkGroup.includes(i.id) && p.mining.causeSeconds[c] > 0;
  p.telemetry.currentMassKg = state.currentMassKg;
  p.telemetry.cargoM3 = state.cargo;
  p.telemetry.miningRateM3S = p.telemetry.workRate;
  return { ...p, state };
}
