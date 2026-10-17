// Цена электростелса: тихий ход при экранировании (все паразитные ступени ×0,5), со стелс-линейкой
// электродвигателя (средний класс EM у инвертора привода) и с обоими; гражданские опоры — Спутник (S) и Мир (M).
const rows = require(process.argv[2]);
const EM_TH = 7.2803e-13;
const W = (km) => 4 * Math.PI * EM_TH * (km * 1000) ** 2;
const VFA = { "industrial-S": 225, "industrial-M": 200, "severin-mir": 225 };
const Q = { S: 10, M: 20 };
const EM_ENGINE_S_FULL = 26.912281e6 * 1e-9 + 29.95809e6 * 3e-10;
const HULL_EM = W(3.08);
const powerK = { S: 1, M: 8.82 / 2.95 }, hullK = { S: 1, M: 4 };
const fmt = (s) => (s < 120 ? `${s.toFixed(0)} с` : `${(s / 60).toFixed(1)} мин`);
for (const r of rows) {
  if (r.error || !r.propulsion.startsWith("electric")) continue;
  const hull = r.id.split(":")[0], size = hull.endsWith("-M") || hull === "severin-mir" ? "M" : "S";
  const aFull = r.forceN / r.fullKg, v = VFA[hull], km = Q[size];
  const variants = { "без ничего": [1, 1], "экранирование ×0,5": [0.5, 1], "стелс-линейка двигателя": [1, 0.4], "экран + стелс-линейка": [0.5, 0.4] };
  const parts = Object.entries(variants).map(([name, [shield, engine]]) => {
    const f = Math.max(0, Math.min(1, (W(km) / shield - HULL_EM * hullK[size]) / (EM_ENGINE_S_FULL * powerK[size] * engine)));
    return `${name}: ${(100 * f).toFixed(1)}%, до V_FA ${fmt(v / (f * aFull))}`;
  });
  console.log(`${r.id} (порог ${km} км): ` + parts.join(" | "));
}
