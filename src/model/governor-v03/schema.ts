import {
  GOVERNOR_PROFILE_VERSION, GOVERNOR_VERSION, MODEL_V02, STATE_V2, TICK_SECONDS,
  type GovernorProfileV03, type GovernorStateV03, type GovernorTickInputV03,
  type GovernorRefusalV03, type RefusalCodeV03, type ShipModelStateV02, type SIUnit, type ValidationResultV03,
} from "./types";

export const SI_UNITS: readonly SIUnit[] = ["1", "K", "J", "W", "kg", "s", "tick", "Hz", "m2", "J/K", "W/K", "kg/s", "kg/J", "J/kg", "J/(kg*K)"];
export const GOVERNOR_MODES = ["Normal", "Quiet", "Combat"] as const;
export const STAGE_IDS = ["0", "1", "2", "3", "4", "5Q", "6", "7", "8", "9"] as const;
export const GOVERNOR_REASONS = ["idle", "resource-empty", "resource-reserved", "power-limited", "input-port-limited", "output-port-limited", "shared-port-limited", "capacity-limited", "temperature-head", "hot-derating", "cold-derating", "mode-not-permitted", "quiet-hot-path-forbidden", "ship-cold-protection", "tank-cold-protection", "critical-hot-stop", "critical-cold-stop", "durability-failure", "restart-hysteresis", "restart-unauthorized", "cooldown", "incompatible-thermal-bands", "nonpositive-net-cooling"] as const;
type Rule = (check: ContractCheckV03, input: unknown, path: string) => void;
const isObject = (input: unknown): input is Record<string, unknown> => input !== null && typeof input === "object" && !Array.isArray(input);

