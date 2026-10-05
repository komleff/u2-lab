import type { FittingWorkspace } from "../fitting-workspace";
import type { RunResultV2 } from "../../runner/run";
import { compareMiningConditions } from "../../scenarios/fitting";
import { esc, num } from "./presentation";
export const compareFields = (r: RunResultV2) => [
  r.metrics.usefulWork,
  r.metrics.scuPerHour,
  r.metrics.kUseHorizon == null ? null : r.metrics.kUseHorizon * 100,
  r.metrics.fuelPerScu.diesel,
  r.metrics.fuelPerScu.hydrogen,
  r.metrics.forcedDowntimeSeconds,
  r.metrics.recovery.firstSeconds,
];
export const compareLabels = [
  "Добыча · SCU",
  "SCU/ч",
  "K_use · %",
  "Дизель · кг/SCU",
  "H₂ · кг/SCU",
  "Вынужденный простой · с",
  "Первое восстановление · с",
];
export function frozenCompare(w: FittingWorkspace) {
  const a = w.getFrozen(),
    b = w.getSelected().result;
  if (!a)
    return "<p>Снимок теста A ещё не зафиксирован. Это отдельная сущность от варианта A.</p>";
  const check = b ? compareMiningConditions(a.spec, b.spec) : undefined,
    aa = compareFields(a),
    bb = b ? compareFields(b) : undefined;
  return `<p>Неизменяемый снимок теста A · run ${esc(a.runId)} · ревизия ${a.spec.resolvedShip.fit.fitRevision}. ${b ? "Текущий результат B · " + esc(b.runId) + " · " + (b.status === "complete" ? "завершён" : b.status === "cancelled" ? "отменён · частичный интервал" : "предварительно") + " · " + num(b.metrics.durationSeconds, "с") : "B ещё не запускался"}</p><p class="${check?.comparable ? "success" : "warning"}">${check ? (check.comparable ? "Одинаковые сырьё, среда, фазы, горизонт и начальные запасы" : "Условия отличаются: " + esc(check.differences.join(" · "))) : "Ждёт тест B"}</p><div class="ui-table-scroll" tabindex="0" aria-label="Сравнение снимка A и результата B"><table><thead><tr><th>Метрика</th><th>Снимок A</th><th>Результат B</th><th>Δ B−A</th></tr></thead><tbody>${compareLabels.map((label, i) => `<tr><th>${label}</th><td>${num(aa[i])}</td><td>${num(bb?.[i])}</td><td>${num(aa[i] != null && bb?.[i] != null ? bb[i]! - aa[i]! : null)}</td></tr>`).join("")}</tbody></table></div><figure><svg class="ab-plot" viewBox="0 0 650 140" role="img" aria-label="SCU/ч: те же значения, что в таблице"><text x="0" y="25">A ${num(a.metrics.scuPerHour, "SCU/ч")}</text><rect y="35" width="${((a.metrics.scuPerHour ?? 0) / Math.max(1, a.metrics.scuPerHour ?? 0, b?.metrics.scuPerHour ?? 0)) * 600}" height="20" fill="#FFAA33"/><text x="0" y="85">B ${num(b?.metrics.scuPerHour, "SCU/ч")}</text><rect y="95" width="${((b?.metrics.scuPerHour ?? 0) / Math.max(1, a.metrics.scuPerHour ?? 0, b?.metrics.scuPerHour ?? 0)) * 600}" height="20" fill="#4DA6FF"/></svg><figcaption>SCU/ч из той же таблицы; общий рейтинг не рассчитывается.</figcaption></figure>`;
}
export function compareView(w: FittingWorkspace, sort: string) {
  const variants = w
    .getVariants()
    .sort((a, b) =>
      sort === "rate"
        ? (b.result?.metrics.scuPerHour ?? -Infinity) -
          (a.result?.metrics.scuPerHour ?? -Infinity)
        : a.name.localeCompare(b.name, "ru"),
    );
  const base = variants.find((v) => v.result)?.result;
  return `<section class="ui-panel"><h1>Сравнение вариантов</h1><label>Сортировка<select id="compare-sort"><option value="name" ${sort === "name" ? "selected" : ""}>Имя</option><option value="rate" ${sort === "rate" ? "selected" : ""}>SCU/ч ▼</option></select></label><div class="ui-table-scroll" tabindex="0" aria-label="Результаты вариантов"><table><thead><tr><th>Вариант / ревизия</th><th>Добыча · SCU</th><th>Полные циклы · SCU</th><th>SCU/ч</th><th>K_use · %</th><th>Дизель · кг/SCU</th><th>H₂ · кг/SCU</th><th>Первое ограничение</th><th>Условия / актуальность</th></tr></thead><tbody>${variants
    .map((v) => {
      const r = v.result,
        c = base && r ? compareMiningConditions(base.spec, r.spec) : undefined;
      return `<tr><th><button data-variant="${v.id}">${esc(v.name)}</button> · ${v.fit.fitRevision}</th><td>${num(r?.metrics.usefulWork)}</td><td>${num(r?.metrics.completedCycles.scu)}</td><td>${num(r?.metrics.scuPerHour)}</td><td>${num(r?.metrics.kUseHorizon == null ? null : r.metrics.kUseHorizon * 100)}</td><td>${num(r?.metrics.fuelPerScu.diesel)}</td><td>${num(r?.metrics.fuelPerScu.hydrogen)}</td><td>${r?.metrics.firstLimiter ? esc(r.metrics.firstLimiter.causes.join(" + ")) + " · " + num(r.metrics.firstLimiter.timeSeconds, "с") : "не выявлено / нет теста"}</td><td>${r ? (w.getActive()?.variantId === v.id ? "предварительно · " : r.status === "cancelled" ? "отменён · " : "") + (w.isStale(v) ? "устарело" : "измерено") + " · " + num(r.metrics.durationSeconds, "с") : "не измерено"}${c && !c.comparable ? " · условия отличаются: " + esc(c.differences.join(", ")) : c ? " · одинаковые условия" : ""}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div><p>Общего рейтинга нет. Устаревшие результаты не предсказывают следующую ревизию.</p></section><section class="ui-panel"><h2>Сравнение тестов A / B</h2>${frozenCompare(w)}</section>`;
}
