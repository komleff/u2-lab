import { isKnownCatalogVersion } from "../fitting/editions";
import type { ValidationResult } from "../catalog/schema";
import type { RunResultV2 } from "../runner/run";
import { parseExperimentJson } from "./fitting-json";
import { initialMiningMetrics } from "../runner/mining-metrics";
import { allocateCargo } from "../fitting/cargo";
import { CAUSES, isMissionModel, MODEL_SIGNATURE_MISSION } from "../model/v2/types";
import { exactFields } from "../signatures/config";
import { restoreSignatureRuntime } from "../signatures/runtime";
import { DiagnosticObserver } from "../runner/diagnostics";
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const nonnegative = (v: unknown): v is number => finite(v) && v >= 0;
const integer = (v: unknown): v is number => nonnegative(v) && Number.isSafeInteger(v);
export function parseResultJson(text: string): ValidationResult<RunResultV2> {
  const errors: { path: string; code: string; message: string }[] = [];
  const bad = (path: string, message: string) => errors.push({ path, code: "RESULT", message });
  try {
    const r = JSON.parse(text);
    if (!object(r)) throw Error("Нужен объект результата");
    const parsed = parseExperimentJson(JSON.stringify(r.spec));
    if (!parsed.ok) return parsed as ValidationResult<RunResultV2>;
    if ((parsed.value.schemaVersion !== "u2-lab/2" && parsed.value.schemaVersion !== "u2-lab/3") || !isKnownCatalogVersion(parsed.value.catalogVersion)) {
      bad("spec", "Анализ результата поддерживает численную модель v2 и текущий каталог; Legacy открывается отдельно");
      return { ok: false, errors };
    }
    const spec = parsed.value, ship = spec.resolvedShip;
    if(spec.modelVersion===MODEL_SIGNATURE_MISSION)exactFields(r,["signatures","checkpoint","runId","spec","state","metrics","channels","buckets","events","retention","status"],"signature result");
    const ids = new Set(ship.instances.map(i => i.id));
    const mining = new Set(ship.instances.filter(i => i.item.family === "mining").map(i => i.id));
    if (typeof r.runId !== "string" || !r.runId.length) bad("runId", "Нужен ID измеренного опыта");
    if (!["complete", "paused", "cancelled"].includes(r.status)) bad("status", "Неизвестное состояние результата");
    if (!object(r.state) || !object(r.metrics) || !object(r.retention)) throw Error("Нужны state, metrics и retention результата");
    const state = r.state, m = r.metrics, meta = r.retention;
    const close = (a: number, b: number) => Math.abs(a - b) <= 1e-8 * Math.max(Number.MIN_VALUE, Math.abs(a), Math.abs(b));
    for (const key of ["timeSeconds", "chargeJ", "temperatureK", "cargo", "usefulWork", "currentMassKg", "cyclesCompleted"])
      if (!nonnegative(state[key])) bad("state." + key, "Нужно конечное неотрицательное число");
    if (state.schemaVersion !== spec.schemaVersion || typeof state.phaseKey !== "string") bad("state", "Нужны схема и фаза измеренного состояния");
    if (state.timeSeconds > spec.durationSeconds || (!isMissionModel(spec.modelVersion) && r.status === "complete" && !close(state.timeSeconds, spec.durationSeconds))) bad("state.timeSeconds", "Интервал не соответствует горизонту опыта");
    if (state.chargeJ > ship.batteryCapacityJ * (1 + 1e-8)) bad("state.chargeJ", "Заряд превышает ёмкость");
    const map = (v: any, path: string, allowed?: Set<string>, nullable = false) => {
      if (!object(v)) { bad(path, "Нужна карта значений"); return; }
      for (const [key, n] of Object.entries(v)) {
        if ((!nullable || n !== null) && !nonnegative(n)) bad(path + "." + key, "Нужно конечное неотрицательное число");
        if (allowed && !allowed.has(key)) bad(path + "." + key, "ID отсутствует в измеренном snapshot");
      }
    };
    map(state.fuelKg, "state.fuelKg", new Set(["diesel", "hydrogen"]));
    for (const sp of ["diesel", "hydrogen"] as const)
      if (!nonnegative(state.fuelKg?.[sp]) || state.fuelKg[sp] > ship.resources[sp].capacityKg * (1 + 1e-8)) bad("state.fuelKg." + sp, "Запас вне контура snapshot");
    map(state.buffersJ, "state.buffersJ", new Set(Object.keys(ship.bufferCapacityJ)));
    for (const [id, n] of Object.entries(state.buffersJ ?? {}))
      if ((n as number) > ship.bufferCapacityJ[id] * (1 + 1e-8)) bad("state.buffersJ." + id, "Запас превышает ёмкость буфера");
    map(state.cargoM3, "state.cargoM3");
    if (!allocateCargo(ship, state.cargoM3 ?? {}).ok || !close(Object.values(state.cargoM3 ?? {}).reduce((n: number, v: any) => n + v, 0), state.cargo)) bad("state.cargoM3", "Неверный типизированный груз или сумма");
    map(state.extractedByInstanceM3, "state.extractedByInstanceM3", mining);
    map(state.consumptionKg, "state.consumptionKg");
    if (!object(state.gates) || Object.values(state.gates).some(v => typeof v !== "boolean")) bad("state.gates", "Нужны реальные состояния защит");
    if (!Array.isArray(state.constraints) || state.constraints.some((v: any) => typeof v !== "string")) bad("state.constraints", "Нужен список сообщений ограничений");
    if (!object(state.limitations)) bad("state.limitations", "Нужны состояния ограничений экземпляров");
    else for (const id of ids) for (const c of CAUSES)
      if (typeof state.limitations[id]?.[c] !== "boolean") bad(`state.limitations.${id}.${c}`, "Нужно состояние причины экземпляра");
    if (state.miningStopSeconds !== null && !nonnegative(state.miningStopSeconds)) bad("state.miningStopSeconds", "Нужно измеренное время или null");
    // Форма метрик берётся у существующего owner; это проверка документа, без расчёта опыта.
    const metricShape = initialMiningMetrics(spec);
    const nullableFields = new Set(["kUseHorizon", "scuPerHour", "firstTargetSeconds", "recovery.firstSeconds", "recovery.meanSeconds", "recovery.pendingStopSeconds", "completedCycles.kUse"]);
    const shape = (v: any, template: any, path: string, key = "") => {
      if (typeof template === "number") {
        if (!finite(v) || (key !== "energyResidualJ" && v < 0)) bad(path, "Нужно конечное число метрики");
      } else if (template === null) {
        if (nullableFields.has(key) && v !== null && !nonnegative(v)) bad(path, "Нужно число или null");
      } else if (typeof template === "string" || typeof template === "boolean") {
        if (typeof v !== typeof template) bad(path, "Неверный тип метрики");
      } else if (object(template)) {
        if (!object(v)) { bad(path, "Нужна группа метрик"); return; }
        for (const [k, x] of Object.entries(template)) shape(v[k], x, path + "." + k, key ? key + "." + k : k);
      }
    };
    shape(m, metricShape, "metrics");
    for (const key of ["fuelSpeciesKg", "fuelPurposeKg", "causeSeconds"]) map(m[key], "metrics." + key);
    if (!integer(m.recovery?.count)) bad("metrics.recovery.count", "Нужен целый счётчик восстановлений");
    for (const sp of ["diesel", "hydrogen"]) if (m.fuelPerScu?.[sp] !== null && !nonnegative(m.fuelPerScu?.[sp])) bad("metrics.fuelPerScu." + sp, "Нужно число или null");
    if (m.lastCycle !== null) {
      if (!object(m.lastCycle) || !nonnegative(m.lastCycle.scu) || !nonnegative(m.lastCycle.durationSeconds) || (m.lastCycle.kUse !== null && !nonnegative(m.lastCycle.kUse))) bad("metrics.lastCycle", "Неверная метрика последнего цикла");
    }
    if (m.firstLimiter !== null) {
      if (!object(m.firstLimiter) || !nonnegative(m.firstLimiter.timeSeconds) || m.firstLimiter.timeSeconds > state.timeSeconds || !Array.isArray(m.firstLimiter.causes) || !m.firstLimiter.causes.length || m.firstLimiter.causes.some((c: any) => !CAUSES.includes(c))) bad("metrics.firstLimiter", "Неверные время или причины ограничителя");
    }
    if (!close(m.durationSeconds, state.timeSeconds) || !close(m.usefulWork, state.usefulWork)) bad("metrics", "Измерения не соответствуют состоянию своего интервала");
    for (const key of ["ticks", "cyclesCompleted"]) if (!integer(m[key])) bad("metrics." + key, "Нужен целый счётчик");
    if(isMissionModel(spec.modelVersion)){
      const ms=state.mission,mm=m.mission,cfg=spec.mission!;
      if(!object(ms)||!object(mm)||!object(ms.elapsed))throw Error("Нужны measured mission state/metrics");
      const stages=["outbound","approach","mining","inbound","service","done","stranded"];
      if(!stages.includes(ms.stage)||!["acceleration","coast","braking"].includes(ms.flightMode))bad("state.mission.stage","Неизвестный участок рейса");
      for(const k of ["stageStartedSeconds","tripStartedSeconds","outboundMassKg","peakVelocityMS","deliveredM3"])if(!nonnegative(ms[k]))bad("state.mission."+k,"Нужно конечное SI значение");
      for(const k of ["positionM","velocityMS"])if(!finite(ms[k]))bad("state.mission."+k,"Нужно конечное знаковое SI значение");
      if(ms.inboundMassKg!==null&&!nonnegative(ms.inboundMassKg))bad("state.mission.inboundMassKg","Нужна масса или null");
      if(ms.stageStartedSeconds>state.timeSeconds||ms.tripStartedSeconds>state.timeSeconds||Math.abs(ms.velocityMS)>=3000||ms.peakVelocityMS>=3000||ms.peakVelocityMS<Math.abs(ms.velocityMS))bad("state.mission","Неверные время/скорость рейса");
      for(const k of ["flight","approach","mining","service","recovery"])if(!nonnegative(ms.elapsed[k]))bad("state.mission.elapsed."+k,"Нужно измеренное время");
      if(!close(ms.elapsed.flight+ms.elapsed.approach+ms.elapsed.mining+ms.elapsed.service,state.timeSeconds)||ms.elapsed.recovery>ms.elapsed.mining+1e-8)bad("state.mission.elapsed","Времена фаз не согласованы с измеренным интервалом");
      if(!close(state.usefulWork,ms.deliveredM3+state.cargo))bad("state.mission.deliveredM3","Добыто должно равняться сдано + на борту");
      map(ms.receivedFuelKg,"state.mission.receivedFuelKg",new Set(["diesel","hydrogen"]));
      for(const [path,value] of [["state.mission.receivedChargeJ",ms.receivedChargeJ],["metrics.mission.receivedChargeJ",mm.receivedChargeJ]] as const)if(value!==undefined&&!nonnegative(value))bad(path,"Нужна конечная неотрицательная станционная энергия");
      if(cfg.stationReplenish!==undefined&&(ms.receivedChargeJ===undefined||mm.receivedChargeJ===undefined))bad("state.mission.receivedChargeJ","Новая политика требует явный учёт полученной энергии, включая ноль");
      if(!close(ms.receivedChargeJ??0,mm.receivedChargeJ??0)||cfg.stationReplenish!==true&&(ms.receivedChargeJ??0)!==0)bad("metrics.mission.receivedChargeJ","Полученная энергия должна соответствовать state и включённой зарядке станции");
      for(const sp of ["diesel","hydrogen"]){
        if(!nonnegative(ms.receivedFuelKg?.[sp])||!close(spec.initial.fuelKg[sp]+ms.receivedFuelKg[sp]-m.fuelSpeciesKg[sp],state.fuelKg[sp]))bad("state.mission.receivedFuelKg."+sp,"Нарушен initial + received − consumed = remaining");
        if(cfg.stationReplenish===false&&ms.receivedFuelKg?.[sp]>0)bad("state.mission.receivedFuelKg."+sp,"Выключенная заправка запрещает полученное станционное топливо");
        const expected=ms.deliveredM3>0?m.fuelSpeciesKg[sp]/ms.deliveredM3:null;
        if(expected===null?mm.fuelPerDeliveredScu?.[sp]!==null:!nonnegative(mm.fuelPerDeliveredScu?.[sp])||!close(mm.fuelPerDeliveredScu[sp],expected))bad("metrics.mission.fuelPerDeliveredScu."+sp,"Расход относится только к сданной руде");
      }
      for(const [k,expected] of Object.entries({deliveredM3:ms.deliveredM3,flightSeconds:ms.elapsed.flight,approachSeconds:ms.elapsed.approach,miningSeconds:ms.elapsed.mining,serviceSeconds:ms.elapsed.service,recoverySeconds:ms.elapsed.recovery,peakVelocityMS:ms.peakVelocityMS}))if(!nonnegative(mm[k])||!close(mm[k],expected as number))bad("metrics.mission."+k,"Метрика не соответствует измеренному состоянию");
      const rate=state.timeSeconds>0?ms.deliveredM3*3600/state.timeSeconds:null;
      if(rate===null?mm.deliveredScuPerHour!==null:!nonnegative(mm.deliveredScuPerHour)||!close(mm.deliveredScuPerHour,rate))bad("metrics.mission.deliveredScuPerHour","Неверная доставка на наблюдаемом интервале");
      const mass=ship.dryMassKg+state.fuelKg.diesel+state.fuelKg.hydrogen+state.cargo*spec.process.densityKgM3;
      if(!close(state.currentMassKg,mass))bad("state.currentMassKg","Масса рейса должна включать фактический груз и запасы");
      if(["approach","mining","service","done"].includes(ms.stage)&&(ms.velocityMS!==0||!close(ms.positionM,cfg.distanceM)))bad("state.mission","Местная операция возможна только после физического прибытия");
      if(ms.firstLimiter!==null){const l=ms.firstLimiter;if(!object(l)||!nonnegative(l.timeSeconds)||l.timeSeconds>state.timeSeconds||!stages.includes(l.phase)||!Array.isArray(l.instanceIds)||l.instanceIds.some((id:any)=>!ids.has(id))||!Array.isArray(l.causes)||!l.causes.length||l.causes.some((c:any)=>!CAUSES.includes(c))||typeof l.message!=="string")bad("state.mission.firstLimiter","Нужен реальный диагноз с ID и временем");}
      if(ms.terminalReason!==null&&typeof ms.terminalReason!=="string")bad("state.mission.terminalReason","Нужна причина завершения или null");
      if(ms.stage==="done"&&(state.cargo!==0||!integer(state.cyclesCompleted)||state.cyclesCompleted<1||!(ms.terminalReason==="delivered-target"&&ms.deliveredM3>=spec.scenario.targetM3-1e-8||ms.terminalReason==="single-voyage"&&!spec.scenario.repeat)))bad("state.mission","Неверное завершение до горизонта");
      if(ms.stage==="stranded"&&(!ms.terminalReason||ms.deliveredM3!==0&&state.cyclesCompleted===0))bad("state.mission","Нужна причина невозможного рейса");
      if(r.status==="complete"&&!close(state.timeSeconds,spec.durationSeconds)&&!["done","stranded"].includes(ms.stage))bad("state.mission.stage","Завершение раньше H требует терминального события миссии");
    }
    const aggregate = new Set("requestedW deliveredW activeRequestedW activeW protectedW backgroundRequestedW backgroundW generatorW solarW externalElectricW generatorHostW pathLossW batteryLossW propulsionHostW loadHostW solarHostW directHeatW exhaustW beamW returnHeatW externalBeamW engineUsefulW thrustN h2CoolingW h2AuxRejectW radiatorHostW tiCoolingW tiRejectW bufferAbsorbW bufferReleaseW radiationOutW radiationInW radiationNetW heatInW heatOutW workRate chemicalW energyResidualJ timeSeconds chargeJ soc temperatureK usefulWork cargo currentMassKg cargoM3 miningRateM3S".split(" "));
    if(isMissionModel(spec.modelVersion))for(const channel of ["positionM","velocityMS","deliveredM3"])aggregate.add(channel);
    for (const sp of ["diesel", "hydrogen"]) aggregate.add("fuelKg:" + sp);
    for (const i of ship.instances) {
      aggregate.add("installedMassKg:" + i.id);
      if (["h2","thermoinverter"].includes(i.item.family) || i.item.family === "radiator" && i.item.numerics.auxW > 0)
        for (const prefix of ["coolingAuxRequestedW:","coolingAuxW:","coolingW:"]) aggregate.add(prefix + i.id);
      if (i.item.family === "h2" || i.item.family === "radiator" && i.item.numerics.auxW > 0)
        for (const prefix of ["coolingRequested:","coolingOffFloor:","coolingOffDemand:","coolingClosed:"]) aggregate.add(prefix + i.id);
      if (i.item.family === "battery") aggregate.add("storedJ:" + i.id);
      else if (i.item.family === "tank") aggregate.add("fuelKg:" + i.id);
      else if (i.item.family === "buffer") aggregate.add("bufferJ:" + i.id);
      if (!["tank", "battery", "cargo"].includes(i.item.family)) for (const prefix of ["deliveredW:", "beamW:", "forceN:"]) aggregate.add(prefix + i.id);
    }
    if (!Array.isArray(r.channels) || r.channels.some((c: any) => typeof c !== "string" || !aggregate.has(c)) || new Set(r.channels).size !== r.channels.length) bad("channels", "Неизвестные или повторные каналы snapshot");
    const n = Array.isArray(r.channels) ? r.channels.length : 0;
    for (const key of ["totalTicks", "buckets", "maxBuckets", "estimatedBytes", "maxBytes", "totalEvents", "droppedEvents"]) if (!integer(meta[key])) bad("retention." + key, "Нужен конечный целый счётчик");
    if (typeof meta.policy !== "string" || !nonnegative(meta.originalCadenceSeconds) || !(meta.cadenceSeconds > 0) || !finite(meta.cadenceSeconds)) bad("retention", "Нужны policy и конечная cadence");
    if ((meta.maxBuckets < 2 || meta.maxBuckets > 50000) || meta.maxBytes > 128 * 1024 * 1024 || meta.estimatedBytes > meta.maxBytes || meta.buckets > meta.maxBuckets || meta.totalTicks !== m.ticks) bad("retention", "Нарушены пределы retention или счётчик ticks");
    if (!Array.isArray(r.buckets) || r.buckets.length > meta.buckets) throw Error("Неверное число сохранённых buckets");
    let previousEnd = -Infinity, count = 0;
    for (const [j, b] of r.buckets.entries()) {
      const path = "buckets." + j;
      if (!object(b) || !finite(b.startSeconds) || b.startSeconds < -meta.cadenceSeconds || !finite(b.endSeconds) || b.endSeconds < b.startSeconds || (b.endSeconds > state.timeSeconds && !close(b.endSeconds, state.timeSeconds)) || (b.startSeconds < previousEnd && !close(b.startSeconds, previousEnd)) || !integer(b.count) || !b.count) { bad(path, "Неверный интервал или count"); continue; }
      previousEnd = b.endSeconds; count += b.count;
      for (const key of ["sum", "min", "max"]) if (!Array.isArray(b[key]) || b[key].length !== n || b[key].some((v: any) => !finite(v))) bad(path + "." + key, "Нужен конечный массив размерности channels");
      if ([b.sum, b.min, b.max].every(v => Array.isArray(v) && v.length === n)) for (let i = 0; i < n; i++) {
        const mean = b.sum[i] / b.count, tolerance = 1e-8 * Math.max(Number.MIN_VALUE, Math.abs(mean), Math.abs(b.min[i]), Math.abs(b.max[i]));
        if (b.min[i] > b.max[i] || mean < b.min[i] - tolerance || mean > b.max[i] + tolerance) bad(path, "Mean/min/max несогласованы");
      }
    }
    if (count > meta.totalTicks || (meta.buckets === r.buckets.length && count !== meta.totalTicks)) bad("buckets", "Count не соответствует измеренным ticks");
    if (!Array.isArray(r.events) || r.events.length > 20000 || r.events.length > meta.totalEvents - meta.droppedEvents) bad("events", "Число событий не соответствует retention");
    else {
      let previous = 0;
      for (const [i, e] of r.events.entries()) {
        if (!object(e) || !nonnegative(e.timeSeconds) || (e.timeSeconds < previous && !close(e.timeSeconds, previous)) || (e.timeSeconds > state.timeSeconds && !close(e.timeSeconds, state.timeSeconds)) || typeof e.kind !== "string" || typeof e.message !== "string") bad("events." + i, "Неверные время, kind или сообщение события");
        previous = e?.timeSeconds;
      }
    }
    if(spec.modelVersion===MODEL_SIGNATURE_MISSION) {
      exactFields(state,["schemaVersion","timeSeconds","chargeJ","temperatureK","fuelKg","buffersJ","gates","cargo","cargoM3","currentMassKg","usefulWork","extractedByInstanceM3","consumptionKg","limitations","phaseKey","constraints","cyclesCompleted","miningStopSeconds","mission",...(Object.hasOwn(state,"sourceRecovery")?["sourceRecovery"]:[]),...(Object.hasOwn(state,"scenarioOffsetSeconds")?["scenarioOffsetSeconds"]:[])],"signature physical state");
      r.signatures=restoreSignatureRuntime(r.signatures,spec.signatures!,state.timeSeconds);
      exactFields(r.checkpoint,["diagnostics","lastTelemetry"],"run checkpoint");new DiagnosticObserver().restore(r.checkpoint.diagnostics);
      if(!object(r.checkpoint.lastTelemetry)||Object.values(r.checkpoint.lastTelemetry).some(v=>!finite(v)))throw new Error("Неверный checkpoint telemetry");
    }
    if (errors.length) return { ok: false, errors };
    r.spec = spec;
    r.buckets = r.buckets.map((b: any) => ({ ...b, sum: new Float64Array(b.sum), min: new Float64Array(b.min), max: new Float64Array(b.max) }));
    return { ok: true, value: r as RunResultV2 };
  } catch (e) {
    bad("$", e instanceof Error ? e.message : "Неполный документ результата");
    return { ok: false, errors };
  }
}
