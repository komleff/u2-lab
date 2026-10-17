import type { RunSpec, Phase } from "../model/types";
export function phaseAt(
  spec: RunSpec,
  time: number,
): { phase: Phase; key: string; remaining: number } {
  const phases = spec.scenario.phases;
  const cycle = phases.reduce((n, p) => n + p.durationSeconds, 0);
  let lap = spec.scenario.repeat ? Math.floor((time + 1e-8) / cycle) : 0;
  let t = time - lap * cycle;
  if (t < 0) t = 0;
  let start = 0;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    if (t < start + p.durationSeconds - 1e-8)
      return {
        phase: p,
        key: `${lap}:${i}`,
        remaining: start + p.durationSeconds - t,
      };
    start += p.durationSeconds;
  }
  return {
    phase: {
      id: "complete-recovery",
      action: "recovery",
      durationSeconds: Infinity,
      duty: 0,
    },
    key: "finished",
    remaining: Infinity,
  };
}
