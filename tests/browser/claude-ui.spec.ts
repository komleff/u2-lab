import { openTimedDraft } from "./timed-draft";
import { test, expect } from "@playwright/test";
test("UI01/08/09 navigation and variant selection preserve one real Worker test owner", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = Worker;
    (window as any).starts = [];
    (window as any).workers = 0;
    window.Worker = class extends Native {
      constructor(url: string | URL, opts?: WorkerOptions) {
        super(url, opts);
        (window as any).workers++;
        const send = this.postMessage.bind(this);
        this.postMessage = ((data: any) => {
          if (data.type === "start")
            (window as any).starts.push({
              runId: data.runId,
              revision: data.payload.spec.resolvedShip.fit.fitRevision,
            });
          send(data);
        }) as any;
      }
    };
  });
  await page.goto("/"); await openTimedDraft(page);
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await page.locator("#fit-duration").fill("3600");
  await page.locator("#fit-speed").selectOption("1");
  await page.locator("#fit-start").click();
  await page.locator("#fit-pause").click();
  await expect(page.locator("#fit-status")).toContainText("Пауза");
  const time = await page.locator("#fit-time").textContent();
  await page.getByRole("link", { name: "Оснастка", exact: true }).click();
  await page.getByRole("button", { name: /Вариант B ·/ }).click();
  await expect(page.locator("#fit-active-owner")).toContainText("A");
  await expect(page.locator("#fit-start")).toBeDisabled();
  await page.getByRole("link", { name: "Сравнение", exact: true }).click();
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await expect(page.locator("#fit-time")).toHaveText(time!);
  expect(await page.evaluate(() => (window as any).starts.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).workers)).toBe(1);
});
test("UI06/07 modal cancel and payload batch are atomic, builtins remain read only", async ({
  page,
}) => {
  await page.goto("/"); await openTimedDraft(page);
  await page.locator("#fit-preset").selectOption("pony:1");
  const revision = await page.locator("#fit-next-revision").textContent();
  await page.locator('[data-slot="payload-1"]').last().click();
  await page.locator('[data-candidate="cargo-bulk-S"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#fit-next-revision")).toHaveText(revision!);
  await page.locator('[data-slot="payload-1"]').last().click();
  await page.locator('[data-candidate="cargo-bulk-S"]').click();
  await page.getByLabel("Все сменные Payload").check();
  await expect(page.locator("#fit-preview")).toContainText("2 сменных");
  await page.locator("#fit-apply").click();
  await expect(page.locator("#fit-slots")).toContainText(
    "Грузовой навалочный S",
  );
  await expect(page.locator("#fit-next-revision")).not.toHaveText(revision!);
  await expect(page.locator(".system-payload .builtin")).toHaveCount(2);
});
test("UI16 mobile actions are reachable, groups expose state and page does not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/"); await openTimedDraft(page);
  await expect(page.locator(".ship-hero")).toHaveAttribute(
    "data-layout",
    "flat",
  );
  await expect(page.locator('[data-group="propulsion"]')).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.locator('[data-group="propulsion"]').click();
  await expect(page.locator('[data-group="propulsion"]')).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await expect(page.locator("#fit-start")).toBeVisible();
});
test("UI09/12/14 real pause/step/cancel interval and snapshot A survive reset", async ({
  page,
}) => {
  await page.goto("/"); await openTimedDraft(page);
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await page.locator("#fit-duration").fill("3600");
  await page.locator("#fit-speed").selectOption("1");
  await page.locator("#fit-start").click();
  await page.locator("#fit-pause").click();
  await expect(page.locator("#fit-status")).toContainText("Пауза");
  await expect(page.locator("#fit-duration")).toBeEnabled();
  const before = await page.locator("#fit-time").textContent();
  await page.locator("#fit-step").click();
  await expect(page.locator("#fit-time")).not.toHaveText(before!);
  await page.locator("#fit-cancel").click();
  await expect(page.getByRole("dialog")).toContainText("частичный интервал");
  await page
    .getByRole("button", { name: "Отменить тест", exact: true })
    .click();
  await expect(page.locator("#fit-status")).toContainText("Отменён");
  await expect(page.locator("#fit-result")).toContainText(
    "наблюдаемый интервал",
  );
  await expect(page.locator("#lab-channels")).toContainText(
    "mean/min/max/count",
  );
  await page.locator("#fit-freeze").click();
  const a = await page.locator("#fit-comparison").textContent();
  await page.locator("#fit-reset").click();
  await expect(page.locator("#fit-comparison")).toContainText(
    "Неизменяемый снимок теста A",
  );
  await expect(page.locator("#fit-comparison")).not.toHaveText(a!);
  await expect(page.locator("#fit-duration")).toBeEnabled();
});
test("UI03/17 seven current hulls update actual passport; local assets and tablet fallback stay bounded", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173")) remote.push(r.url());
  });
  await page.goto("/"); await openTimedDraft(page);
  const { loadCandidateCatalog, getPresetFit } = await import(
    "../../src/fitting/catalog"
  );
  const { compileFit } = await import("../../src/fitting/compile");
  const c = loadCandidateCatalog("ship-fitting-0.2.4");
  for (const h of c.hulls) {
    await page.locator("#fit-preset").selectOption(h.id + ":1");
    const oracle = compileFit(getPresetFit(h.id + ":1",c.version), c);
    if (!oracle.ok) throw Error(h.id);
    await expect(page.locator(".ship-hero")).toContainText(
      (oracle.value.dryMassKg / 1000).toLocaleString("ru-RU", {
        maximumFractionDigits: 2,
      }),
    );
    await expect(page.locator(".ship-passport h1")).toHaveText(h.label);
    await expect(page.locator(".passport-numbers")).toContainText((oracle.value.heatCapacityJK/1000).toLocaleString("ru-RU",{maximumFractionDigits:2}));
    await expect(page.locator(".passport-numbers")).toContainText(h.referenceVfaMS+" м/с");
    await expect(page.locator("#fit-slots")).not.toContainText(
      "производитель не указан",
    );
  }
  await page.setViewportSize({ width: 900, height: 1000 });
  await expect(page.locator(".ship-hero")).toHaveAttribute(
    "data-layout",
    "flat",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(remote).toEqual([]);
});
test("UI04/16 passport data do not overlap ring targets and mobile catalog rows do not clip text", async ({
  page,
}) => {
  await page.goto("/"); await openTimedDraft(page);
  await page.locator("#fit-preset").selectOption("industrial-M:3");
  await page.evaluate(() => document.fonts.ready);
  const overlap = await page.evaluate(() => {
    const p = document
      .querySelector(".passport-numbers")!
      .getBoundingClientRect();
    return [...document.querySelectorAll(".ring-node")].some((n) => {
      const r = n.getBoundingClientRect();
      return (
        p.left < r.right &&
        p.right > r.left &&
        p.top < r.bottom &&
        p.bottom > r.top
      );
    });
  });
  expect(overlap).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-slot="payload-3"]').last().click();
  const clips = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>(".catalog-row")].some(
      (r) => r.scrollHeight > r.clientHeight + 1,
    ),
  );
  expect(clips).toBe(false);
  const narrowNames = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        ".catalog-row > span:nth-child(2)",
      ),
    ].some((name) => name.getBoundingClientRect().width < 100),
  );
  expect(narrowNames).toBe(false);
  expect(
    await page.evaluate(
      () => document.querySelector("dialog")!.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
