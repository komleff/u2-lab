import type { ActualElectricalStage } from "./em-cs";
import { emComponent } from "./em-cs";
import type { IrProjectionInput } from "./projection";
import { projectIrComponents } from "./projection";
import { exactFields, type SignatureSettings } from "./config";
import { finite, nonnegative, label } from "./domain";
import { engineIr, generatorIr, hydrogenCoolerIr } from "./sources";
export const rkMean = (values: readonly number[]) => (values[0]+2*values[1]+2*values[2]+values[3])/6;
export const gasSpecificEnergy = (temperatureK: number) => 14200 * Math.max(temperatureK - 20, 0);

export interface ActualCoolerExport {
  id: string;
  flowKgS: number;
  auxW: number;
  gasMeanW: number;
  netCoolingMeanW: number;
  allocatedIrBudgetMeanW: number;
  contrastRkMeanW: number;
}
export interface SignatureFrame {
  startS: number;
  endS: number;
  startTemperatureK: number;
  endTemperatureK: number;
  rkTemperatureK: [number,number,number,number];
  thermalDerivatives: [number,number,number,number];
  backgroundK: number;
  bodyK: number;
  radiatorK: number;
  components: IrProjectionInput[];
  stages: ActualElectricalStage[];
  hostLossBudgetW: number;
  hostIrDebitW: number;
  em: ReturnType<typeof emComponent>;
  coolers: ActualCoolerExport[];
  exports: SignatureExportTap[];
}
export interface SignatureExportTap {
  id: string;
  kind: "engine-diesel" | "engine-hydrogen" | "engine-electric" | "generator-diesel" | "generator-hydrogen";
  powerW: number;
  absoluteIrW: number;
  hostHeatDebitW: number;
  pathLossW?: number;
  motorInputW?: number;
}
export function validateSignatureFrame(value:unknown,settings:SignatureSettings):SignatureFrame {
  const f=exactFields(value,["startS","endS","startTemperatureK","endTemperatureK","rkTemperatureK","thermalDerivatives","backgroundK","bodyK","radiatorK","components","stages","hostLossBudgetW","hostIrDebitW","em","coolers","exports"],"source frame") as unknown as SignatureFrame;
  nonnegative(f.startS,"frame start");finite(f.endS,"frame end");if(!(f.endS>f.startS))throw new RangeError("frame duration");
  for(const x of [f.startTemperatureK,f.endTemperatureK,f.backgroundK,f.bodyK,f.radiatorK,f.hostLossBudgetW,f.hostIrDebitW])nonnegative(x,"source quantity");
  for(const xs of [f.rkTemperatureK,f.thermalDerivatives]) {if(!Array.isArray(xs)||xs.length!==4)throw new TypeError("RK tuple required");xs.forEach(x=>finite(x,"RK value"));}
  if(!Array.isArray(f.components)||!Array.isArray(f.stages)||!Array.isArray(f.coolers)||!Array.isArray(f.exports))throw new TypeError("Actual source arrays required");
  for(const c of f.components){exactFields(c,["id","profile","absoluteIrW","contrastW"],"IR source");
    if(c.id.startsWith("ti:")&&c.contrastW>c.absoluteIrW)throw new RangeError("Inconsistent TI radiative source");
  }
  projectIrComponents(f.components,settings.aspectDeg);
  for(const s of f.stages)exactFields(s,["id","kind","actualW"],"electrical stage");
  const em=emComponent({stages:f.stages,hostLossBudgetW:f.hostLossBudgetW,otherHostExportW:f.hostIrDebitW,shieldingTransmissions:settings.shielding,intentionalRfW:0});
  exactFields(f.em,Object.keys(em),"EM ledger");for(const k of Object.keys(em) as (keyof typeof em)[])if(f.em[k]!==em[k])throw new RangeError("Inconsistent EM field: "+k);
  const equal=(a:number,b:number)=>b===0?a===0:Math.abs(a-b)<=1e-6*Math.abs(b)+1e-12*Math.abs(b);
  let debit=0;const ids=new Set<string>();
  for(const x of f.exports) {
    exactFields(x,["id","kind","powerW","absoluteIrW","hostHeatDebitW",...(Object.hasOwn(x,"pathLossW")?["pathLossW"]:[]),...(Object.hasOwn(x,"motorInputW")?["motorInputW"]:[])],"source export");
    for(const key of ["absoluteIrW","hostHeatDebitW","pathLossW","motorInputW"] as const)if(Object.hasOwn(x,key))finite(x[key]!,"source export "+key);
    if(ids.has(x.id))throw new TypeError("duplicate source export");ids.add(x.id);nonnegative(x.powerW,"source power");
    let expected:number;
    if(x.kind.startsWith("engine-")) {const own=engineIr({kind:x.kind.slice(7) as "diesel"|"hydrogen"|"electric",enabled:true,actualSourceW:x.powerW});expected=own.absoluteIrW;if(x.hostHeatDebitW!==own.hostHeatDebitW)throw new RangeError("IR debit mismatch");debit+=own.hostHeatDebitW;}
    else if(x.kind.startsWith("generator-")){expected=generatorIr(x.kind.slice(10) as "diesel"|"hydrogen",x.powerW);if(x.hostHeatDebitW!==0)throw new RangeError("Generator IR debited twice");}
    else throw new TypeError("unknown export kind");
    const component=f.components.find(c=>c.id===x.id);if(!equal(x.absoluteIrW,expected)||!component||!equal(component.absoluteIrW,expected)||component.contrastW!==component.absoluteIrW)throw new RangeError("Export/component mismatch");
  }
  if(debit!==f.hostIrDebitW)throw new RangeError("IR debit sum mismatch");
  const coolerIds=new Set<string>();
  for(const c of f.coolers) {
    const id=label(c.id,"actual cooler id");if(coolerIds.has(id))throw new TypeError("duplicate actual cooler id");coolerIds.add(id);
    exactFields(c,["id","flowKgS","auxW","gasMeanW","netCoolingMeanW","allocatedIrBudgetMeanW","contrastRkMeanW"],"cooler export");nonnegative(c.flowKgS,"cooler flow");nonnegative(c.auxW,"cooler aux");
    for(const key of ["gasMeanW","netCoolingMeanW","allocatedIrBudgetMeanW","contrastRkMeanW"] as const)finite(c[key],"cooler export "+key);
    const gas=c.flowKgS*rkMean(f.rkTemperatureK.map(gasSpecificEnergy));
    const ir=rkMean(f.rkTemperatureK.map(t=>hydrogenCoolerIr(c.flowKgS*gasSpecificEnergy(t),c.flowKgS,f.backgroundK).contrastW));
    if(!equal(c.gasMeanW,gas)||!equal(c.netCoolingMeanW,gas-c.auxW)||!equal(c.allocatedIrBudgetMeanW,.01*gas)||!equal(c.contrastRkMeanW,ir)||f.components.some(x=>x.id==="cooler:"+c.id))throw new RangeError("Inconsistent H2 export");
  }
  for(const [id,k] of [["body",f.bodyK],["radiators",f.radiatorK]] as const) {
    const c=f.components.find(x=>x.id===id),absolute=k*5.670374419e-8*rkMean(f.rkTemperatureK.map(t=>t**4));
    if(!c||!equal(c.absoluteIrW,absolute)||!equal(c.contrastW,absolute-k*5.670374419e-8*f.backgroundK**4))throw new RangeError("Inconsistent surface export");
  }
  return f;
}
