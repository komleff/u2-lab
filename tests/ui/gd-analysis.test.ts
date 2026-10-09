import { describe, expect, it } from "vitest";
import native from "../signatures/fixtures/received-result.json";
import type { RunResultV2 } from "../../src/runner/run";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { channelsView } from "../../src/app/fitting-ui/lab-channels";
import { frozenCompare } from "../../src/app/fitting-ui/compare-view";
import { conditionDifferences, measuredIdentity } from "../../src/app/fitting-ui/result-context";
import { distance, signatureReach } from "../../src/app/fitting-ui/signature-distance";
import { signatureComparison } from "../../src/app/fitting-ui/signature-comparison";
import { num } from "../../src/app/fitting-ui/presentation";
import { compareMissionConditions } from "../../src/scenarios/mission";
import { statisticsView, emptyStatistics } from "../../src/signatures/statistics";
import { exportObserverJson, exportObserverCsv, exportSignatureCsv } from "../../src/signatures/io";

const receipt = () => structuredClone(native) as unknown as RunResultV2;
function frozen(a: RunResultV2, b?: RunResultV2) {
  const w = new FittingWorkspace(getPresetFit("pony:1"), loadCandidateCatalog());
  w.showRun(a); expect(w.freeze()).toBe(true); w.select("B");
  if (b) w.showRun(b);
  return w;
}
const strip = (html: string) => html.replace(/<[^>]*>/g, " ");

