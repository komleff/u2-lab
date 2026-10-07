import {fitHull} from "../../fitting/editions";
import type { FittingWorkspace } from "../fitting-workspace";
import { MODEL_MISSION } from "../../model/v2/types";
import type { WorkspaceConditions } from "../../scenarios/mission";
import type { RunResultV2 } from "../../runner/run";
import type { ChannelState } from "./lab-channels";
import { channelsView, selectedBucket } from "./lab-channels";
import { type AbView } from "./compare-view";
import { channelRows, eventMatches, eventLabel } from "./telemetry";
import { stationPolicyLabel } from "./result-context";
import { esc, num, laserNames } from "./presentation";
export const missionStageNames:Record<string,string>={outbound:"Перелёт к полю",approach:"Местный подход",mining:"Добыча",inbound:"Перелёт к станции",service:"Обслуживание станции",done:"Завершён",stranded:"Рейс остановлен"};
const causeNames: Record<string, string> = {
  power: "Питание",
  thermal: "Тепло",
  resource: "Ресурс",
  cargo: "Трюм",
};
export function firstLimiter(r?: RunResultV2) {
  const actual=r?.state.mission ? r.state.mission.firstLimiter : r?.metrics.firstLimiter;
  const full=r?.state.mission&&!actual?r.events.find(e=>e.kind==='cargo-full'):undefined;
  const explanation=actual&&r?.events.find(e=>e.kind.startsWith('diagnostic')&&!['diagnostic-wear','diagnostic-recovered'].includes(e.kind)&&e.timeSeconds>=actual.timeSeconds&&e.timeSeconds<=actual.timeSeconds+r.spec.stepSeconds+1e-8);
  return actual
    ? actual.causes.map((c) => causeNames[c]).join(" + ") +
        " · " +
        num(actual.timeSeconds, "с") + (explanation ? ' · '+esc(explanation.message) : r?.state.mission?.firstLimiter ? " · " + esc(missionStageNames[r.state.mission.firstLimiter.phase]??r.state.mission.firstLimiter.phase) + " · " + esc(r.state.mission.firstLimiter.message) : "")
    : full ? 'Трюм заполнен → возврат · штатное событие цикла · '+num(full.timeSeconds,'с') : r
      ? "не выявлено за измеренный интервал"
      : "ещё не измерено";
}
export function testStatus(
  r: RunResultV2 | undefined,
  active?: "running" | "paused",
) {
  return active === "running"
    ? "Выполняется"
    : active === "paused"
      ? "Пауза"
      : r?.status === "cancelled"
        ? "Отменён"
        : r?.status === "complete"
          ? r.state.mission?.stage === "done" ? "Рейс завершён" : r.state.mission?.stage === "stranded" ? "Рейс остановлен · " + r.state.mission.terminalReason : r.metrics.firstTargetSeconds !== null
            ? "Завершён"
            : "Завершён · задача не завершена в горизонте"
          : r?.status === "paused" ? "Частичный результат" : "Ещё не запускался";
}
export function labView(
  w: FittingWorkspace,
  r: RunResultV2 | undefined,
  c: ChannelState,
  eventFilter: string,
  detailId: string,
  abView: AbView = "both",
) {
  const active = w.getActive();
  if (active && r?.runId !== active.runId) r = undefined;
  const m = r?.metrics,
    state = r?.state,
    spec = active?.spec ?? r?.spec,
    v = w.getSelected(),
    locked = false,
    interval = m
      ? `наблюдаемый интервал 0–${num(m.durationSeconds, "с")} · ${m.intervalLabel}`
      : active ? "ожидается первое измерение текущего теста" : "нет данных до первого теста";
  const missionDraft=v.conditions.modelVersion===MODEL_MISSION;
  const mission=state?.mission;
  const tiles = [
    ["Полезная добыча", num(m?.usefulWork, "SCU")],
    [mission ? "Доставка" : "Темп", num(m?.mission ? m.mission.deliveredScuPerHour : m?.scuPerHour, "SCU/ч")],
    [
      "Использование оснастки",
      num(m?.kUseHorizon == null ? null : m.kUseHorizon * 100, "%"),
    ],
    ["Дизель", num(m?.mission ? m.mission.fuelPerDeliveredScu.diesel : m?.fuelPerScu.diesel, "кг/SCU")],
    ["H₂", num(m?.mission ? m.mission.fuelPerDeliveredScu.hydrogen : m?.fuelPerScu.hydrogen, "кг/SCU")],
    ["Вынужденный простой", num(m?.forcedDowntimeSeconds, "с")],
    ["Частичное снижение выдачи", num(m?.partialLossSeconds, "с")],
    [
      "Восстановление, первое",
      m && m.recovery.firstSeconds === null
        ? m.forcedDowntimeSeconds > 0
          ? "не восстановился"
          : "не потребовалось"
        : num(m?.recovery.firstSeconds, "с"),
    ],
    ["Пик температуры", num(m?.maxTemperatureK, "K")],
  ];
  if(mission)tiles.unshift(["Станционная энергия",num((mission.receivedChargeJ??0)/1e9,"GJ")],["Доставлено",num(mission.deliveredM3,"SCU")],["На борту",num(state.cargo,"SCU")],["Стадия",missionStageNames[mission.stage]],["Перелёт",num(mission.elapsed.flight,"с")],["Добыча · время",num(mission.elapsed.mining,"с")],["Обслуживание",num(mission.elapsed.service,"с")],["Пик скорости",num(mission.peakVelocityMS,"м/с")]);
  const fields:readonly (readonly [keyof WorkspaceConditions,string,string,number])[] = missionDraft ? [
    ["durationSeconds","fit-duration","Горизонт · с",3600],["effectiveBackgroundK","fit-background","Фон · K",100],
    ["distanceM","fit-distance","Станция → поле · км",100000],["targetM3","fit-target","Цель доставки · SCU",10000],
    ["approachSeconds","fit-approach","Местный подход · с",10],["serviceSeconds","fit-service","Обслуживание станции · с",10],
    ["temperatureK","fit-temperature","Температура при первом вылете · K",300],["stepSeconds","fit-dt","Физический шаг · с",.1],
    ["referenceVfaMS","fit-vfa","V_FA · лабораторная гипотеза, м/с",500],["maneuverDuty","fit-maneuver","Доля местного манёвра [0…1]",.1],
    ["densityKgM3","fit-density","Плотность руды · кг/м³",1500],["returnFraction","fit-return","Возврат тепла · доля",.35],
  ] : [
    ["durationSeconds", "fit-duration", "Горизонт · с", 600],
    ["effectiveBackgroundK", "fit-background", "Фон · K", 100],
    ["workSeconds", "fit-work-seconds", "Рабочая фаза · с", 120],
    ["duty", "fit-duty", "Рабочая доля [0…1]", 1],
    ["densityKgM3", "fit-density", "Плотность руды · кг/м³", 1500],
    ["returnFraction", "fit-return", "Возврат тепла · доля", 0.35],
    ["targetM3", "fit-target", "Цель добычи · SCU", 1000],
    ["temperatureK", "fit-temperature", "Начальная температура · K", 300],
    ["stepSeconds", "fit-dt", "Физический шаг · с", .01],
    ["approachSeconds", "fit-approach", "Подход · заданная фаза, с", 10],
    ["brakingSeconds", "fit-braking", "Торможение · заданная фаза, с", 10],
    ["serviceSeconds", "fit-service", "Разгрузка · фаза, с", 10],
    ["idleSeconds", "fit-idle", "Ожидание · фаза, с", 30],
  ];
  const conditions = v.conditions;
  const initial = v.fit.initial;
  const bucket = r ? selectedBucket(r, c) : undefined,
    rows = r ? channelRows(r, bucket) : [],
    names = laserNames(spec?.resolvedShip.instances ?? []),
    events = r?.events.filter((e) => eventMatches(e.kind, eventFilter)) ?? [];
  const lastDiagnosis=r?.events.filter(e=>e.kind.startsWith("diagnostic")&&e.kind!=="diagnostic-wear").at(-1);
  return `<div class="lab-context"><h1>Power & Heat Lab</h1><p>${active ? `Активный тест: вариант ${esc(active.variantName)} · ревизия ${active.fitRevision} · run ${esc(active.runId)}` : `Вариант ${esc(v.name)} · ревизия ${v.fit.fitRevision}`}${r ? ` · измерена ревизия ${r.spec.resolvedShip.fit.fitRevision} · run ${esc(r.runId)}` : ""}</p><p class="muted">${active ? "Активный опыт неизменяем. Форма ниже — следующий черновик, не его текущие условия." : missionDraft ? "Физический рейс: разгон → торможение → добыча → обратный рейс → разгрузка и заправка. Одномерная лабораторная модель." : "Старый лабораторный цикл с заданными фазами; полёт не рассчитывается."}</p></div><div class="lab-columns"><aside class="lab-side"><section class="ui-panel"><h2>Следующий черновик · условия</h2><p>Вариант ${esc(v.name)} · ${esc(fitHull(v.fit,w.catalog)?.label)} · ревизия ${v.fit.fitRevision}</p><div class="condition-fields">${fields.map(([k, id, label, def]) => `<label>${label}<input id="${id}" data-condition="${k}" type="number" step="any" placeholder="—" data-multiplier="${k === "distanceM" ? 1000 : 1}" value="${Number(conditions[k] ?? def)/(k === "distanceM" ? 1000 : 1)}" ${locked ? "disabled" : ""}></label>`).join("")}${missionDraft ? `<label>Остановка добычи<select id="fit-stop-policy"><option value="full-hold" ${conditions.stopPolicy!=="first-stop"?"selected":""}>До полного трюма</option><option value="first-stop" ${conditions.stopPolicy==="first-stop"?"selected":""}>Первый полный стоп группы</option></select></label><label>Крейсерский предел<select id="fit-cruise"><option value="max" ${conditions.cruiseSpeedMS==null?"selected":""}>Макс · без V_FA-предела</option>${[1,2,3,4].map(n=>`<option value="${n*(conditions.referenceVfaMS??500)}" ${v.cruiseMultiplier===n?"selected":""}>${n}×V_FA</option>`).join("")}${conditions.cruiseSpeedMS!=null&&v.cruiseMultiplier===undefined?`<option value="${conditions.cruiseSpeedMS}" selected>Заданный предел: ${conditions.cruiseSpeedMS} м/с</option>`:""}</select></label>`:""}<label><input id="fit-repeat" type="checkbox" ${conditions.repeat === false ? "" : "checked"}>${missionDraft ? "Повторять физические рейсы" : "Повторять заданный цикл"}</label>${missionDraft ? `<label><input id="fit-station-replenish" type="checkbox" ${conditions.stationReplenish===true?"checked":""} aria-describedby="station-policy-note">Заправлять и заряжать</label><p id="station-policy-note" class="muted">${conditions.stationReplenish===undefined?"Старый режим: только топливо, без береговой зарядки. Изменение условий задаёт явное значение галочки. ":""}После полного обслуживания: включено — топливо и полная батарея; выключено — только разгрузка. Лабораторное endpoint-пополнение, без кривой зарядки.</p>` : ""}${[
    ["fit-charge-fraction", "Заряд", "charge"],
    ["fit-fuel-fraction", "Дизель", "diesel"],
    ["fit-h2-fraction", "H₂", "hydrogen"],
  ]
    .map(
      ([id, label, key]) =>
        `<label>Начальный ${label} · доля<input id="${id}" data-initial="${key}" type="number" min="0" max="1" step=".1" placeholder="—" value="${key === "charge" ? (initial.chargeFraction ?? "") : (initial.fuelFraction[key as "diesel"] ?? (active ? "" : 1))}" ${locked ? "disabled" : ""}></label>`,
    )
    .join(
      "",
    )}</div><p class="muted">${missionDraft ? "Добыча заканчивается событием полного трюма или выбранной остановки группы. Разгрузка и заправка — только после прибытия и обслуживания." : "Рабочая фаза — заданная длительность лабораторного сценария, не время до полного трюма."}</p>${spec ? `<p>${active ? "Неизменные фазы активного опыта" : "Фазы измеренного опыта"} · исходная T ${num(spec.initial.temperatureK, "K")} · dt ${num(spec.stepSeconds, "с")}</p><div class="phase-strip">${spec.mission ? `<span>Физический маршрут ${num(spec.mission.distanceM/1000,"км")} · ${stationPolicyLabel(spec)} · ${spec.mission.cruiseSpeedMS===null?"Макс":num(spec.mission.cruiseSpeedMS,"м/с")} · ${spec.mission.stopPolicy==="full-hold"?"до полного трюма":"до первого полного стопа группы"}</span>` : spec.scenario.phases.map((p) => `<span>${esc(p.id)} · ${num(p.durationSeconds, "с")}</span>`).join("")}</div>` : ""}</section></aside><aside class="lab-right"><section class="ui-panel"><h2>Запасы и охлаждение</h2><p>${state ? "На " + num(state.timeSeconds, "с") : "Не измерено"}</p>${
    state
      ? `<dl><div><dt>Заряд</dt><dd>${num(state.chargeJ / 1e6, "МДж")}</dd></div>${Object.entries(
          state.fuelKg,
        )
          .map(
            ([id, q]) =>
              `<div><dt>${esc(id)}</dt><dd>${num(q, "кг")}</dd></div>`,
          )
          .join(
            "",
          )}<div><dt>Трюм на борту</dt><dd>${num(state.cargo, "SCU")}</dd></div><div><dt>Текущая масса</dt><dd>${num(state.currentMassKg, "кг")}</dd></div><div><dt>Корпус</dt><dd>${num(state.temperatureK, "K")}</dd></div>${Object.entries(
          state.buffersJ,
        )
          .map(
            ([id, q]) =>
              `<div><dt>Буфер ${esc(id)}</dt><dd>${num(q / 1e6, "МДж")}</dd></div>`,
          )
          .join("")}</dl>${rows
          .filter((x) =>
            /radiation|Cooling|bufferAbsorb|bufferRelease/.test(x.id),
          )
          .map((x) => `<p>${esc(x.id)}: ${num(x.mean, x.unit)}</p>`)
          .join(
            "",
          )}<p class="muted">Мощности охлаждения — выбранный bucket ${num(bucket?.startSeconds)}–${num(bucket?.endSeconds, "с")}, mean; пик выше относится ко всему измеренному интервалу.</p>`
      : "<p>Запасы и температура появятся после первого измерения.</p>"
  }</section></aside><div class="lab-main"><section id="fit-result" class="ui-panel"><div class="result-heading"><strong>${testStatus(r, active?.status)}</strong><span>${esc(interval)}${!active && w.isStale() ? " · результат устарел" : ""}${active && r ? " · предварительно" : ""}</span></div><div class="first-limiter-summary"><span class="eyebrow">Первый ограничитель · ${mission ? "фактический запрос рейса" : "фактическая потеря выбранной добычи"}</span><strong id="lab-first-limiter">${firstLimiter(r)}</strong><p>${!mission && m?.propulsionShortfall ? "Есть недоставка тяги; заданная длительность фазы не доказывает маршрут." : "Классы причин: питание, тепло, ресурс, трюм. Они берутся из измерений и могут совпадать."}</p></div><p id="lab-diagnostic-note" class="muted">${lastDiagnosis ? "Последнее записанное объяснение принятого шага · "+num(lastDiagnosis.timeSeconds,"с")+" · "+esc(lastDiagnosis.message) : "Подробная диагностика операций отсутствует в этом снимке. Старые результаты не получают выдуманных наблюдений."}</p><div class="result-tiles">${tiles.map(([label, val], i) => `<div class="result-tile ${i === 1 ? "accent" : ""}"><span class="eyebrow">${label}</span><strong>${esc(val)}</strong></div>`).join("")}</div><p class="muted">K_use неизменной выбранной группы включает весь измеренный интервал, перелёт, обслуживание и выключение, а не только рабочую фазу.</p>${
    m
      ? `${mission ? `<p>Масса вылета ${num(mission.outboundMassKg,"кг")} · обратного вылета ${num(mission.inboundMassKg,"кг")} · получено топлива ${Object.entries(mission.receivedFuelKg).map(([sp,q])=>esc(sp)+": "+num(q,"кг")).join(" · ")} · подход ${num(mission.elapsed.approach,"с")} · восстановление ${num(mission.elapsed.recovery,"с")}. ${esc(mission.terminalReason??"")}</p>`:""}<p>Полные циклы: ${m.cyclesCompleted} · добыча в полных циклах ${num(m.completedCycles.scu, "SCU")} · текущий цикл ${num(m.currentCycleScu, "SCU")}. Абсолютный дизель ${num(m.fuelSpeciesKg.diesel, "кг")} · H₂ общий ${num(m.fuelSpeciesKg.hydrogen, "кг")}, из него охладитель ${num(m.h2CoolerKg, "кг")}.</p><p>Восстановления: ${m.recovery.count} · mean ${num(m.recovery.meanSeconds, "с")} · max ${num(m.recovery.maxSeconds, "с")}. Причины перекрываются: ${Object.entries(
          m.causeSeconds,
        )
          .map(([c, t]) => causeNames[c] + ": " + num(t, "с"))
          .join(
            " · ",
          )}. Объединение ${num(m.limitationUnionSeconds, "с")} · перекрытие ${num(m.overlapSeconds, "с")} · частичная потеря ${num(m.partialLossM3, "SCU")}.</p>`
      : ""
  }</section><div id="workspace-charts" class="workspace-section">${channelsView(r, c)}</div><section class="ui-panel"><h2>Модули и каналы экземпляров</h2><div class="ui-table-scroll" tabindex="0" aria-label="Измеренные экземпляры"><table><thead><tr><th>Экземпляр</th><th>Номинал · W</th><th>Доставлено · W</th><th>Луч · W</th><th>Тяга · N</th><th>Ресурс</th></tr></thead><tbody>${
    spec
      ? spec.resolvedShip.instances
          .map((i) => {
            const find = (prefix: string) =>
              rows.find((x) => x.id === prefix + ":" + i.id)?.mean;
            return `<tr><th><button data-instance="${esc(i.id)}">${esc(names.get(i.id) ?? i.item.label)}</button>${names.has(i.id) ? `<small>${esc(i.item.label)}</small>` : ""}<small>${esc(i.id)} · ${i.builtin ? "встроено" : "сменный"}</small></th><td>${num(i.item.numerics.powerW, "W")}</td><td>${num(find("deliveredW"))}</td><td>${num(find("beamW"))}</td><td>${num(find("forceN"))}</td><td>${i.item.species ? esc(i.item.species) : "—"}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="6">Нет снимка теста</td></tr>'
  }</tbody></table></div><p class="muted">Выдача — среднее выбранного bucket ${num(bucket?.startSeconds)}–${num(bucket?.endSeconds, "с")}; номинал из снимка. Нет канала — «—», не DEMO. Сухой bill, пороги и provenance — по кнопке экземпляра.</p></section><section class="ui-panel"><h2>Журнал событий</h2><div class="segments" role="group" aria-label="Фильтры событий">${[
    ["all", "Все"],
    ["limit", "Ограничения"],
    ["thrust", "Недоставка тяги"],
    ["thermal", "Тепловой стоп / рестарт"],
    ["resource", "Ресурсы"],
    ["phase", "Фазы"],
    ["service", "Обслуживание"],
    ["environment", "Среда"],
  ]
    .map(
      ([id, label]) =>
        `<button data-event-filter="${id}" aria-pressed="${eventFilter === id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><label>Экземпляр<select id="event-instance" disabled aria-describedby="event-instance-note"><option>Нет attribution в событиях</option></select></label><p id="event-instance-note" class="muted">Отдельное поле instance отсутствует в текущем payload; фильтрация по экземпляру недоступна. Среда: только реально записанные события, без вывода из текста или метрик.</p><p id="journal-interval" data-selected-start="${bucket?.startSeconds ?? ""}" data-selected-end="${bucket?.endSeconds ?? ""}">Выбранный интервал ${num(bucket?.startSeconds)}–${num(bucket?.endSeconds, "с")}; события внутри выделены. Журнал сохраняет все события текущего фильтра.</p><p id="fit-retention">Показано ${events.length} из видимых ${r?.events.length ?? 0}; всего ${r?.retention.totalEvents ?? 0}, отброшено ${r?.retention.droppedEvents ?? 0}.</p><div id="fit-events" class="ui-table-scroll" tabindex="0" aria-label="События теста"><table><thead><tr><th>Время · с</th><th>Событие</th><th>Факт / причина / экземпляр</th></tr></thead><tbody>${events.map((e) => `<tr class="${bucket && e.timeSeconds >= bucket.startSeconds && e.timeSeconds <= bucket.endSeconds ? "selected-interval" : ""}"><td><button data-event-index="${r!.events.indexOf(e)}" aria-label="Выбрать время события ${num(e.timeSeconds, "с")}">${num(e.timeSeconds)}</button></td><td>${esc(mission?({"cargo-full":"Трюм заполнен → возврат","phase":"Участок рейса","service":"Обслуживание станции","mission-arrival":"Физическое прибытие","constraint":"Временное ограничение / дефицит","recovered":"Выдача восстановлена"} as Record<string,string>)[e.kind]??eventLabel(e.kind):eventLabel(e.kind))}</td><td>${esc(e.message)}<small>Отдельные поля instance/cause отсутствуют в событии; сообщение сохранено буквально.</small></td></tr>`).join("") || '<tr><td colspan="3">Событий по фильтру нет</td></tr>'}</tbody></table></div></section></div></div>`;
}
