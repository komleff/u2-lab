// Форматирование таблиц А и Б в markdown
const fs = require("fs");
const dir = process.argv[2];
const IR = 0.000274542277, EM = 3.592038646e-8;
const km = (w, p) => (w > 0 ? Math.sqrt(w / (4 * Math.PI * p)) / 1000 : 0);
const n = (x, d = 1) => x.toLocaleString("ru-RU", { maximumFractionDigits: d, minimumFractionDigits: d });
const w = x => x >= 1e6 ? n(x / 1e6, 2) + " МВт" : x >= 1e3 ? n(x / 1e3, 1) + " кВт" : n(x, 1) + " Вт";
const a = JSON.parse(fs.readFileSync(dir + "table-a.json", "utf8"));
let out = "## А. Модули на эталонном стенде\n\n";
out += "| Модуль | Режим | Собств. IR | Тепло в корпус | IR корма / нос / борт, км (старт) | EM, Вт | EM, км | Через 60 с: T, IR корма, км | До тепловой остановки |\n|---|---|---:|---:|---|---:|---:|---|---:|\n";
for (const r of a) out += `| ${r.name} | ${r.mode} | ${w(r.ownW)} | ${n(r.hostMW, 2)} МВт | ${n(km(r.t0.rear, IR))} / ${n(km(r.t0.nose, IR))} / ${n(km(r.t0.side, IR))} | ${n(r.t0.em, 1)} | ${n(km(r.t0.em, EM))} | ${n(r.t60.T, 0)} K, ${n(km(r.t60.rear, IR))} | ${r.gateS === null ? "—" : n(r.gateS, 1) + " с"} |\n`;
const b = JSON.parse(fs.readFileSync(dir + "table-b.json", "utf8"));
out += "\n## Б. Корабли каталога 0.2.5, рейс 3600 с\n\n";
for (const r of b) {
  if (r.error) { out += `### ${r.label}\nОшибка: ${r.error}\n\n`; continue; }
  out += `### ${r.label} (${r.id}) — T в конце ${n(r.T, 0)} K\n\n| Фаза | Время, с | IR корма ср/макс, км | IR нос ср/макс, км | IR борт ср, км | EM ср/макс, Вт | EM ср/макс, км |\n|---|---:|---|---|---:|---|---|\n`;
  for (const [ph, c] of Object.entries(r.phases)) out += `| ${ph} | ${n(c.EM.dur, 0)} | ${n(km(c.IRrear.mean, IR))} / ${n(km(c.IRrear.max, IR))} | ${n(km(c.IRnose.mean, IR))} / ${n(km(c.IRnose.max, IR))} | ${n(km(c.IRleft.mean, IR))} | ${n(c.EM.mean, 1)} / ${n(c.EM.max, 1)} | ${n(km(c.EM.mean, EM))} / ${n(km(c.EM.max, EM))} |\n`;
  const t = r.total;
  out += `| **весь рейс** | 3600 | ${n(km(t.IRrear.mean, IR))} / ${n(km(t.IRrear.max, IR))} | ${n(km(t.IRnose.mean, IR))} / ${n(km(t.IRnose.max, IR))} | ${n(km(t.IRleft.mean, IR))} | ${n(t.EM.mean, 1)} / ${n(t.EM.max, 1)} | ${n(km(t.EM.mean, EM))} / ${n(km(t.EM.max, EM))} |\n\n`;
}
fs.writeFileSync(dir + "tables.md", out);
console.log(out);
