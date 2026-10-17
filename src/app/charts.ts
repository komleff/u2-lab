import type { Bucket } from "../runner/retention";
export function drawChart(
  canvas: HTMLCanvasElement,
  buckets: Bucket[],
  channels: string[],
  lines: { channel: string; color: string; label: string }[],
  unit: string,
  limits: number[] = [],
) {
  const rect = canvas.getBoundingClientRect(),
    dpr = devicePixelRatio || 1;
  canvas.width = Math.max(300, rect.width) * dpr;
  canvas.height = 190 * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const w = canvas.width / dpr,
    h = 190,
    left = 56,
    right = 12,
    top = 20,
    bottom = 28;
  ctx.clearRect(0, 0, w, h);
  const indices = lines.map((l) => channels.indexOf(l.channel));
  let min = 0,
    max = Math.max(1, ...limits);
  for (const b of buckets)
    for (const i of indices)
      if (i >= 0) {
        min = Math.min(min, b.min[i]);
        max = Math.max(max, b.max[i]);
      }
  if (max === min) max = min + 1;
  const x0 = buckets[0]?.startSeconds ?? 0,
    x1 = buckets.at(-1)?.endSeconds ?? 1;
  const y = (v: number) => top + ((max - v) / (max - min)) * (h - top - bottom),
    x = (t: number) => left + ((t - x0) / (x1 - x0 || 1)) * (w - left - right);
  ctx.font = "10px monospace";
  for (let i = 0; i <= 3; i++) {
    const v = min + ((max - min) * i) / 3;
    ctx.strokeStyle = "#25333e";
    ctx.beginPath();
    ctx.moveTo(left, y(v));
    ctx.lineTo(w - right, y(v));
    ctx.stroke();
    ctx.fillStyle = "#8498a5";
    ctx.fillText(`${format(v)} ${unit}`, 2, y(v) + 3);
  }
  for (const limit of limits) {
    ctx.strokeStyle = "#bd925d66";
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(left, y(limit));
    ctx.lineTo(w - right, y(limit));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let n = 0; n < lines.length; n++) {
    const i = indices[n];
    if (i < 0) continue;
    const l = lines[n];
    ctx.strokeStyle = l.color + "30";
    for (const b of buckets) {
      ctx.beginPath();
      ctx.moveTo(x(b.endSeconds), y(b.min[i]));
      ctx.lineTo(x(b.endSeconds), y(b.max[i]));
      ctx.stroke();
    }
    ctx.strokeStyle = l.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    buckets.forEach((b, j) => {
      const px = x(b.endSeconds),
        py = y(b.sum[i] / b.count);
      j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.stroke();
  }
  ctx.fillStyle = "#8498a5";
  ctx.fillText(`${format(x0)} s`, left, h - 6);
  ctx.fillText(`${format(x1)} s`, w - 75, h - 6);
  if (!buckets.length) {
    ctx.font = "12px sans-serif";
    ctx.fillText("Ожидание измерений", left + 20, 95);
  }
}
export function format(n: number) {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  return a >= 1e9
    ? `${(n / 1e9).toFixed(2)}G`
    : a >= 1e6
      ? `${(n / 1e6).toFixed(2)}M`
      : a >= 1e3
        ? `${(n / 1e3).toFixed(1)}k`
        : a > 0 && a < 0.001
          ? n.toExponential(2)
          : n.toFixed(a < 10 ? 3 : 1);
}
