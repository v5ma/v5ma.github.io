import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,interact,step,RAILS,pointOnRail} from '../model.mjs';
import {RAIL_TUNING} from '../skirmish-world.mjs';
const run=(s,seconds,input)=>{for(let i=0;i<seconds*120;i++)step(s,{explorer:true,...input},1/120);};
function rider(){const s=createState();Object.assign(s.p,{x:9,y:0,z:-5});interact(s);assert.equal(s.p.rail.id,'glassline');s.p.rail.s=50;s.p.speed=RAIL_TUNING.cruise;const p=pointOnRail(RAILS.find(r=>r.id==='glassline'),50);Object.assign(s.p,{x:p.x,y:p.y-2.65,z:p.z});return s;}
test('Holding the ordinary movement-stick brake reaches one latched reverse at the configured brake speed',()=>{
 const s=rider();run(s,1,{moveZ:-1,back:true});assert.equal(s.p.rail.dir,-1);assert.equal(s.stats.reversals,1);assert.equal(s.p.rail.reverseLatched,true);assert.equal(s.stats.rescues,0);
 run(s,.4,{moveZ:-1,back:true});assert.equal(s.stats.reversals,1);
});
test('Neutral stick re-arms the next deliberate rail reversal without rebinding a gameplay button',()=>{
 const s=rider();run(s,.7,{moveZ:-1,back:true});assert.equal(s.stats.reversals,1);
 run(s,.1,{moveZ:0,back:false});assert.equal(s.p.rail.reverseLatched,false);
 run(s,.5,{moveZ:-1,back:true});assert.equal(s.p.rail.dir,1);assert.equal(s.stats.reversals,2);assert.equal(s.stats.rescues,0);
});
