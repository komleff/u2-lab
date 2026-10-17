// Резерв 2×V_FA для электрокораблей и время манёвров тихого хода по критерию ~5 км.
// V_FA — по корпусу из таблицы оператора каталога 0.2.4 (lab:operator-2026-10-07-catalog-0.2.4-speed-correction).
const rows = require(process.argv[2]);
const VFA = { sputnik: 250, pony: 225, "industrial-S": 225, "civilian-M": 225, "industrial-M": 200, "industrial-L": 175, "severin-mir": 225 };
const quiet = { hydrogen: 0.4, diesel: 0.02, electric: 0.005 };
// Разворот на 180° «разгон — полка — торможение» при угловом ускорении alpha и пределе omega, °/с² и °/с
function turn(alpha, omega) {
  const tA = omega / alpha, angA = alpha * tA * tA;
  return angA >= 180 ? 2 * Math.sqrt(180 / alpha) : 2 * tA + (180 - angA) / omega;
}
const fmt = (s) => (s < 120 ? `${s.toFixed(0)} с` : `${(s / 60).toFixed(0)} мин`);
for (const r of rows) {
  if (r.error) continue;
  const hull = r.id.split(":")[0];
  const v = VFA[hull];
  const p = r.propulsion.split(",")[0];
  const size = hull.endsWith("-L") ? "L" : hull.endsWith("-M") || hull === "severin-mir" ? "M" : "S";
  const om = { S: 48, M: 24, L: 12 }[size];
  const aFull = r.forceN / r.fullKg, aStart = r.forceN / r.startKg;
  const t2 = (2 * v) / aFull;
  const reserve = p === "electric" ? `${((r.powerW * t2) / 0.9 / 1e9).toFixed(2)} ГДж = ${((100 * r.powerW * t2) / 0.9 / r.batteryJ).toFixed(1)}%` : "—";
  const f = quiet[p];
  console.log([r.id, p, `V_FA ${v}`, `обычный разгон ${fmt(v / aFull)}`, `резерв 2×V_FA ${reserve}`,
    `тихий ${f * 100}%: до V_FA ${fmt(v / (f * aFull))} / пустой ${fmt(v / (f * aStart))}`,
    `разворот: обычный ${turn(om, om).toFixed(1)} с, тихий ${turn(om * f, om).toFixed(1)} с, гиродины ${(3 * turn(om, om)).toFixed(0)} с`].join(" | "));
}
