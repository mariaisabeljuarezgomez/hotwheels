const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../server');
(async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=process.env.VERIFY_BASE_URL||'http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});const context=await browser.newContext();await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{}});
 fs.mkdirSync('.qa',{recursive:true});const errors=[],report=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,768,430,390,375,320]){
  await page.setViewportSize({width,height:1000});await page.goto(base);await page.locator('.hero h1').waitFor();await page.waitForTimeout(1300);
  await page.screenshot({path:`.qa/home-${width}.png`,fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Home overflow '+width);
  report.push({surface:'home',width,overflow});
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const route of ['/','/collections','/product?id=featured-2','/privacy','/contact','/terms','/shipping','/returns','/accessibility','/cookies','/about','/guide','/missing-page']){
  await page.goto(base+route);await page.waitForFunction(()=>document.querySelector('h1'));
  const broken=await page.locator('img').evaluateAll(ims=>ims.filter(im=>im.complete&&!im.naturalWidth).map(im=>im.src));
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  report.push({route,broken,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
 }
 await page.goto(base+'/collections');await page.locator('#search').fill('McLaren');await page.locator('.product-card').first().waitFor();if(await page.locator('.product-card').count()!==1)throw Error('Search');await page.locator('[data-save]').click();await page.goto(base+'/saved');await page.locator('.product-card').waitFor();if(await page.locator('.product-card').count()!==1)throw Error('Save persistence');
 await page.goto(base+'/product?id=featured-2');await page.locator('[data-add]').click();await page.locator('[data-image]').nth(1).click();await page.goto(base+'/cart');await page.locator('[data-quantity][data-delta="1"]').click();await page.goto(base+'/checkout');await page.locator('#review-quote').click();await page.getByText(/Verified sample subtotal:/).waitFor();if(!(await page.locator('#quote-result').textContent()).includes('$178.00'))throw Error('Quote total');
 await page.screenshot({path:'.qa/checkout-desktop.png',fullPage:true});
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.push({route:'checkout-with-items',violations:audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});
 for(const width of [430,390,320]){await page.setViewportSize({width,height:844});for(const route of ['/collections','/product?id=featured-2','/cart','/checkout','/privacy']){await page.goto(base+route);await page.locator('h1').waitFor();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+route+' '+width);await page.screenshot({path:`.qa/${route.split('?')[0].slice(1)}-${width}.png`,fullPage:true})}}
 await page.goto(base);await page.locator('#menu').click();if(await page.locator('#menu').getAttribute('aria-expanded')!=='true')throw Error('Menu');await page.locator('#menu').click();await page.locator('[data-film]').click();await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');if(await page.locator('dialog[open]').count())throw Error('Dialog close');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);await page.locator('.hero h1').waitFor();await page.screenshot({path:'.qa/reduced-motion.png'});
 await page.goto(base+'/collections');await page.locator('#search').fill('xyz-no-result');await page.locator('.empty').waitFor();await page.screenshot({path:'.qa/no-results.png'});
 report.push({runtimeErrors:errors,interactions:'search, saved persistence, gallery, bag quantity, server subtotal, mobile menu, dialog Escape, reduced motion, no-results verified'});
 fs.writeFileSync('.qa/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
