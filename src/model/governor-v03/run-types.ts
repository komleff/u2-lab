import type {GovernorProfileV03,GovernorEnvironmentV03,ModuleRequestV03,ShipModelStateV02,GovernorTickResultV03,MODEL_V02,STATE_V2,GOVERNOR_VERSION,GOVERNOR_PROFILE_VERSION,TICK_HZ,TICK_SECONDS} from './types';
export type ShipModeV02='Efficient'|'Masking'|'Combat';
export type GovernorPhaseV02={id:string;durationTicks:number;mode:ShipModeV02;requests:ModuleRequestV03[];environment:GovernorEnvironmentV03|null};
export type RunSpecV02={
  schemaVersion:'u2-lab/4';modelVersion:typeof MODEL_V02;stateVersion:typeof STATE_V2;
  governorVersion:typeof GOVERNOR_VERSION;profileVersion:typeof GOVERNOR_PROFILE_VERSION;
  tickHz:typeof TICK_HZ;dtSeconds:typeof TICK_SECONDS;name:string;durationTicks:number;
  qualification:{kind:'synthetic';runtimeAuthorization:false;sourceRef:string};
  profile:GovernorProfileV03;initialState:ShipModelStateV02;environment:GovernorEnvironmentV03;
  scenario:{name:string;repeat:boolean;phases:GovernorPhaseV02[]};
};
export type GovernorRunMetricsV02={ticks:number;usefulWorkJ:number;totalResidualJ:number;maximumTemperatureK:number;firstConstraint:string|null};
export type GovernorCheckpointV02={version:'ship-checkpoint/0.2';lastTelemetry:Record<string,number>;lastTick:GovernorTickResultV03|null;restartAuthorizationsSinceTick:string[]};
