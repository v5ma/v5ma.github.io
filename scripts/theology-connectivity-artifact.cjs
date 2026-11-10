'use strict';
// Enhance only the publication copy. Source HTML and all existing builders remain unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const PREFIX='<!-- theology-connectivity:';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function expandGraph(data){if(data.encoding!=='tables-v1')return data;return {...data,encoding:'expanded-v1',pages:data.pages.map(p=>({...p,links:p.links.map(l=>({to:data.pages[l[0]].id,type:data.types[l[1]],why:data.reasons[l[2]],evidence:l[3].map(i=>data.evidence[i])}))}))};}
function createDecorator(data){
 data=expandGraph(data);
 assert.equal(data.version,1);assert.ok(Array.isArray(data.pages));
 const pages=new Map(data.pages.map(p=>[p.id,p]));assert.equal(pages.size,data.pages.length,'Duplicate page IDs');
 const url=s=>{assert.equal(typeof s,'string');assert.ok(!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(s),'Unsafe URL scheme');s=s.startsWith('/')?s:'/theology-wiki/'+s;assert.ok(s.startsWith('/theology-wiki/')&&!/[\\\s<>"']/.test(s),'Unsafe local URL');const u=new URL(s,'https://wiki.invalid');assert.equal(u.origin,'https://wiki.invalid');assert.ok(u.pathname.startsWith('/theology-wiki/'));return esc(s);};
 for(const p of pages.values()){
  url(p.url);assert.ok(typeof p.title==='string'&&p.title);assert.ok(Array.isArray(p.links)&&p.links.length<=100);
  assert.match(p.directory,/^[a-z0-9-]+\.html$/i);assert.match(p.anchor,/^p-[a-f0-9]{12}$/);
  const seen=new Set();for(const l of p.links){assert.ok(pages.has(l.to),'Missing target '+l.to);assert.notEqual(l.to,p.id);assert.ok(!seen.has(l.to));seen.add(l.to);assert.ok(typeof l.why==='string'&&l.why.trim());}
 }
 const version=hash(JSON.stringify(data)).slice(0,12);
 function blocks(file){
  const reader=['theology-wiki/index.html','theology-wiki/san-reader.html'].includes(file);
  const pageId='static:'+file.replace(/^theology-wiki\//,'');const page=pages.get(data.aliases?.[pageId]||pageId);
  if(!reader&&!page)return {head:'',body:''};
  const head=PREFIX+'head:start --><link rel="stylesheet" href="/theology-wiki/connections/connections.css?v='+version+'">'+(reader?'<script defer src="/theology-wiki/connections/reader.js?v='+version+'"></script>':'')+'<!-- theology-connectivity:head:end -->';
  if(reader)return {head,body:''};
  function item(l){const p=pages.get(l.to);return '<li><a href="'+url(p.url)+'">'+esc(p.title)+'</a><p><span class="connection-type">'+esc(l.type||'Related inquiry')+'</span>: '+esc(l.why)+'</p></li>';}
  const links=page.links;
  const body=PREFIX+'body:start --><section class="wiki-connections" aria-labelledby="wiki-connections-heading"><h2 id="wiki-connections-heading">Connections across the wiki</h2><p>'+links.length+' explained connections. These links identify relationships between inquiries, not agreement with every claim.</p><ol class="connection-list">'+links.slice(0,12).map(item).join('')+'</ol>'+(links.length>12?'<details><summary>Show '+(links.length-12)+' more connections</summary><ol class="connection-list" start="13">'+links.slice(12).map(item).join('')+'</ol></details>':'')+'<p><a href="/theology-wiki/connections/'+esc(page.directory)+'#'+esc(page.anchor)+'">Open this page in the connections directory</a> · <a href="/theology-wiki/discover/index.html">Find a study across the wiki</a></p></section><!-- theology-connectivity:body:end -->';
  return {head,body};
 }
 function stripIntegration(html,file){const {head,body}=blocks(file);return html.replace(head,'').replace(body,'');}
 function decorateHTML(html,file){const {head,body}=blocks(file);if(!head&&!body)return html;
  const clean=stripIntegration(html,file);assert.ok(!clean.includes(PREFIX),'Malformed or stale connectivity block: '+file);
  assert.match(clean,/<\/head\s*>/i);assert.match(clean,/<\/body\s*>/i);
  assert.ok(!clean.includes('id="wiki-connections-heading"'),'Conflicting connection heading ID');
  return clean.replace(/<\/head\s*>/i,s=>head+s).replace(/<\/body\s*>/i,s=>body+s);
 }
 return {decorateHTML,stripIntegration,blocks,pages};
}
function buildArtifact(root,out,files){
 root=path.resolve(root);out=path.resolve(out);assert.notEqual(root,out);assert.ok(!fs.existsSync(out),'Output directory already exists; choose a fresh directory');
 const data=expandGraph(JSON.parse(fs.readFileSync(path.join(root,'theology-wiki/connections/data.json'),'utf8')));
 const d=createDecorator(data);
 if(!files)files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 const available=new Set(files);
 for(const id of [...data.pages.filter(p=>p.id.startsWith('static:')).map(p=>p.id),...Object.keys(data.aliases||{})])assert.ok(available.has('theology-wiki/'+id.slice(7)),'Missing static source '+id);
 for(const name of ['index.html','san-reader.html','connections/connections.css','connections/reader.js'])assert.ok(available.has('theology-wiki/'+name),'Missing required file '+name);
 const directoryContents=new Map();
 for(const p of data.pages){const file='theology-wiki/connections/'+p.directory;assert.ok(available.has(file),'Missing directory '+p.directory);if(!directoryContents.has(file))directoryContents.set(file,fs.readFileSync(path.join(root,file),'utf8'));assert.ok(directoryContents.get(file).includes('id="'+p.anchor+'"'),'Missing directory anchor '+p.anchor);} 
 const report={schema:1,files:0,enhanced:[]};
 for(const rel of files){
  assert.ok(!path.isAbsolute(rel)&&!rel.split('/').includes('..'),'Unsafe tracked path');
  const src=path.join(root,rel),dest=path.join(out,rel);const stat=fs.lstatSync(src);
  assert.ok(stat.isFile(),'Non-file tracked entry '+rel);const before=fs.readFileSync(src);
  const {head,body}=d.blocks(rel);let after=before;
  if(head||body){const text=before.toString('utf8');assert.deepEqual(Buffer.from(text),before,'Invalid UTF-8 '+rel);const enhanced=d.decorateHTML(text,rel);assert.equal(d.stripIntegration(enhanced,rel),text);assert.equal(d.decorateHTML(enhanced,rel),enhanced);after=Buffer.from(enhanced);report.enhanced.push({path:rel,sourceSha256:hash(before),artifactSha256:hash(after)});}
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,after,{mode:stat.mode});
  // Verify copied bytes after writing; never weaken source preservation assertions.
  assert.deepEqual(fs.readFileSync(dest),after);assert.deepEqual(fs.readFileSync(src),before);report.files++;
 }
 assert.equal(report.enhanced.length,data.pages.filter(p=>p.id.startsWith('static:')).length+Object.keys(data.aliases||{}).length+2,'Canonical coverage mismatch');
 return report;
}
if(require.main===module){const root=process.cwd(),out=process.argv[2]||'.pages-connectivity';console.log(JSON.stringify(buildArtifact(root,out),null,2));}
module.exports={createDecorator,buildArtifact,expandGraph};
