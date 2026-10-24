import type {StoredRunSpec} from '../model/v2/types';
import {MODEL_V02} from '../model/governor-v03/types';
import {createRun,runChunk,result,type ExecutableRunContext} from './run';
import {createShipModelRunV02,runShipModelChunkV02,shipModelResultV02,restoreShipModelRunV02,type RunContextV02,type RunResultV02} from './ship-model-run-v02';
import {restoreShipModelRun,type RunResultV3} from './ship-model-run';
import {restoreFittingRun,type RunResultV2} from './fitting-run';
import {validateRunSpecV02} from './ship-model-v02-adapter';
import {validateRunSpecV3} from '../model/v3/schema';
export type DispatchRunContext=ExecutableRunContext|RunContextV02;
export function isGovernorContext(run:DispatchRunContext):run is RunContextV02{return run.spec.modelVersion===MODEL_V02;}
export function createDispatchedRun(runId:string,input:StoredRunSpec|import('../model/governor-v03/run-types').RunSpecV02):DispatchRunContext{
  if(input?.schemaVersion==='u2-lab/4'){
    if(input.modelVersion===MODEL_V02){const checked=validateRunSpecV02(input);if(!checked.ok)throw Error(JSON.stringify(checked.errors));return createShipModelRunV02(runId,checked.value);}
    const checked=validateRunSpecV3(input);if(!checked.ok)throw Error(JSON.stringify(checked.errors));return createRun(runId,checked.value);
  }
  return createRun(runId,input as StoredRunSpec);
}
export function runDispatchedChunk(run:DispatchRunContext,maxSteps:number,wallBudgetMs=Infinity){return isGovernorContext(run)?runShipModelChunkV02(run,maxSteps,wallBudgetMs):runChunk(run,maxSteps,wallBudgetMs);}
export function dispatchedResult(run:DispatchRunContext,status?:'complete'|'paused'|'cancelled'){return isGovernorContext(run)?shipModelResultV02(run,status):result(run,status);}
export function restoreDispatchedRun(saved:RunResultV2|RunResultV3|RunResultV02):DispatchRunContext{
  if(saved.spec.modelVersion===MODEL_V02)return restoreShipModelRunV02(saved);
  if(saved.spec.schemaVersion==='u2-lab/4')return restoreShipModelRun(saved as RunResultV3);
  return restoreFittingRun(saved as RunResultV2);
}
