require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const {createStore}=require('./lib/garage-store');
const {adminApi,hasAdminSession}=require('./lib/admin-api');
function createApp(options={}){
const store=options.store||createStore();
const app = express();
if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'","data:"],'script-src':["'self'"],'style-src':["'self'"],'upgrade-insecure-requests':null}},strictTransportSecurity:process.env.NODE_ENV === 'production' ? undefined : false}));
app.use(compression());
app.use(express.json({limit:'256kb'}));
app.use('/api',rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
app.get('/health',(_req,res)=>res.json({status:'ok',mode:'showroom',paymentsEnabled:false,storageReady:store.durable,storageId:store.state.installationId}));
app.locals.garageStore=store;
app.use('/api/admin',adminApi(store,{secure:process.env.NODE_ENV==='production',setupHash:options.setupHash}));
app.get('/api/catalog',(_req,res)=>{res.set('Cache-Control','no-store');res.json(store.catalog());});
app.post('/api/quote',(req,res)=>{
  const {products,settings}=store.catalog();
  const items=req.body?.items;
  if(!Array.isArray(items)||!items.length||items.length>60)return res.status(400).json({error:'Choose at least one item.'});
  const lines=[],seen=new Set(),quantities=new Map();
  for(const item of items){
    if(!item||typeof item!=='object')return res.status(400).json({error:'Please check your item.'});
    const product=products.find(p=>p.id===item.id);
    if(!product||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10||!product.options.includes(item.option)||(Number.isInteger(product.quantity)&&item.quantity>product.quantity))return res.status(400).json({error:'Please check this item’s availability, option and quantity.'});
    const key=item.id+':'+item.option;if(seen.has(key))return res.status(400).json({error:'Combine duplicate selections before reviewing this bag.'});seen.add(key);quantities.set(item.id,(quantities.get(item.id)||0)+item.quantity);if(Number.isInteger(product.quantity)&&quantities.get(item.id)>product.quantity)return res.status(400).json({error:'The selected quantity exceeds this item’s available stock.'});
    lines.push({id:product.id,name:product.name,option:item.option,quantity:item.quantity,unitCents:product.priceCents,lineCents:product.priceCents*item.quantity});
  }
  const subtotalCents=lines.reduce((a,l)=>a+l.lineCents,0);
  const shippingCents=subtotalCents>=settings.freeShippingThresholdCents?0:settings.shippingCents;
  res.json({mode:'showroom',currency:'USD',lines,subtotalCents,shippingCents,totalBeforeTaxCents:subtotalCents+shippingCents,taxCents:null,paymentsEnabled:false});
});
app.use('/api',(_req,res)=>res.status(404).json({error:'This service is not available in the showroom.'}));
app.get('/admin',(_req,res)=>res.sendFile(path.join(__dirname,'admin/index.html')));
app.use('/admin-assets',express.static(path.join(__dirname,'admin'),{index:false,maxAge:0}));
app.use('/media',(req,res,next)=>{const url='/media'+req.path;const visible=store.state.products.some(p=>p.live&&!p.archived&&!p.deletedAt&&(p.live.images.includes(url)||p.live.videoUrl===url))||store.state.settings.live.homeFilmUrl===url;if(!visible&&!hasAdminSession(req,store,process.env.NODE_ENV==='production'))return res.status(404).end();res.set('Cache-Control','private, no-store');next();},express.static(path.join(store.directory,'uploads'),{index:false,maxAge:0,setHeaders(res){res.set('X-Content-Type-Options','nosniff');}}));
for(const folder of ['storefront','HOT_WHEELS_IMAGES','video'])app.use('/'+folder,express.static(path.join(__dirname,folder),{maxAge:3600000,index:false}));
const aliases={'homepage':'/','homepage.html':'/','collection_browser':'/collections','collection_browser.html':'/collections','product_detail.html':'/product','product_detail':'/product','product-1':'/product?id=featured-1','checkout_experience':'/checkout','checkout_experience.html':'/checkout','about_hot_wheels_velocity':'/about','about_hot_wheels_velocity.html':'/about','collector_dashboard.html':'/saved','collector_dashboard':'/saved'};
app.use((req,res,next)=>{const key=req.path.replace(/^\/pages\//,'').replace(/^\//,'');if(aliases[key])return res.redirect(302,aliases[key]+(req.url.includes('?')&&!aliases[key].includes('?')?'?'+req.url.split('?')[1]:''));next();});
app.get('/robots.txt',(_req,res)=>res.type('text').send('User-agent: *\nDisallow: /\n'));
const routes=['/','/collections','/product','/cart','/checkout','/saved','/about','/contact','/guide','/privacy','/terms','/shipping','/returns','/accessibility','/cookies','/condition'];
app.get(routes,(_req,res)=>res.sendFile(path.join(__dirname,'storefront/index.html')));
app.use((_req,res)=>res.status(404).sendFile(path.join(__dirname,'storefront/index.html')));
app.use((err,_req,res,_next)=>{const status=err.code==='LIMIT_FILE_SIZE'?413:err.status||500;res.status(status).json({error:err.code==='LIMIT_FILE_SIZE'?'This file is too large.':status<500?err.message:'Unable to complete the request. Please try again.'});});
return app;
}
const app=createApp();
if(require.main===module)app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Velocity showroom: http://localhost:'+(process.env.PORT||3000)));
module.exports=app;
module.exports.createApp=createApp;
