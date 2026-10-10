// Карта выгодности термоинвертора: отдача (прирост охлаждения на 1 Вт питания) по фону среды.
// Активный радиатор S (K=882), прирост 1 МВт над тем, что панели дают без компрессора (если среда горячее — 0).
const SIGMA = 5.670374419e-8, K = 882;
const P = { etaII: 0.5, etaDrive: 0.95, Ge: 0.5e6, Gc: 0.5e6, Tpanel: 700, PbusMax: 4e6 };
function perWatt(Ts, Tenv, gain) {
  const bypass = Math.max(0, K * SIGMA * (Ts ** 4 - Tenv ** 4));
  for (let Tr = Math.max(Ts, Tenv) + 0.25; Tr <= P.Tpanel; Tr += 0.25) {
    const Qh = K * SIGMA * (Tr ** 4 - Tenv ** 4);
    let Qc = Qh * 0.5, ok = true;
    for (let i = 0; i < 60; i++) {
      const Te = Ts - Qc / P.Ge, Tc = Tr + Qh / P.Gc;
      if (Te <= 0 || Tc <= Te) { ok = false; break; }
      const cop = P.etaII * Te / (Tc - Te);
      Qc = Qh * cop / (1 + cop);
    }
    if (!ok) continue;
    const bus = (Qh - Qc) / P.etaDrive, net = Qc - (1 - P.etaDrive) * bus;
    if (net - bypass >= gain) return bus > P.PbusMax ? null : gain / bus;
  }
  return null;
}
for (const Ts of [450, 480]) {
  const row = [];
  for (const Tenv of [100, 250, 350, 400, 430, 450, 470, 500, 530, 560, 600, 650]) {
    const v = perWatt(Ts, Tenv, 1e6);
    row.push(`${Tenv}K:${v === null ? "—" : v.toFixed(2)}`);
  }
  console.log("корабль " + Ts + " K, +1 МВт:", row.join("  "));
}
