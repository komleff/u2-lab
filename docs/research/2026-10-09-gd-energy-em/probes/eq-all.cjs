// Равновесие стоянки при фоне 3 и 250 K для всех кораблей: тепло = жизнеобеспечение × множитель цепочки питания.
const z = require(process.argv[2]);
const S = 5.670374419e-8;
for (const s of z) {
  const fit = JSON.stringify(s.fit);
  const kind = /diesel-gen|gen.*diesel/i.test(fit) ? "D" : /h2-gen|fuel/i.test(fit) ? "H" : "?";
  const mult = { D: 2.495, H: 2.245, "?": 1.111 }[kind];
  const P = s.hullPowerKW * 1e3 * mult;
  const eq = (Te) => ((P / (S * s.hullK) + Te ** 4) ** 0.25).toFixed(0);
  console.log(s.id, "kind", kind, "K", s.hullK, "P_kW", s.hullPowerKW, "tCold", s.tCold, "eq3", eq(3), "eq250", eq(250));
}
