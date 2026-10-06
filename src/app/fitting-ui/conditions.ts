import { MODEL_MISSION, type RunSpecV2 } from "../../model/v2/types";
import type { WorkspaceConditions } from "../../scenarios/mission";
export function conditionsFromSpec(s: RunSpecV2): WorkspaceConditions {
  const phase = (action: string) => s.scenario.phases.find(p => p.action === action);
  const work = phase("work");
  return {
    modelVersion:s.modelVersion,
    durationSeconds: s.durationSeconds, stepSeconds: s.stepSeconds,
    temperatureK: s.initial.temperatureK, effectiveBackgroundK: s.environment.effectiveBackgroundK,
    workSeconds: work?.durationSeconds, approachSeconds: phase("approach")?.durationSeconds,
    brakingSeconds: phase("braking")?.durationSeconds, serviceSeconds: phase("service")?.durationSeconds,
    idleSeconds: phase("idle")?.durationSeconds, repeat: s.scenario.repeat,
    duty: work && s.selectedWorkGroup.length ? work.requests[s.selectedWorkGroup[0]] : undefined,
    selectedWorkGroup: [...s.selectedWorkGroup], densityKgM3: s.process.densityKgM3,
    returnFraction: s.process.returnFraction, targetM3: s.scenario.targetM3,
    ...(s.modelVersion===MODEL_MISSION?s.mission:{}),
  };
}
