import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before applying the schema.');
const local=/localhost|127\.0\.0\.1/.test(new URL(process.env.DATABASE_URL).hostname);
const sql=postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:local?false:'require'});
try{await sql.unsafe(await readFile(new URL('../database/schema.sql',import.meta.url),'utf8'));console.log('Pondy schema applied.');}finally{await sql.end()}
