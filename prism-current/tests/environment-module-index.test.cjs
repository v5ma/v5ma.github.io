/* Developer-facing metadata must resolve to the real reusable implementation. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),dir=path.join(root,'modules/environment');
const index=JSON.parse(fs.readFileSync(path.join(dir,'module-manifest.json'),'utf8'));
for(const name of ['water','fire','trees'])test(name+': reusable module index matches the saved source and module facade',async()=>{
 const entry=index.modules[name];A.ok(entry&&typeof entry.script==='string'&&typeof entry.module==='string');
 A.ok(entry.status.startsWith('implemented'));
 for(const field of ['script','module']){A.equal(path.basename(entry[field]),entry[field]);A.ok(fs.statSync(path.join(dir,entry[field])).isFile());}
 const api=require(path.join(dir,entry.script)),esm=await import(path.join(dir,entry.module));
 A.equal(entry.version,api.VERSION);A.equal(esm.default,api);A.equal(globalThis[entry.global],api);A.equal(typeof api.create,'function');
 A.ok(fs.statSync(path.resolve(dir,entry.integration)).isFile());
 for(const field of ['ownsRenderer','ownsInput','ownsStorage'])A.equal(entry[field],false);
});
