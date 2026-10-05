import type { ShipFit, CandidateCatalog } from "../fitting/types";
import type { RunSpecV2 } from "../model/v2/types";
import type { RunResultV2 } from "../runner/run";
import type { MiningConditions } from "../scenarios/fitting";
import { FittingSession } from "./fitting-session";
import { parseFitJson, parseExperimentJson } from "../io/fitting-json";
export type Variant = {
  id: string;
  name: string;
  fit: ShipFit;
  conditions: MiningConditions;
  result?: RunResultV2;
  replaySpec?: RunSpecV2;
};
export type ActiveTest = {
  runId: string;
  variantId: string;
  variantName: string;
  fitRevision: number;
  spec: RunSpecV2;
  status: "running" | "paused";
};
export class FittingWorkspace {
  private variants: Variant[];
  selectedId = "A";
  private active?: ActiveTest;
  private frozen?: RunResultV2;
  constructor(
    fit: ShipFit,
    readonly catalog: CandidateCatalog,
  ) {
    this.variants = ["A", "B", "C"].map((id) => ({
      id,
      name: id,
      fit: structuredClone(fit),
      conditions: {
        durationSeconds: 600,
        workSeconds: 120,
        effectiveBackgroundK: 100,
        duty: 1,
        densityKgM3: 1500,
        returnFraction: 0.35,
        targetM3: 1000,
      },
    }));
  }
  private selected() {
    return this.variants.find((v) => v.id === this.selectedId)!;
  }
  getSelected() {
    return structuredClone(this.selected());
  }
  getVariants() {
    return structuredClone(this.variants);
  }
  getFit() {
    return structuredClone(this.selected().fit);
  }
  getActive() {
    return this.active && structuredClone(this.active);
  }
  getFrozen() {
    return this.frozen && structuredClone(this.frozen);
  }
  snapshot() {
    return structuredClone({
      variants: this.variants,
      selectedId: this.selectedId,
      active: this.active,
      frozen: this.frozen,
    });
  }
  select(id: string) {
    if (this.variants.some((v) => v.id === id)) this.selectedId = id;
  }
  copyVariant() {
    const id = "V" + (this.variants.length + 1);
    this.variants.push({
      id,
      name: "Вариант " + (this.variants.length + 1),
      fit: this.getFit(),
      conditions: structuredClone(this.selected().conditions),
    });
    this.selectedId = id;
    return id;
  }
  applyFit(fit: ShipFit) {
    const s = new FittingSession(this.selected().fit, this.catalog);
    const v = s.applyFit(fit);
    if (v.valid) {
      this.selected().fit = s.getFit();
      this.selected().replaySpec = undefined;
    }
    return v;
  }
  setConditions(conditions: MiningConditions) {
    if (this.active) return false;
    this.selected().conditions = structuredClone(conditions);
    this.selected().replaySpec = undefined;
    return true;
  }
  isStale(v = this.selected()) {
    const prepared = this.prepare(v);
    return (
      !!v.result &&
      (JSON.stringify(v.result.spec.resolvedShip.fit) !==
        JSON.stringify(v.fit) ||
        !prepared.ok ||
        JSON.stringify(v.result.spec) !== JSON.stringify(prepared.value))
    );
  }
  prepare(v = this.selected()) {
    return v.replaySpec
      ? { ok: true as const, value: structuredClone(v.replaySpec) }
      : new FittingSession(v.fit, this.catalog).prepareRun(v.conditions);
  }
  start(runId: string) {
    if (this.active)
      return {
        ok: false as const,
        errors: [
          {
            path: "activeTest",
            message:
              "На странице уже выполняется тест " + this.active.variantName,
          },
        ],
      };
    const s = this.prepare();
    if (!s.ok) return s;
    this.active = {
      runId,
      variantId: this.selectedId,
      variantName: this.selected().name,
      fitRevision: s.value.resolvedShip.fit.fitRevision,
      spec: structuredClone(s.value),
      status: "running",
    };
    return { ok: true as const, value: this.getActive()! };
  }
  setStatus(runId: string, status: "running" | "paused") {
    if (this.active?.runId === runId) this.active.status = status;
  }
  acceptResult(r: RunResultV2) {
    if (r.runId !== this.active?.runId) return false;
    const owner = this.variants.find((v) => v.id === this.active!.variantId)!;
    owner.result = structuredClone(r);
    if (r.status === "complete" || r.status === "cancelled")
      this.active = undefined;
    return true;
  }
  showRun(r: RunResultV2) {
    this.selected().result = structuredClone(r);
  }
  abort() {
    this.active = undefined;
  }
  reset() {
    const id = this.active?.variantId ?? this.selectedId;
    this.active = undefined;
    this.variants.find((v) => v.id === id)!.result = undefined;
  }
  freeze() {
    const r = this.selected().result;
    if (!r || !["complete", "cancelled"].includes(r.status)) return false;
    this.frozen = structuredClone(r);
    return true;
  }
  importDocument(source: string, allowSnapshotReplay = false) {
    try {
      const o = JSON.parse(source);
      if (o.schemaVersion === "u2-ship-fit/1") {
        const p = parseFitJson(source, this.catalog);
        if (!p.ok) return p;
        const v = this.applyFit(p.value);
        return v.valid
          ? { ok: true as const, value: "fit" as const }
          : { ok: false as const, errors: v.issues };
      }
      const p = parseExperimentJson(source, { allowSnapshotReplay });
      if (!p.ok) return p;
      if (p.value.schemaVersion === "u2-lab/1")
        return { ok: true as const, value: "legacy" as const, spec: p.value };
      if (this.active)
        return {
          ok: false as const,
          errors: [
            {
              path: "activeTest",
              message:
                "Сначала завершите или отмените активный тест перед импортом численного снимка",
            },
          ],
        };
      this.selected().replaySpec = structuredClone(p.value);
      return { ok: true as const, value: "replay" as const };
    } catch {
      return {
        ok: false as const,
        errors: [
          {
            path: "$",
            message:
              "Не удалось прочитать JSON. Прошлая сборка и результат сохранены.",
          },
        ],
      };
    }
  }
}
