import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
import {
  parseFitJson,
  serializeFit,
  parseExperimentJson,
  serializeExperiment,
} from "../../src/io/fitting-json";
import { FittingSession } from "../../src/app/fitting-session";
import { createRun, runChunk, result } from "../../src/runner/run";
import type { ShipFit } from "../../src/fitting/types";

const cargoOwner = "docs/gdd/gdd_ship_cargo_payload_and_dimensions.md";
const forceOwner = "docs/specs/spec_engine_force_grid_v0.1.md§8.2";
const mass = (item: { materials: { massKg: number }[] }) =>
  item.materials.reduce((n, b) => n + b.massKg, 0);
const electricRoles = (f: ShipFit) => {
  for (const role of ["march", "retro", "strafe", "turn"])
    f.instances[f.assignments[role]].itemId =
      `engine-electric-S-${["strafe", "turn"].includes(role) ? "pair" : "single"}`;
};

it.each([
  ["universal", 96, 8945.439461 * 8 * 4 ** (-1 / 3), "§5.2"],
  ["bulk", 192, 816 * 4 + 984 * 8, "§5.3"],
] as const)(
  "cargo1.7 %s M uses dry construction formula, distinct builtin recipe, and one compiled bill",
  (type, volume, expectedMass, section) => {
    const c = loadCandidateCatalog(),
      item = c.items[`cargo-${type}-M`];
    expect(Math.abs(mass(item) - expectedMass) / expectedMass).toBeLessThan(
      1e-8,
    );
    expect(item.numerics.cargoM3).toBe(volume);
    expect(item.origins["materials.0.massKg"]).toMatchObject({
      kind: "derived",
      unit: "kg",
      sourceRef: expect.stringContaining(cargoOwner + section),
    });
    expect(item.origins["materials.0.massKg"].derivation).toBeTruthy();
    expect(item.origins["materials.0.cpJKgK"].kind).toBe("experimental");
    const f = getPresetFit("industrial-L:3"),
      base = compileFit(f, c);
    f.instances[f.assignments["payload-4"]].itemId = item.id;
    const installed = compileFit(f, c);
    if (!installed.ok || !base.ok) throw Error("missing");
    const bill = installed.value.materials.filter((b) =>
      b.id.startsWith("fit:payload-4:"),
    );
    expect(bill).toHaveLength(1);
    expect(bill[0].massKg).toBeCloseTo(expectedMass, 7);
    expect(installed.value.dryMassKg - base.value.dryMassKg).toBeCloseTo(
      expectedMass - 11136,
      7,
    );
    expect(
      installed.value.heatCapacityJK - base.value.heatCapacityJK,
    ).toBeCloseTo((expectedMass - 11136) * 470, 6);
    const builtin = installed.value.instances.find(
      (i) => i.id === "builtin:cargo",
    )!.item;
    expect(mass(builtin)).toBeCloseTo(720 * 192 ** (2 / 3), 7);
    expect(builtin.numerics.cargoM3).toBe(192);
    expect(Object.keys(c.items)).toHaveLength(40);
  },
);

it("same single SKU is immutable in march and retro; pair SKU is counted once in each paired slot", () => {
  const c = loadCandidateCatalog(),
    before = structuredClone(c),
    f = getPresetFit("sputnik");
  f.instances[f.assignments.retro].itemId = "engine-diesel-S-single";
  const compiled = compileFit(f, c);
  if (!compiled.ok) throw Error("missing");
  for (const role of ["march", "retro", "strafe", "turn"]) {
    const i = compiled.value.instances.find((i) => i.role === role)!;
    const sku =
      c.items[
        `engine-diesel-S-${["strafe", "turn"].includes(role) ? "pair" : "single"}`
      ];
    expect(i.item).toEqual(sku);
    expect(
      compiled.value.materials.filter((b) => b.id.startsWith(i.id + ":")),
    ).toHaveLength(sku.materials.length);
  }
  const declared = [
    ...compiled.value.hull.materials,
    ...compiled.value.instances.flatMap((i) => i.item.materials),
  ];
  expect(compiled.value.dryMassKg).toBe(
    declared.reduce((n, b) => n + b.massKg, 0),
  );
  expect(compiled.value.heatCapacityJK).toBe(
    declared.reduce((n, b) => n + b.massKg * b.cpJKgK, 0),
  );
  expect(c).toEqual(before);
});

it.each([
  ["sputnik:1", 61237.38761920413, 28775409.68102594],
  ["pony:1", 54233.86760766081, 25489917.775600582],
  ["industrial-S:1", 55133.86760766081, 25906755.275600582],
  ["civilian-M:1", 231230.64141038948, 108678401.46288306],
  ["industrial-M:1", 188849.5504768165, 88734638.72410376],
  ["industrial-L:3", 642102.5656415579 - 3264, 301763555.8515322 - 3264 * 470],
] as const)(
  "reference %s explicitly declares retro variant and preserves starting axes/bill",
  (id, dryMass, heatCapacity) => {
    const c = loadCandidateCatalog(),
      f = getPresetFit(id),
      retroId = f.instances[f.assignments.retro].itemId;
    const authored = f.localVariants[retroId];
    expect(authored).toBeDefined();
    expect(authored.label).toContain("Референсный ретро");
    expect(authored.origins["numerics.forceN"]).toMatchObject({
      kind: "derived",
      sourceRef: expect.stringContaining(forceOwner),
      derivation: expect.stringContaining("0.4"),
    });
    expect(authored.origins["materials.0.massKg"]).toMatchObject({
      kind: "derived",
      derivation: expect.stringContaining("0.4"),
    });
    expect(authored.materials[0].origin.derivation).toContain("0.4");
    expect(authored.origins["materials.0.cpJKgK"].kind).toBe("experimental");
    const s = compileFit(f, c);
    if (!s.ok) throw Error("missing");
    const march = s.value.instances.find((i) => i.role === "march")!.item,
      retro = s.value.instances.find((i) => i.role === "retro")!.item;
    expect(retro).toEqual(authored);
    expect(retro.numerics.forceN).toBe(march.numerics.forceN * 0.4);
    expect(retro.numerics.powerW).toBe(march.numerics.powerW * 0.4);
    expect(mass(retro)).toBe(mass(march) * 0.4);
    expect(s.value.dryMassKg).toBeCloseTo(dryMass, 7);
    expect(s.value.heatCapacityJK).toBeCloseTo(heatCapacity, 6);
    if (id === "pony:1")
      expect(authored).toMatchObject({ class: "UNKNOWN", generation: 0 });
    expect(Object.keys(c.items)).toHaveLength(40);
  },
);

