import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
it('frozen first physical Sputnik-D hour reproduces full input/state/events and retained-result digest',()=>{
 const f=JSON.parse(readFileSync('tests/fixtures/ship-model-mission/sputnik-d-hour.json','utf8')),run=createShipModelRun(f.runId,f.input);runShipModelChunk(run,3600);const r=shipModelResult(run);
 expect(r.state).toEqual(f.expected.state);expect(r.events).toEqual(f.expected.events);expect(r.metrics).toEqual(f.expected.metrics);expect(r.signatures).toEqual(f.expected.signatures);expect(r.retention).toEqual(f.expected.retention);expect(createHash('sha256').update(serializeResultSnapshot(r)).digest('hex')).toBe(f.expected.resultSha256);
},20000);
