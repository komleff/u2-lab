import { readFileSync } from "node:fs";
import type {
  GovernorModeV03,
  GovernorProfileV03,
  GovernorTickInputV03,
  GovernorTickResultV03,
} from "../../src/model/governor-v03/types";

type FixtureVector = Readonly<{
  id: string;
  input: Readonly<{
    profileId: string;
    state: GovernorTickInputV03["state"];
    requestedMode: GovernorModeV03;
    requests: GovernorTickInputV03["requests"];
    environment: GovernorTickInputV03["environment"];
    durationTicks: number;
    reference?: Readonly<{
      trajectories: readonly Readonly<{ id: string; vectorId: string; durationSeconds: number }>[];
    }>;
    events: readonly Readonly<{
      id: string;
      atTick: number;
      kind: "mode" | "failure" | "external-heat" | "service" | "rebind" | "checkpoint";
      targetId: string | null;
      mode: GovernorModeV03 | null;
      value: number;
      unit: string;
    }>[];
  }>;
}>;

type FixtureBundle = Readonly<{
  profiles: readonly GovernorProfileV03[];
  vectors: readonly FixtureVector[];
}>;

const bundle = JSON.parse(readFileSync(new URL("../fixtures/f2-governor/vectors.json", import.meta.url), "utf8")) as FixtureBundle;

type MutableTickInput = {
  profile: GovernorProfileV03;
  state: GovernorTickInputV03["state"];
  requestedMode: GovernorTickInputV03["requestedMode"];
  requests: GovernorTickInputV03["requests"];
  environment: GovernorTickInputV03["environment"];
};

export function fixture(tId: string): { profile: GovernorProfileV03; vector: FixtureVector; input: MutableTickInput } {
  const vector = bundle.vectors.find(item => item.id === `vector-${tId}`);
  if (!vector) throw new Error(`Missing ${tId}`);
  const profile = bundle.profiles.find(item => item.id === vector.input.profileId);
  if (!profile) throw new Error(`Missing profile ${vector.input.profileId}`);
  return {
    profile: structuredClone(profile),
    vector: structuredClone(vector),
    input: {
      profile: structuredClone(profile),
      state: structuredClone(vector.input.state),
      requestedMode: vector.input.requestedMode,
      requests: structuredClone(vector.input.requests),
      environment: structuredClone(vector.input.environment),
    },
  };
}

export type TransitionReceipt = Readonly<{
  timeSeconds: number;
  mode: GovernorModeV03;
  shipCold: boolean;
  quietCold: boolean;
  reasons: readonly string[];
  stopped: readonly string[];
}>;

export type RunReceipt = Readonly<{
  tickHz: number;
  initialShipEnergyJ: number;
  final: GovernorTickResultV03;
  usefulOutputJ: number;
  outwardJ: number;
  resourceConsumedKg: Readonly<Record<string, number>>;
  transitions: readonly TransitionReceipt[];
}>;

function scaledInput(source: GovernorTickInputV03, tickHz: number): GovernorTickInputV03 {
  const scale = tickHz / 30;
  return {
    ...structuredClone(source),
    state: {
      ...structuredClone(source.state),
      tickIndex: source.state.tickIndex * scale,
      moduleStateById: source.state.moduleStateById.map(module => ({
        ...module,
        cooldownUntilTick: module.cooldownUntilTick * scale,
      })),
    },
  };
}

const transitionKey = (result: GovernorTickResultV03) => JSON.stringify({
  mode: result.state.effectiveMode,
  shipCold: result.state.modeLatches.shipColdProtection,
  quietCold: result.state.modeLatches.quietColdCooling,
  reasons: result.decisions.map(decision => decision.reason),
  stopped: result.state.moduleStateById.filter(module => module.durabilityStopped || module.thermalStopped).map(module => module.id),
});

export async function runFixture(tId: string, tickHz: 30 | 120): Promise<RunReceipt> {
  const loaded = fixture(tId);
  const scale = tickHz / 30;
  const steps = loaded.vector.input.durationTicks * scale;
  const events = loaded.vector.input.events.map(event => ({ ...event, atTick: event.atTick * scale }));
  let input = scaledInput(loaded.input, tickHz);
  let requestedMode = input.requestedMode;
  let usefulOutputJ = 0;
  let outwardJ = 0;
  let lastKey = "";
  const transitions: TransitionReceipt[] = [];
  const initialResources = Object.fromEntries(input.state.resourceMassKg.map(resource => [resource.id, resource.massKg]));
  let final: GovernorTickResultV03 | undefined;
  const { stepGovernorV03WithClock } = await import("../../src/model/governor-v03/governor");
  for (let offset = 0; offset < steps; offset++) {
    for (const event of events.filter(item => item.atTick === offset)) {
      if (event.kind === "mode" && event.mode !== null) requestedMode = event.mode;
      if (event.kind === "external-heat") input = { ...input, environment: { ...input.environment, externalHeatingW: event.value * tickHz } };
    }
    final = stepGovernorV03WithClock(
      { ...input, requestedMode },
      { tickHz },
      offset === 0 ? "full" : "validated-continuation",
    );
    usefulOutputJ += final.packages.reduce((sum, item) => sum + item.usefulOutputJ, 0);
    outwardJ += final.ledger.outward.reduce((sum, item) => sum + item.energyJ, 0);
    const key = transitionKey(final);
    if (key !== lastKey) {
      transitions.push({
        // Решение принимается по snapshot в начале tick; receipt хранит его physical time.
        timeSeconds: (final.state.tickIndex - 1) / tickHz,
        mode: final.state.effectiveMode,
        shipCold: final.state.modeLatches.shipColdProtection,
        quietCold: final.state.modeLatches.quietColdCooling,
        reasons: final.decisions.map(decision => decision.reason),
        stopped: final.state.moduleStateById.filter(module => module.durabilityStopped || module.thermalStopped).map(module => module.id),
      });
      lastKey = key;
    }
    input = { ...input, state: final.state };
  }
  if (!final) throw new Error(`Empty trajectory ${tId}`);
  const resourceConsumedKg = Object.fromEntries(final.state.resourceMassKg.map(resource => [resource.id, (initialResources[resource.id] ?? 0) - resource.massKg]));
  return { tickHz, initialShipEnergyJ: loaded.input.state.shipEnergyJ, final, usefulOutputJ, outwardJ, resourceConsumedKg, transitions };
}
