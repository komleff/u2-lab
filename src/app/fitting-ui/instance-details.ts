import type { ResolvedInstance } from "../../fitting/types";
import type { RunResultV2 } from "../../runner/run";
import { esc, num, mass, heatCapacity, snapshotMatches } from "./presentation";
import { channelRows } from "./telemetry";
export function instanceDetails(i: ResolvedInstance, r?: RunResultV2) {
  const b = r?.buckets.at(-1),
    rows =
      r && snapshotMatches(i, r)
        ? channelRows(r, b).filter((x) => x.id.endsWith(":" + i.id))
        : [];
  return `<div class="dialog-header"><h2 id="dialog-title">${esc(i.item.label)}</h2><button id="instance-close" aria-label="Закрыть параметры экземпляра">✕</button></div><div class="dialog-body"><p>${esc(i.id)} · ${i.builtin ? "🔒 Встроено · заменить нельзя" : "сменный"} · производитель не указан</p><p>Сухая масса ${num(mass(i.item), "кг")} · C ${num(heatCapacity(i.item), "Дж/K")}</p><p>Содержимое меняет массу, но не теплоёмкость.</p><h3>Измеренные каналы экземпляра</h3><p>Последний bucket ${num(b?.startSeconds)}–${num(b?.endSeconds, "с")}; среднее этого bucket, а не всего теста.</p>${rows.length ? `<dl>${rows.map((x) => `<div><dt>${esc(x.id)}</dt><dd>${num(x.mean, x.unit)} · min ${num(x.min)} · max ${num(x.max)} · count ${x.count}</dd></div>`).join("")}</dl>` : "<p>нет канала в снимке</p>"}<h3>Номинальные ТТХ, сухой bill и происхождение</h3><pre id="instance-sources">${esc(JSON.stringify(i.item, null, 2))}</pre></div>`;
}
