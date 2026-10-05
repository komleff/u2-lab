import "./styles.css";
import { presets, moduleBase, markEdits } from "../catalog/presets";
import type {
  RunSpec,
  Module,
  TickTelemetry,
  ModelState,
} from "../model/types";
import { capacity, initialState } from "../model/types";
import {
  parseRunJson,
  serializeRun,
  exportTelemetryCsv,
  exportEventsCsv,
} from "../io/json";
import { validateRunSpec } from "../catalog/schema";
import { compareRuns, freezeRun } from "./compare";
import type { RunResult } from "../runner/run";
import type { RunMetrics } from "../runner/metrics";
import type { Bucket } from "../runner/retention";
import { drawChart, format } from "./charts";
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const html = (text: unknown) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
let spec = structuredClone(presets[0]),
  runId = "",
  commandId = 0,
  currentResult: RunResult | undefined,
  a: RunResult | undefined,
  freezePending = false,
  channels: string[] = [],
  buckets: Bucket[] = [],
  last: TickTelemetry = {},
  state: ModelState = initialState(spec),
  metrics: RunMetrics | undefined;
let activeRun = false;
let activeSpec: RunSpec | undefined;
const pending = new Map<number, number>();
const worker = new Worker(new URL("../runner/worker.ts", import.meta.url), {
  type: "module",
});
const app = document.querySelector("#app")!;
app.innerHTML = `<header><div class="title"><span class="wordmark">U2</span><div><h1>Power & Heat Lab</h1><div class="subtitle">Энергия, тепло и рабочий рейс · лаборатория v0.1</div></div></div><span class="badge">EXPERIMENTAL<br>НЕ УТВЕРЖДЁННЫЕ ТТХ</span></header>
<div class="toolbar"><button id="start" class="primary">Запуск</button><button id="pause">Пауза</button><button id="resume">Продолжить</button><button id="step">Шаг</button><button id="reset">Сброс</button><button id="cancel">Отмена</button><span class="spacer"></span><label class="muted">Расчёт × <select id="acceleration" aria-label="Ускорение"><option value="1">1</option><option value="100">100</option><option value="2000" selected>2000</option><option value="20000">20000</option></select></label><span id="status" class="status">Готов к запуску</span></div>
<div class="layout"><aside id="configuration" class="configuration"><div class="section-head"><h2>01 / Конфигурация</h2><span class="revision">SI · Civilian</span></div><select id="preset" aria-label="Корпус"><option value="0">S Civilian · G1 / Diesel</option><option value="1">M Civilian · G1 / Diesel</option></select><p class="model-note">Оба набора — опыты X1–X7. Размер M задан по отдельным семьям. Источники и происхождение каждого поля доступны ниже.</p><div id="ship-fields"></div><div class="divider"></div><div class="section-head"><h2>02 / Модули</h2><span class="muted">Общая сеть</span></div><div id="modules"></div><h3>Добавить опыт из палитры</h3><div class="palette"><button data-add="radiator">Активный радиатор</button><button data-add="buffer">Heat Buffer</button><button data-add="h2">H₂ cooler</button><button data-add="thermoinverter">Термоинвертор</button><button data-add="solar">PV</button><button data-add="load">Background</button></div><div class="divider"></div><h2>03 / Среда и сценарий</h2><div class="field"><label for="environment">Среда</label><select id="environment"><option value="100">Холодный фон</option><option value="300">Обычный фон</option><option value="600">Горячий фон</option><option value="solar">Солнечный поток</option><option value="plasma">Прямое тепло</option></select></div><div id="environment-fields"></div><div class="field"><label for="scenario">Сценарий</label><select id="scenario"><option value="mining">Добыча / рейсы</option><option value="idle">Простой</option><option value="stress">Полная тяга · stress</option><option value="burst">Работа / перегрузка</option></select></div><div class="field"><label for="duration">Длительность · s</label><input id="duration" type="number" value="600" min="0.01" step="any"></div><div class="palette"><button data-duration="300">5 минут</button><button data-duration="600">10 минут</button><button data-duration="28800">8 часов</button><button data-duration="43200">12 часов</button></div><div id="time-fields"></div><div class="divider"></div><button id="advanced">Все параметры / фазы JSON</button><p class="model-note">Изменения относятся к следующему опыту. Physics dt не зависит от ускорения. Обслуживание меняет только явно указанные ресурсы.</p><div id="error" class="error" role="alert"></div></aside>
<main class="main"><div class="stats"><div class="stat"><span>Simulation time</span><strong id="time">0 s</strong><small id="phase">Начальное состояние</small></div><div class="stat"><span>Температура</span><strong id="temperature">300 K</strong><small>Единая T_ship</small></div><div class="stat"><span>Аккумулятор</span><strong id="soc">100%</strong><small id="charge">Stored energy</small></div><div class="stat"><span>Полезная работа</span><strong id="work">0</strong><small id="cargo">Трюм 0 / 12 SCU</small></div><div class="stat"><span>Power delivery</span><strong id="power">0 W</strong><small id="requested">Запрошено 0 W</small></div></div>
<div id="limitation" class="notice">Выберите конфигурацию и запустите воспроизводимый опыт. Активные нагрузки вправе расходовать запас ниже Background floors.</div>
<div class="charts"><section class="panel"><div class="panel-head"><h2>Электропитание</h2><span class="revision">W / simulation s</span></div><div class="chart-body"><canvas id="power-chart" aria-label="График электропитания"></canvas><div class="legend"><span><i style="background:#e0b57c"></i>Запрос</span><span><i style="background:#91d8b9"></i>Факт</span><span><i style="background:#83b5e4"></i>Источник</span></div></div></section><section class="panel"><div class="panel-head"><h2>Тепловой коридор</h2><span class="revision">K / simulation s</span></div><div class="chart-body"><canvas id="thermal-chart" aria-label="График температуры"></canvas><div class="legend"><span><i style="background:#ecb185"></i>T_ship</span><span>Пунктир — work / critical</span></div></div></section><section class="panel"><div class="panel-head"><h2>Тепловые потоки</h2><select id="heat-channel" aria-label="Тепловой канал"><option value="heatInW">Суммарный вход</option><option value="generatorHostW">Генератор</option><option value="propulsionHostW">Движители</option><option value="loadHostW">Нагрузки</option><option value="batteryLossW">Потери аккумулятора</option><option value="h2CoolingW">H₂ cooling</option><option value="tiCoolingW">Термоинвертор</option><option value="bufferAbsorbW">Буфер</option><option value="exhaustW">Выхлоп</option></select></div><div class="chart-body"><canvas id="heat-chart" aria-label="График тепловых потоков"></canvas><div class="legend"><span><i style="background:#e0b57c"></i>Выбранный канал</span><span><i style="background:#91d8b9"></i>Radiation out</span><span><i style="background:#83b5e4"></i>Radiation in</span></div></div></section><section class="panel"><div class="panel-head"><h2>Запасы и рабочий выход</h2><select id="resource-channel" aria-label="Канал запаса"><option value="soc">SoC · fraction</option><option value="chargeJ">Stored charge · J</option><option value="fuelKg:diesel">Diesel · kg</option><option value="fuelKg:hydrogen">H₂ · kg</option><option value="bufferJ:buffer">Buffer · J</option><option value="usefulWork">Useful work · SCU</option><option value="cargo">Cargo · SCU</option></select></div><div class="chart-body"><canvas id="resource-chart" aria-label="График ресурсов"></canvas><div class="legend"><span><i style="background:#91d8b9"></i>Фактический запас / выход</span></div></div></section></div>
<div class="bottom"><section class="panel"><div class="panel-head"><h2>04 / Журнал событий</h2><span id="events-count">0 событий</span></div><div class="table-scroll"><table><thead><tr><th>Время · s</th><th>Причина / переход</th></tr></thead><tbody id="events"><tr><td>—</td><td class="muted">События появятся после запуска</td></tr></tbody></table></div></section><section class="panel"><div class="panel-head"><h2>Показатели опыта</h2><span id="ack" class="revision">Worker · ready</span></div><div id="metrics" class="metric-grid"></div><details><summary style="padding:10px 12px;color:#8ca4b2">Фактические каналы SI / ledger</summary><div class="table-scroll"><table><tbody id="channels"></tbody></table></div></details></section></div>
<section class="panel compare"><div class="panel-head"><h2>05 / Сравнение A/B</h2><div class="controls-row"><select id="compare-mode" aria-label="Режим сравнения"><option value="same-task">Одинаковая задача</option><option value="own-sortie">Собственный рейс</option></select><button id="freeze">Зафиксировать A</button></div></div><div id="comparison" class="compare-body"><p class="muted">Завершите опыт A, зафиксируйте его, измените параметры и запустите B. Результат A остаётся неизменным.</p></div></section>
<div id="retention" class="notice">Графики: 1 s mean / min / max / count; ≤50 000 buckets, ≤128 MiB. Метрики считают каждый physics tick. События: первые 128 и последние 19 872.</div><div class="export"><button id="export-json">JSON опыта</button><label for="import">Импорт JSON<input id="import" type="file" accept=".json,application/json" class="hidden"></label><button id="export-trace">CSV измерений</button><button id="export-events">CSV событий</button><button id="export-result">JSON результата</button></div></main></div><footer><span>U2 · Power & Heat v0.1.1 / локальный Worker · без simulation backend</span><span id="versions">radiative-host-ledger-0.1 / intake-0.1</span></footer><dialog id="editor"><h2>Версионированный опыт · SI</h2><p class="muted">JSON сохраняет provenance. Новые значения требуют явного experimental origin.</p><div id="editor-error" class="error"></div><textarea id="json-editor" aria-label="JSON параметры"></textarea><div class="controls-row"><button id="apply-json" class="primary">Применить</button><button id="close-editor">Закрыть</button></div></dialog>`;
function origin(path: string) {
  const o = spec.origins[path];
  return `<small title="${html(o?.sourceRef ?? "Нет provenance")} · ${html(o?.note ?? "")}">${html(o?.kind ?? "gap")} · ${html(o?.sourceRef ?? "missing")}</small>`;
}
function field(path: string, label: string, value: number) {
  return `<div class="field"><label>${html(label)}${origin(path)}</label><input type="number" step="any" data-path="${path}" aria-label="${html(label)}" value="${value}"></div>`;
}
function getPath(path: string): any {
  return path.split(".").reduce((v, k) => v[k], spec as any);
}
function setPath(path: string, value: any) {
  const keys = path.split("."),
    key = keys.pop()!;
  const parent = keys.reduce((v, k) => v[k], spec as any);
  parent[key] = value;
  if (path === "ship.heatCapacityJK") {
    const material = spec.ship.thermalMaterials[0],
      others = spec.ship.thermalMaterials
        .slice(1)
        .reduce((n, m) => n + m.massKg * m.cpJKgK, 0);
    material.cpJKgK = (value - others) / material.massKg;
    spec.origins["ship.thermalMaterials.0.cpJKgK"] = {
      kind: "experimental",
      sourceRef: "user:effective-cp",
      note: "C aggregate edit",
    };
  }
  spec.origins[path] = {
    kind: "experimental",
    sourceRef: "user:editable-experiment",
    note: "Изменение в лаборатории",
  };
  currentResult = currentResult;
  showError("");
}
function configuration() {
  $("ship-fields").innerHTML =
    field(
      "ship.heatCapacityJK",
      "Теплоёмкость · J/K",
      spec.ship.heatCapacityJK,
    ) +
    field("ship.hullRadiationM2", "Hull εA · m²", spec.ship.hullRadiationM2) +
    field(
      "ship.accumulators.0.capacityJ",
      "Ёмкость stored · J",
      spec.ship.accumulators[0].capacityJ,
    ) +
    field("initial.chargeJ", "Начальный заряд · J", spec.initial.chargeJ) +
    field(
      "initial.temperatureK",
      "Начальная T · K",
      spec.initial.temperatureK,
    ) +
    field(
      "initial.fuelKg.diesel",
      "Начальный Diesel · kg",
      spec.initial.fuelKg.diesel ?? 0,
    ) +
    field("ship.cargoCapacity", "Трюм · SCU", spec.ship.cargoCapacity);
  $("modules").innerHTML = spec.ship.modules
    .map((m, i) => {
      const path = `ship.modules.${i}`;
      const keys: Partial<Record<Module["kind"], [keyof Module, string][]>> = {
        generator: [
          ["powerW", "Rated electric · W"],
          ["efficiency", "η generator"],
          ["pathEfficiency", "η path"],
        ],
        engine: [
          ["forceN", "March thrust · N"],
          ["alpha", "α · kg/(N s)"],
          ["efficiency", "Useful fraction"],
          ["hostFraction", "Host waste share"],
        ],
        load: [
          ["powerW", "Bus request · W"],
          ["efficiency", "Useful efficiency"],
          ["workPerJ", "Work · SCU/J"],
        ],
        radiator: [
          ["areaM2", "εA · m²"],
          ["auxW", "Pump electric · W"],
        ],
        buffer: [
          ["capacityJ", "Capacity · J"],
          ["coolingW", "Transfer cap · W"],
          ["absorbAboveK", "Absorb above · K"],
          ["releaseBelowK", "Release below · K"],
        ],
        h2: [
          ["coolingW", "Host cap · W"],
          ["auxW", "Aux electric · W"],
          ["qJKg", "q · J/kg"],
        ],
        thermoinverter: [
          ["coolingW", "Host cap · W"],
          ["hotK", "Hot side · K"],
          ["areaM2", "Hot εA · m²"],
          ["copEfficiency", "COP efficiency"],
        ],
        solar: [
          ["areaM2", "Absorbing area · m²"],
          ["efficiency", "PV efficiency"],
        ],
      };
      return `<details class="module" ${i === 0 ? "open" : ""}><summary><span class="module-title">${html(m.id)} / ${m.kind}<input type="checkbox" data-enable="${i}" aria-label="Включить ${html(m.id)}" ${m.enabled ? "checked" : ""}></span></summary>${(keys[m.kind] ?? []).map(([k, label]) => field(`${path}.${k}`, label, m[k] as number)).join("")}<p class="model-note">${m.policy} · tank ${html(m.tankId ?? "—")} · critical ${m.gate.low}…${m.gate.high} K / restart ${m.gate.restartLow}…${m.gate.restartHigh} K</p></details>`;
    })
    .join("");
  $("environment-fields").innerHTML =
    field(
      "environment.effectiveBackgroundK",
      "Effective background · K",
      spec.environment.effectiveBackgroundK,
    ) +
    field(
      "environment.solarFluxWm2",
      "Падающий солнечный · W/m²",
      spec.environment.solarFluxWm2,
    ) +
    `<div class="field"><label>Закон обмена</label><select id="law"><option value="radiative" ${spec.environment.law === "radiative" ? "selected" : ""}>T⁴ baseline</option><option value="linear-fog-experiment" ${spec.environment.law === "linear-fog-experiment" ? "selected" : ""}>Linear fog · опыт</option></select></div>` +
    (spec.environment.law === "linear-fog-experiment"
      ? field(
          "environment.linearWK",
          "Linear coefficient · W/K",
          spec.environment.linearWK,
        )
      : "");
  $("time-fields").innerHTML =
    field("stepSeconds", "Physics dt · s", spec.stepSeconds) +
    field(
      "scenario.targetWork",
      "Общая задача · SCU",
      spec.scenario.targetWork,
    );
  $<HTMLInputElement>("duration").value = String(spec.durationSeconds);
  $("versions").textContent = `${spec.modelVersion} / ${spec.catalogVersion}`;
  for (const el of document.querySelectorAll<HTMLInputElement>("[data-path]"))
    el.onchange = () => {
      setPath(el.dataset.path!, el.valueAsNumber);
    };
  for (const el of document.querySelectorAll<HTMLInputElement>("[data-enable]"))
    el.onchange = () => {
      spec.ship.modules[Number(el.dataset.enable)].enabled = el.checked;
    };
  $<HTMLSelectElement>("law").onchange = (e) => {
    spec.environment.law = (e.target as HTMLSelectElement).value as any;
    spec.environment.linearWK = 10000;
    markEdits(spec);
    configuration();
  };
}
function showError(text: string) {
  $("error").textContent = text;
  $("editor-error").textContent = text;
}
function send(type: string, payload?: any) {
  if (!runId) return;
  const id = ++commandId;
  pending.set(id, performance.now());
  worker.postMessage({ runId, commandId: id, type, payload });
}
function reset() {
  if (runId) send("cancel");
  // getRandomValues доступен и в обычном LAN HTTP; ID остаётся криптографически случайным.
  runId = Array.from(crypto.getRandomValues(new Uint8Array(16)),
    byte => byte.toString(16).padStart(2, "0")).join("");
  currentResult = undefined;
  activeRun = false;
  activeSpec = undefined;
  state = initialState(spec);
  last = {};
  metrics = undefined;
  channels = [];
  buckets = [];
  $("status").textContent = "Готов к запуску";
  $("events").innerHTML =
    "<tr><td>—</td><td>События появятся после запуска</td></tr>";
  update();
}
function start() {
  spec.durationSeconds = $<HTMLInputElement>("duration").valueAsNumber;
  const v = validateRunSpec(spec);
  if (!v.ok) {
    showError(v.errors.map((e) => `${e.path}: ${e.message}`).join("\n"));
    return;
  }
  reset();
  showError("");
  $("status").textContent = "Расчёт…";
  activeRun = true;
  activeSpec = v.value;
  send("start", {
    spec: v.value,
    maxSteps: Number($<HTMLSelectElement>("acceleration").value),
  });
}
function chart() {
  drawChart(
    $<HTMLCanvasElement>("power-chart"),
    buckets,
    channels,
    [
      { channel: "requestedW", color: "#e0b57c", label: "Запрос" },
      { channel: "deliveredW", color: "#91d8b9", label: "Факт" },
      { channel: "generatorW", color: "#83b5e4", label: "Источник" },
    ],
    "W",
  );
  drawChart(
    $<HTMLCanvasElement>("thermal-chart"),
    buckets,
    channels,
    [{ channel: "temperatureK", color: "#ecb185", label: "T_ship" }],
    "K",
    [
      Math.min(
        ...(activeSpec ?? spec).ship.modules.map((m) => m.gate.workHigh),
      ),
      Math.min(...(activeSpec ?? spec).ship.modules.map((m) => m.gate.high)),
    ],
  );
  drawChart(
    $<HTMLCanvasElement>("heat-chart"),
    buckets,
    channels,
    [
      {
        channel: $<HTMLSelectElement>("heat-channel").value,
        color: "#e0b57c",
        label: "Выбор",
      },
      { channel: "radiationOutW", color: "#91d8b9", label: "Out" },
      { channel: "radiationInW", color: "#83b5e4", label: "In" },
    ],
    "W",
  );
  const resource = $<HTMLSelectElement>("resource-channel").value;
  drawChart(
    $<HTMLCanvasElement>("resource-chart"),
    buckets,
    channels,
    [{ channel: resource, color: "#91d8b9", label: "Resource" }],
    resource.includes("fuel")
      ? "kg"
      : resource.includes("J")
        ? "J"
        : resource === "soc"
          ? "1"
          : "SCU",
  );
}
function update() {
  $("time").textContent =
    state.timeSeconds === 0 ? "0 s" : `${format(state.timeSeconds)} s`;
  $("temperature").textContent = `${state.temperatureK.toFixed(1)} K`;
  $("soc").textContent =
    `${((100 * state.chargeJ) / capacity((activeSpec ?? spec).ship)).toFixed(1)}%`;
  $("charge").textContent = `${format(state.chargeJ)} J stored`;
  $("work").textContent =
    state.usefulWork === 0 ? "0" : state.usefulWork.toFixed(4);
  $("cargo").textContent =
    `Трюм ${state.cargo.toFixed(2)} / ${(activeSpec ?? spec).ship.cargoCapacity} SCU`;
  $("power").textContent = `${format(last.deliveredW ?? 0)} W`;
  $("requested").textContent = `Запрошено ${format(last.requestedW ?? 0)} W`;
  $("phase").textContent = state.phaseKey
    ? `Фаза ${state.phaseKey}`
    : "Начальное состояние";
  $("limitation").textContent =
    state.constraints.join(" · ") ||
    "Нагрузка обеспечена. Температура и запасы находятся в допустимом диапазоне.";
  $("limitation").className = state.constraints.length
    ? "notice warning"
    : "notice";
  const pairs = [
    ["Useful work · SCU", metrics?.usefulWork ?? 0],
    ["Первое ограничение · s", metrics?.firstConstraintSeconds ?? "—"],
    ["Downtime · s", metrics?.forcedDowntimeSeconds ?? 0],
    ["Recovery to work · s", metrics?.recoverySeconds ?? "—"],
    ["Diesel consumed · kg", metrics?.fuelConsumedKg.diesel ?? 0],
    ["Peak T · K", metrics?.maxTemperatureK ?? state.temperatureK],
    ["Энергобаланс residual · J", metrics?.energyResidualJ ?? 0],
    ["Physics ticks", metrics?.ticks ?? 0],
  ];
  $("metrics").innerHTML = pairs
    .map(
      ([k, v]) =>
        `<div>${html(k)}<strong>${typeof v === "number" ? format(v) : html(v)}</strong></div>`,
    )
    .join("");
  $("channels").innerHTML = Object.entries(last)
    .map(([k, v]) => `<tr><td>${html(k)}</td><td>${format(v)}</td></tr>`)
    .join("");
  chart();
}
function comparison() {
  if (!a) {
    return;
  }
  if (!currentResult) {
    $("comparison").innerHTML =
      `<p>A сохранён · ${html(a.spec.ship.size)} / ${html(a.status)} / ${a.state.usefulWork.toFixed(3)} SCU. Измените конфигурацию и запустите B.</p>`;
    return;
  }
  const c = compareRuns(
    a,
    currentResult,
    $<HTMLSelectElement>("compare-mode").value as any,
  );
  $("comparison").innerHTML =
    `<p>A: ${html(a.spec.ship.size)} · ${html(c.modelA)} / B: ${html(currentResult.spec.ship.size)} · ${html(c.modelB)}. ${c.conditionsMatch ? "Условия задачи совпадают." : "Условия различаются — сравнение не является контролируемым опытом."}</p><table><thead><tr><th>Факт</th><th>A</th><th>B</th></tr></thead><tbody>${[
      ["Полезная работа · SCU", c.a.usefulWork, c.b.usefulWork],
      [
        "Задача / собственный рейс · s",
        c.a.completionSeconds ?? "Не завершён",
        c.b.completionSeconds ?? "Не завершён",
      ],
      ["Трюм · SCU", c.capacityA, c.capacityB],
      [
        "Вынужденный downtime · s",
        c.a.forcedDowntimeSeconds,
        c.b.forcedDowntimeSeconds,
      ],
      [
        "Топливо Diesel · kg",
        c.a.fuelConsumedKg.diesel ?? 0,
        c.b.fuelConsumedKg.diesel ?? 0,
      ],
    ]
      .map(
        (row) =>
          `<tr>${row.map((x) => `<td>${typeof x === "number" ? format(x) : html(x)}</td>`).join("")}</tr>`,
      )
      .join(
        "",
      )}</tbody></table><details><summary>Различия параметров (${c.differences.length}) · experimental provenance в JSON</summary><table>${c.differences
      .slice(0, 100)
      .map(
        (d) =>
          `<tr><td>${html(d.path)}</td><td>${html(d.a)}</td><td>${html(d.b)}</td></tr>`,
      )
      .join("")}</table></details>`;
}
worker.onmessage = (e) => {
  const m = e.data;
  if (m.runId !== runId) return;
  if (m.type === "control-ack") {
    const started = pending.get(m.commandId);
    if (started !== undefined) {
      $("ack").textContent =
        `${m.control} ACK · ${(performance.now() - started).toFixed(1)} ms`;
      pending.delete(m.commandId);
    }
    if (m.control === "pause") $("status").textContent = "Пауза";
    if (m.control === "step") $("status").textContent = "Шаг";
    if (m.control === "cancel") $("status").textContent = "Отменён";
    if (m.control === "resume") $("status").textContent = "Расчёт…";
  }
  if (m.type === "error") {
    showError(m.payload);
    $("status").textContent = "Ошибка";
  }
  if (m.type === "chunk") {
    const p = m.payload;
    state = p.state;
    last = p.telemetry;
    metrics = p.metrics;
    channels = p.channels;
    buckets = p.buckets;
    $("events").innerHTML =
      p.events
        .map(
          (x: any) =>
            `<tr><td>${format(x.timeSeconds)}</td><td><span class="event-kind">${html(x.kind)}</span><br>${html(x.message)}</td></tr>`,
        )
        .join("") || "<tr><td>—</td><td>Без событий</td></tr>";
    $("events-count").textContent =
      `${p.retention.totalEvents} · отброшено ${p.retention.droppedEvents}`;
    $("retention").textContent =
      `${p.retention.buckets} buckets · ${p.retention.cadenceSeconds} s mean/min/max/count · ${p.retention.totalTicks} ticks · ${(p.retention.estimatedBytes / 1048576).toFixed(2)} MiB. События: первые128 / последние19872; отброшено ${p.retention.droppedEvents}.`;
    update();
    worker.postMessage({ runId, type: "telemetry-ack", chunkId: m.chunkId });
  }
  if (m.type === "complete" || m.type === "snapshot") {
    currentResult = m.payload;
    if (m.type === "complete") {
      $("status").textContent = "Завершён";
      buckets = currentResult!.buckets.filter(
        (_, i) =>
          i % Math.max(1, Math.ceil(currentResult!.buckets.length / 1000)) ===
          0,
      );
      update();
    }
    if (freezePending) {
      a = freezeRun(currentResult!);
      freezePending = false;
      currentResult = undefined;
    }
    comparison();
  }
};
$("start").onclick = start;
for (const type of ["pause", "resume", "step", "cancel"])
  $(type).onclick = () => {
    if (type === "step" && !activeRun) {
      start();
      send("pause");
    }
    send(type);
  };
