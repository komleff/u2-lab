import { emComponent, type ActualElectricalStage } from '../../signatures/em-cs';
// Физический owner v3: adapter получает frozen split, не выполняет его повторно.
export function coupledEm(stages:ActualElectricalStage[],hostLossBudgetW:number,shieldingTransmissions:number[],intentionalRfW=0){
  const r=emComponent({stages,hostLossBudgetW,otherHostExportW:0,shieldingTransmissions,intentionalRfW});
  return {rawEmW:r.rawParasiticW,escapedEmW:r.escapedParasiticW,capturedEmW:r.capturedParasiticW,hostHeatW:r.retainedHostHeatW,intentionalRfW};
}
