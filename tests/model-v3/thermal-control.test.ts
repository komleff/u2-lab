import { expect, it } from "vitest";
import { thermalAvailability, temperatureCorridor, authorizedDuty } from "../../src/model/v3/thermal-control";
import { heatingOrder } from "../../src/model/v3/heating";
import { fixture } from "./fixture";
it.each(["Civilian","Military"])("Military Combat hot override includes %s module class, retains wear, cold and critical stop",moduleClass=>{
  const s=fixture(),i=s.resolvedShip.instances.find(i=>i.item.family==='engine')!,state=s.initialState.modules[i.id];i.item.class=moduleClass as typeof i.item.class;
  const g=i.item.gate,T=(g.workHigh+g.high)/2;
  const ordinary=thermalAvailability(i.item,state,T,"Civilian","Combat"),hot=thermalAvailability(i.item,state,T,"Military","Combat");
  expect(ordinary.factor).toBeCloseTo(0.5);expect(hot.factor).toBe(1);expect(hot.wearMultiplier).toBeGreaterThan(1);
  expect(thermalAvailability(i.item,state,T,"Military","Masking").factor).toBeCloseTo(0.5);
  expect(thermalAvailability(i.item,state,(g.low+g.workLow)/2,"Military","Combat").factor).toBeCloseTo(0.5);
  for(const t of [g.high,g.high+1,g.low,g.low-1])expect(thermalAvailability(i.item,state,t,"Military","Combat").factor).toBe(0);
});
it("temperature restart band precedes durability/cooldown and changes no first-negative state",()=>{
  const s=fixture(),i=s.resolvedShip.instances.find(i=>i.item.family==='engine')!,state=s.initialState.modules[i.id],before=structuredClone(state);state.thermalStopped=true;
  expect(thermalAvailability(i.item,state,i.item.gate.workHigh+1,"Military","Combat").factor).toBe(0);
  state.durabilityR=-0.1;state.firstNegativeCrossing=true;state.restartAuthorized=true;state.cooldownSeconds=5;
  const r=thermalAvailability(i.item,state,i.item.gate.restartHigh,"Military","Combat");expect(r.thermalStopped).toBe(false);expect(r.factor).toBe(0);
  state.cooldownSeconds=0;expect(thermalAvailability(i.item,state,i.item.gate.restartHigh,"Military","Combat").factor).toBe(1);
  expect(before.firstNegativeCrossing).toBe(false);expect(state.firstNegativeCrossing).toBe(true);
});
it("installed off ordinary module still defines Tw/Tc; regulators do not, incompatible corridor is explicit",()=>{
  const s=fixture(),items=s.resolvedShip.instances,off=items.find(i=>i.item.family==='mining')!;off.enabled=false;off.item.gate.workHigh=430;
  expect(temperatureCorridor(items).warmK).toBe(430);off.item.thermalRole='regulator';expect(temperatureCorridor(items).warmK).toBeGreaterThan(430);
  const ordinary=items.find(i=>i.item.thermalRole==='ordinary')!;ordinary.item.gate.workLow=1000;expect(temperatureCorridor(items).compatible).toBe(false);
});
it.each(["mining","radar","transmitter"])("Masking rejects %s emission before electrical/heat construction and keeps flight/passive receiver",family=>{
  const s=fixture(),m=s.resolvedShip.instances.find(i=>i.item.family==='mining')!.item;m.family=family as typeof m.family;
  expect(authorizedDuty(m,"Masking",1).duty).toBe(0);expect(authorizedDuty(m,"Masking",1).reason).toBeTruthy();
  m.family='engine';expect(authorizedDuty(m,"Masking",1).duty).toBe(1);m.family='sensor';expect(authorizedDuty(m,"Masking",1).duty).toBe(1);
});
it("automatic heating order follows generator species; Masking forbids furnace",()=>{
  expect(heatingOrder('diesel','Efficient')).toEqual(['furnace','electric-heater']);
  expect(heatingOrder('hydrogen','Efficient')).toEqual(['electric-heater','furnace']);
  expect(heatingOrder(null,'Efficient')).toEqual(['electric-heater','furnace']);expect(heatingOrder('diesel','Masking')).toEqual(['electric-heater']);
});
