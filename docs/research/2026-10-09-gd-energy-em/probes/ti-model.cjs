// Модель термоинвертора-теплового насоса: без своей площади, T_rad выбирается регулятором.
const SIGMA = 5.670374419e-8;
const P = { etaII: 0.5, etaDrive: 0.95, Ge: 0.5e6, Gc: 0.5e6, PbusMax: 4e6, Tfluid: 750, Tpanel: 700 };

// Для заданного отбора тепла Qc ищет минимальную T_rad, при которой контур сходится.
function solveForQc(Ts, Tenv, K, Qc, p = P) {
  const Te = Ts - Qc / p.Ge;
  if (Te <= 0) return null;
  const f = Tr => {
    const Qh = K * SIGMA * (Tr ** 4 - Tenv ** 4);
    const Tc = Tr + Math.max(Qh, 0) / p.Gc;
    const cop = p.etaII * Te / (Tc - Te);
    const shaft = Qc / cop;
    return { Tr, Qh, Tc, Te, cop, shaft, bus: shaft / p.etaDrive, resid: Qh - Qc - shaft };
  };
  let lo = Math.max(Ts, Tenv) + 1e-6, hi = 3000;
  // Ищем первый корень сканированием, затем делением пополам
  let prev = f(lo), step = 0.5;
  for (let Tr = lo + step; Tr <= hi; Tr += step) {
    const cur = f(Tr);
    if (prev.resid < 0 && cur.resid >= 0) {
      let a = Tr - step, b = Tr;
      for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (f(m).resid < 0) a = m; else b = m; }
      return f(b);
    }
    prev = cur;
  }
  return null;
}
// Подбирает Qc так, чтобы чистое охлаждение корпуса (Qc минус потери привода) равнялось цели.
function solveNet(Ts, Tenv, K, netNeed, p = P) {
  let Qc = netNeed;
  for (let i = 0; i < 200; i++) {
    const s = solveForQc(Ts, Tenv, K, Qc, p);
    if (!s) return null;
    const next = netNeed + (1 - p.etaDrive) * s.bus;
    if (Math.abs(next - Qc) < 1e-3) return { ...s, Qc, net: Qc - (1 - p.etaDrive) * s.bus };
    Qc = next;
  }
  return null;
}
const fmt = (s, extra) => s ? JSON.stringify({ ...extra, Tr: s.Tr.toFixed(1), Tc: s.Tc.toFixed(1), Te: s.Te.toFixed(1), COP: s.cop.toFixed(3), QcMW: (s.Qc / 1e6).toFixed(3), shaftMW: (s.shaft / 1e6).toFixed(3), busMW: (s.bus / 1e6).toFixed(3), QhMW: (s.Qh / 1e6).toFixed(3), hostLossMW: ((1 - P.etaDrive) * s.bus / 1e6).toFixed(3), balanceW: (s.Qc + s.bus - s.Qh - (1 - P.etaDrive) * s.bus).toFixed(3) }) : "нет решения";

const K = 882; // эффективная площадь активного радиатора S (εA)
const bypass = (Ts, Tenv) => K * SIGMA * (Ts ** 4 - Tenv ** 4);
console.log("bypass at 500/100 MW", (bypass(500, 100) / 1e6).toFixed(3), " at 450/100", (bypass(450, 100) / 1e6).toFixed(3), " at 450/600", (bypass(450, 600) / 1e6).toFixed(3));
// Пример 1: холодная среда, корабль 500 K, нужно на 1,5 МВт больше, чем даёт байпас.
const need1 = bypass(500, 100) + 1.5e6;
console.log("E1", fmt(solveNet(500, 100, K, need1), { needMW: (need1 / 1e6).toFixed(3) }));
// Пример 1b: нужно ровно столько, сколько даёт байпас (граница включения).
console.log("E1b", fmt(solveNet(500, 100, K, bypass(500, 100)), { needMW: (bypass(500, 100) / 1e6).toFixed(3) }));
// Пример 2: горячая среда 600 K, корабль 450 K, нужно отвести 1 МВт.
console.log("E2", fmt(solveNet(450, 600, K, 1e6), { needMW: 1 }));
// Пример 3: предел по мощности: максимальное чистое охлаждение при 500/100 K и P_bus ≤ 4 МВт
let best = null;
for (let n = bypass(500, 100); n < 20e6; n += 0.01e6) { const s = solveNet(500, 100, K, n); if (!s || s.bus > P.PbusMax || s.Tr > P.Tpanel || s.Tc > P.Tfluid) break; best = { ...s, need: n }; }
console.log("E3 max at 4MW", fmt(best, { needMW: (best.need / 1e6).toFixed(3) }));
// Пример 3b: какой предел срабатывает первым
let hit = null;
for (let n = bypass(500, 100); n < 20e6; n += 0.01e6) { const s = solveNet(500, 100, K, n); if (!s) { hit = "нет решения"; break; } if (s.bus > P.PbusMax) { hit = "мощность"; break; } if (s.Tr > P.Tpanel) { hit = "панель"; break; } if (s.Tc > P.Tfluid) { hit = "рабочее тело"; break; } }
console.log("E3 first limit", hit);
// Пример 4: горячая среда, максимум
best = null; hit = null;
for (let n = 0.05e6; n < 20e6; n += 0.01e6) { const s = solveNet(450, 600, K, n); if (!s) { hit = "нет решения"; break; } if (s.bus > P.PbusMax) { hit = "мощность"; break; } if (s.Tr > P.Tpanel) { hit = "панель"; break; } if (s.Tc > P.Tfluid) { hit = "рабочее тело"; break; } best = { ...s, need: n }; }
console.log("E4 hot env max", fmt(best, { needMW: (best.need / 1e6).toFixed(3) }), "limit", hit);
// Сравнение с нынешней Лабой при 300 K без потребности
console.log("E5 нынешняя Лаба: 7.877 MW при 300 K без потребности; новая модель: 0 MW (простой)");
