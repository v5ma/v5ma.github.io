'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),C=require('../assets/js/atlas-core.js');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function build({root,data,references,pages,sourceById,chats,foundations}){
 const refIds=new Set(data.records.flatMap(r=>r.sources).concat(data.intervals.map(r=>r.reference)));
 const compiled={...data,references:references.filter(r=>refIds.has(r.id))};
 const errors=C.validate(compiled),slugs=new Set(pages.map(p=>p.slug));if(errors.length)throw Error(errors.join('\n'));
 for(const r of data.records)for(const s of r.pages)if(!slugs.has(s))throw Error('Unknown atlas article '+s);
 const chapters=foundations.parts.flatMap(p=>p.chapters).map(c=>c.id);
 const lookupPassage=a=>{const p=sourceById.get(a.sourceId),t=chats.get(p?.sourceFile)?.turns[a.turn-1];if(!p||!t||t.speaker!==a.speaker||!t.text.includes(a.contains))throw Error('Atlas source/speaker/phrase mismatch '+a.sourceId+':'+a.turn);const normalized=t.text.replace(/\s+/g,' '),at=normalized.indexOf(a.contains),begin=Math.max(0,at-160),end=Math.min(normalized.length,at+480);return {turn:t.number,speaker:t.speaker,sourceSlug:p.slug,sourceFile:p.sourceFile,sha256:p.sourceSha256,sourceBytes:p.sourceBytes,excerpt:normalized.slice(begin,end),omittedBefore:begin>0,omittedAfter:end<normalized.length,fullSourceURL:'https://v5ma.github.io/theology-wiki/san-reader.html?page='+encodeURIComponent(p.slug)+'&turn='+t.number,dateBasis:'Export-start date '+p.date+' is not an independently verified timestamp for this turn.'};};
 compiled.challenges=data.challenges.map(c=>{if(!slugs.has(c.page))throw Error('Unknown challenge page');return {...c,passages:c.passages.map(lookupPassage)};});
 for(const t of data.trails){if(!chapters.includes(t.chapter))throw Error('Unknown exhibit chapter');for(const s of t.stops)if(!slugs.has(s.page))throw Error('Unknown exhibit article');}
 compiled.counts={records:data.records.length,kinds:Object.fromEntries(C.kinds.map(k=>[k,data.records.filter(r=>r.kind===k).length])),relationships:data.edges.length,intervals:data.intervals.length,challenges:data.challenges.length,trails:data.trails.length,stops:data.trails.reduce((n,t)=>n+t.stops.length,0)};
 const write=(f,v)=>fs.writeFileSync(path.join(root,f),JSON.stringify(v,null,2)+'\n');
 write('data/source-atlas.json',compiled);
 const uri=id=>'https://v5ma.github.io/theology-wiki/san-reader.html?page=source-atlas&record='+encodeURIComponent(id);
 const museum={schema:'theology-museum-content/1',version:data.version,contentOnly:true,runtimeOwnership:'XR implementation is maintained separately. This manifest supplies curation and evidence, not a working XR scene.',atlas:{path:'source-atlas.json',sha256:hash(fs.readFileSync(path.join(root,'data/source-atlas.json')))},assetPolicy:'No new scan, photograph, 3D mesh or translated full text is licensed by this manifest. All stops have empty asset lists until explicit permission and identity are checked. Existing wiki illustrations remain contextual, not facsimiles of these objects.',trailPolicy:'A short label must expose its fullArgumentURL, sourceURLs and challengeURLs. Never substitute a label for the full reconstruction or treat a proposed link as a demonstrated event.',trails:data.trails.map(t=>({...t,stops:t.stops.map(s=>({...s,recordURLs:s.records.map(uri),fullArgumentURL:'https://v5ma.github.io/theology-wiki/san-reader.html?page='+s.page,challengeURLs:s.challengeIds.map(id=>'https://v5ma.github.io/theology-wiki/san-reader.html?page=argument-challenges&challenge='+id),assetIds:[]}))}))};
 write('data/museum-manifest.json',museum);
 return compiled;
}
module.exports={build};
