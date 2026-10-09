import type { RunResultV2 } from "../../runner/run";
import { isMissionModel, type RunSpecV2 } from "../../model/v2/types";
import { compareMissionConditions, missionComparisonInputs } from "../../scenarios/mission";
import { esc, num } from "./presentation";
export function measuredIdentity(r: RunResultV2) {
  const ship = r.spec.resolvedShip, lasers = ship.instances.filter(i => i.item.family === "mining").length;
  return `${esc(ship.hull.label)} · ${lasers} лазеров · трюм ${num(ship.cargoCapacityM3.universal)} / ${num(ship.cargoCapacityM3.bulk)} / ${num(ship.cargoCapacityM3.liquid)} SCU · измерена ревизия ${ship.fit.fitRevision} · интервал 0–${num(r.metrics.durationSeconds, "с")} · ${r.status === "complete" ? "завершён" : r.status === "cancelled" ? "отменён / частичный" : "частичный"}`;
}
export function measuredPassport(r: RunResultV2, owner: string) {
  const stages: Record<string, string> = { outbound: "Перелёт к полю", inbound: "Перелёт к станции", approach: "Местный подход", mining: "Добыча", service: "Обслуживание станции", done: "Рейс завершён", stranded: "Рейс остановлен" };
  return `<details class="measured-passport"><summary>Паспорт измерения ${esc(owner)}</summary><p>${measuredIdentity(r)}</p><p>run ${esc(r.runId)} · модель ${esc(r.spec.modelVersion)} · ${r.state.mission ? esc(stages[r.state.mission.stage] ?? r.state.mission.stage) + " · " + stationPolicyLabel(r.spec) : "старый заданный цикл"}</p><pre>${esc(JSON.stringify({ runId: r.runId, status: r.status, measuredSeconds: r.metrics.durationSeconds, spec: r.spec }, null, 2))}</pre></details>`;
}
export function stationPolicyLabel(s:RunSpecV2) { return s.mission?.stationReplenish===true?"Станция: заправка и полная зарядка":s.mission?.stationReplenish===false?"Станция: только разгрузка":"Станция: старый режим — только топливо, без зарядки"; }
const labels: Record<string, [string, string?]> = {
  modelVersion: ["Численная модель"], durationSeconds: ["Горизонт опыта", "с"], stepSeconds: ["Физический шаг", "с"],
  targetM3: ["Цель добычи", "SCU"], repeat: ["Повторять цикл"], hull: ["Корпус"], temperatureK: ["Начальная температура", "K"],
  "initial.temperatureK": ["Начальная температура", "K"], "initial.chargeJ": ["Начальная энергия батареи", "Дж"],
  chargeFraction: ["Начальная доля заряда"], "fuelFractions.diesel": ["Начальная доля дизеля"], "fuelFractions.hydrogen": ["Начальная доля H₂"],
  "signatures.observerPreset": ["Наблюдатель"], "signatures.aspectDeg": ["Ракурс", "°"],
  "signatures.rangeM": ["Дальность стенда", "м"], "signatures.advancedIr": ["Расширенный IR"],
  "signatures.radarEnabled": ["Активный радар"], "signatures.radarIntervalS": ["Интервал радара", "с"],
  "signatures.initialCap": ["Начальный заряд радара"], "signatures.version": ["Версия стенда"], "signatures.dataRevision": ["Данные стенда"],
  "signatures.geometry.lengthM": ["Длина стенда", "м"], "signatures.geometry.widthM": ["Ширина стенда", "м"], "signatures.geometry.heightM": ["Высота стенда", "м"],
  "environment.effectiveBackgroundK": ["Температура фона", "K"], "environment.solarFluxWm2": ["Солнечный поток", "Вт/м²"],
  "environment.law": ["Тепловой закон"], "environment.linearWK": ["Линейный теплообмен", "Вт/K"],
  "mission.distanceM": ["Дальность маршрута", "м"], "mission.approachSeconds": ["Местный подход", "с"],
  "mission.serviceSeconds": ["Обслуживание станции", "с"], "mission.stationReplenish": ["Заправка и полная зарядка станции"],
  "mission.stopPolicy": ["Завершение рейса"], "mission.cPrimeMS": ["Предельная скорость", "м/с"], "mission.localDeltaVMS": ["Местный манёвр", "м/с"],
};
type LeafDifference = { path: string; a: unknown; b: unknown };
function changedLeaves(a: unknown, b: unknown, path: string): LeafDifference[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    const x = a as Record<string, unknown>, y = b as Record<string, unknown>;
    return [...new Set([...Object.keys(x), ...Object.keys(y)])].flatMap(key => changedLeaves(x[key], y[key], Array.isArray(a) ? `${path}[${key}]` : `${path}.${key}`));
  }
  return [{ path, a, b }];
}
function conditionValue(s: RunSpecV2, key: string, mission: boolean) {
  return mission ? (missionComparisonInputs(s) as Record<string, unknown>)[key]
    : key === "hull" ? s.resolvedShip.hull.id
    : key === "targetM3" || key === "repeat" || key === "phases" ? s.scenario[key]
    : (s as unknown as Record<string, unknown>)[key];
}
function leafValue(value: unknown, unit?: string) {
  return value === undefined ? "отсутствует" : typeof value === "number" && unit ? num(value, unit)
    : typeof value === "boolean" ? value ? "да" : "нет" : typeof value === "string" ? value : JSON.stringify(value);
}
export function conditionDifferences(a: RunSpecV2, b: RunSpecV2) {
  const check = compareMissionConditions(a, b);
  if (check.comparable) return '<p class="success">Одинаковые условия</p>';
  // Equality остаётся у сценария; этот обход раскрывает только его differing keys.
  const mission = isMissionModel(a.modelVersion) || isMissionModel(b.modelVersion);
  const differences = check.differences.flatMap(key => changedLeaves(conditionValue(a, key, mission), conditionValue(b, key, mission), key));
  return `<div class="condition-differences"><p class="warning">Условия отличаются</p><dl>${differences.map(({ path, a: x, b: y }) => {
    const [label, unit] = labels[path] ?? [path];
    return `<div><dt>${esc(label)}</dt><dd><span>A: <span${typeof x === "number" && unit ? ' class="measurement-value"' : ""}>${esc(leafValue(x, unit))}</span></span> → <span>B: <span${typeof y === "number" && unit ? ' class="measurement-value"' : ""}>${esc(leafValue(y, unit))}</span></span></dd></div>`;
  }).join("")}</dl><details class="condition-snapshots"><summary>Полные условия A/B · JSON</summary><p>Поля проверки: ${check.differences.map(esc).join(" · ")}. Сопоставимость определяет прежняя проверка условий.</p><h4>A</h4><pre>${esc(JSON.stringify(a, null, 2))}</pre><h4>B</h4><pre>${esc(JSON.stringify(b, null, 2))}</pre></details></div>`;
}
