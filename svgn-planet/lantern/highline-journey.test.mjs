import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,tick,action,serialize,parse} from './core.mjs';
import {trackCampaign,campaignRuntime,campaignTarget,campaignCanGlide} from './campaign.mjs';
import {highlineRestored,HIGHLINE_TOWERS} from './highline-layout.mjs';
// This journey starts fresh, writes no actor/mission/health coordinates, and uses
// the same tick/action/tracking functions invoked by the public input adapter.
export function playHighline({glide=false}={}){
 const s=fresh();let inputs=0,maxY=0;const steps=[];
 const step=(input={},n=1)=>{for(let i=0;i<n;i++){tick(s,input,1/60);inputs++;maxY=Math.max(maxY,s.y);}};
 function walk(x,z,y){for(let i=0;i<3500;i++){const dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz);step({x:d>.12?dx/(d||1):0,z:d>.12?dz/(d||1):0,brake:d<=.12});if(d<.17&&s.speed<.03){if(y!==undefined)assert.ok(Math.abs(s.y-y)<.2,'Height at '+[x,z]+': '+s.y+' expected '+y);return;}}throw Error('Blocked '+JSON.stringify({to:[x,y,z],at:[s.x,s.y,s.z],message:s.message}));}
 const route=ps=>ps.forEach(([x,z,y])=>walk(x,z,y));
 const interact=()=>{const id=campaignTarget(s)?.id;action(s,'interact');steps.push(id);};
 function ascend(t,start,end){for(let i=start;i<end;i++){const f=i%2===0,x=f?t.firstX:t.secondX;walk(x,f?-4.5:2.5,4.4+i*3.2);walk(x,f?2.5:-5.05,4.4+(i+1)*3.2);}}
 function descend(t,start,end){for(let i=start-1;i>=end;i--){const f=i%2===0,x=f?t.firstX:t.secondX;walk(x,f?2.5:-5.05,4.4+(i+1)*3.2);walk(x,f?-5.05:2.5,4.4+i*3.2);}}
 const print=HIGHLINE_TOWERS[0],radio=HIGHLINE_TOWERS[1];
 trackCampaign(s,'highline');route([[-12.5,8.2],[-12.5,5.1],[-12.5,-3.7,4.4],[-6,-3.5],[6,-3.5],[12,0]]);interact();assert.ok(campaignCanGlide(s));
 route([[12,-3.5],[6,-3.5],[-6,-3.5],[-15,-4.5,4.4]]);ascend(print,0,2);walk(-12.5,-5.05,10.8);interact();assert.match(s.message,/archive records/);
 ascend(print,2,4);walk(-12.5,-5.05,17.2);interact();assert.match(s.message,/17.2 m crossing/);
 route([[-6,-5.05,17.2],[6,-5.05,17.2],[15,-5.05,17.2]]);ascend(radio,4,6);walk(15,-5.05,23.6);
 assert.equal(campaignRuntime(s).enemies.filter(e=>e.hp===3).length,2,'Upper bypass leaves both sentries untouched');interact();assert.ok(highlineRestored(s));assert.ok(campaignRuntime(s).enemies.every(e=>e.hp===0));
 if(glide){
  step({x:-1,z:0},2);step({brake:true},12);action(s,'hop');let released=false;
  for(let i=0;i<1400;i++){if(s.x< -11.8)released=true;step({glide:!released});if(released&&s.vy===0&&s.speed<.02)break;}
  assert.ok(released,'High glide reached print tower');assert.ok(Math.abs(s.y-17.2)<.2,'Glide lands on Print Exchange');assert.ok(campaignRuntime(s).glideSeconds>2);
  descend(print,4,0);route([[-6,-3.5,4.4],[6,-3.5,4.4],[12,0,4.4]]);
 }else{descend(radio,6,0);route([[15,-3.5,4.4],[12,0,4.4]]);}
 interact();route([[12,-3.5],[6,-3.5],[-6,-3.5],[-12.5,-3.7],[-12.5,5.1,0],[-12.5,8.2],[-10,14,0]]);interact();
 assert.ok(s.campaign.completed.includes('highline'));assert.equal(s.campaign.credits,240);assert.equal(s.credits,0);assert.equal(s.watch.credits,0);assert.equal(s.city.credits,0);assert.equal(s.watch.stage,0);assert.equal(s.campaign.progress.flight,undefined);
 const loaded=parse(serialize(s));assert.equal(loaded.campaign.credits,240);action(s,'interact');assert.equal(s.campaign.credits,240);assert.equal(steps.length,6);
 return {inputs,maxY,steps,credits:s.campaign.credits,glideSeconds:glide?'>2':0,physicalDevicesTested:false};
}
test('Fresh input-only Highline: all stairs, both towers, upper bypass and homecoming',()=>console.log(JSON.stringify(playHighline())));
test('Fresh input-only Highline: real 23.6 m hop/glide/release return to 17.2 m roof',()=>console.log(JSON.stringify(playHighline({glide:true}))));
