import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:8766';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Integration tests are restricted to localhost.');
let cookie='';
async function call(path,body,extra={}){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];return{status:r.status,data:await r.json()}}
assert.equal((await call('/api/reports')).status,200);
assert.equal((await call('/api/reports',{lat:0,lng:0,status:'green'})).status,400);
assert.equal((await call('/api/reports',{lat:11.94,lng:79.81,status:'banana'})).status,400);
assert.equal((await call('/api/reports',{lat:11.94,lng:79.81,status:'yellow'},{origin:'https://another-site.invalid'})).status,403);
const created=await call('/api/reports',{lat:11.94,lng:79.81,status:'orange',street:'LOCAL QA ONLY',note:'Persistence check'});assert.equal(created.status,201);const id=created.data.id;
const other=await fetch(base+'/api/reports').then(r=>r.json());assert.ok(other.reports.some(r=>r.id===id),'visible to a different anonymous visitor');
assert.equal((await call(`/api/reports/${id}`,{action:'confirm'})).status,200);
assert.equal((await call(`/api/reports/${id}`,{action:'confirm'})).status,409);
assert.equal((await call('/api/reports')).data.reports.find(r=>r.id===id).votes,1);
assert.equal((await call(`/api/reports/${id}`,{action:'clear'})).status,200);
const cleared=(await call('/api/reports')).data.reports.find(r=>r.id===id);assert.equal(cleared.status,'green');assert.equal(cleared.votes,0);
assert.equal((await call(`/api/reports/${id}`,{action:'flag'})).status,200);
assert.equal((await call(`/api/reports/${id}`,{action:'flag'})).status,409);
// Distinct device cookies verify the three-flag hiding threshold.
for(let i=0;i<2;i++){cookie='';await call('/api/reports');assert.equal((await call(`/api/reports/${id}`,{action:'flag'})).status,200)}
assert.ok(!(await call('/api/reports')).data.reports.some(r=>r.id===id));
assert.equal((await call('/api/weather')).status,200);
console.log('PASS: cross-visitor persistence, validation, origin protection, confirmation deduplication, clearing, flag threshold, live weather. Local PostgreSQL database only.');
