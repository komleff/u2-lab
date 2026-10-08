import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("SS00/12 an invalid actual-source mapping exits the real Worker run with a visible error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const input = JSON.parse(await readFile("tests/signatures/fixtures/bench-input.json", "utf8"));
  input.environment.law = "linear-fog-experiment";
  input.environment.linearWK = 100;
  await page.goto("/");
  await page.locator("#fit-import").setInputFiles({ name: "invalid-source.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(input)) });
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-error")).toContainText("mapping");
  await expect(page.locator("#fit-pause")).toBeDisabled();
  await expect(page.locator("#fit-start")).toBeEnabled();
  await expect(page.locator("#fit-time")).toContainText("0 с");
  expect(errors).toEqual([]);
});

test("SS12/13 actual Worker signature bench keeps active inputs and resumes serialized paid queues",async({page},info)=>{
  test.setTimeout(60000);
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{const W=Worker;(window as any).signatureMessages=[];window.Worker=class extends W{constructor(...args:any[]){super(args[0],args[1]);this.addEventListener("message",e=>{if(["snapshot","complete"].includes(e.data.type))(window as any).signatureMessages.push(structuredClone(e.data));});}};});
  const tap=async(id:string)=>{await page.locator(id).scrollIntoViewIfNeeded();await page.locator(id).click();};
  const more=async()=>{await page.locator("#fit-more").evaluate(n=>(n as HTMLDetailsElement).open=true);};
  const exported=async(id:string)=>{const d=page.waitForEvent("download");await tap(id);return await readFile((await(await d).path())!,"utf8");};
  await page.goto("/");await expect(page.locator("#sig-mode")).not.toBeChecked({timeout:2000});
  await page.locator("#fit-preset").selectOption("pony:1");await page.locator("#sig-mode").check();
  await expect(page.locator("#sig-range")).toHaveValue("16");await expect(page.locator("#sig-radar")).not.toBeChecked();
  await page.locator("#sig-radar").check();await page.locator("#fit-speed").selectOption("1");
  await page.locator("#fit-duration").fill("30");await page.locator("#fit-duration").blur();await tap("#fit-start");
  await expect(page.locator("#fit-time")).not.toHaveText("0 с / 30 с");await tap("#fit-pause");await expect(page.locator("#fit-status")).toContainText("Пауза");
  await tap("#fit-freeze");await more();const saved=JSON.parse(await exported("#fit-export-result"));
  expect(saved.spec.schemaVersion).toBe("u2-lab/3");expect(saved.signatures.radar.pending.length).toBeGreaterThan(0);
  await page.locator("#sig-aspect").selectOption("180");await page.locator("#sig-range").fill("9");await page.locator("#sig-range").blur();
  expect(JSON.parse(await exported("#fit-export-run")).signatures.rangeM).toBe(16000);
  const observer=JSON.parse(await exported("#sig-export-observer-json"));expect(JSON.stringify(observer)).not.toMatch(/spec|rangeM|emittedAt|identity|target|temperature/);
  await tap("#fit-reset");await page.locator("#fit-import").setInputFiles({name:"checkpoint.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(saved))});
  await tap("#sig-continue");await expect(page.locator("#fit-time")).not.toHaveText(`${saved.state.timeSeconds} с / 30 с`);
  await tap("#fit-pause");await tap("#fit-step");await expect(page.locator("#fit-status")).toContainText("Пауза");
  await tap("#fit-resume");await page.locator("#fit-speed").selectOption("20000");await expect(page.locator("#fit-status")).toContainText("Завершён",{timeout:30000});
  await expect(page.locator("#sig-measurements")).toContainText("IR");await expect(page.locator("#sig-observer-view")).not.toContainText("16000");
  expect(errors).toEqual([]);const snapshotsPath=info.outputPath("signature-worker-snapshots.json");await writeFile(snapshotsPath,JSON.stringify(await page.evaluate(()=>(window as any).signatureMessages),(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));await info.attach("signature-worker-snapshots",{path:snapshotsPath,contentType:"application/json"});
});

test("SS12/16 real Worker completes a 3600-second signature horizon with station service and separate instrument",async({page},info)=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{const W=Worker;(window as any).signatureComplete=null;(window as any).signatureWorkerErrors=[];window.Worker=class extends W{constructor(...args:any[]){super(args[0],args[1]);this.addEventListener("error",e=>(window as any).signatureWorkerErrors.push(e.message));this.addEventListener("message",e=>{if(e.data.type==="complete")(window as any).signatureComplete=e.data.payload;if(e.data.type==="error")(window as any).signatureWorkerErrors.push(e.data.payload);});}};});
  await page.goto("/");await page.locator("#fit-preset").selectOption("pony:1");await page.locator("#sig-mode").check();await page.locator("#sig-radar").check();
  await page.locator("#fit-distance").fill("0");await page.locator("#fit-distance").blur();await page.locator("#fit-target").fill("10000");await page.locator("#fit-target").blur();
  await page.locator("#fit-duration").fill("3600");await page.locator("#fit-duration").blur();await page.locator("#fit-speed").selectOption("20000");
  await page.locator("#fit-start").click();await expect.poll(()=>page.evaluate(()=>(window as any).signatureComplete!==null||(window as any).signatureWorkerErrors.length>0),{timeout:100000}).toBe(true);
  expect(await page.evaluate(()=>(window as any).signatureWorkerErrors)).toEqual([]);
  const r=await page.evaluate(()=>(window as any).signatureComplete);
  expect(r.state.timeSeconds).toBe(3600);expect(r.signatures.timeS).toBe(3600);expect(r.state.mission.elapsed.service).toBeGreaterThan(0);
  expect(r.signatures.instrument.rfExportJ).toBeGreaterThan(0);expect(r.signatures.sourceStats.IRobserver.total.durationS).toBe(3600);expect(errors).toEqual([]);
  const resultPath=info.outputPath("real-worker-3600-result.json");await writeFile(resultPath,JSON.stringify(r,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));await info.attach("real-worker-3600-result",{path:resultPath,contentType:"application/json"});
});
