const express=require('express');
const rateLimit=require('express-rate-limit');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
const multer=require('multer');
const sharp=require('sharp');
const {ZipArchive}=require('archiver');
const yauzl=require('yauzl');
const {passwordHash,passwordMatches,hash,secret,fail,renderMarkdown,text}=require('./garage-store');
const userView=u=>({id:u.id,username:u.username,name:u.name,role:u.role,active:u.active});
function readSession(req,store,cookieName){const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);const s=raw&&store.state.sessions.find(s=>s.tokenHash===hash(raw)&&s.expires>Date.now());const u=s&&store.state.users.find(u=>u.id===s.userId&&u.active);return u?{s,u}:null;}
function adminApi(store,options={}){
 const router=express.Router();const cookieName=options.secure?'__Host-garage':'garage-session';
 const setupHash=options.setupHash||process.env.ADMIN_SETUP_HASH||'';
 const cookieOptions={httpOnly:true,secure:!!options.secure,sameSite:'strict',path:'/',maxAge:8*60*60*1000};
 router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 router.use((req,_res,next)=>{if(!['GET','HEAD'].includes(req.method)){const origin=req.get('origin');if(origin){const url=new URL(origin);if(url.host!==req.get('host')||!['http:','https:'].includes(url.protocol))return next(fail('This request did not come from the admin site.',403));}if(req.get('sec-fetch-site')==='cross-site')return next(fail('This request did not come from the admin site.',403));}next();});
 const loginLimit=rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many sign-in attempts. Try again in 15 minutes.'}});
 const now=()=>Date.now();
 function session(req){return readSession(req,store,cookieName);}
 function signedIn(req,_res,next){const auth=session(req);if(!auth)return next(fail('Please sign in again.',401));req.auth=auth;if(!['GET','HEAD'].includes(req.method)&&req.get('X-CSRF-Token')!==auth.s.csrf)return next(fail('Your session needs refreshing. Reload the admin page.',403));next();}
 function owner(req,_res,next){return req.auth.u.role==='owner'?next():next(fail('Only an owner can do that.',403));}
 function signIn(res,u){const token=secret(),csrf=secret();store.update(u.username,'Signed in',s=>{s.sessions=s.sessions.filter(x=>x.expires>now()).slice(-100);s.sessions.push({tokenHash:hash(token),userId:u.id,csrf,expires:now()+8*60*60*1000});},{backup:false});res.cookie(cookieName,token,cookieOptions);return {user:userView(u),csrf};}
 function username(value){const name=text(value,'username',80,true).toLowerCase();if(!/^[a-z0-9][a-z0-9._@+-]{2,79}$/.test(name))throw fail('Use 3–80 letters, numbers, dots or an email address for the username.');return name;}
 function revision(record,req){if(Number(req.body.revision)!==record.revision)throw fail('Someone changed this item after you opened it. Reload it before saving.',409);}
 router.get('/status',(_req,res)=>res.json({configured:store.state.users.length>0,setupAvailable:!!setupHash&&store.durable,storageReady:store.durable}));
 router.post('/setup',loginLimit,(req,res)=>{
  if(store.state.users.length||!setupHash||!store.durable)throw fail('Setup is not available.',403);
  if(typeof req.body.code!=='string'||hash(req.body.code)!==setupHash)throw fail('The setup code is not valid.',403);
  const u={id:secret().slice(0,24),username:username(req.body.username),name:text(req.body.name,'display name',80,true),role:'owner',active:true,passwordHash:passwordHash(req.body.password)};const recovery=secret();u.recoveryHash=hash(recovery);
  store.update(u.username,'Created owner account',s=>s.users.push(u));res.json({...signIn(res,u),recoveryCode:recovery});
 });
 router.post('/login',loginLimit,(req,res)=>{const u=store.state.users.find(u=>u.username===String(req.body.username||'').toLowerCase()&&u.active);if(!passwordMatches(req.body.password,u?.passwordHash))throw fail('Username or password is incorrect.',401);res.json(signIn(res,u));});
 router.post('/recover',loginLimit,(req,res)=>{const u=store.state.users.find(u=>u.username===String(req.body.username||'').toLowerCase()&&u.active);if(!u||!req.body.code||u.recoveryHash!==hash(req.body.code))throw fail('The recovery details are not valid.',403);const recovery=secret(),encoded=passwordHash(req.body.password);store.update(u.username,'Recovered account and revoked sessions',s=>{const x=s.users.find(x=>x.id===u.id);x.passwordHash=encoded;x.recoveryHash=hash(recovery);s.sessions=s.sessions.filter(x=>x.userId!==u.id);});res.json({...signIn(res,store.state.users.find(x=>x.id===u.id)),recoveryCode:recovery});});
 router.post('/accept-invite',loginLimit,(req,res)=>{const invite=store.state.invites.find(i=>i.hash===hash(req.body.code||'')&&i.expires>now());if(!invite)throw fail('This invitation is invalid or expired.',403);const name=username(req.body.username);if(store.state.users.some(u=>u.username===name))throw fail('That username is already in use.');const recovery=secret();const u={id:secret().slice(0,24),name:text(req.body.name,'name',80,true),username:name,role:invite.role,active:true,passwordHash:passwordHash(req.body.password),recoveryHash:hash(recovery)};store.update(name,'Accepted team invitation',s=>{s.users.push(u);s.invites=s.invites.filter(i=>i.hash!==invite.hash);});res.json({...signIn(res,u),recoveryCode:recovery});});
 router.use(signedIn);
 router.get('/me',(req,res)=>res.json({user:userView(req.auth.u),csrf:req.auth.s.csrf}));
 router.post('/logout',(req,res)=>{store.update(req.auth.u.username,'Signed out',s=>s.sessions=s.sessions.filter(x=>x.tokenHash!==req.auth.s.tokenHash),{backup:false});res.clearCookie(cookieName,cookieOptions);res.json({success:true});});
 router.post('/password',(req,res)=>{if(!passwordMatches(req.body.currentPassword,req.auth.u.passwordHash))throw fail('Current password is incorrect.',403);const encoded=passwordHash(req.body.password),recovery=secret();store.update(req.auth.u.username,'Changed password and revoked sessions',s=>{const u=s.users.find(u=>u.id===req.auth.u.id);u.passwordHash=encoded;u.recoveryHash=hash(recovery);s.sessions=s.sessions.filter(x=>x.userId!==u.id);});res.json({...signIn(res,store.state.users.find(u=>u.id===req.auth.u.id)),recoveryCode:recovery});});
 router.get('/dashboard',(req,res)=>res.json({products:store.state.products,pages:store.state.pages,settings:store.state.settings,media:store.state.media,audit:store.state.audit.slice(0,80),users:req.auth.u.role==='owner'?store.state.users.map(userView):[],storage:{ready:store.durable,usedBytes:store.state.media.filter(m=>!m.builtIn).reduce((n,m)=>n+m.bytes,0),limitBytes:800*1024*1024},backups:fs.readdirSync(path.join(store.directory,'backups')).sort().reverse()}));
 router.post('/products',(req,res)=>{if(store.state.products.length>=1000)throw fail('The catalog limit is 1,000 items.');const id='item-'+secret().slice(0,16);const draft=store.product(req.body.product,id);const record={id,draft,live:null,revision:1,archived:false,deletedAt:null,updatedAt:new Date().toISOString()};store.update(req.auth.u.username,'Created draft: '+draft.name,s=>s.products.push(record));res.status(201).json(record);});
 router.put('/products/:id',(req,res)=>{const record=store.state.products.find(p=>p.id===req.params.id&&!p.deletedAt);if(!record)throw fail('Product not found.',404);revision(record,req);const draft=store.product(req.body.product,record.id);store.update(req.auth.u.username,'Saved draft: '+draft.name,s=>{const p=s.products.find(p=>p.id===record.id);p.draft=draft;p.revision++;p.updatedAt=new Date().toISOString();});res.json(store.state.products.find(p=>p.id===record.id));});
 router.post('/products/:id/action',(req,res)=>{
  const record=store.state.products.find(p=>p.id===req.params.id);if(!record)throw fail('Product not found.',404);revision(record,req);
  const action=req.body.action;if(!['publish','archive','trash','restore','duplicate','revert'].includes(action))throw fail('Unknown action.');
  if(action==='duplicate'&&store.state.products.length>=1000)throw fail('The catalog limit is 1,000 items.');
  if(action==='publish'&&(!record.draft.images.length||record.draft.description.length<20||record.draft.priceCents<=0))throw fail('Add at least one photo, a description of 20 characters, and a price above zero before publishing.');
  let resultId=record.id;
  store.update(req.auth.u.username,action+': '+record.draft.name,s=>{
   const p=s.products.find(p=>p.id===record.id);
   if(action==='publish'){p.live=clone(p.draft);p.archived=false;p.deletedAt=null;}
   if(action==='archive')p.archived=true;
   if(action==='trash'){p.deletedAt=new Date().toISOString();p.archived=true;}
   if(action==='restore'){p.deletedAt=null;p.archived=true;}
   if(action==='revert'){if(!p.live)throw fail('This item has no published version.');p.draft=clone(p.live);}
   if(action==='duplicate'){resultId='item-'+secret().slice(0,16);s.products.push({id:resultId,draft:{...clone(p.draft),id:resultId,name:p.draft.name+' — copy',sku:p.draft.sku+'-COPY'},live:null,revision:1,archived:false,deletedAt:null,updatedAt:new Date().toISOString()});}
   p.revision++;p.updatedAt=new Date().toISOString();
  });res.json(store.state.products.find(p=>p.id===resultId));
 });
 router.post('/products/:id/purge',owner,(req,res)=>{const record=store.state.products.find(p=>p.id===req.params.id);if(!record||!record.deletedAt)throw fail('Move the product to the recycle bin first.');if(req.body.confirm!==record.draft.name)throw fail('Type the exact product name to confirm permanent removal.');store.update(req.auth.u.username,'Permanently removed product: '+record.draft.name,s=>{s.products=s.products.filter(p=>p.id!==record.id);for(const key of ['draft','live']){s.settings[key].featuredIds=s.settings[key].featuredIds.filter(id=>id!==record.id);if(s.settings[key].heroProductId===record.id)s.settings[key].heroProductId='';}s.settings.revision++;});res.json({success:true});});
 router.put('/pages/:id',(req,res)=>{const record=store.state.pages[req.params.id];if(!record)throw fail('Page not found.',404);revision(record,req);const page=store.page(req.body.page,record.id);store.update(req.auth.u.username,'Saved page draft: '+page.title,s=>{s.pages[record.id].draft=page;s.pages[record.id].revision++;});res.json(store.state.pages[record.id]);});
 router.post('/pages/:id/publish',(req,res)=>{const record=store.state.pages[req.params.id];if(!record)throw fail('Page not found.',404);revision(record,req);store.update(req.auth.u.username,'Published page: '+record.draft.title,s=>{s.pages[record.id].live=clone(record.draft);s.pages[record.id].revision++;});res.json(store.state.pages[record.id]);});
 router.post('/preview-page',(req,res)=>res.json({html:renderMarkdown(text(req.body.markdown,'page body',80000,true))}));
 router.put('/settings',(req,res)=>{revision(store.state.settings,req);const settings=store.settings(req.body.settings);store.update(req.auth.u.username,'Saved store settings draft',s=>{s.settings.draft=settings;s.settings.revision++;});res.json(store.state.settings);});
 router.post('/settings/publish',(req,res)=>{revision(store.state.settings,req);const draft=store.state.settings.draft;if(draft.heroProductId&&!store.catalog().products.some(p=>p.id===draft.heroProductId))throw fail('Publish the selected hero product first.');store.update(req.auth.u.username,'Published store settings',s=>{s.settings.live=clone(s.settings.draft);s.settings.revision++;});res.json(store.state.settings);});
 const tempDirectory=path.join(os.tmpdir(),'tims-garage-uploads');fs.mkdirSync(tempDirectory,{recursive:true});
 const upload=multer({dest:tempDirectory,limits:{fileSize:100*1024*1024,files:1,fields:1}}).single('file');
 const backupUpload=multer({dest:tempDirectory,limits:{fileSize:1024*1024*1024,files:1,fields:1}}).single('file');
 router.post('/media',upload,async(req,res)=>{
  if(!req.file)throw fail('Choose a JPEG, PNG, WebP image or MP4/WebM video.');
  const temp=req.file.path;let destination;
  try{
   if(store.state.media.filter(m=>!m.builtIn).reduce((n,m)=>n+m.bytes,0)+req.file.size>800*1024*1024)throw fail('Media storage is nearly full. Download a backup and review the library.');
   const fd=fs.openSync(temp,'r'),head=Buffer.alloc(16);fs.readSync(fd,head,0,16,0);fs.closeSync(fd);
   const image=head.subarray(0,3).equals(Buffer.from([255,216,255]))||head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(head.toString('ascii',0,4)==='RIFF'&&head.toString('ascii',8,12)==='WEBP');
   const ext=image?'webp':head.toString('ascii',4,8)==='ftyp'?'mp4':head.subarray(0,4).equals(Buffer.from([26,69,223,163]))?'webm':null;
   if(!ext)throw fail('Unsupported file content. Use JPEG, PNG, WebP, MP4 or WebM.');
   if(image&&req.file.size>25*1024*1024)throw fail('Images must be under 25 MB.');
   const id=secret().slice(0,32);destination=path.join(store.directory,'uploads',id+'.'+ext);
   if(image)await sharp(temp,{limitInputPixels:40000000,animated:false}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(destination);else fs.copyFileSync(temp,destination);
   const media={id,url:'/media/'+path.basename(destination),type:image?'image':'video',name:text(req.file.originalname,'file name',250),bytes:fs.statSync(destination).size,builtIn:false,createdAt:new Date().toISOString()};
   if(store.state.media.filter(m=>!m.builtIn).reduce((n,m)=>n+m.bytes,0)+media.bytes>800*1024*1024)throw fail('Media storage is nearly full. Review unused uploads before retrying.');
   store.update(req.auth.u.username,'Uploaded media: '+media.name,s=>s.media.unshift(media));res.status(201).json(media);
  }catch(error){if(destination&&fs.existsSync(destination))fs.unlinkSync(destination);if(error.status)throw error;throw fail('This file could not be processed. Try another supported image or video.');}
  finally{fs.rmSync(temp,{force:true});}
 });
 router.post('/media/:id/remove',(req,res)=>{const m=store.state.media.find(m=>m.id===req.params.id&&!m.deletedAt);if(!m)throw fail('Media not found.',404);const used=store.state.products.some(p=>[p.draft,p.live].filter(Boolean).some(x=>x.images.includes(m.url)||x.videoUrl===m.url))||[store.state.settings.draft,store.state.settings.live].some(s=>s.homeFilmUrl===m.url);if(used)throw fail('This file is attached to a product or the home page. Remove those references first.',409);store.update(req.auth.u.username,'Removed media from library: '+m.name,s=>s.media.find(x=>x.id===m.id).deletedAt=new Date().toISOString());res.json({success:true,note:'The file is retained for backup recovery.'});});
 router.post('/media/:id/restore',(req,res)=>{const m=store.state.media.find(m=>m.id===req.params.id&&m.deletedAt);if(!m)throw fail('Recovery file not found.',404);store.update(req.auth.u.username,'Restored media to library: '+m.name,s=>s.media.find(x=>x.id===m.id).deletedAt=null);res.json({success:true});});
 router.post('/media/:id/purge',owner,(req,res)=>{const m=store.state.media.find(m=>m.id===req.params.id);if(!m||m.builtIn)throw fail('Only unused uploaded files can be permanently removed.');if(req.body.confirm!==m.name)throw fail('Type the exact file name to confirm.');const used=store.state.products.some(p=>[p.draft,p.live].filter(Boolean).some(x=>x.images.includes(m.url)||x.videoUrl===m.url))||[store.state.settings.draft,store.state.settings.live].some(s=>s.homeFilmUrl===m.url);if(used)throw fail('This file is still attached to content. Remove those references, or permanently remove the trashed product first.',409);const file=path.join(store.directory,'uploads',path.basename(m.url)),quarantine=path.join(store.directory,'tmp',secret());if(fs.existsSync(file))fs.renameSync(file,quarantine);try{store.update(req.auth.u.username,'Permanently removed media: '+m.name,s=>s.media=s.media.filter(x=>x.id!==m.id));}catch(error){if(fs.existsSync(quarantine))fs.renameSync(quarantine,file);throw error;}fs.rmSync(quarantine,{force:true});res.json({success:true});});
 router.get('/export',owner,(req,res)=>{res.attachment('tims-garage-content-'+new Date().toISOString().slice(0,10)+'.json').json(store.content());});
 router.get('/backup.zip',owner,(_req,res)=>{res.attachment('tims-garage-full-backup-'+new Date().toISOString().slice(0,10)+'.zip');const zip=new ZipArchive({zlib:{level:1}});zip.on('error',()=>res.destroy());zip.pipe(res);zip.append(JSON.stringify(store.content(),null,2),{name:'content.json'});zip.append('This private backup contains catalog, pages, settings, media metadata and uploaded files. It excludes passwords and sessions. Restore it through Garage Admin > Backups. Original bundled photos remain in the source repository. Keep this file private.\n',{name:'README.txt'});zip.directory(path.join(store.directory,'uploads'),'media');zip.finalize();});
 router.get('/snapshots',owner,(_req,res)=>res.json(fs.readdirSync(path.join(store.directory,'backups')).filter(n=>n.endsWith('.json')).sort().reverse()));
 function restoreContent(content,actor){
  if(content.schema!==1||!Array.isArray(content.products)||content.products.length>1000||!Array.isArray(content.media)||content.media.length>5000)throw fail('Unsupported backup format.');
  const ids=new Set();for(const p of content.products){if(!p||typeof p.id!=='string'||!/^[a-z0-9-]{1,100}$/.test(p.id)||ids.has(p.id))throw fail('Invalid product IDs in backup.');ids.add(p.id);}
  // Validate against the backup library while keeping the current store untouched on failure.
  const library=content.media;for(const m of library){if(!m||!['image','video'].includes(m.type)||typeof m.url!=='string'||!/^\/(storefront\/media\/[a-zA-Z0-9._-]+|media\/[a-f0-9]{32}\.(webp|mp4|webm))$/.test(m.url))throw fail('Invalid media in backup.');const file=m.url.startsWith('/media/')?path.join(store.directory,'uploads',path.basename(m.url)):path.join(__dirname,'..',m.url);if(!fs.existsSync(file))throw fail('A backup media file is missing: '+path.basename(m.url));}
  const mediaUrls=new Set(library.map(m=>m.url));if(mediaUrls.size!==library.length)throw fail('Duplicate media references in backup.');
  const restoredRevision=store.state.revision+1;
  const products=content.products.map(p=>({id:p.id,draft:store.product(p.draft,p.id,library),live:p.live?store.product(p.live,p.id,library):null,archived:!!p.archived,deletedAt:p.deletedAt?new Date().toISOString():null,revision:restoredRevision,updatedAt:new Date().toISOString()}));
  const pages={};for(const id of Object.keys(store.state.pages)){const p=content.pages?.[id];if(!p)throw fail('Required page missing: '+id);pages[id]={id,draft:store.page(p.draft,id),live:store.page(p.live,id),revision:restoredRevision};}
  if(!content.settings?.live||!content.settings?.draft)throw fail('Settings missing in backup.');
  const settings={draft:store.settings(content.settings.draft,products,library),live:store.settings(content.settings.live,products,library),revision:restoredRevision};
  const media=library.map(m=>({id:hash(m.url).slice(0,24),url:m.url,type:m.type,name:text(m.name||path.basename(m.url),'media name',250,true),bytes:fs.statSync(m.url.startsWith('/media/')?path.join(store.directory,'uploads',path.basename(m.url)):path.join(__dirname,'..',m.url)).size,builtIn:m.url.startsWith('/storefront/'),deletedAt:m.deletedAt?new Date().toISOString():null,createdAt:new Date().toISOString()}));
  for(const m of store.state.media)if(!mediaUrls.has(m.url))media.push({...clone(m),deletedAt:new Date().toISOString()});
  store.update(actor,'Restored content backup (accounts unchanged)',s=>{s.products=products;s.pages=pages;s.settings=settings;s.media=media;});
 }
 router.post('/snapshots/restore',owner,(req,res)=>{const name=text(req.body.name,'snapshot',100,true);if(!/^\d{4}-[\w.-]+\.json$/.test(name)||req.body.confirm!=='RESTORE')throw fail('Type RESTORE to confirm.');const file=path.join(store.directory,'backups',name);if(!fs.existsSync(file))throw fail('Snapshot not found.',404);restoreContent(JSON.parse(fs.readFileSync(file,'utf8')),req.auth.u.username);res.json({success:true});});
 router.post('/restore',owner,backupUpload,async(req,res)=>{
  if(!req.file||req.body.confirm!=='RESTORE'){if(req.file)fs.rmSync(req.file.path,{force:true});throw fail('Choose a full backup ZIP and type RESTORE.');}
  const temp=req.file.path,staged=[];let content,total=0;
  try{
   await new Promise((resolve,reject)=>yauzl.open(temp,{lazyEntries:true},(error,zip)=>{
    if(error)return reject(fail('Could not open the backup ZIP.'));let count=0;
    const abort=e=>{zip.close();reject(e);};zip.on('error',abort);zip.on('end',resolve);
    zip.on('entry',entry=>{
     if(++count>5005||entry.uncompressedSize>100*1024*1024||(total+=entry.uncompressedSize)>900*1024*1024)return abort(fail('Backup is too large.'));
     const name=entry.fileName;
     if(name==='README.txt'||name==='media/'){zip.readEntry();return;}
     if(name!=='content.json'&&!/^media\/[a-f0-9]{32}\.(webp|mp4|webm)$/.test(name))return abort(fail('Unexpected file in backup.'));
     if(name==='content.json'&&entry.uncompressedSize>20*1024*1024)return abort(fail('Backup content is too large.'));
     zip.openReadStream(entry,(e,stream)=>{if(e)return abort(e);const chunks=[];stream.on('data',c=>chunks.push(c));stream.on('error',abort);stream.on('end',()=>{try{const data=Buffer.concat(chunks);if(name==='content.json')content=JSON.parse(data.toString('utf8'));else{const dest=path.join(store.directory,'uploads',path.basename(name));if(fs.existsSync(dest)){if(hash(fs.readFileSync(dest))!==hash(data))throw fail('A backup file conflicts with an existing media file.');}else{const used=fs.readdirSync(path.join(store.directory,'uploads')).reduce((n,f)=>n+fs.statSync(path.join(store.directory,'uploads',f)).size,0);if(used+data.length>800*1024*1024)throw fail('Not enough media space for this restore. Download a current backup, then remove unused uploads before retrying.');fs.writeFileSync(dest,data,{flag:'wx',mode:0o600});staged.push(dest);}}zip.readEntry();}catch(err){abort(err);}});});
    });zip.readEntry();
   }));
   restoreContent(content||{},req.auth.u.username);res.json({success:true});
  }catch(error){for(const file of staged)fs.rmSync(file,{force:true});if(error.status)throw error;throw fail('The backup could not be restored. Current content was not changed.');}finally{fs.rmSync(temp,{force:true});}
 });
 router.post('/team/invite',owner,(req,res)=>{if(!['owner','editor'].includes(req.body.role))throw fail('Choose owner or editor.');const code=secret();store.update(req.auth.u.username,'Created '+req.body.role+' invitation',s=>s.invites=[...s.invites.filter(i=>i.expires>now()),{hash:hash(code),role:req.body.role,expires:now()+24*60*60*1000}].slice(-30));res.json({code,expires:new Date(now()+24*60*60*1000).toISOString()});});
 router.put('/team/:id',owner,(req,res)=>{const u=store.state.users.find(u=>u.id===req.params.id);if(!u)throw fail('User not found.',404);if(!['owner','editor'].includes(req.body.role)||typeof req.body.active!=='boolean')throw fail('Check the user role and access.');if(u.role==='owner'&&(!req.body.active||req.body.role!=='owner')&&store.state.users.filter(u=>u.role==='owner'&&u.active).length<=1)throw fail('Keep at least one active owner.');store.update(req.auth.u.username,'Changed team access: '+u.username,s=>{const x=s.users.find(x=>x.id===u.id);x.role=req.body.role;x.active=req.body.active;s.sessions=s.sessions.filter(x=>x.userId!==u.id);});res.json({success:true});});
 return router;
}
const clone=value=>structuredClone(value);
module.exports={adminApi,hasAdminSession:(req,store,secure)=>!!readSession(req,store,secure?'__Host-garage':'garage-session')};
