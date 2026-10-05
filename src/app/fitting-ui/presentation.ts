import type {
  ShipFit,
  CandidateCatalog,
  Category,
  ModuleItem,
} from "../../fitting/types";
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
  const h = c.hulls.find((x) => x.id === f.hullId)!;
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
  const h = c.hulls.find((x) => x.id === f.hullId)!;
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
  const ring = width >= 440 && roster.length > 0 && roster.length <= 20;
  const angle = 360 / Math.max(1, roster.length);
  return {
    ring,
    minimumAngle: angle,
    nodes: sorted.map((x, i) => ({
      ...x,
      angle: -90 + i * angle,
      x: 220 + 175 * Math.cos(((-90 + i * angle) * Math.PI) / 180) - 22,
      y: 220 + 175 * Math.sin(((-90 + i * angle) * Math.PI) / 180) - 22,
      size: 44,
    })),
    sectors: order.map((category) => ({
      category,
      count: roster.filter((x) => x.category === category).length,
    })),
  };
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
