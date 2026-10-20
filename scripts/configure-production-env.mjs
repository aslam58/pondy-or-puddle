// Secrets arrive through hidden stdin, never through process arguments.
import {createInterface} from 'node:readline';
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
console.log('Ready for private database configuration on hidden stdin.');
const rl=createInterface({input:process.stdin});
for await(const line of rl){
 const {databaseUrl}=JSON.parse(line);const networkSecret=randomBytes(48).toString('base64url');
 await writeFile('.env.production.local',`DATABASE_URL=${databaseUrl}\nNETWORK_HASH_SECRET=${networkSecret}\n`,{mode:0o600});
 for(const [key,value] of Object.entries({DATABASE_URL:databaseUrl,NETWORK_HASH_SECRET:networkSecret})){
  const r=spawnSync('npx',['--yes','vercel','env','add',key,'--environment','production','--type','secret','--scope','moaslam1100-4479','--force','--yes'],{input:value,encoding:'utf8'});
  if(r.status!==0){console.error(`Could not configure ${key}:`,r.stderr);process.exit(1)}
  console.log(`Configured ${key} as a production Secret.`);
 }
 rl.close();break;
}
