import type { ShipConfig, ModelState } from "./types";
import { capacity } from "./types";
export function backgroundFraction(
  ship: ShipConfig,
  state: ModelState,
): number {
  const soc = state.chargeJ / capacity(ship);
  const margin =
    Math.min(
      ...ship.modules
        .filter((m) => m.enabled && !state.gates[m.id])
        .map((m) => m.gate.workHigh),
    ) - state.temperatureK;
  if (
    soc <= 0.8 + 1e-12 ||
    margin <= 10 + 1e-9 ||
    ship.tanks.some(
      (t) =>
        t.capacityKg > 0 &&
        (state.fuelKg[t.id] ?? 0) <= 0.2 * t.capacityKg + 1e-10,
    )
  )
    return 0;
  return Math.min(1, Math.max(0, (soc - 0.8) / 0.2));
}
export function thermalDuty(
  ship: ShipConfig,
  state: ModelState,
  id: string,
): number {
  const m = ship.modules.find((m) => m.id === id)!;
  if (!m.enabled || state.gates[id]) return 0;
  return Math.min(
    1,
    Math.max(
      0,
      (m.gate.high - state.temperatureK) / (m.gate.high - m.gate.workHigh),
    ),
    m.gate.workLow
      ? Math.max(
          0,
          (state.temperatureK - m.gate.low) / (m.gate.workLow - m.gate.low),
        )
      : 1,
  );
}
