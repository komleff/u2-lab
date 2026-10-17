import type { RunResult } from "../runner/run";
export function freezeRun(result: RunResult): RunResult {
  const copy = structuredClone(result);
  const freeze = (v: any) => {
    if (v && typeof v === "object" && !ArrayBuffer.isView(v)) {
      Object.freeze(v);
      for (const child of Object.values(v)) freeze(child);
    }
  };
  freeze(copy);
  return copy;
}
export function compareRuns(
  a: RunResult,
  b: RunResult,
  mode: "same-task" | "own-sortie",
) {
  const differences: { path: string; a: unknown; b: unknown }[] = [];
  const diff = (x: any, y: any, path: string) => {
    if (x && y && typeof x === "object" && typeof y === "object") {
      for (const key of new Set([...Object.keys(x), ...Object.keys(y)]))
        if (key !== "origins")
          diff(x[key], y[key], path ? `${path}.${key}` : key);
    } else if (x !== y) differences.push({ path, a: x, b: y });
  };
  diff(a.spec, b.spec, "");
  const conditionsMatch =
    JSON.stringify(a.spec.environment) === JSON.stringify(b.spec.environment) &&
    JSON.stringify(a.spec.scenario) === JSON.stringify(b.spec.scenario) &&
    a.spec.durationSeconds === b.spec.durationSeconds;
  return {
    mode,
    conditionsMatch,
    differences,
    modelA: a.spec.modelVersion,
    modelB: b.spec.modelVersion,
    targetWork: a.spec.scenario.targetWork,
    capacityA: a.spec.ship.cargoCapacity,
    capacityB: b.spec.ship.cargoCapacity,
    a: {
      ...((mode === "same-task"
        ? a.metrics.targetCheckpoint
        : a.metrics.sortieCheckpoint) ?? a.metrics),
      completionSeconds:
        mode === "same-task"
          ? a.metrics.firstTargetSeconds
          : a.metrics.firstSortieSeconds,
      status: a.status,
    },
    b: {
      ...((mode === "same-task"
        ? b.metrics.targetCheckpoint
        : b.metrics.sortieCheckpoint) ?? b.metrics),
      completionSeconds:
        mode === "same-task"
          ? b.metrics.firstTargetSeconds
          : b.metrics.firstSortieSeconds,
      status: b.status,
    },
  };
}
