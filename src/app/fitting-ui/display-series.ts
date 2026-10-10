// Агрегация только для SVG. Retention, статистика и экспорт не используют её.
export type DisplayInterval = {
  startS: number; endS: number; mean: number; min: number; max: number;
  // count для прежней телеметрии; duration для сигнатур.
  weight: number;
};
export function displaySeries(rows: readonly DisplayInterval[], columns: number): DisplayInterval[] {
  if (!rows.length) return [];
  const count = Math.max(1, Math.floor(columns)), start = rows[0].startS, end = rows.at(-1)!.endS;
  const result: DisplayInterval[] = [];
  let priorColumn = -1;
  for (const row of rows) {
    const column = Math.min(count - 1, Math.floor((row.endS - start) / (end - start || 1) * count));
    const prior = result.at(-1);
    if (prior && column === priorColumn) {
      const weight = prior.weight + row.weight;
      // Равный сигнал сохраняется буквально. Для остальных средних сначала
      // нормируем значения: доли subnormal не округляются отдельно в ноль,
      // а большие конечные значения не переполняют weighted numerator.
      if (prior.mean !== row.mean) {
        const scale = Math.max(Math.abs(prior.mean), Math.abs(row.mean));
        prior.mean = (((prior.mean / scale) * prior.weight + (row.mean / scale) * row.weight) / weight) * scale;
      }
      prior.weight = weight; prior.endS = row.endS;
      prior.min = Math.min(prior.min, row.min); prior.max = Math.max(prior.max, row.max);
    } else result.push({...row});
    priorColumn = column;
  }
  return result;
}
export function displayPaths(rows: readonly DisplayInterval[], x: (t: number) => number, y: (v: number) => number) {
  return {
    envelope: rows.filter(b => Number.isFinite(b.min) && Number.isFinite(b.max)).map(b =>
      `M${x(b.startS)} ${y(b.min)}H${x(b.endS)}V${y(b.max)}H${x(b.startS)}Z`).join(""),
    // У retained bucket нет неизвестной внутренней детализации: один mean
    // относится ко всему span, включая ранний большой объединённый интервал.
    points: rows.filter(b => Number.isFinite(b.mean)).map(b =>
      `${x(b.startS)},${y(b.mean)} ${x(b.endS)},${y(b.mean)}`).join(" "),
  };
}
