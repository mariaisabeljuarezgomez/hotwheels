const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const MarkdownIt=require('markdown-it');
const sanitize=require('sanitize-html');
const seedProducts=require('../storefront/catalog.json');
const seedPages=require('../storefront/pages-seed.json');
const md=new MarkdownIt({html:false,linkify:false,breaks:false});
const clone=value=>structuredClone(value);
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const hash=s=>crypto.createHash('sha256').update(Buffer.isBuffer(s)?s:String(s)).digest('hex');
const secret=()=>crypto.randomBytes(32).toString('hex');
function passwordHash(password){
 if(typeof password!=='string'||password.length<12||password.length>128)throw fail('Use a password of 12–128 characters.');
 const salt=crypto.randomBytes(16).toString('hex');
 return salt+':'+crypto.scryptSync(password,salt,64,{N:16384}).toString('hex');
}
function passwordMatches(password,encoded){
 if(typeof password!=='string'||password.length>128)return false;
 const [salt,digest]=(encoded||'0000000000000000:'+ '0'.repeat(128)).split(':');
 const actual=crypto.scryptSync(password,salt,64,{N:16384});
 return !!digest&&digest.length===128&&crypto.timingSafeEqual(actual,Buffer.from(digest,'hex'));
}
function text(value,name,max=200,required=false){
 if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw fail('Please check '+name+'.');
 return value.trim();
}
function renderMarkdown(source){return sanitize(md.render(source),{allowedTags:['p','h2','h3','h4','ul','ol','li','strong','em','a','table','thead','tbody','tr','th','td','blockquote','hr','br','code'],allowedAttributes:{a:['href','title','target','rel']},allowedSchemes:['https','http','mailto'],allowProtocolRelative:false,transformTags:{a:(tag,attrs)=>({tagName:'a',attribs:{...attrs,rel:'noopener noreferrer'}})}});}
const seedSettings={brandName:'Tim’s Diecast Garage',brandShort:'TIM’S',brandSubtitle:'DIECAST GARAGE',location:'Arizona, United States',tagline:'Hot Wheels & collector cars.',footerNote:'An Arizona-based collector-store concept for Tim. Inventory, pricing and business policies await seller confirmation. No payments are accepted.',supportEmail:'',announcement:'Customer preview · Prices in USD · Orders not open',heroLine1:'Small scale.',heroLine2:'Big obsession.',heroDescription:'The castings you remember. The details you notice. The next piece you can’t stop thinking about.',heroProductId:'featured-2',featuredIds:['featured-2','featured-1','gold-roadster','car-culture'],homeFilmUrl:'/storefront/media/showroom.mp4',shippingCents:695,freeShippingThresholdCents:10000};
function createStore(options={}){
 const directory=path.resolve(options.directory||process.env.DATA_DIR||path.join(__dirname,'../.runtime'));
 const durable=options.durable??(process.env.NODE_ENV!=='production'||!!process.env.RAILWAY_VOLUME_MOUNT_PATH);
 fs.mkdirSync(directory,{recursive:true});
 for(const folder of ['uploads','tmp','backups'])fs.mkdirSync(path.join(directory,folder),{recursive:true});
 const file=path.join(directory,'garage.json');
 function initial(){
  const media=new Map();
  for(const p of seedProducts)for(const url of p.images)media.set(url,{id:hash(url).slice(0,24),url,type:'image',name:path.basename(url),bytes:fs.statSync(path.join(__dirname,'..',url)).size,builtIn:true,createdAt:new Date().toISOString()});
  media.set(seedSettings.homeFilmUrl,{id:hash(seedSettings.homeFilmUrl).slice(0,24),url:seedSettings.homeFilmUrl,type:'video',name:'Original showroom film',bytes:2864458,builtIn:true,createdAt:new Date().toISOString()});
  const products=seedProducts.map((p,index)=>{const draft={...p,order:index,quantity:null,videoUrl:'',videoTranscript:'',featured:seedSettings.featuredIds.includes(p.id)};return {id:p.id,draft,live:clone(draft),revision:1,archived:false,deletedAt:null,updatedAt:new Date().toISOString()};});
  return {schema:1,installationId:crypto.randomUUID(),revision:1,products,pages:Object.fromEntries(Object.entries(seedPages).map(([id,p])=>[id,{id,draft:p,live:clone(p),revision:1}])),settings:{draft:clone(seedSettings),live:clone(seedSettings),revision:1},media:[...media.values()],users:[],sessions:[],invites:[],audit:[]};
 }
 function atomic(data){const encoded=JSON.stringify(data);if(Buffer.byteLength(encoded)>15*1024*1024)throw fail('The content file is at its safe size limit. Export a backup and reduce unused content.',413);const temp=file+'.'+secret().slice(0,12)+'.tmp';const fd=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(fd,encoded);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);if(process.platform!=='win32'){const dir=fs.openSync(directory,'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}}}
 let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):initial();
 if(state.schema!==1)throw Error('Unsupported garage data format. Restore a verified backup.');
 if(!fs.existsSync(file)&&durable)atomic(state);
 function update(actor,action,fn,{backup=true}={}){
  if(!durable)throw fail('Persistent storage is not connected. Editing is disabled to protect your changes.',503);
  const next=clone(state);const result=fn(next);
  next.revision++;next.audit.unshift({id:secret().slice(0,16),at:new Date().toISOString(),actor:actor||'system',action});next.audit=next.audit.slice(0,300);
  if(backup){const name=new Date().toISOString().replace(/[:.]/g,'-')+'-'+secret().slice(0,8)+'.json';fs.writeFileSync(path.join(directory,'backups',name),JSON.stringify(state),{mode:0o600});const files=fs.readdirSync(path.join(directory,'backups')).sort().reverse();let total=0;for(let i=0;i<files.length;i++){total+=fs.statSync(path.join(directory,'backups',files[i])).size;if(i>=40||total>50*1024*1024)fs.unlinkSync(path.join(directory,'backups',files[i]));}}
  atomic(next);state=next;return result;
 }
 const knownMedia=(url,type)=>url===''||state.media.some(m=>m.url===url&&(!type||m.type===type)&&!m.deletedAt);
 function product(input,id,library=state.media){
  if(!input||typeof input!=='object')throw fail('Product information is missing.');
  const p={id};
  for(const [key,max] of Object.entries({name:160,description:6000,category:80,brand:80,series:150,scale:120,packaging:250,condition:2000,sku:100,videoTranscript:6000}))p[key]=text(input[key]??'',key,max,key==='name');
  if(!Number.isInteger(input.priceCents)||input.priceCents<0||input.priceCents>100000000)throw fail('Enter a valid USD price.');p.priceCents=input.priceCents;
  if(!['vehicle','lifestyle'].includes(input.kind))throw fail('Choose vehicle or lifestyle.');p.kind=input.kind;
  if(input.quantity!==null&&(!Number.isInteger(input.quantity)||input.quantity<0||input.quantity>1000000))throw fail('Enter a whole stock count, or leave it unknown.');p.quantity=input.quantity;
  if(!Number.isInteger(input.order)||input.order<0||input.order>1000000)throw fail('Display order must be a positive whole number.');p.order=input.order;
  for(const key of ['options','highlights']){if(!Array.isArray(input[key])||input[key].length>30)throw fail('Please check '+key+'.');p[key]=input[key].map(x=>text(x,key,250,true));}if(!p.options.length)p.options=['Standard'];
  const available=(url,type)=>library.some(m=>m.url===url&&m.type===type&&!m.deletedAt);
  if(!Array.isArray(input.images)||input.images.length>20||new Set(input.images).size!==input.images.length||input.images.some(x=>!available(x,'image')))throw fail('Choose up to 20 images from the media library.');p.images=[...input.images];
  p.videoUrl=text(input.videoUrl??'','video',250);if(p.videoUrl&&!available(p.videoUrl,'video'))throw fail('Choose a video from the media library.');
  p.featured=!!input.featured;p.verification='Demonstration listing; final sale details await approval.';p.priceBasis='Illustrative USD demo price; not a current market valuation.';
  return p;
 }
 function settings(input,products=state.products,library=state.media){
  const s={};for(const [key,max] of Object.entries({brandName:100,brandShort:30,brandSubtitle:50,location:120,tagline:160,footerNote:500,supportEmail:180,announcement:180,heroLine1:70,heroLine2:70,heroDescription:600,heroProductId:100,homeFilmUrl:250}))s[key]=text(input[key]??'',key,max,['brandName','brandShort','brandSubtitle'].includes(key));
  if(s.supportEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.supportEmail))throw fail('Please check the support email.');
  if(s.heroProductId&&!products.some(p=>p.id===s.heroProductId))throw fail('Choose an existing hero product.');
  if(!Array.isArray(input.featuredIds)||input.featuredIds.length>4||input.featuredIds.some(id=>!products.some(p=>p.id===id)))throw fail('Choose up to four existing featured products.');s.featuredIds=[...new Set(input.featuredIds)];
  if(s.homeFilmUrl&&!library.some(m=>m.url===s.homeFilmUrl&&m.type==='video'&&!m.deletedAt))throw fail('Choose a film from the media library.');
  for(const key of ['shippingCents','freeShippingThresholdCents']){if(!Number.isInteger(input[key])||input[key]<0||input[key]>10000000)throw fail('Check the shipping amounts.');s[key]=input[key];}
  return s;
 }
 function page(input,id){return {id,tag:text(input.tag,'page label',100,true),title:text(input.title,'page title',200,true),bodyMarkdown:text(input.bodyMarkdown,'page body',80000,true)};}
 function pageHtml(source){const s=state.settings.live;const html=renderMarkdown(source.replaceAll('{{shipping_rate}}',new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(s.shippingCents/100)).replaceAll('{{free_shipping_threshold}}',new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(s.freeShippingThresholdCents/100)));return /^<p>(<strong>)?(Demonstration policy|Current showroom notice)/.test(html)?html.replace(/^<p>([\s\S]*?)<\/p>/,'<div class="policy-note">$1</div>'):html;}
 function catalog(){return {products:state.products.filter(p=>p.live&&!p.archived&&!p.deletedAt).map(p=>clone(p.live)).sort((a,b)=>a.order-b.order),settings:clone(state.settings.live),pages:Object.fromEntries(Object.entries(state.pages).map(([id,p])=>[id,[p.live.tag,p.live.title,pageHtml(p.live.bodyMarkdown)]])),currency:'USD',mode:'showroom'};}
 function content(){return {schema:1,exportedAt:new Date().toISOString(),products:clone(state.products),pages:clone(state.pages),settings:clone(state.settings),media:clone(state.media)};}
 return {directory,durable,get state(){return state;},update,product,settings,page,catalog,content,knownMedia};
}
module.exports={createStore,passwordHash,passwordMatches,hash,secret,fail,renderMarkdown,text};