export class ContractCheckV03 {
  readonly errors: GovernorRefusalV03[] = [];
  bad(path: string, code: RefusalCodeV03, message: string) { this.errors.push({ path, code, message }); }
  result<T>(value: unknown): ValidationResultV03<T> { return this.errors.length ? { ok: false, errors: this.errors } : { ok: true, value: structuredClone(value) as T }; }
}
export const numberRule = (min = 0, max = Number.MAX_VALUE, integer = false): Rule => (c, v, p) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max || integer && !Number.isSafeInteger(v)) c.bad(p, "INVALID_NUMBER", "Требуется конечное SI-число в допустимом диапазоне");
};
export const textRule: Rule = (c, v, p) => { if (typeof v !== "string" || !v.trim()) c.bad(p, "INVALID_TYPE", "Требуется непустая строка"); };
const idRule: Rule = (c, v, p) => { if (typeof v !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(v)) c.bad(p, "INVALID_TYPE", "Требуется stable identifier"); };
export const enumRule = (values: readonly unknown[], code: RefusalCodeV03 = "INVALID_TYPE"): Rule => (c, v, p) => { if (!values.includes(v)) c.bad(p, code, "Неизвестное значение закрытого контракта"); };
const flagRule = enumRule([true, false]);
export const objectRule = (fields: Record<string, Rule>, optional: Record<string, Rule> = {}): Rule => (c, v, p) => {
  if (!isObject(v)) { c.bad(p, "INVALID_TYPE", "Требуется объект"); return; }
  for (const key of Object.keys(v)) if (!Object.hasOwn(fields, key) && !Object.hasOwn(optional, key)) c.bad(`${p}.${key}`, "UNKNOWN_FIELD", "Неизвестное поле");
  for (const [key, rule] of Object.entries(fields)) {
    if (!Object.hasOwn(v, key)) c.bad(`${p}.${key}`, "MISSING_FIELD", "Обязательное поле отсутствует");
    else rule(c, v[key], `${p}.${key}`);
  }
  for (const [key, rule] of Object.entries(optional)) if (Object.hasOwn(v, key)) rule(c, v[key], `${p}.${key}`);
};
export const listRule = (entry: Rule, uniqueId = true): Rule => (c, v, p) => {
  if (!Array.isArray(v)) { c.bad(p, "INVALID_TYPE", "Требуется массив"); return; }
  const ids = new Set<unknown>();
  for (let index = 0; index < v.length; index++) {
    if (!Object.hasOwn(v, index)) { c.bad(`${p}[${index}]`, "MISSING_FIELD", "Элемент массива отсутствует"); continue; }
    const item = v[index];
    entry(c, item, `${p}[${index}]`);
    const id = isObject(item) ? item.id : item;
    if (uniqueId && id !== undefined) { if (ids.has(id)) c.bad(`${p}[${index}]`, "DUPLICATE_ID", "Повтор stable ID"); ids.add(id); }
  }
};
const nullable = (rule: Rule): Rule => (c, v, p) => { if (v !== null) rule(c, v, p); };
const idsRule = listRule(idRule);
const version = (value: string) => enumRule([value], "UNKNOWN_VERSION");
const si = (unit: SIUnit, min = 0, max = Number.MAX_VALUE): Rule => (c, v, p) => {
  objectRule({ value: numberRule(min, max), unit: enumRule([unit], "INVALID_UNIT"), kind: enumRule(["canonical", "derived", "experimental"], "INVALID_PROVENANCE"), sourceRef: textRule }, {
    candidateRange: (cc, range, pp) => {
      if (!Array.isArray(range) || range.length !== 2) { cc.bad(pp, "INVALID_PROVENANCE", "Нужен диапазон кандидата [min,max]"); return; }
      for (let i = 0; i < 2; i++) {
        if (!Object.hasOwn(range, i)) cc.bad(`${pp}[${i}]`, "MISSING_FIELD", "Граница диапазона отсутствует");
        else numberRule(min, max)(cc, range[i], `${pp}[${i}]`);
      }
      if (!Object.hasOwn(range, 0) || !Object.hasOwn(range, 1)) return;
      if (range[0] > range[1] || isObject(v) && typeof v.value === "number" && (v.value < range[0] || v.value > range[1])) cc.bad(pp, "INVALID_PROVENANCE", "Значение вне диапазона кандидата");
    }, derivation: textRule,
  })(c, v, p);
  if (isObject(v) && v.kind === "derived" && !Object.hasOwn(v, "derivation")) c.bad(`${p}.derivation`, "MISSING_FIELD", "Для derived требуется вывод");
};
const positive = (unit: SIUnit) => si(unit, Number.MIN_VALUE);
const bandsRule = objectRule({ criticalLowK: positive("K"), workLowK: positive("K"), workHighK: positive("K"), criticalHighK: positive("K"), restartColdK: positive("K"), restartHotK: positive("K") });
const mapRule = listRule(objectRule({ energyJ: si("J"), temperatureK: positive("K") }), false);
const bufferFields = { id: idRule, capacityJ: positive("J"), temperatureByEnergy: mapRule, inputW: si("W"), outputW: si("W"), sharedW: si("W"), conductanceWPerK: si("W/K"), compatibleModuleIds: idsRule };
const moduleRule = objectRule({ id: idRule, kind: enumRule(["ordinary", "generator", "heater", "active-radiator", "thermoinverter", "h2-cooler", "water-cooler"]), temperatures: bandsRule, requestCapW: si("W"), capW: si("W"), minSourceTemperatureK: positive("K"), electricJPerJ: si("1"), massKgPerJ: si("kg/J"), auxHeatJPerJ: si("1"), standbyHeatW: si("W"), auxHeatDestination: enumRule(["ship", "export"]), resourceId: nullable(idRule), compatibleBankIds: idsRule });
const profileRule = objectRule({
  version: version(GOVERNOR_PROFILE_VERSION), governorVersion: version(GOVERNOR_VERSION), id: idRule, revision: textRule,
  ship: objectRule({ id: idRule, class: enumRule(["Civilian", "Industrial", "Sport", "Military", "Stealth"]), heatCapacityJPerK: positive("J/K"), temperatures: bandsRule }),
  buffers: listRule(objectRule(bufferFields)), banks: listRule(objectRule({ ...bufferFields, memberIds: idsRule })),
  electrical: objectRule({ storage: objectRule({ capacityJ: si("J"), maxChargeW: si("W"), maxDischargeW: si("W") }),
    sources: listRule(objectRule({ id: idRule, moduleId: idRule, maxOutputW: si("W"), efficiency: si("1", Number.MIN_VALUE, 1), hostHeatFraction: si("1", 0, 1), resourceId: nullable(idRule), fuelJPerKg: nullable(positive("J/kg")) })),
    loads: listRule(objectRule({ id: idRule, moduleId: idRule, standbyW: si("W"), maxInputW: si("W") })),
  }),
  resources: listRule(objectRule({ id: idRule, species: enumRule(["H2", "water", "diesel"]), capacityKg: si("kg"), maxFlowKgPerS: si("kg/s") })),
  modules: listRule(moduleRule),
  surfaces: listRule(objectRule({ id: idRule, moduleId: nullable(idRule), kind: enumRule(["hull", "passive", "active"]), areaM2: positive("m2"), emissivity: si("1", Number.MIN_VALUE, 1), closable: flagRule, thermoinverterId: nullable(idRule) })),
  thermoinverters: listRule(objectRule({ id: idRule, moduleId: idRule, surfaceIds: idsRule, cop: positive("1"), maxColdSideW: si("W"), maxHotTemperatureK: positive("K"), auxHostHeatFraction: si("1", 0, 1) })),
  hydrogenCoolers: listRule(objectRule({ id: idRule, moduleId: idRule, resourceId: idRule, mode: enumRule(["ordinary", "cold"]), floorK: positive("K"), specificExportByTemperature: listRule(objectRule({ temperatureK: positive("K"), specificEnergyJPerKg: positive("J/kg") }), false) })),
  waterTanks: listRule(objectRule({ id: idRule, resourceId: idRule, heatCapacityJPerKgK: positive("J/(kg*K)"), latentHeatJPerKg: positive("J/kg"), referenceTemperatureK: positive("K"), freezeK: positive("K"), protectionOnK: positive("K"), protectionOffK: positive("K"), conductanceWPerK: si("W/K"), exchangeCapW: si("W"), heaterCapW: si("W") })),
  modes: objectRule({ allowed: listRule(enumRule(GOVERNOR_MODES)), normalTargetK: positive("K"), coldOnK: positive("K"), coldOffK: positive("K"), quietOnK: positive("K"), quietOffK: positive("K"), quietUpperK: positive("K"), coldMarginK: si("K"), hotMarginK: si("K"), separationK: positive("K"), vitalModuleIds: idsRule, vitalMinK: positive("K"), vitalMaxK: positive("K"), quietEmergencyChargeFraction: si("1", 0, 1) }),
  failurePolicy: objectRule({ rngAlgorithm: version("xorshift32/1"), firstNegativePolicy: enumRule(["check-on-first-negative-crossing"]), checkIntervalSeconds: positive("s"), probabilityPerCheck: si("1", 0, 1), restartPolicy: enumRule(["explicit-authorization-and-hysteresis"]) }),
  numerical: objectRule({ maxTickDeltaK: positive("K"), minEnvironmentK: positive("K"), maxEnvironmentK: positive("K"), maxExternalHeatingW: si("W"), maxExternalCoolingW: si("W") }),
});
function reference(c: ContractCheckV03, ids: ReadonlySet<string>, id: string | null, path: string) { if (id !== null && !ids.has(id)) c.bad(path, "DANGLING_REFERENCE", "Неизвестный stable ID"); }
const sortedIds = (ids: readonly string[]) => [...ids].sort().join("\n");
function profilePhysics(c: ContractCheckV03, p: GovernorProfileV03) {
  const moduleIds = new Set(p.modules.map(x => x.id)), bankIds = new Set(p.banks.map(x => x.id)), resourceIds = new Set(p.resources.map(x => x.id));
  const entities = [p.ship, ...p.modules, ...p.buffers, ...p.banks, ...p.resources, ...p.surfaces, ...p.thermoinverters, ...p.hydrogenCoolers, ...p.waterTanks, ...p.electrical.loads, ...p.electrical.sources];
  if (new Set(entities.map(x => x.id)).size !== entities.length) c.bad("profile", "DUPLICATE_ID", "ID физических owner должны быть уникальны");
  const thresholds: number[] = [];
  [p.ship.temperatures, ...p.modules.map(x => x.temperatures)].forEach((b, i) => {
    const a = b.criticalLowK.value, l = b.workLowK.value, h = b.workHighK.value, z = b.criticalHighK.value;
    if (!(a < l && l < h && h < z && a < b.restartColdK.value && b.restartColdK.value <= l && h <= b.restartHotK.value && b.restartHotK.value < z)) c.bad(`profile.temperatures[${i}]`, "INVALID_THERMAL_BANDS", "Рабочие/критические полосы и restart должны быть физически упорядочены");
    thresholds.push(...Object.values(b).map(x => x.value));
  });
  for (const b of [...p.buffers, ...p.banks]) {
    const map = b.temperatureByEnergy;
    if (map.length < 2 || map[0]?.energyJ.value !== 0 || map.at(-1)?.energyJ.value !== b.capacityJ.value || map.some((x, i) => x.energyJ.value > b.capacityJ.value || i > 0 && (x.energyJ.value <= map[i - 1].energyJ.value || x.temperatureK.value < map[i - 1].temperatureK.value))) c.bad(`profile.${b.id}.temperatureByEnergy`, "INVALID_TEMPERATURE_MAP", "T_B(Q) должна покрывать [0,capacity] монотонной конечной картой");
    b.compatibleModuleIds.forEach(id => reference(c, moduleIds, id, `profile.${b.id}.compatibleModuleIds`));
  }
  const membership = new Set<string>();
  for (const bank of p.banks) {
    const members = bank.memberIds.map(id => p.buffers.find(x => x.id === id));
    if (!members.length || members.some(x => !x)) { c.bad(`profile.${bank.id}.memberIds`, "INCOMPATIBLE_BANK", "Банк обязан ссылаться на существующие физические буферы"); continue; }
    const physical = members.filter(x => x !== undefined);
    for (const member of physical) {
      if (membership.has(member.id)) c.bad(`profile.${bank.id}`, "INCOMPATIBLE_BANK", "Буфер не принадлежит двум банкам"); membership.add(member.id);
      const normalized = (b: typeof member) => b.temperatureByEnergy.map(x => [x.energyJ.value / b.capacityJ.value, x.temperatureK.value]);
      if (JSON.stringify(normalized(member)) !== JSON.stringify(normalized(bank)) || sortedIds(member.compatibleModuleIds) !== sortedIds(bank.compatibleModuleIds)) c.bad(`profile.${bank.id}.memberIds`, "INCOMPATIBLE_BANK", "Банк объединяет только одинаковые температурные и compatibility характеристики");
    }
    for (const field of ["capacityJ", "inputW", "outputW", "sharedW", "conductanceWPerK"] as const) {
      const sum = physical.reduce((s, member) => s + member[field].value, 0);
      if (!Number.isFinite(sum) || (field === "capacityJ" ? bank[field].value !== sum : bank[field].value > sum)) c.bad(`profile.${bank.id}.${field}`, "INCOMPATIBLE_BANK", "Агрегат не создаёт ёмкость/мощность/проводимость");
    }
    for (const id of bank.compatibleModuleIds) if (!p.modules.find(x => x.id === id)?.compatibleBankIds.includes(bank.id)) c.bad(`profile.${bank.id}`, "INCOMPATIBLE_BANK", "Compatibility должна быть взаимной");
  }
  if (membership.size !== p.buffers.length) c.bad("profile.banks", "INCOMPATIBLE_BANK", "Каждый физический буфер принадлежит ровно одному банку");
  for (const m of p.modules) {
    reference(c, resourceIds, m.resourceId, `profile.${m.id}.resourceId`);
    if (m.massKgPerJ.value > 0 && m.resourceId === null) c.bad(`profile.${m.id}.resourceId`, "DANGLING_REFERENCE", "Расход требует конечный ресурс");
    for (const id of m.compatibleBankIds) {
      reference(c, bankIds, id, `profile.${m.id}.compatibleBankIds`);
      if (!p.banks.find(x => x.id === id)?.compatibleModuleIds.includes(m.id)) c.bad(`profile.${m.id}`, "INCOMPATIBLE_BANK", "Compatibility должна быть взаимной");
    }
  }
  for (const x of [...p.electrical.loads, ...p.electrical.sources, ...p.thermoinverters, ...p.hydrogenCoolers]) reference(c, moduleIds, x.moduleId, `profile.${x.id}.moduleId`);
  for (const s of p.electrical.sources) {
    reference(c, resourceIds, s.resourceId, `profile.${s.id}.resourceId`);
    if ((s.resourceId === null) !== (s.fuelJPerKg === null)) c.bad(`profile.${s.id}`, "DANGLING_REFERENCE", "Топливный источник требует ресурс и удельную энергию вместе");
  }
  for (const l of p.electrical.loads) if (l.standbyW.value > l.maxInputW.value) c.bad(`profile.${l.id}`, "INVALID_NUMBER", "Standby не превышает полный cap");
  const ownedSurfaces = new Set<string>();
  for (const ti of p.thermoinverters) {
    if (!ti.surfaceIds.length) c.bad(`profile.${ti.id}.surfaceIds`, "DANGLING_REFERENCE", "TI требует реальную площадь");
    for (const id of ti.surfaceIds) {
      const s = p.surfaces.find(x => x.id === id);
      if (!s || s.thermoinverterId !== ti.id || ownedSurfaces.has(id)) c.bad(`profile.${ti.id}.surfaceIds`, "DANGLING_REFERENCE", "Площадь имеет одного взаимного TI owner"); ownedSurfaces.add(id);
    }
  }
  for (const s of p.surfaces) {
    reference(c, moduleIds, s.moduleId, `profile.${s.id}.moduleId`);
    if (s.thermoinverterId !== null && !ownedSurfaces.has(s.id)) c.bad(`profile.${s.id}`, "DANGLING_REFERENCE", "Неизвестный TI owner");
    if (s.kind !== "active" && s.closable && s.kind !== "hull") c.bad(`profile.${s.id}.closable`, "INVALID_TYPE", "Пассивный радиатор не закрывается");
  }
  if (p.surfaces.filter(s => s.kind === "hull").length !== 1) c.bad("profile.surfaces", "DANGLING_REFERENCE", "Требуется одна базовая поверхность корпуса");
  for (const h of p.hydrogenCoolers) {
    if (p.resources.find(x => x.id === h.resourceId)?.species !== "H2" || p.modules.find(x => x.id === h.moduleId)?.resourceId !== h.resourceId) c.bad(`profile.${h.id}`, "DANGLING_REFERENCE", "H2-путь требует свой H2 ресурс");
    if (h.mode === "ordinary" && h.floorK.value !== 300) c.bad(`profile.${h.id}.floorK`, "INVALID_NUMBER", "Обычный H2 сохраняет принятую нижнюю границу 300 K");
    if (h.specificExportByTemperature.length < 2 || h.specificExportByTemperature.some((x, i, a) => i > 0 && (x.temperatureK.value <= a[i - 1].temperatureK.value || x.specificEnergyJPerKg.value < a[i - 1].specificEnergyJPerKg.value))) c.bad(`profile.${h.id}`, "INVALID_TEMPERATURE_MAP", "Карта H2 требует возрастающую температуру и неубывающий удельный унос");
  }
  for (const w of p.waterTanks) {
    if (p.resources.find(x => x.id === w.resourceId)?.species !== "water") c.bad(`profile.${w.id}.resourceId`, "DANGLING_REFERENCE", "W требует конечный запас воды");
    if (!(w.freezeK.value <= w.protectionOnK.value && w.protectionOnK.value < w.protectionOffK.value)) c.bad(`profile.${w.id}`, "INVALID_THERMAL_BANDS", "Локальная холодовая защита W требует гистерезис");
    thresholds.push(w.freezeK.value, w.protectionOnK.value, w.protectionOffK.value);
  }
  const m = p.modes;
  if (!m.allowed.includes("Normal") || m.allowed.includes("Combat") && p.ship.class !== "Military" || m.allowed.includes("Quiet") && p.ship.class !== "Stealth") c.bad("profile.modes.allowed", "INVALID_TYPE", "Разрешения режима принадлежат классу корпуса");
  if (!(m.coldOnK.value < m.coldOffK.value && m.coldOffK.value + m.separationK.value <= m.normalTargetK.value && m.quietOffK.value < m.quietOnK.value && m.quietOnK.value <= m.quietUpperK.value && m.vitalMinK.value < m.vitalMaxK.value)) c.bad("profile.modes", "INVALID_THERMAL_BANDS", "Цели и hysteresis должны быть упорядочены");
  m.vitalModuleIds.forEach(id => reference(c, moduleIds, id, "profile.modes.vitalModuleIds"));
  if (p.numerical.maxTickDeltaK.kind !== "experimental") c.bad("profile.numerical.maxTickDeltaK.kind", "INVALID_PROVENANCE", "Lab numerical gate — только experimental");
  if (p.numerical.minEnvironmentK.value > p.numerical.maxEnvironmentK.value) c.bad("profile.numerical", "INVALID_THERMAL_BANDS", "Неверные bounds среды");
  thresholds.push(m.coldOnK.value, m.coldOffK.value, m.normalTargetK.value, m.quietOnK.value, m.quietOffK.value, m.quietUpperK.value);
  const distinct = [...new Set(thresholds)].sort((a, b) => a - b);
  const separation = Math.min(...distinct.slice(1).map((x, i) => x - distinct[i]));
  const limit = Math.min(p.numerical.maxTickDeltaK.value, distinct.length < 2 ? Number.MAX_VALUE : separation / 4);
  const capSum = p.modules.reduce((s, x) => s + x.capW.value * (1 + x.electricJPerJ.value + x.auxHeatJPerJ.value) + x.standbyHeatW.value, 0);
  const sourceHeat = p.electrical.sources.reduce((s, x) => s + x.maxOutputW.value / x.efficiency.value * x.hostHeatFraction.value, 0);
  const radiation = p.surfaces.reduce((s, x) => s + 5.670374419e-8 * x.emissivity.value * x.areaM2.value * Math.max(p.ship.temperatures.criticalHighK.value, p.numerical.maxEnvironmentK.value) ** 4, 0);
  const bankPower = p.banks.reduce((s, x) => s + Math.max(x.inputW.value, x.outputW.value), 0);
  const tankPower = p.waterTanks.reduce((s, x) => s + x.exchangeCapW.value + x.heaterCapW.value, 0);
  const maxDelta = (capSum + sourceHeat + radiation + bankPower + tankPower + p.numerical.maxExternalHeatingW.value + p.numerical.maxExternalCoolingW.value) * TICK_SECONDS / p.ship.heatCapacityJPerK.value;
  if (!Number.isFinite(maxDelta) || maxDelta > limit) c.bad("profile.numerical", "INADMISSIBLE_TICK", "Worst-case tick превышает maxTickDeltaK или четверть distinct threshold separation");
  for (const b of p.banks) for (let i = 1; i < b.temperatureByEnergy.length; i++) {
    const a = b.temperatureByEnergy[i - 1], z = b.temperatureByEnergy[i];
    const delta = Math.max(b.inputW.value, b.outputW.value) * TICK_SECONDS * (z.temperatureK.value - a.temperatureK.value) / (z.energyJ.value - a.energyJ.value);
    if (!Number.isFinite(delta) || delta > limit) c.bad(`profile.${b.id}`, "INADMISSIBLE_TICK", "Температурный шаг банка превышает numerical gate");
  }
}
export function validateGovernorProfileV03(input: unknown): ValidationResultV03<GovernorProfileV03> {
  const c = new ContractCheckV03(); profileRule(c, input, "profile");
  if (!c.errors.length) profilePhysics(c, input as GovernorProfileV03);
  return c.result(input);
}

