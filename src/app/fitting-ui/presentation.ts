import { catalogHasItem, fitHull } from "../../fitting/editions";
import type {
  ShipFit,
  CandidateCatalog,
  Category,
  ModuleItem,
  ResolvedInstance,
} from "../../fitting/types";
import type { RunResultV2 } from "../../runner/run";
import type { RunSpecV2 } from "../../model/v2/types";
import type { FittingWorkspace } from "../fitting-workspace";
import { makeMiningRun } from "../../scenarios/fitting";
import { getPresetFit } from "../../fitting/catalog";
import { compileFit } from "../../fitting/compile";
import { installedInstances } from "../../fitting/validate";
export const groups: Category[] = [
  "payload",
  "propulsion",
  "power",
  "signature",
];
export const groupNames: Record<Category, string> = {
  payload: "Полезная нагрузка",
  propulsion: "Двигатели",
  power: "Питание",
  signature: "Контроль сигнатур",
};
export const roleNames: Record<string, string> = {
  march: "Марш",
  retro: "Торможение",
  strafe: "Стрейф — пара",
  turn: "Поворот — пара",
};
export const esc = (x: unknown) =>
  String(x ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
export const num = (x: number | null | undefined, unit = "", digits = 2) =>
  x == null || !Number.isFinite(x)
    ? "—"
    : x.toLocaleString("ru-RU", { maximumFractionDigits: digits }) +
      (unit ? " " + unit : "");
export const resultRate = (r?: RunResultV2) =>
  num(r?.metrics.mission ? r.metrics.mission.deliveredScuPerHour : r?.metrics.scuPerHour, "SCU/ч");
export const mass = (m: ModuleItem) =>
  m.materials.reduce((n, b) => n + b.massKg, 0);
export const heatCapacity = (m: ModuleItem) =>
  m.materials.reduce((n, b) => n + b.massKg * b.cpJKgK, 0);
export function passport(f: ShipFit, c: CandidateCatalog) {
  const compiled = compileFit(f, c);
  if (compiled.ok)
    return {
      dryMassKg: compiled.value.dryMassKg,
      heatCapacityJK: compiled.value.heatCapacityJK,
      cargo: compiled.value.cargoCapacityM3,
      complete: true,
    };
  const h = fitHull(f, c)!;
  const mats = [
    ...h.materials,
    ...installedInstances(f, c).flatMap((i) => i.item.materials),
  ];
  const cargo = { universal: 0, bulk: 0, liquid: 0 };
  for (const i of installedInstances(f, c))
    if (i.item.family === "cargo")
      cargo[i.item.cargoType!] += i.item.numerics.cargoM3;
  return {
    dryMassKg: mats.reduce((n, b) => n + b.massKg, 0),
    heatCapacityJK: mats.reduce((n, b) => n + b.massKg * b.cpJKgK, 0),
    cargo,
    complete: false,
  };
}
export function replacement(
  f: ShipFit,
  c: CandidateCatalog,
  slotId: string,
  itemId: string | null,
  batch = false,
) {
  const next = structuredClone(f);
  if (itemId && !next.localVariants[itemId] &&
      !catalogHasItem(next.catalogVersion, itemId) && catalogHasItem(c.version, itemId))
    next.catalogVersion = c.version;
  const h = fitHull(next, c)!;
  const targets = batch
    ? h.slots.filter((s) => s.category === "payload")
    : h.slots.filter((s) => s.id === slotId);
  for (const s of targets) {
    const id = next.assignments[s.id] ?? "fit:" + s.id;
    if (itemId === null) {
      delete next.instances[id];
      delete next.assignments[s.id];
    } else {
      next.assignments[s.id] = id;
      next.instances[id] = {
        id,
        itemId,
        enabled: next.instances[id]?.enabled ?? true,
      };
    }
  }
  return next;
}
export function slotLayout(
  roster: { id: string; category: Category; builtin: boolean }[],
  width: number,
) {
  const order: Category[] = ["payload", "power", "signature", "propulsion"];
  const sorted = order.flatMap((cat) =>
    roster.filter((x) => x.category === cat),
  );
  const present = order.filter((cat) => sorted.some((x) => x.category === cat));
  const gap = 2;
  const angle = (360 - present.length * gap) / Math.max(1, roster.length);
  const ring = width >= 440 && roster.length > 0 && angle >= 18;
  let at = -90;
  const sectors = present.map((category) => {
    const start = at - angle / 2;
    const members = sorted.filter((x) => x.category === category);
    const nodes = members.map((x) => {
      const a = at;
      at += angle;
      return {
        ...x,
        angle: a,
        x: 220 + 175 * Math.cos((a * Math.PI) / 180) - 22,
        y: 220 + 175 * Math.sin((a * Math.PI) / 180) - 22,
        size: 44,
      };
    });
    const end = at - angle / 2;
    at += gap;
    return { category, count: members.length, start, end, nodes };
  });
  return {
    ring,
    minimumAngle: angle,
    nodes: sectors.flatMap((s) => s.nodes),
    sectors,
  };
}
// Процесс берётся из владельца сценария, в том числе для неполной сборки.
// Номинал не моделирует выдачу шины, нагрев, ограничения трюма или фазовые запросы.
export function nominalProcess(
  w: FittingWorkspace,
): RunSpecV2["process"] | undefined {
  const current = w.prepare();
  if (current.ok) return current.value.process;
  const reference = makeMiningRun(
    getPresetFit(w.getFit().hullId + ":1", w.getFit().catalogVersion as CandidateCatalog["version"]),
    w.catalog,
    // Чужие ID после смены корпуса не мешают чтению процесса; реальный draft
    // сохраняет свою группу и отказ Start без переоснащения или нормализации.
    { ...w.getSelected().conditions, selectedWorkGroup: undefined },
  );
  return reference.ok ? reference.value.process : undefined;
}
export function loadNominal(m: ModuleItem) {
  return m.family === "mining" ||
    (m.family === "engine" && m.propulsionType === "electric")
    ? m.numerics.powerW
    : m.family === "h2" || m.family === "radiator"
      ? (m.numerics.auxW ?? 0)
      : m.family === "thermoinverter"
        ? null
        : 0;
}
export function miningNominal(
  m: ModuleItem,
  process: RunSpecV2["process"] | undefined,
) {
  if (m.family !== "mining") return 0;
  return process
    ? (m.numerics.powerW *
        m.numerics.efficiency *
        process.extractFactor *
        process.softFactor) /
        (process.workFactor * process.energyJPerM3)
    : null;
}
export function nominalFit(
  f: ShipFit,
  c: CandidateCatalog,
  process: RunSpecV2["process"] | undefined,
) {
  const roster = installedInstances(f, c).filter((i) => i.enabled);
  const mining = roster.filter((i) => i.item.family === "mining");
  return {
    powerW: roster.some((i) => loadNominal(i.item) === null)
      ? null
      : fitHull(f, c)!.hullPowerW +
        roster.reduce((n, i) => n + loadNominal(i.item)!, 0),
    miningScuS: !mining.length
      ? 0
      : process
        ? mining.reduce((n, i) => n + miningNominal(i.item, process)!, 0)
        : null,
    lasers: mining.length,
  };
}
export function laserNames(roster: ResolvedInstance[]) {
  return new Map(
    roster
      .filter((i) => i.item.family === "mining")
      .map((i, n) => [i.id, `Лазер ${n + 1}`]),
  );
}
export function snapshotMatches(
  i: ResolvedInstance,
  r?: RunResultV2,
  currentFit?: ShipFit,
) {
  const measured = r?.spec.resolvedShip.instances.find((x) => x.id === i.id);
  const mode = (fit: ShipFit) =>
    i.builtin ? fit.builtinModes?.[i.id]?.mode : fit.instances[i.id]?.mode;
  return (
    !!measured &&
    JSON.stringify(measured) === JSON.stringify(i) &&
    (!currentFit || mode(r!.spec.resolvedShip.fit) === mode(currentFit))
  );
}
export function nominal(m: ModuleItem) {
  const n = m.numerics;
  if (m.family === "mining") return num(n.powerW / 1e6, "МВт");
  if (m.family === "engine") return num(n.forceN / 1e3, "кН");
  if (m.family === "cargo") return num(n.cargoM3, "SCU");
  if (m.family === "battery" || m.family === "buffer")
    return num(n.capacityJ / 1e6, "МДж");
  if (m.family === "tank") return num(n.fuelCapacityKg, "кг");
  if (n.powerW !== undefined) return num(n.powerW / 1e6, "МВт");
  if (n.areaM2 !== undefined) return num(n.areaM2, "м²");
  return m.family;
}

// Карточка описывает изделие; показатели всей сборки остаются в отдельном preview.
export function moduleProfile(m: ModuleItem, process?: RunSpecV2["process"]) {
  const n = m.numerics;
  const value = (x: number | null | undefined, unit: string, digits = 2) => `<span class="metric-value">${esc(num(x, unit, digits))}</span>`;
  const traits: string[] = [];
  switch (m.family) {
    case "cargo":
      traits.push(({ universal: "Универсальный", bulk: "Навалочный", liquid: "Жидкий" }[m.cargoType!] ?? "Грузовой") + " трюм · " + value(n.cargoM3, "SCU"));
      break;
    case "mining":
      traits.push("Мощность " + value(n.powerW / 1e6, "МВт"), "Номинал добычи " + value(miningNominal(m, process), "SCU/с", 7));
      break;
    case "engine":
      traits.push("Тяга " + value(n.forceN / 1e3, "кН"));
      if (m.propulsionType === "electric") traits.push("Потребление " + value(n.powerW / 1e6, "МВт"));
      break;
    case "generator": traits.push("Номинальная мощность " + value(n.powerW / 1e6, "МВт")); break;
    case "solar": traits.push("Площадь " + value(n.areaM2, "м²"), "КПД " + value(n.efficiency * 100, "%")); break;
    case "battery": traits.push("Ёмкость " + value(n.capacityJ / 1e9, "ГДж")); break;
    case "tank": traits.push((m.species === "hydrogen" ? "H₂" : "Дизель") + " · " + value(n.fuelCapacityKg, "кг")); break;
    case "buffer": traits.push("Ёмкость " + value(n.capacityJ / 1e9, "ГДж"), "Лимит теплообмена " + value(n.coolingW / 1e6, "МВт")); break;
    case "radiator": traits.push("Площадь " + value(n.areaM2, "м²")); break;
    case "h2": traits.push("Предел охлаждения " + value(n.coolingW / 1e6, "МВт")); break;
    case "thermoinverter": traits.push("Предел охлаждения " + value(n.coolingW / 1e6, "МВт"), "Поверхность " + value(n.areaM2, "м²")); break;
  }
  if (n.auxW > 0) traits.push("Вспомогательное питание " + value(n.auxW / 1e6, "МВт"));
  traits.push("Масса " + value(mass(m), "кг"));
  return traits.map(x => `<span>${x}</span>`).join("");
}

export function technicalDetails(m: ModuleItem, id: string, preId?: string) {
  return `<details class="module-info" id="${esc(id)}" data-info-item="${esc(m.id)}"><summary aria-label="Технические сведения: ${esc(m.label)}">i</summary><div class="module-info-body"><h4>ТТХ и происхождение · ${esc(m.label)}</h4><pre ${preId ? `id="${esc(preId)}"` : ""}>${esc(JSON.stringify(m, null, 2))}</pre></div></details>`;
}
