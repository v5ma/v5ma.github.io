import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,tick,action,blocked,serialize,parse,lineClear} from './core.mjs';
import {trackStory} from './city.mjs';
import {campaignRuntime,campaignTarget} from './campaign.mjs';
test('Fresh-save input-only Watch and five-case campaign through real collision',()=>{
const s=fresh();let inputs=0;
function step(i={},n=1){for(let j=0;j<n;j++){tick(s,i,1/60);inputs++;}}
function walk(x,z){for(let i=0;i<8000;i++){const dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz);step({x:d>.17?dx/d:0,z:d>.17?dz/d:0,brake:d<=.17});if(d<.22&&s.speed<.04)return;}throw Error('blocked route '+JSON.stringify({target:[x,z],at:[s.x,s.y,s.z],campaign:s.campaign,message:s.message}));}
function route(ps){for(const [x,z]of ps)walk(x,z);}
const a=name=>action(s,name), log=t=>console.log(t,JSON.stringify({at:[s.x,s.y,s.z],campaign:s.campaign,inputs}));
trackStory(s,'watch');walk(-10,14);a('interact');route([[-12.5,8.2],[-12.5,6],[-9.6,6],[-9.6,2.3]]);a('scan');route([[-12.5,5.2],[-12.5,-3.7],[-6,-3.5],[6,-3.5],[12,-3.5],[12,-2.2]]);a('interact');route([[19.5,1.5],[19.5,10.5],[16,10.5],[14,8],[6,8],[4.5,18]]);a('interact');route([[0,18],[-10,14]]);a('interact');assert.equal(s.watch.stage,4);log('watch');
trackStory(s,'campaign:flight');route([[0,18],[4.5,18],[6,8],[14,8],[19.5,10.5],[19.5,1.5],[12,0]]);a('interact');route([[12,-3.5],[6,-3.5],[-6,-3.5],[-14.5,-4.4]]);a('interact');walk(-16,-4.4);a('interact');assert.equal(s.campaign.progress.flight,3);
const t=campaignTarget(s),dx=t.x-s.x,dz=t.z-s.z,d=Math.hypot(dx,dz);step({x:dx/d,z:dz/d},2);step({brake:true},12);a('hop');let released=false;for(let i=0;i<720;i++){if(Math.hypot(s.x-t.x,s.z-t.z)<.8)released=true;step({glide:!released});if(released&&s.y===0&&s.speed<.02)break;}assert.ok(campaignRuntime(s).glideLanded);a('interact');route([[-23,-10.5],[-23,8.2],[-12.5,8.2],[-12.5,5.2],[-12.5,-3.7],[-6,-3.5],[6,-3.5],[12,0]]);a('interact');assert.ok(s.campaign.completed.includes('flight'));log('flight');
trackStory(s,'campaign:predator');route([[19.5,1.5],[19.5,10.5],[14,8],[6,8],[4.5,18],[0,18],[-10,14]]);a('interact');route([[-12.5,8],[-12.5,5],[-12.5,-3.7],[-10,-4.2]]);a('interact');assert.equal(s.campaign.progress.predator,2);
route([[-18.5,-4],[-18.5,-12],[-10,-14.5],[-10,-16.1]]);
function stealth(){const r=campaignRuntime(s);for(let count=0;count<3;count++){
 const e=r.enemies[count];if(count===1)route([[-10,-16],[-10,-14.5],[-8,-13.5]]);if(count===2)route([[-6,-13.5],[-21,-13.5],[-23,-9]]);
 for(let i=0;i<6000&&e.hp>0;i++){
  a('smoke');const bx=e.x-Math.sin(e.yaw)*1.15,bz=e.z-Math.cos(e.yaw)*1.15,dx=bx-s.x,dz=bz-s.z,L=Math.hypot(dx,dz);
  step({x:L>.25?dx/(L||1):0,z:L>.25?dz/(L||1):0});a('interact');
 }
 if(e.hp>0)throw Error('stealth failed '+JSON.stringify({e,at:[s.x,s.y,s.z]}));
} }
stealth();step({},2);assert.equal(s.campaign.progress.predator,3);route([[-23,5],[-20.5,5],[-20.5,-2.7]]);a('interact');route([[-20.5,5],[-23,5],[-23,-12],[-5,-13.5],[5,-13.5],[18,-13.5],[18,-17]]);a('interact');route([[18,-13.5],[6,-13.5],[4.5,18],[0,18],[-10,14]]);a('interact');assert.ok(s.campaign.completed.includes('predator'));log('predator');
trackStory(s,'campaign:interiors');route([[-12.5,8.2],[-12.5,6],[-9.6,6],[-9.6,1.1]]);a('interact');route([[-9.6,6],[-12.5,6],[-12.5,8.2],[-20.5,5],[-20.5,-2.7]]);a('interact');route([[-20.5,5],[-23,5],[-23,-13.5],[-10,-14.5],[-10,-17.5]]);a('interact');route([[-10,-14.5],[-5,-13.5],[5,-13.5],[18,-13.5],[18,-16.5]]);a('interact');route([[18,-13.5],[6,-13.5],[6,8],[15,8],[15,6]]);a('interact');route([[6,8],[5.8,-13]]);a('interact');step({},130);assert.equal(s.water,'low');route([[-.5,-11],[-.5,-7]]);a('interact');route([[-.5,-11],[-.5,-13.5],[-5,-13.5],[-6,8],[-12.5,8.2],[-12.5,6],[-9.5,4.5]]);a('interact');assert.ok(s.campaign.completed.includes('interiors'));log('interiors');
function fight(level){const r=campaignRuntime(s);for(let i=0;i<14000;i++){
 const alive=r.enemies.filter(e=>e.hp>0&&Math.abs(e.y-level)<.7);if(!alive.length)return;
 const e=alive.sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0],dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz),ray={origin:{x:s.x,y:s.y+1.2,z:s.z},direction:{x:dx/(d||1),y:0,z:dz/(d||1)}};
 step({x:d>1.55?dx/(d||1):0,z:d>1.55?dz/(d||1):0,guard:e.phase==='windup'&&e.timer>.3});action(s,'pulse',ray);action(s,'strike',ray);
}throw Error('combat failed '+JSON.stringify({s:[s.x,s.y,s.z],enemies:campaignRuntime(s).enemies}));}
trackStory(s,'campaign:freeflow');route([[-9.5,6],[-12.5,6],[-12.5,8.2],[-10,14]]);a('interact');route([[0,18],[4.5,18],[6,13]]);fight(0);step({},2);assert.equal(s.campaign.progress.freeflow,2);log('court');route([[14,8],[19.5,10.5],[19.5,1.5]]);fight(4.4);step({},2);assert.equal(s.campaign.progress.freeflow,3);route([[19.5,1.5],[19.5,10.5],[14,8],[6,8],[4.5,18],[0,18],[-10,14]]);a('interact');assert.ok(s.campaign.completed.includes('freeflow'));log('freeflow');
trackStory(s,'campaign:finale');route([[0,18],[4.5,18],[6,8],[14,8],[19.5,10.5],[19.5,1.5],[12,0]]);a('interact');a('campaign-route');route([[19.5,1.5],[19.5,10.5],[14,8]]);fight(0);step({},2);assert.equal(s.campaign.progress.finale,2);route([[14,8],[19.5,10.5],[19.5,1.5],[20,-3]]);a('interact');route([[19.5,1.5],[19.5,10.5],[14,8],[6,8],[4.5,18],[0,18],[-10,14]]);a('interact');assert.ok(s.campaign.completed.includes('finale'));assert.equal(s.campaign.credits,950);assert.equal(parse(serialize(s)).campaign.credits,950);log('complete');
});
