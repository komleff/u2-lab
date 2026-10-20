import type {FieldOrigin} from '../fitting/types';
import type {HullGeometryV3,ResolvedShipV3,RunSpecV3} from '../model/v3/types';
import type {ShipModelSignatures} from './ship-model';
import {referenceCrossSection} from './em-cs';
import {finite,nonnegative,strongestTransmission} from './domain';
import {radarAnchor} from './radar';
import {observerPreset,type ObserverPresetId} from './presets';
import {exactFields} from './config';

type GeometryOrigins=Record<keyof HullGeometryV3,FieldOrigin>;
export type ShipRadarReference={source:'explicit'|'class-size-reference';geometry:HullGeometryV3;origins:GeometryOrigins;ramTransmission:number;noseCrossSectionM2:number;sideCrossSectionM2:number;aspectCrossSectionM2:number;noseRangeM:number;sideRangeM:number;rangeM:number};
export type CombinedReach={irM:number|null;emM:number|null;rangeM:number|null;channel:'IR'|'EM'|'IR+EM'|null};
export type ShipReferenceMeasurements={version:'ship-reference/1';observer:RunSpecV3['observer'];receiverProfile:RunSpecV3['receiverProfile'];intervalSeconds:[number,number];radar:ShipRadarReference|null;passive:{current:CombinedReach;mean:CombinedReach;max:CombinedReach}};
const geometryKeys=['lengthM','widthM','heightM','noseFactor','sideFactor'] as const;
const grid:Partial<Record<ResolvedShipV3['hull']['class'],readonly [number,number,number]>>={Civilian:[27,12,4.5],Industrial:[30,13.5,5.25],Sport:[36,8.25,3.3],Military:[25.5,12,4.875],Stealth:[36,12,3]};
const sourceRef='u2@14709da00fd3ce0704ce87a79e1cae895e7dc375:docs/specs/spec_ship_dimensions_v1.0.md§1';

