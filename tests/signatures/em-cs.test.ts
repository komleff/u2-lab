import { describe, expect, it } from "vitest";
import { emComponent, intrinsicHullK, referenceCrossSection } from "../../src/signatures/em-cs";
import { electricMotorLosses, engineIr } from "../../src/signatures/sources";

describe("actual-stage EM and one host-loss partition (SC02)", () => {
  const stages = [
    { id: "gen", kind: "generator_output", actualW: 10_000_000 },
    { id: "charge", kind: "battery_charge", actualW: 2_000_000 },
    { id: "discharge", kind: "battery_discharge", actualW: 3_000_000 },
    { id: "drive", kind: "consumer_input", actualW: 5_000_000 },
    { id: "processing", kind: "protected_processing", actualW: 0 },
  ] as const;

  it("counts charge/discharge separately, shields parasites once, leaves intentional RF intact", () => {
    const result = emComponent({ stages, hostLossBudgetW: 1_000, otherHostExportW: 100,
      shieldingTransmissions: [0.5, 0.5], intentionalRfW: 1_125_000 });
    expect(result.stageBasisW).toBe(20_000_000);
    expect(result.rawParasiticW).toBe(430);
    expect(result.escapedParasiticW).toBe(215);
    expect(result.capturedParasiticW).toBe(215);
    expect(result.retainedHostHeatW).toBe(685);
    expect(result.observedEmW).toBe(1_125_215);
    expect(result.retainedHostHeatW + result.escapedParasiticW + 100).toBe(1_000);
  });

  it("does not multiply stacked screens or spend captured watts a second time", () => {
    const result = emComponent({ stages, hostLossBudgetW: 1_000, otherHostExportW: 0,
      shieldingTransmissions: [0.5, 0.25, 0.5], intentionalRfW: 0 });
    expect(result.escapedParasiticW).toBe(107.5);
    expect(result.capturedParasiticW).toBe(322.5);
    expect(result.retainedHostHeatW).toBe(892.5);
  });

  it("refuses phantom retained EM, combined over-budget exports and invalid stages", () => {
    expect(() => emComponent({ stages, hostLossBudgetW: 400, otherHostExportW: 0,
      shieldingTransmissions: [0], intentionalRfW: 0 })).toThrow();
    expect(() => emComponent({ stages, hostLossBudgetW: 500, otherHostExportW: 100,
      shieldingTransmissions: [0.5], intentionalRfW: 0 })).toThrow();
    for (const invalid of [NaN, -1, undefined]) {
      expect(() => emComponent({ stages: [{ id: "a", kind: "consumer_input", actualW: invalid }],
        hostLossBudgetW: 1, otherHostExportW: 0, shieldingTransmissions: [], intentionalRfW: 0 } as never)).toThrow();
    }
    expect(() => emComponent({ stages: [stages[0], stages[0]], hostLossBudgetW: 1_000,
      otherHostExportW: 0, shieldingTransmissions: [], intentionalRfW: 0 })).toThrow();
  });

  it("represents a ready zero stage without inventing requested-bus power", () => {
    expect(emComponent({ stages: [{ id: "off", kind: "consumer_input", actualW: 0 }],
      hostLossBudgetW: 0, otherHostExportW: 0, shieldingTransmissions: [], intentionalRfW: 0 }).observedEmW).toBe(0);
  });

  it("pays E IR and escaped EM from the same original motor/path loss exactly once", () => {
    const loss = electricMotorLosses({ actualBusW: 10_000_000, pathEfficiency: 0.9, motorEfficiency: 0.9 });
    const ir = engineIr({ kind: "electric", enabled: true, actualSourceW: loss.motorWasteW });
    const result = emComponent({ stages: [{ id: "drive", kind: "consumer_input", actualW: 10_000_000 }],
      hostLossBudgetW: loss.pathLossW + loss.motorWasteW, otherHostExportW: ir.hostHeatDebitW,
      shieldingTransmissions: [0.5], intentionalRfW: 0 });
    expect(result.escapedParasiticW).toBe(107.5);
    expect(result.retainedHostHeatW).toBeCloseTo(1_898_992.5, 6);
    expect(result.retainedHostHeatW + result.escapedParasiticW + ir.hostHeatDebitW + loss.usefulW).toBe(10_000_000);
  });
});

describe("reference geometry and strongest-only material controls (SC02)", () => {
  const geometry = { lengthM: 22, widthM: 16, heightM: 6 };
  it("gives 96/132 m² cardinal CS and continuous reference aspect", () => {
    expect(referenceCrossSection(geometry, 0, [])).toBe(96);
    expect(referenceCrossSection(geometry, 90, [])).toBe(132);
    expect(referenceCrossSection(geometry, 360, [])).toBe(96);
    expect(referenceCrossSection(geometry, 45, [])).toBeCloseTo(161.22034611053286, 9);
    expect(referenceCrossSection({ lengthM: 44, widthM: 32, heightM: 12 }, 0, [])).toBe(384);
    expect(referenceCrossSection(geometry, 0, [0.25, 0.25])).toBe(24);
  });
  it("limits insulation to intrinsic hull K and rejects impossible geometry/coatings", () => {
    expect(intrinsicHullK(400, [0.5, 0.5])).toBe(200);
    expect(() => referenceCrossSection({ ...geometry, heightM: 0 }, 0, [])).toThrow();
    expect(() => referenceCrossSection(geometry, NaN, [])).toThrow();
    expect(() => referenceCrossSection(geometry, 0, [-0.5])).toThrow();
    expect(() => intrinsicHullK(400, [1.5])).toThrow();
  });
});
