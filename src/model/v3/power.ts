import type { ShipMode } from "./types";
export type ElectricalInput = {
  chargeJ: number; capacityJ: number; loadW: number; independentSupplyW: number; generatorMaximumW: number;
  chargeEfficiency: number; dischargeEfficiency: number; batteryChargeFactor:number;batteryDischargeFactor:number; mode: ShipMode;
  generator: { permission: boolean; normalOn: boolean };
};
export function resolveElectrical(x: ElectricalInput) {
  const soc=x.chargeJ/x.capacityJ,deficit=Math.max(0,x.loadW-x.independentSupplyW);
  const masking=x.mode==='Masking';
  // Сравнение запасов сохраняет точную authored границу fraction*capacity.
  const permission=masking&&x.chargeJ<x.capacityJ*0.02&&(x.generator.permission||(x.chargeJ<x.capacityJ*0.01&&deficit>0));
  const normalOn=masking?x.generator.normalOn||permission:x.generator.normalOn||soc<0.9||deficit>0;
  // На полном аккумуляторе нет причины оплачивать фиктивный заряд или excess heat.
  const chargingRoomW=Math.max(0,(x.capacityJ-x.chargeJ)/x.chargeEfficiency)*x.batteryChargeFactor;
  const wanted=masking?(permission?deficit:0):normalOn?deficit+Math.max(0,chargingRoomW-Math.max(0,x.independentSupplyW-x.loadW)):0;
  const generatorW=Math.min(x.generatorMaximumW,wanted);
  const independentAcceptedW=Math.min(x.independentSupplyW,x.loadW+chargingRoomW);
  const sourceW=generatorW+independentAcceptedW;
  const batteryOutputW=x.chargeJ>0?Math.max(0,x.loadW-sourceW)*x.batteryDischargeFactor:0;
  const deliveredW=Math.min(x.loadW,sourceW+batteryOutputW);
  const batteryInputW=Math.min(chargingRoomW,Math.max(0,sourceW-deliveredW));
  const dischargeJPerS=batteryOutputW/x.dischargeEfficiency;
  const chargeRateJPerS=batteryInputW*x.chargeEfficiency-dischargeJPerS;
  return { generatorW, independentAcceptedW, rejectedIndependentW:x.independentSupplyW-independentAcceptedW,
    deliveredW, batteryInputW, batteryOutputW, chargeRateJPerS,
    converterLossW:batteryInputW*(1-x.chargeEfficiency)+dischargeJPerS-batteryOutputW,
    depletionSeconds:dischargeJPerS>0?x.chargeJ/dischargeJPerS:Infinity,
    generator:{permission,normalOn:normalOn&&!(soc>=1&&deficit===0)} };
}