it("D electric plus diesel generator is a lawful hybrid with one typed fuel consumer and no direct propulsion burn", () => {
  const c = loadCandidateCatalog(),
    f = getPresetFit("pony:1");
  electricRoles(f);
  expect(validateFit(f, c).readiness.canRun).toBe(true);
  const compiled = compileFit(f, c);
  if (!compiled.ok) throw Error("hybrid denied");
  expect(compiled.value.resources.diesel.capacityKg).toBe(12000);
  expect(compiled.value.resources.diesel.consumerIds).toEqual(["fit:power-2"]);
  expect(compiled.value.resources.hydrogen.consumerIds).toEqual([]);
  const v = makeMiningRun(f, c, { durationSeconds: 1 });
  if (!v.ok) throw Error("hybrid run denied");
  v.value.initial.chargeJ = 0;
  const state = initialStateV2(v.value),
    r = stepV2(v.value, state, 0.1, { march: 1 });
  expect(r.telemetry.thrustN).toBeGreaterThan(0);
  expect(r.telemetry.beamW).toBe(0);
  expect(r.state.usefulWork).toBe(0);
  expect(r.state.fuelKg.diesel).toBeLessThan(state.fuelKg.diesel);
  expect(
    Object.entries(r.state.consumptionKg)
      .filter(([k]) => k.includes(":propulsion:"))
      .reduce((n, [, kg]) => n + kg, 0),
  ).toBe(0);
  expect(r.state.consumptionKg["diesel:generator:fit:power-2"]).toBeGreaterThan(
    0,
  );
  expect(Math.abs(r.telemetry.energyResidualJ)).toBeLessThan(0.01);
});

it("hybrid permission preserves D direct-H2 rejection, homogeneous roles, E/A no fuel and matching enabled tanks", () => {
  const c = loadCandidateCatalog(),
    mixed = getPresetFit("pony:1");
  mixed.instances[mixed.assignments.retro].itemId = "engine-electric-S-single";
  expect(
    validateFit(mixed, c).issues.some((i) => i.code === "PROPULSION_TYPE"),
  ).toBe(true);
  const h2 = getPresetFit("pony:1");
  for (const role of ["march", "retro", "strafe", "turn"])
    h2.instances[h2.assignments[role]].itemId =
      `engine-hydrogen-S-${["strafe", "turn"].includes(role) ? "pair" : "single"}`;
  expect(
    validateFit(h2, c).issues.filter((i) => i.code === "ARCHITECTURE"),
  ).toHaveLength(4);
  const electric = getPresetFit("pony:1");
  electricRoles(electric);
  for (const architecture of ["E", "A"] as const) {
    const restricted = structuredClone(c);
    restricted.hulls.find((h) => h.id === "pony")!.architecture = architecture;
    expect(
      validateFit(electric, restricted).issues.some(
        (i) => i.code === "ARCHITECTURE",
      ),
    ).toBe(true);
  }
  electric.instances[electric.assignments["power-2"]].itemId =
    "generator-hydrogen-S";
  expect(validateFit(electric, c).readiness.missing).toContain(
    "Power tank hydrogen",
  );
});

it("explicit retro variant survives fit/run export and later local edits cannot mutate running snapshot or frozen A", () => {
  const c = loadCandidateCatalog(),
    f = getPresetFit("pony:1"),
    id = f.instances[f.assignments.retro].itemId;
  expect(f.localVariants[id].numerics.forceN).toBe(1180000);
  const parsed = parseFitJson(serializeFit(f), c);
  expect(parsed).toEqual({ ok: true, value: f });
  const session = new FittingSession(f, c),
    spec = session.prepareRun({ durationSeconds: 1 });
  if (!spec.ok) throw Error("missing");
  expect(parseExperimentJson(serializeExperiment(spec.value))).toEqual(spec);
  const run = createRun("variant-A", spec.value);
  while (!run.done) runChunk(run, 1000);
  session.freeze(result(run));
  const a = structuredClone(session.a);
  const changed = session.getFit();
  changed.localVariants[id].numerics.forceN = 2000000;
  changed.localVariants[id].origins["numerics.forceN"] = {
    kind: "experimental",
    sourceRef: "lab:variant-regression",
    unit: "N",
    derivation: "Явная локальная замена",
  };
  expect(session.applyFit(changed).valid).toBe(true);
  expect(
    run.spec.resolvedShip.instances.find((i) => i.role === "retro")!.item
      .numerics.forceN,
  ).toBe(1180000);
  expect(session.a).toEqual(a);
  expect(c.items["engine-diesel-S-single"].numerics.forceN).toBe(2950000);
});
