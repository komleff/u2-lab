import { immutableCopy, lexical } from "./conservation";
import type {
  GovernorDecisionV03,
  GovernorModuleStateV03,
  GovernorProfileV03,
  GovernorStateV03,
} from "./types";

export type ProtectionResultV03 = Readonly<{
  modules: readonly GovernorModuleStateV03[];
  failureChecks: GovernorStateV03["failureChecks"];
  rng: GovernorStateV03["rng"];
  decisions: readonly GovernorDecisionV03[];
  actualFailureChecks: number;
}>;

export function nextXorshift32V03(state: number): number {
  let value = state >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

const random01 = (state: number) => state / 0x1_0000_0000;

export function applyProtectionV03(
  profile: GovernorProfileV03,
  state: GovernorStateV03,
  shipTemperatureK: number,
  tickHz: number,
): ProtectionResultV03 {
  let rngState = state.rng.state;
  let actualFailureChecks = 0;
  let exposureSeconds = state.failureChecks.emergencyExposureSeconds;
  let actualCheckCount = state.failureChecks.actualCheckCount;
  const decisions: GovernorDecisionV03[] = [];
  const modules = [...state.moduleStateById].sort((a, b) => lexical(a.id, b.id)).map(previous => {
    const module = profile.modules.find(item => item.id === previous.id)!;
    let next: GovernorModuleStateV03 = structuredClone(previous);
    const addDecision = (reason: GovernorDecisionV03["reason"]) => decisions.push({
      id: `protection:${module.id}:${reason}`,
      moduleId: module.id,
      stage: "0",
      reason,
      requestedJ: 0,
      actualJ: 0,
    });
    const thermallyRestartable = shipTemperatureK >= module.temperatures.restartColdK.value
      && shipTemperatureK <= module.temperatures.restartHotK.value;

    if (next.thermalStopped) {
      if (!next.restartAuthorized) addDecision("restart-unauthorized");
      else if (state.tickIndex < next.cooldownUntilTick) addDecision("cooldown");
      else if (!thermallyRestartable) addDecision("restart-hysteresis");
      else next = { ...next, thermalStopped: false, stopReasons: next.stopReasons.filter(reason => reason !== "critical-hot-stop" && reason !== "critical-cold-stop") };
    }
    if (!next.thermalStopped && shipTemperatureK >= module.temperatures.criticalHighK.value) {
      next = { ...next, thermalStopped: true, stopReasons: [...new Set([...next.stopReasons, "critical-hot-stop" as const])] };
      addDecision("critical-hot-stop");
    } else if (!next.thermalStopped && shipTemperatureK <= module.temperatures.criticalLowK.value) {
      next = { ...next, thermalStopped: true, stopReasons: [...new Set([...next.stopReasons, "critical-cold-stop" as const])] };
      addDecision("critical-cold-stop");
    }

    if (next.durabilityStopped) {
      if (!next.restartAuthorized) addDecision("restart-unauthorized");
      else if (state.tickIndex < next.cooldownUntilTick) addDecision("cooldown");
      else if (!thermallyRestartable) addDecision("restart-hysteresis");
      else {
        rngState = nextXorshift32V03(rngState);
        actualFailureChecks++;
        actualCheckCount++;
        const restartProbability = Math.max(0, Math.min(1, 1 - Math.max(0, -next.durabilityR)));
        if (random01(rngState) < restartProbability) next = { ...next, durabilityStopped: false, stopReasons: next.stopReasons.filter(reason => reason !== "durability-failure") };
        else addDecision("durability-failure");
      }
    } else if (next.durabilityR < 0) {
      const moduleExposure = next.emergencyExposureSeconds + 1 / tickHz;
      exposureSeconds += 1 / tickHz;
      const first = next.firstNegativeCrossing;
      const interval = profile.failurePolicy.checkIntervalSeconds.value;
      const due = first || exposureSeconds + Number.EPSILON >= interval;
      next = { ...next, firstNegativeCrossing: false, emergencyExposureSeconds: moduleExposure };
      if (due) {
        rngState = nextXorshift32V03(rngState);
        actualFailureChecks++;
        actualCheckCount++;
        const fails = first || random01(rngState) < profile.failurePolicy.probabilityPerCheck.value;
        if (fails) {
          next = {
            ...next,
            durabilityStopped: true,
            cooldownUntilTick: state.tickIndex + Math.max(1, Math.round(interval * tickHz)),
            stopReasons: [...new Set([...next.stopReasons, "durability-failure" as const])],
          };
          addDecision("durability-failure");
        }
        exposureSeconds = Math.max(0, exposureSeconds - interval);
      }
    }
    return next;
  });
  return immutableCopy({
    modules,
    failureChecks: {
      emergencyExposureSeconds: exposureSeconds,
      nextCheckIndex: actualCheckCount + 1,
      actualCheckCount,
      boundaryPolicy: "accumulated-exposure",
    },
    rng: { ...state.rng, state: rngState },
    decisions,
    actualFailureChecks,
  });
}
