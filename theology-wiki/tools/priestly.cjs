'use strict';
const fs=require('node:fs'),path=require('node:path');
// Historical BCE/CE notation has no year zero. Calculations are conditional, not dating evidence.
function advance(date,elapsed){
 if(!date||!Number.isInteger(date.year)||date.year<1||date.year>10000||!['BCE','CE'].includes(date.era)||!Number.isInteger(elapsed)||elapsed<0||elapsed>100000)throw Error('Invalid historical date or elapsed interval');
 const y=(date.era==='BCE'?1-date.year:date.year)+elapsed;
 return y<=0?{year:1-y,era:'BCE'}:{year:y,era:'CE'};
}
function compile({root,pages,references,sourceById,chats}){
 const source=JSON.parse(fs.readFileSync(path.join(root,'editorial/priestly-evidence.json'),'utf8'));
 if(source.schema!=='theology-priesthood-time/v1')throw Error('Unknown priesthood evidence schema');
 const slugs=new Set(pages.map(p=>p.slug)),refs=new Map(references.map(r=>[r.id,r])),seen=new Set();
 for(const c of source.claims){if(seen.has(c.id)||!slugs.has(c.page)||!refs.has(c.reference)||(!c.locator||c.locator.length<5)||[c.status,c.contribution,c.boundary,c.nextQuestion].some(v=>typeof v!=='string'||v.length<15))throw Error('Invalid priesthood evidence claim '+c.id);seen.add(c.id);}
 for(const slug of source.articles)if(!slugs.has(slug))throw Error('Unknown priesthood article');
 const authorPassages=source.authorPassages.map(a=>{const p=sourceById.get(a.sourceId),t=chats.get(p?.sourceFile)?.turns[a.turn-1];if(!p||!t||t.speaker!==a.speaker||!t.text.includes(a.contains))throw Error('Priesthood source mismatch '+a.id);return {...a,sourceSlug:p.slug,sourceSha256:p.sourceSha256,url:'https://v5ma.github.io/theology-wiki/san-reader.html?page='+p.slug+'&turn='+a.turn};});
 const model=source.models.find(m=>m.id==='cd-illustrative');let current=model.anchor,elapsed=0;
 const calculated=model.steps.map(s=>{elapsed+=s.years;current=advance(current,s.years);return {event:s.event,date:current,elapsedYears:elapsed,intervalStatus:s.status};});
 const selected=new Set(source.claims.map(c=>c.reference));
 const out={...source,authorPassages,calculations:{modelId:model.id,conditional:true,results:calculated},references:[...selected].map(id=>refs.get(id))};
 fs.writeFileSync(path.join(root,'data/priestly-evidence.json'),JSON.stringify(out,null,2)+'\n');return out;
}
module.exports={advance,compile};
