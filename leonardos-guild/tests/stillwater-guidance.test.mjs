/* Declared reducer/entry fixtures, not a browser or physical headset playtest. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,activeTarget,missionText,saveData,readSave} from '../model.mjs';
import {createCampaignState} from '../campaign-entry.mjs';
import {frontierAction,enterBadlands,leaveBadlands,TOWN_GATE,CAMP} from '../frontier-core.mjs';
import {POOL,cisternState,cisternStep} from '../cistern-core.mjs';
const world=makeWorld(),fresh=()=>createCampaignState();
const gate=s=>{s.mode='foot';s.speed=0;s.x=TOWN_GATE.x;s.z=TOWN_GATE.z;return s;};
const stable=s=>JSON.stringify({x:s.x,z:s.z,mode:s.mode,health:s.health,credits:s.credits,mission:s.mission,vehicle:s.vehicle,deliveries:[...s.deliveries],quarter:s.quarter,roadStage:s.road.stage,vaultAccepted:s.vault.accepted,vaultRecord:s.vault.record});
test('Accepting the waterworks contract points to its actual gate and basin, not Cairn Ridge',()=>{
 const s=gate(fresh());s.road.tracking=true;s.vault.tracking=true;const before=stable(s);
 assert.equal(frontierAction(s,world,'accept:cistern').ok,true);
 assert.equal(s.frontier.selected,'cistern');assert.equal(s.frontier.gateTracked,true);
 assert.equal(s.road.tracking,false);assert.equal(s.vault.tracking,false);
 assert.equal(activeTarget(s,world).z,TOWN_GATE.z);assert.equal(stable(s),before);
 assert.equal(enterBadlands(s).ok,true);assert.equal(activeTarget(s,world).id,'cistern');
 assert.equal(missionText(s).title,'The Drowned Workshop');
});
test('Explicitly marking a field site from Vinci retains that destination after legal gate travel',()=>{
 const s=gate(fresh());assert.equal(frontierAction(s,world,'track:cistern').ok,true);assert.equal(s.frontier.selected,'cistern');
 assert.equal(enterBadlands(s).ok,true);assert.equal(activeTarget(s,world).id,'cistern');
});
test('An unknown destination cannot erase the selected story or manufacture a gate marker',()=>{
 const s=fresh();s.road.tracking=true;const before=JSON.stringify(s);
 assert.equal(frontierAction(s,world,'track:not-a-real-site').ok,false);assert.equal(JSON.stringify(s),before);
});
test('Stillwater chapter entry selects only an objective and preserves the existing adventure',()=>{
 const s=fresh(),save=saveData(s),before=stable(s),selected=createCampaignState(save,'?chapter=stillwater');
 assert.equal(stable(selected),before);assert.deepEqual(selected.frontier.accepted,[]);
 assert.equal(selected.frontier.selected,'cistern');assert.equal(selected.frontier.gateTracked,true);
 assert.equal(missionText(selected).title,'The Drowned Workshop');assert.equal(selected.frontier.cistern.phase,0);
});
test('Explicit Quarter archive remains authoritative over a conflicting Stillwater chapter parameter',()=>{
 const s=createCampaignState(null,'?district=quarter&chapter=stillwater');assert.equal(s.quarter.active,true);assert.equal(s.frontier.gateTracked,false);
});
test('The waterworks objective waits at dry controls before pointing down the now-passable ramp',()=>{
 const s=gate(fresh());frontierAction(s,world,'accept:cistern');enterBadlands(s);
 s.frontier.cistern=cisternState({version:1,phase:2});s.frontier.cistern.surface=POOL.high;s.frontier.selected='water-lens';
 assert.equal(activeTarget(s,world).id,'cistern');assert.match(missionText(s).text,/drain|shallow/i);
 for(let i=0;i<600;i++)cisternStep(s,1/60);
 assert.equal(activeTarget(s,world).id,'water-lens');assert.equal(s.frontier.cistern.phase,2);
});
test('Refill and physical report markers follow actual saved waterworks progression',()=>{
 const s=gate(fresh());frontierAction(s,world,'accept:cistern');enterBadlands(s);
 s.frontier.cistern=cisternState({version:1,phase:4});s.frontier.selected='return';
 assert.equal(activeTarget(s,world).id,'return');assert.match(missionText(s).text,/refill/i);
 cisternStep(s,1/60);assert.equal(s.frontier.cistern.phase,5);assert.match(missionText(s).text,/report/i);
 s.x=CAMP.x;s.z=CAMP.z;assert.equal(leaveBadlands(s).ok,true);
 assert.equal(activeTarget(s,world).z,TOWN_GATE.z);assert.match(missionText(s).text,/report/i);
 assert.equal(s.credits,0);assert.equal(frontierAction(s,world,'report:cistern').ok,true);assert.equal(s.credits,80);
 assert.equal(frontierAction(s,world,'report:cistern').ok,false);assert.equal(s.credits,80);
});
test('A later explicit frontier choice leaves the waterworks objective without deleting its contract',()=>{
 const s=gate(fresh());frontierAction(s,world,'accept:cistern');enterBadlands(s);frontierAction(s,world,'track:orchard');
 assert.equal(activeTarget(s,world).id,'orchard');assert.notEqual(missionText(s).title,'The Drowned Workshop');assert.deepEqual(s.frontier.accepted,['cistern']);
});
test('Completed waterworks and all earlier earned records survive the Stillwater playtest entry',()=>{
 const s=fresh();s.credits=321;s.frontier.cistern=cisternState({version:1,phase:5});s.frontier.accepted=['cistern'];s.frontier.reported=['cistern'];s.vault.record=true;s.vault.accepted=true;
 const loaded=readSave(JSON.stringify(saveData(s)),world),a=createCampaignState(loaded),b=createCampaignState(loaded,'?chapter=stillwater');
 assert.equal(stable(a),stable(b));assert.deepEqual(b.frontier.reported,['cistern']);assert.equal(b.credits,321);assert.equal(b.frontier.selected,'cistern');
});
