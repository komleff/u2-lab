import { test, expect } from "@playwright/test";
test("CR-B1/B2 failed fit and numerical snapshot imports preserve last valid fit, result and frozen A", async ({
  page,
}) => {
  const { loadCandidateCatalog, getPresetFit } = await import(
    "../../src/fitting/catalog"
  );
  const { makeMiningRun } = await import("../../src/scenarios/fitting");
  const { electricFit, thermoinverterFit } = await import(
    "../fitting/input-fixtures"
  );
  const c = loadCandidateCatalog(),
    electric = electricFit(c),
    ti = thermoinverterFit(c);
  const badElectric = structuredClone(electric),
    badTi = structuredClone(ti);
  const m =
    badElectric.localVariants[
      badElectric.instances[badElectric.assignments.march].itemId
    ];
  delete m.numerics.pathEfficiency;
  delete m.origins["numerics.pathEfficiency"];
  badTi.localVariants[
    badTi.instances[badTi.assignments["signature-1"]].itemId
  ].numerics.copEfficiency = 0;
  const e = makeMiningRun(electric, c),
    t = makeMiningRun(ti, c),
    normal = makeMiningRun(getPresetFit("sputnik:1"), c);
  if (!e.ok || !t.ok || !normal.ok) throw Error("positive fixture invalid");
  delete e.value.resolvedShip.instances.find((i) => i.role === "march")!.item
    .numerics.pathEfficiency;
  t.value.resolvedShip.instances.find(
    (i) => i.item.family === "thermoinverter",
  )!.item.numerics.copEfficiency = 0;
  const tinyStep = structuredClone(normal.value),
    tinyHorizon = structuredClone(normal.value);
  tinyStep.stepSeconds = 1e-12;
  tinyHorizon.durationSeconds = 1e-12;
  const cases = [
    [badElectric, "pathEfficiency"],
    [badTi, "copEfficiency"],
    [e.value, "pathEfficiency"],
    [t.value, "copEfficiency"],
    [tinyStep, "stepSeconds"],
    [tinyHorizon, "durationSeconds"],
  ] as const;
  await page.goto("/");
  await page.locator("#fit-duration").fill("12");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await page.locator("#fit-freeze").click();
  const result = await page.locator("#fit-result").textContent(),
    revision = await page.locator("#fit-next-revision").textContent(),
    fit = await page.locator("#fit-slots").textContent(),
    a = await page.locator("#fit-comparison").textContent(),
    time = await page.locator("#fit-time").textContent();
  for (const [document, path] of cases) {
    await page
      .locator("#fit-import")
      .setInputFiles({
        name: "invalid.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(document)),
      });
    await expect(page.locator("#fit-error")).toContainText(path);
    await expect(page.locator("#fit-result")).toHaveText(result!);
    await expect(page.locator("#fit-next-revision")).toHaveText(revision!);
    await expect(page.locator("#fit-slots")).toHaveText(fit!);
    await expect(page.locator("#fit-comparison")).toHaveText(a!);
    await expect(page.locator("#fit-time")).toHaveText(time!);
    await expect(page.locator("#fit-status")).toContainText("Завершён");
  }
});
test("reference retro local variant TTX and provenance are explicit in preview and F3 before SKU replacement", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fit-preset").selectOption("pony:1");
  await page.locator("#fit-slot").selectOption("retro");
  await expect(page.locator("#fit-preview")).toContainText("Референсный ретро");
  await expect(page.locator("#fit-preview")).toContainText("Локальный вариант");
  await expect(page.locator("#fit-preview")).toContainText("1180000");
  await page.locator("#fit-f3").click();
  await expect(page.locator("#fit-sources")).toContainText("0.4");
  await expect(page.locator("#fit-sources")).toContainText("§8.2");
  const { readFile } = await import("node:fs/promises");
  for (const button of ["#fit-save", "#fit-export-run"]) {
    const downloaded = page.waitForEvent("download");
    await page.locator(button).click();
    const download = await downloaded,
      path = await download.path();
    if (!path) throw Error("download missing");
    const document = JSON.parse(await readFile(path, "utf8"));
    const fit = document.resolvedShip?.fit ?? document;
    const variant =
      fit.localVariants[fit.instances[fit.assignments.retro].itemId];
    expect(variant.numerics.forceN).toBe(1180000);
    expect(variant.materials[0].massKg).toBe(1060);
    expect(variant.origins["numerics.forceN"].derivation).toContain("0.4");
    if (document.resolvedShip)
      expect(
        document.resolvedShip.instances.find((i: any) => i.role === "retro")
          .item,
      ).toEqual(variant);
  }
  await page.locator("#fit-item").selectOption("engine-diesel-S-single");
  await expect(page.locator("#fit-preview")).toContainText("2950000");
  await expect(page.locator("#fit-preview")).toContainText("1590 kg");
  const sources = JSON.parse(
    (await page.locator("#fit-sources").textContent())!,
  );
  expect(sources.installedItem.id).toBe("pony-engine-retro");
  expect(sources.installedItem.materials[0].massKg).toBe(1060);
  expect(sources.selectedItem.materials[0].massKg).toBe(2650);
  expect(sources.installedLocalVariant).toBe(true);
  expect(sources.selectedLocalVariant).toBe(false);
  await page.locator("#fit-apply").click();
  await expect(page.locator("#fit-preview")).toContainText("2950000");
});
test("v2 real Worker withholds one telemetry chunk, controls ACK below500ms and ignores old-run ACK", async ({
  page,
}) => {
  test.setTimeout(100000);
  const { readdirSync, writeFileSync } = await import("node:fs");
  const { worstRun } = await import("../fitting/worst-fit");
  const file = readdirSync("dist/assets").find(
    (n) => n.startsWith("worker-") && n.endsWith(".js"),
  )!;
  const spec = worstRun(43200, 1);
  await page.goto("/");
  const evidence = await page.evaluate(
    async ({ spec, file }) =>
      new Promise<any>((resolve, reject) => {
        const worker = new Worker("/assets/" + file, { type: "module" });
        let held: any,
          previousTime = 0,
          stage = "fill",
          started = 0,
          pauseMs = 0,
          stepMs = 0,
          cancelMs = 0,
          newChunks = 0,
          newChunkId = 0;
        const timer = setTimeout(() => {
          worker.terminate();
          reject(Error("v2 Worker timeout"));
        }, 90000);
        const control = (type: string, id: number, runId = "held") => {
          started = performance.now();
          worker.postMessage({ runId, commandId: id, type });
        };
        worker.onmessage = (e) => {
          const m = e.data;
          if (m.type === "error") {
            clearTimeout(timer);
            worker.terminate();
            reject(Error(m.payload));
          }
          if (m.type === "chunk" && m.runId === "held") {
            if (stage === "fill" && m.payload.retention.buckets >= 30000) {
              held = m;
              previousTime = m.payload.state.timeSeconds;
              stage = "pause";
              control("pause", 2);
            } else if (stage === "fill")
              worker.postMessage({
                runId: "held",
                type: "telemetry-ack",
                chunkId: m.chunkId,
              });
            else if (stage === "one-step") {
              if (
                Math.abs(m.payload.state.timeSeconds - previousTime - 1) > 1e-6
              )
                reject(Error("Step did not advance exactly one physics dt"));
              stage = "cancel";
              control("cancel", 4);
            }
          }
          if (m.type === "control-ack" && m.runId === "held") {
            if (m.commandId === 2) {
              pauseMs = performance.now() - started;
              stage = "step-ack";
              control("step", 3);
            }
            if (m.commandId === 3) {
              stepMs = performance.now() - started;
              stage = "one-step";
              worker.postMessage({
                runId: "held",
                type: "telemetry-ack",
                chunkId: held.chunkId,
              });
            }
            if (m.commandId === 4) {
              cancelMs = performance.now() - started;
              stage = "new";
              const next = structuredClone(spec);
              next.durationSeconds = 10;
              next.stepSeconds = 0.01;
              worker.postMessage({
                runId: "new",
                commandId: 5,
                type: "start",
                payload: { spec: next, maxSteps: 1 },
              });
            }
          }
          if (m.type === "chunk" && m.runId === "new") {
            newChunks++;
            newChunkId = m.chunkId;
            if (newChunks === 1) {
              worker.postMessage({
                runId: "held",
                type: "telemetry-ack",
                chunkId: 1,
              });
              setTimeout(() => {
                if (newChunks !== 1) {
                  reject(Error("Old ACK released new telemetry slot"));
                  return;
                }
                worker.postMessage({
                  runId: "new",
                  type: "telemetry-ack",
                  chunkId: newChunkId,
                });
              }, 150);
            } else {
              clearTimeout(timer);
              worker.terminate();
              resolve({
                pauseMs,
                stepMs,
                cancelMs,
                heldBuckets: held.payload.retention.buckets,
                channels: held.payload.channels.length,
                maxBuckets: held.payload.retention.maxBuckets,
                oldAckReleasedNew: false,
                oneStepSeconds: 1,
                ackFixturePhysicsDtSeconds: 1,
                chromium: navigator.userAgent,
              });
            }
          }
        };
        worker.postMessage({
          runId: "held",
          commandId: 1,
          type: "start",
          payload: { spec, maxSteps: 20000 },
        });
      }),
    { spec, file },
  );
  expect(evidence.heldBuckets).toBeGreaterThanOrEqual(30000);
  for (const key of ["pauseMs", "stepMs", "cancelMs"])
    expect(evidence[key]).toBeLessThan(500);
  expect(evidence.oldAckReleasedNew).toBe(false);
  if (process.env.U2_FITTING_BROWSER_REPORT)
    writeFileSync(
      process.env.U2_FITTING_BROWSER_REPORT,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  console.log(JSON.stringify(evidence));
});
test("preset slot filtered catalog delta swap run comparison at390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "U2 Ship Fitting" }),
  ).toBeVisible();
  await page.locator("#fit-preset").selectOption("industrial-M:3");
  await page.locator("#fit-slot").selectOption("payload-3");
  await page.locator("#fit-item").selectOption("cargo-bulk-S");
  await expect(page.locator("#fit-preview")).toContainText("После замены");
  await expect(page.locator("#fit-preview")).toContainText("-400");
  await page.locator("#fit-apply").click();
  await expect(page.locator("#fit-slots")).toContainText("навалочный");
  await page.locator("#fit-duration").fill("12");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await expect(page.locator("#fit-result")).toContainText("SCU/h");
  await expect(page.locator("#fit-result")).toContainText(
    "Использование добывающей оснастки",
  );
  await page.locator("#fit-freeze").click();
  await expect(page.locator("#fit-comparison")).toContainText("A сохранён");
  await page.locator("#fit-preset").selectOption("industrial-M:1");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await expect(page.locator("#fit-comparison")).toContainText(
    "Одинаковые условия",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("incomplete fit and incompatible preview explain refusal; builtin and F3 source data visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#fit-builtins")).toContainText(
    "Встроено: заменить нельзя",
  );
  await page.locator("#fit-slot").selectOption("march");
  await page.locator("#fit-all-items").check();
  await page.locator("#fit-item").selectOption("cargo-bulk-S");
  await expect(page.locator("#fit-preview")).toContainText("Семейство");
  await expect(page.locator("#fit-apply")).toBeDisabled();
  await page.locator("#fit-remove").click();
  await expect(page.locator("#fit-start")).toBeDisabled();
  await expect(page.locator("#fit-readiness")).toContainText("march");
  await page.locator("#fit-f3").click();
  await expect(page.locator("#fit-sources")).toContainText("J/(kg");
  await expect(page.locator("#fit-sources")).toContainText("sourceRef");
});
test("edit during run retains running revision and reset rejects late results; zero stocks warn", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fit-duration").fill("43200");
  await page.locator("#fit-speed").selectOption("1");
  await page.locator("#fit-start").click();
  await page.locator("#fit-pause").click();
  await expect(page.locator("#fit-status")).toContainText("Пауза");
  const revision = await page.locator("#fit-running-revision").textContent();
  await page.locator("#fit-slot").selectOption("payload-1");
  await page.locator("#fit-item").selectOption("mining-industrial-S");
  await page.locator("#fit-apply").click();
  await expect(page.locator("#fit-running-revision")).toHaveText(revision!);
  await expect(page.locator("#fit-next-revision")).toContainText("2");
  await page.locator("#fit-reset").click();
  await page.waitForTimeout(100);
  await expect(page.locator("#fit-time")).toHaveText("0 s");
  await page.locator("#fit-charge-fraction").fill("0");
  await page.locator("#fit-fuel-fraction").fill("0");
  await expect(page.locator("#fit-readiness")).toContainText("пуст");
  await expect(page.locator("#fit-start")).toBeEnabled();
});
test("failed import keeps fit and result; HTML label is literal; unknown catalog replay explicit", async ({
  page,
}) => {
  const { getPresetFit, loadCandidateCatalog } = await import(
    "../../src/fitting/catalog"
  );
  const { makeMiningRun } = await import("../../src/scenarios/fitting");
  await page.goto("/");
  await page.locator("#fit-duration").fill("12");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  const prior = await page.locator("#fit-result").textContent();
  const revision = await page.locator("#fit-next-revision").textContent();
  await page.locator("#fit-import").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.locator("#fit-error")).not.toBeEmpty();
  await expect(page.locator("#fit-result")).toHaveText(prior!);
  await expect(page.locator("#fit-next-revision")).toHaveText(revision!);
  const c = loadCandidateCatalog(),
    f = getPresetFit("sputnik");
  f.localVariants.local = {
    ...structuredClone(c.items["mining-civil-S"]),
    id: "local",
    label: "<img src=x onerror=alert(1)>",
  };
  f.instances[f.assignments["payload-1"]].itemId = "local";
  await page.locator("#fit-import").setInputFiles({
    name: "fit.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(f)),
  });
  await expect(page.locator("#fit-slots")).toContainText("<img");
  await expect(page.locator("#fit-slots img")).toHaveCount(0);
  const s = makeMiningRun(getPresetFit("sputnik"), c, { durationSeconds: 12 });
  if (!s.ok) throw Error("missing");
  s.value.catalogVersion = "unknown-snapshot";
  s.value.resolvedShip.fit.catalogVersion = "unknown-snapshot";
  const input = {
    name: "snapshot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s.value)),
  };
  await page.locator("#fit-import").setInputFiles(input);
  await expect(page.locator("#fit-error")).toContainText("Неизвестный каталог");
  await page.locator("#fit-f3").click();
  await page.locator("#fit-allow-snapshot").check();
  await page.locator("#fit-import").setInputFiles(input);
  await expect(page.locator("#fit-replay-note")).toContainText(
    "совместимость слотов не проверена",
  );
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
});
