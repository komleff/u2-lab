// Термоинвертор с частичным обходом: доля x панелей на контуре компрессора при T_rad, остальные при T_ship.
const SIGMA = 5.670374419e-8;
const P = { etaII: 0.5, etaDrive: 0.95, Ge: 0.5e6, Gc: 0.5e6, PbusMax: 4e6, Tpanel: 700 };
const K = 882;
// Для доли x и требуемого прироста охлаждения корпуса над обходом (gain) — минимальный P_bus
function solve(Ts, Tenv, x, gain) {
  const bypassAll = K * SIGMA * (Ts ** 4 - Tenv ** 4);
  const bypassRest = (1 - x) * K * SIGMA * (Ts ** 4 - Tenv ** 4);
  // Нужно: Qc − потери привода = gain + bypassAll − bypassRest
  let best = null;
  for (let Tr = Math.max(Ts, Tenv) + 0.5; Tr <= P.Tpanel; Tr += 0.5) {
    const Qh = x * K * SIGMA * (Tr ** 4 - Tenv ** 4);
    if (Qh <= 0) continue;
    // Qh = Qc + W, W = Qc/COP; итерация по Qc
    let Qc = Qh * 0.5;
    for (let i = 0; i < 60; i++) {
      const Te = Ts - Qc / P.Ge, Tc = Tr + Qh / P.Gc;
      if (Te <= 0 || Tc <= Te) { Qc = NaN; break; }
      const cop = P.etaII * Te / (Tc - Te);
      Qc = Qh * cop / (1 + cop);
    }
    if (!(Qc > 0)) continue;
    const W = Qh - Qc, bus = W / P.etaDrive, net = Qc - (1 - P.etaDrive) * bus;
    const g = bypassRest + net - bypassAll;
    if (g >= gain) { best = { Tr, Qh, Qc, bus, gain: g }; break; }
  }
  return best;
}
function report(name, Ts, Tenv, gain) {
  const rows = [];
  for (const x of [0.1, 0.2, 0.3, 0.5, 0.7, 1.0]) {
    const s = solve(Ts, Tenv, x, gain);
    if (s) rows.push({ x, Tr: s.Tr.toFixed(0), busMW: (s.bus / 1e6).toFixed(3), perW: (gain / s.bus).toFixed(2) });
  }
  console.log(name, JSON.stringify(rows));
}
// Прирост охлаждения на 1 Вт питания: окупается от дизель-генератора при > 1,50, от H2 при > 1,25, от аккумулятора при > 0,11
report("500K/100K +0.5MW", 500, 100, 0.5e6);
report("500K/100K +1.0MW", 500, 100, 1.0e6);
report("500K/100K +1.5MW", 500, 100, 1.5e6);
// Горячая среда: обход отрицательный (панели убраны), считаем прирост над нулём — используем только контур
function hot(name, Ts, Tenv, need) {
  const rows = [];
  for (const x of [0.2, 0.5, 1.0]) {
    let best = null;
    for (let Tr = Tenv + 0.5; Tr <= P.Tpanel; Tr += 0.5) {
      const Qh = x * K * SIGMA * (Tr ** 4 - Tenv ** 4);
      let Qc = Qh * 0.5;
      for (let i = 0; i < 60; i++) { const Te = Ts - Qc / P.Ge, Tc = Tr + Qh / P.Gc; const cop = P.etaII * Te / (Tc - Te); Qc = Qh * cop / (1 + cop); }
      const bus = (Qh - Qc) / P.etaDrive, net = Qc - (1 - P.etaDrive) * bus;
      if (net >= need) { best = { Tr, bus }; break; }
    }
    if (best) rows.push({ x, Tr: best.Tr.toFixed(0), busMW: (best.bus / 1e6).toFixed(3), perW: (need / best.bus).toFixed(2) });
  }
  console.log(name, JSON.stringify(rows));
}
hot("hot 600K/450K need 0.5MW", 450, 600, 0.5e6);
hot("hot 600K/450K need 1.0MW", 450, 600, 1.0e6);
hot("warm 480K/450K need 1.0MW", 450, 480, 1.0e6);