const stateRule = objectRule({
  version: version(STATE_V2), governorVersion: version(GOVERNOR_VERSION), profileId: idRule, profileRevision: textRule, tickIndex: numberRule(0, Number.MAX_SAFE_INTEGER, true),
  effectiveMode: enumRule(GOVERNOR_MODES), requestedMode: enumRule(GOVERNOR_MODES), quietEntryTemperatureK: nullable(numberRule(Number.MIN_VALUE)), quietHoldTemperatureK: nullable(numberRule(Number.MIN_VALUE)),
  modeLatches: objectRule({ shipColdProtection: flagRule, quietColdCooling: flagRule }), stageLatches: listRule(objectRule({ id: enumRule(STAGE_IDS), active: flagRule })), bankLatches: listRule(objectRule({ id: idRule, direction: enumRule(["none", "in", "out"]) })), selectedStageIds: listRule(enumRule(STAGE_IDS)), previousTransitionDirection: enumRule(["none", "warming", "cooling"]),
  surfaceDeploymentById: listRule(objectRule({ id: idRule, deployed: flagRule })), shipEnergyJ: numberRule(), shipEnergyRemainderJ: numberRule(-Number.MAX_VALUE), bufferEnergyJByBank: listRule(objectRule({ id: idRule, energyJ: numberRule() })), waterEnthalpyJByTank: listRule(objectRule({ id: idRule, enthalpyJ: numberRule(-Number.MAX_VALUE), phase: enumRule(["solid", "mixed", "liquid"]) })), electricalChargeJ: numberRule(), resourceMassKg: listRule(objectRule({ id: idRule, massKg: numberRule() })),
  moduleStateById: listRule(objectRule({ id: idRule, durabilityR: numberRule(-Number.MAX_VALUE, 1), firstNegativeCrossing: flagRule, emergencyExposureSeconds: numberRule(), cooldownUntilTick: numberRule(0, Number.MAX_SAFE_INTEGER, true), restartAuthorized: flagRule, durabilityStopped: flagRule, thermalStopped: flagRule, stopReasons: listRule(enumRule(GOVERNOR_REASONS)) })),
  failureChecks: objectRule({ emergencyExposureSeconds: numberRule(), nextCheckIndex: numberRule(1, Number.MAX_SAFE_INTEGER, true), actualCheckCount: numberRule(0, Number.MAX_SAFE_INTEGER, true), boundaryPolicy: enumRule(["accumulated-exposure"]) }), rng: objectRule({ algorithm: version("xorshift32/1"), seed: numberRule(1, 0xffffffff, true), state: numberRule(1, 0xffffffff, true) }),
  cumulativeServiceInputs: objectRule({ electricalJ: numberRule(), fuelKgByResource: listRule(objectRule({ id: idRule, massKg: numberRule() })), repairByModule: listRule(objectRule({ id: idRule, durabilityDeltaR: numberRule() })) }), serviceReceiptSequence: numberRule(0, Number.MAX_SAFE_INTEGER, true), lastLimitingReasons: listRule(objectRule({ id: idRule, reason: enumRule(GOVERNOR_REASONS) })),
});
function statePhysics(c: ContractCheckV03, s: GovernorStateV03, p: GovernorProfileV03) {
  const maximumRemainderJ = Math.max(Number.MIN_VALUE, Math.abs(s.shipEnergyJ) * Number.EPSILON);
  if (Math.abs(s.shipEnergyRemainderJ) > maximumRemainderJ || (s.shipEnergyJ === 0 && s.shipEnergyRemainderJ < 0)) {
    c.bad("state.shipEnergyRemainderJ", "INVALID_NUMBER", "Компенсационный остаток ship energy вне canonical floating-point envelope");
  }
  if (s.profileId !== p.id || s.profileRevision !== p.revision) c.bad("state.profileId", "STATE_ID_MISMATCH", "State привязан к exact профилю и revision");
  const match = (records: readonly { id: string }[], owners: readonly { id: string }[], path: string) => { if (sortedIds(records.map(x => x.id)) !== sortedIds(owners.map(x => x.id))) c.bad(path, "STATE_ID_MISMATCH", "Нужны ровно canonical IDs physical owner"); };
  match(s.bufferEnergyJByBank, p.banks, "state.bufferEnergyJByBank"); match(s.bankLatches, p.banks, "state.bankLatches"); match(s.waterEnthalpyJByTank, p.waterTanks, "state.waterEnthalpyJByTank"); match(s.resourceMassKg, p.resources, "state.resourceMassKg"); match(s.moduleStateById, p.modules, "state.moduleStateById"); match(s.surfaceDeploymentById, p.surfaces, "state.surfaceDeploymentById"); match(s.cumulativeServiceInputs.fuelKgByResource, p.resources, "state.cumulativeServiceInputs.fuelKgByResource"); match(s.cumulativeServiceInputs.repairByModule, p.modules, "state.cumulativeServiceInputs.repairByModule");
  for (const b of s.bufferEnergyJByBank) if (b.energyJ > (p.banks.find(x => x.id === b.id)?.capacityJ.value ?? -1)) c.bad(`state.${b.id}`, "INVALID_NUMBER", "Энергия превышает ёмкость банка");
  for (const r of s.resourceMassKg) if (r.massKg > (p.resources.find(x => x.id === r.id)?.capacityKg.value ?? -1)) c.bad(`state.${r.id}`, "INVALID_NUMBER", "Масса превышает ёмкость ресурса");
  for (const [index, water] of s.waterEnthalpyJByTank.entries()) {
    const tank = p.waterTanks.find(x => x.id === water.id);
    if (!tank) continue;
    const massKg = s.resourceMassKg.find(x => x.id === tank.resourceId)?.massKg;
    if (massKg === undefined) continue;
    const path = `state.waterEnthalpyJByTank[${index}]`;
    if (massKg === 0) {
      // Dry W has no thermal contents; solid is the single persisted empty marker.
      if (water.enthalpyJ !== 0 || water.phase !== "solid") c.bad(path, "INVALID_NUMBER", "Пустой W обязан иметь нулевую энтальпию и dry phase marker");
      continue;
    }
    const heatCapacityJPerK = massKg * tank.heatCapacityJPerKgK.value;
    const freezeJ = heatCapacityJPerK * (tank.freezeK.value - tank.referenceTemperatureK.value);
    const meltedJ = freezeJ + massKg * tank.latentHeatJPerKg.value;
    const lowerJ = -heatCapacityJPerK * tank.referenceTemperatureK.value; // 0 K physical floor.
    const upperTemperatureK = Math.max(p.numerical.maxEnvironmentK.value, tank.protectionOffK.value, tank.freezeK.value);
    const upperJ = meltedJ + heatCapacityJPerK * (upperTemperatureK - tank.freezeK.value);
    if (![heatCapacityJPerK, freezeJ, meltedJ, lowerJ, upperJ].every(Number.isFinite)) { c.bad(path, "INVALID_NUMBER", "W enthalpy bounds должны оставаться конечными"); continue; }
    if (water.enthalpyJ < lowerJ || water.enthalpyJ > upperJ) c.bad(path, "INVALID_NUMBER", "W enthalpy вне finite tank/numerical temperature envelope");
    if (water.phase === "solid" && water.enthalpyJ > freezeJ || water.phase === "mixed" && !(freezeJ < water.enthalpyJ && water.enthalpyJ < meltedJ) || water.phase === "liquid" && water.enthalpyJ < meltedJ) c.bad(path, "INVALID_THERMAL_BANDS", "W phase не соответствует mass, sensible heat и latent interval");
  }
  if (s.electricalChargeJ > p.electrical.storage.capacityJ.value) c.bad("state.electricalChargeJ", "INVALID_NUMBER", "Заряд превышает ёмкость");
  if (!p.modes.allowed.includes(s.effectiveMode)) c.bad("state.effectiveMode", "INVALID_TYPE", "State не получает чужие разрешения режима");
  if (s.effectiveMode === "Quiet" && (s.quietEntryTemperatureK === null || s.quietHoldTemperatureK === null)) c.bad("state.quietHoldTemperatureK", "MISSING_FIELD", "Quiet хранит entry и hold температуры");
  if (s.failureChecks.nextCheckIndex !== s.failureChecks.actualCheckCount + 1) c.bad("state.failureChecks", "INVALID_NUMBER", "Номер следующей проверки обязан продолжать actual counters");
  const moduleIds = new Set(p.modules.map(x => x.id)); s.lastLimitingReasons.forEach(x => reference(c, moduleIds, x.id, "state.lastLimitingReasons"));
}
export function validateGovernorStateV03(input: unknown, profile: unknown): ValidationResultV03<GovernorStateV03> {
  const p = validateGovernorProfileV03(profile); const c = new ContractCheckV03(); stateRule(c, input, "state");
  if (!p.ok) c.errors.push(...p.errors); else if (!c.errors.length) statePhysics(c, input as GovernorStateV03, p.value);
  return c.result(input);
}
const requestsRule = listRule(objectRule({ id: idRule, requestedW: numberRule() }));
const environmentRule = objectRule({ temperatureK: numberRule(Number.MIN_VALUE), externalHeatingW: numberRule(), externalCoolingW: numberRule() });
export function validateGovernorTickInputV03(input: unknown): ValidationResultV03<GovernorTickInputV03> {
  const c = new ContractCheckV03(); objectRule({ profile: () => {}, state: () => {}, requestedMode: enumRule(GOVERNOR_MODES), requests: requestsRule, environment: environmentRule })(c, input, "tick");
  if (!isObject(input)) return c.result(input);
  const p = validateGovernorProfileV03(input.profile); if (!p.ok) c.errors.push(...p.errors);
  const s = validateGovernorStateV03(input.state, input.profile); if (!s.ok) c.errors.push(...s.errors);
  if (!c.errors.length && p.ok) {
    const tick = input as unknown as GovernorTickInputV03;
    tick.requests.forEach(r => { const module = p.value.modules.find(x => x.id === r.id); if (!module) c.bad(`tick.requests.${r.id}`, "DANGLING_REFERENCE", "Неизвестный module request"); else if (r.requestedW > module.requestCapW.value) c.bad(`tick.requests.${r.id}`, "INVALID_NUMBER", "Запрос превышает declared request cap"); });
    const e = tick.environment, n = p.value.numerical;
    if (e.temperatureK < n.minEnvironmentK.value || e.temperatureK > n.maxEnvironmentK.value || e.externalHeatingW > n.maxExternalHeatingW.value || e.externalCoolingW > n.maxExternalCoolingW.value) c.bad("tick.environment", "INADMISSIBLE_TICK", "Среда вне explicit numerical bounds профиля");
  }
  return c.result(input);
}
export function validateShipModelStateV02(input: unknown, profile: unknown): ValidationResultV03<ShipModelStateV02> {
  const c = new ContractCheckV03(); objectRule({ modelVersion: version(MODEL_V02), stateVersion: version(STATE_V2), phaseIndex: numberRule(0, Number.MAX_SAFE_INTEGER, true), phaseElapsedTicks: numberRule(0, Number.MAX_SAFE_INTEGER, true), governor: () => {} })(c, input, "runnerState");
  if (isObject(input)) { const state = validateGovernorStateV03(input.governor, profile); if (!state.ok) c.errors.push(...state.errors); }
  return c.result(input);
}
