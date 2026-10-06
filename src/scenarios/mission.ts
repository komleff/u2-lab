import { makeMiningRun, compareMiningConditions, type MiningConditions } from "./fitting";
import { validateRunSpecV2 } from "../model/v2/step";
import { MODEL_MISSION, MODEL_V2, type RunSpecV2, type MissionConfig } from "../model/v2/types";
import type { ShipFit, CandidateCatalog } from "../fitting/types";
export type MissionConditions = MiningConditions & Partial<Omit<MissionConfig,"cPrimeMS">>;
export type WorkspaceConditions = MissionConditions & { modelVersion?: typeof MODEL_MISSION | typeof MODEL_V2 };
export const DEFAULT_MISSION_CONDITIONS: WorkspaceConditions = {modelVersion:MODEL_MISSION,durationSeconds:3600,stepSeconds:.1,temperatureK:300,effectiveBackgroundK:100,distanceM:100000,cruiseSpeedMS:null,referenceVfaMS:500,stopPolicy:"full-hold",approachSeconds:10,serviceSeconds:10,maneuverDuty:.1,stationReplenish:true,duty:1,densityKgM3:1500,returnFraction:.35,targetM3:10000,repeat:true};
// Readback сохраняет own undefined для старого fuel-only; свежий builder задаёт ON.
export function missionConfig(x:MissionConditions):MissionConfig { return {distanceM:x.distanceM??100000,cruiseSpeedMS:x.cruiseSpeedMS===undefined?null:x.cruiseSpeedMS,referenceVfaMS:x.referenceVfaMS??500,cPrimeMS:3000,stopPolicy:x.stopPolicy??"full-hold",approachSeconds:x.approachSeconds??10,serviceSeconds:x.serviceSeconds??10,maneuverDuty:x.maneuverDuty??.1,...(Object.hasOwn(x,"stationReplenish")?(x.stationReplenish===undefined?{}:{stationReplenish:x.stationReplenish}):{stationReplenish:true})}; }
// Условия редактируются и у неполного черновика; готовность проверяется отдельно перед запуском.
export function validMissionConditions(x:MissionConditions) {
 const m=missionConfig(x);
 if(m.stationReplenish!==undefined&&typeof m.stationReplenish!=="boolean")return false;
 return [m.distanceM,m.approachSeconds,m.serviceSeconds].every(n=>Number.isFinite(n)&&n>=0)&&Number.isFinite(m.referenceVfaMS)&&m.referenceVfaMS>0&&m.referenceVfaMS<3000&&(m.cruiseSpeedMS===null||(Number.isFinite(m.cruiseSpeedMS)&&m.cruiseSpeedMS>0&&m.cruiseSpeedMS<3000))&&Number.isFinite(m.maneuverDuty)&&m.maneuverDuty>=0&&m.maneuverDuty<=1&&["full-hold","first-stop"].includes(m.stopPolicy)&&(x.targetM3===undefined||(Number.isFinite(x.targetM3)&&x.targetM3>0));
}
export function makeMissionRun(fit:ShipFit,catalog:CandidateCatalog,x:MissionConditions={}) {
  const base=makeMiningRun(fit,catalog,{...x,durationSeconds:x.durationSeconds??3600,stepSeconds:x.stepSeconds??.1,targetM3:x.targetM3??10000,workSeconds:1,approachSeconds:1,brakingSeconds:1,serviceSeconds:1,idleSeconds:1});
  if(!base.ok)return base;
  const s=base.value;s.modelVersion=MODEL_MISSION;
  s.scenario.name="Физический шахтёрский рейс";
  s.scenario.phases=[{id:"mission-controller",action:"idle",durationSeconds:1,requests:{}}];
  s.mission=missionConfig(x);
  for(const [key,value] of Object.entries(s.mission))s.origins["mission."+key]={kind:key==="cPrimeMS"?"canonical":"experimental",sourceRef:key==="cPrimeMS"?"docs/product/ship-fitting-v2.2-mission-brief.md§3; U2@0fe06927ab496918b3547f43412134c100a6e0b4:ADR-0016/ADR-0018":"lab:ship-fitting-v2.2-mission-brief-v0.3",...{unit:key.endsWith("MS")?"m/s":key.endsWith("M")?"m":key.endsWith("Seconds")?"s":"1",note:"Одномерный лабораторный рейс; V_FA и местный манёвр — явные гипотезы",derivation:String(value)}};
  if(s.mission.stationReplenish!==undefined)s.origins['mission.stationReplenish']={kind:'experimental',sourceRef:'docs/plans/2026-10-06-station-service.md',note:'Принятое endpoint-пополнение станции после обычной физики обслуживания; без кривой зарядки',derivation:String(s.mission.stationReplenish)};
  return validateRunSpecV2(s);
}
export function missionComparisonInputs(s:RunSpecV2) { return ({modelVersion:s.modelVersion,mission:s.mission,process:s.process,environment:s.environment,durationSeconds:s.durationSeconds,stepSeconds:s.stepSeconds,targetM3:s.scenario.targetM3,repeat:s.scenario.repeat,temperatureK:s.initial.temperatureK,chargeFraction:s.resolvedShip.batteryCapacityJ?s.initial.chargeJ/s.resolvedShip.batteryCapacityJ:1,fuelFractions:Object.fromEntries(["diesel","hydrogen"].map(sp=>[sp,s.resolvedShip.resources[sp as "diesel"|"hydrogen"].capacityKg?s.initial.fuelKg[sp]/s.resolvedShip.resources[sp as "diesel"|"hydrogen"].capacityKg:1]))});
}
export function compareMissionConditions(a:RunSpecV2,b:RunSpecV2) {
  if(a.modelVersion!==MODEL_MISSION&&b.modelVersion!==MODEL_MISSION)return compareMiningConditions(a,b);
  const x=missionComparisonInputs(a),y=missionComparisonInputs(b),differences=Object.keys(x).filter(k=>JSON.stringify(x[k as keyof typeof x])!==JSON.stringify(y[k as keyof typeof y]));
  return {comparable:!differences.length,differences};
}
