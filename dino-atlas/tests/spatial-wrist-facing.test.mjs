// Inspection fixtures exercise the real single-sided meshes; they do not certify
// Quest wrist orientation, natural reach or physical tracking.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {SpatialConsole,consoleMaterial,WORKSPACE_VISIBILITY_CSS} from '../spatial-console.js';

function fixture(origin){
 const c=Object.create(SpatialConsole.prototype),rig=new T.Group(),left=new T.Group(),right=new T.Group();
 left.position.set(-.25,1.3,-.25);right.position.fromArray(origin);rig.add(left,right);
 c.root=new T.Group();rig.add(c.root);c.cfg={wrist:true};c.expanded=false;
 const mesh=(w,h)=>new T.Mesh(new T.PlaneGeometry(w,h),consoleMaterial({}));
 c.wrist={mesh:mesh(.4,.2)};c.dock={mesh:mesh(.48,.18)};c.rail={mesh:mesh(1.45,.17)};
 c.dock.mesh.visible=false;c.rail.mesh.visible=false;
 c.xr={active:true,invisible:false,panel:mesh(1.45,1.45),controllers:[{source:{handedness:'left'},ray:{visible:true},grip:left}],tiles:[],raycaster:new T.Raycaster(),rayFor:()=>({origin:right.getWorldPosition(new T.Vector3()),direction:new T.Vector3(0,0,-1).applyQuaternion(right.quaternion)})};
 c.xr.panel.visible=false;c.shortcuts=[{label:'Menu'},{label:'Field controls'}];c.tabs=[];c.placeWrist();
 return {c,aim(u,v){const target=c.wrist.mesh.localToWorld(new T.Vector3((u-.5)*.4,(v-.5)*.2,0));right.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(right.position).normalize());right.updateMatrixWorld(true);return c.hit({});}};
}
test('The previous equal-height ray correctly misses the non-rendered underside of the wrist slate',()=>{
 const {c,aim}=fixture([.25,1.3,-.25]);assert.equal(c.wrist.mesh.material.side,T.FrontSide);assert.equal(aim(.5,.7),null);
});
test('A front-side pointing pose hits information and both wrist buttons without double-sided picking',()=>{
 const {c,aim}=fixture([.25,1.5,-.05]);assert.equal(aim(.5,.7)?.occludesUI,true);assert.equal(aim(.25,.12),c.shortcuts[0]);assert.equal(aim(.75,.12),c.shortcuts[1]);
 c.wrist.mesh.parent.visible=false;assert.equal(aim(.25,.12),null);
});
test('Closed workspace visibility rule is narrowly scoped, overriding only its layout display',()=>{
 assert.equal(WORKSPACE_VISIBILITY_CSS,'#spatial-console-settings:not([open]){display:none!important}');
});
