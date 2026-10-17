// Опыт 1: текущий стелс-пресет против Спутника — покой и манёвр, обычный режим и маскировка
import { test } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { run, brief, OUT } from "./harness";

test("baseline stealth vs sputnik", () => {
  mkdirSync(OUT, { recursive: true });
  const H = 3600, lines: string[] = [];
  const cases: [string, string, Parameters<typeof run>[2]][] = [
    ["stealth-eff-idle-6h", "stealth-reference", { durationSeconds: 6 * H, temperatureK: 300, mode: "Efficient", action: "idle" }],
    ["stealth-eff-idle-24h", "stealth-reference", { durationSeconds: 24 * H, temperatureK: 300, mode: "Efficient", action: "idle" }],
    ["sputnik-d-eff-idle-6h", "sputnik-d", { durationSeconds: 6 * H, temperatureK: 300, mode: "Efficient", action: "idle" }],
    ["sputnik-e-eff-idle-6h", "sputnik-e", { durationSeconds: 6 * H, temperatureK: 300, mode: "Efficient", action: "idle" }],
    ["stealth-mask-idle-6h", "stealth-reference", { durationSeconds: 6 * H, temperatureK: 300, mode: "Masking", action: "idle" }],
    ["stealth-eff-march10-1h", "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Efficient", action: "maneuver", duty: 0.1 }],
    ["stealth-mask-march10-1h", "stealth-reference", { durationSeconds: H, temperatureK: 300, mode: "Masking", action: "maneuver", duty: 0.1 }],
    ["sputnik-eff-march10-1h", "sputnik-e", { durationSeconds: H, temperatureK: 300, mode: "Efficient", action: "maneuver", duty: 0.1 }],
  ];
  for (const [id, preset, cond] of cases) {
    const started = Date.now();
    const r = run(id, preset, cond, { sampleEvery: 300 });
    lines.push(brief(r) + `\n  wall=${((Date.now() - started) / 1000).toFixed(0)}s events: ${r.events.slice(0, 6).join(" ; ")}`);
    writeFileSync(`${OUT}/baseline.txt`, lines.join("\n\n"));
  }
});
