import type {
  CandidateCatalog,
  ShipFit,
  FitValidation,
  ResolvedInstance,
} from "../fitting/types";
import type { RunSpecV2 } from "../model/v2/types";
import type { RunResultV2 } from "../runner/run";
import { getPresetFit } from "../fitting/catalog";
import { validateFit, installedInstances } from "../fitting/validate";
import { serializeFit, serializeExperiment } from "../io/fitting-json";
import { exportFittingTelemetryCsv } from "../io/fitting-csv";
import { FittingWorkspace } from "./fitting-workspace";
import { shipView } from "./fitting-ui/ship-view";
import { swapDialog, type SwapState } from "./fitting-ui/swap-dialog";
import { instanceDetails } from "./fitting-ui/instance-details";
import { labView, firstLimiter, testStatus } from "./fitting-ui/lab-view";
import { compareView, type AbView } from "./fitting-ui/compare-view";
import { esc, num, replacement } from "./fitting-ui/presentation";
import { updateDom } from "./fitting-ui/dom";
import type { ChannelState } from "./fitting-ui/lab-channels";
export type FittingController = {
  getFit(): ShipFit;
  applyFit(f: ShipFit): FitValidation;
  showRun(r: RunResultV2): void;
  destroy(): void;
};
const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export function mountFitting(
  root: HTMLElement,
  catalog: CandidateCatalog,
  onRun: (s: RunSpecV2) => void,
): FittingController {
  const w = new FittingWorkspace(getPresetFit("sputnik"), catalog),
    worker = new Worker(new URL("../runner/worker.ts", import.meta.url), {
      type: "module",
    });
  let screen = "fitting",
    swap: SwapState | undefined,
    instance: ResolvedInstance | undefined,
    confirmCancel = false,
    error = "",
    ack = "",
    runId = "",
    commandId = 0,
    speed = 20000,
    selectedSlot = "payload-1",
    allowSnapshot = false,
    compareSort = "name",
    abView: AbView = "both";
  const collapsed = new Set<string>(
      innerWidth < 700 ? ["propulsion", "signature"] : [],
    ),
    channel: ChannelState = {
      group: "energy",
      unit: "W",
      hidden: new Set(),
      eventIndex: 0,
    },
    pending = new Map<number, { at: number; type: string }>();
  root.classList.add("fitting-app");
  const el = <T extends HTMLElement = HTMLElement>(id: string) =>
    root.querySelector<T>("#" + id);
  const listen = (id: string, fn: () => void) => {
    const x = el(id);
    if (x) x.onclick = fn;
  };
  function send(type: string, payload?: unknown) {
    const id = ++commandId;
    pending.set(id, { at: performance.now(), type });
    worker.postMessage({ runId, commandId: id, type, payload });
  }
  function apply(f: ShipFit) {
    const v = w.applyFit(f);
    error = v.valid
      ? ""
      : v.issues
          .filter((i) => i.severity === "error")
          .map((i) => i.path + ": " + i.message)
          .join("\n");
    render();
    return v;
  }
  function start() {
    if (w.getActive()) return;
    const prepared = w.start(newId());
    if (!prepared.ok) {
      error = prepared.errors.map((e) => e.path + ": " + e.message).join("\n");
      render();
      return;
    }
    runId = prepared.value.runId;
    pending.clear();
    channel.eventIndex = 0;
    error = "";
    onRun(structuredClone(prepared.value.spec));
    send("start", { spec: prepared.value.spec, maxSteps: speed });
    render();
  }
  function control(type: string) {
    if (type === "reset") {
      if (w.getActive()) send("cancel");
      w.reset();
      runId = newId();
      pending.clear();
      confirmCancel = false;
      ack = "";
      render();
      return;
    }
    if (type === "cancel") {
      confirmCancel = true;
      render();
      return;
    }
    if (!w.getActive()) return;
    send(type, { maxSteps: speed });
  }
  function mainAction() {
    const a = w.getActive();
    if (a) {
      if (a.variantId !== w.selectedId) return;
      control(a.status === "running" ? "pause" : "resume");
    } else start();
  }
  const download = (name: string, value: string, type = "application/json") => {
    const url = URL.createObjectURL(new Blob([value], { type })),
      link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  function exportRun() {
    const active = w.getActive(),
      prepared = active
        ? { ok: true as const, value: active.spec }
        : w.prepare();
    if (prepared.ok)
      download(
        "u2-fitting-experiment.json",
        serializeExperiment(prepared.value),
      );
    else {
      error = prepared.errors.map((e) => e.path + ": " + e.message).join("\n");
      render();
    }
  }
  function currentResult() {
    return w.getCurrentResult();
  }
  function closeDialog() {
    const returnId = swap?.returnId ?? "fit-main-action";
    swap = undefined;
    instance = undefined;
    confirmCancel = false;
    render();
    el(returnId)?.focus();
  }
  function render() {
    const focus = document.activeElement as
        HTMLInputElement | HTMLSelectElement | null,
      focusId = focus?.id,
      startSelection =
        focus instanceof HTMLInputElement ? focus.selectionStart : null;
    const openDetails = [
      ...root.querySelectorAll<HTMLDetailsElement>("details[open][id]"),
    ].map((d) => d.id);
    const fit = w.getFit(),
      v = validateFit(fit, catalog),
      sel = w.getSelected(),
      active = w.getActive(),
      own = sel.result,
      r = currentResult(),
      previous = w.isPreviousResult(sel),
      measuredOwn = previous ? undefined : own,
      label = testStatus(
        measuredOwn,
        active?.variantId === w.selectedId ? active.status : undefined,
      ),
      stale = w.isStale(),
      controls = active ? active.status : undefined;
    const action = active
      ? active.variantId === w.selectedId
        ? active.status === "running"
          ? "Пауза"
          : "Продолжить"
        : "Тест другого варианта"
      : own
        ? "Запустить снова"
        : "Запустить тест";
    const built = installedInstances(fit, catalog),
      item = built.find((i) => i.slotId === selectedSlot)?.item;
    updateDom(
      root,
      `<header class="ui-header"><div class="ui-brand"><span>U2</span><strong>${screen === "lab" ? "Power & Heat" : "Ship Fitting"}</strong></div><nav aria-label="Разделы"><button data-screen="fitting" aria-pressed="${screen === "fitting"}">Оснастка</button><button data-screen="lab" aria-pressed="${screen === "lab"}">Power & Heat</button><button data-screen="compare" aria-pressed="${screen === "compare"}">Сравнение</button></nav><div class="file-actions"><button id="fit-save">Сохранить сборку</button><label class="ui-file">Импорт JSON<input id="fit-import" type="file" accept=".json"></label><a href="?mode=legacy">Legacy v1</a></div></header><section class="fit-f1" aria-label="Итог сборки"><div><span class="eyebrow">Комплектность</span><strong id="fit-readiness">${
        v.readiness.canRun
          ? "Готова · монтаж совместим" +
            (v.readiness.resourceWarnings.length
              ? " · " +
                esc(
                  v.readiness.resourceWarnings
                    .map((x) => x.message)
                    .join(" · "),
                )
              : "")
          : v.valid
            ? "Не хватает: " + esc(v.readiness.missing.join(", "))
            : "Ошибка монтажа: " +
              esc(
                v.issues
                  .filter((i) => i.severity === "error")
                  .map((i) => i.message)
                  .join(", "),
              )
      }</strong></div><div><span class="eyebrow">Тест</span><strong id="fit-status">${label}</strong><small>${stale ? "устаревший результат · " : ""}измерена ревизия ${measuredOwn?.spec.resolvedShip.fit.fitRevision ?? "—"}${previous ? " · предыдущий тест · run " + esc(own!.runId) + " · ревизия " + own!.spec.resolvedShip.fit.fitRevision : ""}</small></div><div><span class="eyebrow">Добыча · измерено</span><strong id="fit-rate">${num(measuredOwn?.metrics.scuPerHour, "SCU/ч")}</strong></div><div><span class="eyebrow">Первое ограничение</span><strong id="fit-first">${firstLimiter(measuredOwn)}</strong></div></section><div class="workspace-meta"><div class="variant-tabs" role="group" aria-label="Варианты">${w
        .getVariants()
        .map(
          (v) =>
            `<button data-variant="${v.id}" aria-label="Вариант ${esc(v.name)} · ${v.fit.fitRevision}" aria-pressed="${v.id === w.selectedId}">${esc(v.name)} · ${installedInstances(v.fit, catalog).filter((i) => i.item.family === "mining").length} лазер${installedInstances(v.fit, catalog).filter((i) => i.item.family === "mining").length === 1 ? "" : "а"}</button>`,
        )
        .join(
          "",
        )}<button id="fit-add-variant" aria-label="Добавить вариант">+</button></div><div><span id="fit-next-revision">Следующая сборка: ${fit.fitRevision}</span><span id="fit-active-owner">${active ? " · активный тест: " + esc(active.variantName) + " · ревизия " + active.fitRevision : " · активного теста нет"}</span></div></div><div id="fit-error" role="alert">${esc(error)}</div><p id="fit-replay-note">${sel.replaySpec ? "Численный снимок: следующий запуск воспроизводит сохранённые числа и условия. " + (sel.replaySpec.snapshotReplayOnly ? "Совместимость слотов не проверена." : "") : ""}</p><main class="ui-main"><section class="screen" ${screen !== "fitting" ? "hidden" : ""}>${shipView(w, innerWidth <= 700 ? 0 : innerWidth <= 800 ? root.clientWidth - 32 : innerWidth <= 1100 ? (root.clientWidth - 76) / 2 : Math.max(440, (root.clientWidth - 76) * 0.475), collapsed)}</section><section class="screen" ${screen !== "lab" ? "hidden" : ""}>${labView(w, r, channel, eventFilter, "", abView)}</section><section class="screen" ${screen !== "compare" ? "hidden" : ""}>${compareView(w, compareSort, abView)}</section><details class="ui-panel" id="fit-more"><summary id="fit-f3">Подробнее · SI, источники, ledger и экспорт</summary><p>Числа U2, расчёты и гипотезы различаются по происхождению. Эксперимент не является production proof.</p><label><input id="fit-allow-snapshot" type="checkbox" ${allowSnapshot ? "checked" : ""}>Разрешить явное численное воспроизведение неизвестного каталога (слоты не проверены)</label><p>${previous ? "Экспорт сохранённого результата: предыдущий тест · run " + esc(own!.runId) : "Экспорт результата выбранного варианта"}</p><div class="export-actions"><button id="fit-export-run">Экспорт теста JSON</button><button id="fit-export-result">Экспорт результата JSON</button><button id="fit-export-csv">Экспорт измерений CSV</button></div><pre id="fit-sources">${esc(JSON.stringify({ installedItem: item, installedLocalVariant: !!item && !!fit.localVariants[item.id], fitVersion: fit.schemaVersion, catalogVersion: fit.catalogVersion, model: (active?.spec ?? r?.spec)?.modelVersion, hull: catalog.hulls.find((h) => h.id === fit.hullId), resolvedOrigins: (active?.spec ?? r?.spec)?.origins, units: "SI" }, null, 2))}</pre><label>Собственный численный вариант выбранного изделия · мощность W<input id="fit-variant-power" type="number" value="${item?.numerics.powerW ?? 0}" min="0"></label><button id="fit-variant" ${!item ? "disabled" : ""}>Создать вариант выбранного изделия</button><pre id="fit-ledger">${esc(r ? JSON.stringify({ energyResidualJ: r.metrics.energyResidualJ, sourceEnergyJ: r.metrics.sourceEnergyJ, beamEnergyJ: r.metrics.beamEnergyJ, returnHeatJ: r.metrics.returnHeatJ, fuelPurposeKg: r.metrics.fuelPurposeKg }, null, 2) : "Ledger появится после теста")}</pre></details></main><div class="ui-controls" aria-label="Управление тестом"><div class="control-status"><span id="fit-running-revision">${active ? "Тест использует сборку: " + active.fitRevision : "Активного теста нет"}</span><strong id="fit-time">${num(r?.state.timeSeconds ?? 0, "с")} / ${num(active?.spec.durationSeconds ?? r?.spec.durationSeconds ?? sel.conditions.durationSeconds, "с")}</strong><span id="fit-ack">${esc(ack)}</span></div><div class="control-buttons">${screen === "fitting" ? `<button id="fit-main-action" class="primary" ${active ? (active.variantId !== w.selectedId ? "disabled" : "") : !v.readiness.canRun ? "disabled" : ""}>${action}</button>` : `<button id="fit-start" class="primary" ${active || !v.readiness.canRun ? "disabled" : ""}>${own ? "Запуск заново" : "Запуск"}</button><button id="fit-pause" ${controls !== "running" ? "disabled" : ""}>Пауза</button><button id="fit-resume" ${controls !== "paused" ? "disabled" : ""}>Продолжить</button><button id="fit-step" ${controls !== "paused" ? "disabled" : ""}>Шаг</button><button id="fit-cancel" ${!active ? "disabled" : ""}>Отмена</button>`}<button id="fit-reset">Сброс</button><label>Расчёт ×<select id="fit-speed">${[
        [1, "×1"],
        [10, "×10"],
        [60, "×60"],
        [20000, "макс"],
      ]
        .map(
          ([n, label]) =>
            `<option value="${n}" ${speed === n ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label></div></div><footer>U2 Lab · 0.2.0 · UI Claude Design v2.1 · лабораторные ТТХ</footer><dialog id="ui-dialog" aria-labelledby="${swap ? "swap-title" : "dialog-title"}"></dialog>`,
    );
    for (const id of openDetails)
      el<HTMLDetailsElement>(id) && (el<HTMLDetailsElement>(id)!.open = true);
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-screen]"))
      b.onclick = () => {
        screen = b.dataset.screen!;
        swap = undefined;
        instance = undefined;
        render();
        window.scrollTo(0, 0);
      };
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-variant]"))
      b.onclick = () => {
        w.select(b.dataset.variant!);
        swap = undefined;
        instance = undefined;
        error = "";
        render();
      };
    listen("fit-add-variant", () => {
      w.copyVariant();
      swap = undefined;
      render();
    });
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-slot]")) {
      b.id =
        "slot-" + b.dataset.slot + (b.closest(".slot-ring") ? "-ring" : "");
      b.onclick = () => {
        selectedSlot = b.dataset.slot!;
        swap = {
          slotId: selectedSlot,
          candidate: "",
          query: "",
          family: "all",
          size: "all",
          sort: "name",
          batch: false,
          returnId: b.id,
        };
        render();
        el("swap-search")?.focus();
      };
    }
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-instance]"))
      b.onclick = () => {
        instance = (
          b.closest(".ship-hero, .systems")
            ? built
            : (r?.spec.resolvedShip.instances ?? built)
        ).find((i) => i.id === b.dataset.instance);
        render();
      };
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-group]"))
      b.onclick = () => {
        const cat = b.dataset.group!;
        collapsed.has(cat) ? collapsed.delete(cat) : collapsed.add(cat);
        render();
      };
    for (const x of root.querySelectorAll<HTMLInputElement>("[data-enable]"))
      x.onchange = () => {
        const next = w.getFit();
        if (x.dataset.builtin)
          next.builtinModes = {
            ...next.builtinModes,
            [x.dataset.enable!]: { enabled: x.checked },
          };
        else next.instances[x.dataset.enable!].enabled = x.checked;
        apply(next);
      };
    const preset = el<HTMLSelectElement>("fit-preset");
    if (preset) preset.onchange = () => apply(getPresetFit(preset.value));
    for (const x of root.querySelectorAll<HTMLInputElement>("[data-condition]"))
      x.oninput = () => {
        w.setConditions({
          ...w.getSelected().conditions,
          [x.dataset.condition!]: x.valueAsNumber,
        });
      };
    for (const x of root.querySelectorAll<HTMLInputElement>("[data-initial]"))
      x.onchange = () => {
        const next = w.getFit();
        if (x.dataset.initial === "charge")
          next.initial.chargeFraction = x.valueAsNumber;
        else
          next.initial.fuelFraction[x.dataset.initial as "diesel"] =
            x.valueAsNumber;
        const v = w.applyFit(next);
        error = v.valid
          ? ""
          : v.issues
              .filter((i) => i.severity === "error")
              .map((i) => i.path + ": " + i.message)
              .join("\n");
        if (el("fit-error")) el("fit-error")!.textContent = error;
        if (v.valid && el("fit-next-revision"))
          el("fit-next-revision")!.textContent =
            "Следующая сборка: " + w.getFit().fitRevision;
        if (v.valid && el("fit-readiness"))
          el("fit-readiness")!.textContent =
            (v.readiness.canRun
              ? "Готова"
              : "Не хватает: " + v.readiness.missing.join(", ")) +
            " · " +
            v.readiness.resourceWarnings.map((i) => i.message).join(" · ");
      };
    listen("fit-main-action", mainAction);
    listen("fit-start", start);
    for (const c of ["pause", "resume", "step", "cancel", "reset"])
      listen("fit-" + c, () => control(c));
    const sp = el<HTMLSelectElement>("fit-speed");
    if (sp)
      sp.onchange = () => {
        speed = Number(sp.value);
      };
    listen("fit-save", () =>
      download("u2-ship-fit.json", serializeFit(w.getFit())),
    );
    listen("fit-export-run", exportRun);
    listen("fit-export-result", () => {
      const result = w.getSelected().result;
      if (result)
        download(
          "u2-fitting-result.json",
          JSON.stringify(
            result,
            (_, v) => (ArrayBuffer.isView(v) ? Array.from(v as any) : v),
            2,
          ),
        );
      else {
        error = "Сначала получите снимок теста.";
        render();
      }
    });
    listen("fit-export-csv", () => {
      const result = w.getSelected().result;
      if (result)
        download(
          "u2-fitting-trace.csv",
          exportFittingTelemetryCsv(result),
          "text/csv",
        );
      else {
        error = "Сначала получите снимок теста.";
        render();
      }
    });
    const imported = el<HTMLInputElement>("fit-import");
    if (imported)
      imported.onchange = async () => {
        const file = imported.files?.[0];
        if (!file) return;
        const selected = w.selectedId;
        try {
          const source = await file.text();
          if (selected !== w.selectedId) {
            error =
              "Вариант изменён во время чтения файла; импорт не применён.";
            render();
            return;
          }
          const p = w.importDocument(source, allowSnapshot);
          if (!p.ok)
            error = p.errors.map((e) => e.path + ": " + e.message).join("\n");
          else if (p.value === "legacy") {
            sessionStorage.setItem(
              "u2-lab:legacy-import",
              serializeExperiment(p.spec!),
            );
            location.search = "?mode=legacy";
            return;
          } else error = "";
          render();
        } catch {
          error =
            "Не удалось прочитать файл. Прошлая сборка и результат сохранены.";
          render();
        }
      };
    const allow = el<HTMLInputElement>("fit-allow-snapshot");
    if (allow)
      allow.onchange = () => {
        allowSnapshot = allow.checked;
      };
    listen("fit-freeze", () => {
      if (!w.freeze())
        error = "Сначала завершите тест или нажмите Отмена для снимка.";
      render();
    });
    listen("fit-variant", () => {
      const f = w.getFit(),
        base = installedInstances(f, catalog).find(
          (i) => i.slotId === selectedSlot,
        )?.item,
        power = el<HTMLInputElement>("fit-variant-power")!.valueAsNumber;
      if (!base || !Number.isFinite(power) || power < 0) {
        error = "Нужна конечная мощность ≥0 W";
        render();
        return;
      }
      const m = structuredClone(base),
        id = "local:" + newId();
      m.id = id;
      m.label = base.label + " · собственный вариант";
      m.numerics.powerW = power;
      m.origins["numerics.powerW"] = {
        kind: "experimental",
        sourceRef: "lab:user-variant",
        unit: "W",
        note: "Собственный численный вариант",
      };
      f.localVariants[id] = m;
      apply(replacement(f, catalog, selectedSlot, id));
    });
    for (const b of root.querySelectorAll<HTMLButtonElement>(
      "[data-channel-group]",
    ))
      b.onclick = () => {
        channel.group = b.dataset.channelGroup!;
        render();
      };
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-curve]"))
      b.onclick = () => {
        const id = b.dataset.curve!;
        channel.hidden.has(id)
          ? channel.hidden.delete(id)
          : channel.hidden.add(id);
        render();
      };
    const unit = el<HTMLSelectElement>("channel-unit");
    if (unit)
      unit.onchange = () => {
        channel.unit = unit.value;
        render();
      };
    listen("channel-prev", () => {
      channel.eventIndex = Math.max(0, channel.eventIndex - 1);
      render();
    });
    listen("channel-next", () => {
      channel.eventIndex = Math.min(
        (r?.events.length ?? 1) - 1,
        channel.eventIndex + 1,
      );
      render();
    });
    for (const b of root.querySelectorAll<HTMLButtonElement>(
      "[data-event-filter]",
    ))
      b.onclick = () => {
        eventFilter = b.dataset.eventFilter!;
        render();
      };
    for (const b of root.querySelectorAll<HTMLButtonElement>("[data-ab-view]"))
      b.onclick = () => {
        abView = b.dataset.abView as AbView;
        render();
      };
    const sort = el<HTMLSelectElement>("compare-sort");
    if (sort)
      sort.onchange = () => {
        compareSort = sort.value;
        render();
      };
    const dialog = el<HTMLDialogElement>("ui-dialog")!;
    if (swap || instance || confirmCancel) {
      dialog.setAttribute(
        "aria-labelledby",
        swap ? "swap-title" : "dialog-title",
      );
      updateDom(
        dialog,
        swap
          ? swapDialog(w, swap)
          : instance
            ? instanceDetails(instance, r)
            : '<div class="dialog-header"><h2 id="dialog-title">Отменить активный тест?</h2></div><p>Сохранится измеренный частичный интервал; завершённого цикла это не подтверждает.</p><div class="dialog-footer"><button id="cancel-no">Продолжить тест</button><button id="cancel-yes" class="primary">Отменить тест</button></div>',
      );
      if (!dialog.open) dialog.showModal();
      dialog.oncancel = (e) => {
        e.preventDefault();
        closeDialog();
      };
      listen("swap-close", closeDialog);
      listen("instance-close", closeDialog);
      listen("cancel-no", closeDialog);
      listen("cancel-yes", () => {
        confirmCancel = false;
        send("cancel");
        render();
      });
      if (swap) {
        const s = swap;
        for (const b of dialog.querySelectorAll<HTMLButtonElement>(
          "[data-catalog-sort]",
        ))
          b.onclick = () => {
            s.sort = b.dataset.catalogSort!;
            render();
          };
        for (const [id, key] of [
          ["swap-search", "query"],
          ["swap-family", "family"],
          ["swap-size", "size"],
          ["swap-sort", "sort"],
        ] as const) {
          const x = el<HTMLInputElement | HTMLSelectElement>(id);
          if (x) {
            const change = () => {
              s[key] = x.value;
              render();
            };
            if (id === "swap-search") x.oninput = change;
            else x.onchange = change;
          }
        }
        for (const b of root.querySelectorAll<HTMLButtonElement>(
          "[data-candidate]",
        ))
          b.onclick = () => {
            s.candidate = b.dataset.candidate!;
            render();
          };
        const batch = el<HTMLInputElement>("swap-batch");
        if (batch)
          batch.onchange = () => {
            s.batch = batch.checked;
            render();
          };
        listen("fit-apply", () => {
          const next = replacement(
              w.getFit(),
              catalog,
              s.slotId,
              s.candidate,
              s.batch,
            ),
            v = w.applyFit(next);
          if (v.valid) {
            swap = undefined;
            error = "";
          } else
            error = v.issues
              .filter((i) => i.severity === "error")
              .map((i) => i.message)
              .join("\n");
          render();
          if (v.valid) el(s.returnId)?.focus();
        });
        listen("fit-remove", () => {
          const v = w.applyFit(
            replacement(w.getFit(), catalog, s.slotId, null),
          );
          if (v.valid) {
            swap = undefined;
            error = "";
          } else
            error = v.issues
              .filter((i) => i.severity === "error")
              .map((i) => i.message)
              .join("\n");
          render();
          if (v.valid) el(s.returnId)?.focus();
        });
      }
    }
    if (!swap && !instance && !confirmCancel && dialog.open) dialog.close();
    if (focusId) {
      const x = el<HTMLInputElement>(focusId);
      x?.focus({ preventScroll: true });
      if (startSelection !== null && x?.type === "search")
        x.setSelectionRange(startSelection, startSelection);
    }
  }
  let eventFilter = "all";
  worker.onmessage = (event) => {
    const m = event.data;
    if (m.runId !== runId) return;
    const active = w.getActive();
    if (m.type === "control-ack") {
      const requested = pending.get(m.commandId);
      if (!requested || requested.type !== m.control) return;
      ack =
        m.control +
        " ACK · " +
        (performance.now() - requested.at).toFixed(1) +
        " ms";
      pending.delete(m.commandId);
      if (m.control === "pause" || m.control === "step")
        w.setStatus(runId, "paused");
      if (m.control === "resume") w.setStatus(runId, "running");
      render();
    } else if (m.type === "chunk" && active) {
      const p = m.payload;
      w.acceptResult({ ...p, runId, spec: active.spec, status: "paused" });
      worker.postMessage({ runId, type: "telemetry-ack", chunkId: m.chunkId });
      render();
    } else if (m.type === "complete" || m.type === "snapshot") {
      if (w.acceptResult(m.payload)) render();
    } else if (m.type === "error") {
      error = String(m.payload);
      w.abort();
      render();
    }
  };
  const resize = () => render();
  window.addEventListener("resize", resize);
  render();
  return {
    getFit: () => w.getFit(),
    applyFit: apply,
    showRun: (r) => {
      w.showRun(r);
      render();
    },
    destroy() {
      worker.terminate();
      window.removeEventListener("resize", resize);
      root.classList.remove("fitting-app");
      root.replaceChildren();
    },
  };
}
