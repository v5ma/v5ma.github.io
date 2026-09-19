'use strict';
// The first integration exposed two period fields containing only passage locators.
// Add the missing historical context; do not weaken the test or alter the relationship's evidence level.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=path.join(__dirname,'relationships.json'),raw=fs.readFileSync(file),data=JSON.parse(raw),updates=[['egypt-phaedrus','Phaedrus 274c-275b','Fourth-century BCE Greek dialogue, Phaedrus 274c-275b'],['egypt-timaeus','Timaeus 21e-25d','Fourth-century BCE Greek dialogue, Timaeus 21e-25d']];
const ready=updates.every(([id,,after])=>data.relationships.find(r=>r.id===id).period===after);
if(!ready){assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'ff9a62cb25e7aeb9f7615e5d052502a3229c9ad99001e6c7a2295cdd6bfa47f9');for(const[id,before,after]of updates){const row=data.relationships.find(r=>r.id===id);assert.equal(row.period,before);row.period=after;}fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');console.log('Added historical scope to the two Platonic relationship locators.');}else console.log('The two period-context repairs are already present.');
