import {createRun,runChunk,result} from '../../src/runner/run';
import {it,expect} from 'vitest';
import old from '../fitting/fixtures/station-service-old.json';
import {traceChart,thermalFrontiers} from '../../src/app/fitting-ui/trace-chart';
import type {RunSpecV2} from '../../src/model/v2/types';
import type {RunResultV2} from '../../src/runner/run';
it('CD07 K chart puts the unchanged numerical frontiers beside its left axis; W chart keeps its own scale',()=>{
 const run=createRun("axis",old.spec as unknown as RunSpecV2);runChunk(run,2);const r=result(run),t=thermalFrontiers(r),before=JSON.stringify(r),html=traceChart(r,['temperatureK'],undefined,t.limits,false,t.bands);
 expect(html).not.toMatch(/>Холод:|>Жар:/);expect(html).toContain('data-k-axis-label');for(const l of t.limits.filter(l=>l.label))expect(html).toContain(`data-boundary-label="${l.id}"`);
 expect(html).toContain('data-axis-x="180"');expect(traceChart(r,['requestedW'])).toContain('M40 20V170H660');expect(JSON.stringify(r)).toBe(before);
});
