import type { FittingWorkspace } from "../fitting-workspace";
import { validateFit } from "../../fitting/validate";
import {
  esc,
  num,
  mass,
  heatCapacity,
  passport,
  replacement,
  nominal,
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
    h = w.catalog.hulls.find((x) => x.id === f.hullId)!,
    slot = h.slots.find((x) => x.id === s.slotId)!,
    installed = f.instances[f.assignments[s.slotId]]?.itemId;
  const items = Object.values({ ...w.catalog.items, ...f.localVariants });
  const metric = (m: (typeof items)[number]) =>
    s.sort === "mass"
      ? mass(m)
      : s.sort === "cargo"
        ? (m.numerics.cargoM3 ?? 0)
        : s.sort === "power"
          ? (m.numerics.powerW ?? 0)
          : 0;
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
        (s.sort === "name"
          ? a.m.label.localeCompare(b.m.label, "ru")
          : metric(b.m) - metric(a.m)),
    );
  const item = items.find((m) => m.id === s.candidate),
    candidate = item
      ? replacement(f, w.catalog, s.slotId, item.id, s.batch)
      : undefined,
    validation = candidate ? validateFit(candidate, w.catalog) : undefined,
    before = passport(f, w.catalog),
    after = candidate ? passport(candidate, w.catalog) : undefined;
  const all = slot.category === "payload";
  return `<div class="dialog-header"><h2 id="swap-title">${installed ? "Заменить" : "Установить"}: ${esc(slot.id)} · слот ${slot.size}</h2><button id="swap-close" aria-label="Закрыть окно замены">✕</button></div><div class="dialog-body"><div class="filters"><label>Поиск изделий<input id="swap-search" type="search" value="${esc(s.query)}" placeholder="Название изделия"></label><label>Семейство<select id="swap-family"><option value="all">Все</option>${[...new Set(items.map((m) => m.family))].map((x) => `<option ${s.family === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Калибр<select id="swap-size"><option value="all">Все</option>${["XS", "S", "M", "L", "XL", "XXL"].map((x) => `<option ${s.size === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Сортировка<select id="swap-sort">${[
    ["name", "Название"],
    ["mass", "Масса ▼"],
    ["cargo", "Объём SCU ▼"],
    ["power", "Потребление ▼"],
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${s.sort === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label></div><p class="muted">${shown.filter((x) => x.v.valid).length} подходят · ${shown.filter((x) => !x.v.valid).length} с отказом · номинальные параметры</p><div class="catalog-list" role="group" aria-label="Каталог изделий">${
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
          }</span><span>${nominal(m)}<small>${num(mass(m), "кг")} · C ${num(heatCapacity(m), "Дж/K")}</small></span></button>`,
      )
      .join("") || "<p>Ничего не найдено. Измените фильтры.</p>"
  }</div><section id="fit-preview" aria-label="Предпросмотр всей сборки"><h3>Вся сборка: сейчас → после</h3>${
    after
      ? `<dl><div><dt>Сухая масса</dt><dd>${num(before.dryMassKg, "кг")} → ${num(after.dryMassKg, "кг")} · Δ ${num(after.dryMassKg - before.dryMassKg, "кг")}</dd></div><div><dt>C</dt><dd>${num(before.heatCapacityJK, "Дж/K")} → ${num(after.heatCapacityJK, "Дж/K")}</dd></div><div><dt>Трюм универсальный / навалочный / жидкий</dt><dd>${Object.values(
          before.cargo,
        )
          .map((x) => num(x))
          .join(" / ")} → ${Object.values(after.cargo)
          .map((x) => num(x))
          .join(
            " / ",
          )} SCU</dd></div></dl><p>${s.batch ? h.slots.filter((x) => x.category === "payload").length + " сменных Payload · встроенные исключены" : esc(slot.id)}</p><p>${
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
