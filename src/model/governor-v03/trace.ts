import { immutableCopy, lexical } from "./conservation";
import type { GovernorAllocationTraceV03, GovernorTickTraceV03, StageIdV03 } from "./types";

export const GOVERNOR_STAGE_ORDER_V03: readonly StageIdV03[] = Object.freeze(["0", "1", "2", "3", "4", "5Q", "6", "7", "8", "9"]);

export class GovernorTraceBuilderV03 {
  readonly allocatorCalls: GovernorAllocationTraceV03[] = [];
  readonly executionOrder: string[] = [];
  electricalDispatchCount = 0;
  actualFailureChecks = 0;

  allocation(call: GovernorAllocationTraceV03): void {
    this.allocatorCalls.push(immutableCopy({
      ...call,
      allocations: [...call.allocations].sort((a, b) => lexical(a.bankId, b.bankId) || lexical(a.consumerId, b.consumerId)),
    }));
  }

  execution(step: string): void {
    this.executionOrder.push(step);
  }

  finish(tickIndex: number): GovernorTickTraceV03 {
    return immutableCopy({
      tickIndex,
      stages: GOVERNOR_STAGE_ORDER_V03,
      executionOrder: this.executionOrder,
      allocatorCalls: this.allocatorCalls,
      compatibilityChecks: this.allocatorCalls.reduce((sum, call) => sum + call.compatibilityChecks, 0),
      allocationVisits: this.allocatorCalls.reduce((sum, call) => sum + call.allocationVisits, 0),
      electricalDispatchCount: this.electricalDispatchCount,
      actualFailureChecks: this.actualFailureChecks,
    });
  }
}
