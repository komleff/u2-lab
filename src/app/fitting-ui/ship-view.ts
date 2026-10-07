import { MODEL_MISSION } from "../../model/v2/types";
import { FittingWorkspace } from "../fitting-workspace";
import { installedInstances, validateFit } from "../../fitting/validate";
import { presetOptions, matchesPreset } from "../../fitting/catalog";
import { fitHull } from "../../fitting/editions";
import {
  esc,
  num,
  resultRate,
  groups,
  groupNames,
  roleNames,
  passport,
  slotLayout,
  moduleProfile,
  nominalProcess,
  laserNames,
  snapshotMatches,
} from "./presentation";
import { bucketValue } from "./telemetry";
export function shipView(
  w: FittingWorkspace,
  width: number,
  collapsed: Set<string>,
) {
  const fit = w.getFit(),
    h = fitHull(fit, w.catalog)!,
    v = validateFit(fit, w.catalog),
    p = passport(fit, w.catalog),
    roster = installedInstances(fit, w.catalog),
    names = laserNames(roster),
    selected = w.getSelected(),
    r = selected.result,
    stale = w.isStale(),
    previous = w.isPreviousResult(selected),
    process = nominalProcess(w);
  const all = [
      ...h.slots.map((s) => ({
        id: s.id,
        category: s.category,
        builtin: false,
      })),
      ...h.builtins.map((b) => ({
        id: b.id,
        category: b.item.category,
        builtin: true,
      })),
    ],
    layout = slotLayout(all, width);
  const presets = presetOptions(w.catalog), selectedPreset = presets.find(p => matchesPreset(fit, p.fit));
  const presetMarkup = `${selectedPreset ? "" : `<option value="" selected>Текущая ${fit.catalogVersion !== w.catalog.version ? "сохранённая" : "пользовательская"} сборка · ${esc(h.label)}</option>`}${presets.map(p => `<option value="${esc(p.id)}" ${selectedPreset?.id === p.id ? "selected" : ""}>${esc(p.label)}</option>`).join("")}`;
  const numberMarkup = `<dl class="passport-numbers"><div><dt>V_FA корпуса</dt><dd title="${esc(h.origins.referenceVfaMS?.note??'В прежнем профиле не записана')}">${num(h.referenceVfaMS, "м/с")}</dd></div><div><dt>Сухая масса</dt><dd>${num(p.dryMassKg / 1000, "т")}</dd></div><div><dt>Теплоёмкость C</dt><dd>${num(p.heatCapacityJK / 1000, "кДж/K")}</dd></div><div><dt>Универсальный трюм</dt><dd>${num(p.cargo.universal, "SCU")}</dd></div><div><dt>Навалочный / жидкий</dt><dd>${num(p.cargo.bulk)} / ${num(p.cargo.liquid, "SCU")}</dd></div></dl>`;
  const hero = `<div class="ship-passport">${h.id === "industrial-M" ? `<img class="ship-art" src="${import.meta.env.BASE_URL}assets/titan-640.webp" alt="Титан — визуальная иллюстрация лабораторного профиля"><span class="muted">лабораторный профиль Industrial M · экспериментальный</span>` : ""}<span class="muted">производитель не указан</span><p class="muted" id="fit-edition">Редакция каталога: ${esc(fit.catalogVersion)}</p><h1>${esc(h.label)}</h1><div class="chips"><span>${h.size}</span><span>${esc(h.class)}</span><span>G${h.generation}</span><span>Архитектура ${h.architecture}</span></div>${numberMarkup}<p class="muted">${p.complete ? "Текущая сборка" : "Текущая неполная сборка"} · SCU = м³ · содержимое меняет массу, а не C.</p><label>Применить целый пресет — заменяет монтаж выбранного черновика<select id="fit-preset">${presetMarkup}</select></label></div>`;
  const ring = layout.ring
    ? `<div class="slot-ring" aria-label="Обзор слотов"><div class="ring-center"><h2>${esc(h.label)}</h2><p>${h.size} · схема слотов</p></div><svg class="ring-sector" viewBox="0 0 440 440" aria-hidden="true">${layout.sectors
        .map((s) => {
          const point = (deg: number) => ({
            x: 220 + 175 * Math.cos((deg * Math.PI) / 180),
            y: 220 + 175 * Math.sin((deg * Math.PI) / 180),
          });
          const a = point(s.start),
            b = point(s.end);
          return `<path d="M ${a.x} ${a.y} A 175 175 0 ${s.end - s.start > 180 ? 1 : 0} 1 ${b.x} ${b.y}" class="sector-${s.category}"/>`;
        })
        .join("")}</svg>${layout.nodes
        .map((n) => {
          const slot = h.slots.find((x) => x.id === n.id),
            i = roster.find((x) => x.id === n.id || x.slotId === n.id);
          return `<button ${n.builtin ? "" : `id="slot-${esc(n.id)}-ring"`} class="ring-node ${n.builtin ? "builtin" : ""} ${!i && slot?.mandatory ? "invalid" : ""}" style="left:${n.x}px;top:${n.y}px" data-${n.builtin ? "instance" : "slot"}="${esc(n.builtin ? (i?.id ?? n.id) : n.id)}" aria-label="${n.builtin ? "Встроено, заменить нельзя: " : "Заменить: "}${esc(names.get(i?.id ?? "") ?? i?.item.label ?? slot?.id)}">${n.builtin ? "🔒" : itemIcon(i?.item?.family)}<small>${esc(i?.item.size ?? slot?.size)}</small></button>`;
        })
        .join("")}</div>`
    : hero;
  return `<section class="ship-hero" data-layout="flat">${hero}<aside class="hero-result"><span class="eyebrow">Добыча LAB-ORE-01</span><h2>Оснастка для следующего теста</h2><p>${selected.conditions.modelVersion===MODEL_MISSION?"Физический рейс до полного трюма: проверьте тягу, топливо, питание, охлаждение и грузовую ёмкость.":"Старый лабораторный сценарий с фиксированными фазами."}</p><p class="muted">Номинал не предсказывает фактическую добычу. ${selected.conditions.modelVersion===MODEL_MISSION?"Перелёт использует действительную тягу, массу, топливо и тепло; V_FA — лабораторная гипотеза.":"Заданные импульсы тяги не рассчитывают расстояние и ETA."}</p><div class="metric-focus">${resultRate(r)}</div><p>${r ? `${previous ? "Предыдущий тест · run " + esc(r.runId) + (stale ? " · устарело" : "") : stale ? "Устаревший результат" : "Результат"} · ревизия ${r.spec.resolvedShip.fit.fitRevision} · ${num(r.metrics.durationSeconds, "с")}` : "Измерения появятся после первого теста"}</p><p class="warning">${v.readiness.resourceWarnings.map((x) => esc(x.message)).join(" · ")}</p></aside></section><details class="ui-panel" id="fit-ring"><summary>Схема слотов · дополнительный обзор</summary>${layout.ring ? ring : "<p>Кольцо не помещается с безопасными интервалами. Все слоты доступны в списке ниже.</p>"}</details><div class="systems" id="fit-slots">${groups
    .map((cat) => {
      const slots = h.slots.filter((x) => x.category === cat),
        builtins = h.builtins.filter((x) => x.item.category === cat);
      return `<section class="system system-${cat}"><h2><button class="group-toggle" data-group="${cat}" aria-expanded="${!collapsed.has(cat)}"><span class="sq ${slots.some((s) => s.mandatory && !fit.assignments[s.id]) ? "error-sq" : "ok"}"></span>${groupNames[cat]} <span class="muted">${slots.filter((s) => fit.assignments[s.id]).length} / ${slots.length} сменных · ${builtins.length} встроенных</span><span class="chevron">${collapsed.has(cat) ? "▼" : "▲"}</span></button></h2>${
        collapsed.has(cat)
          ? ""
          : `<div class="module-grid">${[
              ...builtins.map((b) => ({
                id: b.id,
                item: b.item,
                builtin: true,
                slot: undefined,
                enabled: fit.builtinModes?.[b.id]?.enabled !== false,
              })),
              ...slots.map((s) => {
                const i = roster.find((x) => x.slotId === s.id);
                return {
                  id: i?.id ?? s.id,
                  item: i?.item,
                  builtin: false,
                  slot: s,
                  enabled: i?.enabled ?? false,
                };
              }),
            ]
              .map((x) => {
                const m = x.item,
                  measured = roster.find((i) => i.id === x.id),
                  same = measured && snapshotMatches(measured, r, fit),
                  b = r?.buckets.at(-1),
                  del =
                    m && same && r && b
                      ? bucketValue(r, b, "deliveredW:" + x.id)
                      : null;
                const requested = r?.spec.resolvedShip.instances.find(
                  (i) => i.id === x.id,
                )?.item.numerics.powerW;
                const pct =
                  del !== null && requested && requested > 0
                    ? (del / requested) * 100
                    : null;
                return `<div class="module-wrapper"><button ${x.builtin ? `id="instance-${esc(x.id)}"` : `id="slot-${esc(x.slot?.id)}"`} data-${x.builtin ? "instance" : "slot"}="${esc(x.builtin ? x.id : x.slot?.id)}" class="module-card ${x.builtin ? "builtin" : ""} ${!m && x.slot?.mandatory ? "invalid" : ""}"><div class="module-top"><span class="calibre">${esc(m?.size ?? x.slot?.size)}</span><div><span class="eyebrow">${x.builtin ? "🔒 Встроено · заменить нельзя" : `${esc(x.slot?.id)} · слот ${x.slot?.size}`}</span><h3>${esc(names.get(x.id) ?? roleNames[x.slot?.role ?? ""] ?? m?.label ?? (x.slot?.mandatory ? "Пустой обязательный слот" : "Пусто"))}</h3>${(x.slot?.role || names.has(x.id)) && m ? `<p>${esc(m.label)}</p>` : ""}</div></div>${m ? `<div class="module-profile">${moduleProfile(m, process)}</div>${fit.localVariants[m.id] ? '<p class="muted">Локальная гипотеза · ТТХ под i</p>' : ""}` : ""}${pct !== null ? `<div class="measurement"><span class="bar"><i style="width:${Math.max(0, Math.min(100, pct!))}%"></i></span>${num(pct, "% номинала")} · ${previous ? "предыдущий тест · run " + esc(r!.runId) + " · " : ""}${stale ? "устарело · " : ""}bucket ${num(b!.startSeconds)}–${num(b!.endSeconds, "с")}</div>` : r && !same && m ? '<p class="warning">не измерено — изменено после теста</p>' : ""}<span class="card-action-label">${x.builtin ? "Параметры" : m ? "Заменить" : "Установить"}</span></button>${m ? `<button class="module-info-button" id="info-${esc(x.id)}" data-instance="${esc(x.id)}" aria-label="Технические сведения: ${esc(m.label)}">i</button>` : ""}${m && (!x.builtin || m.family === "mining") ? `<label class="card-enable"><input type="checkbox" data-enable="${esc(x.id)}" ${x.builtin ? 'data-builtin="true"' : ""} ${x.enabled ? "checked" : ""}>Включён · ${esc(names.get(x.id) ?? m.label)}</label>` : ""}</div>`;
              })
              .join(
                "",
              )}</div>${cat === "signature" ? '<p class="muted">Тепловое оборудование; обнаружение пока не рассчитывается.</p>' : ""}`
      }</section>`;
    })
    .join("")}</div>`;
}
function itemIcon(family: string | undefined) {
  const paths: Record<string, string> = {
    mining: "M3 12h10M13 8v8M16 12h5M18 9l3 3-3 3",
    cargo: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
    engine: "M5 8h8l4-3v14l-4-3H5zM17 9h3M17 15h3",
    generator: "M13 3L6 14h5l-1 7 7-11h-5z",
    battery: "M4 8h14v8H4zM18 11h2v2h-2zM7 11v2M10 11v2",
    tank: "M7 5h10v14H7zM7 9h10M7 15h10",
    solar: "M3 8h18l-3 8H6zM9 8l-1 8M15 8l1 8",
    radiator: "M5 4v16M9 4v16M13 4v16M17 4v16M3 12h18",
    buffer: "M4 7h16M4 12h16M4 17h16",
    h2: "M12 3v18M4 8l16 8M20 8L4 16",
    thermoinverter: "M4 12h6l2-5 2 10 2-5h4",
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[family ?? ""] ?? "M8 12h8M12 8v8"}" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>`;
}
