// Критерий тихого хода: на каком расстоянии заметен гражданский корабль на стоянке и какую тягу
// стелс может позволить себе, чтобы при равных сенсорах заметить его первым.
// Дальность: R = sqrt(W / (4π·порог)); IR в равновесии — вся выделяемая теплота, EM — сумма ступеней.
const IR_TH = 2.5109e-4, EM_TH = 7.2803e-13; // пороги обнаружения датчика S новой ревизии, Вт/м²
const R = (W, th) => Math.sqrt(W / (4 * Math.PI * th)) / 1000;
const W = (km, th) => 4 * Math.PI * th * (km * 1000) ** 2;
const ships = require(process.argv[2]);
// Гражданский корабль на стоянке: жизнеобеспечение × тепло цепочки питания (генератор покрывает нагрузку)
const chain = { D: 2.495, H: 2.245, E: 1.111 };
const hotel = { S: 0.2e6, M: 0.8e6 };
// EM на стоянке, датчик S (жизнеобеспечение 200 кВт; у M всё ×4 по мощности)
const emRestS = { D: 6.61, H: 4.99, E: 3.08 };
// Генератор дизеля в минимальном режиме даёт выхлоп с кормы ~4,5 км (S)
console.log("Гражданский корабль на стоянке, фон 250 K, датчик S (дальность, км):");
for (const size of ["S", "M"]) {
  for (const k of ["D", "H", "E"]) {
    const ir = R(hotel[size] * chain[k], IR_TH);
    const em = emRestS[k] * Math.sqrt(hotel[size] / 0.2e6);
    const stern = k === "D" ? Math.hypot(ir, 4.5 * Math.sqrt(hotel[size] / 0.2e6)) : ir;
    console.log(`  ${size} ${k}: IR ${ir.toFixed(1)} (корма ${stern.toFixed(1)}), EM ${em.toFixed(1)}`);
  }
}
// След двигателя стелса: электро — EM, химические — IR выхлопа с кормы; S опора 10% тяги
const engS = { E: { full: 3.5883e-2, th: EM_TH }, D: { at10: 12.0, th: IR_TH }, H: { at10: 2.4, th: IR_TH } };
const sizeK = { S: 1, M: 8.82 / 2.95 }; // мощность двигателя M / S
const baseEM = { S: W(3.08, EM_TH), M: W(3.08, EM_TH) * 4 }; // корпус на аккумуляторе
function fraction(size, k, km) {
  if (k === "E") return Math.min(1, Math.max(0, (W(km, EM_TH) - baseEM[size]) / (engS.E.full * sizeK[size])));
  const r10 = engS[k].at10 * Math.sqrt(sizeK[size]);
  return Math.min(1, 0.1 * (km / r10) ** 2);
}
const acc = {};
for (const s of ships) {
  if (s.error) continue;
  acc[s.id] = { full: s.forceN / s.fullKg, start: s.forceN / s.startKg };
}
const cases = [["Ермак", "S", "industrial-S:1:", 225], ["Титан", "M", "industrial-M:2:", 200]];
for (const km of [5, 8, 10, 12, 15]) {
  console.log(`\nКритерий ${km} км (датчик S):`);
  for (const [name, size, prefix, vfa] of cases) {
    const parts = ["D", "H", "E"].map((k) => {
      const f = fraction(size, k, km), a = acc[prefix + k];
      const t = vfa / (f * a.full), t0 = vfa / (f * a.start);
      const fmt = (s) => (s < 120 ? `${s.toFixed(0)} с` : `${(s / 60).toFixed(1)} мин`);
      return `${k}: тяга ${(100 * f).toFixed(1)}%, до V_FA ${fmt(t)} (пустой ${fmt(t0)}), 1 м/с за ${(1 / (f * a.full)).toFixed(1)} с`;
    });
    console.log(`  ${name}: ${parts.join(" | ")}`);
  }
}
