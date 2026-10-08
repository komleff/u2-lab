import { describe, expect, it } from "vitest";
import { mergePassiveSpots, observerPreset, passiveObservation, receivedFlux } from "../../src/signatures/presets";
import { advanceRadar, createRadarState, echoEnergy, radarCheckpoint, radarObservations,
  radarEchoDetected, restoreRadarCheckpoint, rfPulseDiagnostic, setRadarEnabled } from "../../src/signatures/radar";

function expectPhysical(actual: number, expected: number, reference: number = Math.abs(expected)): void {
  if (expected === 0) expect(actual).toBe(0);
  else expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-6 * Math.abs(expected) + 1e-12 * reference);
}

describe("public preset thresholds and passive allowlist (SC04/05)", () => {
  it.each([
    ["S-dedicated-G1", 0.000274542277, 0.0001647253662, 3.592038646e-8, 750],
    ["S-3in1-G1", 0.00061772012325, 0.00037063207395, 8.0820869535e-8, 750],
    ["M-dedicated-G1", 0.00006863556925, 0.00004118134155, 8.980096615e-9, 3000],
    ["M-3in1-G1", 0.0001544300308125, 0.0000926580184875, 2.020521738375e-8, 3000],
  ] as const)("uses %s anchors for actual detection and external processing", (presetId, detect, hold, emDetect, power) => {
    const preset = observerPreset(presetId);
    expectPhysical(preset.ir.detectWm2, detect);
    expectPhysical(preset.ir.holdWm2, hold);
    expectPhysical(preset.em.detectWm2, emDetect);
    expect(preset.receiverProcessingW).toBe(power);
    const input = { presetId, channel: "IR", bearingDeg: 360, held: false, advancedIr: false } as const;
    const exactDetect = preset.ir.detectWm2;
    const exactHold = preset.ir.holdWm2;
    expect(passiveObservation({ ...input, signedFluxWm2: exactDetect * (1 - 1e-10) })).toBeNull();
    expect(passiveObservation({ ...input, signedFluxWm2: exactDetect })).toEqual({ channel: "IR", bearingDeg: 0, brightnessWm2: exactDetect });
    expect(passiveObservation({ ...input, signedFluxWm2: exactDetect * (1 + 1e-10) })).not.toBeNull();
    expect(passiveObservation({ ...input, held: true, signedFluxWm2: exactHold })).not.toBeNull();
    expect(passiveObservation({ ...input, held: true, signedFluxWm2: exactHold * (1 - 1e-10) })).toBeNull();
    const em = { ...input, channel: "EM" } as const;
    expect(passiveObservation({ ...em, signedFluxWm2: preset.em.detectWm2 * (1 - 1e-10) })).toBeNull();
    expect(passiveObservation({ ...em, signedFluxWm2: preset.em.detectWm2 })).not.toBeNull();
    expect(passiveObservation({ ...em, signedFluxWm2: preset.em.detectWm2 * (1 + 1e-10) })).not.toBeNull();
    expect(passiveObservation({ ...em, held: true, signedFluxWm2: preset.em.holdWm2 })).not.toBeNull();
    expect(passiveObservation({ ...em, held: true, signedFluxWm2: preset.em.holdWm2 * (1 - 1e-10) })).toBeNull();
    expectPhysical(preset.em.holdWm2, emDetect * 0.6);
  });

  it("keeps cold-negative standard IR absent and exposes only measured advanced brightness", () => {
    const input = { presetId: "S-dedicated-G1", channel: "IR", signedFluxWm2: -0.001,
      bearingDeg: -1, held: false, advancedIr: false } as const;
    expect(passiveObservation(input)).toBeNull();
    const observation = passiveObservation({ ...input, advancedIr: true });
    expect(observation).toEqual({ channel: "IR", bearingDeg: 359, brightnessWm2: 0.001 });
    expect(Object.keys(observation!).sort()).toEqual(["bearingDeg", "brightnessWm2", "channel"]);
    expect(() => passiveObservation({ ...input, signedFluxWm2: NaN })).toThrow();
    expect(() => passiveObservation({ ...input, channel: "Photo" } as never)).toThrow();
    expect(() => observerPreset("unknown" as never)).toThrow();
  });

  it("merges circular bearings and adds unresolved brightness before thresholding", () => {
    const merged = mergePassiveSpots("IR", [
      { bearingDeg: 359, brightnessWm2: 0.00015 }, { bearingDeg: 1, brightnessWm2: 0.00015 },
      { bearingDeg: 90, brightnessWm2: 0.001 },
    ], 3);
    expect(merged).toHaveLength(2);
    expect(Math.min(merged[0].bearingDeg, 360 - merged[0].bearingDeg)).toBeLessThan(1e-10);
    expect(merged[0].brightnessWm2).toBe(0.0003);
    expect(passiveObservation({ presetId: "S-dedicated-G1", channel: "IR", signedFluxWm2: merged[0].brightnessWm2,
      bearingDeg: merged[0].bearingDeg, held: false, advancedIr: false })).not.toBeNull();
    expect(() => mergePassiveSpots("IR", [], 0)).toThrow();
  });

  it("uses inverse-square signed flux without a free passive range output", () => {
    expect(receivedFlux(1000, 10)).toBeCloseTo(0.7957747154594768, 12);
    expect(receivedFlux(-1000, 10)).toBeCloseTo(-0.7957747154594768, 12);
    expect(() => receivedFlux(1, 0)).toThrow();
  });
});

