/* Read-only guidance following with ordinary model motion. Initial fixture
 * placement and absent threats are not a browser mission-completion claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step} from '../model.mjs';
import {goalGuide} from '../goal-guide.mjs';
import {BELL_ROUTES} from '../bellwether-layout.mjs';
const route=BELL_ROUTES.find(r=>r.id==='upper').points;
for(const delay of [.05,.1,.2,.5])test('Gallery guidance clears the top landing at '+delay+' second decisions',()=>{
 for(const stage of [3,4]){
  const s=createState();s.drones=[];s.bellwether.stage=stage;s.expedition.tracked='bellwether-blackout';
  const [x,y,z]=route[1];Object.assign(s.p,{x,y,z,grounded:true});
  let goal,age=Infinity,arrived=false;const seen=new Set();
  for(let i=0;i<45*120;i++){
   if(age>=delay){const before=JSON.stringify(s);goal=goalGuide(s);assert.equal(JSON.stringify(s),before);age=0;seen.add(goal.id);s.p.yaw=Math.atan2(goal.x-s.p.x,s.p.z-goal.z);}
   if(goal.id==='bell-signal'&&s.p.y>27.4&&Math.hypot(s.p.x-goal.x,s.p.z-goal.z)<2.2){arrived=true;break;}
   step(s,{moveZ:Math.min(1,Math.hypot(goal.x-s.p.x,goal.z-s.p.z)),explorer:true},1/120);age+=1/120;
  }
  assert(arrived,'The marker led the courier into a wall or off its authored route');
  assert(seen.has('bell-gallery-11'),'Do not skip the top stair landing');
  assert(seen.has('bell-gallery-12'),'Clear the roof connector before marking the receiver');
  assert.equal(s.stats.rescues,0);assert.equal(s.bellwether.stage,stage);assert.equal(s.kit.credits,400);
 }
});
