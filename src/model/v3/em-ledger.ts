import { emComponent, type ActualElectricalStage } from '../../signatures/em-cs';
// Физический owner v3: adapter получает frozen split, не выполняет его повторно.
export function coupledEm(stages:ActualElectricalStage[],hostLossBudgetW:number,shieldingTransmissions:number[],intentionalRfW=0,hullLeakageFactor=1){
  const r=emComponent({stages,hostLossBudgetW,otherHostExportW:0,shieldingTransmissions,intentionalRfW});
  // Конструктивная EM-чистота корпуса: произведение с пропусканием экрана (не минимум, как у
  // strongestTransmission); удержанная доля (1 − k) остаётся теплом, намеренное RF не меняется.
  const escapedEmW=r.escapedParasiticW*hullLeakageFactor;
  return {rawEmW:r.rawParasiticW,escapedEmW,capturedEmW:r.rawParasiticW-escapedEmW,hostHeatW:r.retainedHostHeatW+(r.escapedParasiticW-escapedEmW),intentionalRfW};
}
