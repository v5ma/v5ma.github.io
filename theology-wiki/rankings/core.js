/* Pure, inspectable scoring. No network, storage, randomness or AI inference. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PatternWorkbook=api;})(globalThis,function(){
'use strict';
const bounded=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
const text=(v,max=12000)=>typeof v==='string'&&v.length<=max;
const id=v=>text(v,100)&&/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(v);
const safeURL=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
function check(ok,message){if(!ok)throw Error(message);}
function unique(items,label){check(Array.isArray(items),label+' must be an array.');const ids=new Set();for(const x of items){check(x&&id(x.id)&&!ids.has(x.id),'Invalid or duplicate '+label+' ID.');ids.add(x.id);}return ids;}
function validate(d){
 check(d&&d.schemaVersion===2,'Expected a version-2 ranked-pattern workbook.');
 for(const k of ['edition','assessedOn','title','editor','scope'])check(text(d[k]),'Missing '+k+'.');
 const people=unique(d.people,'person'),criteria=unique(d.criteria,'criterion'),sources=unique(d.sources,'source'),profiles=unique(d.profiles,'profile');
 check(d.people.length<=5000&&d.criteria.length<=250&&d.sources.length<=10000,'Dataset is too large.');
 for(const p of d.people)for(const k of ['name','era','category','note'])check(text(p[k]),'Invalid person '+k+'.');
 for(const s of d.sources){check(safeURL(s.url),'Sources require a public HTTPS URL.');for(const k of ['title','access','kind','date','consulted'])check(text(s[k]),'Invalid source '+k+'.');}
 for(const c of d.criteria){check(profiles.has(c.profile)&&sources.has(c.sourceId)&&bounded(c.weight,0,5),'Invalid criterion reference or weight.');for(const k of ['name','verse','observation','pattern','narrative'])check(text(c[k]),'Invalid criterion text.');}
 for(const p of d.profiles){check(text(p.name)&&text(p.note),'Invalid profile.');for(const k of ['patternIds','narrativeIds'])check(Array.isArray(p[k])&&p[k].length>0&&new Set(p[k]).size===p[k].length&&p[k].every(x=>criteria.has(x)&&d.criteria.find(c=>c.id===x).profile===p.id),'Invalid profile criteria.');}
 unique(d.assessments,'assessment');check(d.assessments.length<=10000,'Too many assessments.');const keys=new Set();
 for(const a of d.assessments){
  const key=a.personId+'|'+a.criterionId;check(!keys.has(key),'Duplicate person/criterion assessment; consolidate the dossier rather than count it twice.');keys.add(key);
  check(people.has(a.personId)&&criteria.has(a.criterionId),'Unknown assessment person or criterion.');
  check(['works','attribution'].includes(a.basis)&&[0.25,0.5,0.75,1].includes(a.quality),'Invalid evidence basis or weight.');
  for(const lens of ['pattern','narrative'])check(a[lens]&&bounded(a[lens].fit,0,4)&&bounded(a[lens].counter,0,4),'Scores must be finite values from 0 to 4.');
  for(const k of ['event','reason','counter','reviewer','eventDate','reviewedOn','relatedPersonId'])check(text(a[k]),'Invalid assessment text.');
  check(a.event.trim()&&a.reason.trim()&&a.counter.trim()&&a.reviewer.trim(),'An assessment requires an event, argument, countercase and reviewer.');
  check(!a.relatedPersonId||people.has(a.relatedPersonId),'Unknown counterpart.');
  if(a.criterionId==='promote')check(a.relatedPersonId&&a.relatedPersonId!==a.personId,'Promotion needs a different named counterpart.');
  check(Array.isArray(a.sourceIds)&&a.sourceIds.length>0&&new Set(a.sourceIds).size===a.sourceIds.length&&a.sourceIds.every(s=>sources.has(s)||(a.basis==='attribution'&&/^legacy:[a-zA-Z0-9_-]+$/.test(s))),'Unknown or missing assessment source.');
 }
 for(const b of d.bridges||[]){check(id(b.id)&&text(b.tradition)&&text(b.passage)&&text(b.connection)&&text(b.difference)&&text(b.status)&&Array.isArray(b.sourceIds)&&b.sourceIds.every(s=>sources.has(s)),'Invalid interfaith bridge.');}
 const tasks=unique(d.tasks||[],'task');for(const t of d.tasks||[])check(text(t.title)&&text(t.acceptance)&&['Implemented','Draft','Open'].includes(t.stage)&&Array.isArray(t.dependsOn)&&t.dependsOn.every(x=>tasks.has(x)&&x!==t.id),'Invalid work-plan entry.');
 return d;
}
function selectedCriteria(d,{profile='first',lens='pattern',criterion=''}={}){
 check(['pattern','narrative'].includes(lens),'Unknown scoring lens.');const p=d.profiles.find(x=>x.id===profile);check(p,'Unknown profile.');const ids=p[lens+'Ids'];check(!criterion||ids.includes(criterion),'Criterion does not belong to the selected profile/lens.');return d.criteria.filter(c=>ids.includes(c.id)&&(!criterion||c.id===criterion));
}
function score(d,personId,options={}){
 const cs=selectedCriteria(d,options),weights=options.weights||{},lens=options.lens||'pattern';
 let total=0,reviewed=0,supported=0,fitTotal=0,evidence=0,count=0;const rows=[];
 for(const c of cs){const w=Object.hasOwn(weights,c.id)?weights[c.id]:c.weight;check(bounded(w,0,5),'Weights must be finite values from 0 to 5.');if(!w)continue;total+=w;
  const a=d.assessments.find(a=>a.personId===personId&&a.criterionId===c.id&&(options.includeLeads||a.basis==='works'));
  if(!a){rows.push({criterion:c,weight:w,assessment:null});continue;}
  const net=Math.max(0,a[lens].fit-a[lens].counter)/4;reviewed+=w;evidence+=w*a.quality;fitTotal+=w*net;supported+=w*net*a.quality;count++;rows.push({criterion:c,weight:w,assessment:a,net,contribution:w*net*a.quality});
 }
 check(total>0,'At least one selected criterion must have a positive weight.');
 return {personId,score:count?100*supported/total:null,fit:count?100*fitTotal/reviewed:null,coverage:100*reviewed/total,evidenceCoverage:100*evidence/total,count,total:cs.filter(c=>(weights[c.id]??c.weight)>0).length,rows};
}
function rankings(d,options={}){
 const q=String(options.query||'').toLowerCase();const people=d.people.filter(p=>(!options.era||p.era===options.era)&&(!options.category||p.category.includes(options.category))&&(!q||[p.name,p.id,p.note].join(' ').toLowerCase().includes(q)));
 const list=people.map(p=>({...score(d,p.id,options),person:p})).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.person.name.localeCompare(b.person.name));
 let last=null,rank=0;list.forEach((r,i)=>{if(r.score===null){r.rank=null;return;}if(last===null||Math.abs(last-r.score)>1e-9)rank=i+1;r.rank=rank;last=r.score;});return list;
}
function csvCell(v){let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(rows){return rows.map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';}
return {validate,selectedCriteria,score,rankings,csv,safeURL};
});
