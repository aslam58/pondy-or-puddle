import {createInterface} from 'node:readline';
import {mkdir,writeFile} from 'node:fs/promises';
const rl=createInterface({input:process.stdin});console.log('Ready for private export token on hidden stdin.');
for await(const line of rl){const {token,name='sites-export'}=JSON.parse(line);if(!/^[a-z0-9-]+$/.test(name))throw new Error('Invalid backup name');
 const response=await fetch('https://pondy-or-puddle-demo.swoonycomet16.chatgpt.site/api/migration-export',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Owner export failed: ${response.status}`);const data=await response.json();if(!Array.isArray(data.reports)||!Array.isArray(data.actions))throw new Error('Invalid export');
 await mkdir('backups',{recursive:true,mode:0o700});await writeFile(`backups/${name}.json`,JSON.stringify(data),{mode:0o600});console.log(JSON.stringify({reports:data.reports.length,actions:data.actions.length,path:`backups/${name}.json`}));rl.close();break;
}
