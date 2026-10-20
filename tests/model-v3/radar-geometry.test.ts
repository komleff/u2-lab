import {expect,it} from 'vitest';
import {fixture} from './fixture';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {validateRunSpecV3} from '../../src/model/v3/schema';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {shipModelResults} from '../../src/app/fitting-ui/ship-model-results';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {combinedPassiveReach} from '../../src/signatures/ship-reference';

const origin={kind:'experimental' as const,unit:'SI',sourceRef:'tests/model-v3/radar-geometry.test.ts',note:'Синтетическая геометрия, не ТТХ именной модели.'};
function sample(geometry?:Record<string,number>,aspectDeg=0){
  const s=fixture();s.durationSeconds=2;s.observer.aspectDeg=aspectDeg;
  if(geometry){(s.resolvedShip.hull as any).geometry=geometry;for(const key of Object.keys(geometry))s.resolvedShip.hull.origins['geometry.'+key]=origin;}
  return s;
}
function result(s=sample(),steps=2){const run=createShipModelRun('ST4',s);runShipModelChunk(run,steps);return shipModelResult(run);}
const reference=(r:ReturnType<typeof result>)=>(r as any).referenceMeasurements;
const geometry={lengthM:40,widthM:10,heightM:4,noseFactor:0.5,sideFactor:0.8};

