import { test, expect } from "@playwright/test";
test("runnable Russian lab: S/M, charts, pause/step/reset, immutable A/B and safe import", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Power & Heat Lab" }),
  ).toBeVisible();
  await expect(page.locator("#modules")).toContainText("generator");
  await page.locator("#duration").fill("14");
  await page.getByRole("button", { name: "Запуск", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Завершён");
  await expect(page.locator("#work")).not.toHaveText("0");
  await page.getByRole("button", { name: "Зафиксировать A" }).click();
  await expect(page.locator("#comparison")).toContainText("A сохранён");
  await page.locator("#preset").selectOption("1");
  await page.getByRole("button", { name: "Запуск", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Завершён");
  await expect(page.locator("#comparison")).toContainText("M");
  await expect(page.locator("#comparison")).toContainText("Различия");
  const prior = await page.locator("#duration").inputValue();
  await page.locator("#import").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.locator("#error")).toContainText("$");
  expect(await page.locator("#duration").inputValue()).toBe(prior);
  await page.locator("#duration").fill("43200");
  await page.locator("#acceleration").selectOption("1");
  await page.getByRole("button", { name: "Запуск", exact: true }).click();
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Пауза");
  await page.getByRole("button", { name: "Шаг", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Шаг");
  await page.getByRole("button", { name: "Сброс", exact: true }).click();
  await expect(page.locator("#time")).toHaveText("0 s");
  await page.waitForTimeout(150);
  await expect(page.locator("#time")).toHaveText("0 s");
});
test("small screen keeps config charts and journal accessible, all runtime assets local", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173")) remote.push(r.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#configuration")).toBeVisible();
  await expect(page.locator("#power-chart")).toBeVisible();
  await expect(page.locator("#events")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(remote).toEqual([]);
});
test("real Worker controls ACK below500ms with40000 retained buckets and missing telemetry ACK", async ({
  page,
}) => {
  const { readdirSync } = await import("node:fs");
  const { presets, markEdits } = await import("../../src/catalog/presets");
  const file = readdirSync("dist/assets").find(
    (n) => n.startsWith("worker-") && n.endsWith(".js"),
  )!;
  const p = structuredClone(presets[0]);
  p.durationSeconds = 43200;
  p.stepSeconds = 1;
  p.ship.modules = [];
  p.ship.hullPowerW = 0;
  p.ship.hullRadiationM2 = 0;
  p.scenario.phases = [
    { id: "idle", action: "idle", durationSeconds: 43200, duty: 0 },
  ];
  markEdits(p);
  await page.goto("/");
  const evidence = await page.evaluate(
    async ({ p, file }) => {
      return await new Promise<any>((resolve, reject) => {
        const worker = new Worker("/assets/" + file, { type: "module" });
        let heldChannels = 0;
        let held = 0,
          pauseStart = 0,
          cancelStart = 0,
          pauseMs = 0;
        const timer = setTimeout(
          () => reject(new Error("Worker latency timeout")),
          10000,
        );
        worker.onmessage = (e) => {
          const m = e.data;
          if (m.type === "error") reject(new Error(m.payload));
          if (m.type === "chunk") {
            if (m.payload.retention.buckets >= 40000 && !held) {
              held = m.payload.retention.buckets;
              heldChannels = m.payload.channels.length;
              pauseStart = performance.now();
              worker.postMessage({
                runId: "late",
                commandId: 2,
                type: "pause",
              });
            } else if (!held)
              worker.postMessage({
                runId: "late",
                type: "telemetry-ack",
                chunkId: m.chunkId,
              });
          }
          if (m.type === "control-ack" && m.commandId === 2) {
            pauseMs = performance.now() - pauseStart;
            cancelStart = performance.now();
            worker.postMessage({ runId: "late", commandId: 3, type: "cancel" });
          }
          if (m.type === "control-ack" && m.commandId === 3) {
            const cancelMs = performance.now() - cancelStart;
            clearTimeout(timer);
            worker.terminate();
            resolve({
              buckets: held,
              channels: heldChannels,
              physicsDtSeconds: p.stepSeconds,
              pauseMs,
              cancelMs,
              chromium: navigator.userAgent,
            });
          }
        };
        worker.postMessage({
          runId: "late",
          commandId: 1,
          type: "start",
          payload: { spec: p, maxSteps: 2000 },
        });
      });
    },
    { p, file },
  );
  expect(evidence.buckets).toBeGreaterThanOrEqual(40000);
  expect(evidence.pauseMs).toBeLessThan(500);
  expect(evidence.cancelMs).toBeLessThan(500);
  if (process.env.U2_BROWSER_REPORT) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      process.env.U2_BROWSER_REPORT,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  }
  console.log(JSON.stringify(evidence));
});

