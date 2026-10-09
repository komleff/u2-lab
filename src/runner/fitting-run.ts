import type { RunSpecV2, StateV2, FittingPhase } from "../model/v2/types";
import { validateRunSpecV2, initialStateV2, stepV2 } from "../model/v2/step";
import { MODEL_SIGNATURE_MISSION, isMissionModel } from "../model/v2/types";
import { createSignatureRuntime, restoreSignatureRuntime, type SignatureRuntimeState } from "../signatures/runtime";
import { initializeMission, runMissionChunk } from "./mission";
import type { TickTelemetry } from "../model/types";
import { DiagnosticObserver, replacedDiagnosticEvent, type DiagnosticCheckpoint } from './diagnostics';
import { Retention, EventRetention, type Bucket } from "./retention";
import {
  initialMiningMetrics,
  updateMiningMetrics,
  type MiningMetrics,
} from "./mining-metrics";
export type CoreMiningMetrics = MiningMetrics;
export type RunContextV2 = {
  signatures?: SignatureRuntimeState;
  runId: string;
  spec: RunSpecV2;
  state: StateV2;
  metrics: CoreMiningMetrics;
  retention: Retention;
  events: EventRetention;
  done: boolean;
  last: TickTelemetry;
  diagnostics: DiagnosticObserver;
};
export type RunResultV2 = {
  signatures?: SignatureRuntimeState;
  checkpoint?: { diagnostics:DiagnosticCheckpoint; lastTelemetry:TickTelemetry };
  runId: string;
  spec: RunSpecV2;
  state: StateV2;
  metrics: CoreMiningMetrics;
  channels: string[];
  buckets: Bucket[];
  events: ReturnType<EventRetention["items"]>;
  retention: ReturnType<Retention["metadata"]> & {
    totalEvents: number;
    droppedEvents: number;
  };
  status: "complete" | "paused" | "cancelled";
};
export function phaseAtV2(
  s: RunSpecV2,
  time: number,
): { phase: FittingPhase; key: string; remaining: number; cycle: number } {
  const duration = s.scenario.phases.reduce((n, p) => n + p.durationSeconds, 0);
  const cycle = s.scenario.repeat ? Math.floor((time + 1e-9) / duration) : 0;
  let offset = s.scenario.repeat ? Math.max(0, time - cycle * duration) : time;
  for (const [index, p] of s.scenario.phases.entries()) {
    if (offset < p.durationSeconds - 1e-9)
      return {
        phase: p,
        key: cycle + ":" + index,
        remaining: p.durationSeconds - offset,
        cycle,
      };
    offset -= p.durationSeconds;
  }
  return {
    phase: {
      id: "horizon-idle",
      action: "idle",
      durationSeconds: Infinity,
      requests: {},
    },
    key: "horizon-idle",
    remaining: Infinity,
    cycle,
  };
}
export function createFittingRun(runId: string, spec: RunSpecV2): RunContextV2 {
  const v = validateRunSpecV2(spec);
  if (!v.ok)
    throw Error(v.errors.map((e) => e.path + ": " + e.message).join("\n"));
  const run:RunContextV2 = {
    runId,
    spec: v.value,
    state: initialStateV2(v.value),
    metrics: initialMiningMetrics(v.value),
    retention: new Retention([]),
    events: new EventRetention(),
    done: false,
    last: {},
    diagnostics: new DiagnosticObserver(),
    ...(v.value.modelVersion === MODEL_SIGNATURE_MISSION ? { signatures:createSignatureRuntime(v.value.signatures!,v.value.durationSeconds) } : {}),
  };
  if(isMissionModel(v.value.modelVersion))initializeMission(run);
  return run;
}
export function runFittingChunk(
  run: RunContextV2,
  maxSteps: number,
  wallBudgetMs = Infinity,
) {
  if(isMissionModel(run.spec.modelVersion))return runMissionChunk(run,maxSteps,wallBudgetMs);
  const started = performance.now();
  let steps = 0;
  while (!run.done && steps < maxSteps) {
    if (steps % 32 === 0 && performance.now() - started >= wallBudgetMs) break;
    const { phase, key, remaining, cycle } = phaseAtV2(
      run.spec,
      run.state.timeSeconds,
    );
    if (run.state.phaseKey !== key) {
      run.state.phaseKey = key;
      run.events.add({
        timeSeconds: run.state.timeSeconds,
        kind: "phase",
        message: "Фаза: " + phase.id,
      });
      if (phase.service?.unload) {
        run.state.cargoM3 = {};
        run.state.cargo = 0;
      }
      if (phase.service?.refuel)
        for (const sp of ["diesel", "hydrogen"] as const)
          run.state.fuelKg[sp] = run.spec.resolvedShip.resources[sp].capacityKg;
      if (phase.service?.charge)
        run.state.chargeJ = run.spec.resolvedShip.batteryCapacityJ;
    }
    const dt = Math.min(
      run.spec.stepSeconds,
      remaining,
      run.spec.durationSeconds - run.state.timeSeconds,
    );
    if (!(dt > 0)) {
      if (run.state.timeSeconds < run.spec.durationSeconds)
        throw Error("Не разрешён положительный остаток времени v2");
      run.done = true;
      break;
    }
    const previous = run.state;
    const s = phase.environment
      ? { ...run.spec, environment: phase.environment }
      : run.spec;
    const step = stepV2(s, previous, dt, phase.requests);
    if (!(step.state.timeSeconds > previous.timeSeconds))
      throw Error("Шаг v2 не продвигает время в численной точности горизонта");
    run.state = step.state;
    run.last = step.telemetry;
    updateMiningMetrics(run.metrics, previous, step, dt, run.spec);
    const events=[...step.events.filter(e=>!replacedDiagnosticEvent(e.kind)),...run.diagnostics.observeV2(s,previous,step,phase.requests,phase.id)];
    for (const e of events.sort((a,b)=>a.timeSeconds-b.timeSeconds))run.events.add(e);
    for (const i of run.spec.resolvedShip.instances) {
      run.last["installedMassKg:" + i.id] = i.item.materials.reduce(
        (n, m) => n + m.massKg,
        0,
      );
      if (i.item.family === "battery")
        run.last["storedJ:" + i.id] =
          (run.state.chargeJ * i.item.numerics.capacityJ) /
          run.spec.resolvedShip.batteryCapacityJ;
      if (i.item.family === "tank")
        run.last["fuelKg:" + i.id] =
          (run.state.fuelKg[i.item.species!] * i.item.numerics.fuelCapacityKg) /
          run.spec.resolvedShip.resources[i.item.species!].capacityKg;
    }
    if (!run.retention.channels.length)
      run.retention = new Retention(Object.keys(run.last).sort());
    run.retention.add(run.state.timeSeconds, run.last);
    steps++;
    const cycleDuration = run.spec.scenario.phases.reduce(
      (n, p) => n + p.durationSeconds,
      0,
    );
    run.state.cyclesCompleted = run.spec.scenario.repeat
      ? Math.floor((run.state.timeSeconds + 1e-8) / cycleDuration)
      : run.state.timeSeconds >= cycleDuration - 1e-8
        ? 1
        : 0;
    // Завершение следует за рассчитанным временем: положительный хвост,
    // включая остаток округления, должен пройти kernel и учёт метрик.
    if (run.state.timeSeconds >= run.spec.durationSeconds) run.done = true;
  }
  return { steps, done: run.done, state: run.state, telemetry: run.last };
}
export function fittingResult(
  run: RunContextV2,
  status: RunResultV2["status"] = run.done ? "complete" : "paused",
): RunResultV2 {
  return structuredClone({
    ...(run.signatures ? {signatures:run.signatures} : {}),
    ...(run.signatures ? {checkpoint:{diagnostics:run.diagnostics.checkpoint(),lastTelemetry:run.last}} : {}),
    runId: run.runId,
    spec: run.spec,
    state: run.state,
    metrics: run.metrics,
    channels: run.retention.channels,
    buckets: run.retention.buckets,
    events: run.events.items(),
    retention: {
      ...run.retention.metadata(),
      totalEvents: run.events.total,
      droppedEvents: run.events.dropped,
    },
    status,
  });
}

// Payload уже прошёл atomic IO validation; восстановление не пересчитывает прошлое.
export function restoreFittingRun(saved:RunResultV2):RunContextV2 {
  if(saved.spec.modelVersion!==MODEL_SIGNATURE_MISSION||!saved.signatures||!saved.checkpoint)throw new Error("Нужен полный signature checkpoint");
  const run=createFittingRun(saved.runId,saved.spec);
  run.state=structuredClone(saved.state);run.metrics=structuredClone(saved.metrics);run.last=structuredClone(saved.checkpoint.lastTelemetry);
  run.done=saved.status==="complete";run.signatures=restoreSignatureRuntime(saved.signatures,saved.spec.signatures!,saved.state.timeSeconds,saved.spec.durationSeconds);
  run.diagnostics.restore(saved.checkpoint.diagnostics);
  run.retention=new Retention(saved.channels,saved.retention.maxBuckets);run.retention.buckets=structuredClone(saved.buckets);
  run.retention.cadenceSeconds=saved.retention.cadenceSeconds;run.retention.totalTicks=saved.retention.totalTicks;
  run.events.restore(saved.events,saved.retention.totalEvents);
  return run;
}
