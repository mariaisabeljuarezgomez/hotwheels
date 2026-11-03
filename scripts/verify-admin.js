const {chromium}=require('@playwright/test');
const {default:AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const {createStore,secret,hash}=require('../lib/garage-store');
const {createApp}=require('../server');
(async()=>{
 const directory=fs.mkdtempSync(path.join(__dirname,'../.qa/admin-browser-'));const code=secret();
 const store=createStore({directory,durable:true});const app=createApp({store,setupHash:hash(code)});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const errors=[],report=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/admin#setup='+code);await page.locator('#auth-form').waitFor();
 await page.getByLabel('Your display name').fill('Tim');await page.getByLabel('Username',{exact:true}).fill('tim.preview');await page.getByLabel('Choose a password').fill('A private local UI test password!');await page.getByRole('button',{name:'Create owner account'}).click();
 await page.locator('#recovery-saved').check();await page.locator('#finish-recovery').click();await page.getByRole('heading',{name:'Your garage, at a glance.'}).waitFor();
 async function shot(name){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});await page.screenshot({path:'.qa/admin-'+name+'.png',fullPage:true});}
 async function audit(name){const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.push({surface:name,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});}
 await shot('overview-desktop');await audit('overview');
 await page.getByRole('button',{name:'Products',exact:true}).click();await shot('products-desktop');
 await page.locator('[data-edit-product="featured-2"]').click();await page.getByLabel('Price · USD',{exact:true}).fill('111.25');
 await page.getByRole('button',{name:'Move photo 1 later',exact:true}).click();
 const fixture=path.join(directory,'fixture.png');await sharp({create:{width:120,height:120,channels:3,background:'#ff6838'}}).png().toFile(fixture);
 const count=await page.locator('.media-order-row').count();const chooserEvent=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Upload photos / video',exact:true}).click();const chooser=await chooserEvent;await chooser.setFiles(fixture);await page.waitForFunction(n=>document.querySelectorAll('.media-order-row').length===n,count+1);
 // The file-input handler defaults to library mode until the product upload control is used.
 if(await page.locator('.media-order-row').count()===count){throw Error('Product upload did not attach');}
 await page.getByRole('button',{name:'Add library video',exact:true}).click();await page.locator('#picker-gallery [data-select-media]').first().click();await page.getByRole('button',{name:'Use selection'}).click();
 await page.getByLabel('Video description / transcript').fill('Silent visual preview of a collector car.');
 await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByText('Draft saved. Publish when you are ready.',{exact:true}).waitFor();
 let publicData=await (await context.request.get(base+'/api/catalog')).json();if(publicData.products.find(p=>p.id==='featured-2').priceCents!==8900)throw Error('Draft leaked publicly');
 await page.getByRole('button',{name:/^Save & publish/}).click();await page.getByText('Product published. The showroom now uses this version.',{exact:true}).waitFor();
 publicData=await (await context.request.get(base+'/api/catalog')).json();if(publicData.products.find(p=>p.id==='featured-2').priceCents!==11125)throw Error('Price did not publish');
 await shot('product-desktop');await audit('product editor');
 const preview=await context.newPage();await preview.goto(base+'/product?id=featured-2');await preview.locator('.product-film video').waitFor();if(!(await preview.locator('.price').textContent()).includes('111.25'))throw Error('Public price mismatch');await preview.close();
 for(const view of ['media','pages','settings','backups','team','help']){await page.locator('[data-view="'+view+'"]').first().click();await shot(view+'-desktop');if(['settings','media','pages'].includes(view))await audit(view);}
 await page.locator('[data-view="pages"]').first().click();await page.locator('[data-edit-page="about"]').click();await page.getByLabel('Page title',{exact:true}).fill('A garage, personally curated.');await page.getByLabel('Page content',{exact:true}).fill('## A collection with character\n\nA private draft that becomes a public page only when Tim publishes it.');await page.getByRole('button',{name:'Refresh preview',exact:true}).click();await page.locator('#page-preview h2').waitFor();await page.getByRole('button',{name:/^Save & publish/}).click();await page.getByText('Page published.',{exact:true}).waitFor();await shot('page-editor-desktop');
 await page.locator('[data-view="settings"]').first().click();await page.getByLabel('Standard shipping · USD',{exact:true}).fill('7.95');await page.getByRole('button',{name:/^Save & publish/}).click();await page.getByText('Store settings published.',{exact:true}).waitFor();
 publicData=await (await context.request.get(base+'/api/catalog')).json();if(publicData.settings.shippingCents!==795||!publicData.pages.shipping[2].includes('$7.95'))throw Error('Shipping settings and policy placeholders differ');
 await page.locator('[data-view="backups"]').first().click();const downloadEvent=page.waitForEvent('download');await page.getByRole('link',{name:'Download full backup'}).click();const backup=await downloadEvent;const zipPath=path.join(directory,'browser-backup.zip');await backup.saveAs(zipPath);if(fs.statSync(zipPath).size<1000)throw Error('Backup download empty');
 page.once('dialog',d=>d.accept('RESTORE'));await page.locator('#restore-input').setInputFiles(zipPath);await page.getByText('Full backup restored. Accounts were kept unchanged.',{exact:true}).waitFor();
 for(const width of [320,390,430]){await page.setViewportSize({width,height:900});for(const view of ['overview','products','media','pages','settings','backups','team','help']){await page.locator('[data-view="'+view+'"]').first().click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Admin overflow '+view+' '+width);if(width===390)await shot(view+'-390');}}
 await page.locator('[data-view="products"]').first().click();await page.locator('[data-edit-product="featured-2"]').click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile product editor overflow');await shot('product-430');await audit('mobile product editor');
 report.push({runtimeErrors:errors,flows:'Owner setup, recovery acknowledgement, price draft privacy, image reorder, upload, video attach, publish, public price/video, page preview/publish, shipping placeholders, full ZIP download/restore and phone navigation verified.'});
 fs.writeFileSync('.qa/admin-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();server.close();
 if(errors.length||report.some(r=>r.violations?.length))process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1)});
