// Прогон по поколениям G1…G∞ для опорных шахтёров S (Спутник D — гражданский, Ермак D — промышленный):
// канонные оси КПД (лазер 0,5→0,90, дизель-генератор 0,35→0,60, радиатор K ×1,0→×1,6) и предложенные
// малые асимптоты пределов (рабочий +20 K, критический +60 K). Вопрос: нужно ли охлаждение на высоких G?
// Сценарии: мощность лазера постоянна (3 МВт) и растёт по оси «мощность» (×1 → ×2 к асимптоте).
const zones = require(process.argv[2]);
const SIGMA = 5.670374419e-8;
const p = (G) => (G === Infinity ? 1 : 1 - 0.93 ** G);
const q = (G) => (p(G) - p(1)) / (1 - p(1)); // зрелость от опорного поколения Civilian G1
const ships = {
  "Спутник D": { K_hull: 456.45, K_pass: 441, C: zones.find((s) => s.id === "sputnik:1").C_MJK * 1e6 },
  "Ермак D": { K_hull: 456.45, K_pass: 882, C: zones.find((s) => s.id === "industrial-S:1:D").C_MJK * 1e6 },
};
function heat(G, laserMW) {
  const qq = q(G);
  const etaL = 0.5 + (0.9 - 0.5) * qq, etaG = 0.35 + (0.6 - 0.35) * qq;
  const loads = 0.2e6 + laserMW * 1e6; // жизнеобеспечение + лазер
  const drawn = loads / 0.9; // разряд η_d = 0,9
  const gross = drawn / 0.9; // тракт генератора η_path = 0,9
  const fuel = gross / etaG, W = fuel - gross;
  const laserHost = laserMW * 1e6 * (1 - etaL) + 0.35 * laserMW * 1e6 * etaL; // потери + возврат тепла руды
  return 0.2e6 + laserHost + (drawn - loads) + (gross - drawn) + 0.55 * W;
}
function run(ship, G, Tenv, laserMW) {
  const s = ships[ship], qq = q(G);
  const K = s.K_hull + s.K_pass * (1 + 0.6 * qq);
  const Q = heat(G, laserMW);
  const Teq = (Q / (K * SIGMA) + Tenv ** 4) ** 0.25;
  let T = 300; // 15 мин добычи от 300 K
  for (let t = 0; t < 900; t++) T += (Q - K * SIGMA * (T ** 4 - Tenv ** 4)) / s.C;
  const Twh = 500 + 20 * qq, Tch = 550 + 60 * qq;
  return { Q, Teq, T15: T, Twh, Tch, H: (Twh - T) / (Twh - Tenv) };
}
const Gs = [1, 5, 10, 20, Infinity];
for (const ship of Object.keys(ships)) {
  for (const [label, powerLaw] of [["лазер 3 МВт постоянно", () => 3], ["лазер растёт ×1→×2 (ось мощности, предложение)", (G) => 3 * (1 + q(G))]]) {
    console.log(`\n== ${ship} — ${label}`);
    console.log("  G      Q_host МВт  T_раб/T_крит   | 250 K: T_eq  T_15мин  H    | 450 K: T_eq  T_15мин   | 150 K: T_eq");
    for (const G of Gs) {
      const P = powerLaw(G);
      const a = run(ship, G, 250, P), b = run(ship, G, 450, P), c = run(ship, G, 150, P);
      const g = G === Infinity ? "G∞ " : `G${G}`.padEnd(3);
      const flag = (r) => (r.T15 > r.Twh ? "!" : r.Teq > r.Twh ? "~" : " ");
      console.log(`  ${g}    ${(a.Q / 1e6).toFixed(2).padStart(6)}      ${a.Twh.toFixed(0)}/${a.Tch.toFixed(0)}        | ${a.Teq.toFixed(0)}${flag(a)}  ${a.T15.toFixed(0)}     ${a.H.toFixed(2)} | ${b.Teq.toFixed(0)}${flag(b)}  ${b.T15.toFixed(0)}      | ${c.Teq.toFixed(0)}`);
    }
  }
}
console.log("\n«!» — 15 минут добычи выходят за рабочий предел; «~» — непрерывная работа выходит за предел (охлаждение нужно для длинных смен).");
