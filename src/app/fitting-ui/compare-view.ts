import type { FittingWorkspace, Variant } from "../fitting-workspace";
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
export type AbView = "both" | "a" | "b";
export function frozenCompare(w: FittingWorkspace, view: AbView = "both") {
  const a = w.getFrozen(),
    b = w.getSelected().result;
  if (!a)
    return "<p>Снимок теста A ещё не зафиксирован. Это отдельная сущность от варианта A.</p>";
  const check = b ? compareMiningConditions(a.spec, b.spec) : undefined,
    aa = compareFields(a),
    bb = b ? compareFields(b) : undefined;
  return `<p>Неизменяемый снимок теста A · run ${esc(a.runId)} · ревизия ${a.spec.resolvedShip.fit.fitRevision}. ${b ? "Текущий результат B · " + esc(b.runId) + " · " + (b.status === "complete" ? "завершён" : b.status === "cancelled" ? "отменён · частичный интервал" : "предварительно") + " · " + num(b.metrics.durationSeconds, "с") : "B ещё не запускался"}</p><p class="${check?.comparable ? "success" : "warning"}">${check ? (check.comparable ? "Одинаковые сырьё, среда, фазы, горизонт и начальные запасы" : "Условия отличаются: " + esc(check.differences.join(" · "))) : "Ждёт тест B"}</p><div class="ab-comparison" data-view="${view}"><div class="ab-view-controls segments" role="group" aria-label="Вид сравнения A и B">${[
    ["both", "Рядом"],
    ["a", "Только A"],
    ["b", "Только B"],
  ]
    .map(
      ([id, label]) =>
        `<button data-ab-view="${id}" aria-pressed="${view === id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="ab-desktop ui-table-scroll" tabindex="0" aria-label="Сравнение снимка A и результата B"><table><thead><tr><th>Метрика</th><th>Снимок A</th><th>Результат B</th><th>Δ B−A</th></tr></thead><tbody>${compareLabels.map((label, i) => `<tr><th>${label}</th><td>${num(aa[i])}</td><td>${num(bb?.[i])}</td><td>${num(aa[i] != null && bb?.[i] != null ? bb[i]! - aa[i]! : null)}</td></tr>`).join("")}</tbody></table></div><div class="ab-rows"><section class="ab-side-a"><h3>Снимок A · ${esc(a.runId)} · ревизия ${a.spec.resolvedShip.fit.fitRevision}</h3><dl>${compareLabels.map((label, i) => `<div><dt>${label}</dt><dd>${num(aa[i])}</dd></div>`).join("")}</dl></section><section class="ab-side-b"><h3>Результат B · ${esc(b?.runId ?? "не измерено")}</h3><dl>${compareLabels.map((label, i) => `<div><dt>${label}</dt><dd>${num(bb?.[i])}<small>Δ B−A ${num(aa[i] != null && bb?.[i] != null ? bb[i]! - aa[i]! : null)}</small></dd></div>`).join("")}</dl></section></div><figure><svg class="ab-plot" viewBox="0 0 650 140" role="img" aria-label="SCU/ч: те же значения, что в таблице"><g class="ab-plot-a"><text x="0" y="25">A ${num(a.metrics.scuPerHour, "SCU/ч")}</text><rect y="35" width="${((a.metrics.scuPerHour ?? 0) / Math.max(1, a.metrics.scuPerHour ?? 0, b?.metrics.scuPerHour ?? 0)) * 600}" height="20" fill="#FFAA33"/></g><g class="ab-plot-b"><text x="0" y="85">B ${num(b?.metrics.scuPerHour, "SCU/ч")}</text><rect y="95" width="${((b?.metrics.scuPerHour ?? 0) / Math.max(1, a.metrics.scuPerHour ?? 0, b?.metrics.scuPerHour ?? 0)) * 600}" height="20" fill="#4DA6FF"/></g></svg><figcaption>SCU/ч из той же таблицы; общий рейтинг не рассчитывается.</figcaption></figure></div>`;
}
export function sortVariants(variants: Variant[], sort: string) {
  const [field, direction] = sort.split("-");
  const value = (v: Variant) =>
    field === "k"
      ? v.result?.metrics.kUseHorizon
      : field === "diesel"
        ? v.result?.metrics.fuelPerScu.diesel
        : v.result?.metrics.scuPerHour;
  return [...variants].sort((a, b) => {
    if (field === "name")
      return (
        (direction === "desc" ? -1 : 1) * a.name.localeCompare(b.name, "ru")
      );
    const x = value(a),
      y = value(b);
    return x == null
      ? y == null
        ? a.name.localeCompare(b.name, "ru")
        : 1
      : y == null
        ? -1
        : (direction === "asc" ? 1 : -1) * (x - y) ||
          a.name.localeCompare(b.name, "ru");
  });
}
export function compareView(
  w: FittingWorkspace,
  sort: string,
  view: AbView = "both",
) {
  const variants = sortVariants(w.getVariants(), sort),
    base = variants.find((v) => v.result)?.result;
  const [metric] = sort.split("-");
  const barValue = (v: Variant) =>
    metric === "k"
      ? v.result?.metrics.kUseHorizon
      : metric === "diesel"
        ? v.result?.metrics.fuelPerScu.diesel
        : v.result?.metrics.scuPerHour;
  const max = Math.max(0, ...variants.map((v) => barValue(v) ?? 0));
  const rows = variants.map((v) => {
    const r = v.result,
      c = base && r ? compareMiningConditions(base.spec, r.spec) : undefined;
    return {
      v,
      r,
      values: [
        num(r?.metrics.usefulWork),
        num(r?.metrics.completedCycles.scu),
        num(r?.metrics.scuPerHour),
        num(
          r?.metrics.kUseHorizon == null ? null : r.metrics.kUseHorizon * 100,
        ),
        num(r?.metrics.fuelPerScu.diesel),
        num(r?.metrics.fuelPerScu.hydrogen),
        r?.metrics.firstLimiter
          ? esc(r.metrics.firstLimiter.causes.join(" + ")) +
            " · " +
            num(r.metrics.firstLimiter.timeSeconds, "с")
          : "не выявлено / нет теста",
        r
          ? (w.getActive()?.variantId === v.id
              ? "предварительно · "
              : r.status === "cancelled"
                ? "отменён · "
                : "") +
            (w.isStale(v) ? "устарело" : "измерено") +
            " · " +
            num(r.metrics.durationSeconds, "с") +
            (c && !c.comparable
              ? " · условия отличаются: " + esc(c.differences.join(", "))
              : c
                ? " · одинаковые условия"
                : "")
          : "не измерено",
      ],
    };
  });
  const labels = [
    "Добыча · SCU",
    "Полные циклы · SCU",
    "SCU/ч",
    "K_use · %",
    "Дизель · кг/SCU",
    "H₂ · кг/SCU",
    "Первое ограничение",
    "Условия / актуальность",
  ];
  const identity = (v: Variant) =>
    `<button data-variant="${v.id}">${esc(v.name)}</button> · ревизия ${v.fit.fitRevision}`;
  return `<section class="ui-panel"><h1>Сравнение вариантов</h1><label>Сортировка<select id="compare-sort">${[
    ["name", "Имя ▲"],
    ["name-desc", "Имя ▼"],
    ["rate-asc", "SCU/ч ▲"],
    ["rate-desc", "SCU/ч ▼"],
    ["k-asc", "K_use ▲"],
    ["k-desc", "K_use ▼"],
    ["diesel-asc", "Дизель ▲"],
    ["diesel-desc", "Дизель ▼"],
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${sort === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><div class="compare-desktop ui-table-scroll" tabindex="0" aria-label="Результаты вариантов"><table><thead><tr><th>Вариант / ревизия</th>${labels.map((label) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${rows.map(({ v, values }) => `<tr data-compare-variant="${v.id}"><th>${identity(v)}</th>${values.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="compare-cards">${rows.map(({ v, values }) => `<article data-compare-variant="${v.id}"><h2>${identity(v)}</h2><dl>${labels.map((label, i) => `<div><dt>${label}</dt><dd>${values[i]}</dd></div>`).join("")}</dl>${metric !== "name" && barValue(v) != null ? `<div class="measurement"><span class="bar"><i style="width:${max ? (barValue(v)! / max) * 100 : 0}%"></i></span><small>Относительная величина выбранной метрики · ${metric === "k" ? "K_use" : metric === "diesel" ? "Дизель кг/SCU" : "SCU/ч"}; не рейтинг</small></div>` : ""}</article>`).join("")}</div><p>Общего рейтинга нет. Устаревшие результаты не предсказывают следующую ревизию.</p></section><section class="ui-panel"><h2>Сравнение тестов A / B</h2>${frozenCompare(w, view)}</section>`;
}
