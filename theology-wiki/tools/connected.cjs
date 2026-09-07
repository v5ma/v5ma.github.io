'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const data=require('../editorial/connected-arguments.json');
const read=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const studies=root=>data.studies.map(s=>({...s,path:'bridges/'+s.slug+'.md',body:read(root,'editorial/bridge-studies/'+s.slug+'.md')+'\n\n## Follow the connected argument\n\n[[connected-arguments|Open the chapter argument map, diagrams and research agenda]]. The full investigations linked above remain the primary treatments of each proposal.\n'}));
function compile(root,parts,pages){
 const bySlug=new Map(pages.map(p=>[p.slug,p])),chapters=parts.flatMap(p=>p.chapters.map(c=>({...c,part:p.title}))),ids=new Set(chapters.map(c=>c.id));
 if(data.transitions.length!==chapters.length||new Set(data.transitions.map(t=>t.chapter)).size!==chapters.length)throw Error('Incomplete chapter transition coverage');
 const result=structuredClone(data);delete result.relations;
 result.chapters=chapters.map((c,i)=>{const t=data.transitions.find(t=>t.chapter===c.id);if(!t||!bySlug.has(t.bridge)||!t.question||!t.work||!t.nextQuestion)throw Error('Invalid chapter transition '+c.id);return {...t,title:c.title,part:c.part,pages:c.pages,previous:i?chapters[i-1].id:null,next:chapters[i+1]?.id||null,status:'Proposed chapter route; not an approved manuscript chapter'};});
 for(const t of data.transitions)if(!ids.has(t.chapter))throw Error('Unknown chapter');
 const used=new Set();
 for(const s of data.studies){if(!bySlug.has(s.slug))throw Error('Missing bridge study');for(const id of s.upstream){const p=bySlug.get(id);if(p?.kind!=='Developed article')throw Error('Invalid upstream article '+id);used.add('content/'+p.path);}}
 for(const t of data.research)if(!bySlug.has(t.page)||!t.nextAction||!t.status)throw Error('Invalid research question');
 result.inputHashes=Object.fromEntries(['editorial/connected-arguments.json','editorial/foundations.json',...used].sort().map(p=>[p,crypto.createHash('sha256').update(read(root,p)).digest('hex')]));
 result.policy='Connecting essays and proposed chapter transitions, not new original conversations, author approval, a manuscript chronology or a completed research program. The existing roadmap and its workbook remain a separate unchanged snapshot.';
 return result;
}
function markdown(parts){
 const link=(s,title)=>'[['+s+'|'+title+']]';
 return '## Follow the argument, not just the subject\n\nThe book connects the inheritance of sacred stories, the survival of a teacher, the construction of a self and the work of repair. Four connecting essays develop the transitions. They are supplementary bridge studies, not replacements for the full investigations or newly recovered source conversations.\n\n'+data.studies.map(s=>'## '+s.title+'\n\n'+s.summary+'\n\n'+link(s.slug,'Read the full bridge study')).join('\n\n')+'\n\n## The seventeen chapter transitions\n\nThese editorial handoffs supplement [[book-contents|the existing table of contents]]. They keep its chapter identities and reading membership unchanged.\n\n'+parts.map(p=>'### '+p.title+'\n\n'+p.chapters.map(c=>{const t=data.transitions.find(t=>t.chapter===c.id);return '#### '+c.title+'\n\nThe inherited question: '+t.question+'\n\nThe chapter\'s work: '+t.work+'\n\nThe next question: '+t.nextQuestion+'\n\n'+c.pages.map(s=>link(s,s.replaceAll('-',' '))).join(' / ')+'\n\n'+link(t.bridge,'Read the connecting essay');}).join('\n\n')).join('\n\n')+'\n\n## Research that strengthens the connections\n\nThe status statements below describe the work actually performed in this connecting edition. They do not change [[research-roadmap|the shared delivery plan]] or claim that its tasks are complete.\n\n'+data.research.map(t=>'### '+t.title+'\n\n'+t.status+'\n\n'+t.nextAction+'\n\n'+link(t.page,'Open the relevant bridge')).join('\n\n')+'\n\n## Three ways to inspect the connections\n\nThe transmission map separates a proposed founder, succession, carriers and surviving witnesses. The dating map separates a narrated event, a composition, a copy and its interpretation. The formation map separates action correction from correction of the interpreted standard. These are conceptual reading diagrams, not dated archaeological observations.\n\n[Read the structured chapter and research map](./data/connected-arguments.json). [[connections|Explore the complete explained-link graph]] or [[museum-trails|continue through the existing museum trails]].';
}
module.exports={data,studies,compile,markdown};
