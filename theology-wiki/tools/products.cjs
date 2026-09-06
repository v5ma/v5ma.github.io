/* Derive public product content without touching the source archive or XR app. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),C=require('../assets/js/listening-core.js');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function build(root,pages){
 const config=JSON.parse(fs.readFileSync(path.join(root,'editorial/products.json'))),atlas=JSON.parse(fs.readFileSync(path.join(root,'data/source-atlas.json'))),book=JSON.parse(fs.readFileSync(path.join(root,'data/foundations.json')));
 const out=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');};
 const canonical=new Map(pages.map(p=>[p.slug,p]));const records=new Set(atlas.records.map(r=>r.id));
 const library=[];
 for(const p of pages.filter(p=>p.kind==='Developed article')){
  const source=fs.readFileSync(path.join(root,'content',p.path));const segments=C.segment(source.toString('utf8'));
  if(!segments.length||segments.some(s=>s.text.length>550))throw Error('Invalid narration '+p.slug);
  const chapters=book.parts.flatMap(part=>part.chapters.filter(c=>c.pages.includes(p.slug)).map(c=>({id:c.id,title:c.title,part:part.title})));
  const x={schema:'theology-narration/v1',slug:p.slug,title:p.title,source:'content/'+p.path,sourceSha256:sha(source),policy:'Full article prose and headings, with markup normalized for speech; source and visual notes are separately labeled, not silently summarized. This is an editorial article, not a recovered author recording.',segments};
  const bytes=JSON.stringify(x,null,2)+'\n';out('data/listening/'+p.slug+'.json',bytes);out('products/transcripts/'+p.slug+'.txt',segments.map(s=>s.text).join('\n\n')+'\n');
  library.push({slug:p.slug,title:p.title,summary:p.summary,category:p.category,chapters,source:x.source,sourceSha256:x.sourceSha256,narration:'data/listening/'+p.slug+'.json',narrationSha256:sha(bytes),transcript:'products/transcripts/'+p.slug+'.txt',segments:segments.length,words:segments.filter(s=>!s.notes).reduce((n,s)=>n+s.text.split(/\s+/).length,0)});
 }
 const ordered=book.parts.flatMap(part=>part.chapters.flatMap(c=>c.pages));library.sort((a,b)=>(ordered.indexOf(a.slug)<0?999:ordered.indexOf(a.slug))-(ordered.indexOf(b.slug)<0?999:ordered.indexOf(b.slug))||a.title.localeCompare(b.title));
 const lib={schema:'theology-listening-library/v1',version:config.version,policy:config.policy,articles:library,chapters:book.parts.flatMap(p=>p.chapters.map(c=>({id:c.id,title:c.title,part:p.title,pages:c.pages.filter(s=>library.some(a=>a.slug===s))})))};out('data/listening-library.json',lib);
 const ids=new Set(config.tasks.map(t=>t.id));if(ids.size!==config.tasks.length)throw Error('Duplicate product task');
 const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))throw Error('Product dependency cycle');if(done.has(id))return;const t=config.tasks.find(x=>x.id===id);if(!t)throw Error('Missing product prerequisite');visiting.add(id);t.dependsOn.forEach(visit);visiting.delete(id);done.add(id);}ids.forEach(visit);
 for(const e of config.episodes){
  if(!/^[a-z0-9-]+$/.test(e.id)||!e.scenes.length)throw Error('Unsafe episode');
  if(e.pages.some(s=>!canonical.has(s))||e.recordIds.some(s=>!records.has(s)))throw Error('Unresolved episode evidence');
  e.sources=e.pages.map(s=>{const p=canonical.get(s),src='content/'+p.path;return {slug:s,title:p.title,path:src,sha256:sha(fs.readFileSync(path.join(root,src)))};});
  e.script='products/episodes/'+e.id+'.txt';e.production='products/episodes/'+e.id+'.json';e.words=e.scenes.reduce((n,s)=>n+s.narration.split(/\s+/).length,0);
  out(e.script,e.title+'\n\nEditorial adaptation of Micah Blumberg\'s public research. Synthetic production draft; not the author\'s recorded voice.\n\n'+e.scenes.map(s=>s.title+'\n\n'+s.narration).join('\n\n')+'\n\nSources and full arguments\n\n'+e.sources.map(s=>s.title+'\nhttps://v5ma.github.io/theology-wiki/san-reader.html?page='+s.slug+'\nSHA-256: '+s.sha256).join('\n\n')+'\n');out(e.production,e);
 }
 const assetsFile=path.join(root,'products/media/manifest.json');config.media=fs.existsSync(assetsFile)?JSON.parse(fs.readFileSync(assetsFile)):{schema:'theology-recorded-media/v1',assets:[],status:'No generated recording has been installed in this build.'};
 for(const asset of config.media.assets){for(const f of asset.files){if(!f.path.startsWith('products/media/')||f.path.includes('..')||sha(fs.readFileSync(path.join(root,f.path)))!==f.sha256)throw Error('Media hash mismatch');}const item=asset.kind==='article'?library.find(a=>a.slug===asset.id):config.episodes.find(e=>e.id===asset.id);if(!item)throw Error('Unknown media source');const expected=asset.kind==='article'?item.sourceSha256:sha(fs.readFileSync(path.join(root,item.production)));if(asset.sourceSha256!==expected)throw Error('Recording needs a new source version: '+asset.id);}
 out('data/products.json',config);return {version:config.version,listeningArticles:library.length,episodeDrafts:config.episodes.length,productTasks:config.tasks.length,recordedAssets:config.media.assets.length};
}
module.exports={build};
