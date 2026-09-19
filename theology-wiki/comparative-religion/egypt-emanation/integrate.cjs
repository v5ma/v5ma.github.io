'use strict';
// Add reciprocal navigation without editing the nine established studies or main-reader article bodies.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const parent=path.resolve(__dirname,'..'),p=path.join(parent,'build.cjs'),marker='// Egyptian Seed follow-up integration, 2026-09-18',blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');let text=fs.readFileSync(p,'utf8');
const original='bce843cf09dfbf124fc6a08495108c91a27570d6';
if(!text.includes(marker)){assert.equal(blob(Buffer.from(text)),original,'Parent generator changed; reconcile before integration');
 text=text.replace("'use strict';","'use strict';\n"+marker+"\nrequire('./egypt-emanation/build.cjs');");
 const old="+link('Apocalyptic Repair Theology','../san-reader.html?page=apocalyptic-repair-theology')";
 assert.equal(text.split(old).length-1,1);text=text.replace(old,"+link('Egypt, emanation and genealogy','egypt-emanation/index.html')"+old);
 const point="const cards=studies.map";assert.equal(text.split(point).length-1,1);
 const followup="const nextSeries='<section><h2>Egypt, emanation and a larger genealogy</h2><p>The next research series develops the Egyptian Seed hypothesis, the abstraction method, Plotinus and Arabic transmission, 27 source-scoped comparisons, and a testable account of moral time horizons. It separates documented reception from possible lost connections.</p><p>'+link('Open the eight new studies and relationship register','egypt-emanation/index.html')+'</p></section>';\n";
 text=text.replace(point,followup+point);
 const location="+filters(['Study'],'Entry type')+cards";assert.equal(text.split(location).length-1,1);text=text.replace(location,"+nextSeries+filters(['Study'],'Entry type')+cards");
 const studyPoint="shell(study.title,study.summary,sections+";assert.equal(text.split(studyPoint).length-1,1);
 // The supplemental section uses a self-contained expression because study pages are generated before nextSeries is declared.
 const bridge="(['shared-repertoire','iranian-and-greek-contact'].includes(study.slug)?'<section><h2>Develop the Egyptian Seed and transmission comparison</h2><p>The expanded study tests the method against named Egyptian, Greek and later witnesses rather than requiring every resemblance to be a proven lineage.</p><p>'+link('Read the larger Egypt-emanation series','egypt-emanation/index.html')+'</p></section>':'')+";
 text=text.replace(studyPoint,studyPoint+bridge);fs.writeFileSync(p,text);
}
const r=path.join(parent,'README.md'),oldReadme=fs.readFileSync(r,'utf8'),addition='\nThe Egyptian Seed follow-up adds eight developed studies, 27 qualitative five-dimension profiles and twenty typed relationship records. [Open the expanded series](egypt-emanation/index.html). It is linked from this series navigation, index and the shared-repertoire and Iranian/Greek studies. Original nine-study prose, 36-entry directory, quote audit, principal reader articles, forecasts and their preservation receipts remain unchanged. The new full texts have their own local search and are not silently counted as new principal-reader routes.\n';if(!oldReadme.includes('The Egyptian Seed follow-up adds'))fs.writeFileSync(r,oldReadme+addition);
fs.writeFileSync(path.join(__dirname,'integration-receipt.json'),JSON.stringify({schema_version:1,base_commit:require('./manifest.json').base_commit,parent_generator_original_git_blob:original,parent_generator_integrated_git_blob:blob(Buffer.from(text)),scope:'Navigation and contextual links in the earlier comparative series only; no change to canonical main-reader article bodies or earlier research records.'},null,2)+'\n');console.log('Reciprocal series navigation integrated.');
