// Перекалибровка IR-порогов при переходе стандартного фона 100 K → 250 K.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { stepPhysicsV2 } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { physicsShip, initialStateV2 } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/step";
import { loadCandidateCatalog, presetOptions } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/scenarios/mission";
import { signatureSpec } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/config";
import { projectIrComponents } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/projection";

const OUT = "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/";
const IR_DETECT = 0.000274542277, IR_HOLD = 0.0001647253662;
const km = (w: number, phi: number) => (w > 0 ? Math.sqrt(w / (4 * Math.PI * phi)) / 1000 : 0);
// Средний по ракурсам знаковый IR-контраст кадра (g по кругу в среднем = 1) плюс газ H₂
function contrast(f: any) {
  const T = f.rkTemperatureK.reduce((a: number, b: number) => a + b, 0) / 4;
  const gas = f.coolers.reduce((n: number, c: any) => n + 142 * c.flowKgS * Math.max(T - f.backgroundK, 0), 0);
  return projectIrComponents(f.components, 0).intrinsicContrastW + gas;
}
function run(id: string, Tenv: number, mining: boolean, seconds: number) {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  const o = presetOptions(catalog).find(x => x.id === id)!;
  const built = makeMissionRun(o.fit, catalog, { ...freshMissionConditions(o.fit, catalog), durationSeconds: 3600, stepSeconds: 0.1 });
  if (!built.ok) throw new Error("build");
  const spec = signatureSpec(built.value);
  let st: any = initialStateV2(spec), last: any = null;
  const env = { ...spec.environment, effectiveBackgroundK: Tenv };
  const req = mining ? spec.selectedWorkGroup.map((m: string) => ({ moduleId: m, duty: 1 })) : [];
  for (let t = 0; t < seconds; t++) {
    const r = stepPhysicsV2(physicsShip(spec, st), { ...st, miningStopSeconds: st.miningStopSeconds ?? null }, env, req, 1);
    st = { ...st, ...r.state }; last = r.signatureFrames!.at(-1);
  }
  return { T: st.temperatureK, C: contrast(last) };
}
test("IR калибровка", { timeout: 600000 }, () => {
  const a100 = run("industrial-S:1:D", 100, true, 900), a250 = run("industrial-S:1:D", 250, true, 900);
  const k = a250.C / a100.C;
  const detectNew = IR_DETECT * k, holdNew = IR_HOLD * k;
  const rows: any[] = [];
  for (const [label, id, mining, sec] of [["Ермак D, 15 мин добычи (эталон)", "industrial-S:1:D", true, 900], ["Ермак D, стоянка 60 мин", "industrial-S:1:D", false, 3600],
    ["Ермак E, стоянка 60 мин", "industrial-S:1:E", false, 3600], ["Титан D, 15 мин добычи", "industrial-M:2:D", true, 900], ["Титан H, 15 мин добычи", "industrial-M:2:H", true, 900]] as [string, string, boolean, number][]) {
    const r100 = run(id, 100, mining, sec), r250 = run(id, 250, mining, sec);
    rows.push({ label, T100: r100.T, T250: r250.T, C100: r100.C, C250: r250.C, km100old: km(r100.C, IR_DETECT), km250old: km(r250.C, IR_DETECT), km250new: km(r250.C, detectNew) });
  }
  writeFileSync(OUT + "ircal.json", JSON.stringify({ anchor100: a100, anchor250: a250, k, detectNew, holdNew, rows }, null, 1));
});
