import postgres from 'postgres';
import { TTL } from './validation.mjs';

let client: ReturnType<typeof postgres> | undefined;
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  // Transaction poolers do not support named prepared statements.
  return client ??= postgres(process.env.DATABASE_URL, {
    prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10,
    ssl: ['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname) ? false : 'require',
  });
}

export async function listReports(actor: string) {
  return sql()`SELECT r.id,r.street,r.note,r.lat,r.lng,r.status,
    r.created_at::double precision AS "createdAt",r.observed_at::double precision AS "observedAt",r.votes,
    EXISTS(SELECT 1 FROM pondy.actions a WHERE a.report_id=r.id AND a.actor=${actor} AND a.kind='confirm') AS confirmed,
    EXISTS(SELECT 1 FROM pondy.actions a WHERE a.report_id=r.id AND a.actor=${actor} AND a.kind='clear') AS cleared,
    EXISTS(SELECT 1 FROM pondy.actions a WHERE a.report_id=r.id AND a.actor=${actor} AND a.kind='flag') AS flagged
    FROM pondy.reports r WHERE r.observed_at>${Date.now()-TTL}
    AND (SELECT COUNT(*) FROM pondy.actions a WHERE a.report_id=r.id AND a.kind='flag')<3
    ORDER BY r.observed_at DESC LIMIT 300`;
}

export async function incrementRate(actor:string,category:string,limit:number) {
  const bucket=Math.floor(Date.now()/3600000),key=`${category}:${bucket}:${actor}`;
  const [row]=await sql()`INSERT INTO pondy.rate_limits (key,count,expires_at)
    VALUES (${key},1,${(bucket+2)*3600000})
    ON CONFLICT (key) DO UPDATE SET count=pondy.rate_limits.count+1 RETURNING count`;
  return row.count<=limit;
}

type NewReport={lat:number;lng:number;status:string;street:string;note:string};
export async function insertReport(data:NewReport,actor:string) {
  const now=Date.now(),id=crypto.randomUUID();
  await sql().begin(async tx=>{
    await tx`INSERT INTO pondy.reports (id,street,note,lat,lng,status,created_at,observed_at,author,votes)
      VALUES (${id},${data.street},${data.note},${data.lat},${data.lng},${data.status},${now},${now},${actor},0)`;
    await tx`DELETE FROM pondy.rate_limits WHERE expires_at<${now}`;
    await tx`DELETE FROM pondy.actions WHERE created_at<${now-7*86400000}`;
    await tx`DELETE FROM pondy.reports WHERE observed_at<${now-7*86400000}`;
  });
  return id;
}

export async function observeReport(id:string,actor:string,kind:string) {
  return sql().begin(async tx=>{
    const now=Date.now();
    const [report]=await tx`SELECT status FROM pondy.reports WHERE id=${id} AND observed_at>${now-TTL} FOR UPDATE`;
    if(!report)return {status:404,error:'This report has expired. Add a fresh report instead.'};
    if(kind==='clear'&&report.status==='green')return {status:409,error:'This spot is already reported clear.'};
    const inserted=await tx`INSERT INTO pondy.actions (report_id,actor,kind,created_at)
      VALUES (${id},${actor},${kind},${now}) ON CONFLICT DO NOTHING RETURNING report_id`;
    if(!inserted.length)return {status:409,error:'You have already sent this update.'};
    if(kind==='confirm')await tx`UPDATE pondy.reports SET votes=votes+1 WHERE id=${id}`;
    if(kind==='clear')await tx`UPDATE pondy.reports SET status='green',note='A local has reported this spot cleared.',observed_at=${now},votes=0 WHERE id=${id}`;
    return {status:200};
  });
}