$("reset").onclick = reset;
$<HTMLSelectElement>("acceleration").onchange = () =>
  send("resume", {
    maxSteps: Number($<HTMLSelectElement>("acceleration").value),
  });
$<HTMLSelectElement>("preset").onchange = (e) => {
  const duration = spec.durationSeconds;
  spec = structuredClone(
    presets[Number((e.target as HTMLSelectElement).value)],
  );
  spec.durationSeconds = duration;
  configuration();
};
$<HTMLInputElement>("duration").onchange = (e) =>
  setPath("durationSeconds", (e.target as HTMLInputElement).valueAsNumber);
for (const el of document.querySelectorAll<HTMLButtonElement>(
  "[data-duration]",
))
  el.onclick = () => {
    setPath("durationSeconds", Number(el.dataset.duration));
    $<HTMLInputElement>("duration").value = String(spec.durationSeconds);
  };
$<HTMLSelectElement>("environment").onchange = (e) => {
  const v = (e.target as HTMLSelectElement).value;
  spec.environment.effectiveBackgroundK = Number.isFinite(Number(v))
    ? Number(v)
    : 100;
  spec.environment.solarFluxWm2 = v === "solar" ? 1361 : 0;
  spec.environment.directHeat =
    v === "plasma" ? [{ sourceId: "plasma-thermal", powerW: 1e6 }] : [];
  markEdits(spec);
  configuration();
};
$<HTMLSelectElement>("scenario").onchange = (e) => {
  const v = (e.target as HTMLSelectElement).value;
  spec.scenario =
    v === "mining"
      ? structuredClone(presets[0].scenario)
      : {
          name: v,
          repeat: true,
          targetWork: 12,
          phases:
            v === "idle"
              ? [{ id: "idle", action: "idle", durationSeconds: 600, duty: 0 }]
              : v === "stress"
                ? [
                    {
                      id: "full-thrust-stress",
                      action: "approach",
                      durationSeconds: 600,
                      duty: 1,
                    },
                  ]
                : [
                    {
                      id: "work",
                      action: "work",
                      durationSeconds: 100,
                      duty: 0.5,
                    },
                    {
                      id: "overload",
                      action: "overload",
                      durationSeconds: 100,
                      duty: 1,
                    },
                    {
                      id: "recover",
                      action: "recovery",
                      durationSeconds: 400,
                      duty: 0,
                    },
                  ],
        };
  markEdits(spec);
  configuration();
};
for (const el of document.querySelectorAll<HTMLButtonElement>("[data-add]"))
  el.onclick = () => {
    const kind = el.dataset.add as Module["kind"];
    let id = kind;
    let n = 1;
    while (spec.ship.modules.some((m) => m.id === id)) id = kind + ++n;
    let m = moduleBase(id, kind);
    if (kind === "radiator") Object.assign(m, { areaM2: 882, auxW: 300000 });
    if (kind === "buffer") {
      Object.assign(m, { capacityJ: 2e9, coolingW: 20e6 });
      spec.initial.buffersJ[id] = 0;
    }
    if (kind === "h2") {
      Object.assign(m, {
        tankId: "hydrogen",
        species: "hydrogen",
        coolingW: 20e6,
        auxW: 56000,
        qJKg: 1e7,
      });
      if (!spec.ship.tanks.some((t) => t.id === "hydrogen")) {
        spec.ship.tanks.push({
          id: "hydrogen",
          species: "hydrogen",
          capacityKg: spec.ship.size === "S" ? 633.45758 : 3647.570429,
          energyJKg: 120e6,
        });
        const tankMassKg = spec.ship.size === "S" ? 6650.887832 : 24125.654735;
        spec.ship.thermalMaterials.push({
          id: "power-cryotank-dry",
          massKg: tankMassKg,
          cpJKgK: 500,
          contents: "dry",
        });
        spec.ship.dryMassKg += tankMassKg;
        spec.ship.heatCapacityJK += tankMassKg * 500;
        spec.initial.fuelKg.hydrogen =
          spec.ship.size === "S" ? 633.45758 : 3647.570429;
      }
    }
    if (kind === "thermoinverter")
      Object.assign(m, {
        coolingW: 20e6,
        hotK: 800,
        areaM2: 441,
        copEfficiency: 0.5,
      });
    if (kind === "solar") Object.assign(m, { areaM2: 100, efficiency: 0.25 });
    if (kind === "load")
      Object.assign(m, {
        id: "background-" + id,
        policy: "Background",
        powerW: 1e5,
        efficiency: 0.5,
        workPerJ: 0,
      });
    spec.ship.modules.push(m);
    const massKg =
      kind === "radiator"
        ? 1350
        : kind === "buffer"
          ? 5000
          : kind === "h2"
            ? 850
            : kind === "thermoinverter"
              ? 950
              : kind === "solar"
                ? 500
                : 100;
    const cpJKgK = 500;
    spec.ship.thermalMaterials.push({
      id: `palette:${m.id}`,
      massKg,
      cpJKgK,
      contents: "dry",
    });
    spec.ship.dryMassKg += massKg;
    spec.ship.heatCapacityJK += massKg * cpJKgK;
    markEdits(spec);
    for (const [i, bill] of spec.ship.thermalMaterials.entries())
      if (bill.id.startsWith("palette:") || bill.id === "power-cryotank-dry") {
        for (const field of ["massKg", "cpJKgK"])
          spec.origins[`ship.thermalMaterials.${i}.${field}`] = {
            kind: "experimental",
            sourceRef: "lab-palette-materials-1",
            note: "Дополнительный сухой material bill; reference cp500. Cryotank mass anchored s39; completed thermal proof absent",
          };
      }
    configuration();
  };
