const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const app=require('../server');
let server,base;
before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port});
after(()=>new Promise(r=>server.close(r)));
test('showroom starts without database or secrets and does not enable payments',async()=>{const r=await fetch(base+'/health');assert.equal(r.status,200);assert.equal((await r.json()).paymentsEnabled,false)});
test('quote rejects unknown products, invalid options, quantities and missing payload',async()=>{for(const items of [[],[{id:'not-real',quantity:1,option:'Standard'}],[{id:'featured-2',quantity:-1,option:'Standard'}],[{id:'featured-2',quantity:1,option:'evil'}],[{id:'featured-2',quantity:1.5,option:'Standard'}]]){const r=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});assert.equal(r.status,400)}});
test('browser prices cannot override authoritative sample totals',async()=>{const r=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:'featured-2',option:'Standard',quantity:2,priceCents:1}]})});const q=await r.json();assert.equal(q.subtotalCents,17800);assert.equal(q.shippingCents,0);assert.equal(q.paymentsEnabled,false)});
test('example shipping is calculated server-side and a full vehicle collection fits in the demo bag',async()=>{
 const quote=async items=>(await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})})).json();
 const small=await quote([{id:'featured-1',option:'Standard',quantity:1}]);
 assert.equal(small.shippingCents,695);assert.equal(small.totalBeforeTaxCents,small.subtotalCents+695);assert.equal(small.taxCents,null);
 const products=require('../storefront/catalog.json').filter(p=>p.kind==='vehicle');
 const full=await quote(products.map(p=>({id:p.id,option:'Standard',quantity:1})));
 assert.equal(full.lines.length,products.length);assert.equal(full.shippingCents,0);assert.equal(full.paymentsEnabled,false);
});
test('legacy edit routes and private/source files are not exposed',async()=>{for(const route of ['/api/add-columns','/api/homepage-listings','/api/upload-image']){const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,404)}for(const route of ['/.env','/server_hybrid.js','/PRIVATE_SITE_OPERATIONS.md','/pages/admin.html'])assert.equal((await fetch(base+route)).status,404)});
test('public routes, legacy redirects and 404s have intended HTTP status',async()=>{for(const route of ['/','/collections','/privacy','/shipping','/returns','/terms','/contact','/checkout','/accessibility'])assert.equal((await fetch(base+route)).status,200);assert.equal((await fetch(base+'/missing-page')).status,404);const r=await fetch(base+'/pages/product_detail.html?id=featured-2',{redirect:'manual'});assert.equal(r.headers.get('location'),'/product?id=featured-2');assert.ok(r.headers.get('content-security-policy'))});
