import { finite, immutableCopy } from "./conservation";
import type { GovernorProfileV03, SurfaceProfileV03 } from "./types";

export type ClockPolicyV03 = Readonly<{ tickHz: number }>;
export const PRODUCTION_CLOCK_V03: ClockPolicyV03 = Object.freeze({ tickHz: 30 });
const STEFAN_BOLTZMANN = 5.670374419e-8;

export function tickSecondsV03(clock: ClockPolicyV03): number {
  if (!Number.isSafeInteger(clock.tickHz) || clock.tickHz <= 0) throw new RangeError("clock tickHz");
  return 1 / clock.tickHz;
}

export function shipTemperatureV03(profile: GovernorProfileV03, shipEnergyJ: number, shipEnergyRemainderJ = 0): number {
  finite(shipEnergyJ, "ship energy", 0);
  finite(shipEnergyRemainderJ, "ship energy remainder");
  return finite(
    shipEnergyJ / profile.ship.heatCapacityJPerK.value
      + shipEnergyRemainderJ / profile.ship.heatCapacityJPerK.value,
    "ship temperature",
    0,
  );
}

function twoSum(a: number, b: number): Readonly<{ sum: number; error: number }> {
  const sum = finite(a + b, "compensated energy sum");
  const bVirtual = sum - a;
  const error = finite((a - (sum - bVirtual)) + (b - bVirtual), "compensated energy error");
  return { sum, error };
}

export function integrateCompensatedOwnerEnergyV03(
  owner: string,
  originalJ: number,
  remainderJ: number,
  deltaJ: number,
): Readonly<{ energyJ: number; remainderJ: number }> {
  finite(originalJ, `${owner} original`, 0);
  finite(remainderJ, `${owner} remainder`);
  finite(deltaJ, `${owner} delta`);
  const first = twoSum(originalJ, deltaJ);
  const second = twoSum(first.sum, finite(remainderJ + first.error, `${owner} pending remainder`));
  if (second.sum < 0 || (second.sum === 0 && second.error < 0)) throw new RangeError(`${owner} committed`);
  return Object.freeze({ energyJ: second.sum, remainderJ: second.error });
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
