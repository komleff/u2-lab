import type { StoredRunSpec } from "../model/v2/types";
import { MODEL_SIGNATURE_MISSION } from "../model/v2/types";
import { createRun, runChunk, result, type ExecutableRunContext } from "./run";
import type {runShipModelChunk} from './ship-model-run';
import { parseResultJson } from "../io/fitting-result";
import { restoreFittingRun, type RunResultV2 } from "./fitting-run";
export type Control =
  | "start"
  | "pause"
  | "resume"
  | "step"
  | "cancel"
  | "snapshot";
export type WorkerCommand =
  | {
      runId: string;
      commandId: number;
      type: Control;
      payload?: { spec?: StoredRunSpec; maxSteps?: number; checkpoint?: RunResultV2 };
    }
  | { runId: string; type: "telemetry-ack"; chunkId: number };
export class WorkerController {
  context?: ExecutableRunContext;
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
          const parsed=parseResultJson(JSON.stringify(c.payload.checkpoint,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));
          if(!parsed.ok)throw new Error(parsed.errors.map(e=>e.path+": "+e.message).join("\n"));
          next=restoreFittingRun(parsed.value);next.runId=c.runId;
        }else next=createRun(c.runId,c.payload!.spec!);
        this.context = next;
        this.pending = undefined;
        this.chunkId = 0;
        this.running = true;
        this.stepping = false;
      } catch (e) {
        this.send({ runId: c.runId, type: "error", payload: String(e) });
        return;
      }
    }
    if (this.context?.runId !== c.runId) return;
    if (c.payload?.maxSteps)
      this.maxSteps = Math.min(20000, Math.max(1, c.payload.maxSteps));
    if (c.type === "pause" || c.type === "cancel") {
      this.running = false;
      this.stepping = false;
    }
    if (c.type === "resume") this.running = !this.context.done;
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
          this.context,
          c.type === "cancel" ? "cancelled" : undefined,
        ),
      });
  }
  pump() {
    if (
      !this.context ||
      this.pending ||
      (!this.running && !this.stepping) ||
      this.context.done
    )
      return;
    const run = this.context;
    let chunk: ReturnType<typeof runChunk>|ReturnType<typeof runShipModelChunk>;
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
      payload: "signatures" in run && run.signatures ? result(run) : {
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
