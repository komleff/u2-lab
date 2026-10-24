import type { StoredRunSpec } from "../model/v2/types";
import { MODEL_SIGNATURE_MISSION } from "../model/v2/types";
import {createDispatchedRun as createRun,runDispatchedChunk as runChunk,dispatchedResult as result,restoreDispatchedRun,isGovernorContext,type DispatchRunContext as ExecutableRunContext} from './ship-model-dispatch';
import type {RunSpecV02} from '../model/governor-v03/run-types';
import type {RunResultV02} from './ship-model-run-v02';
import { parseStoredResultJson } from "../io/fitting-result";
import type {RunResultV2} from "./fitting-run";
import {controlModule} from '../model/v3/durability';
import type {RunContextV3} from './ship-model-run';
import type {RunResultV3} from './ship-model-run';
export type Control =
  | "start"
  | "pause"
  | "resume"
  | "step"
  | "cancel"
  | "restart"
  | "repair"
  | "snapshot";
export type WorkerCommand =
  | {
      runId: string;
      commandId: number;
      type: Control;
      payload?: { spec?: StoredRunSpec|RunSpecV02; maxSteps?: number; checkpoint?: RunResultV2|RunResultV3|RunResultV02; instanceId?:string; durabilityR?:number };
    }
  | { runId: string; type: "telemetry-ack"; chunkId: number };
export class WorkerController {
  private activeContext?: ExecutableRunContext;
  get context(){const run=this.activeContext;return run&&!isGovernorContext(run)?run:undefined;}
  get currentContext(){return this.activeContext;}
  private pending?: { runId: string; chunkId: number };
  private chunkId = 0;
  private running = false;
  private stepping = false;
  maxSteps = 2000;
  constructor(private send: (message: any) => void) {}
  get pendingChunks() {
    return this.pending ? 1 : 0;
  }
  handle(c: WorkerCommand) {
    if (c.type === "telemetry-ack") {
      if (this.pending?.runId === c.runId && this.pending.chunkId === c.chunkId)
        this.pending = undefined;
      return;
    }
    if (c.type === "start") {
      try {
        let next:ExecutableRunContext;
        if(c.payload?.checkpoint){
          const parsed=parseStoredResultJson(JSON.stringify(c.payload.checkpoint,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v),{allowGovernorV02:true});
          if(!parsed.ok)throw new Error(parsed.errors.map(e=>e.path+": "+e.message).join("\n"));
          next=restoreDispatchedRun(parsed.value);next.runId=c.runId;
        }else next=createRun(c.runId,c.payload!.spec!);
        this.activeContext = next;
        this.pending = undefined;
        this.chunkId = 0;
        this.running = true;
        this.stepping = false;
      } catch (e) {
        this.send({ runId: c.runId, type: "error", payload: String(e) });
        return;
      }
    }
    if (this.activeContext?.runId !== c.runId) return;
    if(c.type==='restart'||c.type==='repair'){
      try{if(this.activeContext.spec.schemaVersion!=='u2-lab/4')throw new Error('schemaVersion: module control требует /4');if(isGovernorContext(this.activeContext)){
        if(c.type==='repair')throw Error('Repair governor требует отдельный service contract G4');
        const id=c.payload?.instanceId;if(!this.activeContext.state.governor.moduleStateById.some(m=>m.id===id))throw Error('Неизвестный module ID');
        this.activeContext.state={...this.activeContext.state,governor:{...this.activeContext.state.governor,moduleStateById:this.activeContext.state.governor.moduleStateById.map(m=>m.id===id?{...m,restartAuthorized:true}:m)}};
        if(!this.activeContext.checkpoint.restartAuthorizationsSinceTick.includes(id!))this.activeContext.checkpoint.restartAuthorizationsSinceTick.push(id!);
      }else{const run=this.activeContext as RunContextV3;run.state=controlModule(run.spec.resolvedShip,run.state,c.payload?.instanceId??'',c.type,c.payload?.durabilityR);}}
      catch(error){this.send({runId:c.runId,type:'error',payload:String(error)});return;}
    }
    if (c.payload?.maxSteps)
      this.maxSteps = Math.min(20000, Math.max(1, c.payload.maxSteps));
    if (c.type === "pause" || c.type === "cancel") {
      this.running = false;
      this.stepping = false;
    }
    if (c.type === "resume") this.running = !this.activeContext.done;
    if (c.type === "step") {
      this.running = false;
      this.stepping = true;
    }
    this.send({
      runId: c.runId,
      type: "control-ack",
      commandId: c.commandId,
      control: c.type,
    });
    if (c.type === "snapshot" || c.type === "cancel")
      this.send({
        runId: c.runId,
        type: "snapshot",
        payload: result(
          this.activeContext,
          c.type === "cancel" ? "cancelled" : undefined,
        ),
      });
  }
  pump() {
    if (
      !this.activeContext ||
      this.pending ||
      (!this.running && !this.stepping) ||
      this.activeContext.done
    )
      return;
    const run = this.activeContext;
    let chunk: ReturnType<typeof runChunk>;
    try {
      chunk = runChunk(run, this.stepping ? 1 : this.maxSteps, 80);
    } catch (error) {
      if (run.spec.modelVersion !== MODEL_SIGNATURE_MISSION&&run.spec.schemaVersion!=='u2-lab/4') throw error;
      this.running = false;
      this.stepping = false;
      this.send({ runId: run.runId, type: "error", payload: String(error) });
      return;
    }
    this.stepping = false;
    const id = ++this.chunkId;
    this.pending = { runId: run.runId, chunkId: id };
    this.send({
      runId: run.runId,
      type: "chunk",
      chunkId: id,
      payload: run.spec.schemaVersion==='u2-lab/4'?{...result(run),telemetry:isGovernorContext(run)?run.checkpoint.lastTelemetry:(run as RunContextV3).last}:"signatures" in run && run.signatures ? result(run) : {
        ...chunk,
        metrics: run.metrics,
        buckets: run.retention.buckets.slice(-250),
        channels: run.retention.channels,
        events: run.events.items().slice(-100),
        retention: {
          ...run.retention.metadata(),
          droppedEvents: run.events.dropped,
          totalEvents: run.events.total,
        },
      },
    });
    if (run.done) {
      this.running = false;
      this.send({ runId: run.runId, type: "complete", payload: result(run) });
    }
  }
}
