import type { ValidationResult } from "../catalog/schema";
import type { ShipFit, CandidateCatalog } from "../fitting/types";
import { compileFit } from "../fitting/compile";
import type { RunSpecV2, FittingPhase } from "../model/v2/types";
import { validateRunSpecV2 } from "../model/v2/step";
import {compileShipModelFit,validateRunSpecV3} from '../model/v3/schema';
import {SCHEMA_V3,MODEL_V3,CATALOG_V3,type RunSpecV3,type ShipFitV3,type CandidateCatalogV3,type ShipMode,type EnvironmentV3,type ReceiverProfile} from '../model/v3/types';
import {CONTROLLER_CANDIDATES} from '../model/v3/step';
export type ShipModelConditions={durationSeconds?:number;temperatureK?:number;backgroundK?:number;mode?:ShipMode;receiverProfile?:ReceiverProfile;environment?:EnvironmentV3;observer?:RunSpecV3['observer'];repeat?:boolean;duty?:number;phases?:RunSpecV3['scenario']['phases']};
// Только fresh-run initialization; сохранённое продолжение не проходит этот builder.
export function makeShipModelMiningRun(fit:ShipFitV3,catalog:CandidateCatalogV3,x:ShipModelConditions={}):ValidationResult<RunSpecV3>{
  const compiled=compileShipModelFit(fit,catalog);if(!compiled.ok)return compiled;const ship=compiled.value;
  const mode=x.mode??'Efficient',temperatureK=x.temperatureK??300,durationSeconds=x.durationSeconds??60;
  const spec:RunSpecV3={schemaVersion:SCHEMA_V3,modelVersion:MODEL_V3,catalogVersion:CATALOG_V3,units:'SI',approvedBaseline:false,resolvedShip:ship,origins:{...ship.origins},
    environment:x.environment??{radiativeBackgroundK:x.backgroundK??100,backgroundSourceId:'lab-radiative-background',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]},
    receiverProfile:x.receiverProfile??'positive-only',observer:x.observer??{presetId:'S-dedicated-G1',rangeM:16000,aspectDeg:0},
    initialState:{schemaVersion:SCHEMA_V3,modelVersion:MODEL_V3,stateVersion:'ship-state/1',timeSeconds:0,phaseIndex:0,phaseElapsedSeconds:0,mode,maskingEntryTemperatureK:mode==='Masking'?temperatureK:null,temperatureK,chargeJ:ship.batteryCapacityJ*fit.initial.chargeFraction,
      fuelKg:{diesel:ship.resources.diesel.capacityKg*fit.initial.fuelFraction.diesel,hydrogen:ship.resources.hydrogen.capacityKg*fit.initial.fuelFraction.hydrogen},
      buffers:Object.fromEntries(Object.keys(ship.bufferCapacityJ).map(id=>[id,{storedJ:0,minimumCaptureK:null}])),governor:{coolingStageId:null,heatingStageId:null,recoveringBuffer:false},generator:{permission:false,normalOn:false},
      modules:Object.fromEntries(ship.instances.map(i=>[i.id,{durabilityR:1,firstNegativeCrossing:false,emergencyExposureSeconds:0,cooldownSeconds:0,restartAuthorized:false,thermalStopped:false}])),surfaceOpen:Object.fromEntries(ship.surfaces.map(s=>[s.id,!s.active])),rng:{algorithm:'xorshift32/1',seed:424242,state:424242}},
    scenario:{name:'Ship model v0.1: физический рабочий цикл',repeat:x.repeat??false,phases:x.phases??[{id:'work',action:'work',durationSeconds,requests:Object.fromEntries(ship.instances.filter(i=>i.item.family==='mining').map(i=>[i.id,x.duty??1])),environment:null}]},durationSeconds,stepSeconds:1};
  const annotate=(value:unknown,path:string)=>{if(typeof value==='number')spec.origins[path]={kind:'experimental',unit:'SI',sourceRef:'src/scenarios/fitting.ts: explicit fresh ship-model conditions',note:'Явное условие нового опыта или начальное состояние; не continuation default и не канонические ТТХ.'};else if(value&&typeof value==='object')for(const[key,v]of Object.entries(value))if(!['origins','resolvedShip'].includes(key))annotate(v,path?path+'.'+key:key);};
  annotate(spec,'');spec.origins['controllerCandidates']=CONTROLLER_CANDIDATES.origin;
  return validateRunSpecV3(spec);
}
export type MiningConditions = {
  durationSeconds?: number;
  stepSeconds?: number;
  workSeconds?: number;
  approachSeconds?: number;
  brakingSeconds?: number;
  serviceSeconds?: number;
  idleSeconds?: number;
  temperatureK?: number;
  effectiveBackgroundK?: number;
  targetM3?: number;
  repeat?: boolean;
  duty?: number;
  selectedWorkGroup?: string[];
  densityKgM3?: number;
  returnFraction?: number;
};
export function makeMiningRun(
  f: ShipFit,
  c: CandidateCatalog,
  x: MiningConditions = {},
): ValidationResult<RunSpecV2> {
  const r = compileFit(f, c);
  if (!r.ok) return r;
  const ship = r.value;
  const selected =
    x.selectedWorkGroup ??
    ship.instances.filter((i) => i.item.family === "mining").map((i) => i.id);
  const phases: FittingPhase[] = [
    {
      id: "approach",
      action: "approach",
      durationSeconds: x.approachSeconds ?? 10,
      requests: { march: 1 },
    },
    {
      id: "mining",
      action: "work",
      durationSeconds: x.workSeconds ?? 120,
      requests: Object.fromEntries(selected.map((id) => [id, x.duty ?? 1])),
    },
    {
      id: "braking",
      action: "braking",
      durationSeconds: x.brakingSeconds ?? 10,
      requests: { retro: 1 },
    },
    {
      id: "unload",
      action: "service",
      durationSeconds: x.serviceSeconds ?? 10,
      requests: {},
      service: { unload: true, refuel: false, charge: false },
    },
    {
      id: "recovery",
      action: "idle",
      durationSeconds: x.idleSeconds ?? 30,
      requests: {},
    },
  ];
  const s: RunSpecV2 = {
    schemaVersion: "u2-lab/2",
    modelVersion: "ship-fitting-ledger-0.2",
    catalogVersion: f.catalogVersion,
    units: "SI",
    approvedBaseline: false,
    resolvedShip: ship,
    origins: ship.origins,
    environment: {
      effectiveBackgroundK: x.effectiveBackgroundK ?? 100,
      solarFluxWm2: 0,
      solarSourceId: "sun",
      backgroundSourceId: "lab-background",
      energyInputs: [],
      directHeat: [],
      law: "radiative",
      linearWK: 0,
    },
    initial: {
      chargeJ: ship.batteryCapacityJ * f.initial.chargeFraction,
      temperatureK: x.temperatureK ?? 300,
      fuelKg: {
        diesel:
          ship.resources.diesel.capacityKg *
          (f.initial.fuelFraction.diesel ?? 1),
        hydrogen:
          ship.resources.hydrogen.capacityKg *
          (f.initial.fuelFraction.hydrogen ?? 1),
      },
      buffersJ: Object.fromEntries(
        Object.keys(ship.bufferCapacityJ).map((id) => [id, 0]),
      ),
      cargoM3: {},
    },
    selectedWorkGroup: selected,
    process: {
      id: "LAB-ORE-01",
      energyJPerM3: 24e6,
      densityKgM3: x.densityKgM3 ?? 1500,
      extractFactor: 1,
      softFactor: 1,
      workFactor: 1,
      returnFraction: x.returnFraction ?? 0.35,
    },
    scenario: {
      name: "Добыча → торможение → разгрузка",
      repeat: x.repeat ?? true,
      targetM3: x.targetM3 ?? 1000,
      phases,
    },
    durationSeconds: x.durationSeconds ?? 600,
    stepSeconds: x.stepSeconds ?? 0.01,
  };
  const annotate = (v: unknown, path: string) => {
    if (typeof v === "number" && !s.origins[path])
      s.origins[path] = {
        kind: "experimental",
        sourceRef: "lab:conditions-LAB-ORE-01",
        note: "Явное SI условие опыта; GDD§6/7",
      };
    else if (v && typeof v === "object")
      for (const [k, value] of Object.entries(v))
        if (k !== "origins") annotate(value, path ? path + "." + k : k);
  };
  annotate(s, "");
  return validateRunSpecV2(s);
}
export function compareMiningConditions(
  a: RunSpecV2,
  b: RunSpecV2,
): { comparable: boolean; differences: string[] } {
  const normalized = (s: RunSpecV2) => ({
    hull: s.resolvedShip.hull.id,
    process: s.process,
    environment: s.environment,
    initial: s.initial,
    durationSeconds: s.durationSeconds,
    stepSeconds: s.stepSeconds,
    targetM3: s.scenario.targetM3,
    repeat: s.scenario.repeat,
    phases: s.scenario.phases.map((p) => ({
      ...p,
      requests: Object.fromEntries(
        Object.entries(p.requests).filter(
          ([key]) => !s.selectedWorkGroup.includes(key),
        ),
      ),
      miningDuties: [
        ...new Set(
          Object.entries(p.requests)
            .filter(([key]) => s.selectedWorkGroup.includes(key))
            .map(([, v]) => v),
        ),
      ].sort(),
    })),
  });
  const x = normalized(a),
    y = normalized(b);
  const differences: string[] = [];
  for (const k of Object.keys(x) as (keyof typeof x)[])
    if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) differences.push(k);
  return { comparable: !differences.length, differences };
}
