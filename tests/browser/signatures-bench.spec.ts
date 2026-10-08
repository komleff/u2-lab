import { test, expect, type Page } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";


async function installSignatureProbe(page: Page, collectSnapshots = false) {
  page.on("console", message => { if (message.text().startsWith("WORKER_PROGRESS ")) console.log(message.text()); });
  await page.addInitScript((collectSnapshots: boolean) => {
    const W = Worker; let lastLog = -Infinity, chunks = 0;
    Object.assign(window, { signatureMessages: [], signatureComplete: null, signatureWorkerErrors: [], signatureLastCommand: null });
    window.Worker = class extends W {
      constructor(...args: any[]) {
        super(args[0], args[1]);
        this.addEventListener("error", e => { (window as any).signatureWorkerErrors.push(e.message); console.log("WORKER_PROGRESS " + JSON.stringify({ type: "worker-error", message: e.message })); });
        this.addEventListener("message", e => {
          const m = e.data;
          if (collectSnapshots && ["snapshot", "complete"].includes(m.type)) (window as any).signatureMessages.push(structuredClone(m));
          if (m.type === "complete") (window as any).signatureComplete = m.payload;
          if (m.type === "error") (window as any).signatureWorkerErrors.push(m.payload);
          if (m.type === "chunk") chunks++;
          const wallMs = performance.now();
          if (["complete", "error"].includes(m.type) || (m.type === "chunk" && wallMs - lastLog >= 5000)) {
            lastLog = wallMs;
            console.log("WORKER_PROGRESS " + JSON.stringify({ type: m.type, wallMs, timeS: m.payload?.state?.timeSeconds ?? null, chunks, control: (window as any).signatureLastCommand, error: m.type === "error" ? m.payload : null }));
          }
        });
      }
      postMessage(message: any, ...args: any[]) {
        if (message.type !== "telemetry-ack") (window as any).signatureLastCommand = { type: message.type, maxSteps: message.payload?.maxSteps };
        return (super.postMessage as any)(message, ...args);
      }
    };
  }, collectSnapshots);
}

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
  await installSignatureProbe(page, true);
  const tap=async(id:string)=>{await page.locator(id).scrollIntoViewIfNeeded();await page.locator(id).click();};
  const more=async()=>{await page.locator("#fit-more").evaluate(n=>(n as HTMLDetailsElement).open=true);};
  const exported=async(id:string)=>{const d=page.waitForEvent("download");await tap(id);return await readFile((await(await d).path())!,"utf8");};
  await page.goto("/");await expect(page.locator("#sig-mode")).toBeChecked({timeout:2000});
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
  await page.locator("#fit-speed").selectOption("20000");await tap("#fit-resume");
  expect(await page.evaluate(()=>(window as any).signatureLastCommand)).toEqual({type:"resume",maxSteps:20000});
  await expect(page.locator("#fit-status")).toContainText("Завершён",{timeout:30000});
  await expect(page.locator("#sig-measurements")).toContainText("IR");await expect(page.locator("#sig-observer-view")).not.toContainText("16000");
  expect(errors).toEqual([]);const snapshotsPath=info.outputPath("signature-worker-snapshots.json");await writeFile(snapshotsPath,JSON.stringify(await page.evaluate(()=>(window as any).signatureMessages),(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));await info.attach("signature-worker-snapshots",{path:snapshotsPath,contentType:"application/json"});
});

test("SS12/16 real Worker completes a 3600-second signature horizon with station service and separate instrument",async({page},info)=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await installSignatureProbe(page);
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
