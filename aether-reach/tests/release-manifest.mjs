/* Explicit public-only release contract. Tests and private repositories are excluded. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const files=['index.html','projects.css',...['index.html','style.css','app.mjs','model.mjs','scene.mjs','arsenal.mjs','combat-scene.mjs','combat-ui.mjs','combat.css','input-core.mjs','controllers.mjs','xr-session.mjs','roadmap.html','roadmap.mjs','roadmap.json','cover.svg','release.json','vendor/three.module.js','vendor/three.core.js'].map(f=>'aether-reach/'+f)];
const manifest={files:Object.fromEntries(files.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]))};
const out=path.join(root,'aether-reach/test-output');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Recorded '+files.length+' public runtime hashes.');
