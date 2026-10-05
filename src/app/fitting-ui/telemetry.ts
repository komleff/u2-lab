import type { RunResultV2 } from "../../runner/run";
import { fittingChannelUnit } from "../../io/fitting-csv";
import type { Bucket } from "../../runner/retention";
export function bucketValue(
  r: Pick<RunResultV2, "channels">,
  b: Bucket,
  id: string,
) {
  const i = r.channels.indexOf(id);
  return i < 0 || !b.count ? null : b.sum[i] / b.count;
}
export function channelUnit(id: string) {
  const unit = fittingChannelUnit(id);
  return (
    (
      { kg: "кг", s: "с", "SCU/s": "SCU/с", "1": "доля" } as Record<
        string,
        string
      >
    )[unit] ?? unit
  );
}
export function channelGroup(id: string) {
  if (
    /heat|Heat|Host|Cooling|Reject|radiation|bufferAbsorb|bufferRelease|temperature|LossW/.test(
      id,
    )
  )
    return "heat";
  if (/charge|soc|fuelKg|bufferJ|cargo|MassKg/.test(id)) return "stocks";
  if (
    /miningRateM3S|workRate|usefulWork|forceN|thrustN|beamW|externalBeam/.test(
      id,
    )
  )
    return "work";
  return "energy";
}
export function channelRows(
  r: Pick<RunResultV2, "channels">,
  b: Bucket | undefined,
) {
  return b
    ? r.channels.map((id, i) => ({
        id,
        unit: channelUnit(id),
        mean: b.count ? b.sum[i] / b.count : null,
        min: b.min[i],
        max: b.max[i],
        count: b.count,
      }))
    : [];
}
export function eventMatches(kind: string, filter: string) {
  return (
    filter === "all" ||
    (filter === "thrust" && kind === "propulsion-shortfall") ||
    (filter === "thermal" && kind.startsWith("thermal")) ||
    (filter === "resource" && /resource|battery|cargo|buffer/.test(kind)) ||
    (filter === "phase" && kind === "phase") ||
    (filter === "environment" && kind.startsWith("environment")) ||
    (filter === "service" && /service|unload/.test(kind)) ||
    (filter === "limit" && /limit|constraint/.test(kind))
  );
}
export const channelNames: Record<string, string> = {
  requestedW: "Запрошено",
  deliveredW: "Доставлено",
  activeRequestedW: "Запрос активной группы",
  activeW: "Выдача активной группе",
  generatorW: "Генератор",
  solarW: "Солнечная генерация",
  protectedW: "Защищённая нагрузка",
  backgroundW: "Фоновая выдача",
  temperatureK: "Температура корпуса",
  heatInW: "Тепло в корпус",
  heatOutW: "Отвод тепла",
  radiationNetW: "Подписанный радиационный отвод",
  radiationInW: "Излучение среды — приход",
  radiationOutW: "Излучение — выход",
  returnHeatW: "Возврат луча",
  chargeJ: "Заряд",
  soc: "Доля заряда",
  cargo: "Груз на борту",
  usefulWork: "Полезная добыча",
  workRate: "Темп добычи",
  miningRateM3S: "Темп добычи · SCU/с",
  cargoM3: "Груз на борту · SCU",
  thrustN: "Суммарная тяга",
  beamW: "Луч",
  externalBeamW: "Внешний выход луча",
  chemicalW: "Химическая мощность",
  bufferAbsorbW: "Буфер — приём",
  bufferReleaseW: "Буфер — возврат",
  h2CoolingW: "H₂ охлаждение",
};
