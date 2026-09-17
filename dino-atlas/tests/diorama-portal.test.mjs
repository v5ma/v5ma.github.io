import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {PORTAL_SPAN,dimensions,boxInverse,seesFragment,enterPortal,faceOpacity,PortalMaterials,patchShader} from '../diorama-portal.js';
import {stageMatrix,gameRay} from '../diorama-core.js';
import {DioramaXR} from '../diorama-xr.js';
const v=(x,y,z)=>new T.Vector3(x,y,z),size={width:2,depth:2,height:1},inv=new T.Matrix4();
test('Portal keeps distant scenery beyond rear and side walls but rejects outside silhouettes',()=>{
 for(const eye of [v(0,.6,4),v(4,.6,0),v(-4,.6,0),v(0,.6,-4)]){
  const middle=v(0,.5,0),d=middle.clone().sub(eye).normalize(),far=middle.clone().addScaledVector(d,30);
  assert.equal(seesFragment(eye,far,inv,size),true);
  assert.equal(seesFragment(eye,eye.clone().addScaledVector(d,.2),inv,size),false,'No geometry before entry');
  assert.equal(seesFragment(eye,far.clone().add(v(0,50,0)),inv,size),false);
 }
});
test('Portal handles parallel, inside, rotated and per-eye rays independently',()=>{
 assert.equal(seesFragment(v(3,.5,4),v(3,.5,-20),inv,size),false);
 assert.equal(seesFragment(v(0,.5,0),v(0,.5,-20),inv,size),true);
 const eyeL=v(-.032,.5,4),eyeR=v(.032,.5,4),point=v(-2,.5,-2);
 assert.notEqual(seesFragment(eyeL,point,inv,size),seesFragment(eyeR,point,inv,size));
 for(const yaw of [0,.4,Math.PI]){const a=v(1,.8,-2),m=boxInverse(a,yaw).invert(),inverse=m.clone().invert();assert.equal(seesFragment(v(0,.5,4).applyMatrix4(m),v(0,.5,-30).applyMatrix4(m),inverse,size),true);}
});
test('Avatar remains exactly at box center across walking, vertical motion and display rotations',()=>{
 for(const width of [1.2,2.4,3.2])for(const yaw of [0,.7,Math.PI])for(const p of [v(38,1,-8),v(-450,60,220),v(3,3,20)]){
  const a=v(0,.9,-1.7),d=dimensions(width),middle=a.clone().add(v(0,d.height/2,0)),m=stageMatrix(middle,yaw,width/PORTAL_SPAN,p);
  assert.ok(p.clone().applyMatrix4(m).distanceTo(middle)<1e-9);
 }
});
test('All camera-facing panels clear even when their preset is closed',()=>{
 for(const normal of [v(1,0,0),v(-1,0,0),v(0,1,0),v(0,0,1),v(0,0,-1)]){
  const point=normal.clone();assert.equal(faceOpacity(normal.clone().multiplyScalar(4),normal,point),0);
  assert.equal(faceOpacity(normal.clone().multiplyScalar(-4),normal,point),.035);
  assert.equal(faceOpacity(normal.clone().multiplyScalar(-4),normal,point,false),0);
 }
});
test('Pointer begins at portal entry and maps into actual unscaled gameplay',()=>{
 const ray={origin:v(0,.5,4),direction:v(0,0,-1)},r=enterPortal(ray,inv,size);assert.ok(r.origin.z<1&&r.origin.z>.99);
 assert.equal(enterPortal({origin:v(4,.5,4),direction:v(0,0,-1)},inv,size),null);
 const m=stageMatrix(v(0,.5,0),.6,.05,v(12,1,24)),back=gameRay(r,m);assert.ok(back.origin.clone().applyMatrix4(m).distanceTo(r.origin)<1e-8);
});
test('Portal preserves prior custom hooks, reusable uniforms and disposal behavior',()=>{
 const p=new PortalMaterials(),m=new T.MeshStandardMaterial();let called=0;
 const old=shader=>{called++;shader.fragmentShader='// retained hook\n'+shader.fragmentShader;};m.onBeforeCompile=old;m.customProgramCacheKey=()=> 'prior-hook';
 p.attach(m);p.attach(m);const s={uniforms:{},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(1.);}'};m.onBeforeCompile(s,{});
 assert.equal(called,1);assert.match(s.fragmentShader,/retained hook/);assert.match(s.fragmentShader,/cameraPosition/);assert.match(s.vertexShader,/inverse\(projectionMatrix\)/);assert.equal(s.uniforms.dinoPortalEnabled,p.uniforms.dinoPortalEnabled);
 p.active=true;assert.equal(s.uniforms.dinoPortalEnabled.value,1);p.active=false;assert.equal(s.uniforms.dinoPortalEnabled.value,0);
 p.dispose();assert.equal(m.onBeforeCompile,old);assert.equal(m.customProgramCacheKey(),'prior-hook');assert.equal(p.entries.size,0);
 const n=new T.LineBasicMaterial();p.attach(n);n.dispose();assert.equal(p.entries.size,0);
});
test('Shader main wrapping includes instanced, sprite and custom vertex results',()=>{
 for(const vertexShader of [T.ShaderLib.standard.vertexShader,T.ShaderLib.sprite.vertexShader,'void main(void){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}']){
  const s={vertexShader,fragmentShader:'void main(){gl_FragColor=vec4(1.);}',uniforms:{}};patchShader(s,{});assert.equal((s.vertexShader.match(/void main\(/g)||[]).length,1);assert.match(s.vertexShader,/dinoPortalOriginalVertex/);
 }
});
test('Render failure restores root transform, material gate, background, fog and renderer state',()=>{
 const x=Object.create(DioramaXR.prototype),root=new T.Group(),scene=new T.Scene(),color=new T.Color(0x123456);root.position.set(1,2,3);root.scale.setScalar(2);scene.add(root);scene.background=color;scene.fog=new T.Fog(0x777777,2,80);
 const camera=new T.PerspectiveCamera(),renderColor=color.clone();let alpha=1;
 const renderer={shadowMap:{enabled:true},getClearAlpha:()=>alpha,getClearColor:out=>out.copy(renderColor),setClearColor:(c,a)=>{renderColor.set(c);alpha=a;},render(){throw Error('test render failure');}};
 Object.assign(x,{active:true,actualView:'diorama-ar',sessionMode:'immersive-ar',ctx:{scene,camera,renderer,worldRoot:root,fleet:{position:v(1,2,3)}},portal:new PortalMaterials(),stage:new T.Group(),sky:{material:{color:new T.Color()}},displayMatrix:stageMatrix(v(0,1,-2),0,.05,v(1,2,3)),updateStage(){},adoptWorld(){}});
 assert.throws(()=>x.render(),/test render failure/);assert.deepEqual(root.position.toArray(),[1,2,3]);assert.equal(root.scale.x,2);assert.equal(scene.background,color);assert.ok(scene.fog);assert.equal(renderer.shadowMap.enabled,true);assert.equal(alpha,1);assert.equal(x.portal.uniforms.dinoPortalEnabled.value,0);
});
