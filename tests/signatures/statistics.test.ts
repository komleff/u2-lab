import { describe, expect, it } from "vitest";
import { addStatisticsInterval, emptyStatistics, statisticsView } from "../../src/signatures/statistics";

describe("integral statistics from evaluated intervals (SC03)", () => {
  const intervals = [
    { startS: 0, endS: 1, meanValue: 2, minValue: 2, maxValue: 2, pulsePeakValue: null, phase: "first" },
    { startS: 1, endS: 4, meanValue: 10, minValue: 8, maxValue: 12, pulsePeakValue: null, phase: "second" },
  ];
  it("weights by actual duration and keeps live, final and phase extrema separate", () => {
    let state = emptyStatistics();
    expect(statisticsView(state)).toEqual({ status: "absent" });
    state = addStatisticsInterval(state, intervals[0]);
    expect(statisticsView(state)).toMatchObject({ durationS: 1, mean: 2, liveValue: 2 });
    state = addStatisticsInterval(state, intervals[1]);
    expect(statisticsView(state)).toEqual({ status: "measured", durationS: 4, integral: 32,
      mean: 8, min: 2, max: 12, liveValue: 10, pulsePeak: null });
    expect(statisticsView(state, "second")).toMatchObject({ durationS: 3, mean: 10, min: 8, max: 12 });
    expect(statisticsView(state, "missing")).toEqual({ status: "absent" });
  });

  it("preserves a 5 ms RF peak even when the supplied interval mean is bucketed", () => {
    const state = addStatisticsInterval(emptyStatistics(), { startS: 0, endS: 2, meanValue: 2812.5,
      minValue: 0, maxValue: 1_125_000, pulsePeakValue: 1_125_000, phase: "ping" });
    expect(statisticsView(state)).toMatchObject({ durationS: 2, integral: 5625, mean: 2812.5,
      min: 0, max: 1_125_000, pulsePeak: 1_125_000 });
  });

  it("is invariant to checkpoint/chunk boundaries and accepts signed contrast", () => {
    const whole = intervals.reduce(addStatisticsInterval, emptyStatistics());
    const first = addStatisticsInterval(emptyStatistics(), intervals[0]);
    const chunked = addStatisticsInterval(JSON.parse(JSON.stringify(first)), intervals[1]);
    expect(chunked).toEqual(whole);
    const cold = addStatisticsInterval(emptyStatistics(), { startS: 0, endS: 1, meanValue: -2,
      minValue: -3, maxValue: -1, pulsePeakValue: null, phase: "__proto__" });
    expect(statisticsView(cold, "__proto__")).toMatchObject({ mean: -2 });
  });

  it("refuses duplicate/overlapping/empty time and unknown or inconsistent extrema", () => {
    const state = addStatisticsInterval(emptyStatistics(), intervals[0]);
    expect(() => addStatisticsInterval(state, intervals[0])).toThrow();
    expect(() => addStatisticsInterval(state, { ...intervals[1], startS: 0.5 })).toThrow();
    expect(() => addStatisticsInterval(state, { ...intervals[1], endS: 1 })).toThrow();
    expect(() => addStatisticsInterval(state, { ...intervals[1], meanValue: NaN })).toThrow();
    expect(() => addStatisticsInterval(state, { ...intervals[1], minValue: 11 })).toThrow();
    expect(() => addStatisticsInterval(state, { ...intervals[1], pulsePeakValue: 13 })).toThrow();
  });
});