export function shipRadarReference(ship:ResolvedShipV3,aspectDeg:number):ShipRadarReference|null{
  const hull=ship.hull,base=grid[hull.class];if(!hull.geometry&&!base)return null;
  const scale={S:1,M:2,L:4}[hull.size];
  const geometry=hull.geometry?structuredClone(hull.geometry):{lengthM:base![0]*scale,widthM:base![1]*scale,heightM:base![2]*scale,noseFactor:1,sideFactor:1};
  const origins=Object.fromEntries(geometryKeys.map(key=>[key,hull.geometry?hull.origins['geometry.'+key]:{
    kind:key==='lengthM'||key==='widthM'?'derived':'experimental',unit:key.endsWith('M')?'m':'1',sourceRef,
    ...(key==='lengthM'||key==='widthM'?{derivation:'Классовая опора '+hull.class+'/'+hull.size+' из §1'}:{}),
    note:key==='heightM'?'H — прежняя расчётная высота, ориентир; не утверждена.':key.endsWith('Factor')?'Прямоугольная reference проекция без коэффициента именной модели.':'Классовая опора, не измерение именной модели.',
  }])) as GeometryOrigins;
  const ram=ship.instances.filter(i=>i.enabled&&i.item.family==='ram').map(i=>i.item.numerics.radarTransmission),ramTransmission=strongestTransmission(ram);
  // /3 primitive получает эффективные носовую/бортовую ширины, коэффициенты модели не меняют тепло.
  const projected={lengthM:geometry.lengthM*geometry.sideFactor,widthM:geometry.widthM*geometry.noseFactor,heightM:geometry.heightM};
  const noseCrossSectionM2=referenceCrossSection(projected,0,ram),sideCrossSectionM2=referenceCrossSection(projected,90,ram),aspectCrossSectionM2=referenceCrossSection(projected,aspectDeg,ram),anchor=radarAnchor('S');
  const reach=(area:number)=>finite(Math.sqrt(Math.sqrt(area))*Math.sqrt(Math.sqrt(anchor.rfJ*anchor.apertureM2/anchor.thresholdJ))/Math.sqrt(4*Math.PI),'radar reference M');
  return {source:hull.geometry?'explicit':'class-size-reference',geometry,origins,ramTransmission,noseCrossSectionM2,sideCrossSectionM2,aspectCrossSectionM2,noseRangeM:reach(noseCrossSectionM2),sideRangeM:reach(sideCrossSectionM2),rangeM:reach(aspectCrossSectionM2)};
}
export function combinedPassiveReach(irM:number|null,emM:number|null):CombinedReach{
  if(irM!==null)nonnegative(irM,'IR reference M');if(emM!==null)nonnegative(emM,'EM reference M');
  return {irM,emM,rangeM:irM===null||emM===null?null:Math.max(irM,emM),channel:irM===null||emM===null?null:irM===emM?'IR+EM':irM>emM?'IR':'EM'};
}
export function captureShipReferences(spec:RunSpecV3,timeSeconds:number,signatures:ShipModelSignatures):ShipReferenceMeasurements{
  const preset=observerPreset(spec.observer.presetId as ObserverPresetId),stats=signatures.version==='ship-signatures/2'?signatures.statistics:undefined;
  const reach=(power:number|null,threshold:number)=>power===null?null:finite(Math.sqrt(nonnegative(power,'reference power W'))/(Math.sqrt(4*Math.PI)*Math.sqrt(threshold)),'passive reference M');
  const pair=(ir:number|null,em:number|null)=>combinedPassiveReach(reach(ir,preset.ir.detectWm2),reach(em,preset.em.detectWm2));
  return {version:'ship-reference/1',observer:structuredClone(spec.observer),receiverProfile:spec.receiverProfile,intervalSeconds:[spec.initialState.timeSeconds,timeSeconds],radar:shipRadarReference(spec.resolvedShip,spec.observer.aspectDeg),passive:{current:pair(signatures.last?.receiverIrW??null,signatures.last?.observedEmW??null),mean:pair(stats?.receiverIrW.meanW??null,stats?.observedEmW.meanW??null),max:pair(stats?.receiverIrW.maxW??null,stats?.observedEmW.maxW??null)}};
}
// Импорт проверяет сохранённую схему и binding; измерения не достраиваются и не заменяются новыми расчётами.
export function validateShipReferences(value:unknown,spec:RunSpecV3,timeSeconds:number):void{
  const m=exactFields(value,['version','observer','receiverProfile','intervalSeconds','radar','passive'],'ship references') as unknown as ShipReferenceMeasurements;
  if(m.version!=='ship-reference/1'||m.receiverProfile!==spec.receiverProfile)throw Error('Неподдерживаемая версия/профиль reference');
  exactFields(m.observer,['presetId','rangeM','aspectDeg'],'reference observer');
  if(m.observer.presetId!==spec.observer.presetId||m.observer.rangeM!==spec.observer.rangeM||m.observer.aspectDeg!==spec.observer.aspectDeg||!Array.isArray(m.intervalSeconds)||m.intervalSeconds.length!==2||m.intervalSeconds[0]!==spec.initialState.timeSeconds||m.intervalSeconds[1]!==timeSeconds)throw Error('Reference принадлежит другому observer/aspect/интервалу');
  exactFields(m.passive,['current','mean','max'],'reference passive');
  for(const pair of Object.values(m.passive)){
    exactFields(pair,['irM','emM','rangeM','channel'],'reference max');
    for(const n of [pair.irM,pair.emM,pair.rangeM])if(n!==null)nonnegative(n,'reference M');
    const expected=combinedPassiveReach(pair.irM,pair.emM);if(pair.rangeM!==expected.rangeM||pair.channel!==expected.channel)throw Error('Несогласованный max(IR, EM)');
  }
  if(m.radar!==null){
    const r=m.radar;exactFields(r,['source','geometry','origins','ramTransmission','noseCrossSectionM2','sideCrossSectionM2','aspectCrossSectionM2','noseRangeM','sideRangeM','rangeM'],'reference radar');
    if(!['explicit','class-size-reference'].includes(r.source))throw Error('Неизвестный источник геометрии');
    exactFields(r.geometry,geometryKeys,'reference geometry');exactFields(r.origins,geometryKeys,'reference geometry origins');
    for(const key of geometryKeys){if(finite(r.geometry[key],key)<=0)throw Error('Нужна положительная геометрия');const origin=r.origins[key];if(!origin||!['canonical','derived','experimental'].includes(origin.kind)||!origin.unit||!origin.sourceRef||origin.kind==='derived'&&!origin.derivation)throw Error('Нужно происхождение геометрии');}
    for(const key of ['ramTransmission','noseCrossSectionM2','sideCrossSectionM2','aspectCrossSectionM2','noseRangeM','sideRangeM','rangeM'] as const)nonnegative(r[key],key);
    if(r.ramTransmission>1)throw Error('RAM transmission >1');
  }
}
