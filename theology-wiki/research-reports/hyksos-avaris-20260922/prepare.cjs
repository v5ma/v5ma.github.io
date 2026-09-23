'use strict';
// Preserve existing recordings against their exact original source versions when adding article links.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),repo=path.dirname(root),base='c31dd6c56a101aec7c8a890768ae1f845494b294',prefix='research-reports/hyksos-avaris-20260922/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=p=>cp.execFileSync('git',['show',base+':theology-wiki/'+p],{cwd:repo,maxBuffer:32*1024*1024});
const media=JSON.parse(old('products/media/manifest.json')),snapshots={};
for(const a of media.assets){const src=a.kind==='article'?'content/developed/'+a.id+'.md':'products/episodes/'+a.id+'.json',bytes=old(src);assert.equal(sha(bytes),a.sourceSha256,'Original recording source must match '+a.id);const dest=prefix+'recorded-source-snapshots/'+a.id+(a.kind==='article'?'.md':'.json');fs.mkdirSync(path.dirname(path.join(root,dest)),{recursive:true});fs.writeFileSync(path.join(root,dest),bytes);snapshots[a.id]={path:dest,sha256:a.sourceSha256,base_commit:base,kind:a.kind};}
fs.writeFileSync(path.join(__dirname,'recorded-sources.json'),JSON.stringify(snapshots,null,2)+'\n');
function patch(p,marker,edits){const file=path.join(root,p);let text=fs.readFileSync(file,'utf8');if(text.includes(marker))return;assert.equal(text,old(p).toString(),'Concurrent changes require reconciliation: '+p);for(const [before,after]of edits){assert.equal(text.split(before).length,2,'Nonunique patch in '+p);text=text.replace(before,after);}assert.ok(text.includes(marker));fs.writeFileSync(file,text);}
patch('tools/products.cjs','// Hyksos report: preserve recorded source versions',[
 [' for(const asset of config.media.assets){'," // Hyksos report: preserve recorded source versions\n const archivedSources=JSON.parse(fs.readFileSync(path.join(root,'research-reports/hyksos-avaris-20260922/recorded-sources.json')));\n for(const asset of config.media.assets){"],
 ["if(asset.sourceSha256!==expected)throw Error('Recording needs a new source version: '+asset.id);","if(asset.sourceSha256!==expected){const archived=archivedSources[asset.id];if(!archived||!archived.path.startsWith('research-reports/hyksos-avaris-20260922/recorded-source-snapshots/')||archived.path.includes('..')||archived.sha256!==asset.sourceSha256||sha(fs.readFileSync(path.join(root,archived.path)))!==asset.sourceSha256)throw Error('Recording needs a verified original source version: '+asset.id);asset.sourceSnapshot=archived.path;asset.currentSourceSha256=expected;asset.status+='; archived recording of the earlier source version; new report links are not narrated';asset.scope+=' The exact recorded source is preserved separately from the updated article.';}"]
]);
patch('tests/products.test.cjs','local hash-checked outputs tied to verified source versions',[
 ['local hash-checked outputs tied to current text','local hash-checked outputs tied to verified source versions'],
 ["const cues=read(a.files.find(f=>f.role==='cues').path).cues;","if(a.sourceSnapshot){assert(a.sourceSnapshot.startsWith('research-reports/hyksos-avaris-20260922/recorded-source-snapshots/'));assert.equal(a.sourceSha256,digest(a.sourceSnapshot));}const cues=read(a.files.find(f=>f.role==='cues').path).cues;"],
 ["const doc=read(library.articles.find(x=>x.slug===a.id).narration);","const doc=a.sourceSnapshot?{segments:C.segment(fs.readFileSync(path.join(ROOT,a.sourceSnapshot),'utf8'))}:read(library.articles.find(x=>x.slug===a.id).narration);"]
]);
const receiptPath="path.join(root,'research-reports/hyksos-avaris-20260922/revision-receipt.json')";
patch('comparative-religion/verify-preservation.cjs','// Hyksos linked-article preservation',[
 ['function verify(){',"function verify(){\n// Hyksos linked-article preservation\nif(fs.existsSync("+receiptPath+"))return require('../research-reports/hyksos-avaris-20260922/verify-generated.cjs').verify().prior;\n"]
]);
patch('comparative-religion/reconcile.cjs','// Hyksos linked-article preservation',[
 ["'use strict';","'use strict';\n// Hyksos linked-article preservation\nif(require('node:fs').existsSync(require('node:path').join(__dirname,'../research-reports/hyksos-avaris-20260922/revision-receipt.json'))){require('../research-reports/hyksos-avaris-20260922/verify-generated.cjs').verify();return;}\n"]
]);
console.log(JSON.stringify({recording_sources_preserved:Object.keys(snapshots),original_media_unchanged:true,prior_receipts_unchanged:true}));
