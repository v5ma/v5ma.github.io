import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,tick,action,serialize,parse} from './core.mjs';
import {campaignRuntime,CAMPAIGN_CASES,campaignTarget} from './campaign.mjs';
test('Declared launch-to-arcade flight uses real hop, cape, collision and gravity',()=>{
 // Explicit unit fixture at an earned launch. The browser journey earns every stage.
 const s=fresh(),flight=CAMPAIGN_CASES.find(c=>c.id==='flight'),launch=flight.steps[2],landing=flight.steps[3];
 s.watch={v:1,stage:4,tracking:false,credits:180,route:'roof'};s.campaign={v:1,active:'flight',progress:{flight:3},completed:[],credits:0,route:'stealth'};
 Object.assign(s,{x:launch.x,y:launch.y,z:launch.z,yaw:Math.atan2(launch.x-landing.x,launch.z-landing.z)});action(s,'hop');
 let released=false,travel=0;
 for(let i=0;i<720;i++){if(Math.hypot(s.x-landing.x,s.z-landing.z)<.8)released=true;const old=[s.x,s.z];tick(s,{glide:!released},1/60);travel+=Math.hypot(s.x-old[0],s.z-old[1]);if(released&&s.y===0&&s.speed<.02)break;}
 assert.ok(released,'Landing must be reachable before terrain blocks flight');assert.ok(travel>6);assert.ok(Math.hypot(s.x-landing.x,s.z-landing.z)<2);assert.equal(s.y,0);assert.ok(campaignRuntime(s).glideLanded);action(s,'interact');assert.equal(s.campaign.progress.flight,4);assert.equal(s.campaign.credits,0);assert.equal(parse(serialize(s)).watch.credits,180);
});
test('An upper floor cannot be mistaken for the lower arcade landing',()=>{const s=fresh();s.watch={v:1,stage:4,tracking:false,credits:180,route:'roof'};s.campaign={v:1,active:'flight',progress:{flight:3},completed:[],credits:0,route:'stealth'};const t=campaignTarget(s);s.x=t.x;s.z=t.z;s.y=4.4;campaignRuntime(s).glideSeconds=1;tick(s,{},1/60);assert.equal(campaignRuntime(s).glideLanded,false);});