$("heat-channel").onchange = chart;
$("resource-channel").onchange = chart;
$("compare-mode").onchange = comparison;
$("freeze").onclick = () => {
  if (currentResult) {
    a = freezeRun(currentResult);
    currentResult = undefined;
    comparison();
  } else if (runId) {
    freezePending = true;
    send("snapshot");
  }
};
function download(name: string, text: string, type: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
$("export-json").onclick = () =>
  download(
    `u2-${spec.ship.size}-experiment.json`,
    serializeRun(spec),
    "application/json",
  );
$("export-result").onclick = () => {
  if (currentResult)
    download(
      "u2-result.json",
      JSON.stringify(
        currentResult,
        (_, v) => (ArrayBuffer.isView(v) ? Array.from(v as any) : v),
        2,
      ),
      "application/json",
    );
  else showError("Сначала завершите опыт или нажмите Отмена для снимка");
};
$("export-trace").onclick = () => {
  if (currentResult)
    download("u2-trace.csv", exportTelemetryCsv(currentResult), "text/csv");
  else showError("Завершите опыт или нажмите Отмена");
};
$("export-events").onclick = () => {
  if (currentResult)
    download("u2-events.csv", exportEventsCsv(currentResult), "text/csv");
  else showError("Завершите опыт или нажмите Отмена");
};
function apply(text: string) {
  const parsed = parseRunJson(text);
  if (!parsed.ok) {
    showError(parsed.errors.map((e) => `${e.path}: ${e.message}`).join("\n"));
    return false;
  }
  spec = parsed.value;
  configuration();
  reset();
  showError("");
  return true;
}
$<HTMLInputElement>("import").onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) apply(await f.text());
  (e.target as HTMLInputElement).value = "";
};
$("advanced").onclick = () => {
  $<HTMLTextAreaElement>("json-editor").value = serializeRun(spec);
  $<HTMLDialogElement>("editor").showModal();
};
$("close-editor").onclick = () => $<HTMLDialogElement>("editor").close();
$("apply-json").onclick = () => {
  if (apply($<HTMLTextAreaElement>("json-editor").value))
    $<HTMLDialogElement>("editor").close();
};
window.addEventListener("resize", chart);
configuration();
update();

const importedLegacy=sessionStorage.getItem('u2-lab:legacy-import');
if(importedLegacy&&apply(importedLegacy))sessionStorage.removeItem('u2-lab:legacy-import');
