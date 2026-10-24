import {MODEL_V02,STATE_V2,GOVERNOR_VERSION,GOVERNOR_PROFILE_VERSION,TICK_HZ,TICK_SECONDS,type GovernorTickInputV03} from '../model/governor-v03/types';
import type {RunSpecV02,ShipModeV02} from '../model/governor-v03/run-types';
import {governorModeV02,requireRunSpecV02} from '../runner/ship-model-v02-adapter';

// Только явно переданный synthetic input; каталог и реальные паспорта не участвуют.
export function makeGovernorExperiment(input:GovernorTickInputV03&{durationTicks:number;name:string}):RunSpecV02{
  const mode=(['Efficient','Masking','Combat'] as ShipModeV02[]).find(mode=>governorModeV02(mode)===input.requestedMode)!;
  return requireRunSpecV02({schemaVersion:'u2-lab/4',modelVersion:MODEL_V02,stateVersion:STATE_V2,governorVersion:GOVERNOR_VERSION,profileVersion:GOVERNOR_PROFILE_VERSION,tickHz:TICK_HZ,dtSeconds:TICK_SECONDS,name:input.name,durationTicks:input.durationTicks,qualification:{kind:'synthetic',runtimeAuthorization:false,sourceRef:'explicit qualification input'},profile:input.profile,initialState:{modelVersion:MODEL_V02,stateVersion:STATE_V2,phaseIndex:0,phaseElapsedTicks:0,governor:input.state},environment:input.environment,scenario:{name:input.name,repeat:false,phases:[{id:'qualification',durationTicks:input.durationTicks,mode,requests:input.requests,environment:null}]}});
}
