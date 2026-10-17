// Варианты спасения термоинвертора: отдача (Вт охлаждения на Вт питания) и наибольшее охлаждение
// при разных η_II, пределе горячей стороны, проводимости теплообменников и площади панелей.
const SIGMA = 5.670374419e-8, PUMP = 0.3e6;
function solve(P, Ts, Tenv, gain) {
  const hot = Tenv >= Ts;
  const bypass = Math.max(0, P.K * SIGMA * (Ts ** 4 - Tenv ** 4));
  const need = gain + (hot ? PUMP : 0);
  for (let Tr = Math.max(Ts, Tenv) + 0.25; Tr <= P.Tpanel; Tr += 0.25) {
    const Qh = P.K * SIGMA * (Tr ** 4 - Tenv ** 4);
    let Qc = Qh * 0.5, ok = true;
    for (let i = 0; i < 60; i++) {
      const Te = Ts - Qc / P.Ge, Tc = Tr + Qh / P.Gc;
      if (Te <= 0 || Tc <= Te) { ok = false; break; }
      const cop = P.etaII * Te / (Tc - Te);
      Qc = Qh * cop / (1 + cop);
    }
    if (!ok) continue;
    const bus = (Qh - Qc) / P.etaDrive, net = Qc - (1 - P.etaDrive) * bus;
    if (net - bypass >= need) return bus > P.PbusMax ? null : gain / (bus + (hot ? PUMP : 0));
  }
  return null;
}
// Наибольший чистый прирост охлаждения сверх обхода при P_max
function maxGain(P, Ts, Tenv) {
  let lo = 0, hi = 30e6;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; solve(P, Ts, Tenv, m) === null ? (hi = m) : (lo = m); }
  return lo;
}
const base = { K: 882, etaII: 0.5, etaDrive: 0.95, Ge: 0.5e6, Gc: 0.5e6, Tpanel: 700, PbusMax: 4e6 };
const variants = {
  "база (G1)": base,
  "η_II 0,65": { ...base, etaII: 0.65 },
  "G ×2": { ...base, Ge: 1e6, Gc: 1e6 },
  "горячая сторона 850 K": { ...base, Tpanel: 850 },
  "панели ×2 (встроенный радиатор)": { ...base, K: 1764 },
  "поколение: η 0,65 + G ×2 + 850 K": { ...base, etaII: 0.65, Ge: 1e6, Gc: 1e6, Tpanel: 850 },
  "всё + панели ×2": { ...base, etaII: 0.65, Ge: 1e6, Gc: 1e6, Tpanel: 850, K: 1764 },
};
const cases = [[480, 250, "стандарт, пик добычи"], [480, 430, "горячий сектор 430"], [480, 500, "фон 500 (горячее корабля)"], [450, 600, "пекло 600"]];
for (const [name, P] of Object.entries(variants)) {
  const parts = cases.map(([Ts, Te, label]) => {
    const g = solve(P, Ts, Te, 1e6);
    return `${label}: отдача ${g === null ? "—" : g.toFixed(2)}, максимум +${(maxGain(P, Ts, Te) / 1e6).toFixed(2)} МВт`;
  });
  console.log(name + " | " + parts.join(" | "));
}