test("own app screenshots", async ({ page }) => {
  test.skip(!process.env.U2_SCREENSHOTS);
  await page.goto("/");
  await page.getByRole("button", { name: "Запуск", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Завершён");
  await page.screenshot({
    path: "docs/verification/lab-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/verification/lab-mobile.png",
    fullPage: true,
  });
});
test("step after reset starts an experiment and editing next preset keeps active run stocks", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#duration").fill("43200");
  await page.locator("#acceleration").selectOption("1");
  await page.getByRole("button", { name: "Сброс", exact: true }).click();
  await page.getByRole("button", { name: "Шаг", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Шаг");
  await expect(page.locator("#time")).not.toHaveText("0 s");
  await page.locator("#preset").selectOption("1");
  await page.getByRole("button", { name: "Шаг", exact: true }).click();
  await page.waitForTimeout(100);
  const soc = Number((await page.locator("#soc").innerText()).replace("%", ""));
  expect(soc).toBeGreaterThan(99);
});
test('RV-B3/P12 advanced JSON renders HTML-like imported tank IDs as literal text', async ({page}) => {
  const {presets, markEdits} = await import('../../src/catalog/presets');
  const p = structuredClone(presets[0]);
  const injected = '<b>tank</b> "quoted"';
  const original = p.ship.tanks[0].id;
  p.ship.tanks[0].id = injected;
  for (const m of p.ship.modules) if (m.tankId === original) m.tankId = injected;
  p.initial.fuelKg[injected] = p.initial.fuelKg[original]; delete p.initial.fuelKg[original];
  markEdits(p);
  await page.goto('/');
  await page.getByRole('button', {name: 'Все параметры / фазы JSON'}).click();
  await page.locator('#json-editor').fill(JSON.stringify(p));
  await page.getByRole('button', {name: 'Применить', exact: true}).click();
  await expect(page.locator('#editor')).not.toBeVisible();
  await expect(page.locator('#modules')).toContainText(injected);
  await expect(page.locator('#modules b')).toHaveCount(0);
});
test('LAN HTTP insecure origin supports fresh start/reset/second start/step run IDs', async ({page}) => {
  const {resolve} = await import('node:path');
  const origin = 'http://u2-lab-lan.test:4173';
  await page.context().route(origin + '/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({path: resolve('dist', path === '/' ? 'index.html' : '.' + path)});
  });
  await page.addInitScript(() => {
    (window as any).__labCommands = [];
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: any, ...rest: any[]) {
      (window as any).__labCommands.push({type: message.type, runId: message.runId});
      return (post as any).call(this, message, ...rest);
    };
  });
  const errors: string[] = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(origin);
  await expect(page.locator('footer')).toContainText('v0.1.1');
  const capabilities = await page.evaluate(() => ({origin: location.origin, secure: isSecureContext,
    randomUUID: typeof crypto.randomUUID, getRandomValues: typeof crypto.getRandomValues}));
  expect(capabilities).toMatchObject({secure: false, randomUUID: 'undefined', getRandomValues: 'function'});
  await page.locator('#duration').fill('14');
  await page.getByRole('button', {name: 'Запуск', exact: true}).click();
  await expect(page.locator('#status')).toContainText('Завершён');
  await page.getByRole('button', {name: 'Сброс', exact: true}).click();
  await expect(page.locator('#time')).toHaveText('0 s');
  await page.getByRole('button', {name: 'Запуск', exact: true}).click();
  await expect(page.locator('#status')).toContainText('Завершён');
  await page.getByRole('button', {name: 'Сброс', exact: true}).click();
  await page.locator('#duration').fill('43200'); await page.locator('#acceleration').selectOption('1');
  await page.getByRole('button', {name: 'Шаг', exact: true}).click();
  await expect(page.locator('#status')).toContainText('Шаг');
  await expect(page.locator('#time')).not.toHaveText('0 s');
  const commands = await page.evaluate(() => (window as any).__labCommands as {type: string; runId: string}[]);
  const starts = commands.filter(c => c.type === 'start').map(c => c.runId);
  expect(starts).toHaveLength(3); expect(new Set(starts).size).toBe(3);
  expect(starts.every(id => id.length >= 32)).toBe(true); expect(errors).toEqual([]);
  const evidence = {capabilities, starts, errors, chromium: page.context().browser()?.version(),
    mapping: 'Identical own dist assets fulfilled at a non-local HTTP origin; actual secure-context settings unchanged; physical LAN device not tested'};
  if (process.env.U2_LAN_HTTP_REPORT) {
    const {writeFileSync} = await import('node:fs');
    writeFileSync(process.env.U2_LAN_HTTP_REPORT, JSON.stringify(evidence, null, 2) + '\n');
  }
  console.log(JSON.stringify(evidence));
});
