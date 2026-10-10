// Тихий ход по порогу, зависящему от калибра: S 10 км, M 20 км, L 40 км (датчик S, фон 250 K).
// Для каждого готового корабля — доля тяги, время до V_FA, время набора 1 м/с; варианты:
// стелс-линейка электродвигателя (средний класс EM, 3·10⁻¹⁰) и выхлоп H₂ ярче в 10 раз.
const rows = require(process.argv[2]);
const IR_TH = 2.5109e-4, EM_TH = 7.2803e-13;
const W = (km, th) => 4 * Math.PI * th * (km * 1000) ** 2;
const VFA = { sputnik: 250, pony: 225, "industrial-S": 225, "civilian-M": 225, "industrial-M": 200, "industrial-L": 175, "severin-mir": 225 };
const QUIET_KM = { S: 10, M: 20, L: 40 };
const sizeOf = (hull) => (hull.endsWith("-L") ? "L" : hull.endsWith("-M") || hull === "severin-mir" ? "M" : "S");
// Опоры S: EM электродвигателя на полной тяге (таблица 4.5 ТЗ): высокий класс 26,912 МВт + средний 29,958 МВт (вход двигателя
// через разряд); IR выхлопа химических двигателей с кормы на 10% тяги: дизель 12,0 км, H₂ 2,4 км (профили §2.2).
const EM_ENGINE_S_FULL = 26.912281e6 * 1e-9 + 29.95809e6 * 3e-10; // Вт EM на полной тяге S
const HULL_EM_W = W(3.08, EM_TH); // корпус на аккумуляторе, 200 кВт жизнеобеспечения
const IR10 = { diesel: 12.0, hydrogen: 2.4 };
const powerK = { S: 1, M: 8.82 / 2.95, L: 8.82 / 2.95 }; // L в каталоге несёт двигатели M
const hullK = { S: 1, M: 4, L: 16 };
function fraction(size, kind, km, opts = {}) {
  if (kind === "electric") {
    const emFull = EM_ENGINE_S_FULL * powerK[size] * (opts.stealthLine ? 0.4 : 1); // стелс-линейка: высокий класс → средний у инвертора привода
    return Math.max(0, Math.min(1, (W(km, EM_TH) - HULL_EM_W * hullK[size]) / emFull));
  }
  const r10 = IR10[kind] * Math.sqrt(powerK[size]) * (opts.h2x10 && kind === "hydrogen" ? Math.sqrt(10) : 1);
  return Math.min(1, 0.1 * (km / r10) ** 2);
}
const fmt = (s) => (!isFinite(s) ? "∞" : s < 120 ? `${s.toFixed(0)} с` : `${(s / 60).toFixed(1)} мин`);
for (const r of rows) {
  if (r.error) continue;
  const hull = r.id.split(":")[0], size = sizeOf(hull), v = VFA[hull], kind = r.propulsion.split(",")[0];
  const km = QUIET_KM[size], aFull = r.forceN / r.fullKg;
  const f = fraction(size, kind, km);
  const line = [`${r.id} (${size}, ${kind}, V_FA ${v}, порог ${km} км)`, `тяга ${(100 * f).toFixed(1)}%`, `до V_FA ${fmt(v / (f * aFull))}`, `1 м/с за ${(1 / (f * aFull)).toFixed(1)} с`];
  if (kind === "electric") { const fs = fraction(size, kind, km, { stealthLine: true }); line.push(`стелс-линейка: ${(100 * fs).toFixed(1)}%, до V_FA ${fmt(v / (fs * aFull))}`); }
  if (kind === "hydrogen") { const fh = fraction(size, kind, km, { h2x10: true }); line.push(`выхлоп ×10: ${(100 * fh).toFixed(0)}%, до V_FA ${fmt(v / (fh * aFull))}`); }
  console.log(line.join(" | "));
}
// Дальности стоящего гражданского корабля по калибру (IR, равновесие, генератор покрывает нагрузку)
const chain = { D: 2.495, H: 2.245, E: 1.111 }, hotel = { S: 0.2e6, M: 0.8e6, L: 3.2e6 };
console.log("\nСтоящий гражданский, IR-дальность (датчик S), км:");
for (const s of ["S", "M", "L"]) console.log(`  ${s}: D ${Math.sqrt(hotel[s] * chain.D / (4 * Math.PI * IR_TH)) / 1000 | 0}, H ${Math.sqrt(hotel[s] * chain.H / (4 * Math.PI * IR_TH)) / 1000 | 0}, E ${Math.sqrt(hotel[s] * chain.E / (4 * Math.PI * IR_TH)) / 1000 | 0}`);
