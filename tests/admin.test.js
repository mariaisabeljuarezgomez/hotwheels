const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const {createStore,hash,secret}=require('../lib/garage-store');
const {createApp}=require('../server');
test('protected management, draft publishing, media, recovery and persistence work together',async t=>{
 const directory=fs.mkdtempSync(path.join(__dirname,'../.qa/admin-unit-'));
 const store=createStore({directory,durable:true}),setup=secret();
 const app=createApp({store,setupHash:hash(setup)}),server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 let cookie='',csrf='',ownerId;
 const call=async(url,{method='GET',body,auth=true,token=csrf,session=cookie}={})=>{
  const res=await fetch(base+url,{method,headers:{...(auth?{Cookie:session,'X-CSRF-Token':token}:{}),...(body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
  const type=res.headers.get('content-type')||'';const data=type.includes('json')?await res.json():Buffer.from(await res.arrayBuffer());
  return {res,data};
 };
 const adopt=result=>{cookie=result.res.headers.get('set-cookie').split(';')[0];csrf=result.data.csrf;};
 await t.test('setup is secret-gated and sessions plus CSRF protect writes',async()=>{
  assert.equal((await call('/api/admin/dashboard',{auth:false})).res.status,401);
  assert.equal((await call('/api/admin/setup',{method:'POST',body:{code:'incorrect'},auth:false})).res.status,403);
  const result=await call('/api/admin/setup',{method:'POST',auth:false,body:{code:setup,name:'Local test owner',username:'test.owner',password:'A long local test password 123!'}});assert.equal(result.res.status,200);assert.ok(result.data.recoveryCode);adopt(result);ownerId=result.data.user.id;
  assert.ok(/HttpOnly/.test(result.res.headers.get('set-cookie')));
  assert.equal((await call('/api/admin/setup',{method:'POST',auth:false,body:{code:setup}})).res.status,403);
  assert.equal((await call('/api/admin/products',{method:'POST',body:{},token:'wrong'})).res.status,403);
 });
 let image,video,record,backup;
 await t.test('uploads reject active content and optimize valid images',async()=>{
  const bad=new FormData();bad.append('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/svg+xml'}),'attack.svg');assert.equal((await call('/api/admin/media',{method:'POST',body:bad})).res.status,400);
  const png=await sharp({create:{width:80,height:80,channels:3,background:'#ff6838'}}).png().toBuffer();const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'test-image.png');
  const result=await call('/api/admin/media',{method:'POST',body:form});assert.equal(result.res.status,201);image=result.data;assert.match(image.url,/\.webp$/);assert.ok(fs.existsSync(path.join(directory,'uploads',path.basename(image.url))));
  assert.equal((await call(image.url,{auth:false})).res.status,404);assert.equal((await call(image.url)).res.status,200);
  const v=new FormData();v.append('file',new Blob([fs.readFileSync(path.join(__dirname,'../storefront/media/showroom.mp4'))],{type:'video/mp4'}),'test-film.mp4');const upload=await call('/api/admin/media',{method:'POST',body:v});assert.equal(upload.res.status,201);video=upload.data;
 });
 await t.test('drafts stay private, publishing uses saved content, stale revisions cannot overwrite',async()=>{
  const draft={...store.state.products[0].draft,name:'QA collection item',priceCents:1999,images:[image.url,store.state.products[0].draft.images[0]],videoUrl:video.url,videoTranscript:'Silent visual test clip.',sku:'QA-ITEM',quantity:3};
  const made=await call('/api/admin/products',{method:'POST',body:{product:draft}});assert.equal(made.res.status,201);record=made.data;
  assert.ok(!store.catalog().products.some(p=>p.id===record.id));
  let result=await call('/api/admin/products/'+record.id+'/action',{method:'POST',body:{revision:record.revision,action:'publish'}});record=result.data;assert.equal(store.catalog().products.find(p=>p.id===record.id).priceCents,1999);
  assert.equal((await call(image.url,{auth:false})).res.status,200);
  const oldRevision=record.revision;result=await call('/api/admin/products/'+record.id,{method:'PUT',body:{revision:record.revision,product:{...record.draft,priceCents:2999,images:[...record.draft.images].reverse()}}});record=result.data;
  assert.equal(store.catalog().products.find(p=>p.id===record.id).priceCents,1999);
  assert.equal((await call('/api/admin/products/'+record.id,{method:'PUT',body:{revision:oldRevision,product:record.draft}})).res.status,409);
  result=await call('/api/admin/products/'+record.id+'/action',{method:'POST',body:{revision:record.revision,action:'publish'}});record=result.data;
  assert.equal(store.catalog().products.find(p=>p.id===record.id).priceCents,2999);assert.equal(store.catalog().products.find(p=>p.id===record.id).images[1],image.url);
  assert.equal((await call('/api/admin/media/'+image.id+'/remove',{method:'POST',body:{}})).res.status,409);
 });
 await t.test('archive and recycle-bin recovery never silently republish',async()=>{
  for(const action of ['archive','trash','restore']){const result=await call('/api/admin/products/'+record.id+'/action',{method:'POST',body:{revision:record.revision,action}});assert.equal(result.res.status,200);record=result.data;assert.ok(!store.catalog().products.some(p=>p.id===record.id));}
  record=(await call('/api/admin/products/'+record.id+'/action',{method:'POST',body:{revision:record.revision,action:'publish'}})).data;
 });
 await t.test('page content is sanitized, settings publish separately and shipping stays authoritative',async()=>{
  const page=store.state.pages.about;const saved=await call('/api/admin/pages/about',{method:'PUT',body:{revision:page.revision,page:{...page.draft,title:'A test story',bodyMarkdown:'## A heading\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))'}}});assert.equal(saved.res.status,200);
  assert.notEqual(store.catalog().pages.about[1],'A test story');
  await call('/api/admin/pages/about/publish',{method:'POST',body:{revision:saved.data.revision}});assert.equal(store.catalog().pages.about[1],'A test story');assert.ok(!store.catalog().pages.about[2].includes('<script>'));assert.ok(!store.catalog().pages.about[2].includes('href="javascript:'));
  const before=store.state.settings;const result=await call('/api/admin/settings',{method:'PUT',body:{revision:before.revision,settings:{...before.draft,shippingCents:895}}});assert.equal(result.res.status,200);assert.equal(store.catalog().settings.shippingCents,695);
  await call('/api/admin/settings/publish',{method:'POST',body:{revision:result.data.revision}});assert.equal(store.catalog().settings.shippingCents,895);assert.ok(store.catalog().pages.shipping[2].includes('$8.95'));
  const quote=await call('/api/quote',{method:'POST',body:{items:[{id:'copo-camaro',option:'Standard',quantity:1}]},auth:false});assert.equal(quote.data.shippingCents,895);
 });
 await t.test('full ZIP backup restores content and media without replacing accounts',async()=>{
  const result=await call('/api/admin/backup.zip');assert.equal(result.res.status,200);assert.match(result.res.headers.get('content-type'),/zip/);backup=result.data;assert.ok(backup.length>1000);
  const settings=store.state.settings;await call('/api/admin/settings',{method:'PUT',body:{revision:settings.revision,settings:{...settings.draft,brandName:'Temporary test identity'}}});
  const form=new FormData();form.append('confirm','RESTORE');form.append('file',new Blob([backup],{type:'application/zip'}),'backup.zip');const restored=await call('/api/admin/restore',{method:'POST',body:form});assert.equal(restored.res.status,200,JSON.stringify(restored.data));assert.notEqual(store.state.settings.draft.brandName,'Temporary test identity');assert.equal(store.state.users[0].id,ownerId);assert.ok(store.catalog().products.some(p=>p.id===record.id));
 });
 await t.test('editor permissions are limited and access can be revoked',async()=>{
  const invitation=await call('/api/admin/team/invite',{method:'POST',body:{role:'editor'}});const joined=await call('/api/admin/accept-invite',{method:'POST',auth:false,body:{code:invitation.data.code,name:'Local editor',username:'test.editor',password:'A second long test password!'}});assert.equal(joined.res.status,200);
  const session=joined.res.headers.get('set-cookie').split(';')[0],token=joined.data.csrf;
  assert.equal((await call('/api/admin/export',{session,token})).res.status,403);
  assert.equal((await call('/api/admin/team/invite',{session,token,method:'POST',body:{role:'owner'}})).res.status,403);
  assert.equal((await call('/api/admin/team/'+joined.data.user.id,{method:'PUT',body:{role:'editor',active:false}})).res.status,200);
  assert.equal((await call('/api/admin/me',{session,token})).res.status,401);
  assert.equal((await call('/api/admin/team/'+ownerId,{method:'PUT',body:{role:'editor',active:false}})).res.status,400);
 });
 await t.test('permanent removal requires confirmation, protects attached files, and recovery media can be reused',async()=>{
  const current=store.state.products.find(p=>p.id===record.id);
  assert.equal((await call('/api/admin/products/'+record.id+'/purge',{method:'POST',body:{confirm:current.draft.name}})).res.status,400);
  const copy=(await call('/api/admin/products/'+record.id+'/action',{method:'POST',body:{revision:current.revision,action:'duplicate'}})).data;
  const trashed=(await call('/api/admin/products/'+copy.id+'/action',{method:'POST',body:{revision:copy.revision,action:'trash'}})).data;
  assert.equal((await call('/api/admin/products/'+copy.id+'/purge',{method:'POST',body:{confirm:'wrong'}})).res.status,400);
  assert.equal((await call('/api/admin/products/'+copy.id+'/purge',{method:'POST',body:{confirm:trashed.draft.name}})).res.status,200);
  const attached=store.state.media.find(m=>m.url===image.url);
  assert.equal((await call('/api/admin/media/'+attached.id+'/purge',{method:'POST',body:{confirm:attached.name}})).res.status,409);
  const png=await sharp({create:{width:10,height:10,channels:3,background:'#ffffff'}}).png().toBuffer();const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'unused-test.png');const media=(await call('/api/admin/media',{method:'POST',body:form})).data;
  assert.equal((await call('/api/admin/media/'+media.id+'/remove',{method:'POST',body:{}})).res.status,200);
  assert.equal((await call('/api/admin/media/'+media.id+'/restore',{method:'POST',body:{}})).res.status,200);
  assert.equal((await call('/api/admin/media/'+media.id+'/purge',{method:'POST',body:{confirm:media.name}})).res.status,200);
  assert.ok(!fs.existsSync(path.join(directory,'uploads',path.basename(media.url))));
 });
 await t.test('password change revokes old sessions; re-opening the data preserves changes',async()=>{
  const old=cookie;const changed=await call('/api/admin/password',{method:'POST',body:{currentPassword:'A long local test password 123!',password:'A replacement long test password!'}});assert.equal(changed.res.status,200);adopt(changed);assert.equal((await call('/api/admin/me',{session:old})).res.status,401);
  const recovered=await call('/api/admin/recover',{method:'POST',auth:false,body:{username:'test.owner',code:changed.data.recoveryCode,password:'A recovered long test password!'}});assert.equal(recovered.res.status,200);
  const reopened=createStore({directory,durable:true});assert.equal(reopened.state.installationId,store.state.installationId);assert.equal(reopened.catalog().products.find(p=>p.id===record.id).priceCents,2999);assert.ok(reopened.state.users.length===2);
  assert.ok(!fs.readFileSync(path.join(directory,'garage.json'),'utf8').includes('A recovered long test password!'));
  const recoveredCookie=recovered.res.headers.get('set-cookie').split(';')[0];assert.equal((await call('/api/admin/logout',{method:'POST',session:recoveredCookie,token:recovered.data.csrf,body:{}})).res.status,200);assert.equal((await call('/api/admin/me',{session:recoveredCookie,token:recovered.data.csrf})).res.status,401);
 });
});
