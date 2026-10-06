import type { RunResultV2 } from "../../runner/run";
import { MODEL_MISSION, type RunSpecV2 } from "../../model/v2/types";
import { compareMissionConditions, missionComparisonInputs } from "../../scenarios/mission";
import { esc, num } from "./presentation";
export function measuredIdentity(r: RunResultV2) {
  const ship = r.spec.resolvedShip, lasers = ship.instances.filter(i => i.item.family === "mining").length;
  const stages:Record<string,string>={outbound:'Перелёт к полю',inbound:'Перелёт к станции',approach:'Местный подход',mining:'Добыча',service:'Обслуживание станции',done:'Рейс завершён',stranded:'Рейс остановлен'};
  return `${esc(r.spec.modelVersion)} · ${r.state.mission ? esc(stages[r.state.mission.stage])+" · " : "старый заданный цикл · "}${esc(ship.hull.label)} · ${lasers} лазеров · трюм ${num(ship.cargoCapacityM3.universal)} / ${num(ship.cargoCapacityM3.bulk)} / ${num(ship.cargoCapacityM3.liquid)} SCU · измерена ревизия ${ship.fit.fitRevision} · run ${esc(r.runId)} · интервал 0–${num(r.metrics.durationSeconds, "с")} · ${r.status === "paused" ? "частичный" : r.status === "cancelled" ? "отменён / частичный" : "завершён"}`;
}
export function conditionDifferences(a: RunSpecV2, b: RunSpecV2) {
  const check = compareMissionConditions(a, b);
  if (check.comparable) return "<p class=\"success\">Одинаковые условия</p>";
  const value = (s: RunSpecV2, key: string) => a.modelVersion===MODEL_MISSION||b.modelVersion===MODEL_MISSION ? (missionComparisonInputs(s) as Record<string,unknown>)[key] : key === "hull" ? { id: s.resolvedShip.hull.id, label: s.resolvedShip.hull.label }
    : key === "targetM3" || key === "repeat" || key === "phases" ? s.scenario[key]
    : (s as unknown as Record<string, unknown>)[key];
  return `<div class="condition-differences"><p class="warning">Условия отличаются: ${check.differences.map(esc).join(" · ")}</p><dl>${check.differences.map(key => `<div><dt>${esc(key)}</dt><dd>База: ${esc(JSON.stringify(value(a, key)))}<br>Этот опыт: ${esc(JSON.stringify(value(b, key)))}</dd></div>`).join("")}</dl></div>`;
}
