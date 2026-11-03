const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs');
const app=require('../server');
(async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=process.env.VERIFY_BASE_URL||'http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/collections');await page.locator('#products .product-card').first().waitFor();
 const productLinks=await page.locator('#products h3 a').evaluateAll(es=>es.map(a=>a.getAttribute('href')));
 const report={base,products:[],footer:[],responsive:[],runtimeErrors:errors};
 for(const link of productLinks){
  const response=await page.goto(base+link);await page.locator('.detail h1').waitFor();
  const name=await page.locator('.detail h1').textContent();
  await page.locator('#detail-image').evaluate(im=>im.decode());
  const fields=await page.locator('.spec-grid dd').allTextContents();
  if(response.status()!==200||fields.length!==5)throw Error('Incomplete item '+link);
  report.products.push({link,name,status:response.status(),fields});
 }
 await page.goto(base);await page.locator('.hero h1').waitFor();
 const footerLinks=await page.locator('footer a').evaluateAll(es=>[...new Set(es.map(a=>a.getAttribute('href')))]);
 for(const link of footerLinks){
  const response=await page.goto(base+link);await page.locator('h1').waitFor();
  if(response.status()!==200)throw Error('Footer route '+link);
  report.footer.push({link,title:await page.title(),words:(await page.locator('main').textContent()).trim().split(/\s+/).length});
 }
 for(const width of [320,390,430,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/collections','/product?id=defender-90','/shipping','/returns','/privacy','/condition']){
   await page.goto(base+route);await page.locator('h1').waitFor();
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+route+' at '+width);
   report.responsive.push({width,route,overflow:false});
   if(width===390||width===1440)await page.screenshot({path:'.qa/expanded-'+route.split('?')[0].slice(1)+'-'+width+'.png',fullPage:true});
  }
 }
 await page.goto(base+'/collections?category=Formula%201');await page.locator('#products .product-card').first().waitFor();
 if(await page.locator('#products .product-card').count()!==4)throw Error('Formula 1 category link');
 await page.goto(base+'/product?id=copo-camaro');await page.locator('[data-add]').click();
 await page.goto(base+'/checkout');await page.locator('#review-quote').click();
 await page.waitForFunction(()=>document.querySelector('#quote-result')?.textContent.includes('Total before tax: $12.94'));
 report.exampleShipping='COPO Camaro $5.99 + example shipping $6.95 = $12.94 before tax, verified through public UI';
 await page.screenshot({path:'.qa/expanded-checkout-shipping.png',fullPage:true});
 await page.goto(base+'/condition');await page.locator('h1').waitFor();
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.conditionAccessibility=axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
 fs.mkdirSync('.qa',{recursive:true});fs.writeFileSync('.qa/catalog-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({productPages:report.products.length,footerLinks:report.footer.length,responsiveChecks:report.responsive.length,runtimeErrors:errors,conditionAccessibility:report.conditionAccessibility},null,2));
 await browser.close();server.close();
 if(errors.length||report.conditionAccessibility.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
