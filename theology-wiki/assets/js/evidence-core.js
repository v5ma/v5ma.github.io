/* Shared pure logic: claims are evidence records, never independent votes by default. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TheologyEvidenceCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const id=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{1,100}$/.test(v);
const norm=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function validate(data){
 const errors=[],seen=new Set(),refs=new Map(),topics=new Set();
 if(data?.schema!=='theology-evidence-workbench/v1'||!Array.isArray(data.claims)||!Array.isArray(data.references))return ['Unknown or incomplete evidence schema'];
 for(const r of data.references){if(!id(r.id)||refs.has(r.id)||!safeURL(r.url)||!r.scope)errors.push('Invalid evidence reference '+r.id);refs.set(r.id,r);}
 for(const c of data.claims){if(!id(c.id)||seen.has(c.id)||!id(c.page)||!id(c.channel)||!refs.has(c.reference)||['title','topic','locator','status','contribution','boundary','nextQuestion'].some(k=>typeof c[k]!=='string'||c[k].trim().length<3))errors.push('Invalid evidence claim '+c.id);seen.add(c.id);topics.add(c.topic);}
 if(data.authorPassages!==undefined&&(!Array.isArray(data.authorPassages)||data.authorPassages.some(a=>!id(a.sourceSlug)||!safeURL(a.url)||!/^[a-f0-9]{64}$/.test(a.sha256))))errors.push('Invalid original-source link');
 if(!data.policy||!Array.isArray(data.inputs)||data.inputs.some(p=>!/^editorial\/[a-z0-9-]+\.json$/.test(p.path)||!/^[a-f0-9]{64}$/.test(p.sha256)))errors.push('Missing source identity');
 return errors;
}
function filter(claims,query='',topic='',status=''){const words=norm(query).trim().split(/\s+/).filter(Boolean);return claims.filter(c=>(!topic||c.topic===topic)&&(!status||c.status===status)&&words.every(w=>norm([c.id,c.title,c.locator,c.contribution,c.boundary,c.nextQuestion,c.channel].join(' ')).includes(w)));}
function selection(data,params){const ids=new Set(data.claims.map(c=>c.id));const first=params.get('claim'),second=params.get('compare');return {first:ids.has(first)?first:(ids.has('jt-knowledge')?'jt-knowledge':data.claims[0]?.id||''),second:ids.has(second)&&second!==first?second:'',query:(params.get('find')||'').slice(0,300),topic:[...new Set(data.claims.map(c=>c.topic))].includes(params.get('topic'))?params.get('topic'):'',status:[...new Set(data.claims.map(c=>c.status))].includes(params.get('status'))?params.get('status'):'',invalid:Boolean(first&&!ids.has(first)||second&&!ids.has(second))};}
function relation(a,b){if(!b)return 'Select a second claim to compare contributions and unresolved questions.';if(a.id===b.id)return 'The same claim is selected twice; it is displayed once.';if(a.channel===b.channel)return 'Shared surviving channel: '+a.channel+'. These are distinct passage claims, not automatically independent witnesses. This grouping is a provenance aid, not a probability calculation.';return 'Different declared channels. This does not establish independence or historical transmission; inspect the locators, access notes and competing explanations.';}
function packet(data,ids){const selected=[...new Set(ids)].map(i=>data.claims.find(c=>c.id===i)).filter(Boolean);if(!selected.length)throw Error('Choose a known claim to export.');const refs=new Set(selected.map(c=>c.reference));return {schema:'theology-evidence-comparison/v1',version:data.version,policy:data.policy,inputs:data.inputs,claims:selected,references:data.references.filter(r=>refs.has(r.id)),interpretation:relation(selected[0],selected[1])};}
return {id,safeURL,validate,filter,selection,relation,packet};
});
