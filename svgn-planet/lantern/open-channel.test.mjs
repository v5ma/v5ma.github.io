import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,action,parse,serialize,lineClear,blocked,support,floorHeight} from './core.mjs';
import {parseCampaign,trackCampaign,campaignAvailable,campaignTarget} from './campaign.mjs';
import {CHANNEL_NODES,channelStatus,freshRouting,parseRouting,nearbyChannelNode} from './open-channel.mjs';
import {adventureEntry} from '../adventure-entry.mjs';
import {wardFieldStatus} from '../mission-presentation.mjs';
// Labelled save/proximity fixtures, not player journeys. Journey tests live in
// highline-journey.test.mjs and drive the same tick/action functions from fresh.
function unlocked(){const s=fresh();s.campaign=parseCampaign({v:1,active:null,progress:{highline:6,unsent:4},completed:['highline','unsent'],credits:360,route:'stealth'});return s;}
function ready(){const s=unlocked();trackCampaign(s,'channel');s.x=12;s.y=4.4;s.z=0;action(s,'interact');assert.equal(s.campaign.progress.channel,1);return s;}
const at=(s,id)=>{const n=CHANNEL_NODES.find(n=>n.id===id);s.x=n.x;s.y=n.y;s.z=n.z;};
const interact=(s,id)=>{at(s,id);action(s,'interact');};

test('Original saves receive an idle circuit without changing their stages or rewards',()=>{
 const s=fresh(),raw=serialize(s);delete raw.campaign.routing;const result=parse(raw);assert.deepEqual(result.campaign.routing,freshRouting());assert.equal(result.campaign.credits,0);assert.equal(result.campaign.active,null);
});
test('Open Channel is gated behind the recovered call and read-only launch preview awards nothing',()=>{
 const s=fresh();assert.equal(campaignAvailable(s,'channel'),false);assert.match(trackCampaign(s,'channel'),/not available/);const u=unlocked(),before=JSON.stringify(u),entry=adventureEntry(u);assert.equal(entry.mission,'campaign:channel');assert.equal(JSON.stringify(u),before);assert.equal(campaignAvailable(u,'flight'),false);
});
test('Insufficient power cannot advance, spend rewards, or move the actor',()=>{
 const s=ready();at(s,'transmit');const before=serialize(s);action(s,'interact');assert.deepEqual(serialize(s),before);assert.match(s.message,/only 2 are free/);assert.equal(channelStatus(s).ready,false);assert.equal(channelStatus(s).streetLit,true);
});
test('Both switches are reversible with visible numerical rather than color-only feedback',()=>{
 const s=ready();interact(s,'feeder');assert.equal(channelStatus(s).available,4);assert.equal(channelStatus(s).streetLit,false);assert.match(wardFieldStatus(s).detail,/4\/3.*DIVERTED/);
 interact(s,'feeder');assert.equal(channelStatus(s).available,2);interact(s,'reserve');assert.equal(channelStatus(s).available,4);assert.equal(channelStatus(s).streetLit,true);interact(s,'reserve');assert.deepEqual(s.campaign.routing,freshRouting());assert.equal(s.campaign.progress.channel,1);
});
test('Reserve route transmits with public lights on; briefing and acknowledgement are physical',()=>{
 const s=ready();interact(s,'reserve');assert.equal(campaignTarget(s).x,-21.5);interact(s,'transmit');assert.equal(s.campaign.progress.channel,2);assert.equal(s.campaign.routing.outcome,'reserve');assert.equal(channelStatus(s).streetLit,true);const before=s.campaign.progress.channel;action(s,'interact');assert.equal(s.campaign.progress.channel,before);
 s.x=-19.1;s.z=-6;action(s,'interact');assert.equal(s.campaign.progress.channel,3);assert.equal(s.campaign.routing.reserve,false);assert.equal(channelStatus(s).streetLit,true);
 s.x=12;s.y=4.4;s.z=0;action(s,'interact');assert.equal(s.campaign.credits,500);assert.equal(s.campaign.progress.channel,4);action(s,'interact');assert.equal(s.campaign.credits,500);assert.equal(parse(serialize(s)).campaign.routing.outcome,'reserve');assert.equal(adventureEntry(s).mission,null);
});
test('Direct diversion transmits and restores the lights at acknowledgement, with the same reward',()=>{
 const s=ready();interact(s,'feeder');interact(s,'transmit');assert.equal(s.campaign.routing.outcome,'transfer');assert.equal(channelStatus(s).streetLit,false);
 const loaded=parse(serialize(s));assert.equal(loaded.campaign.progress.channel,2);assert.equal(channelStatus(loaded).streetLit,false);
 loaded.x=-19.1;loaded.z=-6;action(loaded,'interact');assert.equal(loaded.campaign.progress.channel,3);assert.equal(channelStatus(loaded).streetLit,true);
 loaded.x=12;loaded.y=4.4;loaded.z=0;action(loaded,'interact');assert.equal(loaded.campaign.credits,500);assert.equal(loaded.credits,0);assert.equal(loaded.watch.credits,0);assert.equal(loaded.city.credits,0);assert.equal(loaded.campaign.routing.outcome,'transfer');
});
test('Suspending the case suspends its temporary lighting effect without losing the reversible switch state',()=>{
 const s=ready();interact(s,'feeder');s.campaign.active=null;assert.equal(channelStatus(s).streetLit,true);const loaded=parse(serialize(s));trackCampaign(loaded,'channel');assert.equal(channelStatus(loaded).streetLit,false);assert.equal(loaded.campaign.progress.channel,1);interact(loaded,'feeder');assert.equal(channelStatus(loaded).streetLit,true);
});
test('Floor separation and sight checks prevent remote interactions through ceilings and walls',()=>{
 const s=ready();at(s,'feeder');s.y=0;const before=serialize(s);action(s,'interact');assert.deepEqual(serialize(s),before);at(s,'feeder');assert.equal(nearbyChannelNode(s,{lineClear:()=>false}),null);assert.equal(nearbyChannelNode(s,{lineClear}),CHANNEL_NODES[1]);
 for(const n of CHANNEL_NODES){assert.equal(blocked(s,n.x,n.y,n.z),false);assert.ok(Math.abs(floorHeight(support(s,n.x,n.z,n.y),n.z)-n.y)<1e-6);}
});
test('Invalid or future circuit data cannot fabricate a powered transmission or erase original data',()=>{
 for(const raw of [{v:2,reserve:false,street:true,outcome:null},{v:1,reserve:1,street:true,outcome:null},{v:1,reserve:false,street:true,outcome:'reserve'}])assert.throws(()=>parseRouting(raw,2));
 assert.throws(()=>parseRouting({v:1,reserve:false,street:false,outcome:'transfer'},4));assert.throws(()=>parseRouting(undefined,2));assert.throws(()=>parseCampaign({v:1,active:'channel',progress:{channel:0},completed:[],credits:0,route:'stealth'}));
});
test('Paused or repeated observations never mutate the circuit or award anything',()=>{
 const s=ready(),before=JSON.stringify(s);for(let i=0;i<100;i++){channelStatus(s);campaignTarget(s);wardFieldStatus(s);adventureEntry(s);}assert.equal(JSON.stringify(s),before);assert.equal(s.campaign.credits,360);
});
