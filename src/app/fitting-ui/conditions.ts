import { isMissionModel, type RunSpecV2 } from "../../model/v2/types";
import type { WorkspaceConditions } from "../../scenarios/mission";
export function conditionsFromSpec(s: RunSpecV2): WorkspaceConditions {
  const phase = (action: string) => s.scenario.phases.find(p => p.action === action);
  const work = phase("work");
  return {
    modelVersion:s.modelVersion,
    ...(s.signatures?{signatures:structuredClone(s.signatures)}:{}),
    durationSeconds: s.durationSeconds, stepSeconds: s.stepSeconds,
    temperatureK: s.initial.temperatureK, effectiveBackgroundK: s.environment.effectiveBackgroundK,
    workSeconds: work?.durationSeconds, approachSeconds: phase("approach")?.durationSeconds,
    brakingSeconds: phase("braking")?.durationSeconds, serviceSeconds: phase("service")?.durationSeconds,
    idleSeconds: phase("idle")?.durationSeconds, repeat: s.scenario.repeat,
    duty: work && s.selectedWorkGroup.length ? work.requests[s.selectedWorkGroup[0]] : undefined,
    selectedWorkGroup: [...s.selectedWorkGroup], densityKgM3: s.process.densityKgM3,
    returnFraction: s.process.returnFraction, targetM3: s.scenario.targetM3,
    // Собственный undefined отличает прочитанный legacy режим от свежего builder.
    // В RunSpec/JSON он остаётся отсутствующим; правка условий задаёт boolean.
    ...(isMissionModel(s.modelVersion)?{...s.mission,stationReplenish:s.mission?.stationReplenish}:{}),
  };
}
