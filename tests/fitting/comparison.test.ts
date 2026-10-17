import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import {
  makeMiningRun,
  compareMiningConditions,
} from "../../src/scenarios/fitting";
it("controlled 1/2/3 conditions match while environment, ore, service and initial stock mismatches are named", () => {
  const c = loadCandidateCatalog(),
    a = makeMiningRun(getPresetFit("industrial-M:1"), c),
    b = makeMiningRun(getPresetFit("industrial-M:3"), c);
  if (!a.ok || !b.ok) throw Error("missing");
  expect(compareMiningConditions(a.value, b.value).comparable).toBe(true);
  for (const mutate of [
    (s: any) => (s.environment.effectiveBackgroundK = 600),
    (s: any) => (s.process.densityKgM3 = 3000),
    (s: any) => (s.initial.chargeJ = 0),
    (s: any) => (s.scenario.phases[0].durationSeconds = 100),
  ]) {
    const x = structuredClone(b.value);
    mutate(x);
    expect(compareMiningConditions(a.value, x).comparable).toBe(false);
    expect(
      compareMiningConditions(a.value, x).differences.length,
    ).toBeGreaterThan(0);
  }
});
