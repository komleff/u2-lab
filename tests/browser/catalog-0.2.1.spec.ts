import { openTimedDraft } from "./timed-draft";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getPresetFit } from "../../src/fitting/catalog";
for(const width of [1440,390])test(`catalog0.2.1 native ${width} user assembly, edition promotion, measured JSON reopening and immutable active owner`,async({browser},info)=>{
 test.setTimeout(120000);
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{const Native=Worker;(window as any).started=[];window.Worker=class extends Native{constructor(u:string|URL,o?:WorkerOptions){super(u,o);const send=this.postMessage.bind(this);this.postMessage=((m:any)=>{if(m.type==="start")(window as any).started.push(structuredClone(m.payload.spec));send(m);}) as any;}};});
 const action=async(s:string)=>{const b=page.locator(s);await b.evaluate(n=>n.scrollIntoView({block:"center"}));if(width===390)await b.tap();else await b.click();};
 const running=async()=>{await expect(page.locator("#fit-status")).toContainText("Выполняется");await expect(page.locator("#fit-pause")).toBeEnabled();};
 const exported=async(s:string)=>{const wait=page.waitForEvent("download");await action(s);if(s==="#fit-save")await action("#fit-save-confirm");const d=await wait;return JSON.parse(await readFile((await d.path())!,"utf8"));};
 const open=async(value:unknown)=>page.locator("#fit-import").setInputFiles({name:"fit.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(value))});
 const select=async(slot:string,item:string)=>{await action("#slot-"+slot);await action(`[data-candidate="${item}"]`);await expect(page.locator("#fit-apply")).toBeEnabled();await action("#fit-apply");};
 await page.goto("/");await expect(page.locator("#fit-preset")).toBeVisible();
 const old=getPresetFit("industrial-M:2","ship-fitting-0.2.0");await open(old);
 const propulsion=page.locator('[data-group="propulsion"]');if(await propulsion.getAttribute("aria-expanded")==="false")await propulsion.click();
 expect((await exported("#fit-save")).catalogVersion).toBe("ship-fitting-0.2.0");
 await action("#slot-march");await expect(page.locator('[data-candidate="engine-diesel-industrial-M-march"]')).toBeVisible();await action('[data-candidate="engine-diesel-industrial-M-march"]');
 await expect(page.locator("#fit-preview")).toContainText("16228800");await expect(page.locator("#fit-preview")).toContainText("experimental");
 await action("#fit-apply");expect((await exported("#fit-save")).catalogVersion).toBe("ship-fitting-0.2.3");
 await page.locator("#fit-preset").selectOption("industrial-M:2");
 const signature=page.locator('[data-group="signature"]');if(await signature.getAttribute("aria-expanded")==="false")await signature.click();
 for(const [slot,item] of [["power-1","battery-M"],["power-4","battery-M"],["payload-3","cargo-bulk-M"],["signature-2","radiator-passive-M"],["signature-3","radiator-passive-M"],["signature-4","radiator-passive-M"]])await select(slot,item);
 await action("#fit-f3");const fit=await exported("#fit-save"); await openTimedDraft(page,fit);expect(fit.instances[fit.assignments.retro].itemId).toBe("engine-diesel-industrial-M-retro");
 for(const [id,value] of [["duration","5.25"],["dt","0.25"],["approach","1"],["work-seconds","2"],["braking","1"],["service","1"],["idle","1"]])await page.locator("#fit-"+id).fill(value);
 await page.locator("#fit-speed").selectOption("20000");await action("#fit-start");await expect(page.locator("#fit-status")).toContainText("Завершён");
 await expect(page.locator("#fit-result")).toContainText("Первый ограничитель");
 await expect(page.locator("#lab-first-limiter")).toContainText("не выявлено за измеренный интервал");
 const run=await exported("#fit-export-run"),native=await exported("#fit-export-result");
 expect(run.catalogVersion).toBe("ship-fitting-0.2.3");expect(native.spec).toEqual(run);expect(native.spec.resolvedShip.fit).toEqual(fit);
 expect(run.resolvedShip.dryMassKg).toBeCloseTo(412245.5504768165,7);expect(native.state.timeSeconds).toBe(5.25);expect(native.metrics.usefulWork).toBeGreaterThan(0);
 await action("#fit-freeze");const frozen=await page.locator(".ab-side-a").innerHTML();
 const bad=structuredClone(fit);bad.catalogVersion="ship-fitting-0.2.0";await open(bad);await expect(page.locator("#fit-error")).not.toBeEmpty();expect(await exported("#fit-save")).toEqual(fit);expect(await exported("#fit-export-result")).toEqual(native);expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
 // Этот опыт отменяется частичным: горизонт оставляет время для нативных действий,
 // чтобы сравнивать активный снимок, а не новый черновик после законного завершения.
 await page.locator("#fit-duration").fill("3600");await page.locator("#fit-speed").selectOption("1");await action("#fit-start");await expect(page.locator("#fit-time")).not.toHaveText("0 с / 3600 с");
 await running();const active=await exported("#fit-export-run");await running();expect(active).toEqual(await page.evaluate(()=>(window as any).started.at(-1)));await page.locator("#slot-march").evaluate(n=>n.scrollIntoView({block:"center"}));
 const button=page.locator("#slot-march"),node=await button.elementHandle(),box=await button.boundingBox();if(!box||!node)throw Error("native target");
 if(width===1440){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(90);await page.mouse.up();}else await button.tap();
 expect(await node.evaluate(n=>n.isConnected)).toBe(true);await expect(page.getByRole("dialog")).toBeVisible();await action('[data-candidate="engine-diesel-M-single"]');await action("#fit-apply");
 await running();expect(await exported("#fit-export-run")).toEqual(active);await running();await action("#fit-pause");await expect(page.locator("#fit-status")).toContainText("Пауза");await action("#fit-cancel");await action("#cancel-yes");await expect(page.locator("#fit-status")).toContainText("Отменён");
 expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
 await page.reload();for(const [document,mode] of [[fit,"сборка"],[run,"численный опыт"],[native,"измеренный результат"]] as const){await open(document);await expect(page.locator("#fit-replay-note")).toContainText(mode);}
 await action("#fit-f3");expect(await exported("#fit-export-result")).toEqual(native);expect(await page.evaluate(()=>(window as any).started.length)).toBe(0);
 const geometry=await page.evaluate(()=>({inner:innerWidth,document:document.documentElement.scrollWidth,visual:visualViewport!.width}));expect(geometry).toEqual({inner:width,document:width,visual:width});expect(errors).toEqual([]);
 await info.attach("catalog-native",{body:JSON.stringify({width,fit,run,native,geometry,errors}),contentType:"application/json"});await context.close();
});
