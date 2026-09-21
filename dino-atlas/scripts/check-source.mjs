// Check every owned runtime entry without executing the game or touching saves.
import {readdirSync,readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const entries=readdirSync(root).filter(name=>/\.(?:m?js|html|css)$/.test(name)).sort();
const scripts=readdirSync(resolve(root,'scripts')).filter(name=>/\.m?js$/.test(name)).map(name=>'scripts/'+name).sort();
let checked=0,failed=false;
for(const name of [...entries,...scripts]){
 const path=resolve(root,name),text=readFileSync(path,'utf8');
 if(/^(?:<{7}|={7}|>{7}|\|{7})(?: .*)?$/m.test(text)){
  console.error('Unresolved conflict marker: '+name);failed=true;
 }
 if(!/\.m?js$/.test(name))continue;
 const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
 if(result.error||result.status!==0){
  console.error('Syntax check failed: '+name);console.error(result.error?.message||result.stderr||result.stdout);failed=true;
 }
 checked++;
}
console.log(JSON.stringify({syntaxFiles:checked,conflictScannedFiles:entries.length+scripts.length,passed:!failed}));
if(failed)process.exitCode=1;
