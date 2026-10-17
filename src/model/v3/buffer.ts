export type BufferInput = {
  storedJ:number; minimumCaptureK:number|null; capacityJ:number;
  chargePowerW:number; dischargePowerW:number; temperatureK:number; captureW:number; releaseW:number;
};
export function bufferFlow(x:BufferInput) {
  if(x.captureW>0&&x.releaseW>0)throw new Error('simultaneous buffer capture and release');
  let rateStoredJPerS=0,reason:string|null=null;
  if(x.captureW>0){
    if(x.storedJ>=x.capacityJ)reason='capacity-limit';
    else {rateStoredJPerS=Math.min(x.captureW,x.chargePowerW);if(rateStoredJPerS<x.captureW)reason='power-limit';}
  }else if(x.releaseW>0){
    if(x.storedJ<=0)reason='empty';
    else if(x.minimumCaptureK===null||x.temperatureK>x.minimumCaptureK)reason='hotter-than-capture';
    else {rateStoredJPerS=-Math.min(x.releaseW,x.dischargePowerW);if(-rateStoredJPerS<x.releaseW)reason='power-limit';}
  }
  const limitSeconds=rateStoredJPerS>0?(x.capacityJ-x.storedJ)/rateStoredJPerS:rateStoredJPerS<0?x.storedJ/-rateStoredJPerS:Infinity;
  return {rateStoredJPerS,heatToShipW:-rateStoredJPerS,limitSeconds,reason};
}
export function advanceBuffer(x:BufferInput,flow:ReturnType<typeof bufferFlow>,seconds:number,endTemperatureK:number){
  const transferredJ=flow.rateStoredJPerS*Math.min(seconds,flow.limitSeconds);
  const storedJ=Math.max(0,Math.min(x.capacityJ,x.storedJ+transferredJ));
  const minimumCaptureK=storedJ===0?null:transferredJ>0?Math.min(x.minimumCaptureK??Infinity,x.temperatureK,endTemperatureK):x.minimumCaptureK;
  return {storedJ,minimumCaptureK,transferredJ};
}
