import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

// ST2-07: фразы классов «встроенный обогрев» и «экран штрафует антенны» не читаются как принятое правило.
const phrases = /глушит свои антенны|антенны глушатся|ухудшает собственные антенны|встроенный сброс шины|сброс шины в тепло|встроенной функцией корпуса|электропечь встроен/i;
const files = [
  "docs/product/gd-proposals-v2-2026-10-10.md",
  "docs/product/ship-model-v1.0-proposal.md",
  "docs/product/lab-tuning-tz-v0.1.md",
  "docs/specs/spec_u2_lab_ship_model_v0.1.md",
  "docs/gdd/gdd_ship_energy_thermal_model_v0.1.md",
  "docs/guides/signatures-observer.md",
  "docs/user/ship-model-catalog-0.3.1.md",
  "docs/user/ship-model-catalog-0.3.2.md",
  "README.md",
];
const marked = /не принят/i;
it.each(files)("ST2-07 %s: каждый блок с отвергнутой формулировкой помечен «не принято»", path => {
  // Строка таблицы проверяется сама по себе; абзац или список — целиком.
  const units = readFileSync(path, "utf8").split(/\n\s*\n/).flatMap(block => block.trimStart().startsWith("|") ? block.split("\n") : [block]);
  for (const unit of units.filter(u => phrases.test(u))) expect(unit, unit).toMatch(marked);
});
it("ST2-07 снимок передачи в U2 не переписан, а помечен пометкой о решениях 2026-10-13", () => {
  const text = readFileSync("docs/handoffs/2026-10-10-u2-gdd-ship-specs-update-list.md", "utf8");
  expect(text).toContain("Электрический прогрев — встроенный сброс шины в тепло");
  const note = text.split(/\n\s*\n/).find(block => block.includes("Пометка 2026-10-17"));
  expect(note).toBeDefined();
  for (const part of ["встроенный сброс шины", "ухудшает собственные антенны", "stealth-class-v0.1.md#2-решения-оператора-2026-10-13"]) expect(note).toContain(part);
});
it("ST2-07 ТЗ модели и ГДД больше не требуют штрафа антенн и встроенного прогрева", () => {
  const spec = readFileSync("docs/specs/spec_u2_lab_ship_model_v0.1.md", "utf8"), gdd = readFileSync("docs/gdd/gdd_ship_energy_thermal_model_v0.1.md", "utf8");
  expect(spec).toContain("| SM-09 | IR/EM раздельны, наблюдатель одинаков; экран не ослабляет собственные антенны");
  expect(gdd).not.toMatch(/встроенный электрический прогрев/i);
  expect(gdd).toContain("собственные антенны вынесены за экран, и экран их не ослабляет");
});
