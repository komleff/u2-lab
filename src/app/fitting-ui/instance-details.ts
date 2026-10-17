import type { ResolvedInstance } from "../../fitting/types";
import type { RunResultV2 } from "../../runner/run";
import type { RunSpecV2 } from "../../model/v2/types";
import { esc, num, moduleProfile, snapshotMatches } from "./presentation";
import { channelRows } from "./telemetry";
export function instanceDetails(i: ResolvedInstance, r?: RunResultV2, process?: RunSpecV2["process"]) {
  const b = r?.buckets.at(-1),
    rows =
      r && snapshotMatches(i, r)
        ? channelRows(r, b).filter((x) => x.id.endsWith(":" + i.id))
        : [];
  return `<div class="dialog-header"><h2 id="dialog-title">${esc(i.item.label)}</h2><button id="instance-close" aria-label="Закрыть параметры экземпляра">✕</button></div><div class="dialog-body"><p>${i.builtin ? "🔒 Встроено · заменить нельзя" : "Сменное изделие"}</p><div class="module-profile">${moduleProfile(i.item, process)}</div>${r && !snapshotMatches(i, r) ? '<p class="warning">не измерено — изменено после теста</p>' : ""}${rows.length ? `<h3>Измеренные каналы экземпляра</h3><p>Тест ${esc(r!.runId)} · последний bucket ${num(b?.startSeconds)}–${num(b?.endSeconds, "с")}; среднее этого bucket, а не всего теста.</p><dl>${rows.map((x) => `<div><dt>${esc(x.id)}</dt><dd>${num(x.mean, x.unit)} · min ${num(x.min)} · max ${num(x.max)} · count ${x.count}</dd></div>`).join("")}</dl>` : ""}<section class="module-info-body"><h3>ТТХ и происхождение</h3><p>Экземпляр ${esc(i.id)}</p><pre id="instance-sources">${esc(JSON.stringify(i.item, null, 2))}</pre></section></div>`;
}
