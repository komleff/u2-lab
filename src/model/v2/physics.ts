import type {
  ShipConfig,
  ModelState,
  EnvironmentSample,
  StepResult,
  TickTelemetry,
  Module,
} from "../types";
import { capacity } from "../types";
import { updateThermalGates } from "../thermal-gates";
import { backgroundFraction, thermalDuty } from "../scheduler";
import type { SignatureSettings } from "../../signatures/config";
import { engineIr, electricMotorLosses, generatorIr, hydrogenCoolerIr, type EngineIrKind } from "../../signatures/sources";
import { emComponent, type ActualElectricalStage } from "../../signatures/em-cs";
import type { IrProjectionInput, IrAngularProfile } from "../../signatures/projection";
import { gasSpecificEnergy, rkMean, type SignatureFrame, type SignatureExportTap } from "../../signatures/physics";
export const SIGMA = 5.670374419e-8;
export type ActionRequest = { moduleId: string; duty: number };
const eps = 1e-10;
import type { Cause, MiningStepSummary } from "./types";
export type PhysicsModule = Module & {
  output?: "mining" | "drive";
  requestKey?: string;
  signature?: { size: "S" | "M"; kind: EngineIrKind; motorEfficiency: number; profile: IrAngularProfile };
};
export type PhysicsShip = Omit<ShipConfig, "modules"> & {
  modules: PhysicsModule[];
  returnFraction: number;
  cargoLimitM3: number;
  targetLimitM3: number;
  signatures?: SignatureSettings;
};
export function stepPhysicsV2(
  ship: PhysicsShip,
  input: ModelState & { miningStopSeconds: number | null },
  env: EnvironmentSample,
  requests: readonly ActionRequest[],
  dt: number,
) {
  if (!(dt > 0 && Number.isFinite(dt)))
    throw new Error("dtSeconds must be finite >0");
  const state = {
    ...input,
    fuelKg: { ...input.fuelKg },
    buffersJ: { ...input.buffersJ },
    gates: { ...input.gates },
    constraints: [] as string[],
  };
  const events = updateThermalGates(ship, state);
  const total: TickTelemetry = {};
  const signatureFrames: SignatureFrame[] | undefined = ship.signatures ? [] : undefined;
  const consumptionKg: Record<string, number> = {};
  const extractedByInstanceM3: Record<string, number> = {};
  const mining: MiningStepSummary = {
    requested: false,
    requestedM3: 0,
    selectedM3: 0,
    causeSeconds: { power: 0, thermal: 0, resource: 0, cargo: 0 },
    unionSeconds: 0,
    overlapSeconds: 0,
    forcedDowntimeSeconds: 0,
    partialLossM3: 0,
    firstLoss: null,
    firstPositiveSeconds: null,
    firstCauseSeconds: {
      power: null,
      thermal: null,
      resource: null,
      cargo: null,
    },
    propulsionShortfall: false,
    recoveryDelta: {
      firstSeconds: null,
      count: 0,
      sumSeconds: 0,
      maxSeconds: 0,
    },
  };
  const qmax = capacity(ship);
  let coolantConsumedKg = 0;
  // Пик принадлежит физическим границам подшагов; усреднять его по dt нельзя.
  let maxTemperatureK = input.temperatureK;
  let left = dt,
    iteration = 0;
  const targetTimeS=input.timeSeconds+dt;
  const add = (k: string, v: number, h: number) =>
    (total[k] = (total[k] ?? 0) + v * h);
  const allowed = (m: Module) => thermalDuty(ship, state, m.id);
  // eps запасов не является разрешением отбросить часть физического времени.
  while (ship.signatures ? state.timeSeconds < targetTimeS : left > 0) {
    if(ship.signatures)left=targetTimeS-state.timeSeconds;
    if (++iteration > 10000) throw new Error("Unresolved event boundary");
    const live = ship.modules.filter(
      (m) =>
        m.enabled &&
        (!state.gates[m.id] || (m.kind === "radiator" && m.auxW === 0)),
    );
    const req = new Map(requests.map((r) => [r.moduleId, r.duty]));
    const targetReached = state.usefulWork >= ship.targetLimitM3 - 1e-9;
    const cargoFull = state.cargo >= ship.cargoLimitM3 - 1e-9;
    const rawLoads = ship.modules
      .filter((m) => m.enabled && m.kind === "load")
      .map((m) => ({
        m,
        p: m.powerW * (req.get(m.id) ?? (m.policy === "Background" ? 1 : 0)),
      }));
    const rawActive = rawLoads
      .filter((x) => x.m.policy !== "Background")
      .reduce((n, x) => n + x.p, 0);
    const rawBackground = rawLoads
      .filter((x) => x.m.policy === "Background")
      .reduce((n, x) => n + x.p, 0);
    const requestedLoads = live
      .filter((m) => m.kind === "load")
      .map((m) => ({
        m,
        p:
          m.powerW *
          (req.get(m.id) ?? (m.policy === "Background" ? 1 : 0)) *
          allowed(m) *
          ((m as PhysicsModule).output === "mining" &&
          (cargoFull || targetReached)
            ? 0
            : 1),
      }));
    const activeRequest = requestedLoads
        .filter((x) => x.m.policy !== "Background")
        .reduce((s, x) => s + x.p, 0),
      bgRequest = requestedLoads
        .filter((x) => x.m.policy === "Background")
        .reduce((s, x) => s + x.p, 0);
    const tankLive = (m: Module) =>
      !!m.tankId &&
      (state.fuelKg[m.tankId] ?? 0) > eps &&
      !state.gates[`tank:${m.tankId}`];
    const external = env.energyInputs
      .filter((x) => x.representation === "electric")
      .reduce((n, x) => n + x.powerW, 0);
    // Минимальная рабочая верхняя граница действующих операций, в том числе
    // остановленных защитой. Floor принадлежит только H₂, не всему корпусу.
    const coolingTarget = Math.max(300, Math.min(Infinity,
      ...ship.modules.filter(m => m.enabled && (m.kind !== "radiator" || m.auxW > 0)
        && m.kind !== "buffer").map(m => state.gates[m.id] ? m.gate.restartHigh : m.gate.workHigh),
      ...ship.tanks.filter(t => t.gate && ship.modules.some(m => m.enabled && m.tankId === t.id))
        .map(t => state.gates["tank:" + t.id] ? t.gate!.restartHigh : t.gate!.workHigh)));
    if (state.chargeJ <= 0.9 * qmax) state.sourceRecovery = true;
    if (state.chargeJ >= qmax - eps) state.sourceRecovery = false;
    const evaluate = (coolingDuty: number) => {
      const signature = ship.signatures ? { stages: [] as ActualElectricalStage[], components: [] as IrProjectionInput[],
        exports: [] as SignatureExportTap[], coolerInputs: [] as { id: string; flowKgS: number; auxW: number }[], hostIrDebitW: 0 } : undefined;
      const flows: Record<string, number> = {}, consumerFlows: Record<string, number> = {};
      let chemical = 0,
        genHeat = 0,
        exhaust = 0,
        pathLoss = 0,
        engineHeat = 0,
        thrust = 0,
        engineUseful = 0,
        solarHeat = 0,
        solar = 0;
      const fuelFlow = (m: Module, flow: number) => {
        flows[m.tankId!] = (flows[m.tankId!] ?? 0) + flow;
        consumerFlows[
          m.species +
            ":" +
            (m.kind === "h2"
              ? "cooler"
              : m.kind === "engine"
                ? "propulsion"
                : "generator") +
            ":" +
            m.id
        ] =
          (consumerFlows[
            m.species +
              ":" +
              (m.kind === "h2"
                ? "cooler"
                : m.kind === "engine"
                  ? "propulsion"
                  : "generator") +
              ":" +
              m.id
          ] ?? 0) + flow;
      };
      const coolers = live.filter((m) =>
        ["h2", "thermoinverter", "radiator"].includes(m.kind),
      );
      const coolingRequests = coolers.map((m) => {
        let q = 0,
          work = m.auxW;
        let flow = 0;
        if (m.kind === "h2") {
          if (ship.signatures) {
            flow = tankLive(m) ? ((m as PhysicsModule).signature!.size === "M" ? 7.5 : 1.875) * allowed(m) * coolingDuty : 0;
            work = flow > 0 ? m.auxW * allowed(m) * coolingDuty : 0;
            q = flow * gasSpecificEnergy(state.temperatureK) - work;
          } else {
            q = tankLive(m) ? m.coolingW * allowed(m) * coolingDuty : 0;
            work = q > 0 ? m.auxW * allowed(m) * coolingDuty : 0;
          }
        }
        if (m.kind === "thermoinverter" && m.hotK > state.temperatureK) {
          const cop =
            (m.copEfficiency * state.temperatureK) /
            (m.hotK - state.temperatureK);
          const rejection =
            m.areaM2 *
            SIGMA *
            Math.max(0, m.hotK ** 4 - env.effectiveBackgroundK ** 4);
          q = Math.min(m.coolingW, rejection / (1 + 1 / cop)) * allowed(m);
          work = q / cop;
        }
        const deployed = m.kind !== "radiator" || m.auxW === 0 ||
          state.temperatureK > env.effectiveBackgroundK + eps;
        if (m.kind === "radiator") work = deployed ? m.auxW * allowed(m) : 0;
        return { m, q, work, deployed, flow };
      });
      const coolingRequest = coolingRequests.reduce((s, x) => s + x.work, 0);
      const demand = ship.hullPowerW + activeRequest + coolingRequest;
      for (const m of live.filter((m) => m.kind === "solar")) {
        const absorbed = m.areaM2 * env.solarFluxWm2;
        solar += absorbed * m.efficiency;
        solarHeat += absorbed * (1 - m.efficiency);
      }
      const generators = live.filter(
        (m) => m.kind === "generator" && tankLive(m),
      );
      const genCap = generators.reduce(
        (s, m) => s + m.powerW * m.pathEfficiency * allowed(m),
        0,
      );
      const fraction = backgroundFraction(ship, state);
      const recharge =
        state.sourceRecovery && state.chargeJ < qmax - eps ? genCap : 0;
      let genBus = Math.min(
        genCap,
        Math.max(
          0,
          (demand + (recharge ? 0 : bgRequest * fraction)) /
            ship.dischargeEfficiency /
            ship.chargeEfficiency +
            recharge -
            solar -
            external,
        ),
      );
      if (state.chargeJ >= qmax - eps)
        genBus = Math.min(
          genBus,
          Math.max(
            0,
            (demand + bgRequest * fraction) /
              ship.dischargeEfficiency /
              ship.chargeEfficiency -
              solar -
              external,
          ),
        );
      const sourceBus = genBus + solar + external;
      const available =
        state.chargeJ > eps
          ? Infinity
          : sourceBus * ship.chargeEfficiency * ship.dischargeEfficiency;
      const hull = Math.min(ship.hullPowerW, available);
      const activeRatio = Math.min(
        1,
        Math.max(0, (available - hull) / (activeRequest + coolingRequest || 1)),
      );
      const active = activeRequest * activeRatio;
      const coolingBus = coolingRequest * activeRatio;
      const bg = Math.min(
        bgRequest * fraction,
        Math.max(
          0,
          sourceBus * ship.chargeEfficiency * ship.dischargeEfficiency -
            hull -
            active -
            coolingBus -
            recharge * ship.chargeEfficiency * ship.dischargeEfficiency,
        ),
      );
      const delivered = hull + active + coolingBus + bg;
      const withdraw = delivered / ship.dischargeEfficiency;
      // Общий аккумулятор: вход источников и фактический выход всех нагрузок, потери видимы.
      const storedIn = Math.min(
        sourceBus * ship.chargeEfficiency,
        state.chargeJ >= qmax - eps ? withdraw : Infinity,
      );
      const curtailed = sourceBus - storedIn / ship.chargeEfficiency;
      if (signature) signature.stages.push({ id: "battery:charge",kind:"battery_charge",actualW:storedIn/ship.chargeEfficiency },
        { id:"battery:discharge",kind:"battery_discharge",actualW:withdraw }, { id:"protected:hull",kind:"protected_processing",actualW:hull });
      const chargeLoss = storedIn * (1 / ship.chargeEfficiency - 1),
        dischargeLoss = withdraw - delivered;
      let batteryRate = storedIn - withdraw;
      for (const m of generators) {
        const electric =
          genCap > 0
            ? (genBus * ((m.powerW * m.pathEfficiency * allowed(m)) / genCap)) /
              m.pathEfficiency
            : 0;
        const fuel = electric / m.efficiency;
        const tank = ship.tanks.find((t) => t.id === m.tankId)!;
        fuelFlow(m, fuel / tank.energyJKg);
        chemical += fuel;
        const waste = fuel - electric;
        genHeat += waste * (1 - m.exportFraction);
        exhaust += waste * m.exportFraction;
        pathLoss += electric * (1 - m.pathEfficiency);
        if (signature) {
          signature.stages.push({id:"generator:"+m.id,kind:"generator_output",actualW:electric});
          const absoluteIrW = generatorIr(m.species === "hydrogen" ? "hydrogen" : "diesel", waste * m.exportFraction);
          signature.components.push({id:"generator:"+m.id,profile:"aft",absoluteIrW,contrastW:absoluteIrW});
          signature.exports.push({id:"generator:"+m.id,kind:m.species==="hydrogen"?"generator-hydrogen":"generator-diesel",powerW:waste*m.exportFraction,absoluteIrW,hostHeatDebitW:0});
        }
      }
      for (const m of live.filter((m) => m.kind === "engine" && tankLive(m))) {
        const f = m.forceN * (req.get(m.id) ?? 0) * allowed(m),
          flow = f * m.alpha,
          tank = ship.tanks.find((t) => t.id === m.tankId)!;
        fuelFlow(m, flow);
        const power = flow * tank.energyJKg;
        chemical += power;
        engineUseful += power * m.efficiency;
        engineHeat += power * (1 - m.efficiency) * m.hostFraction;
        exhaust += power * (1 - m.efficiency) * (1 - m.hostFraction);
        if (signature) {
          const own = engineIr({kind:(m as PhysicsModule).signature!.kind,enabled:true,actualSourceW:power*(1-m.efficiency)*(1-m.hostFraction)});
          signature.components.push({id:"engine:"+m.id,profile:(m as PhysicsModule).signature!.profile,absoluteIrW:own.absoluteIrW,contrastW:own.absoluteIrW});
          signature.exports.push({id:"engine:"+m.id,kind:((m as PhysicsModule).signature!.kind==="hydrogen"?"engine-hydrogen":"engine-diesel"),powerW:own.basisW,absoluteIrW:own.absoluteIrW,hostHeatDebitW:0});
        }
        thrust += f;
      }
      let propulsionShortfall = false;
      let loadHeat = 0,
        beam = 0,
        workRate = 0,
        returnHeat = 0,
        electricUseful = 0;
      const instanceActual: Record<string, number> = {},
        instanceBeam: Record<string, number> = {},
        instanceForce: Record<string, number> = {},
        instanceWork: Record<string, number> = {};
      for (const { m, p } of requestedLoads) {
        const actual =
          p *
          (m.policy === "Background"
            ? bgRequest
              ? bg / bgRequest
              : 0
            : activeRatio);
        instanceActual[m.id] = actual;
        if (signature) {
          signature.stages.push({id:"consumer:"+m.id,kind:"consumer_input",actualW:actual});
          if ((m as PhysicsModule).output === "drive") {
            const losses = electricMotorLosses({actualBusW:actual,pathEfficiency:m.pathEfficiency,motorEfficiency:(m as PhysicsModule).signature!.motorEfficiency});
            const ownWaste = losses.motorWasteW;
            const own = engineIr({kind:"electric",enabled:true,actualSourceW:ownWaste});
            signature.hostIrDebitW += own.hostHeatDebitW;
            signature.components.push({id:"engine:"+m.id,profile:(m as PhysicsModule).signature!.profile,absoluteIrW:own.absoluteIrW,contrastW:own.absoluteIrW});
            signature.exports.push({id:"engine:"+m.id,kind:"engine-electric",powerW:own.basisW,absoluteIrW:own.absoluteIrW,hostHeatDebitW:own.hostHeatDebitW,pathLossW:losses.pathLossW,motorInputW:losses.motorInputW});
          }
        }
        loadHeat += actual * (1 - m.efficiency);
        if ((m as PhysicsModule).output === "mining") {
          const emitted = actual * m.efficiency;
          instanceBeam[m.id] = emitted;
          beam += emitted;
          const work = emitted * m.workPerJ;
          instanceWork[m.id] = work;
          workRate += work;
          returnHeat += emitted * ship.returnFraction;
        } else if ((m as PhysicsModule).output === "drive") {
          const useful = actual * m.efficiency;
          electricUseful += useful;
          const force = m.powerW > 0 ? (m.forceN * actual) / m.powerW : 0;
          instanceForce[m.id] = force;
          thrust += force;
          if (force < m.forceN * (req.get(m.id) ?? 0) - 1e-6)
            propulsionShortfall = true;
        }
      }
      for (const m of ship.modules.filter((m) => m.kind === "engine")) {
        const force =
          live.includes(m) && tankLive(m)
            ? m.forceN * (req.get(m.id) ?? 0) * allowed(m)
            : 0;
        instanceForce[m.id] = force;
        if (force < m.forceN * (req.get(m.id) ?? 0) - 1e-6)
          propulsionShortfall = true;
      }
      let coolantFlowKgS = 0;
      let h2 = 0,
        ti = 0,
        tiReject = 0,
        h2AuxHeat = 0,
        radiatorHostHeat = 0,
        radiatorArea = ship.hullRadiationM2;
      for (const x of coolingRequests) {
        const ratio = x.work > 0 ? activeRatio : 1;
        if (signature) signature.stages.push({id:"consumer:"+x.m.id,kind:"consumer_input",actualW:x.work*ratio});
        if (x.m.kind === "h2" && tankLive(x.m)) {
          const q = x.q * ratio,
            aux = x.work * ratio;
          h2 += q;
          h2AuxHeat += aux;
          const flow = ship.signatures ? x.flow * ratio : (q + aux) / x.m.qJKg;
          if (signature) signature.coolerInputs.push({id:x.m.id,flowKgS:flow,auxW:aux});
          fuelFlow(x.m, flow);
          coolantFlowKgS += flow;
        }
        if (x.m.kind === "thermoinverter") {
          ti += x.q * ratio;
          tiReject += (x.q + x.work) * ratio;
          if (signature) {
            const absoluteIrW = (x.q+x.work)*ratio;
            const absolute = x.m.hotK > env.effectiveBackgroundK ? absoluteIrW / (1-(env.effectiveBackgroundK/x.m.hotK)**4) : 0;
            signature.components.push({id:"ti:"+x.m.id,profile:"aft",absoluteIrW:absolute,contrastW:absoluteIrW});
          }
        }
        if (x.m.kind === "radiator") {
          radiatorArea += x.deployed ? x.m.areaM2 * (x.m.auxW > 0 ? ratio : 1) : 0;
          radiatorHostHeat += x.work * ratio;
        }
      }
      let bufferAbsorb = 0,
        bufferRelease = 0;
      const bufferRates: Record<string, number> = {};
      for (const m of live.filter((m) => m.kind === "buffer")) {
        const q = state.buffersJ[m.id] ?? 0;
        let rate =
          state.temperatureK > m.absorbAboveK + 1e-9 && q < m.capacityJ - eps
            ? m.coolingW
            : state.temperatureK < m.releaseBelowK - 1e-9 && q > eps
              ? -m.coolingW
              : 0;
        bufferRates[m.id] = rate;
        if (rate > 0) bufferAbsorb += rate;
        else bufferRelease -= rate;
      }
      const direct =
        env.directHeat.reduce((s, x) => s + x.powerW, 0) +
        env.energyInputs
          .filter((x) => x.representation === "heat")
          .reduce((n, x) => n + x.powerW, 0);
      const hostLossBudgetW = signature ? hull + genHeat + pathLoss + loadHeat + chargeLoss + dischargeLoss + radiatorHostHeat : 0;
      const em = signature ? emComponent({stages:signature.stages,hostLossBudgetW,otherHostExportW:signature.hostIrDebitW,
        shieldingTransmissions:ship.signatures!.shielding,intentionalRfW:0}) : undefined;
      const hostDebitW = signature ? signature.hostIrDebitW + em!.escapedParasiticW : 0;
      const constantHeat =
        hull +
        genHeat +
        pathLoss +
        engineHeat +
        loadHeat +
        returnHeat +
        solarHeat +
        chargeLoss +
        dischargeLoss +
        radiatorHostHeat +
        direct -
        h2 -
        ti -
        bufferAbsorb +
        bufferRelease - hostDebitW;
      const net = (t: number) =>
        env.law === "radiative"
          ? radiatorArea * SIGMA * (t ** 4 - env.effectiveBackgroundK ** 4)
          : env.linearWK * (t - env.effectiveBackgroundK);
      const thermalNet = (t: number) => net(t) + (signature ? signature.coolerInputs.reduce((n,c)=>n+c.flowKgS*(gasSpecificEnergy(t)-gasSpecificEnergy(state.temperatureK)),0) : 0);
      return { signature, hostLossBudgetW, em, hostDebitW, flows, consumerFlows, chemical, genHeat, exhaust, pathLoss, engineHeat, thrust, engineUseful, solarHeat, solar, coolingRequests, coolingRequest, fraction, genBus, sourceBus, recharge, activeRatio, active, hull, coolingBus, bg, delivered, curtailed, chargeLoss, dischargeLoss, batteryRate, loadHeat, beam, workRate, returnHeat, electricUseful, instanceActual, instanceBeam, instanceForce, instanceWork, coolantFlowKgS, h2, ti, tiReject, h2AuxHeat, radiatorHostHeat, radiatorArea, bufferAbsorb, bufferRelease, bufferRates, direct, constantHeat, net: thermalNet, propulsionShortfall };
    };
    let ledger = evaluate(0), coolingDuty = 0;
    // Сначала обычные signed paths и actual bus/генератор/потери. Stored excess
    // требует восстановления и после STOP; left ограничивает только скорость
    // удаления этого запаса, не добавляет новый температурный target.
    const excessRate = Number.isFinite(coolingTarget)
      ? Math.max(0, state.temperatureK - coolingTarget) * ship.heatCapacityJK / left : 0;
    const demandWithoutH2 = ledger.constantHeat - ledger.net(state.temperatureK) + excessRate;
    const coolingWanted = state.temperatureK > 300 + eps && state.temperatureK >= coolingTarget - eps && demandWithoutH2 > 0;
    if (coolingWanted && live.some(m => m.kind === "h2" && tankLive(m))) {
      const full = evaluate(1);
      if (full.constantHeat - full.net(state.temperatureK) + excessRate > 0) {
        coolingDuty = 1; ledger = full;
      } else {
        // Auxiliary draw меняет actual generator/path/battery heat. Решаем
        // этот общий ledger, не вычитаем оценочную rated мощность генератора.
        let lo = 0, hi = 1, loHeat = demandWithoutH2,
          hiHeat = full.constantHeat - full.net(state.temperatureK) + excessRate;
        for (let i = 0; i < 32; i++) {
          // В обычном режиме ledger аффинен по aux duty; секущая получает
          // точный баланс сразу. При source saturation сохраняем bracket.
          const estimate = lo + (hi - lo) * loHeat / (loHeat - hiHeat);
          const mid = estimate > lo && estimate < hi ? estimate : (lo + hi) / 2;
          const trial = evaluate(mid), heat = trial.constantHeat - trial.net(state.temperatureK) + excessRate;
          if (heat >= 0) { lo = mid; loHeat = heat; }
          else { hi = mid; hiHeat = heat; }
          if (Math.abs(heat) <= 1e-8) { coolingDuty = mid; ledger = trial; break; }
          coolingDuty = lo; ledger = evaluate(lo);
        }
      }
    }
    const { signature, hostLossBudgetW, em, hostDebitW, flows, consumerFlows, chemical, genHeat, exhaust, pathLoss, engineHeat, thrust, engineUseful, solarHeat, solar, coolingRequests, coolingRequest, fraction, genBus, sourceBus, recharge, activeRatio, active, hull, coolingBus, bg, delivered, curtailed, chargeLoss, dischargeLoss, batteryRate, loadHeat, beam, workRate, returnHeat, electricUseful, instanceActual, instanceBeam, instanceForce, instanceWork, coolantFlowKgS, h2, ti, tiReject, h2AuxHeat, radiatorHostHeat, radiatorArea, bufferAbsorb, bufferRelease, bufferRates, direct, constantHeat, net, propulsionShortfall } = ledger;
    mining.propulsionShortfall ||= propulsionShortfall;
    const rkEvaluation = (h: number) => {
      const f = (t: number) => (constantHeat - net(t)) / ship.heatCapacityJK;
      const t = state.temperatureK, k1 = f(t), t2 = t + h * k1 / 2,
        k2 = f(t2), t3 = t + h * k2 / 2, k3 = f(t3), t4 = t + h * k3, k4 = f(t4);
      return { endTemperatureK: t + (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6,
        temperatures: [t,t2,t3,t4] as [number,number,number,number], derivatives: [k1,k2,k3,k4] as [number,number,number,number] };
    };
    const temperatureAfter = (h: number) => rkEvaluation(h).endTemperatureK;
    let h = left;
    const boundary = (time: number) => {
      // Даже очень короткое истощение меняет запас до пересчёта потоков:
      // иначе остаток округления может снабжать весь следующий dt.
      if (time > 0) h = Math.min(h, time);
    };
    // RK4 устойчив и точен на локальном тепловом масштабе, а не на
    // произвольном пользовательском dt. Подшаг также пересчитывает actual flows.
    const thermalRate =
      (constantHeat - net(state.temperatureK)) / ship.heatCapacityJK;
    const thermalSlope =
      env.law === "radiative"
        ? (4 *
            radiatorArea *
            SIGMA *
            Math.max(state.temperatureK, env.effectiveBackgroundK) ** 3) /
          ship.heatCapacityJK
        : env.linearWK / ship.heatCapacityJK;
    const h2Slope = signature ? signature.coolerInputs.reduce((n,c)=>n+c.flowKgS*14200,0) / ship.heatCapacityJK : 0;
    if (thermalSlope + h2Slope > 0 && Math.abs(thermalRate) > eps) {
      boundary(0.05 / (thermalSlope + h2Slope));
      boundary(
        (0.02 * Math.max(1, state.temperatureK, env.effectiveBackgroundK)) /
          Math.abs(thermalRate),
      );
    }
    // Actual flows должны разрешать изменение linear thermal duty внутри шага,
    // иначе редкий dt завышает луч на пути к hard gate.
    if (Math.abs(thermalRate) > eps)
      for (const m of live) {
        const T = state.temperatureK,
          g = m.gate;
        const margin =
          T > g.workHigh
            ? g.high - T
            : T < (g.workLow ?? g.low)
              ? T - g.low
              : Infinity;
        if (margin > 1e-6 && Number.isFinite(margin))
          boundary((0.005 * margin) / Math.abs(thermalRate));
      }
    if (batteryRate < 0) boundary(state.chargeJ / -batteryRate);
    if (batteryRate > 0) boundary((qmax - state.chargeJ) / batteryRate);
    if (bgRequest > 0 && batteryRate !== 0) {
      // Пересечение 80% в обоих направлениях; непрерывная SoC ramp
      // пересчитывается при изменении доли не более 0.025 процентного пункта.
      boundary((0.8 * qmax - state.chargeJ) / batteryRate);
      if (state.chargeJ >= 0.8 * qmax - eps && state.chargeJ < qmax - eps)
        boundary((0.00025 * 0.2 * qmax) / Math.abs(batteryRate));
    }
    for (const [id, flow] of Object.entries(flows)) {
      if (flow > 0) {
        boundary(state.fuelKg[id] / flow);
        if (bg > 0) {
          const tank = ship.tanks.find((t) => t.id === id)!;
          boundary((state.fuelKg[id] - 0.2 * tank.capacityKg) / flow);
        }
      }
    }
    for (const [id, rate] of Object.entries(bufferRates)) {
      const m = ship.modules.find((m) => m.id === id)!;
      boundary(
        rate > 0
          ? (m.capacityJ - (state.buffersJ[id] ?? 0)) / rate
          : rate < 0
            ? (state.buffersJ[id] ?? 0) / -rate
            : Infinity,
      );
    }
    if (workRate > 0) {
      boundary((ship.cargoLimitM3 - state.cargo) / workRate);
      boundary((ship.targetLimitM3 - state.usefulWork) / workRate);
    }
    // На самой границе закрытая операция сначала проходит положительный
    // физический интервал; затем запрос пересчитывается в полезной области.
    if (thermalRate > 0 && ship.modules.some(m => m.enabled &&
      (m.kind === "h2" && Math.abs(state.temperatureK - 300) <= eps ||
       m.kind === "radiator" && m.auxW > 0 && Math.abs(state.temperatureK - env.effectiveBackgroundK) <= eps)))
      boundary(Math.max(1e-8, 2 * eps / thermalRate));
    const startT = state.temperatureK;
    const endT = temperatureAfter(h);
    const thresholds = [
      ...(ship.modules.some(m => m.enabled && m.kind === "h2") ? [300, coolingTarget] : []),
      ...(ship.modules.some(m => m.enabled && m.kind === "radiator" && m.auxW > 0)
        ? [env.effectiveBackgroundK] : []),
      ...ship.tanks
        .filter((t) => t.gate)
        .flatMap((t) =>
          state.gates[`tank:${t.id}`]
            ? [t.gate!.restartLow, t.gate!.restartHigh]
            : [t.gate!.low, t.gate!.high],
        ),
      ...live
        .filter((m) => m.kind === "buffer")
        .flatMap((m) => [m.absorbAboveK, m.releaseBelowK]),
      ...ship.modules.flatMap((m) =>
        state.gates[m.id]
          ? [m.gate.restartLow, m.gate.restartHigh]
          : [
              m.gate.low,
              m.gate.high,
              ...(bgRequest > 0 ? [m.gate.workHigh - 10] : []),
            ],
      ),
    ];
    for (const t of thresholds.filter(Number.isFinite)) {
      // При охлаждении точный порог ещё закрыт строгим margin>10 K:
      // короткий интервал переводит состояние внутрь разрешённой области.
      if (
        bgRequest > 0 &&
        fraction === 0 &&
        endT < t &&
        ship.modules.some(
          (m) =>
            m.enabled &&
            !state.gates[m.id] &&
            t === m.gate.workHigh - 10 &&
            Math.abs(startT - t) < 1e-8,
        )
      ) {
        const coolingRate = (net(startT) - constantHeat) / ship.heatCapacityJK;
        h = Math.min(
          h,
          Math.max(1e-8, (Math.max(0, startT - t) + 2e-9) / coolingRate),
        );
      }
      if ((startT < t - eps && endT >= t) || (startT > t + eps && endT <= t)) {
        let lo = 0,
          hi = h;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2,
            v = temperatureAfter(mid);
          if ((endT > startT && v < t) || (endT < startT && v > t)) lo = mid;
          else hi = mid;
        }
        h = Math.min(h, hi);
      }
    }
    if (!(h > 0 && Number.isFinite(h))) h = Math.min(left, 1e-8);
    if(signature){
      // В новой модели физическая энергия и causal history имеют один clock.
      // Ресурсный h превращаем в представленную границу, затем используем её
      // реальную ширину во всех RK/газовых/электрических интегралах. Остаток
      // вычитания меньше ULP не создаёт отдельного нулевого source interval.
      const endS=Math.min(targetTimeS,state.timeSeconds+h);
      h=endS-state.timeSeconds;
      if(!(h>0))throw new RangeError("Physical clock cannot resolve the selected source boundary");
    }
    const desired = targetReached
      ? 0
      : rawLoads
          .filter((x) => (x.m as PhysicsModule).output === "mining")
          .reduce((n, x) => n + x.p * x.m.efficiency * x.m.workPerJ, 0);
    const causes: Cause[] = [];
    if (desired > 0 && workRate < desired - 1e-12) {
      const wanted = ship.modules.filter(
        (m) => m.output === "mining" && m.enabled && (req.get(m.id) ?? 0) > 0,
      );
      if (cargoFull) causes.push("cargo");
      if (!cargoFull && wanted.some((m) => allowed(m) < 1 - 1e-9))
        causes.push("thermal");
      if (!cargoFull && activeRatio < 1 - 1e-9) causes.push("power");
      if (
        !cargoFull &&
        ((activeRatio < 1 - 1e-9 &&
          ship.modules.some(
            (m) => m.kind === "generator" && m.tankId && !tankLive(m),
          )) ||
          (causes.includes("thermal") &&
            ship.modules.some(
              (m) => m.kind === "h2" && m.enabled && coolingWanted && !tankLive(m),
            )))
      )
        causes.push("resource");
    }
    mining.requested ||= desired > 0;
    mining.requestedM3 += desired * h;
    mining.selectedM3 += workRate * h;
    if (causes.length) {
      mining.unionSeconds += h;
      if (causes.length > 1) mining.overlapSeconds += h;
      for (const c of causes) {
        mining.causeSeconds[c] += h;
        if (mining.firstCauseSeconds![c] === null)
          mining.firstCauseSeconds![c] = state.timeSeconds;
      }
      if (!mining.firstLoss)
        mining.firstLoss = { timeSeconds: state.timeSeconds, causes };
      else
        for (const c of causes)
          if (!mining.firstLoss.causes.includes(c))
            mining.firstLoss.causes.push(c);
    }
    if (desired > 0 && workRate <= 1e-12) mining.forcedDowntimeSeconds += h;
    else if (desired > workRate + 1e-12 && workRate > 0)
      mining.partialLossM3 += (desired - workRate) * h;
    if (desired > 0 && workRate <= 1e-12 && state.miningStopSeconds === null)
      state.miningStopSeconds = state.timeSeconds;
    if (workRate > 1e-12 && state.miningStopSeconds !== null) {
      const seconds = state.timeSeconds - state.miningStopSeconds;
      const d = mining.recoveryDelta!;
      if (d.firstSeconds === null) d.firstSeconds = seconds;
      d.count++;
      d.sumSeconds += seconds;
      d.maxSeconds = Math.max(d.maxSeconds, seconds);
      state.miningStopSeconds = null;
    }
    if (workRate > 1e-12 && mining.firstPositiveSeconds === null)
      mining.firstPositiveSeconds = state.timeSeconds;
    for (const [k, v] of Object.entries(consumerFlows))
      consumptionKg[k] = (consumptionKg[k] ?? 0) + v * h;
    for (const [k, v] of Object.entries(instanceWork))
      extractedByInstanceM3[k] = (extractedByInstanceM3[k] ?? 0) + v * h;
    for (const m of ship.modules) {
      add("deliveredW:" + m.id, instanceActual[m.id] ?? 0, h);
      add("beamW:" + m.id, instanceBeam[m.id] ?? 0, h);
      add("forceN:" + m.id, instanceForce[m.id] ?? 0, h);
    }
    for (const x of coolingRequests.filter(x => x.m.kind !== "radiator" || x.m.auxW > 0)) {
      const ratio = x.work > 0 ? activeRatio : 1;
      add("coolingAuxRequestedW:" + x.m.id, x.work, h);
      add("coolingAuxW:" + x.m.id, x.work * ratio, h);
      add("coolingW:" + x.m.id, x.q * ratio, h);
    }
    for (const m of ship.modules.filter(m => m.enabled && (m.kind === "h2" || m.kind === "radiator" && m.auxW > 0))) {
      const floor = m.kind === "h2" && state.temperatureK <= 300 + eps;
      const closed = m.kind === "radiator" && state.temperatureK <= env.effectiveBackgroundK + eps;
      const wanted = m.kind === "h2" ? coolingWanted : !closed;
      add("coolingRequested:" + m.id, wanted ? 1 : 0, h);
      add("coolingOffFloor:" + m.id, floor ? 1 : 0, h);
      add("coolingOffDemand:" + m.id, m.kind === "h2" && !floor && !wanted ? 1 : 0, h);
      add("coolingClosed:" + m.id, closed ? 1 : 0, h);
    }
    coolantConsumedKg += coolantFlowKgS * h;
    const rk = signature ? rkEvaluation(h) : undefined;
    const tNext = Math.max(0, rk ? rk.endTemperatureK : temperatureAfter(h));
    const thermalDelta = ship.heatCapacityJK * (tNext - startT);
    const coolerExports = signature ? signature.coolerInputs.map(c => {
      const gasMeanW = c.flowKgS * rkMean(rk!.temperatures.map(gasSpecificEnergy));
      return { ...c, gasMeanW, netCoolingMeanW: gasMeanW - c.auxW, allocatedIrBudgetMeanW:.01*gasMeanW,
        contrastRkMeanW:rkMean(rk!.temperatures.map(t=>hydrogenCoolerIr(c.flowKgS*gasSpecificEnergy(t),c.flowKgS,env.effectiveBackgroundK).contrastW)) };
    }) : undefined;
    const h2Mean = coolerExports ? coolerExports.reduce((n,c)=>n+c.netCoolingMeanW,0) : h2;
    const radiationNet = signature ? env.law === "radiative" ? radiatorArea * SIGMA * (rkMean(rk!.temperatures.map(t=>t**4)) - env.effectiveBackgroundK**4)
      : env.linearWK * (rkMean(rk!.temperatures) - env.effectiveBackgroundK) : (constantHeat * h - thermalDelta) / h;
    const radIn =
      env.law === "radiative"
        ? radiatorArea * SIGMA * env.effectiveBackgroundK ** 4
        : Math.max(0, -radiationNet);
    const radOut = radIn + radiationNet;
    if (signature) {
      if (env.law !== "radiative") {
        const expectedOut = radiatorArea * SIGMA * rkMean(rk!.temperatures.map(t=>t**4));
        const expectedNet = expectedOut - radiatorArea * SIGMA * env.effectiveBackgroundK**4;
        const matches = (actual: number, expected: number) => expected === 0 ? actual === 0 : Math.abs(actual-expected) <= 1e-6*Math.abs(expected)+1e-12*Math.abs(expected);
        if (!matches(radOut,expectedOut) || !matches(radiationNet,expectedNet)) throw new Error("Источник linear-fog radiationOut/net не имеет согласованного T⁴/K IR mapping; прежний опыт доступен без сигнатур");
      }
      const bodyK = ship.hullRadiationM2, radiatorK = radiatorArea - bodyK;
      const surface = (id: string, k: number, profile: IrAngularProfile): IrProjectionInput => ({id,profile,
        absoluteIrW: k * SIGMA * rkMean(rk!.temperatures.map(t=>t**4)),
        contrastW: k * SIGMA * (rkMean(rk!.temperatures.map(t=>t**4)) - env.effectiveBackgroundK**4)});
      const components = [surface("body",bodyK,"isotropic"),surface("radiators",radiatorK,"aft"),...signature.components];
      signatureFrames!.push({startS:state.timeSeconds,endS:state.timeSeconds+h,startTemperatureK:startT,endTemperatureK:tNext,
        rkTemperatureK:rk!.temperatures,thermalDerivatives:rk!.derivatives,backgroundK:env.effectiveBackgroundK,bodyK,radiatorK,
        components,stages:signature.stages,hostLossBudgetW,hostIrDebitW:signature.hostIrDebitW,em:em!,coolers:coolerExports!,exports:signature.exports});
    }
    const oldCharge = state.chargeJ;
    state.chargeJ = Math.max(
      0,
      Math.min(qmax, state.chargeJ + batteryRate * h),
    );
    state.temperatureK = tNext;
    maxTemperatureK = Math.max(maxTemperatureK, tNext);
    for (const [id, flow] of Object.entries(flows)) {
      state.fuelKg[id] = Math.max(0, state.fuelKg[id] - flow * h);
      if (state.fuelKg[id] < eps) {
        state.fuelKg[id] = 0;
        events.push({
          timeSeconds: state.timeSeconds + h,
          kind: "resource-empty",
          message: `${id}: запас исчерпан`,
        });
      }
    }
    for (const [id, rate] of Object.entries(bufferRates))
      state.buffersJ[id] = (state.buffersJ[id] ?? 0) + rate * h;
    state.usefulWork += workRate * h;
    state.cargo += workRate * h;
    state.timeSeconds += h;
    left -= h;
    const residual =
      (chemical + solar + solarHeat + external + direct + radIn) * h -
      (state.chargeJ - oldCharge) -
      thermalDelta -
      (bufferAbsorb - bufferRelease) * h -
      (exhaust +
        engineUseful +
        beam -
        returnHeat +
        electricUseful +
        radOut +
        h2Mean +
        h2AuxHeat +
        tiReject +
        curtailed + hostDebitW) *
        h;
    const values = {
      requestedW: ship.hullPowerW + rawActive + rawBackground + coolingRequest,
      deliveredW: delivered,
      activeRequestedW: rawActive,
      activeW: active,
      protectedW: hull,
      backgroundRequestedW: rawBackground,
      backgroundW: bg,
      generatorW: genBus,
      solarW: solar,
      externalElectricW: external,
      generatorHostW: genHeat,
      pathLossW: pathLoss,
      batteryLossW: chargeLoss + dischargeLoss,
      propulsionHostW: engineHeat,
      loadHostW: loadHeat,
      solarHostW: solarHeat,
      directHeatW: direct,
      exhaustW: exhaust,
      beamW: beam,
      returnHeatW: returnHeat,
      externalBeamW: beam - returnHeat,
      engineUsefulW: engineUseful + electricUseful,
      thrustN: thrust,
      h2CoolingW: h2Mean,
      h2AuxRejectW: h2AuxHeat,
      radiatorHostW: radiatorHostHeat,
      tiCoolingW: ti,
      tiRejectW: tiReject,
      bufferAbsorbW: bufferAbsorb,
      bufferReleaseW: bufferRelease,
      radiationOutW: radOut,
      radiationInW: radIn,
      radiationNetW: radiationNet,
      heatInW: constantHeat + h2 + ti + bufferAbsorb - bufferRelease,
      heatOutW: radOut + h2Mean + ti + bufferAbsorb,
      workRate,
      chemicalW: chemical,
    };
    for (const [k, v] of Object.entries(values)) add(k, v, h);
    total.energyResidualJ = (total.energyResidualJ ?? 0) + residual;
    events.push(...updateThermalGates(ship, state));
  }
  // Все положительные подинтервалы уже интегрированы; одна операция сложения
  // согласует clock с dt метрик, не накапливая округление внутренних границ.
  state.timeSeconds = input.timeSeconds + dt;
  if (signatureFrames?.length) signatureFrames[signatureFrames.length-1].endS = state.timeSeconds;
  for (const key of Object.keys(total))
    if (key !== "energyResidualJ") total[key] /= dt;
  total.timeSeconds = state.timeSeconds;
  total.chargeJ = state.chargeJ;
  total.soc = state.chargeJ / qmax;
  total.temperatureK = state.temperatureK;
  total.usefulWork = state.usefulWork;
  total.cargo = state.cargo;
  for (const [id, q] of Object.entries(state.fuelKg)) total[`fuelKg:${id}`] = q;
  for (const [id, q] of Object.entries(state.buffersJ))
    total[`bufferJ:${id}`] = q;
  if (total.deliveredW < total.requestedW - 1e-6)
    state.constraints.push("Недостаток электропитания / тепловой лимит");
  if (Object.values(state.gates).some(Boolean))
    state.constraints.push("Тепловая защита");
  if (Object.values(state.fuelKg).some((q) => q === 0))
    state.constraints.push("Топливо исчерпано");
  if (
    total.backgroundRequestedW > 0 &&
    total.backgroundW < total.backgroundRequestedW
  )
    state.constraints.push(
      "Background: SoC / топливо / 10 K / свободная мощность",
    );
  const prior = input.constraints.join("|"),
    now = state.constraints.join("|");
  if (now !== prior)
    events.push({
      timeSeconds: state.timeSeconds,
      kind: now ? "constraint" : "recovered",
      message: now || "Ограничения сняты",
    });
  return {
    ...(signatureFrames ? { signatureFrames } : {}),
    state,
    telemetry: total,
    events,
    coolantConsumedKg,
    maxTemperatureK,
    mining,
    consumptionKg,
    extractedByInstanceM3,
  };
}
