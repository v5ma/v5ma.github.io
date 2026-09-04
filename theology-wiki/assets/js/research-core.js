(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TheologyResearchCore=api;})(globalThis,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const tokens=v=>[...new Set(normalize(v).match(/[\p{L}\p{N}]+/gu)||[])];
function splitTranscript(text){
 const matches=[...String(text).matchAll(/^(Micah Blumberg|Self Aware Networks GPT):[ \t]*\r?\n/gm)];
 if(!matches.length)return [{number:1,speaker:'Unstructured source',text:String(text),start:0,end:text.length}];
 return matches.map((m,i)=>({number:i+1,speaker:m[1],start:m.index+m[0].length,end:matches[i+1]?.index??text.length,text:text.slice(m.index+m[0].length,matches[i+1]?.index??text.length).trim()}));
}
function dateFromExport(text){const raw=String(text).match(/^Date:\s*([0-9]+(?:\.[0-9]+)?)/m)?.[1];if(!raw)return '';const n=Number(raw)*1000;if(!Number.isFinite(n)||n<0||n>4102444800000)return '';return new Date(n).toISOString().slice(0,10);}
function cleanRouting(text){return String(text).replace(/<!-- NINE-WIKI-[\s\S]*?<!-- NINE-WIKI-[^\n]*?:END -->/g,'').replace(/^## (?:Related Graph Routes|Graph Read Next)\s*\n[\s\S]*?(?=^## |$(?![\s\S]))/gm,'');}
function select(pages,query,{topic='',kind='all',sort='relevance',saved=[]}={},fullIndex=null){
 const ts=tokens(query),sets=fullIndex?ts.map(t=>new Set((fullIndex.postings[t]||[]).map(id=>typeof id==='number'?fullIndex.ids[id]:id))):[];
 const score=p=>{
  const title=normalize(`${p.title} ${(p.aliases||[]).join(' ')}`),meta=normalize(`${title} ${p.summary} ${p.topic} ${(p.tags||[]).join(' ')}`);
  if(!ts.every((t,i)=>meta.includes(t)||sets[i]?.has(p.slug)))return -1;
  return ts.reduce((n,t)=>n+(title.includes(t)?12:meta.includes(t)?3:1),0)+(query&&title.includes(normalize(query))?10:0);
 };
 return pages.filter(p=>(!topic||p.category===topic)&&
  (kind==='all'||(kind==='saved'&&saved.includes(p.slug))||(kind==='article'&&p.kind==='Developed article')||(kind==='chat'&&p.sourceFile)||(kind==='featured'&&(ts.length||p.kind==='Developed article'||p.slug==='home'))))
  .map(p=>({p,score:score(p)})).filter(x=>x.score>=0).sort((a,b)=>{
   if(sort==='date')return (b.p.date||'').localeCompare(a.p.date||'')||a.p.title.localeCompare(b.p.title);
   if(sort==='linked')return (b.p.backlinkCount||0)-(a.p.backlinkCount||0)||a.p.title.localeCompare(b.p.title);
   if(sort==='relevance'&&ts.length)return b.score-a.score||a.p.title.localeCompare(b.p.title);
   return a.p.title.localeCompare(b.p.title);
  }).map(x=>x.p);
}
function validateState(raw,ids){if(!raw||raw.version!==1||!Array.isArray(raw.saved))throw Error('Not a Theology reading-list file.');return {version:1,saved:[...new Set(raw.saved.filter(x=>typeof x==='string'&&ids.has(x)))]};}
function filterTurns(turns,query,speaker='all'){const ts=tokens(query);return turns.filter(t=>(speaker==='all'||t.speaker===speaker)&&ts.every(q=>normalize(t.text).includes(q)));}
function safeSourceFile(name){return typeof name==='string'&&/^gpt2026dragon\d+_[A-Za-z0-9_ .'-]+\.txt$/.test(name)&&!name.includes('..');}
return {esc,normalize,tokens,splitTranscript,dateFromExport,cleanRouting,select,validateState,filterTurns,safeSourceFile};
});
