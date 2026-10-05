import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const urls = process.argv.slice(2);
assert.ok(
  urls.length,
  "Supply actual extracted-dist HTTP and prefixed HTTPS URLs",
);
const browser = await chromium.launch({ headless: true });
const evidence = [];
try {
  for (const url of urls) {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage(),
      requests = [],
      errors = [],
      failed = [];
    page.on("request", (r) => requests.push(r.url()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().endsWith("favicon.ico"))
        failed.push({ url: r.url(), status: r.status() });
    });
    await page.goto(url);
    await page.getByRole("heading", { name: "U2 Ship Fitting" }).waitFor();
    assert.match(await page.locator("#fit-version").innerText(), /0\.2\.0/);
    const capabilities = await page.evaluate(() => ({
      origin: location.origin,
      secure: isSecureContext,
      getRandomValues: typeof crypto.getRandomValues,
      randomUUID: typeof crypto.randomUUID,
    }));
    if (
      new URL(url).protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
    ) {
      assert.equal(capabilities.secure, false);
      assert.equal(capabilities.randomUUID, "undefined");
    }
    await page.locator("#fit-duration").fill("12");
    await page.locator("#fit-start").click();
    await page.locator("#fit-status").filter({ hasText: "Завершён" }).waitFor();
    const first = await page.locator("#fit-result").innerText();
    assert.match(first, /SCU\/h/);
    await page.locator("#fit-reset").click();
    assert.equal(await page.locator("#fit-time").innerText(), "0 s");
    await page.locator("#fit-start").click();
    await page.locator("#fit-status").filter({ hasText: "Завершён" }).waitFor();
    await page.locator("#fit-reset").click();
    await page.locator("#fit-step").click();
    await page.locator("#fit-status").filter({ hasText: "Шаг" }).waitFor();
    assert.notEqual(await page.locator("#fit-time").innerText(), "0 s");
    assert.ok(
      (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390,
    );
    const base = new URL(url);
    for (const request of requests) {
      const asset = new URL(request);
      assert.equal(asset.origin, base.origin);
      assert.ok(
        asset.pathname.startsWith(base.pathname),
        "asset escaped prefix: " + request,
      );
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failed, []);
    evidence.push({
      url,
      capabilities,
      requests,
      errors,
      failed,
      version: await page.locator("#fit-version").innerText(),
      checks:
        "extracted dist; 390px; first/reset/second/step; actual Worker; every asset same origin and prefix",
      tls: url.startsWith("https:")
        ? "local TLS emulation; self-signed certificate accepted only by test context; not public Pages"
        : null,
      physicalSecondDevice: "NOT RUN",
      chromium: browser.version(),
    });
    await context.close();
  }
} finally {
  await browser.close();
}
if (process.env.U2_ARTIFACT_REPORT)
  writeFileSync(
    process.env.U2_ARTIFACT_REPORT,
    JSON.stringify(evidence, null, 2) + "\n",
  );
console.log(JSON.stringify(evidence));
