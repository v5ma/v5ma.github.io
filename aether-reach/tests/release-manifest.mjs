/* Hash only the explicitly published application. Never fetch private sources. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const files=['index.html','projects.css','aether-reach/index.html','aether-reach/style.css','aether-reach/app.mjs','aether-reach/model.mjs','aether-reach/scene.mjs','aether-reach/cover.svg','aether-reach/release.json','aether-reach/vendor/three.module.js','aether-reach/vendor/three.core.js'];
const manifest={files:Object.fromEntries(files.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]))};
const out=path.join(root,'aether-reach/test-output');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Recorded '+files.length+' public runtime hashes.');
