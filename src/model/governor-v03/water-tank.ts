import { finite, immutableCopy, stableId, tolerance, transferEntries, uniqueIds } from "./conservation";
import type { WaterTankProfileV03 } from "./types";
import type { ResourceAmountV03 } from "./resource-ledger";

export type WaterStateV03 = Readonly<{ enthalpyJ: number; phase: "solid" | "mixed" | "liquid" }>;
export type WaterEnvelopeV03 = Readonly<{ minTemperatureK: number; maxTemperatureK: number }>;
function waterParameters(profile: WaterTankProfileV03, resources: readonly ResourceAmountV03[], envelope: WaterEnvelopeV03) {
  stableId(profile.id); stableId(profile.resourceId); uniqueIds(resources.map(x => x.id));
  for (const resource of resources) finite(resource.massKg, "resource mass", 0);
  const massKg = resources.find(x => x.id === profile.resourceId)?.massKg;
  if (massKg === undefined) throw new RangeError("missing water resource");
  for (const leaf of [profile.heatCapacityJPerKgK, profile.latentHeatJPerKg, profile.referenceTemperatureK, profile.freezeK]) {
    if (finite(leaf.value, "water profile", 0) === 0) throw new RangeError("positive water property");
  }
  finite(envelope.minTemperatureK, "minimum temperature", 0); finite(envelope.maxTemperatureK, "maximum temperature", 0);
  if (envelope.minTemperatureK > profile.freezeK.value || envelope.maxTemperatureK < profile.freezeK.value) throw new RangeError("water envelope");
  for (const leaf of [profile.conductanceWPerK, profile.exchangeCapW, profile.heaterCapW, profile.protectionOnK, profile.protectionOffK]) finite(leaf.value, "water cap", 0);
  if (profile.protectionOnK.value >= profile.protectionOffK.value) throw new RangeError("water hysteresis");
  const heatCapacity = finite(massKg * profile.heatCapacityJPerKgK.value, "water heat capacity", 0);
  const freezeJ = finite(heatCapacity * (profile.freezeK.value - profile.referenceTemperatureK.value), "freeze enthalpy");
  const latentJ = finite(massKg * profile.latentHeatJPerKg.value, "latent heat", 0);
  const meltedJ = finite(freezeJ + latentJ, "melted enthalpy");
  const lowerJ = finite(heatCapacity * (envelope.minTemperatureK - profile.referenceTemperatureK.value), "minimum enthalpy");
  const upperJ = finite(heatCapacity * (envelope.maxTemperatureK - profile.referenceTemperatureK.value) + latentJ, "maximum enthalpy");
  return { massKg, heatCapacity, freezeJ, latentJ, meltedJ, lowerJ, upperJ };
}
export function waterState(profile: WaterTankProfileV03, resources: readonly ResourceAmountV03[], state: WaterStateV03, envelope: WaterEnvelopeV03) {
  const p = waterParameters(profile, resources, envelope);
  finite(state.enthalpyJ, "water enthalpy");
  if (p.massKg === 0) {
    if (state.enthalpyJ !== 0 || state.phase !== "solid") throw new RangeError("empty water state");
    return immutableCopy({ temperatureK: profile.referenceTemperatureK.value, phase: "solid" as const, liquidFraction: 0 });
  }
  if (state.enthalpyJ < p.lowerJ || state.enthalpyJ > p.upperJ) throw new RangeError("water enthalpy envelope");
  const phase = state.enthalpyJ <= p.freezeJ ? "solid" : state.enthalpyJ < p.meltedJ ? "mixed" : "liquid";
  if (state.phase !== phase) throw new RangeError("invalid phase transition");
  const temperatureK = phase === "mixed" ? profile.freezeK.value : profile.referenceTemperatureK.value + (state.enthalpyJ - (phase === "liquid" ? p.latentJ : 0)) / p.heatCapacity;
  return immutableCopy({ temperatureK: finite(temperatureK, "water temperature", 0), phase, liquidFraction: phase === "solid" ? 0 : phase === "liquid" ? 1 : (state.enthalpyJ - p.freezeJ) / p.latentJ });
}
export type WaterExchangeInputV03 = Readonly<{
  profile: WaterTankProfileV03; resources: readonly ResourceAmountV03[]; state: WaterStateV03; envelope: WaterEnvelopeV03;
  protectionActive: boolean; shipTemperatureK: number; seconds: number; requestedJ: number; id: string; ownerId: string; shipNodeId: string;
}>;
export function exchangeWater(input: WaterExchangeInputV03) {
  const { profile, resources, state, envelope } = input;
  const current = waterState(profile, resources, state, envelope);
  const p = waterParameters(profile, resources, envelope);
  stableId(input.id); stableId(input.ownerId); stableId(input.shipNodeId);
  finite(input.shipTemperatureK, "ship temperature", 0); finite(input.seconds, "seconds", 0); finite(input.requestedJ, "exchange request");
  if (typeof input.protectionActive !== "boolean") throw new RangeError("water protection latch");
  const latch = (temperatureK: number, previous: boolean) => temperatureK <= profile.protectionOnK.value || previous && temperatureK < profile.protectionOffK.value;
  let protectionActive = latch(current.temperatureK, input.protectionActive);
  const headK = input.shipTemperatureK - current.temperatureK;
  const towardShip = input.requestedJ < 0;
  const permitted = p.massKg > 0 && input.requestedJ * headK > 0 && !(towardShip && protectionActive);
  const exchangeJ = permitted ? Math.sign(input.requestedJ) * Math.min(Math.abs(input.requestedJ), finite(profile.exchangeCapW.value * input.seconds, "water port budget", 0), finite(profile.conductanceWPerK.value * Math.abs(headK) * input.seconds, "water conductance budget", 0)) : 0;
  const enthalpyJ = finite(state.enthalpyJ + exchangeJ, "committed water enthalpy");
  if (Math.abs(enthalpyJ - state.enthalpyJ - exchangeJ) > tolerance(finite(2 * Math.abs(exchangeJ), "water throughput", 0))) throw new RangeError("water enthalpy precision");
  const phase = p.massKg === 0 || enthalpyJ <= p.freezeJ ? "solid" : enthalpyJ < p.meltedJ ? "mixed" : "liquid";
  const nextState = { enthalpyJ, phase } as const;
  const next = waterState(profile, resources, nextState, envelope);
  protectionActive = latch(next.temperatureK, protectionActive);
  const entries = exchangeJ === 0 ? [] : transferEntries(input.id, input.ownerId, towardShip ? profile.id : input.shipNodeId, towardShip ? input.shipNodeId : profile.id, Math.abs(exchangeJ));
  return immutableCopy({ state: nextState, protectionActive, exchangeJ, entries });
}
