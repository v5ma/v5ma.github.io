'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'..'),d=require('../roadmap.json');
test('Cross-chat continuation references existing docs and the runtime version',()=>{
 const c=d.continuation;a.equal(c.gameVersion,require('../release.json').version);
 for(const f of [c.entrypoint,c.audit])a.ok(fs.existsSync(path.join(dir,f)),f);
 a.ok(fs.readFileSync(path.join(dir,'roadmap.html'),'utf8').includes(c.entrypoint));
});
test('Ordered continuation actions reuse preserved canonical task IDs',()=>{
 a.equal(d.tasks.length,76);const ids=new Set(d.tasks.map(t=>t.id));
 for(const step of d.continuation.firstActions){a.ok(step.action.length>30);for(const id of step.tasks)a.ok(ids.has(id),id);}
 for(const id of d.nextRelease.focus)a.ok(ids.has(id),id);
 a.ok(d.nextRelease.focus.includes('V58'));a.ok(d.nextRelease.focus.includes('V41'));
});
test('Historical failed tests and unshipped draft features are not silently credited',()=>{
 const c=d.continuation;a.equal(c.historicalEvidence.modelsFailed,1);a.ok(c.historicalEvidence.browserSteps.includes('Skipped'));
 a.ok(c.notEstablishedAsShipped.length>=6);a.equal(d.tasks.find(t=>t.id==='V41').status,'Partial');
 a.ok(c.designGaps.some(s=>s.includes('discrete hit points')));
});
test('QA matrices retain open Tidelight and physical evidence gates',()=>{
 for(const id of ['Q11','Q12'])a.equal(d.deviceQA.find(r=>r[0]===id)[5],'Not run');
 for(const id of ['V08','V09','V10','V36','V38','V59','V62','V75'])a.equal(d.tasks.find(t=>t.id===id).status,'Hardware QA');
});