describe("stationary radar resource ledger and delayed events (SC04/05)", () => {
  const settings = { size: "S", initialCap: "FULL", rangeM: 16_000, crossSectionM2: 96,
    intervalS: 2, enabled: true } as const;

  it("spends initial reserve once and accounts recharge without duplicate 3437.5 W heat", () => {
    const atZero = advanceRadar(createRadarState(settings), 0);
    expect(atZero.emittedPulses).toHaveLength(1);
    expect(atZero.state.capJ).toBe(0);
    expect(atZero.state.rfExportJ).toBe(5625);
    expect(atZero.state.hostHeatJ).toBe(6875);
    expect(atZero.state.externalRechargeJ).toBe(0);
    const atTwo = advanceRadar(atZero.state, 2);
    expect(atTwo.emittedPulses).toHaveLength(1);
    expect(atTwo.state.externalRechargeJ).toBe(12_500);
    expect(atTwo.state.rfExportJ).toBe(11_250);
    expect(atTwo.state.hostHeatJ).toBe(13_750);
    expect(atTwo.state.initialCapJ + atTwo.state.externalRechargeJ - atTwo.state.rfExportJ
      - atTwo.state.hostHeatJ - atTwo.state.capJ).toBe(0);
    expect(rfPulseDiagnostic(atZero.emittedPulses[0], 16_000)).toEqual({
      rfEnergyJ: 5625, pulseWidthS: 0.005, rfPeakW: 1_125_000,
      receivedFluxWm2: 0.00034970568550465286,
    });
  });

  it("starts EMPTY by waiting for actual external charge, and scales M energy/aperture", () => {
    let empty = createRadarState({ ...settings, initialCap: "EMPTY" });
    const before = advanceRadar(empty, 1.999);
    expect(before.emittedPulses).toHaveLength(0);
    expect(before.state.capJ).toBe(12_493.75);
    empty = advanceRadar(before.state, 2).state;
    expect(empty.pulseSequence).toBe(1);
    expect(empty.initialCapJ).toBe(0);
    expect(empty.externalRechargeJ).toBe(12_500);
    const medium = advanceRadar(createRadarState({ ...settings, size: "M" }), 0);
    expect(medium.state.rfExportJ).toBe(22_500);
    expect(medium.state.hostHeatJ).toBe(27_500);
    expect(medium.emittedPulses[0].rfPeakW).toBe(4_500_000);
    expectPhysical(echoEnergy("M", 16_000, 96), 8.3486082713107905e-13, 5.217880169e-14);
  });

  it("rejects an EMPTY checkpoint claiming recharge before any clock time elapsed", () => {
    const charged = advanceRadar(createRadarState({ ...settings, initialCap: "EMPTY" }), 2).state;
    const impossible = { ...charged, timeS: 0, lastEmittedAtS: 0, nextPingS: 2,
      pending: charged.pending.map(event => ({ ...event, emittedAtS: 0, receivedAtS: event.receivedAtS - 2 })) };
    expect(() => restoreRadarCheckpoint(impossible)).toThrow();
  });

  it("preserves two pulse IDs and reception after OFF and checkpoint round trip", () => {
    const two = advanceRadar(createRadarState(settings), 2).state;
    expect(two.pending.map(event => event.pulseId)).toEqual([1, 2]);
    expect(two.pending[0].receivedAtS).toBeCloseTo(10.666666666666666, 12);
    const off = setRadarEnabled(two, false);
    const restored = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(off))));
    expect(restored).toEqual(off);
    const untilSecond = advanceRadar(off, 12.666666666666666);
    expect(advanceRadar(restored, 12.666666666666666)).toEqual(untilSecond);
    expect(untilSecond.emittedPulses).toHaveLength(0);
    expect(untilSecond.receivedEchoes.map(echo => echo.pulseId)).toEqual([1, 2]);
    expect(radarObservations(untilSecond.state).map(echo => echo.pulseId)).toEqual([1, 2]);
    expect(Object.keys(radarObservations(untilSecond.state)[0]).sort()).toEqual([
      "channel", "freshness", "measuredRangeM", "pulseId", "receivedAtS",
    ]);
    expect(untilSecond.state.capJ).toBe(0);
  });

  it("uses exact echo threshold and fresh3/stale10 boundaries, never refreshes on OFF", () => {
    const threshold = 5.217880169e-14;
    expect(radarEchoDetected("S", threshold * (1 - 1e-10))).toBe(false);
    expect(radarEchoDetected("S", threshold)).toBe(true);
    expect(radarEchoDetected("S", threshold * (1 + 1e-10))).toBe(true);
    const atReference = echoEnergy("S", 16_000, 96);
    expectPhysical(atReference, 5.217880169569244e-14, threshold);
    expectPhysical(echoEnergy("S", 11_313.70849898476, 24), 5.217880169569244e-14, threshold);
    // Порог проверяется предикатом, без расширения физического допуска.
    const detectRange = 16_000 * Math.pow(atReference / threshold, 0.25);
    const below = advanceRadar(setRadarEnabled(advanceRadar(createRadarState({ ...settings,
      rangeM: detectRange * (1 + 1e-8) }), 0).state, false), 20);
    expect(below.receivedEchoes).toHaveLength(0);
    const pulse = advanceRadar(createRadarState(settings), 0).state;
    const off = setRadarEnabled(pulse, false);
    const arrival = off.pending[0].receivedAtS;
    const received = advanceRadar(off, arrival).state;
    expect(radarObservations(advanceRadar(received, arrival + 3 - 1e-8).state)[0].freshness).toBe("fresh");
    expect(radarObservations(advanceRadar(received, arrival + 3).state)[0].freshness).toBe("stale");
    expect(radarObservations(advanceRadar(received, arrival + 13 - 1e-8).state)[0].freshness).toBe("stale");
    expect(radarObservations(advanceRadar(received, arrival + 13).state)).toEqual([]);
  });

  it("keeps continuous clock results invariant to chunking and refuses corrupted state", () => {
    const initial = createRadarState(settings);
    const whole = advanceRadar(initial, 11).state;
    let chunked = initial;
    for (const t of [0, 0.1, 1, 2, 3.3, 6, 10, 11]) chunked = advanceRadar(chunked, t).state;
    expect(chunked).toEqual(whole);
    expect(initial.pulseSequence).toBe(0);
    expect(() => createRadarState({ ...settings, intervalS: 1.99 })).toThrow();
    expect(() => advanceRadar(whole, 10)).toThrow();
    expect(() => restoreRadarCheckpoint({ ...radarCheckpoint(whole), capJ: whole.capJ + 1 })).toThrow();
    expect(() => restoreRadarCheckpoint({ ...radarCheckpoint(whole), version: "future" })).toThrow();
    expect(() => restoreRadarCheckpoint({ ...radarCheckpoint(whole), pending: [whole.pending[0], whole.pending[0]] })).toThrow();
    expect(() => restoreRadarCheckpoint({ ...radarCheckpoint(whole), targetIdentity: "leaked" })).toThrow();
  });

  it("rejects an altered ping schedule even after all pulse/track history has expired", () => {
    const emitted = advanceRadar(createRadarState(settings), 0).state;
    const expired = advanceRadar(setRadarEnabled(emitted, false), 30).state;
    expect(expired.pending).toEqual([]);
    expect(expired.tracks).toEqual([]);
    expect(() => restoreRadarCheckpoint({ ...radarCheckpoint(expired), nextPingS: 3 })).toThrow();
  });

  it("converges 0.1/0.05 s polling to the same analytic reception clock", () => {
    const off = setRadarEnabled(advanceRadar(createRadarState(settings), 0).state, false);
    const receptions = [0.1, 0.05].map(dt => {
      let state = off;
      let clock: number | undefined;
      for (let i = 1; i <= Math.ceil(11 / dt); i++) {
        const result = advanceRadar(state, i * dt);
        state = result.state;
        if (result.receivedEchoes.length) clock = result.receivedEchoes[0].receivedAtS;
      }
      return clock;
    });
    expect(receptions).toEqual([10.666666666666666, 10.666666666666666]);
  });

  it.each([
    [2.01, 15], [2.1, 15], [2.7, 12], [Math.PI, 10],
  ])("preserves valid fractional %s s cadence through polling and checkpoint", (intervalS, count) => {
    const input = { ...settings, intervalS };
    const whole = advanceRadar(createRadarState(input), 30).state;
    const corruptLastS = whole.lastEmittedAtS! - 0.001;
    expect(() => restoreRadarCheckpoint({ ...whole, lastEmittedAtS: corruptLastS,
      nextPingS: corruptLastS + intervalS })).toThrow();
    for (const dt of [0.1, 0.05]) {
      let state = createRadarState(input);
      for (let i = 0; i <= Math.round(30 / dt); i++) {
        state = advanceRadar(state, i * dt).state;
        state = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(state))));
      }
      expect(state.pulseSequence).toBe(count);
      expect(state.pending).toEqual(whole.pending);
      expect(state.tracks).toEqual(whole.tracks);
      expectPhysical(state.externalRechargeJ, whole.externalRechargeJ, state.initialCapJ + state.externalRechargeJ);
      expectPhysical(state.capJ, whole.capJ, state.initialCapJ + state.externalRechargeJ);
    }
  });
});
