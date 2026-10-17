import type {
  ShipFit,
  CandidateCatalog,
  FitValidation,
} from "../fitting/types";
import { makeMissionRun, type WorkspaceConditions } from "../scenarios/mission";
import { isMissionModel } from "../model/v2/types";
import { makeMiningRun } from "../scenarios/fitting";
import { validateFit } from "../fitting/validate";
import type { RunResultV2 } from "../runner/run";
export class FittingSession {
  private fit: ShipFit;
  constructor(
    fit: ShipFit,
    public readonly catalog: CandidateCatalog,
  ) {
    this.fit = structuredClone(fit);
  }
  applyFit(fit: ShipFit): FitValidation {
    const validation = validateFit(fit, this.catalog);
    if (validation.valid)
      this.fit = {
        ...structuredClone(fit),
        fitRevision: this.fit.fitRevision + 1,
      };
    return validation;
  }
  prepareRun(conditions: WorkspaceConditions = {}) {
    return isMissionModel(conditions.modelVersion ?? "") ? makeMissionRun(this.fit, this.catalog, conditions) : makeMiningRun(this.fit, this.catalog, conditions);
  }
  getFit() {
    return structuredClone(this.fit);
  }
  a?: RunResultV2;
  freeze(result: RunResultV2) {
    this.a = structuredClone(result);
  }
}
