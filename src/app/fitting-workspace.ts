import type { ShipFit, CandidateCatalog } from "../fitting/types";
import type { RunSpecV2 } from "../model/v2/types";
import type { RunResultV2 } from "../runner/run";
import { freshMissionConditions, validMissionConditions, type WorkspaceConditions } from "../scenarios/mission";
import { MODEL_MISSION } from "../model/v2/types";
import { FittingSession } from "./fitting-session";
import { parseFitJson, parseExperimentJson } from "../io/fitting-json";
import { parseResultJson } from "../io/fitting-result";
import { makeMiningRun } from "../scenarios/fitting";
import { validateFit } from "../fitting/validate";
import { getPresetFit } from "../fitting/catalog";
import { fitItem, fitHull, isKnownCatalogVersion } from "../fitting/editions";
import { conditionsFromSpec } from "./fitting-ui/conditions";
export type Variant = {
  id: string;
  name: string;
  fit: ShipFit;
  conditions: WorkspaceConditions;
  result?: RunResultV2;
  replaySpec?: RunSpecV2;
  opened?: "fit" | "run" | "result";
  cruiseMultiplier?: number | null;
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
  private baselineId?: string;
  constructor(
    fit: ShipFit,
    readonly catalog: CandidateCatalog,
    initialConditions?: WorkspaceConditions,
    initialCruiseMultiplier?: number|null,
  ) {
    this.variants = ["A", "B", "C"].map((id) => ({
      id,
      name: id,
      cruiseMultiplier: initialCruiseMultiplier,
      fit: structuredClone(fit),
      conditions: initialConditions ? structuredClone(initialConditions) : {
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
  getCurrentResult() {
    const r = this.active
      ? this.variants.find((v) => v.id === this.active!.variantId)?.result
      : this.selected().result;
    return r && (!this.active || r.runId === this.active.runId)
      ? structuredClone(r)
      : undefined;
  }
  isPreviousResult(v = this.selected()) {
    return !!(v.result && this.active?.variantId === v.id &&
      v.result.runId !== this.active.runId);
  }
  getFrozen() {
    return this.frozen && structuredClone(this.frozen);
  }
  getComparisonBase() {
    return this.baselineId === "reference" ? this.getFrozen()
      : structuredClone(this.variants.find(v => v.id === this.baselineId)?.result);
  }
  setComparisonBase(id: string) {
    if ((id === "reference" && this.frozen) || this.variants.some(v => v.id === id && v.result)) this.baselineId = id;
  }
  getComparisonBaseId() { return this.baselineId; }
  snapshot() {
    return structuredClone({
      variants: this.variants,
      selectedId: this.selectedId,
      active: this.active,
      frozen: this.frozen,
      baselineId: this.baselineId,
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
      cruiseMultiplier: this.selected().cruiseMultiplier,
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
  applyPreset(id:string) {
    const mode=this.selected().cruiseMultiplier;
    const validation=this.applyFit(getPresetFit(id,this.catalog.version));
    if(validation.valid) {
      const conditions={...this.selected().conditions,selectedWorkGroup:undefined};
      if(conditions.modelVersion===MODEL_MISSION && mode!==undefined) {
        const defaults=freshMissionConditions(this.selected().fit,this.catalog);
        conditions.referenceVfaMS=defaults.referenceVfaMS;
        conditions.cruiseSpeedMS=mode===null?null:mode*defaults.referenceVfaMS!;
      }
      // Замена сборки не является правкой checkbox: imported fuel-only undefined сохраняется.
      this.selected().conditions=structuredClone(conditions);
    }
    return validation;
  }
  setCruiseMultiplier(multiplier:number|null) {
    const conditions=this.selected().conditions;
    const valid=this.setConditions({...conditions,cruiseSpeedMS:multiplier===null?null:multiplier*(conditions.referenceVfaMS??500)});
    if(valid)this.selected().cruiseMultiplier=multiplier;
    return valid;
  }
  setConditions(conditions: WorkspaceConditions) {
    const multiplier=this.selected().cruiseMultiplier;
    if(multiplier!==undefined && conditions.referenceVfaMS!==this.selected().conditions.referenceVfaMS) conditions={...conditions,cruiseSpeedMS:multiplier===null?null:multiplier*(conditions.referenceVfaMS??500)};
    const fit = this.selected().fit;
    const validation = validateFit(fit, this.catalog);
    if (!validation.valid || !isKnownCatalogVersion(fit.catalogVersion)) return false;
    let validationFit = fit;
    if (!validation.readiness.canRun) {
      // Опора проверяет только условия. Реальные payload ID и изделия сохраняют смысл группы;
      // её готовность никогда не переносится на неполный пользовательский черновик.
      validationFit = getPresetFit(fit.hullId + ":1", fit.catalogVersion);
      const hull = fitHull(fit, this.catalog)!;
      const reserved = new Set([...Object.keys(fit.instances), ...hull.builtins.map(b => b.id)]);
      const unique = (base: string) => {
        let id = base;
        while (reserved.has(id) || validationFit.localVariants[id]) id += ":";
        reserved.add(id); return id;
      };
      for (const [slot, id] of Object.entries(validationFit.assignments)) {
        const instance = validationFit.instances[id];
        delete validationFit.instances[id]; delete validationFit.assignments[slot];
        if (hull.slots.find(s => s.id === slot)!.category !== "payload") {
          const renamed = unique("conditions:" + slot);
          validationFit.assignments[slot] = renamed;
          validationFit.instances[renamed] = { ...instance, id: renamed };
        }
      }
      for (const slot of hull.slots.filter(s => s.category === "payload")) {
        const id = fit.assignments[slot.id];
        if (!id) continue;
        const instance = fit.instances[id], item = fitItem(fit, this.catalog, instance.itemId)!;
        const itemId = unique("conditions:item:" + slot.id);
        validationFit.localVariants[itemId] = { ...structuredClone(item), id: itemId };
        validationFit.assignments[slot.id] = id;
        validationFit.instances[id] = { ...instance, itemId };
      }
      validationFit.builtinModes = structuredClone(fit.builtinModes);
    }
    const mission = conditions.modelVersion === MODEL_MISSION;
    if (mission && !validMissionConditions(conditions)) return false;
    if (mission) conditions = { ...conditions, stationReplenish: conditions.stationReplenish === undefined ? false : conditions.stationReplenish };
    const checked = makeMiningRun(validationFit, this.catalog, mission ? {...conditions,workSeconds:1,approachSeconds:1,brakingSeconds:1,serviceSeconds:1,idleSeconds:1} : conditions);
    if (!checked.ok) return false;
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
    this.baselineId ??= owner.id;
    if (r.status === "complete" || r.status === "cancelled")
      this.active = undefined;
    return true;
  }
  showRun(r: RunResultV2) {
    this.selected().result = structuredClone(r);
    this.baselineId ??= this.selectedId;
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
    const r = this.getCurrentResult();
    if (!r || (this.active && this.active.status !== "paused")) return false;
    this.frozen = structuredClone(r);
    this.baselineId = "reference";
    return true;
  }
  importDocument(source: string, allowSnapshotReplay = false) {
    try {
      const o = JSON.parse(source);
      if (o.schemaVersion === "u2-ship-fit/1") {
        const p = parseFitJson(source, this.catalog);
        if (!p.ok) return p;
        const v = this.applyFit(p.value);
        if(v.valid)this.selected().cruiseMultiplier=undefined;
        if (v.valid) this.selected().opened = "fit";
        return v.valid
          ? { ok: true as const, value: "fit" as const }
          : { ok: false as const, errors: v.issues };
      }
      // Документ результата нельзя принять как один spec и назвать восстановленными измерениями.
      if (o.spec && ("state" in o || "metrics" in o || "channels" in o || "buckets" in o || "runId" in o)) {
        const p = parseResultJson(source);
        if (!p.ok) return p;
        if (this.active) return { ok: false as const, errors: [{ path: "activeTest", message: "Завершите или отмените активный опыт перед открытием результата" }] };
        const fit = parseFitJson(JSON.stringify(p.value.spec.resolvedShip.fit), this.catalog);
        if (!fit.ok) return fit;
        this.selected().fit = structuredClone(fit.value);
        this.selected().conditions = conditionsFromSpec(p.value.spec);
        this.selected().cruiseMultiplier=undefined;
        this.selected().replaySpec = structuredClone(p.value.spec);
        this.selected().opened = "result";
        this.showRun(p.value);
        return { ok: true as const, value: "result" as const };
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
      const fit = parseFitJson(JSON.stringify(p.value.resolvedShip.fit), this.catalog);
      if (fit.ok) this.selected().fit = structuredClone(fit.value);
      this.selected().conditions = conditionsFromSpec(p.value);
      this.selected().cruiseMultiplier=undefined;
      this.selected().opened = "run";
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
