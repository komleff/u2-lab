import {makeShipModelMiningRun,type ShipModelConditions} from './fitting';
import {MODEL_MISSION_V3,type ShipFitV3,type CandidateCatalogV3,type RunSpecV3,type MissionSpecV3} from '../model/v3/types';
import {validateRunSpecV3} from '../model/v3/schema';
import {DEFAULT_SHIP_MODEL_DURATION_SECONDS} from '../app/ship-model-defaults';
export type ShipModelMissionConditions=ShipModelConditions&{distanceM?:number;referenceVfaMS?:number;cruiseSpeedMS?:number;speedPolicy?:'vfa'|'custom';approachSeconds?:number;serviceSeconds?:number;targetM3?:number;stopPolicy?:'full-hold'|'first-stop';stationReplenish?:boolean;mission?:MissionSpecV3};
export function makeShipModelMissionRun(fit:ShipFitV3,catalog:CandidateCatalogV3,x:ShipModelMissionConditions={}){
 const base=makeShipModelMiningRun(fit,catalog,{...x,durationSeconds:x.durationSeconds??DEFAULT_SHIP_MODEL_DURATION_SECONDS});if(!base.ok)return base;
 const s:RunSpecV3=base.value,h=s.resolvedShip.hull;
 const reference=x.referenceVfaMS??(h.id==='pony'?225:h.class==='Civilian'?(h.size==='S'?250:h.size==='M'?225:NaN):h.class==='Industrial'?(h.size==='S'?225:h.size==='M'?200:NaN):h.class==='Sport'?225:NaN);
 s.modelVersion=MODEL_MISSION_V3;s.initialState.modelVersion=MODEL_MISSION_V3;s.initialState.stateVersion='ship-mission-state/1';
 s.mission=structuredClone(x.mission??{version:'ship-mission/1',route:{distanceM:x.distanceM??100000,referenceVfaMS:reference,referenceSource:'docs/product/ship-fitting-catalog-0.2.4.md: accepted Civil/Industrial/Sport V_FA table; experimental mission condition',speedPolicy:x.speedPolicy??'vfa',speedMultiplier:2,cruiseSpeedMS:x.speedPolicy==='custom'?x.cruiseSpeedMS!:reference*2},process:{id:'LAB-ORE-01',energyJPerM3:24e6,densityKgM3:1500,extractFactor:1,softFactor:1,workFactor:1,returnFraction:.35},selectedWorkGroup:s.resolvedShip.instances.filter(i=>i.item.family==='mining').map(i=>i.id),approachSeconds:x.approachSeconds??10,serviceSeconds:x.serviceSeconds??10,targetM3:x.targetM3??10000,stopPolicy:x.stopPolicy??'full-hold',repeat:x.repeat??true,stationReplenish:x.stationReplenish??true});
 s.initialState.mission={version:'ship-mission-state/1',stage:'outbound',stageElapsedSeconds:0,positionM:0,velocityMS:0,onboardM3:0,minedM3:0,deliveredM3:0,completedTrips:0,receivedFuelKg:{diesel:0,hydrogen:0},receivedChargeJ:0,terminalReason:null};
 const annotate=(v:unknown,p:string)=>{if(typeof v==='number')s.origins[p]={kind:'experimental',unit:'SI',sourceRef:p.startsWith('mission.route')?s.mission!.route.referenceSource:'lab:conditions-LAB-ORE-01',note:'Явное условие опыта, не канонические ТТХ.'};else if(v&&typeof v==='object')for(const[k,n]of Object.entries(v))annotate(n,p+'.'+k);};annotate(s.mission,'mission');annotate(s.initialState.mission,'initialState.mission');
 return validateRunSpecV3(s);
}
