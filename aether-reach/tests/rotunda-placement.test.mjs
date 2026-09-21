import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanWorkspace,createWorkspacePlacement,resetWorkspacePlacement} from '../rotunda-core.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-9);
test('Changing workspace options never follows a later head pose until deliberate recall',()=>{
 const placement=createWorkspacePlacement(),c=cleanWorkspace(),head={x:1,z:2,forward:{x:0,z:-1}};
 const a=placement.locate(head,c);head.x=50;head.forward.x=1;head.forward.z=0;
 const b=placement.locate(head,{...c,height:1.4,scale:1.1});
 near(b.x,a.x);near(b.z,a.z);near(b.yaw,a.yaw);near(b.y,1.4);
 const moved=placement.locate(head,c,true);near(moved.x,51.05);near(moved.z,2);
 placement.reset();const reset=placement.locate({x:0,z:0,forward:{x:0,z:-1}},c);near(reset.x,0);near(reset.z,-1.05);
});
test('Distance and rotation adjustments use the captured origin, not a moving head',()=>{
 const p=createWorkspacePlacement(),c=cleanWorkspace();p.locate({x:1,z:2,forward:{x:0,z:-1}},c);
 const a=p.locate({x:50,z:50,forward:{x:1,z:0}},{...c,yaw:Math.PI/2,distance:1.5});
 near(a.x,2.5);near(a.z,2);near(a.yaw,-Math.PI/2);
});
test('Reset placement preserves handed HUD choice, reduced motion and aiming preference',()=>{
 const c={height:.7,distance:1.6,scale:1.1,yaw:.8,hud:'right',motion:false,guidedAim:false},before=JSON.stringify(c);
 const a=resetWorkspacePlacement(c);assert.deepEqual(a,{...cleanWorkspace(),hud:'right',motion:false,guidedAim:false});
 assert.equal(JSON.stringify(c),before);assert.deepEqual(resetWorkspacePlacement(null),cleanWorkspace());
});
