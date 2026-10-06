import type {
  RunSpec,
  ModelState,
  TickTelemetry,
  LabEvent,
} from "../model/types";
import { capacity, initialState } from "../model/types";
import { stepModel } from "../model/step";
import { DiagnosticObserver, replacedDiagnosticEvent } from './diagnostics';
import { validateRunSpec } from "../catalog/schema";
import { phaseAt } from "../scenarios/schema";
import { Retention, EventRetention, type Bucket } from "./retention";
import {
  initialMetrics,
  snapshotMetrics,
  updateMetrics,
  type RunMetrics,
} from "./metrics";
export type RunContext = {
  runId: string;
  spec: RunSpec;
  state: ModelState;
  metrics: RunMetrics;
  retention: Retention;
  events: EventRetention;
  done: boolean;
  last: TickTelemetry;
  diagnostics: DiagnosticObserver;
};
export type RunResult = {
  runId: string;
  spec: RunSpec;
  state: ModelState;
  metrics: RunMetrics;
  channels: string[];
  buckets: Bucket[];
  events: LabEvent[];
  retention: ReturnType<Retention["metadata"]> & {
    totalEvents: number;
    droppedEvents: number;
  };
  status: "complete" | "paused" | "cancelled";
};
function createLegacyRun(runId: string, spec: RunSpec): RunContext {
  const checked = validateRunSpec(spec);
  if (!checked.ok)
    throw new Error(
      checked.errors.map((e) => `${e.path}: ${e.message}`).join("\n"),
    );
  return {
    runId,
    spec: checked.value,
    state: initialState(checked.value),
    metrics: initialMetrics(checked.value.initial.temperatureK),
    retention: new Retention([]),
    events: new EventRetention(),
    done: false,
    last: {},
    diagnostics: new DiagnosticObserver(),
  };
}
function runLegacyChunk(
  run: RunContext,
  maxSteps: number,
  wallBudgetMs = Infinity,
) {
  const start = performance.now();
  let steps = 0;
  while (!run.done && steps < maxSteps) {
    if (steps % 32 === 0 && performance.now() - start >= wallBudgetMs) break;
    const { phase, key, remaining } = phaseAt(
      run.spec,
      run.state.timeSeconds + (run.state.scenarioOffsetSeconds ?? 0),
    );
    if (key !== run.state.phaseKey) {
      run.events.add({
        timeSeconds: run.state.timeSeconds,
        kind: "phase",
        message: `Фаза: ${phase.id} / ${phase.action}`,
      });
      run.state.phaseKey = key;
      if (phase.service) {
        if (phase.service.unload) {
          if (
            run.state.cargo >= run.spec.ship.cargoCapacity - 1e-8 &&
            run.metrics.firstSortieSeconds === null
          ) {
            run.metrics.firstSortieSeconds = run.state.timeSeconds;
            run.metrics.sortieCheckpoint = snapshotMetrics(run.metrics);
          }
          run.state.cargo = 0;
        }
        if (phase.service.refuel)
          for (const tank of run.spec.ship.tanks)
            run.state.fuelKg[tank.id] = tank.capacityKg;
        if (phase.service.charge) run.state.chargeJ = capacity(run.spec.ship);
        run.events.add({
          timeSeconds: run.state.timeSeconds,
          kind: "service",
          message: `Обслуживание: ${JSON.stringify(phase.service)}`,
        });
      }
    }
    const work =
      ["work", "overload"].includes(phase.action) &&
      run.state.cargo < run.spec.ship.cargoCapacity - 1e-8;
    const requests = run.spec.ship.modules
      .filter((m) => m.kind === "load" || m.kind === "engine")
      .map((m) => ({
        moduleId: m.id,
        duty:
          m.kind === "engine"
            ? ["approach", "return"].includes(phase.action)
              ? phase.duty
              : 0
            : m.policy === "Background"
              ? 1
              : work
                ? phase.duty
                : 0,
      }));
    let dt = Math.min(
      run.spec.stepSeconds,
      remaining,
      run.spec.durationSeconds - run.state.timeSeconds,
    );
    if (work) {
      const maxRate = run.spec.ship.modules
        .filter((m) => m.kind === "load" && m.policy === "Active")
        .reduce(
          (n, m) => n + m.powerW * m.efficiency * m.workPerJ * phase.duty,
          0,
        );
      if (maxRate > 0)
        dt = Math.min(
          dt,
          (run.spec.ship.cargoCapacity - run.state.cargo) / maxRate,
        );
    }
    if (work && run.metrics.firstTargetSeconds === null) {
      const maxRate = run.spec.ship.modules
        .filter((m) => m.kind === "load" && m.policy === "Active")
        .reduce(
          (n, m) => n + m.powerW * m.efficiency * m.workPerJ * phase.duty,
          0,
        );
      const need = run.spec.scenario.targetWork - run.state.usefulWork;
      if (maxRate > 0 && need > 1e-8) dt = Math.min(dt, need / maxRate);
    }
    if (dt <= 1e-10) {
      run.done = true;
      break;
    }
    const previousState = run.state;
    const r = stepModel(
      run.spec.ship,
      run.state,
      phase.environment ?? run.spec.environment,
      requests,
      dt,
    );
    run.state = r.state;
    run.last = r.telemetry;
    const events=[...r.events.filter(e=>!replacedDiagnosticEvent(e.kind)),...run.diagnostics.observeLegacy(run.spec.ship,previousState,r,requests,phase.id)];
    for (const e of events.sort((a,b)=>a.timeSeconds-b.timeSeconds))run.events.add(e);
    if (run.state.cargo >= run.spec.ship.cargoCapacity - 1e-8 && work) {
      run.events.add({
        timeSeconds: run.state.timeSeconds,
        kind: "cargo-full",
        message: "Трюм заполнен — добыча остановлена; переход к следующей фазе",
      });
      run.state.scenarioOffsetSeconds =
        (run.state.scenarioOffsetSeconds ?? 0) + Math.max(0, remaining - dt);
    }
    updateMetrics(
      run.metrics,
      r.telemetry,
      r.state,
      r.events,
      dt,
      run.spec,
      work,
      previousState,
      r.coolantConsumedKg,
      r.maxTemperatureK,
    );
    if (!run.retention.channels.length)
      run.retention = new Retention(Object.keys(r.telemetry).sort());
    run.retention.add(run.state.timeSeconds, r.telemetry);
    steps++;
    if (run.state.timeSeconds >= run.spec.durationSeconds - 1e-8) {
      run.state.timeSeconds = run.spec.durationSeconds;
      run.done = true;
    }
  }
  return { steps, done: run.done, state: run.state, telemetry: run.last };
}
function legacyResult(
  run: RunContext,
  status: RunResult["status"] = run.done ? "complete" : "paused",
): RunResult {
  return structuredClone({
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

import type {AnyRunSpec,RunSpecV2} from '../model/v2/types';
import {createFittingRun,runFittingChunk,fittingResult,type RunContextV2,type RunResultV2} from './fitting-run';
export type {RunContextV2,RunResultV2} from './fitting-run';
export type AnyRunContext=RunContext|RunContextV2;
export type AnyRunResult=RunResult|RunResultV2;
export function createRun(runId:string,spec:RunSpec):RunContext;
export function createRun(runId:string,spec:RunSpecV2):RunContextV2;
export function createRun(runId:string,spec:AnyRunSpec):AnyRunContext;
export function createRun(runId:string,spec:AnyRunSpec):AnyRunContext{return spec.schemaVersion==='u2-lab/2'?createFittingRun(runId,spec):createLegacyRun(runId,spec);}
export function runChunk(run:RunContext,maxSteps:number,wallBudgetMs?:number):ReturnType<typeof runLegacyChunk>;
export function runChunk(run:RunContextV2,maxSteps:number,wallBudgetMs?:number):ReturnType<typeof runFittingChunk>;
export function runChunk(run:AnyRunContext,maxSteps:number,wallBudgetMs?:number):ReturnType<typeof runLegacyChunk>|ReturnType<typeof runFittingChunk>;
export function runChunk(run:AnyRunContext,maxSteps:number,wallBudgetMs=Infinity){return run.spec.schemaVersion==='u2-lab/2'?runFittingChunk(run as RunContextV2,maxSteps,wallBudgetMs):runLegacyChunk(run as RunContext,maxSteps,wallBudgetMs);}
export function result(run:RunContext,status?:RunResult['status']):RunResult;
export function result(run:RunContextV2,status?:RunResultV2['status']):RunResultV2;
export function result(run:AnyRunContext,status?:RunResult['status']):AnyRunResult;
export function result(run:AnyRunContext,status?:RunResult['status']):AnyRunResult{return run.spec.schemaVersion==='u2-lab/2'?fittingResult(run as RunContextV2,status):legacyResult(run as RunContext,status);}
