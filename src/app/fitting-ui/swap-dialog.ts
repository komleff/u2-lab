import type { FittingWorkspace } from "../fitting-workspace";
import { validateFit } from "../../fitting/validate";
import { fitHull } from "../../fitting/editions";
import {
  esc,
  num,
  mass,
  heatCapacity,
  passport,
  replacement,
  nominal,
  nominalProcess,
  nominalFit,
  miningNominal,
  loadNominal,
} from "./presentation";
export type SwapState = {
  slotId: string;
  candidate: string;
  query: string;
  family: string;
  size: string;
  sort: string;
  batch: boolean;
  returnId: string;
};
export function swapDialog(w: FittingWorkspace, s: SwapState) {
  const f = w.getFit(),
    h = fitHull(f, w.catalog)!,
    slot = h.slots.find((x) => x.id === s.slotId)!,
    installed = f.instances[f.assignments[s.slotId]]?.itemId;
  const items = Object.values({ ...w.catalog.items, ...f.localVariants });
  const process = nominalProcess(w);
  const [field, direction] = s.sort.split("-");
  const metric = (m: (typeof items)[number]) =>
    field === "mass"
      ? mass(m)
      : field === "cargo"
        ? Object.values(
            passport(
              replacement(f, w.catalog, s.slotId, m.id, s.batch),
              w.catalog,
            ).cargo,
          ).reduce((n, x) => n + x, 0)
        : field === "power"
          ? loadNominal(m)
          : field === "mining"
            ? miningNominal(m, process)
            : field === "lasers"
              ? nominalFit(
                  replacement(f, w.catalog, s.slotId, m.id, s.batch),
                  w.catalog,
                  process,
                ).lasers
              : null;
  const compare = (a: (typeof items)[number], b: (typeof items)[number]) => {
    if (field === "source")
      return (
        (direction === "desc" ? -1 : 1) *
        Object.values(a.origins)
          .map((o) => o.sourceRef)
          .join(";")
          .localeCompare(
            Object.values(b.origins)
              .map((o) => o.sourceRef)
              .join(";"),
            "ru",
          )
      );
    if (field === "name")
      return (
        (direction === "desc" ? -1 : 1) * a.label.localeCompare(b.label, "ru")
      );
    const x = metric(a),
      y = metric(b);
    return x === null
      ? y === null
        ? 0
        : 1
      : y === null
        ? -1
        : (direction === "asc" ? 1 : -1) * (x - y);
  };
  const shown = items
    .filter(
      (m) =>
        (!s.query ||
          m.label
            .toLocaleLowerCase("ru")
            .includes(s.query.toLocaleLowerCase("ru"))) &&
        (s.family === "all" || m.family === s.family) &&
        (s.size === "all" || m.size === s.size),
    )
    .map((m) => ({
      m,
      v: validateFit(
        replacement(f, w.catalog, s.slotId, m.id, s.batch),
        w.catalog,
      ),
    }))
    .sort(
      (a, b) =>
        Number(b.v.valid) - Number(a.v.valid) ||
        compare(a.m, b.m) ||
        a.m.label.localeCompare(b.m.label, "ru"),
    );
  const item = items.find((m) => m.id === s.candidate),
    candidate = item
      ? replacement(f, w.catalog, s.slotId, item.id, s.batch)
      : undefined,
    validation = candidate ? validateFit(candidate, w.catalog) : undefined,
    before = passport(f, w.catalog),
    after = candidate ? passport(candidate, w.catalog) : undefined;
  const beforeNominal = nominalFit(f, w.catalog, process),
    afterNominal = candidate
      ? nominalFit(candidate, w.catalog, process)
      : undefined;
  const all = slot.category === "payload";
  return `<div class="dialog-header"><h2 id="swap-title">${installed ? "Заменить" : "Установить"}: ${esc(slot.id)} · слот ${slot.size}</h2><button id="swap-close" aria-label="Закрыть окно замены">✕</button></div><div class="dialog-body"><div class="filters"><label>Поиск изделий<input id="swap-search" type="search" value="${esc(s.query)}" placeholder="Название изделия"></label><label>Семейство<select id="swap-family"><option value="all">Все</option>${[...new Set(items.map((m) => m.family))].map((x) => `<option ${s.family === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Калибр<select id="swap-size"><option value="all">Все</option>${["XS", "S", "M", "L", "XL", "XXL"].map((x) => `<option ${s.size === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Сортировка<select id="swap-sort">${[
    ["name", "Название ▲"],
    ["name-desc", "Название ▼"],
    ["mass-asc", "Масса ▲"],
    ["mass-desc", "Масса ▼"],
    ["cargo-asc", "Объём SCU ▲"],
    ["cargo-desc", "Объём SCU ▼"],
    ["power-asc", "Потребление ▲"],
    ["power-desc", "Потребление ▼"],
    ["mining-asc", "Добыча ▲"],
    ["mining-desc", "Добыча ▼"],
    ["lasers-asc", "Лазеров после ▲"],
    ["lasers-desc", "Лазеров после ▼"],
    ["source-asc", "Источник ▲"],
    ["source-desc", "Источник ▼"],
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${s.sort === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label></div><p class="muted">${shown.filter((x) => x.v.valid).length} подходят · ${shown.filter((x) => !x.v.valid).length} с отказом · номинальные параметры</p><div class="catalog-head segments" role="group" aria-label="Сортировка по колонкам">${[
    ["name", "Изделие"],
    ["power", "Потребление"],
    ["mining", "Номинал добычи"],
    ["mass", "Масса"],
    ["cargo", "Трюм после"],
    ["lasers", "Лазеров после"],
    ["source", "Источник"],
  ]
    .map(
      ([id, label]) =>
        `<button data-catalog-sort="${id}-${field === id && direction !== "asc" ? "asc" : "desc"}" aria-pressed="${field === id}">${label}${field === id ? (direction === "asc" ? " ▲" : " ▼") : ""}</button>`,
    )
    .join(
      "",
    )}<span class="muted">Объём модуля: отсутствует в каталоге</span></div><p class="muted">Дельта активной числовой колонки — к установленному изделию; совместимые кандидаты всегда первыми.</p><div class="catalog-list" role="group" aria-label="Каталог изделий">${
    shown
      .map(
        ({ m, v }) =>
          `<button class="catalog-row ${m.id === s.candidate ? "selected" : ""} ${!v.valid ? "incompatible" : ""}" data-candidate="${esc(m.id)}" aria-pressed="${m.id === s.candidate}"><span class="calibre">${m.size}</span><span><strong>${esc(m.label)}</strong><span class="muted">${m.family} · производитель не указан ${m.id === installed ? "· установлено" : ""}</span>${
            !v.valid
              ? `<span class="warning">Не подходит: ${esc(
                  v.issues
                    .filter((x) => x.severity === "error")
                    .map((x) => x.message)
                    .join(" · "),
                )}</span>`
              : ""
          }</span><span class="catalog-metrics">${nominal(m)}${["power", "mining", "mass", "cargo", "lasers"].includes(field) ? `<small>Δ активной колонки: ${num(metric(m) !== null && items.find((x) => x.id === installed) && metric(items.find((x) => x.id === installed)!) !== null ? metric(m)! - metric(items.find((x) => x.id === installed)!)! : null, field === "power" ? "W" : field === "mining" ? "SCU/с" : field === "mass" ? "кг" : field === "cargo" ? "SCU" : "лазеров", 7)}</small>` : ""}<small>Масса ${num(mass(m), "кг")} · C ${num(heatCapacity(m), "Дж/K")}</small><small>Объём изделия: не указан</small><small>Потребление: ${num(loadNominal(m) == null ? null : loadNominal(m)! / 1e6, "МВт")}${loadNominal(m) === null ? " · зависит от температуры" : ""}</small><small>Добыча: ${num(miningNominal(m, process), "SCU/с", 7)}</small><small>Лазеров после: ${nominalFit(replacement(f, w.catalog, s.slotId, m.id, s.batch), w.catalog, process).lasers} · номинал ${num(nominalFit(replacement(f, w.catalog, s.slotId, m.id, s.batch), w.catalog, process).miningScuS, "SCU/с", 7)}</small><small>Трюм после · SCU (унив. / нав. / жидк.): ${Object.values(
            passport(
              replacement(f, w.catalog, s.slotId, m.id, s.batch),
              w.catalog,
            ).cargo,
          )
            .map((x) => num(x))
            .join(
              " / ",
            )}</small><small>Источник: ${esc([...new Set(Object.values(m.origins).map((o) => o.kind + " · " + o.sourceRef))].join("; "))}</small></span></button>`,
      )
      .join("") || "<p>Ничего не найдено. Измените фильтры.</p>"
  }</div><section id="fit-preview" aria-label="Предпросмотр всей сборки"><h3>Вся сборка: сейчас → после</h3>${
    after
      ? `<dl><div data-delta-power-w="${beforeNominal.powerW !== null && afterNominal!.powerW !== null ? afterNominal!.powerW - beforeNominal.powerW : "unavailable"}"><dt>Потребление всей сборки · номинальное</dt><dd>${num(beforeNominal.powerW == null ? null : beforeNominal.powerW / 1e6, "МВт")} → ${num(afterNominal!.powerW == null ? null : afterNominal!.powerW / 1e6, "МВт")} · Δ ${num(beforeNominal.powerW !== null && afterNominal!.powerW !== null ? (afterNominal!.powerW - beforeNominal.powerW) / 1e6 : null, "МВт")}</dd></div><div data-delta-mining-scu-s="${beforeNominal.miningScuS !== null && afterNominal!.miningScuS !== null ? afterNominal!.miningScuS - beforeNominal.miningScuS : "unavailable"}"><dt>Добыча всей сборки · номинальная</dt><dd>${num(beforeNominal.miningScuS, "SCU/с", 7)} → ${num(afterNominal!.miningScuS, "SCU/с", 7)} · Δ ${num(beforeNominal.miningScuS !== null && afterNominal!.miningScuS !== null ? afterNominal!.miningScuS - beforeNominal.miningScuS : null, "SCU/с", 7)}</dd></div><div><dt>Лазеров после</dt><dd>${beforeNominal.lasers} → ${afterNominal!.lasers}</dd></div><div><dt>Сухая масса</dt><dd>${num(before.dryMassKg, "кг")} → ${num(after.dryMassKg, "кг")} · Δ ${num(after.dryMassKg - before.dryMassKg, "кг")}</dd></div><div><dt>C</dt><dd>${num(before.heatCapacityJK, "Дж/K")} → ${num(after.heatCapacityJK, "Дж/K")}</dd></div><div><dt>Трюм универсальный / навалочный / жидкий</dt><dd>${Object.values(
          before.cargo,
        )
          .map((x) => num(x))
          .join(" / ")} → ${Object.values(after.cargo)
          .map((x) => num(x))
          .join(
            " / ",
          )} SCU</dd></div></dl><p class="muted">Номинальная постоянная нагрузка и добыча при запросе 100% · текущий процесс ${esc(process?.id ?? "не доступен")}. Генерация и химическая мощность не являются потреблением шины. Термоинвертор зависит от температуры: «—» вместо скрытого допущения. Это не измеренный результат.</p>${afterNominal!.lasers === 0 && beforeNominal.lasers > 0 ? '<p class="warning">Снимается последний лазер; добыча после — 0.</p>' : ""}<p>${s.batch ? h.slots.filter((x) => x.category === "payload").length + " сменных Payload · встроенные исключены" : esc(slot.id)}</p><p>${
          validation?.valid
            ? "Монтаж совместим"
            : esc(
                validation?.issues
                  .filter((x) => x.severity === "error")
                  .map((x) => x.message)
                  .join(" · "),
              )
        }</p>${validation?.readiness.missing.length ? `<p class="warning">Сборка неполная: ${esc(validation.readiness.missing.join(" · "))}</p>` : ""}<details><summary>Объявленные ТТХ и происхождение ${f.localVariants[item!.id] ? "· локальный вариант" : ""}</summary><pre>${esc(JSON.stringify(item, null, 2))}</pre></details>`
      : "<p>Выберите изделие для предпросмотра.</p>"
  }</section></div><div class="dialog-footer">${all ? `<label><input id="swap-batch" type="checkbox" ${s.batch ? "checked" : ""}>Все сменные Payload</label>` : ""}<button id="fit-remove" ${!installed ? "disabled" : ""}>Снять изделие</button><button id="fit-apply" class="primary" ${!validation?.valid || (s.candidate === installed && !s.batch) ? "disabled" : ""}>Применить замену</button><p class="muted">Снятие обязательного изделия допустимо; неполная сборка не запустится.</p></div>`;
}
