require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('node:path');
const products = require('./storefront/catalog.json');
const app = express();
if(process.env.NODE_ENV==='production')app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'","data:"],'script-src':["'self'"],'style-src':["'self'"],'upgrade-insecure-requests':null}},strictTransportSecurity:process.env.NODE_ENV === 'production' ? undefined : false}));
app.use(compression());
app.use(express.json({limit:'16kb'}));
app.use('/api',rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
app.get('/health',(_req,res)=>res.json({status:'ok',mode:'showroom',paymentsEnabled:false}));
app.get('/api/catalog',(_req,res)=>res.json({products,currency:'USD',mode:'showroom'}));
app.post('/api/quote',(req,res)=>{
  const items=req.body?.items;
  if(!Array.isArray(items)||!items.length||items.length>30)return res.status(400).json({error:'Choose at least one item.'});
  const lines=[];
  for(const item of items){
    if(!item||typeof item!=='object')return res.status(400).json({error:'Please check your item.'});
    const product=products.find(p=>p.id===item.id);
    if(!product||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10||!product.options.includes(item.option))return res.status(400).json({error:'Please check your item and quantity.'});
    lines.push({id:product.id,name:product.name,option:item.option,quantity:item.quantity,unitCents:product.priceCents,lineCents:product.priceCents*item.quantity});
  }
  res.json({mode:'showroom',currency:'USD',lines,subtotalCents:lines.reduce((a,l)=>a+l.lineCents,0),shippingCents:null,taxCents:null,paymentsEnabled:false});
});
app.use('/api',(_req,res)=>res.status(404).json({error:'This service is not available in the showroom.'}));
for(const folder of ['storefront','HOT_WHEELS_IMAGES','video'])app.use('/'+folder,express.static(path.join(__dirname,folder),{maxAge:3600000,index:false}));
const aliases={'homepage':'/','homepage.html':'/','collection_browser':'/collections','collection_browser.html':'/collections','product_detail.html':'/product','product_detail':'/product','product-1':'/product?id=featured-1','checkout_experience':'/checkout','checkout_experience.html':'/checkout','about_hot_wheels_velocity':'/about','about_hot_wheels_velocity.html':'/about','collector_dashboard.html':'/saved','collector_dashboard':'/saved'};
app.use((req,res,next)=>{const key=req.path.replace(/^\/pages\//,'').replace(/^\//,'');if(aliases[key])return res.redirect(302,aliases[key]+(req.url.includes('?')&&!aliases[key].includes('?')?'?'+req.url.split('?')[1]:''));next();});
app.get('/robots.txt',(_req,res)=>res.type('text').send('User-agent: *\nDisallow: /\n'));
const routes=['/','/collections','/product','/cart','/checkout','/saved','/about','/contact','/guide','/privacy','/terms','/shipping','/returns','/accessibility','/cookies'];
app.get(routes,(_req,res)=>res.sendFile(path.join(__dirname,'storefront/index.html')));
app.use((_req,res)=>res.status(404).sendFile(path.join(__dirname,'storefront/index.html')));
app.use((err,_req,res,_next)=>res.status(err.status||500).json({error:err.status===400?'Invalid request.':'Unable to complete the request. Please try again.'}));
if(require.main===module)app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Velocity showroom: http://localhost:'+(process.env.PORT||3000)));
module.exports=app;
