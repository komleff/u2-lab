import{it,expect}from'vitest';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
import{createShipModelRun,runShipModelChunk,shipModelResult}from'../../src/runner/ship-model-run';
import{serializeResultSnapshot,parseExperimentJson}from'../../src/io/fitting-json';
import{parseShipModelResultJson}from'../../src/io/ship-model-result';
import{validateRunSpecV3}from'../../src/model/v3/schema';
import{ermak}from'./mission-v2-fixture';
const bytes=(n:string)=>readFileSync(new URL('../fixtures/mission-v2/'+n,import.meta.url),'utf8'),sha=(x:string)=>createHash('sha256').update(x).digest('hex');
const frozen=JSON.parse(bytes('legacy-digests.json')) as {rows:{file:string;specSha256:string;serializedResultSha256:string}[]};
it.each(frozen.rows)('EF05 frozen PR52 $file preserves the full C2-produced1200s result literal',row=>{
 const text=bytes(row.file);expect(sha(text)).toBe(row.specSha256);const s=JSON.parse(text),run=createShipModelRun('legacy-preserve',s);runShipModelChunk(run,1200);const output=serializeResultSnapshot(shipModelResult(run));expect(sha(output)).toBe(row.serializedResultSha256);
 const parsed=parseShipModelResultJson(output);expect(parsed.ok).toBe(true);if(parsed.ok)expect(serializeResultSnapshot(parsed.value)).toBe(output);
});
it('EF05 C2 saved0.3.4 mission1 remains legacy while unknown mission versions fail closed',()=>{
 const s=ermak();s.mission!.version='ship-mission/1';const run=createShipModelRun('C2',s);runShipModelChunk(run,990);expect(run.state.mission!.positionM).toBe(-356.8117601465225);expect(parseExperimentJson(JSON.stringify(s)).ok).toBe(true);
 const invalid=structuredClone(s);(invalid.mission as any).version='ship-mission/3';expect(validateRunSpecV3(invalid).ok).toBe(false);
});
