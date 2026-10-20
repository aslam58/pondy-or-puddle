import { json,identity,sameOrigin,rateLimit,readBody } from '../../../lib/server';
import { listReports,insertReport } from '../../../lib/database';
import { validateReport } from '../../../lib/validation.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(req:Request){try{
 const actor=await identity(req);const reports=await listReports(actor.device);
 return json({reports,updatedAt:Date.now()},200,actor.cookie);
 }catch{return json({error:'Reports are temporarily unavailable. Please retry.'},503)}}
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Please submit from this website.'},403);
 let data;try{data=validateReport(await readBody(req))}catch(e){return json({error:e instanceof Error?e.message:'Invalid report'},400)}
 try{const actor=await identity(req);
 if(!await rateLimit(actor.network,'report',12)||!await rateLimit(actor.device,'report-device',6))return json({error:'A few too many splashes. Try again next hour.'},429,actor.cookie);
 const id=await insertReport(data,actor.device);
 return json({id},201,actor.cookie);
 }catch{return json({error:'Could not save your report. Please retry.'},503)}
}
