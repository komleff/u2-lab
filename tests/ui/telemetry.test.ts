import { it, expect } from "vitest";
import {
  channelRows,
  eventMatches,
  channelUnit,
  channelGroup,
} from "../../src/app/fitting-ui/telemetry";
it("selected bucket exposes measured sum/count and min/max without missing-channel defaults", () => {
  const r = { channels: ["requestedW", "temperatureK", "deliveredW:laser"] };
  const b = {
    startSeconds: 10,
    endSeconds: 11,
    count: 2,
    sum: new Float64Array([12, 600, 8]),
    min: new Float64Array([4, 290, 3]),
    max: new Float64Array([8, 310, 5]),
  };
  expect(channelRows(r, b)).toEqual([
    { id: "requestedW", unit: "W", mean: 6, min: 4, max: 8, count: 2 },
    { id: "temperatureK", unit: "K", mean: 300, min: 290, max: 310, count: 2 },
    { id: "deliveredW:laser", unit: "W", mean: 4, min: 3, max: 5, count: 2 },
  ]);
  expect(channelRows(r, undefined)).toEqual([]);
});
it("propulsion shortfall and overlapping event groups remain filterable from actual event kind", () => {
  expect(eventMatches("propulsion-shortfall", "thrust")).toBe(true);
  expect(eventMatches("resource-empty", "resource")).toBe(true);
  expect(eventMatches("thermal-stop", "thermal")).toBe(true);
  expect(eventMatches("phase", "service")).toBe(false);
  expect(eventMatches("phase", "all")).toBe(true);
});
it("actual v2 aliases keep mining and typed cargo units and heat group", () => {
  expect(channelUnit("miningRateM3S")).toBe("SCU/с");
  expect(channelGroup("miningRateM3S")).toBe("work");
  expect(channelUnit("cargoM3")).toBe("SCU");
  expect(channelGroup("heatInW")).toBe("heat");
  expect(channelGroup("heatOutW")).toBe("heat");
});
