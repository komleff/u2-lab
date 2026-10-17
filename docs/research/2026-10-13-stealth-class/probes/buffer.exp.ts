// Опыт 10: подбор буфера стелса S под окно сессии — покой ≈30 мин, активный манёвр 10–15 мин
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { OUT } from "./harness";
import { compose } from "./helpers";
import { stealthHull, defaultFit, HULL } from "./stealthclass";
import { nationalize, CLASS_PROFILE } from "./national";
import { measure } from "./session";

test("buffer tuning", () => {
  mkdirSync(OUT, { recursive: true });
  const rows: string[] = ["буфер S ГДж | масса т | разгон/торможение м/с² | покой: окно мин | манёвр: окно мин, циклов | цикл с"];
  for (const gj of [0.3, 0.4, 0.5, 0.6]) {
    HULL.bufferJ.S = gj * 1e9;
    const change = compose(stealthHull("S"), defaultFit("S"), nationalize("CN", "S"));
    const m = measure(`B-${gj}`, "S", change, undefined);
    rows.push(`${gj} | ${m.massT.toFixed(1)} | ${m.accel.toFixed(1)}/${m.brake.toFixed(1)} | ${m.idleWindowMin?.toFixed(0)} | ${m.activeWindowMin?.toFixed(0)}, ${m.cycles?.toFixed(1)} | ${m.cycle}`);
    writeFileSync(`${OUT}/buffer.txt`, rows.join("\n"));
  }
  void CLASS_PROFILE;
});
