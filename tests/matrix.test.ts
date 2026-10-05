import { it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { presets, moduleBase, markEdits } from "../src/catalog/presets";
import { createRun, runChunk, result } from "../src/runner/run";
it("S/M reproducible short matrix produces finite work/heat/resource evidence", () => {
  const rows: any[] = [];
  for (const size of [0, 1])
    for (const environment of ["cold", "hot", "solar", "em"])
      for (const scenario of ["work", "idle", "stress"]) {
        const p = structuredClone(presets[size]);
        p.durationSeconds = 300;
        p.environment.effectiveBackgroundK = environment === "hot" ? 600 : 100;
        p.scenario = {
          name: scenario,
          repeat: true,
          targetWork: 12,
          phases: [
            {
              id: scenario,
              action:
                scenario === "work"
                  ? "work"
                  : scenario === "stress"
                    ? "approach"
                    : "idle",
              durationSeconds: 300,
              duty: scenario === "idle" ? 0 : 1,
            },
          ],
        };
        if (environment === "solar") {
          p.environment.solarFluxWm2 = 1361;
          p.ship.modules.push({
            ...moduleBase("pv", "solar"),
            areaM2: 100,
            efficiency: 0.25,
          });
        }
        if (environment === "em")
          p.environment.energyInputs = [
            {
              sourceId: "em-electric",
              representation: "electric",
              powerW: 1e6,
            },
            { sourceId: "plasma-thermal", representation: "heat", powerW: 1e6 },
          ];
        markEdits(p);
        const r = createRun(`${size}-${environment}-${scenario}`, p);
        while (!r.done) runChunk(r, 10000);
        expect(Number.isFinite(r.state.temperatureK)).toBe(true);
        expect(
          Math.abs(r.metrics.energyResidualJ) /
            Math.max(1, r.metrics.sourceEnergyJ),
        ).toBeLessThan(1e-9);
        rows.push({
          size: p.ship.size,
          environment,
          scenario,
          durationSeconds: 300,
          stepSeconds: 0.1,
          modelVersion: p.modelVersion,
          catalogVersion: p.catalogVersion,
          metrics: r.metrics,
          final: r.state,
        });
      }
  if (process.env.U2_MATRIX_OUTPUT)
    writeFileSync(
      process.env.U2_MATRIX_OUTPUT,
      JSON.stringify(rows, null, 2) + "\n",
    );
});
