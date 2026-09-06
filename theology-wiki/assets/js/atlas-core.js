/* Pure shared logic for the source atlas and its auditable chronology experiments. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TheologyAtlasCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const kinds=['work','translation','material-witness','quoted-fragment','study','hypothesis','research-lead'];
const relations=['renders','quotes','witnesses','interprets','compares','alternative-version','investigates','proposes-origin','proposes-transmission','planned-comparison'];
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function calculate(interval,anchorBCE,ordinalAsElapsed=false){
 if(!Number.isInteger(anchorBCE)||anchorBCE<1||anchorBCE>5000)throw Error('Enter a whole BCE anchor year from 1 to 5000.');
 if(!interval||!Number.isInteger(interval.years)||interval.years<1||!['ordinal','elapsed'].includes(interval.mode))throw Error('Invalid interval.');
 const years=interval.years-(interval.mode==='ordinal'&&!ordinalAsElapsed?1:0);
 return {anchorBCE,elapsedYears:years,resultBCE:anchorBCE+years,counting:interval.mode==='ordinal'&&!ordinalAsElapsed?'Ordinal year, minus one':'Whole elapsed years'};
}
function filter(records,query='',kind=''){const q=query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim();return records.filter(r=>(!kind||r.kind===kind)&&(!q||[r.id,r.title,r.corpus,r.detail,r.status,...(r.pages||[])].join(' ').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').includes(q)));}
function validate(data){
 const errors=[],ids=new Set(),refIds=new Set((data.references||[]).map(r=>r.id));
 for(const r of data.records||[]){if(!/^[a-z][a-z0-9-]+$/.test(r.id)||ids.has(r.id))errors.push('Invalid or duplicate record ID: '+r.id);ids.add(r.id);if(!kinds.includes(r.kind)||!r.title||!r.detail||!r.date?.basis||!r.asset?.status)errors.push('Incomplete record: '+r.id);if([r.date?.start,r.date?.end].some(y=>y!==null&&(!Number.isInteger(y)||y===0)))errors.push('Invalid historical year: '+r.id);for(const id of r.sources||[])if(!refIds.has(id))errors.push('Unknown source: '+id);}
 for(const r of data.references||[])if(!safeURL(r.url)||!r.scope)errors.push('Unsafe or unscoped reference: '+r.id);
 const edgeIds=new Set();for(const e of data.edges||[]){if(edgeIds.has(e.id)||!ids.has(e.fromId)||!ids.has(e.toId)||e.fromId===e.toId||!relations.includes(e.relation)||!e.why||!e.basis)errors.push('Invalid edge: '+e.id);edgeIds.add(e.id);}
 const checks=new Set();for(const c of data.challenges||[]){if(checks.has(c.id)||!c.claim||!c.answer||!c.remaining||!c.passages?.length)errors.push('Incomplete challenge: '+c.id);checks.add(c.id);}
 for(const i of data.intervals||[])if(!ids.has(i.record)||!refIds.has(i.reference)||!['foundation','destruction'].includes(i.anchor)||!i.locator||!i.endEvent||!Number.isInteger(i.years)||i.years<1||!['ordinal','elapsed'].includes(i.mode))errors.push('Invalid interval: '+i.id);
 const trailIds=new Set(),stopIds=new Set();for(const t of data.trails||[]){if(trailIds.has(t.id)||!t.question||!t.chapter)errors.push('Invalid trail: '+t.id);trailIds.add(t.id);for(const s of t.stops||[]){if(stopIds.has(s.id)||!s.label||!s.page||!s.records?.length)errors.push('Invalid stop: '+s.id);stopIds.add(s.id);for(const id of s.records||[])if(!ids.has(id))errors.push('Unknown exhibit record: '+id);for(const id of s.challengeIds||[])if(!checks.has(id))errors.push('Unknown exhibit challenge: '+id);}}
 return errors;
}
return {kinds,relations,safeURL,calculate,filter,validate};
});
