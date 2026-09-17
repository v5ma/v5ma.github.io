import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {PortalMaterials,boxInterval,seesFragment,faceVisible,patchPortalShader} from '../portal-aperture.mjs';
import {cleanDiorama,sessionKind,stagePoint,worldPoint} from '../diorama-core.mjs';
import {createState,saveState,presentationSolids} from '../model.mjs';
import {goalGuide} from '../goal-guide.mjs';
import {createARView} from '../ar-view.mjs';
const v=(x,y,z)=>new T.Vector3(x,y,z),I=new T.Matrix4();
test('Portal preserves depth past rear and side faces but rejects before-entry and missed rays',()=>{
 const eye=v(0,20,80);assert(seesFragment(eye,v(0,20,-250),I));assert(seesFragment(eye,v(70,20,-250),I));assert(!seesFragment(eye,v(0,20,60),I));assert(!seesFragment(eye,v(200,20,-25),I));
 assert(boxInterval({x:0,y:20,z:0},{x:0,y:0,z:-1}));assert.equal(boxInterval({x:40,y:20,z:0},{x:0,y:0,z:1}),null);assert.equal(boxInterval({x:NaN,y:0,z:0},{x:1,y:0,z:0}),null);
});
test('Near shell faces cut away automatically without closing both requested openings',()=>{
 assert(!faceVisible(v(0,20,80),v(0,0,1),v(0,0,24)));assert(faceVisible(v(0,20,80),v(0,0,-1),v(0,0,-24)));assert(!faceVisible(v(-80,20,0),v(-1,0,0),v(-30,0,0)));
});
test('Exact courier centering is independent of travel, height, heading and scale',()=>{
 for(const scale of [.02,.03,.055])for(const yaw of [-2,0,1.2])for(const p of [{x:0,y:0,z:0},{x:-111,y:27.5,z:-9},{x:500,y:200,z:-300}]){
  const a={x:.3,y:.5,z:-1.45},c={scale,yaw};assert.deepEqual(stagePoint(p,p,a,c),a);const q=worldPoint(a,p,a,c);for(const k of ['x','y','z'])assert(Math.abs(q[k]-p[k])<1e-8);
 }
});
test('Portal hooks preserve existing shader work and restore callbacks; disposed materials leave no retained entry',()=>{
 const p=new PortalMaterials(),m=new T.MeshBasicMaterial(),old=()=>{},key=()=> 'prior';m.onBeforeCompile=old;m.customProgramCacheKey=key;const render=m.onBeforeRender;p.attach(m);p.attach(m);assert.equal(p.entries.size,1);assert(m.customProgramCacheKey().startsWith('prior|'));
 const shader={uniforms:{},vertexShader:'void main(){}',fragmentShader:'void main(){gl_FragColor=vec4(1.);}' };patchPortalShader(shader,p.uniforms);assert(shader.fragmentShader.includes('gl_FragCoord'));assert(shader.fragmentShader.includes('en<=1.00001'));assert.equal(shader.vertexShader,'void main(){}');
 p.dispose();assert.equal(m.onBeforeCompile,old);assert.equal(m.onBeforeRender,render);assert.equal(m.customProgramCacheKey,key);p.attach(m);m.dispose();assert.equal(p.entries.size,0);
});
test('Full inverse camera matrix and actual viewport are supplied for EACH scaled stereo eye',()=>{
 const p=new PortalMaterials(),m=new T.ShaderMaterial();p.attach(m);for(const x of [-.032,.032]){const rig=new T.Group(),c=new T.PerspectiveCamera(65,1,.06,1100);rig.scale.setScalar(1/.03);rig.rotation.set(.2,-.4,.3);rig.position.set(-12,4,-38);c.position.set(x,1.65,0);rig.add(c);rig.updateMatrixWorld(true);const viewport=new T.Vector4(x<0?0:480,0,480,640);m.onBeforeRender({getCurrentViewport(v){v.copy(viewport);}},null,c);assert.deepEqual(p.uniforms.aetherPortalViewport.value.toArray(),viewport.toArray());const clip=new T.Vector3(.2,-.4,.6),actual=clip.clone().applyMatrix4(p.uniforms.aetherPortalWorldFromClip.value),expected=clip.clone().unproject(c);assert(actual.distanceTo(expected)<1e-8);}
});
test('Goal guide follows the existing tracked objective and cannot change saved progress',()=>{
 const s=createState(),before=saveState(s),g=goalGuide(s);assert(g.name&&g.distance>=0);assert.equal(saveState(s),before);s.expedition.tracked='bellwether-blackout';const saved=saveState(s);goalGuide(s);assert.equal(saveState(s),saved);assert(presentationSolids(s).length>0);
});
test('First-person AR is explicit and restores fog, sky and renderer alpha on exit',()=>{
 assert.equal(cleanDiorama({mode:'first-person-ar'}).mode,'first-person-ar');assert.equal(sessionKind('first-person-ar'),'immersive-ar');
 const scene=new T.Scene(),sky=new T.Group();sky.name='Aether sky';scene.add(sky);scene.fog=new T.Fog(0xaaaaff,1,10);const fog=scene.fog;let color=new T.Color(0x223344),alpha=1;const renderer={getClearColor:c=>c.copy(color),getClearAlpha:()=>alpha,setClearColor(c,a){color.set(c);alpha=a;}};const ar=createARView({scene,renderer});ar.set(true);ar.update();assert.equal(alpha,0);assert.equal(sky.visible,false);assert.equal(scene.fog,null);ar.set(false);assert.equal(alpha,1);assert.equal(sky.visible,true);assert.equal(scene.fog,fog);
});

test('Desktop preview never masks tracked devices or UI before the first XR session',()=>{
 const p=new PortalMaterials(),root=new T.Group(),stage=new T.Group(),world=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),hand=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),panel=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial());
 stage.name='XR locomotion rig';panel.userData.xrUI=true;stage.add(hand);root.add(world,stage,panel);p.collect(root);assert(p.entries.has(world.material));assert(!p.entries.has(hand.material));assert(!p.entries.has(panel.material));
 stage.add(panel);p.collect(root);assert.equal(p.entries.size,1);p.dispose();
});
