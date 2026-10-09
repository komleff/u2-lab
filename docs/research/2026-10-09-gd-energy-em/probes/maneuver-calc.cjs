// Резерв 2×V_FA для электрокораблей и время манёвров тихого хода по критерию ~5 км.
const rows = require(process.argv[2]);
const VFA = [250, 500];
const quiet = { hydrogen: 0.4, diesel: 0.02, electric: 0.005 };
// Разворот на 180° «разгон — полка — торможение» при угловом ускорении alpha и пределе omega, °/с² и °/с
function turn(alpha, omega) {
  const tA = omega / alpha, angA = alpha * tA * tA; // разгон и торможение вместе
  return angA >= 180 ? 2 * Math.sqrt(180 / alpha) : 2 * tA + (180 - angA) / omega;
}
for (const r of rows) {
  if (r.error) continue;
  const p = r.propulsion.split(",")[0];
  const size = r.id.includes("-M") || r.id.includes("mir") ? "M" : r.id.includes("-L") ? "L" : "S";
  const om = { S: 48, M: 24, L: 12 }[size];
  const aFull = r.forceN / r.fullKg, aStart = r.forceN / r.startKg;
  const parts = [r.id, p, size, "m(t) start/full", (r.startKg / 1e3).toFixed(0), (r.fullKg / 1e3).toFixed(0), "a start/full", aStart.toFixed(1), aFull.toFixed(1)];
  for (const v of VFA) {
    const t2 = (2 * v) / aFull;
    if (p === "electric") {
      const E = r.powerW * t2 / 0.9; // разряд 0,9
      parts.push(`V${v}: 2xVFA ${t2.toFixed(1)}s ${(E / 1e6).toFixed(0)}MJ = ${(100 * E / r.batteryJ).toFixed(1)}% batt`);
    } else parts.push(`V${v}: 2xVFA ${t2.toFixed(1)}s`);
    const f = quiet[p];
    parts.push(`quiet ${f * 100}%: to VFA ${(v / (f * aFull)).toFixed(0)}s(full)/${(v / (f * aStart)).toFixed(0)}s(start)`);
  }
  parts.push(`turn180 full ${turn(om, om).toFixed(1)}s, quiet ${turn(om * quiet[p], om).toFixed(1)}s, gyro ${(3 * turn(om, om)).toFixed(1)}s`);
  console.log(parts.join(" | "));
}
