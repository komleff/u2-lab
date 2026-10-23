import { finite, immutableCopy } from "./conservation";
import type { GovernorProfileV03, SurfaceProfileV03 } from "./types";

export type ClockPolicyV03 = Readonly<{ tickHz: number }>;
export const PRODUCTION_CLOCK_V03: ClockPolicyV03 = Object.freeze({ tickHz: 30 });
const STEFAN_BOLTZMANN = 5.670374419e-8;

export function tickSecondsV03(clock: ClockPolicyV03): number {
  if (!Number.isSafeInteger(clock.tickHz) || clock.tickHz <= 0) throw new RangeError("clock tickHz");
  return 1 / clock.tickHz;
}

export function shipTemperatureV03(profile: GovernorProfileV03, shipEnergyJ: number): number {
  finite(shipEnergyJ, "ship energy", 0);
  return finite(shipEnergyJ / profile.ship.heatCapacityJPerK.value, "ship temperature", 0);
}

export function signedRadiationJ(
  surface: SurfaceProfileV03,
  shipTemperatureK: number,
  environmentTemperatureK: number,
  seconds: number,
): number {
  const powerW = STEFAN_BOLTZMANN * surface.emissivity.value * surface.areaM2.value
    * (shipTemperatureK ** 4 - environmentTemperatureK ** 4);
  return finite(powerW * seconds, "signed radiation");
}

export function integrateOwnerEnergyV03(owner: string, originalJ: number, deltaJ: number): number {
  const result = finite(finite(originalJ, `${owner} original`, 0) + finite(deltaJ, `${owner} delta`), `${owner} committed`, 0);
  return result;
}

export function updateByIdV03<T extends Readonly<{ id: string }>, K extends keyof T>(
  values: readonly T[],
  id: string,
  key: K,
  value: T[K],
): readonly T[] {
  if (!values.some(item => item.id === id)) throw new RangeError(`unknown owner ${id}`);
  return immutableCopy(values.map(item => item.id === id ? { ...item, [key]: value } : item));
}
