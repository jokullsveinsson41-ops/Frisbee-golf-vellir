import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const root=process.cwd();
const serverRoot=path.join(root,'dist/server');const files=await readdir(serverRoot,{recursive:true});const modules=[{type:'ESModule',path:path.join(serverRoot,'index.js')},...files.filter(f=>f.endsWith('.js')&&f!=='index.js').map(f=>({type:'ESModule',path:path.join(serverRoot,f)}))];
const mf=new Miniflare({modules,modulesRoot:serverRoot,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{ADMIN_USER_IDS:'test-admin'},cf:false,serviceBindings:{ASSETS:async()=>new Response('Not found',{status:404})}});
let passed=0;const check=(condition,message)=>{assert.ok(condition,message);passed++;console.log('PASS',message)};
const asUser=(id)=>({'oai-authenticated-user-id':id,'oai-authenticated-user-email':id+'@example.test'});
async function request(url,body,user='test-player',extra={}){const response=await mf.dispatchFetch('https://example.test'+url,{method:body?'POST':'GET',headers:{...(user?asUser(user):{}),...(body?{'Content-Type':'application/json',Origin:'https://example.test'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});let json;try{json=await response.json()}catch{json=null}return {status:response.status,data:json};}
try{
 const d=await mf.getD1Database('DB');const migration=await readFile('drizzle/0000_lowly_ink.sql','utf8');for(const statement of migration.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await d.prepare(statement).run();
 const catalog=await request('/api/catalog',undefined,null);check(catalog.status===200&&catalog.data.courses.length===10,'Browse a sourced course directory without an account');
 check(catalog.data.courses.find(c=>c.id==='klambratun').holes===14,'Updated Klambratún hole count is preserved');
 const save=await request('/api/me',{action:'save',id:'seljahverfi',saved:true});check(save.status===200,'Save a course');
 let me=await request('/api/me');check(me.data.saves.some(s=>s.course_id==='seljahverfi'),'Saved course persists in the database');
 const other=await request('/api/me',undefined,'test-other');check(other.data.saves.length===0,'Private saved lists are isolated by user');
 check((await request('/api/me',{action:'save',id:'klambratun',saved:true},null)).status===401,'Anonymous writes require sign-in');
 check((await request('/api/me',{action:'save',id:'klambratun',saved:true},'test-player',{Origin:'https://other.test'})).status===403,'Cross-origin writes are rejected');
 const trip=await request('/api/me',{action:'trip',name:'Test Iceland trip',stops:['klambratun','hamrar'],start:'reykjavik'});check(trip.status===200,'Save a multi-course itinerary');
 me=await request('/api/me');check(me.data.trips[0].data.stops[1]==='hamrar','Itinerary order persists');
 await request('/api/me',{action:'deleteTrip',id:trip.data.id},'test-other');me=await request('/api/me');check(me.data.trips.length===1,'Another user cannot delete an itinerary');
 const round=await request('/api/me',{action:'round',courseId:'klambratun',layout:'Manual — test setup',pars:[3,4,3],players:[{name:'Test player',scores:[2,5,3]},{name:'Test partner',scores:[3,4,5]}]});check(round.status===200&&round.data.result.totals[0].throws===10&&round.data.result.totals[0].relative===0&&round.data.result.totals[1].relative===2,'Round totals and scores relative to entered par are correct');
 check((await request('/api/me',{action:'round',courseId:'klambratun',layout:'Manual',pars:[3,3],players:[{name:'Test',scores:[3]}]})).status===400,'Incomplete scorecards are rejected');
 me=await request('/api/me');check(me.data.rounds.length===1&&me.data.saves.find(s=>s.course_id==='klambratun').played===1,'Round history persists and marks the course played');
 const answer=await request('/api/caddie',{question:'Which saved courses have nine holes?',lang:'en'});check(answer.status===503&&answer.data.unavailable&&answer.data.courses[0].id==='seljahverfi'&&answer.data.courses[0].source.startsWith('https://www.folf.is'),'Missing AI credentials return an honest state and grounded source cards');
 check((await request('/api/route',{stops:['hamrar'],start:'reykjavik'})).status===503,'No road distance is invented without a routing credential');
 const submission=await request('/api/submissions',{kind:'review',courseId:'klambratun',author:'Test player',text:'Test-only review for the isolated verification database.'});check(submission.status===200,'Community submission enters moderation');
 check((await request('/api/submissions?course=klambratun',undefined,null)).data.items.length===0,'Unreviewed community content stays private');
 check((await request('/api/admin')).status===403,'Administrative reads require allowlisted identity');
 check((await request('/api/admin',{action:'moderate',id:submission.data.id,status:'approved',note:'Reviewed test content.'},'test-admin')).status===200,'Allowlisted administrator can moderate');
 check((await request('/api/submissions?course=klambratun',undefined,null)).data.items.length===1,'Approved community content is visible');
 check((await request('/api/admin',undefined,'test-admin')).data.audit.length===1,'Administrative changes are audited');
 for(const url of ['/','/atlas','/courses/klambratun','/trip-planner','/scorecard','/learn','/saved','/events','/coverage','/clubs']){const r=await mf.dispatchFetch('https://example.test'+url);const html=await r.text();check(r.status===200&&html.includes('Disc Golf Iceland'),`${url} renders with product content`);}
 const sitemap=await mf.dispatchFetch('https://example.test/sitemap.xml');check(sitemap.status===200&&(await sitemap.text()).includes('/courses/klambratun'),'Course URLs appear in sitemap');
 console.log(`\n${passed} checks passed in an isolated disposable database. Browser UI, live AI, routing and production sign-in were not tested.`);
}finally{await mf.dispose();}
