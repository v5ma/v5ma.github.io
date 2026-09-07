'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const data=require('../editorial/connected-arguments.json');
const read=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const studies=root=>data.studies.map(s=>({...s,path:'bridges/'+s.slug+'.md',body:read(root,'editorial/bridge-studies/'+s.slug+'.md')+(s.slug===data.comparison.slug?'\n\n'+comparisonMarkdown():'')+'\n\n## Follow the connected argument\n\n[[connected-arguments|Open the chapter argument map, diagrams and research agenda]]. The full investigations linked above remain the primary treatments of each proposal.\n'}));
function compile(root,parts,pages){
 const bySlug=new Map(pages.map(p=>[p.slug,p])),chapters=parts.flatMap(p=>p.chapters.map(c=>({...c,part:p.title}))),ids=new Set(chapters.map(c=>c.id));
 if(data.transitions.length!==chapters.length||new Set(data.transitions.map(t=>t.chapter)).size!==chapters.length)throw Error('Incomplete chapter transition coverage');
 const result=structuredClone(data);delete result.relations;
 result.chapters=chapters.map((c,i)=>{const t=data.transitions.find(t=>t.chapter===c.id);if(!t||!bySlug.has(t.bridge)||(t.additionalBridges||[]).some(id=>!bySlug.has(id))||!t.question||!t.work||!t.nextQuestion)throw Error('Invalid chapter transition '+c.id);return {...t,title:c.title,part:c.part,pages:c.pages,previous:i?chapters[i-1].id:null,next:chapters[i+1]?.id||null,status:'Proposed chapter route; not an approved manuscript chapter'};});
 for(const t of data.transitions)if(!ids.has(t.chapter))throw Error('Unknown chapter');
 const used=new Set(data.studies.map(s=>'editorial/bridge-studies/'+s.slug+'.md'));
 validateComparison(result.comparison,new Set(data.references.map(r=>r.id)));
 for(const s of data.studies){if(!bySlug.has(s.slug))throw Error('Missing bridge study');for(const id of s.upstream){const p=bySlug.get(id);if(p?.kind!=='Developed article')throw Error('Invalid upstream article '+id);used.add('content/'+p.path);}}
 for(const t of data.research)if(!bySlug.has(t.page)||!t.nextAction||!t.status)throw Error('Invalid research question');
 result.inputHashes=Object.fromEntries(['editorial/connected-arguments.json','editorial/foundations.json',...used].sort().map(p=>[p,crypto.createHash('sha256').update(read(root,p)).digest('hex')]));
 result.policy='Connecting essays and proposed chapter transitions, not new original conversations, author approval, a manuscript chronology or a completed research program. The existing roadmap and its workbook remain a separate unchanged snapshot.';
 return result;
}
function markdown(parts){
 const link=(s,title)=>'[['+s+'|'+title+']]';
 const cycle='## Review and improvement cycle\n\nBaseline reviewed: '+data.improvementCycle.baseline+'\n\n'+data.improvementCycle.reviewFindings.map(x=>'Review finding: '+x).join('\n\n')+'\n\n'+data.improvementCycle.implemented.map(x=>'Implemented in this edition: '+x).join('\n\n')+'\n\n'+data.improvementCycle.remaining.map(x=>'Still open: '+x).join('\n\n');
 return '## Follow the argument, not just the subject\n\nThe book connects the inheritance of sacred stories, the survival of a teacher, the construction of a self and the work of repair. Five connecting essays develop the transitions. They are supplementary bridge studies, not replacements for the full investigations or newly recovered source conversations.\n\n'+cycle+'\n\n'+data.studies.map(s=>'## '+s.title+'\n\n'+s.summary+'\n\n'+link(s.slug,'Read the full bridge study')).join('\n\n')+'\n\n## The seventeen chapter transitions\n\nThese editorial handoffs supplement [[book-contents|the existing table of contents]]. They keep its chapter identities and reading membership unchanged.\n\n'+parts.map(p=>'### '+p.title+'\n\n'+p.chapters.map(c=>{const t=data.transitions.find(t=>t.chapter===c.id);return '#### '+c.title+'\n\nThe inherited question: '+t.question+'\n\nThe chapter\'s work: '+t.work+'\n\nThe next question: '+t.nextQuestion+'\n\n'+c.pages.map(s=>link(s,s.replaceAll('-',' '))).join(' / ')+'\n\n'+link(t.bridge,'Read the connecting essay')+(t.additionalBridges||[]).map(id=>' / '+link(id,'Read the passage comparison')).join('');}).join('\n\n')).join('\n\n')+'\n\n## Research that strengthens the connections\n\nThe status statements below describe the work actually performed in this connecting edition. They do not change [[research-roadmap|the shared delivery plan]] or claim that its tasks are complete.\n\n'+data.research.map(t=>'### '+t.title+'\n\n'+t.status+'\n\n'+t.nextAction+'\n\n'+link(t.page,'Open the relevant bridge')).join('\n\n')+'\n\n## Three ways to inspect the connections\n\nThe transmission map separates a proposed founder, succession, carriers and surviving witnesses. The dating map separates a narrated event, a composition, a copy and its interpretation. The formation map separates action correction from correction of the interpreted standard. These are conceptual reading diagrams, not dated archaeological observations.\n\n[Read the structured chapter and research map](./data/connected-arguments.json). [[connections|Explore the complete explained-link graph]] or [[museum-trails|continue through the existing museum trails]].';
}

function validateComparison(c,refs){
 if(c?.schema!=='theology-restoration-comparison/v1'||c.records.length!==6||new Set(c.records.map(r=>r.id)).size!==6)throw Error('Invalid restoration comparison');
 for(const r of c.records){
  for(const k of ['title','locator','agency','timing','boundary','question','scope','dateStatus'])if(typeof r[k]!=='string'||!r[k].trim())throw Error('Missing comparison field '+k);
  if(!/^[a-z0-9-]+$/.test(r.id)||r.compositionDate!==null||r.copyDate!==null)throw Error('Unreviewed comparison date or unsafe ID');
  if(!r.sourceIds.length||r.sourceIds.some(id=>!refs.has(id)))throw Error('Missing comparison source');
 }
}
function comparisonMarkdown(){return '## The six-passage comparison record\n\n'+data.comparison.policy+'\n\n'+data.comparison.records.map(r=>'### '+r.title+'\n\nLocator: '+r.locator+'.\n\nWho acts: '+r.agency+'.\n\nNarrative timing: '+r.timing+'.\n\nBeneficiaries and boundary: '+r.boundary+'\n\nResearch question: '+r.question+'\n\nAccess scope: '+r.scope+'\n\nDating scope: '+r.dateStatus).join('\n\n');}
module.exports={data,studies,compile,markdown,validateComparison,comparisonMarkdown};
