import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("D01/D02/D04/D10 source-derived preview, bidirectional catalogue and whole-card accessible identity", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#fit-preset").selectOption("industrial-L:1");
  await expect(page.locator(".ship-hero")).toHaveAttribute(
    "data-layout",
    "flat",
  );
  await page.locator("#fit-preset").selectOption("pony:3");
  for (const n of [1, 2, 3])
    await expect(
      page.locator("button.module-card").filter({
        has: page.getByRole("heading", { name: `Лазер ${n}`, exact: true }),
      }),
    ).toHaveCount(1);
  await page.locator("#fit-preset").selectOption("sputnik:1");
  await page.locator('button.module-card[data-slot="payload-1"]').click();
  await page.locator('[data-candidate="cargo-universal-S"]').click();
  await expect(page.locator("[data-delta-power-w]")).toHaveAttribute(
    "data-delta-power-w",
    "-3000000",
  );
  await expect(page.locator("[data-delta-mining-scu-s]")).toHaveAttribute(
    "data-delta-mining-scu-s",
    "-0.0625125",
  );
  await page.locator("#swap-family").selectOption("mining");
  await page.locator("#swap-sort").selectOption("power-asc");
  const asc = await page
    .locator("[data-candidate]")
    .evaluateAll((ns) => ns.map((n) => (n as HTMLElement).dataset.candidate));
  await page.locator("#swap-sort").selectOption("power-desc");
  const desc = await page
    .locator("[data-candidate]")
    .evaluateAll((ns) => ns.map((n) => (n as HTMLElement).dataset.candidate));
  expect(desc).not.toEqual(asc);
  await page.locator('[data-catalog-sort="power-asc"]').click();
  await expect(page.locator("#swap-sort")).toHaveValue("power-asc");
  await expect(
    page.locator('[data-candidate="mining-industrial-S"]'),
  ).toContainText("Δ активной колонки");
  await page.keyboard.press("Escape");
  await expect(
    page.locator('button.module-card[data-slot="payload-1"]'),
  ).toBeFocused();
});
test("D03/D05/D06 mobile Compare cards and honest filters expose accepted controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Сравнение", exact: true }).click();
  for (const s of [
    "rate-asc",
    "rate-desc",
    "k-asc",
    "k-desc",
    "diesel-asc",
    "diesel-desc",
  ])
    await page.locator("#compare-sort").selectOption(s);
  await expect(page.locator(".compare-cards")).toBeVisible();
  await expect(page.locator(".compare-cards article")).toHaveCount(3);
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
  await expect(page.locator('[data-event-filter="environment"]')).toBeVisible();
  await expect(page.locator("#event-instance")).toBeDisabled();
  await expect(page.locator("#event-instance-note")).toContainText(
    "отсутствует",
  );
  await page.locator("#fit-duration").fill("14");
  await page.locator("#fit-speed").selectOption("20000");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await page.locator("#fit-freeze").click();
  await page.locator('#fit-comparison [data-ab-view="a"]').click();
  await expect(page.locator("#fit-comparison .ab-side-a")).toBeVisible();
  await expect(page.locator("#fit-comparison .ab-side-b")).toBeHidden();
  await page.locator('#fit-comparison [data-ab-view="b"]').click();
  await expect(page.locator("#fit-comparison .ab-side-b")).toBeVisible();
  await expect(page.locator("#fit-comparison .ab-side-a")).toBeHidden();
});
for (const width of [390, 900])
  test(`D07/D08 touch ${width} Cancel Freeze Reset clears result without changing A and hit targets are reachable`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: true,
    });
    const p = await ctx.newPage();
    await p.goto("/");
    const plus = await p.locator("#fit-add-variant").boundingBox();
    expect(plus!.width).toBeGreaterThanOrEqual(44);
    expect(plus!.height).toBeGreaterThanOrEqual(44);
    await p.getByRole("button", { name: "Power & Heat", exact: true }).tap();
    expect(await p.locator("#fit-speed option").allTextContents()).toEqual([
      "×1",
      "×10",
      "×60",
      "макс",
    ]);
    await p.locator("#fit-duration").fill("3600");
    await p.locator("#fit-speed").selectOption("1");
    for (const id of ["start", "pause", "resume", "step", "cancel", "reset"]) {
      const b = await p.locator("#fit-" + id).boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
    await p.locator("#fit-start").tap();
    await p.locator("#fit-pause").tap();
    await expect(p.locator("#fit-status")).toContainText("Пауза");
    await p.locator("#fit-cancel").tap();
    await p.getByRole("button", { name: "Отменить тест", exact: true }).tap();
    await expect(p.locator("#fit-status")).toContainText("Отменён");
    await p.locator("#fit-freeze").tap();
    const a = await p.locator("#fit-comparison .ab-side-a").textContent();
    await p.locator("#fit-reset").tap();
    await expect(p.locator("#fit-status")).toContainText("Ещё не запускался");
    await expect(p.locator("#fit-time")).toHaveText("0 с / 3 600 с");
    await expect(p.locator("#fit-comparison .ab-side-a")).toHaveText(a!);
    await ctx.close();
  });
