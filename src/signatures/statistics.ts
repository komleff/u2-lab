import { finite, label, nonnegative } from "./domain";

export interface StatisticsAggregate {
  durationS: number;
  integral: number;
  min: number | null;
  max: number | null;
  liveValue: number | null;
  pulsePeak: number | null;
}
export interface SignatureStatistics {
  lastEndS: number | null;
  total: StatisticsAggregate;
  phases: Record<string, StatisticsAggregate>;
}
export interface EvaluatedInterval {
  startS: number;
  endS: number;
  meanValue: number;
  minValue: number;
  maxValue: number;
  pulsePeakValue: number | null;
  phase: string;
}

function emptyAggregate(): StatisticsAggregate {
  return { durationS: 0, integral: 0, min: null, max: null, liveValue: null, pulsePeak: null };
}

export function emptyStatistics(): SignatureStatistics {
  return { lastEndS: null, total: emptyAggregate(), phases: {} };
}

function append(previous: StatisticsAggregate, interval: EvaluatedInterval): StatisticsAggregate {
  const durationS = interval.endS - interval.startS;
  const min = previous.min === null ? interval.minValue : Math.min(previous.min, interval.minValue);
  const max = previous.max === null ? interval.maxValue : Math.max(previous.max, interval.maxValue);
  const pulsePeak = interval.pulsePeakValue === null ? previous.pulsePeak
    : previous.pulsePeak === null ? interval.pulsePeakValue : Math.max(previous.pulsePeak, interval.pulsePeakValue);
  return { durationS: finite(previous.durationS + durationS, "durationS"),
    integral: finite(previous.integral + interval.meanValue * durationS, "integral"),
    min, max, liveValue: interval.meanValue, pulsePeak };
}

export function addStatisticsInterval(state: SignatureStatistics, interval: EvaluatedInterval): SignatureStatistics {
  nonnegative(interval.startS, "startS");
  finite(interval.endS, "endS");
  if (interval.endS <= interval.startS || (state.lastEndS !== null && interval.startS < state.lastEndS)) {
    throw new RangeError("intervals must be nonempty, ordered and nonoverlapping");
  }
  finite(interval.meanValue, "meanValue");
  finite(interval.minValue, "minValue");
  finite(interval.maxValue, "maxValue");
  if (interval.minValue > interval.meanValue || interval.maxValue < interval.meanValue) throw new RangeError("inconsistent interval extrema");
  if (interval.pulsePeakValue !== null) {
    finite(interval.pulsePeakValue, "pulsePeakValue");
    if (interval.pulsePeakValue < interval.minValue || interval.pulsePeakValue > interval.maxValue) throw new RangeError("pulse peak outside extrema");
  }
  const phase = label(interval.phase, "phase");
  // computed extrema приходят до retention; среднее bucket не подменяет максимум 5 ms.
  const previous = Object.hasOwn(state.phases, phase) ? state.phases[phase] : emptyAggregate();
  return { lastEndS: interval.endS, total: append(state.total, interval),
    phases: { ...state.phases, [phase]: append(previous, interval) } };
}

export function statisticsView(state: SignatureStatistics, phase?: string) {
  const aggregate = phase === undefined ? state.total : Object.hasOwn(state.phases, phase) ? state.phases[phase] : undefined;
  if (!aggregate || aggregate.durationS === 0) return { status: "absent" as const };
  return { status: "measured" as const, ...aggregate, mean: finite(aggregate.integral / aggregate.durationS, "mean") };
}
