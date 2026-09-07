'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../assets/js/evidence-core.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['editorial/priestly-evidence.json','editorial/transmission-evidence.json'];
function source(root){const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));return {priestly:read(files[0]),transmission:read(files[1])};}
function compose(root,references){const {priestly,transmission}=source(root);if(transmission.schema!=='theology-transmission-evidence/v1')throw Error('Unknown transmission source schema');
 const old=priestly.claims.map(c=>({...c,title:c.locator,topic:'Priesthood and prophetic time',channel:({'atlas-daniel':'daniel','atlas-onias':'josephus-antiquities','priests-war7':'josephus-war','priests-war2':'josephus-war','priests-collins':'collins-damascus','melch-williams2023':'williams-melchizedek'})[c.reference]||c.reference}));
 const claims=[...transmission.claims,...old],needed=new Set(claims.map(c=>c.reference));
 const data={schema:'theology-evidence-workbench/v1',version:transmission.version,updated:transmission.updated,policy:transmission.policy,inputs:files.map(f=>({path:f,sha256:sha(fs.readFileSync(path.join(root,f)))})),claims,references:references.filter(r=>needed.has(r.id))};
 const errors=C.validate(data);if(errors.length)throw Error(errors.join('\n'));return data;
}
function markdown(root,references){const d=compose(root,references);return d.policy+'\n\nThe interactive comparison keeps this complete reading edition available below it. [[james-and-contested-succession|James and contested succession]] / [[thomas-sayings-and-transmission|Thomas, sayings and transformed understanding]] / [[source-atlas|Source atlas]].\n\n[Download the complete evidence record](./data/evidence-workbench.json).\n\n'+d.claims.map(c=>{const r=d.references.find(r=>r.id===c.reference);return '## '+c.title+'\n\n'+c.status+' / '+c.topic+'. Locator: '+c.locator+'.\n\n'+c.contribution+'\n\nInterpretive boundary: '+c.boundary+'\n\nNext investigation: '+c.nextQuestion+'\n\nSurviving channel: '+c.channel+'.\n\n[['+c.page+'|Read the full argument]] / ['+r.title+']('+r.url+').\n\nAccess scope: '+r.scope;}).join('\n\n');}
function compile({root,pages,references,sourceById,chats}){const data=compose(root,references),slugs=new Set(pages.map(p=>p.slug));for(const c of data.claims)if(!slugs.has(c.page))throw Error('Unknown evidence article '+c.page);
 data.authorPassages=source(root).transmission.authorPassages.map(a=>{const p=sourceById.get(a.sourceId),turn=chats.get(p?.sourceFile)?.turns[a.turn-1];if(!p||!turn||turn.speaker!==a.speaker||!turn.text.includes(a.contains))throw Error('Transmission source mismatch '+a.id);return {...a,sourceSlug:p.slug,sha256:p.sourceSha256,scope:'The selected phrase is present in this top-level author turn; the full turn can contain quotations. Export-start dates do not independently date every turn.',url:'https://v5ma.github.io/theology-wiki/san-reader.html?page='+p.slug+'&turn='+a.turn};});
 data.counts={claims:data.claims.length,topics:new Set(data.claims.map(c=>c.topic)).size,channels:new Set(data.claims.map(c=>c.channel)).size};
 fs.writeFileSync(path.join(root,'data/evidence-workbench.json'),JSON.stringify(data,null,2)+'\n');return data;
}
module.exports={compose,markdown,compile};
