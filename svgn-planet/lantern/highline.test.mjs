import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,tick,action,serialize,parse,save,load,SAVE_KEY,blocked,support,floorHeight,lineClear,surfaces} from './core.mjs';
import {trackCampaign,campaignTarget,campaignRuntime,campaignCanGlide,campaignAvailable,CAMPAIGN_CASES,parseCampaign} from './campaign.mjs';
import {HIGHLINE_TOWERS,HIGHLINE_GUIDE_POINTS,HIGHLINE_ANCHORS,HIGHLINE_MAX_Y,highlineKit,highlineRestored} from './highline-layout.mjs';
import {validGrapple,watchState} from './watch.mjs';
import {routeGuide,walkLink} from './route-guide.mjs';
import {missionCards,wardFieldStatus} from '../mission-presentation.mjs';

test('Highline is an immediate optional case; merely selecting it grants no kit, progress or credits',()=>{
 const s=fresh();assert.ok(campaignAvailable(s,'highline'));assert.equal(campaignAvailable(s,'flight'),false);
 const before=JSON.stringify(s);const card=missionCards(s).find(m=>m.id==='campaign:highline');assert.ok(card&&!card.disabled);assert.equal(JSON.stringify(s),before);
 trackCampaign(s,'highline');assert.equal(campaignTarget(s).id,'highline-brief');assert.equal(s.campaign.progress.highline,0);assert.equal(highlineKit(s),false);assert.equal(campaignCanGlide(s),false);assert.equal(s.campaign.credits,0);assert.equal(s.watch.stage,0);
});
test('Height schema accepts supported upper saves, rejects impossible heights, and leaves old ledgers intact',()=>{
 // Explicit serialization fixtures, not a played journey.
 const s=fresh();s.x=15;s.z=-5.05;s.y=23.6;s.safe=[15,23.6,-5.05];
 const p=parse(serialize(s));assert.equal(p.y,23.6);assert.equal(floorHeight(support(p,p.x,p.z,p.y),p.z),23.6);
 const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 assert.equal(save(s,storage).ok,true);assert.equal(load(storage).state.y,23.6);assert.ok(store.has(SAVE_KEY));
 assert.throws(()=>parse({...serialize(s),y:HIGHLINE_MAX_Y+1}));assert.equal(parse(serialize(fresh())).watch.credits,0);
 assert.throws(()=>parseCampaign({v:1,active:null,completed:['highline'],progress:{highline:6},credits:480,route:'stealth'}));
});
test('Highline destinations and service anchors are supported and not inside walls',()=>{
 const s=fresh();for(const p of [...HIGHLINE_ANCHORS,...CAMPAIGN_CASES.find(c=>c.id==='highline').steps]){
  assert.equal(blocked(s,p.x,p.y,p.z),false,p.id);const f=support(s,p.x,p.z,p.y);assert.ok(f,p.id);assert.ok(Math.abs(floorHeight(f,p.z)-p.y)<.01,p.id);
 }
 assert.deepEqual(HIGHLINE_TOWERS.map(t=>t.top),[17.2,23.6]);
});
test('Loaned tools and restored repeater survive valid saves without completing the old campaign',()=>{
 // Explicit mid-mission fixture.
 const s=fresh();trackCampaign(s,'highline');s.campaign.progress.highline=4;
 assert.ok(highlineKit(s));assert.ok(campaignCanGlide(s));assert.ok(highlineRestored(s));assert.equal(s.watch.stage,0);
 const loaded=parse(serialize(s));assert.equal(campaignRuntime(loaded).enemies.length,0);assert.equal(loaded.campaign.credits,0);assert.equal(campaignAvailable(loaded,'flight'),false);
 assert.match(wardFieldStatus(loaded).equipment,/grapple/);
});
test('Upper patrols move using their own collision exclusion and cannot step into air',()=>{
 // Labeled encounter fixture above the player, avoiding detection.
 const s=fresh();trackCampaign(s,'highline');s.campaign.progress.highline=2;const r=campaignRuntime(s),e=r.enemies[0],before=e.x;
 for(let i=0;i<90;i++)tick(s,{},1/60);
 assert.ok(Math.abs(e.x-before)>.3);assert.equal(e.y,10.8);assert.ok(support(s,e.x,e.z,e.y));assert.equal(s.watch.stage,0);
});
test('At least one safe real grapple path reaches each upper service anchor',()=>{
 // Geometric reach fixtures use authored supported starts, not browser progress.
 const s=fresh();trackCampaign(s,'highline');s.campaign.progress.highline=1;const api={blocked,lineClear,support,floorHeight,surfaces};
 const starts=[...HIGHLINE_GUIDE_POINTS,{x:-2,y:4.4,z:-3.5},{x:6,y:4.4,z:-3.5}];
 for(const a of HIGHLINE_ANCHORS){let valid=false;for(const start of starts){const trial={...s,...start};if(validGrapple(trial,a,api)){valid=true;break;}}assert.ok(valid,a.id+' has no safe approach');}
});
test('Tall mission guidance follows supported stairs instead of an imaginary vertical waypoint',()=>{
 const s=fresh();const target=CAMPAIGN_CASES.find(c=>c.id==='highline').steps[3];const g=routeGuide(s,target);
 assert.ok(g.path.length>3);assert.ok(g.path.some(p=>p.y>17));assert.ok(g.path.some(p=>/stair/i.test(p.label)));
 for(let i=1;i<g.path.length;i++)assert.ok(walkLink(s,g.path[i-1],g.path[i]));
 assert.equal(s.campaign.active,null);assert.equal(s.y,0);
});
