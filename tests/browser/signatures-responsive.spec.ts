import {test,expect} from "@playwright/test";
const profiles=[[360,780],[780,360],[400,640],[640,400],[768,1024],[1024,768],[720,900],[900,720],[820,1230],[1230,820],[360,480],[820,1101],[1101,820],[1440,900]] as const;
for(const [width,height] of profiles)test(`SS14 signature controls and paused result reachable ${width}×${height}`,async({browser},info)=>{
  const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await c.newPage(),errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));
  const tap=async(id:string)=>{await p.locator(id).evaluate(n=>n.scrollIntoView({block:"center"}));await p.locator(id).tap();};
  try{
    await p.goto("/");await p.locator("#sig-mode").check();await p.locator("#sig-observer").selectOption("M-3in1-G1");await p.locator("#sig-aspect").selectOption("270");
    await tap("#sig-settings-details summary");await p.locator("#sig-angle").fill("359");await p.locator("#sig-angle").blur();await expect(p.locator("#sig-aspect")).toHaveValue("custom");
    await p.locator("#fit-duration").fill("20");await p.locator("#fit-duration").blur();await p.locator("#fit-speed").selectOption("1");await tap("#fit-start");
    await expect(p.locator("#fit-time")).not.toHaveText("0 с / 20 с");await tap("#fit-pause");await expect(p.locator("#fit-status")).toContainText("Пауза");
    await tap("#sig-truth-details summary");await tap("#slot-payload-1");await expect(p.locator("#swap-close")).toBeFocused();await tap("#swap-close");
    const geometry=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,font:[...document.querySelectorAll<HTMLInputElement>("#sig-controls input:not([type=checkbox]),#sig-controls select")].map(n=>parseFloat(getComputedStyle(n).fontSize)),controls:[...document.querySelectorAll<HTMLElement>("#sig-controls select,#sig-controls label:has(input[type=checkbox])")].filter(n=>n.getBoundingClientRect().height>0).map(n=>({id:n.id,height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width})),charts:[...document.querySelectorAll<SVGTextElement>(".signature-chart text")].map(n=>{const b=n.getBBox(),m=n.getScreenCTM()!;return {font:parseFloat(getComputedStyle(n).fontSize)*Math.hypot(m.a,m.b),x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};})}));
    expect(geometry.overflow).toBeLessThanOrEqual(1);for(const font of geometry.font)expect(font).toBeGreaterThanOrEqual(16);
    for(const control of geometry.controls){expect(control.height,control.id).toBeGreaterThanOrEqual(44);expect(control.width,control.id).toBeGreaterThanOrEqual(44);}
    for(const glyph of geometry.charts){expect(glyph.font).toBeGreaterThanOrEqual(12);expect(glyph.x).toBeGreaterThanOrEqual(0);expect(glyph.y).toBeGreaterThanOrEqual(0);expect(glyph.right).toBeLessThanOrEqual(700);expect(glyph.bottom).toBeLessThanOrEqual(205);}
    expect(errors).toEqual([]);await info.attach("signature-responsive-geometry",{body:JSON.stringify(geometry),contentType:"application/json"});await p.screenshot({path:info.outputPath("signature-paused.png"),fullPage:true});
  }finally{await c.close();}
});
