import { incrementRate } from './database';
export const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function identity(req:Request){
 const cookie=req.headers.get('cookie')?.match(/(?:^|;\s*)pondy_device=([a-f0-9-]{36})(?:;|$)/)?.[1];
 const device=cookie||crypto.randomUUID();
 const secret=process.env.NETWORK_HASH_SECRET;
 if(!secret&&process.env.NODE_ENV==='production')throw new Error('NETWORK_HASH_SECRET is not configured');
 // Vercel overwrites x-forwarded-for at the edge; never trust a browser-supplied IP field in a request body.
 const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local-preview';
 const bytes=new TextEncoder().encode(`${secret||'local-development'}:${new Date().toISOString().slice(0,10)}:${ip}`);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const network=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return{device,network,cookie:cookie?{} as Record<string,string>:{'Set-Cookie':`pondy_device=${device}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${new URL(req.url).protocol==='https:'?'; Secure':''}`}};
}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin}
export const rateLimit=incrementRate;
export async function readBody(req:Request){if(Number(req.headers.get('content-length'))>4096)throw new Error('Request too large');const s=await req.text();if(s.length>4096)throw new Error('Request too large');return JSON.parse(s)}
