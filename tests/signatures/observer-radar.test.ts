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
    [2, 16], [2.0000000000000004, 15], [2.01, 15], [2.1, 15], [2.7, 12], [Math.PI, 10],
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

  const rechargeCases = (["S", "M"] as const).flatMap(size =>
    (["FULL", "EMPTY"] as const).flatMap(initialCap => [2, 2.0000000000000004].flatMap(intervalS =>
      [0.1, 0.05, 0.025].map(dt => ({ size, initialCap, intervalS, dt,
        // EMPTY начинает на2s; repeated +near2 округляется к4/6/.../30 в принятом clock.
        expectedCount: initialCap === "FULL" ? intervalS === 2 ? 16 : 15 : 15 })))));

  it.each(rechargeCases)("Q36 $size/$initialCap interval $intervalS dt $dt earns charge independently of checkpoint chunks", input => {
    const initial = createRadarState({ ...settings, ...input });
    const whole = advanceRadar(initial, 30).state;
    let state = initial;
    const emissions: number[] = [];
    for (let i = 0; i <= Math.round(30 / input.dt); i++) {
      const step = advanceRadar(state, i * input.dt);
      emissions.push(...step.emittedPulses.map(pulse => pulse.emittedAtS));
      state = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(step.state))));
      const inputJ = state.initialCapJ + state.externalRechargeJ;
      const residualJ = inputJ - state.rfExportJ - state.hostHeatJ - state.capJ;
      expect(Math.abs(residualJ)).toBeLessThanOrEqual(1e-12 * inputJ);
      expect(state.capJ).toBeGreaterThanOrEqual(0);
      expect(state.capJ).toBeLessThanOrEqual(input.size === "S" ? 12_500 : 50_000);
    }
    expect(state.pulseSequence).toBe(input.expectedCount);
    expect(state).toEqual(whole);
    if (input.intervalS === 2) {
      expect(emissions.slice(0, 3)).toEqual(input.initialCap === "FULL" ? [0, 2, 4] : [2, 4, 6]);
    }
  });

  it.each(["S", "M"] as const)("Q36 %s irregular chunks preserve reserve, queue and recharge timeline", size => {
    for (const initialCap of ["FULL", "EMPTY"] as const) {
      for (const intervalS of [2, 2.0000000000000004]) {
        const input = { ...settings, size, initialCap, intervalS };
        const whole = advanceRadar(createRadarState(input), 30).state;
        for (const increments of [[0.03, 0.07, 0.11, 0.05], [0.37, 0.13, 0.41, 0.19]]) {
          let state = advanceRadar(createRadarState(input), 0).state;
          let timeS = 0; let index = 0;
          while (timeS < 30) {
            timeS = Math.min(30, timeS + increments[index++ % increments.length]);
            state = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(advanceRadar(state, timeS).state))));
            const inputJ = state.initialCapJ + state.externalRechargeJ;
            expect(Math.abs(inputJ - state.rfExportJ - state.hostHeatJ - state.capJ)).toBeLessThanOrEqual(1e-12 * inputJ);
          }
          expect(state).toEqual(whole);
        }
      }
    }
  });

  it.each(["S", "M"] as const)("%s does not invent energy when OFF/ON resumes a near-empty or near-full capacitor", size => {
    const rechargeW = size === "S" ? 6250 : 25_000;
    const emitted = advanceRadar(createRadarState({ ...settings, size }), 0).state;
    for (const chargedUntilS of [1e-20, 0.000001, 1.999999, 1.9999999999999998]) {
      const off = setRadarEnabled(advanceRadar(emitted, chargedUntilS).state, false);
      const paused = advanceRadar(off, 10).state;
      expect(paused.capJ).toBe(off.capJ);
      expect(paused.externalRechargeJ).toBe(off.externalRechargeJ);
      const resumed = setRadarEnabled(paused, true);
      const untilS = 12;
      const whole = advanceRadar(resumed, untilS).state;
      let chunked = resumed;
      for (const toS of [10, 10.00000001, 10.05, 10.3, 11, 11.9, 12]) {
        const step = advanceRadar(chunked, toS);
        if (toS === 10) expect(step.emittedPulses).toEqual([]);
        chunked = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(step.state))));
        const elapsedRechargeS = chunked.timeS - resumed.timeS;
        expect(chunked.externalRechargeJ - resumed.externalRechargeJ).toBeLessThanOrEqual(elapsedRechargeS * rechargeW);
        const inputJ = chunked.initialCapJ + chunked.externalRechargeJ;
        expect(Math.abs(inputJ - chunked.rfExportJ - chunked.hostHeatJ - chunked.capJ)).toBeLessThanOrEqual(1e-12 * inputJ);
      }
      expect(chunked).toEqual(whole);
    }
  });

  it("detaches the recharge epoch on checkpoint and rejects corrupt clock/reserve/energy anchors", () => {
    const live = advanceRadar(createRadarState(settings), 2.05).state;
    const saved = JSON.parse(JSON.stringify(live));
    const checkpoint = radarCheckpoint(live);
    checkpoint.rechargeEpoch.capJ = 1;
    expect(live).toEqual(saved);
    const epoch = live.rechargeEpoch;
    for (const patch of [{ timeS: NaN }, { timeS: live.timeS + 1 }, { timeS: 0 },
      { capJ: -1 }, { capJ: 12_501 }, { capJ: 1 }, { externalRechargeJ: NaN },
      { externalRechargeJ: epoch.externalRechargeJ + 1 }, { hiddenEnergyJ: 1 }]) {
      expect(() => restoreRadarCheckpoint({ ...live, rechargeEpoch: { ...epoch, ...patch } })).toThrow();
    }
    const partialEpoch = { timeS: epoch.timeS, capJ: epoch.capJ };
    expect(() => restoreRadarCheckpoint({ ...live, rechargeEpoch: partialEpoch })).toThrow();
    expect(() => restoreRadarCheckpoint({ ...live, rechargeEpoch: undefined })).toThrow();
    expect(live).toEqual(saved);
  });

  it.each((["S", "M"] as const).flatMap(size =>
    (["FULL", "EMPTY"] as const).map(initialCap => ({ size, initialCap }))))(
    "CR-SC-B1 refuses $size/$initialCap range before the first physical receipt", input => {
      const emissionS = input.initialCap === "FULL" ? 0 : 2;
      const valid = advanceRadar(createRadarState({ ...settings, ...input }), emissionS).state;
      const original = JSON.parse(JSON.stringify(valid));
      const corrupted = { ...original, pending: [],
        tracks: [{ pulseId: 1, receivedAtS: emissionS, measuredRangeM: 16_000 }] };
      expect(() => restoreRadarCheckpoint(corrupted)).toThrow();
      expect(() => radarObservations(corrupted)).toThrow();
      expect(valid).toEqual(original);
    });

  const causalCorruptions = ["swapped pending IDs", "swapped received IDs", "swapped transit/received IDs",
    "latest receipt moved earlier", "latest emission moved earlier", "compressed emissions",
    "missing latest pending", "missing latest track", "missing middle pending", "receipt before physical RTT"] as const;
  it.each(causalCorruptions)("CR-SC-B1 rejects %s atomically", corruption => {
    const two = setRadarEnabled(advanceRadar(createRadarState(settings), 2).state, false);
    const live = corruption === "swapped transit/received IDs" ? advanceRadar(two, 11).state
      : ["swapped received IDs", "latest receipt moved earlier", "missing latest track", "receipt before physical RTT"].includes(corruption)
        ? advanceRadar(two, 14).state
        : corruption === "missing middle pending" ? advanceRadar(createRadarState(settings), 4).state : two;
    const original = JSON.parse(JSON.stringify(live));
    const changed = JSON.parse(JSON.stringify(live));
    switch (corruption) {
      case "swapped pending IDs":
        [changed.pending[0].pulseId, changed.pending[1].pulseId] = [2, 1]; break;
      case "swapped received IDs":
        [changed.tracks[0].pulseId, changed.tracks[1].pulseId] = [2, 1]; break;
      case "swapped transit/received IDs":
        changed.tracks[0].pulseId = 2; changed.pending[0].pulseId = 1; break;
      case "latest receipt moved earlier": changed.tracks[1].receivedAtS -= 0.25; break;
      case "latest emission moved earlier":
        changed.pending[1].emittedAtS -= 0.25; changed.pending[1].receivedAtS -= 0.25; break;
      case "compressed emissions":
        changed.pending[0].emittedAtS += 1.5; changed.pending[0].receivedAtS += 1.5; break;
      case "missing latest pending": changed.pending.pop(); break;
      case "missing latest track": changed.tracks.pop(); break;
      case "missing middle pending": changed.pending.splice(1, 1); break;
      case "receipt before physical RTT": changed.tracks[0].receivedAtS = 32000 / 3000 - 1e-12; break;
    }
    expect(() => restoreRadarCheckpoint(changed)).toThrow();
    expect(() => radarObservations(changed)).toThrow();
    expect(live).toEqual(original);
  });

  it.each(["S", "M"] as const)("CR-SC-B1 preserves %s legitimate causal checkpoints through OFF, receipts and TTL", size => {
    for (const initialCap of ["FULL", "EMPTY"] as const) {
      for (const intervalS of [2, 2.0000000000000004, 2.1, Math.PI]) {
        let state = createRadarState({ ...settings, size, initialCap, intervalS, enabled: false });
        state = setRadarEnabled(advanceRadar(state, 5).state, true);
        const emissions = advanceRadar(state, 9);
        const actualPulses = emissions.emittedPulses;
        expect(actualPulses[0].emittedAtS).toBe(initialCap === "FULL" ? 5 : 7);
        state = setRadarEnabled(emissions.state, false);
        for (const pulse of actualPulses) {
          const pending = state.pending.find(event => event.pulseId === pulse.pulseId)!;
          expect(pending.emittedAtS).toBe(pulse.emittedAtS);
          expect(pending.receivedAtS).toBe(pulse.emittedAtS + 32000 / 3000);
        }
        const arrivalS = actualPulses[0].emittedAtS + 32000 / 3000;
        const whole = advanceRadar(state, 40).state;
        let chunked = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(state))));
        const receivedIds: number[] = [];
        for (const clockS of [9, 9.03, 10.11, 12.37, arrivalS, arrivalS + 0.03,
          arrivalS + 2.07, arrivalS + 3, arrivalS + 12.999999, arrivalS + 13, 40]) {
          const result = advanceRadar(chunked, clockS);
          receivedIds.push(...result.receivedEchoes.map(echo => echo.pulseId));
          chunked = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(result.state))));
          if (clockS === arrivalS) expect(radarObservations(chunked)[0].pulseId).toBe(actualPulses[0].pulseId);
          if (clockS === arrivalS + 3) expect(radarObservations(chunked)[0].freshness).toBe("stale");
          if (clockS === arrivalS + 13) expect(radarObservations(chunked).some(track => track.pulseId === actualPulses[0].pulseId)).toBe(false);
        }
        expect(receivedIds).toEqual(actualPulses.map(pulse => pulse.pulseId));
        expect(chunked).toEqual(whole);
        expect(chunked.pending).toEqual([]);
        expect(chunked.tracks).toEqual([]);
      }
    }
    const belowThreshold = advanceRadar(createRadarState({ ...settings, size, crossSectionM2: 0 }), 2).state;
    const undetected = advanceRadar(setRadarEnabled(belowThreshold, false), 30).state;
    expect(restoreRadarCheckpoint(JSON.parse(JSON.stringify(undetected)))).toEqual(undetected);
    expect(radarObservations(undetected)).toEqual([]);
  });

  it.each(["N03", "N13"])("CR-SC-B1 %s refuses the paid first pulse before its possible discard", namedCase => {
    const two = setRadarEnabled(advanceRadar(createRadarState(settings), 2).state, false);
    const live = namedCase === "N03" ? two : advanceRadar(two, 2 + 32000 / 3000).state;
    const changed = JSON.parse(JSON.stringify(live));
    if (namedCase === "N03") changed.pending.shift();
    else changed.tracks.shift();
    expect(() => restoreRadarCheckpoint(changed)).toThrow();
  });

  const prefixCases = (["S", "M"] as const).flatMap(size =>
    (["FULL", "EMPTY"] as const).flatMap(initialCap => [96, 0, 0.01].flatMap(crossSectionM2 =>
      (crossSectionM2 === 96 ? ["flight", "live"] : ["flight"]).flatMap(phase =>
        ["first", "firstTwo", "middle", "latest", "all"].map(removed => ({ size, initialCap, crossSectionM2, phase, removed }))))));
  it.each(prefixCases)("CR-SC-B1 keeps mandatory $removed $size/$initialCap CS$crossSectionM2 $phase prefix", input => {
    const firstEmissionS = input.initialCap === "FULL" ? 0 : 2;
    const emitted = setRadarEnabled(advanceRadar(createRadarState({ ...settings, ...input }), firstEmissionS + 4).state, false);
    const live = input.phase === "live" ? advanceRadar(emitted, firstEmissionS + 4 + 32000 / 3000).state : emitted;
    const original = JSON.parse(JSON.stringify(live));
    const changed = JSON.parse(JSON.stringify(live));
    const receipts = input.phase === "live" ? changed.tracks : changed.pending;
    expect(receipts.map((event: { pulseId: number }) => event.pulseId)).toEqual([1, 2, 3]);
    if (input.removed === "all") receipts.splice(0);
    else if (input.removed === "firstTwo") receipts.splice(0, 2);
    else receipts.splice(input.removed === "first" ? 0 : input.removed === "middle" ? 1 : 2, 1);
    expect(() => restoreRadarCheckpoint(changed)).toThrow();
    expect(() => radarObservations(changed)).toThrow();
    expect(live).toEqual(original);
  });

  it.each(["S", "M"] as const)("%s permits prefix discard only after legitimate receipt/TTL through irregular checkpoints", size => {
    for (const initialCap of ["FULL", "EMPTY"] as const) {
      for (const crossSectionM2 of [96, 0, 0.01]) {
        for (const intervalS of [2, 2.0000000000000004, 2.1, Math.PI]) {
          const firstEmissionS = initialCap === "FULL" ? 0 : 2;
          const off = setRadarEnabled(advanceRadar(createRadarState({ ...settings, size, initialCap, crossSectionM2, intervalS }), firstEmissionS + 4).state, false);
          const firstReceiptS = firstEmissionS + 32000 / 3000;
          const lastReceiptS = off.lastEmittedAtS! + 32000 / 3000;
          let state = off;
          for (const clockS of [off.timeS, off.timeS + 0.03, off.timeS + 0.37,
            firstReceiptS - 1e-8, firstReceiptS, firstReceiptS + 1e-8,
            firstReceiptS + 13 - 1e-8, firstReceiptS + 13, firstReceiptS + 13 + 1e-8, lastReceiptS + 13]) {
            state = restoreRadarCheckpoint(JSON.parse(JSON.stringify(radarCheckpoint(advanceRadar(state, clockS).state))));
            expect(state).toEqual(advanceRadar(off, clockS).state);
            if (crossSectionM2 < 1) expect(state.tracks).toEqual([]);
            if (clockS === firstReceiptS) {
              expect(state.pending.some(event => event.pulseId === 1)).toBe(false);
              expect(state.tracks.some(track => track.pulseId === 1)).toBe(crossSectionM2 === 96);
            }
            if (clockS === firstReceiptS + 13) expect(state.tracks.some(track => track.pulseId === 1)).toBe(false);
          }
          expect(state.pending).toEqual([]);
          expect(state.tracks).toEqual([]);
        }
      }
    }
  });

  it.each([96, 0])("does not invent unavailable prior history for CS%s aggregate-equivalent checkpoints", crossSectionM2 => {
    const secondEmissionS = crossSectionM2 === 96 ? 27 : 15;
    const delayedFirstS = crossSectionM2 === 96 ? 5 : 10;
    const history = (firstEmissionS: number) => {
      let state = advanceRadar(createRadarState({ ...settings, crossSectionM2, enabled: false }), firstEmissionS).state;
      state = advanceRadar(setRadarEnabled(state, true), firstEmissionS).state;
      state = advanceRadar(setRadarEnabled(state, false), secondEmissionS - 2).state;
      return advanceRadar(setRadarEnabled(state, true), secondEmissionS).state;
    };
    const early = history(0);
    const late = history(delayedFirstS);
    const alternative = { ...late, pending: late.pending.filter(event => event.pulseId !== 1),
      tracks: late.tracks.filter(track => track.pulseId !== 1) };
    // Отсутствующий первый receipt мог законно уйти в другой истории с теми же aggregate.
    expect(alternative).toEqual(early);
    expect(restoreRadarCheckpoint(JSON.parse(JSON.stringify(alternative)))).toEqual(early);
  });
});
