import { openTimedDraft } from "./timed-draft";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun, runChunk, result } from "../../src/runner/run";
for (const width of [1440, 390]) test(`P05 native Pony new/old edition mounting, Worker and JSON at ${width}`, async ({ browser }, info) => {
  test.setTimeout(90000);
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390, acceptDownloads: true });
  const page = await context.newPage(), errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => {
    const NativeWorker = Worker;
    (window as any).__ponyStarts = [];
    window.Worker = class extends NativeWorker {
      postMessage(message: any, ...args: any[]) {
        if (message.type === "start") (window as any).__ponyStarts.push(message);
        return (super.postMessage as any)(message, ...args);
      }
    };
  });
  const action = async (selector: string) => { const b = page.locator(selector); await b.evaluate(n => n.scrollIntoView({ block: "center" })); if (width === 390) await b.tap(); else await b.click(); };
  const details = async () => { if (!await page.locator("#fit-more").evaluate(n => (n as HTMLDetailsElement).open)) await action("#fit-f3"); };
  const expand = async () => { if (await page.locator('[data-group="signature"]').getAttribute("aria-expanded") === "false") await action('[data-group="signature"]'); };
  const open = async (doc: unknown) => page.locator("#fit-import").setInputFiles({ name: "pony.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(doc)) });
  const exported = async (selector: string) => { const wait = page.waitForEvent("download"); await action(selector); if (selector === "#fit-save") await action("#fit-save-confirm"); return JSON.parse(await readFile((await (await wait).path())!, "utf8")); };
  const replace = async (slot: string, item: string) => { await expand(); await action("#slot-" + slot); await action(`[data-candidate="${item}"]`); await action("#fit-apply"); };
  const shortRun = async () => {
    for (const [field, value] of [["duration", "5.25"], ["dt", ".25"], ["approach", "1"], ["work-seconds", "2"], ["braking", "1"], ["service", "1"], ["idle", "1"]]) await page.locator("#fit-" + field).fill(value);
    await page.locator("#fit-speed").selectOption("20000"); await action("#fit-start"); await expect(page.locator("#fit-status")).toContainText("Завершён");
    await details(); const fit = await exported("#fit-save"), spec = await exported("#fit-export-run"), result = await exported("#fit-export-result");
    expect(result.spec).toEqual(spec); expect(spec.resolvedShip.fit).toEqual(fit); expect(result.state.timeSeconds).toBe(5.25); expect(result.metrics.usefulWork).toBeGreaterThan(0);
    return { fit, spec, result };
  };
  await page.goto("/"); await expect(page.locator("#fit-preset")).toBeVisible(); await page.locator("#fit-preset").selectOption("pony:1"); await expand();
  await expect(page.locator("#slot-signature-2")).toHaveCount(0); await expect(page.locator("#fit-edition")).toContainText("0.2.5"); await openTimedDraft(page,getPresetFit("pony:2"));
  await replace("signature-1", "radiator-active-S"); const current = await shortRun(); expect(current.fit.catalogVersion).toBe("ship-fitting-0.2.3");
  for (const doc of [current.fit, current.spec, current.result]) { await page.reload(); await open(doc); await expand(); await expect(page.locator("#slot-signature-2")).toHaveCount(0); await expect(page.locator("#fit-edition")).toContainText("0.2.3"); }
  await details(); expect(await exported("#fit-export-result")).toEqual(current.result);
  await open(getPresetFit("pony:2", "ship-fitting-0.2.1")); await expand(); await expect(page.locator("#slot-signature-2")).toBeVisible(); await expect(page.locator("#fit-edition")).toContainText("0.2.1");
  await replace("signature-2", "radiator-passive-S"); await openTimedDraft(page,await exported("#fit-save")); const previous = await shortRun(); expect(previous.fit.catalogVersion).toBe("ship-fitting-0.2.1");
  expect(previous.spec.resolvedShip.hull.slots.filter((s: any) => s.category === "signature")).toHaveLength(2);
  for (const doc of [previous.fit, previous.spec, previous.result]) { await page.reload(); await open(doc); await expand(); await expect(page.locator("#slot-signature-2")).toBeVisible(); }
  await details(); expect(await exported("#fit-export-result")).toEqual(previous.result);
  const source = JSON.parse((await page.locator("#fit-sources").textContent())!); expect(source.hull.slots.filter((s: any) => s.category === "signature")).toHaveLength(2);
  await page.locator("#fit-duration").fill("180"); await page.locator("#fit-duration").press("Tab"); await page.locator("#fit-speed").selectOption("1"); await action("#fit-start");
  expect(await page.evaluate(() => (window as any).__ponyStarts.map((s: any) => ({ duration: s.payload.spec.durationSeconds, edition: s.payload.spec.catalogVersion, maxSteps: s.payload.maxSteps })))).toEqual([{ duration: 180, edition: "ship-fitting-0.2.1", maxSteps: 1 }]);
  await expect(page.locator("#fit-pause")).toBeEnabled();
  await action("#fit-pause"); await expect(page.locator("#fit-status")).toContainText("Пауза"); await action("#fit-freeze"); await expect(page.locator(".ab-side-a")).toContainText("Снимок A");
  const frozen = await page.locator(".ab-side-a").innerHTML(), active = await exported("#fit-export-run");
  await action('[data-variant="B"][aria-pressed]'); await page.locator("#fit-preset").selectOption("pony:1"); await expand(); await expect(page.locator("#slot-signature-2")).toHaveCount(0);
  expect(await exported("#fit-export-run")).toEqual(active); expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  await action("#fit-cancel"); await action("#cancel-yes"); await expect(page.locator("#fit-active-owner")).toContainText("активного теста нет");
  const before = await exported("#fit-save"), falseClaim = structuredClone(previous.fit); falseClaim.catalogVersion = "ship-fitting-0.2.2"; await open(falseClaim);
  await expect(page.locator("#fit-error")).not.toBeEmpty(); expect(await exported("#fit-save")).toEqual(before); expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  await action('[data-variant="A"][aria-pressed]'); await details();
  const keepFit = await exported("#fit-save"), keepRun = await exported("#fit-export-run"), keepResult = await exported("#fit-export-result");
  const hidden = makeMiningRun(getPresetFit("pony:2", "ship-fitting-0.2.1"), loadCandidateCatalog("ship-fitting-0.2.1"), { durationSeconds: 1, stepSeconds: 1 });
  if (!hidden.ok) throw Error("counterexample fixture");
  hidden.value.catalogVersion = hidden.value.resolvedShip.fit.catalogVersion = "ship-fitting-0.2.2";
  const hiddenId = hidden.value.resolvedShip.fit.assignments["signature-2"];
  delete hidden.value.resolvedShip.fit.assignments["signature-2"]; delete hidden.value.resolvedShip.fit.instances[hiddenId];
  const hiddenRun = createRun("hidden-mount", hidden.value); runChunk(hiddenRun, 10);
  const hiddenResult = JSON.parse(JSON.stringify(result(hiddenRun), (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v));
  expect(hiddenResult.state.buffersJ[hiddenId]).toBeCloseTo(20e6, 5);
  for (const doc of [hidden.value, hiddenResult]) {
    await open(doc); await expect(page.locator("#fit-error")).not.toBeEmpty();
    expect(await exported("#fit-save")).toEqual(keepFit); expect(await exported("#fit-export-run")).toEqual(keepRun); expect(await exported("#fit-export-result")).toEqual(keepResult);
    expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  }
  const geometry = await page.evaluate(() => ({ inner: innerWidth, document: document.documentElement.scrollWidth, visual: visualViewport!.width })); expect(geometry).toEqual({ inner: width, document: width, visual: width }); expect(errors).toEqual([]);
  await info.attach("pony-native-editions", { body: JSON.stringify({ width, current, previous, active, geometry, errors }), contentType: "application/json" }); await context.close();
});
