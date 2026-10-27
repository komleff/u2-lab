import {expect,it} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildExperimentalCases,executeExperiments,buildRuntimeConformance,experimentFingerprints} from '../../src/experiments/ship-model-v0.1';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {Retention} from '../../src/runner/retention';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {validateRunSpecV3} from '../../src/model/v3/schema';
const digest=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const artifact='docs/experiments/ship-model-v0.1-results.json';
it('ST1-09 neutral matrix rows remain byte-identical to accepted WI3 base8318877',()=>{
  // Отпечаток снят с фактических строк принятого base, не вычислен из новых ожиданий.
  const affected=new Set(['stealth-Efficient-maneuver-0.1','stealth-Efficient-maneuver-1','military-structural-buffer-aft','buffer-recovery-cold','buffer-recovery-hot']);
  const neutral=executeExperiments().filter(row=>!affected.has(row.id));expect(neutral).toHaveLength(50);
  // WI4 добавляет новый reference snapshot и меняет fullResultSha256; исходные measured данные сохраняются.
  expect(digest(neutral.map(({id,input,measured})=>({id,input,measured})))).toBe('2423b84935252193050540023824bdac1bebb2a693b31be6d421439ebf7bb470');
});
it('ST4-05 все 55 measured rows: тепло, IR/EM, stocks, events и retention побайтно прежние относительно accepted WI1 d67ac61',()=>{
  expect(digest(executeExperiments().map(({id,input,measured})=>({id,input,measured})))).toBe('cbd00a0dd91a7296e4f9919f040dc4f57441b6b4ba7736c6154059246ab480e7');
});
it('experimental matrix actually runs both reference cycles, fields, modes, generations and installation trade-offs',()=>{
  const rows=executeExperiments();expect(rows.length).toBeGreaterThanOrEqual(30);
  for(const row of rows){expect(row.measured.status).toBe('complete');expect(row.measured.retention.totalTicks).toBe(row.input.durationSeconds);expect(Number.isFinite(row.measured.metrics.totalResidualJ)).toBe(true);expect(Math.abs(row.measured.metrics.totalResidualJ)).toBeLessThan(1);expect(row.fullResultSha256).toMatch(/^[0-9a-f]{64}$/);}
  for(const prefix of ['sputnik','severin-mir','generation-10','generation-20','generation-100','military-structural','stealth','surface','buffer'])expect(rows.some(r=>r.id.startsWith(prefix))).toBe(true);
  expect(rows.find(r=>r.id==='buffer-high-short')!.measured.events.some(e=>e.kind==='power-limit')).toBe(true);
  const debt=(id:string)=>Object.values(rows.find(r=>r.id===id)!.measured.state.buffers).reduce((n,b)=>n+b.storedJ,0);expect(debt('buffer-recovery-cold')).toBe(0);expect(debt('buffer-recovery-hot')).toBeGreaterThan(0);
  const recurrence=rows.find(r=>r.id==='stealth-Masking-generator-recurrence');expect(recurrence).toBeDefined();expect(recurrence!.measured.state.generator.permission).toBe(true);expect(recurrence!.measured.lastTelemetry.generatorW).toBeGreaterThan(0);
  for(const policy of ['deferrable-background','optional-pulse-charge']){const row=rows.find(r=>r.id==='stealth-Masking-'+policy);expect(row).toBeDefined();expect(row!.measured.lastTelemetry['actualW:experimental-background']).toBe(0);expect(row!.measured.state.mode).toBe('Masking');}
  const mixed=rows.find(r=>r.id==='surface-mixed-hot-common-ti');expect(mixed).toBeDefined();expect(mixed!.measured.signatures.last!.paths.filter(p=>p.kind==='radiator').some(p=>p.profile.kind==='aft-directed')).toBe(true);expect(mixed!.measured.lastTelemetry.tiCoolingW).toBeGreaterThan(0);
});
it('new model 10,000-second performance and bounded retention replay preserve literal measured history',()=>{
  const spec=buildExperimentalCases()[0].spec;spec.durationSeconds=10000;spec.scenario.repeat=true;
  const started=performance.now(),run=createShipModelRun('long-v3',spec);run.retention=new Retention([],32);runShipModelChunk(run,5000);
  const saved=shipModelResult(run,'paused'),parsed=parseShipModelResultJson(serializeResultSnapshot(saved));expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  const restored=restoreShipModelRun(parsed.value);expect(serializeResultSnapshot(shipModelResult(restored,'paused'))).toBe(serializeResultSnapshot(saved));runShipModelChunk(restored,5000);runShipModelChunk(run,5000);
  expect(serializeResultSnapshot(shipModelResult(restored))).toBe(serializeResultSnapshot(shipModelResult(run)));expect(run.state.timeSeconds).toBe(10000);expect(run.retention.buckets.length).toBeLessThanOrEqual(32);expect(run.retention.cadenceSeconds).toBeGreaterThan(1);expect(run.retention.bytes).toBeLessThan(128*1024*1024);expect(performance.now()-started).toBeLessThan(15000);
},20000);
it('CP01–05 exports production inputs/outputs and pinned source fingerprints without claiming server execution',()=>{
  const conformance=buildRuntimeConformance();expect(conformance.serverParity).toBe('NOT RUN');expect(new Set(conformance.vectors.map(v=>v.cp))).toEqual(new Set(['CP-01','CP-02','CP-03','CP-04','CP-05']));
  for(const v of conformance.vectors){expect(v.input).toBeDefined();expect(v.output).toBeDefined();}expect(conformance.fingerprints).toEqual(experimentFingerprints());
  const physical=conformance.vectors.filter(v=>v.adapter==='production-stepV3/1') as any[];for(const v of physical)expect(validateRunSpecV3(v.input.spec).ok).toBe(true);
  expect(physical.find(v=>v.cp==='CP-04').output.state.temperatureK).toBeCloseTo(490.025,9);expect(physical.find(v=>v.cp==='CP-05').output.state.rng.state).toBe(724273890);
});
it('versioned measured artifact is literal-reproducible, not an expected-vector echo',()=>{
  const matrix={schemaVersion:'ship-model-experiments/1',status:'experimental; independent QA pending',serverParity:'NOT RUN',fingerprints:experimentFingerprints(),rows:executeExperiments()},conformance=buildRuntimeConformance();
  if(process.env.SHIP_MODEL_CAPTURE==='1'){console.log('__SHIP_MODEL_ARTIFACT__'+JSON.stringify({matrix,conformance}));return;}
  expect(existsSync(artifact)).toBe(true);const saved=JSON.parse(readFileSync(artifact,'utf8')),cp=JSON.parse(readFileSync('docs/verification/ship-model-v0.1-runtime.json','utf8'));
  // Новое ядро расширяет только новый каталог. Исторические измерения обязаны
  // воспроизводиться буквально, но их source receipt остаётся у прежнего commit.
  const {fingerprints:currentPins,...measured}=matrix,{fingerprints:oldPins,...historical}=saved;
  expect(digest(measured)).toBe(digest(historical));
  const {fingerprints:cpPins,...cpNow}=conformance,{fingerprints:cpOldPins,...cpHistorical}=cp;
  expect(digest(cpNow)).toBe(digest(cpHistorical));expect(cpPins).toEqual(currentPins);expect(cpOldPins).toEqual(oldPins);
  const frozen=JSON.parse(readFileSync('docs/research/2026-10-26-diesel-balance/manifest.json','utf8'));
  expect(frozen.sourceKernelCommit).toBe('f0732d326f346bf557ed582b8bbe7cdba60caa29');
  const delta=new Set(['src/model/v3/power.ts','src/model/v3/schema.ts','src/model/v3/step.ts','src/model/v3/types.ts','src/runner/ship-model-telemetry.ts','src/scenarios/fitting.ts']);
  // Новый mission/2 dispatch меняет runner bytes, но старые 55 rows и CP выше
  // сравниваются целиком; исторический fingerprint проверяется по frozen Git blob.
  for(const [path,hash]of Object.entries(oldPins)){
    const original=execFileSync('git',['show',frozen.sourceKernelCommit+':'+path]);
    expect(createHash('sha256').update(original).digest('hex')).toBe(hash);
    if(Object.hasOwn(frozen.sourceKernelFiles,path))expect(frozen.sourceKernelFiles[path]).toBe(hash);
    if(!delta.has(path)&&path!=='src/runner/ship-model-run.ts')expect(currentPins[path]).toBe(hash);
  }

});