describe("UI4.8 analysis of saved measurements", () => {
  it("places the sole common time picker before the overview figures", () => {
    const r = receipt(), html = channelsView(r, { group: "energy", unit: "W", hidden: new Set(), eventIndex: 0, bucketIndex: 0 });
    expect(html.match(/id="chart-bucket"/g)).toHaveLength(1);
    expect(html.indexOf('id="chart-bucket"')).toBeLessThan(html.indexOf('class="overview-charts"'));
  });
  it("shows optional A/B/Δ powers and own preset reach from full statistics without mutation", () => {
    const a = receipt(), b = receipt(); b.runId = "other-result";
    b.spec.signatures!.observerPreset = "M-3in1-G1"; b.spec.signatures!.aspectDeg = 180; b.spec.signatures!.advancedIr = true;
    const w = frozen(a, b), before = JSON.stringify(w.snapshot()), raw = [exportObserverJson(a), exportObserverCsv(a), exportSignatureCsv(a)];
    const html = frozenCompare(w), section = html.slice(html.indexOf('id="signature-comparison"'));
    expect(section).toContain("Сигнатуры и расчётные дальности A/B");
    expect(section).not.toMatch(/<details[^>]*\bopen/);
    for (const [channel, source] of [["IR", "IRobserver"], ["EM", "EM"]] as const) {
      const stats = statisticsView(a.signatures!.sourceStats[source]); if (stats.status !== "measured") throw Error("fixture");
      expect(section).toContain(num(stats.mean, "Вт")); expect(section).toContain(num(stats.max, "Вт"));
      expect(section).toContain(distance(signatureReach(a, channel).meanPowerM));
      expect(section).toContain(distance(signatureReach(b, channel).maxM));
    }
    expect(section).toContain("S-dedicated-G1"); expect(section).toContain("M-3in1-G1");
    expect(section).toContain("180 °"); expect(section).toContain("расширенный IR");
    expect(section).toContain("Контекст A/B отличается");
    expect(section).toContain("не средняя дальность по времени");
    expect(section).toContain("не полученный контакт");
    expect(JSON.stringify(w.snapshot())).toBe(before);
    expect([exportObserverJson(a), exportObserverCsv(a), exportSignatureCsv(a)]).toEqual(raw);
  });
  it("shows only changed readable leaf pairs before the full raw snapshots", () => {
    const a = receipt().spec, b = structuredClone(a);
    b.signatures!.aspectDeg = 180; b.environment.effectiveBackgroundK = 120;
    const check = compareMissionConditions(a, b), html = conditionDifferences(a, b), main = html.split('<details')[0];
    expect(strip(main)).toContain("Ракурс"); expect(strip(main)).toMatch(/0 °.*180 °/s);
    expect(strip(main)).toContain("Температура фона"); expect(strip(main)).toMatch(/100 K.*120 K/s);
    expect(main).not.toContain("observerPreset"); expect(main).not.toContain("geometry");
    expect(html).toContain("Полные условия A/B · JSON"); expect(html).toContain("observerPreset");
    expect(compareMissionConditions(a, b)).toEqual(check);
  });
  it("keeps the main identity compact while retaining full measured passports in details", () => {
    const a = receipt(), html = frozenCompare(frozen(a));
    expect(measuredIdentity(a)).toContain("частичный");
    expect(measuredIdentity(a)).not.toContain(a.runId); expect(measuredIdentity(a)).not.toContain(a.spec.modelVersion);
    expect(html).toContain("Паспорт измерения A"); expect(html).toContain(a.runId); expect(html).toContain(a.spec.modelVersion);
  });
  it("preserves unknown paths, arrays, additions, removals and escaping in leaf display", () => {
    const a = receipt().spec, b = structuredClone(a);
    Object.assign(a.environment, { custom: { list: [1, 2], removed: "<old>" } });
    Object.assign(b.environment, { custom: { list: [1, 3, 4], added: "<script>" } });
    const html = conditionDifferences(a, b), main = html.split('<details')[0];
    expect(main).toContain("environment.custom.list[1]"); expect(main).not.toContain("environment.custom.list[0]");
    expect(main).toContain("environment.custom.list[2]"); expect(main).toContain("отсутствует");
    expect(main).toContain("environment.custom.removed"); expect(main).toContain("environment.custom.added");
    expect(html).not.toContain("<script>"); expect(html).toContain("&lt;script&gt;");
  });
  it("distinguishes measured zero, absent statistics and missing B", () => {
    const a = receipt();
    for (const source of ["IRobserver", "EM"] as const) {
      const total = a.signatures!.sourceStats[source].total;
      Object.assign(total, { integral: 0, min: 0, max: 0, liveValue: 0 });
    }
    const b = receipt(); b.runId = "absent";
    b.signatures!.sourceStats.IRobserver = emptyStatistics(); b.signatures!.sourceStats.EM = emptyStatistics();
    const section = frozenCompare(frozen(a, b)).split('id="signature-comparison"')[1];
    expect(section).toContain("0 Вт"); expect(section).toContain("0 м"); expect(section).toContain("—");
    expect(frozenCompare(frozen(a))).toContain("B ещё не запускался");
  });
  it("labels changed interval context and preserves saved A/B after next-draft edits", () => {
    const a = receipt(), b = receipt(); b.runId = "shorter"; b.metrics.durationSeconds -= 1;
    const w = frozen(a, b), before = frozenCompare(w);
    expect(before).toContain("Контекст A/B отличается");
    w.setConditions({ ...w.getSelected().conditions, temperatureK: 330 });
    const after = frozenCompare(w);
    expect(after).toContain("устарело");
    expect(after.split('id="signature-comparison"')[1]).toBe(before.split('id="signature-comparison"')[1]);
  });
  it("uses saved statistics instead of retained bins and preserves signed reach deltas", () => {
    const a = receipt(), b = receipt(); b.spec.signatures!.observerPreset = "S-3in1-G1";
    const before = signatureComparison(a, b);
    b.signatures!.buckets = []; a.signatures!.buckets = [];
    expect(signatureComparison(a, b)).toBe(before);
    for (const channel of ["IR", "EM"] as const) {
      const block = before.split(`data-signature-comparison="${channel}"`)[1].split('</section>')[0];
      const rows = [...block.matchAll(/data-signature-metric="\d"[\s\S]*?<\/dd>/g)].map(row => [...row[0].matchAll(/<strong class="measurement-value">([^<]*)<\/strong>/g)].map(v => v[1]));
      const stats = statisticsView(a.signatures!.sourceStats[channel === "IR" ? "IRobserver" : "EM"]); if (stats.status !== "measured") throw Error("fixture");
      expect(rows[0]).toEqual([num(stats.mean, "Вт"), num(stats.mean, "Вт"), "0 Вт"]);
      expect(rows[1]).toEqual([num(stats.max, "Вт"), num(stats.max, "Вт"), "0 Вт"]);
      const x = signatureReach(a, channel), y = signatureReach(b, channel);
      expect(rows[2]).toEqual([distance(x.meanPowerM), distance(y.meanPowerM), "−" + distance(x.meanPowerM! - y.meanPowerM!)]);
      expect(rows[3]).toEqual([distance(x.maxM), distance(y.maxM), "−" + distance(x.maxM! - y.maxM!)]);
    }
  });
});
