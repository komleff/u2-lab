import { immutableCopy, lexical } from "./conservation";
import type {
  GovernorDecisionV03,
  GovernorModeV03,
  GovernorProfileV03,
  GovernorStateV03,
} from "./types";

export type ModeResolutionV03 = Readonly<{
  effectiveMode: GovernorModeV03;
  quietEntryTemperatureK: number | null;
  quietHoldTemperatureK: number | null;
  shipColdProtection: boolean;
  quietColdCooling: boolean;
  surfaceDeploymentById: GovernorStateV03["surfaceDeploymentById"];
  decisions: readonly GovernorDecisionV03[];
}>;

export function resolveModeV03(
  profile: GovernorProfileV03,
  state: GovernorStateV03,
  requestedMode: GovernorModeV03,
  shipTemperatureK: number,
  environmentTemperatureK: number,
): ModeResolutionV03 {
  const permitted = profile.modes.allowed.includes(requestedMode);
  const effectiveMode = permitted ? requestedMode : "Normal";
  const enteringQuiet = effectiveMode === "Quiet" && state.effectiveMode !== "Quiet";
  const quietEntryTemperatureK = enteringQuiet ? shipTemperatureK : state.quietEntryTemperatureK;
  const quietHoldTemperatureK = enteringQuiet
    ? Math.min(shipTemperatureK, profile.modes.quietUpperK.value)
    : state.quietHoldTemperatureK;
  const shipColdProtection = shipTemperatureK <= profile.modes.coldOnK.value
    || state.modeLatches.shipColdProtection && shipTemperatureK < profile.modes.coldOffK.value;
  const quietColdCooling = effectiveMode === "Quiet" && (
    shipTemperatureK >= profile.modes.quietOnK.value
    || state.modeLatches.quietColdCooling && shipTemperatureK > profile.modes.quietOffK.value
  );
  const surfaceDeploymentById = [...profile.surfaces]
    .sort((a, b) => lexical(a.id, b.id))
    .map(surface => ({
      id: surface.id,
      deployed: surface.kind === "hull"
        || !surface.closable
        || effectiveMode !== "Quiet" && environmentTemperatureK < shipTemperatureK,
    }));
  const decisions: GovernorDecisionV03[] = permitted ? [] : [{
    id: `mode:${requestedMode}`,
    moduleId: profile.ship.id,
    stage: "0",
    reason: "mode-not-permitted",
    requestedJ: 0,
    actualJ: 0,
  }];
  return immutableCopy({
    effectiveMode,
    quietEntryTemperatureK,
    quietHoldTemperatureK,
    shipColdProtection,
    quietColdCooling,
    surfaceDeploymentById,
    decisions,
  });
}

export function moduleThermalFactorV03(
  profile: GovernorProfileV03,
  mode: GovernorModeV03,
  module: GovernorProfileV03["modules"][number],
  shipTemperatureK: number,
): { factor: number; reason: "idle" | "hot-derating" | "cold-derating" } {
  const bands = module.temperatures;
  if (shipTemperatureK < bands.workLowK.value) {
    const factor = (shipTemperatureK - bands.criticalLowK.value) / (bands.workLowK.value - bands.criticalLowK.value);
    return { factor: Math.max(0, Math.min(1, factor)), reason: "cold-derating" };
  }
  if (shipTemperatureK > bands.workHighK.value) {
    if (mode === "Combat" && profile.ship.class === "Military") return { factor: 1, reason: "idle" };
    const factor = (bands.criticalHighK.value - shipTemperatureK) / (bands.criticalHighK.value - bands.workHighK.value);
    return { factor: Math.max(0, Math.min(1, factor)), reason: "hot-derating" };
  }
  return { factor: 1, reason: "idle" };
}

export function hasCommonCriticalBandV03(profile: GovernorProfileV03, requestedIds: ReadonlySet<string>): boolean {
  const modules = profile.modules.filter(module => requestedIds.has(module.id));
  if (modules.length < 2) return true;
  return Math.max(...modules.map(module => module.temperatures.criticalLowK.value))
    < Math.min(...modules.map(module => module.temperatures.criticalHighK.value));
}
