const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../storefront/catalog.json');
test('expanded collection has at least 30 Hot Wheels vehicle examples with distinct IDs and complete item information',()=>{
 const cars=catalog.filter(p=>p.kind==='vehicle'&&p.brand==='Hot Wheels');
 assert.ok(cars.length>=30);
 assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
 for(const p of catalog){
  for(const key of ['name','category','series','scale','packaging','condition','sku','priceBasis'])assert.ok(p[key],p.id+' missing '+key);
  assert.ok(Number.isInteger(p.priceCents)&&p.priceCents>0);
  assert.ok(p.images.length>0);
  for(const image of p.images)assert.ok(fs.existsSync(path.join(__dirname,'..',image)),image);
 }
});
test('other diecast brands are identified and illustrative prices are not represented as appraisals',()=>{
 assert.equal(catalog.find(p=>p.id==='cadillac-godfather').brand,'GreenLight');
 for(const p of catalog)assert.match(p.priceBasis,/Illustrative/);
});
