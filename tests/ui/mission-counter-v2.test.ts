import{expect,it}from'vitest';import{traceChart}from'../../src/app/fitting-ui/trace-chart';
it('EF06 a zero trip series labels1 as scale rather than a completed trip',()=>{
 const html=traceChart({channels:['completedTrips'],buckets:[{startSeconds:0,endSeconds:1,count:1,sum:new Float64Array([0]),min:new Float64Array([0]),max:new Float64Array([0])}]},['completedTrips'],1,[],true,[],'рейсы');
 expect(html).toContain('Шкала:');expect(html).not.toContain('>1 рейсы<');
});
import{shipModelChannelsView}from'../../src/app/fitting-ui/ship-model-lab-view';
import{createShipModelRun,runShipModelChunk,shipModelResult}from'../../src/runner/ship-model-run';
import{ermak}from'../model-v3/mission-v2-fixture';
it('EF06 count panel states actual integer counter, delivered and onboard from observed state, never bucket mean',()=>{
 const s=ermak('none',1201);Object.assign(s.initialState.mission!,{stage:'inbound',positionM:50000,velocityMS:-450,onboardM3:36,minedM3:36});const run=createShipModelRun('counter',s);runShipModelChunk(run,1);const r=shipModelResult(run),i=r.channels.indexOf('completedTrips');r.buckets[0].sum[i]=5;r.buckets[0].max[i]=5;
 const html=shipModelChannelsView(r,{group:'mission',unit:'рейсы',hidden:new Set(),eventIndex:0,bucketIndex:0});expect(html).toContain('data-factual-trips="0"');expect(html).toContain('Фактически завершено: 0');expect(html).toContain('Доставлено 0 SCU');expect(html).toContain('на борту 36 SCU');
 const noData=structuredClone(r);noData.state.mission=undefined;const empty=shipModelChannelsView(noData,{group:'mission',unit:'рейсы',hidden:new Set(),eventIndex:0});expect(empty).not.toContain('data-factual-trips="0"');
});
