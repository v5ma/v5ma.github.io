'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'build.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let text=fs.readFileSync(file,'utf8');
const marker='// Abrahamic inheritance atlas integration, 2026-09-21';
let before=text;
if(!text.includes(marker)){
 const use="'use strict';";
 assert.equal(text.split(use).length-1,1,'unexpected use-strict marker');
 text=text.replace(use,use+'\n'+marker+"\nrequire('./abrahamic-inheritance/build.cjs');");
 const nextDecl="const nextSeries='<section><h2>Egypt, emanation and a larger genealogy</h2>";
 const i=text.indexOf(nextDecl);assert.ok(i>=0,'nextSeries declaration missing');
 const end=text.indexOf(";\nconst cards=",i);assert.ok(end>i,'nextSeries declaration end missing');
 const atlas="\nconst inheritanceAtlas='<section><h2>Who inherits Abraham? Sixty rival continuities and neighboring traditions</h2><p>The atlas separates direct Israelite continuity, Jewish covenant identity, Christian inheritance, restoration/remnant claims, Islamic Abrahamic restoration, progressive revelation and traditions that belong only to the wider comparative genealogy.</p><p>'+link('Open the 60 dedicated group pages','abrahamic-inheritance/index.html')+'</p></section>';";
 text=text.slice(0,end+1)+atlas+text.slice(end+1);
 const indexNeed="+nextSeries+filters(['Study'],'Entry type')";
 assert.equal(text.split(indexNeed).length-1,1,'index insertion point not unique');
 text=text.replace(indexNeed,"+nextSeries+inheritanceAtlas+filters(['Study'],'Entry type')");
 const dirNeed="'<p class=\"notice\">'+esc(directory.scope)+'</p>'+filters(directory.entries.map(e=>e.family),'Family or research setting')";
 assert.equal(text.split(dirNeed).length-1,1,'directory insertion point not unique');
 text=text.replace(dirNeed,"'<p class=\"notice\">'+esc(directory.scope)+'</p>'+inheritanceAtlas+filters(directory.entries.map(e=>e.family),'Family or research setting')");
 fs.writeFileSync(file,text);
}
const receipt={schema_version:1,edition_date:'2026-09-21',base_commit:require('./manifest.json').base_commit,parent_build_before_sha256:sha(Buffer.from(before)),parent_build_after_sha256:sha(Buffer.from(text)),scope:'Adds one generator require and one atlas callout to the comparative index and directory. Existing directory.json, study JSON and source registries are not changed.'};
fs.writeFileSync(path.join(__dirname,'integration-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
