import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { validateReport } from '../lib/validation.mjs';
const filename=process.argv[2];
if(!filename||!process.env.DATABASE_URL)throw new Error('Provide DATABASE_URL and the private backup JSON path.');
const backup=JSON.parse(await readFile(filename,'utf8'));
if(!Array.isArray(backup.reports)||!Array.isArray(backup.actions))throw new Error('Expected reports and actions arrays.');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
for(const r of backup.reports){validateReport(r);if(!uuid.test(r.id)||!uuid.test(r.author)||![r.created_at,r.observed_at,r.votes].every(Number.isSafeInteger)||r.votes<0)throw new Error('Invalid report in backup.');}
for(const a of backup.actions){if(!uuid.test(a.report_id)||!uuid.test(a.actor)||!['confirm','clear','flag'].includes(a.kind)||!Number.isSafeInteger(a.created_at))throw new Error('Invalid action in backup.');}
const local=['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname);
const sql=postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:local?false:'require'});
try{
 await sql.begin(async tx=>{
  for(const r of backup.reports)await tx`INSERT INTO pondy.reports (id,street,note,lat,lng,status,created_at,observed_at,author,votes) VALUES (${r.id},${r.street},${r.note},${r.lat},${r.lng},${r.status},${r.created_at},${r.observed_at},${r.author},${r.votes}) ON CONFLICT (id) DO UPDATE SET street=excluded.street,note=excluded.note,status=excluded.status,observed_at=excluded.observed_at,votes=excluded.votes WHERE pondy.reports.observed_at<=excluded.observed_at`;
  for(const a of backup.actions)await tx`INSERT INTO pondy.actions (report_id,actor,kind,created_at) VALUES (${a.report_id},${a.actor},${a.kind},${a.created_at}) ON CONFLICT DO NOTHING`;
 });
 console.log(`Imported ${backup.reports.length} reports and ${backup.actions.length} actions. No backup contents were logged.`);
}finally{await sql.end()}
