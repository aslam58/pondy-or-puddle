import {json,identity,sameOrigin,rateLimit,readBody} from '../../../../lib/server';
import {observeReport} from '../../../../lib/database';
import {validAction} from '../../../../lib/validation.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!sameOrigin(req))return json({error:'Please submit from this website.'},403);
 let action;try{action=(await readBody(req)).action;if(!validAction(action))throw new Error()}catch{return json({error:'Choose a valid action.'},400)}
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return json({error:'Invalid report.'},400);
 try{const actor=await identity(req);
 if(!await rateLimit(actor.network,'action',60)||!await rateLimit(actor.device,'action-device',30))return json({error:'Please try again next hour.'},429,actor.cookie);
 const result=await observeReport(id,actor.device,action);
 return json(result.status===200?{ok:true}:{error:result.error},result.status,actor.cookie);
 }catch{return json({error:'Could not save your update. Please retry.'},503)}
}