test("D07 scheduling speeds leave the numerical snapshot and measured result unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
  await page.locator("#fit-duration").fill("0.05");
  await page.locator("#fit-f3").click();
  const snapshots: any[] = [];
  for (const speed of ["1", "10", "60", "20000"]) {
    await page.locator("#fit-speed").selectOption(speed);
    await page.locator("#fit-start").click();
    await expect(page.locator("#fit-status")).toContainText("Завершён");
    const download = page.waitForEvent("download");
    await page.locator("#fit-export-result").click();
    const d = await download;
    const fs = await import("node:fs/promises");
    const r = JSON.parse(await fs.readFile((await d.path())!, "utf8"));
    snapshots.push({ spec: r.spec, state: r.state, metrics: r.metrics });
    await page.locator("#fit-reset").click();
  }
  for (const snapshot of snapshots) {
    expect(snapshot.state.timeSeconds).toBe(0.05);
    expect(snapshot.metrics.durationSeconds).toBe(0.05);
    expect(snapshot).toEqual(snapshots[0]);
  }
});
test("D09 historical laser channel is not relabelled as replacement cargo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
  await page.locator("#fit-duration").fill("20");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await page.getByRole("button", { name: "Оснастка", exact: true }).click();
  const card = page.locator(".system-payload .module-card").nth(1);
  await expect(card).toContainText("% номинала");
  await page.locator('[data-slot="payload-1"]').last().click();
  await page.locator('[data-candidate="cargo-universal-S"]').click();
  await page.locator("#fit-apply").click();
  await expect(card).not.toContainText("% номинала");
  await expect(card).toContainText("изменено после теста");
});
test("D11 exact Lab 767/768/1279/1280 canvas boundaries", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
  for (const width of [767, 768, 1279, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    const b = await page.evaluate(() => {
      const rect = (s: string) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, b: r.bottom };
      };
      return {
        left: rect(".lab-side"),
        center: rect(".lab-main"),
        right: rect(".lab-right"),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(b.overflow).toBe(false);
    if (width >= 1280) {
      expect(b.left.w).toBe(256);
      expect(b.right.w).toBe(280);
      expect(b.center.w).toBeLessThanOrEqual(824);
      expect(b.left.y).toBe(b.center.y);
      expect(b.right.y).toBe(b.center.y);
    } else {
      expect(b.left.y).toBeGreaterThanOrEqual(b.center.b);
      expect(b.right.y).toBeGreaterThanOrEqual(b.center.b);
      if (width >= 768) expect(b.left.y).toBe(b.right.y);
      else expect(b.right.y).toBeGreaterThanOrEqual(b.left.b);
    }
  }
});
test("D12 true mobile long rejected import preserves viewport, literal errors and native result export", async ({
  browser,
}) => {
  const { loadCandidateCatalog } = await import("../../src/fitting/catalog");
  const { electricFit } = await import("../fitting/input-fixtures");
  const invalid = electricFit(loadCandidateCatalog());
  const roles = ["march", "retro", "strafe", "turn"];
  for (const role of roles) {
    const item =
      invalid.localVariants[
        invalid.instances[invalid.assignments[role]].itemId
      ];
    delete item.numerics.pathEfficiency;
    delete item.origins["numerics.pathEfficiency"];
  }
  const fullError = roles
    .flatMap((role) => [
      `instances.fit:${role}.numerics.pathEfficiency: Обязательное SI поле: pathEfficiency`,
      `instances.fit:${role}.numerics.pathEfficiency: Коэффициент должен быть конечным в (0,1]`,
    ])
    .join("\n");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    acceptDownloads: true,
  });
  try {
    const p = await context.newPage();
    const tap = async (selector: string) => {
      const button = p.locator(selector);
      await button.scrollIntoViewIfNeeded();
      await button.tap();
    };
    const downloaded = async (selector: string) => {
      const wait = p.waitForEvent("download");
      await tap(selector);
      const d = await wait;
      return readFile((await d.path())!);
    };
    const geometry = () =>
      p.evaluate(() => ({
        inner: innerWidth,
        document: document.documentElement.scrollWidth,
        visual: visualViewport!.width,
        scale: visualViewport!.scale,
        touch: navigator.maxTouchPoints > 0,
      }));
    await p.goto("/");
    await p.locator("#fit-preset").selectOption("pony:3");
    await p.getByRole("button", { name: "Power & Heat", exact: true }).tap();
    await p.locator("#fit-duration").fill("3600");
    await p.locator("#fit-speed").selectOption("1");
    await tap("#fit-start");
    await expect(p.locator("#fit-time")).not.toHaveText("0 с / 3 600 с");
    await tap("#fit-pause");
    await expect(p.locator("#fit-status")).toContainText("Пауза");
    await tap("#fit-cancel");
    await tap("#cancel-yes");
    await expect(p.locator("#fit-status")).toContainText("Отменён");
    await tap("#fit-freeze");
    await tap("#fit-f3");
    const beforeFit = await downloaded("#fit-save");
    const beforeResult = await downloaded("#fit-export-result");
    const beforeA = await p.locator("#fit-comparison .ab-side-a").textContent();
    expect(JSON.parse(beforeResult.toString()).status).toBe("cancelled");
    expect(await geometry()).toEqual({
      inner: 390,
      document: 390,
      visual: 390,
      scale: 1,
      touch: true,
    });
    await p
      .locator("#fit-import")
      .setInputFiles({
        name: "missing-path.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(invalid)),
      });
    await expect(p.locator("#fit-error")).toContainText(
      "instances.fit:strafe.numerics.pathEfficiency",
    );
    expect(await p.locator("#fit-error").textContent()).toBe(fullError);
    expect(await geometry()).toEqual({
      inner: 390,
      document: 390,
      visual: 390,
      scale: 1,
      touch: true,
    });
    expect(await downloaded("#fit-export-result")).toEqual(beforeResult);
    expect(await downloaded("#fit-save")).toEqual(beforeFit);
    await expect(p.locator("#fit-comparison .ab-side-a")).toHaveText(beforeA!);
    expect(await p.locator("#fit-error").textContent()).toBe(fullError);
  } finally {
    await context.close();
  }
});