it('ST4-01/02 новый production result сохраняет S Civilian reference, не фиксированную геометрию /3',()=>{
  const m=reference(result());expect(m?.version).toBe('ship-reference/1');
  expect(m.radar.source).toBe('class-size-reference');expect(m.radar.geometry).toEqual({lengthM:27,widthM:12,heightM:4.5,noseFactor:1,sideFactor:1});
  expect(m.radar.noseCrossSectionM2).toBe(54);expect(m.radar.sideCrossSectionM2).toBe(121.5);
  expect(m.radar.noseRangeM).toBeCloseTo(13856.406460928934,5);
  expect(m.radar.origins.heightM.kind).toBe('experimental');expect(m.radar.origins.heightM.note).toMatch(/не утвержд/);
});
it.each([[0,20],[90,128],[180,20],[270,128],[450,128],[45,104.65180361560903]])('ST4-01 explicit geometry и aspect %s дают площадь %s', (angle,area)=>{
  const s=sample(geometry,angle),checked=validateRunSpecV3(s);expect(checked.ok,JSON.stringify(checked)).toBe(true);
  const m=reference(result(s));expect(m.radar.source).toBe('explicit');expect(m.radar.geometry).toEqual(geometry);expect(m.radar.aspectCrossSectionM2).toBeCloseTo(area,10);
});
it('ST4-01 RAM 0.25 уменьшает площадь вчетверо, дальность на sqrt(0.5), disabled RAM нейтрален',()=>{
  const c=loadCandidateCatalog('ship-fitting-0.3.2'),fit=getPresetFit('stealth-reference',c.version),compiled=makeShipModelMiningRun(fit,c,{durationSeconds:2});if(!compiled.ok)throw Error(JSON.stringify(compiled));
  const s=compiled.value,ram=s.resolvedShip.instances.find(i=>i.item.family==='ram')!;
  const on=reference(result(s)).radar;ram.enabled=false;s.resolvedShip.fit.builtinModes[ram.id]={enabled:false};const off=reference(result(s)).radar;
  expect(on.aspectCrossSectionM2/off.aspectCrossSectionM2).toBe(0.25);expect(on.rangeM/off.rangeM).toBeCloseTo(0.7071067811865476,12);
});
it.each([['Civilian','M',216],['Industrial','S',70.875],['Sport','L',435.6],['Military','S',58.5],['Stealth','S',36]] as const)('ST4-02 %s/%s использует классовую сетку', (shipClass,size,area)=>{
  const s=sample();s.resolvedShip.hull.class=shipClass;s.resolvedShip.hull.size=size;
  expect(reference(result(s)).radar.noseCrossSectionM2).toBeCloseTo(area,10);
});
it('ST4-02 UNKNOWN не получает Civilian default; explicit geometry остаётся доступна',()=>{
  const s=sample();s.resolvedShip.hull.class='UNKNOWN';expect(reference(result(s)).radar).toBeNull();
  const explicit=sample(geometry);explicit.resolvedShip.hull.class='UNKNOWN';expect(reference(result(explicit)).radar.noseCrossSectionM2).toBe(20);
});
it('ST4-03 три экспериментальные модели одинакового размера отличаются формой носа, без национальных множителей',()=>{
  const rows=[['Sinclair',0.3],['Guanzhao',0.6],['Тензор',0.9]].map(([name,noseFactor])=>{
    const s=sample({...geometry,noseFactor:Number(noseFactor)});s.resolvedShip.hull.label=String(name);
    return reference(result(s)).radar.noseCrossSectionM2;
  });expect(rows).toEqual([12,24,36]);
});
it.each([['lengthM',0],['heightM',-1],['widthM',Infinity],['noseFactor',NaN],['sideFactor',0]])('ST4-05 invalid geometry %s=%s отклоняется', (field,value)=>{
  expect(validateRunSpecV3(sample({...geometry,[field]:value})).ok).toBe(false);
});
it('ST4-05 геометрия требует exact fields и origins; absence остаётся допустимым',()=>{
  expect(validateRunSpecV3(sample()).ok).toBe(true);
  const s=sample(geometry);delete s.resolvedShip.hull.origins['geometry.heightM'];expect(validateRunSpecV3(s).ok).toBe(false);
  expect(validateRunSpecV3(sample({...geometry,extra:1})).ok).toBe(false);
});
it('ST4-04 max(IR,EM) сохраняет собственные observer/aspect/интервал и канал отдельно от радара',()=>{
  const r=result(),m=reference(r);expect(m).toBeDefined();expect(m.observer).toEqual(r.spec.observer);expect(m.intervalSeconds).toEqual([0,2]);
  expect(m.passive.current.rangeM).toBe(Math.max(m.passive.current.irM,m.passive.current.emM));expect(m.passive.current.channel).toBe('EM');
  const html=shipModelResults(r);expect(html).toContain('data-reference-distance="TOTAL:current"');expect(html).toContain('data-channel="EM"');expect(html).toContain('Радар S');
});
it('ST4-04 отсутствие канала не превращается в ноль; пустой интервал и измеренный ноль различаются',()=>{
  expect(combinedPassiveReach(null,120)).toEqual({irM:null,emM:120,rangeM:null,channel:null});
  expect(combinedPassiveReach(0,0)).toEqual({irM:0,emM:0,rangeM:0,channel:'IR+EM'});
  expect(combinedPassiveReach(200,120).channel).toBe('IR');
  const m=reference(result(sample(),0));expect(m.passive.current.rangeM).toBeNull();expect(m.passive.mean.rangeM).toBeNull();
});
it('ST4-05 старый result без measurements открывается/экспортируется буквально и не получает поля при restore',()=>{
  const old=result(sample(),1);delete (old as any).referenceMeasurements;const literal=serializeResultSnapshot(old),parsed=parseShipModelResultJson(literal);
  expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  expect(serializeResultSnapshot(parsed.value)).toBe(literal);expect(shipModelResults(parsed.value)).toContain('Старый результат: радар и max(IR, EM) не измерены');
  const restored=restoreShipModelRun(parsed.value);expect(serializeResultSnapshot(shipModelResult(restored,'paused'))).toBe(literal);
  runShipModelChunk(restored,1);expect(shipModelResult(restored)).not.toHaveProperty('referenceMeasurements');
});
it('ST4-05 новый result literal roundtrip, resume и unknown measurement version/schema fail closed',()=>{
  const partial=result(sample(),1),parsed=parseShipModelResultJson(serializeResultSnapshot(partial));expect(parsed.ok).toBe(true);if(!parsed.ok)return;
  expect(serializeResultSnapshot(shipModelResult(restoreShipModelRun(parsed.value),'paused'))).toBe(serializeResultSnapshot(partial));
  const resumed=restoreShipModelRun(parsed.value);runShipModelChunk(resumed,1);expect(shipModelResult(resumed)).toEqual(result());
  for(const mutate of [(r:any)=>r.referenceMeasurements.version='future',(r:any)=>r.referenceMeasurements.radar.rangeM=-1,(r:any)=>r.referenceMeasurements.observer.aspectDeg=90,(r:any)=>r.referenceMeasurements.extra=true]){
    const bad=structuredClone(partial);mutate(bad);expect(parseShipModelResultJson(serializeResultSnapshot(bad)).ok).toBe(false);
  }
});
