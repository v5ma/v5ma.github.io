'use strict';
const fs=require('node:fs'),path=require('node:path');
function load(){const root=__dirname,read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),manifest=read('manifest.json'),studies=manifest.study_inputs.flatMap(p=>read(p).studies),profiles=read('profiles.json'),relations=read('relationships.json'),registered=read('sources.json').sources,updates=read('source-updates.json');
 const sourceMap=new Map(registered.map(s=>[s.id,{...s,edition_scope:'New research registration'}]));if(sourceMap.size!==registered.length)throw Error('Duplicate source ID');
 for(const s of updates.replace){if(!sourceMap.has(s.id))throw Error('Unknown source amendment');sourceMap.set(s.id,{...s,edition_scope:'Amended retrieval scope; original registration retained in Git and source-updates.json'});}
 for(const s of updates.add){if(sourceMap.has(s.id))throw Error('Duplicate added source');sourceMap.set(s.id,{...s,edition_scope:'Additional witness recovered during this research pass'});}
 const legacy=[...read('../sources.json').sources,...read('../sources-more.json').sources];for(const s of legacy)sourceMap.set('legacy:'+s.id,{...s,id:'legacy:'+s.id,locator:s.scope,edition_scope:'Inherited reading scope from comparative edition '+manifest.base_commit+'; not relabeled as a fresh full-text reading'});
 const used=new Set();for(const study of studies)for(const s of study.sections)for(const id of s.sources)used.add(id);for(const p of profiles.profiles)for(const id of p.sources)used.add(id);for(const r of relations.relationships)for(const id of r.sources)used.add(id);
 for(const id of used)if(!sourceMap.has(id))throw Error('Unknown source '+id);
 const sources=[...sourceMap.values()].filter(s=>!s.id.startsWith('legacy:')||used.has(s.id));
 return{manifest,studies,profiles,relations,sources,sourceMap};}
module.exports={load};
