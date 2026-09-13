import * as T from './vendor/three.module.js';
import {street,tangent,distance} from './world.mjs';
import {anchor,mesh,batchStatic,faceSurface} from './neighborhood.mjs';
import {POOL,POOL_ENTRANCE,JOBS,poolFloor,poolJob,poolTarget} from './aquatics-core.mjs';
import {makeWaterMaterial,tileMaterial} from './aquatics-shaders.mjs';

function label(text,width=512,height=128){const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');g.fillStyle='#163e46';g.fillRect(0,0,width,height);g.fillStyle='#efe6cd';g.textAlign='center';g.textBaseline='middle';g.font='500 '+Math.floor(height*.31)+'px Georgia';g.fillText(text,width/2,height/2,width*.9);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:t,side:T.DoubleSide});}
export function createAquaticEntrance(root){
 const g=anchor(root,street(-37,10));faceSurface(g,street(-37,10),tangent([-1,0,0],street(-37,10)));
 mesh(g,'box','#d9d5c2',[0,2.1,0],[8,4.2,5]);mesh(g,'box','#2c7079',[0,3.9,0],[8.4,.35,5.4]);mesh(g,'box','#85abb0',[0,1.5,2.52],[1.7,2.9,.06]);
 for(const x of[-2.7,2.7]){mesh(g,'box','#407d83',[x,2,2.52],[2.2,1.7,.07]);mesh(g,'box','#dedac6',[x,2,2.57],[.05,1.75,.04]);}
 const sign=new T.Mesh(new T.PlaneGeometry(5.6,.7),label('TIDEGLASS / AQUATIC CENTER'));sign.position.set(0,3.4,2.54);g.add(sign);
 mesh(g,'box','#c7c4b1',[0,.05,3.4],[3,.1,2.2]);const enter=new T.Mesh(new T.PlaneGeometry(1.2,.5),label('X / ENTER',256,96));enter.position.set(0,1.8,2.59);g.add(enter);batchStatic(g);
 return {update:n=>g.visible=distance(n,POOL_ENTRANCE.n)<180};
}
export function createAquaticScene(renderer){
 const scene=new T.Scene();scene.background=new T.Color('#bdced0');scene.fog=new T.Fog('#c4d3cf',45,95);
 const camera=new T.PerspectiveCamera(64,1,.05,120),mirror=new T.PerspectiveCamera(),room=new T.Group();scene.add(room);
 const hemi=new T.HemisphereLight('#e7f6fc','#b0b08a',2.1);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff1d0',3.1);sun.position.set(-12,22,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:25,bottom:-25,near:1,far:65});sun.shadow.normalBias=.035;scene.add(sun,sun.target);
 const fill=new T.DirectionalLight('#6fc5d9',.8);fill.position.set(10,6,-20);scene.add(fill);
 const tile=tileMaterial('#d0e1d5'),deck=tileMaterial('#ded5bb',{caustics:false}),wall=tileMaterial('#dce1d3',{caustics:false});
 function rect(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 const stone=new T.MeshStandardMaterial({color:'#e6dfcb',roughness:.76}),teal=new T.MeshStandardMaterial({color:'#387e86',roughness:.4}),steel=new T.MeshStandardMaterial({color:'#bdcdcf',roughness:.23,metalness:.75}),dark=new T.MeshStandardMaterial({color:'#203d43',roughness:.85}),warm=new T.MeshStandardMaterial({color:'#bb8f5a',roughness:.72});
 const verts=[],indices=[];for(let k=0;k<=16;k++){const z=-16+k*2;verts.push(-8,poolFloor(z),z,8,poolFloor(z),z);if(k<16){const a=k*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
 const floorG=new T.BufferGeometry();floorG.setAttribute('position',new T.Float32BufferAttribute(verts,3));floorG.setIndex(indices);floorG.computeVertexNormals();const floor=new T.Mesh(floorG,tile);floor.receiveShadow=true;room.add(floor);
 for(const x of[-8.05,8.05])rect(room,x,-2.15,0,.1,5,32,tile);
 rect(room,0,-2.25,-16.05,16,4.9,.1,tile);rect(room,0,-.72,16.05,16,2.1,.1,tile);
 for(const x of[-10,10])rect(room,x,.2,0,4,.3,44,deck);for(const z of[-19,19])rect(room,0,.2,z,16,.3,6,deck);
 for(const x of[-8.12,8.12])rect(room,x,.3,0,.4,.2,32.5,stone);for(const z of[-16.12,16.12])rect(room,0,.3,z,16.5,.2,.4,stone);
 for(const x of[-8,8])rect(room,x,-.22,0,.012,.23,32,teal);
 for(const x of[-4,0,4]){const pos=[];for(let k=0;k<=16;k++){const z=-15+k*1.875;pos.push(x-.045,poolFloor(z)+.014,z,x+.045,poolFloor(z)+.014,z);}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pos,3));gg.setIndex(indices);gg.computeVertexNormals();room.add(new T.Mesh(gg,teal));}
 const fixtures=new T.Group();room.add(fixtures);
 for(const x of[-12.1,12.1]){rect(room,x,1.5,0,.3,2.8,44,wall);rect(room,x,6.65,0,.3,2.2,44,stone);for(let z=-20;z<=20;z+=5){rect(fixtures,x,4.15,z,.45,5,.45,stone);rect(room,x,4.4,z+2.2,.07,2.7,3.6,new T.MeshBasicMaterial({color:'#a8cbd0'}));}}
 for(const z of[-22,22]){rect(room,0,3.3,z,24.5,6.3,.25,wall);rect(fixtures,0,5.5,z-.17,19,.09,.07,teal);}
 for(let z=-19;z<=20;z+=6.3){const pts=[];for(let i=0;i<=24;i++){const x=-12+i;pts.push(new T.Vector3(x,6.8+1.5*Math.sin(i/24*Math.PI),z));}const rib=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.12,6,false),stone);fixtures.add(rib);}
 rect(room,0,8.55,0,25,.18,44,new T.MeshStandardMaterial({color:'#c7dedd',roughness:.5,side:T.DoubleSide}));
 for(const x of[-7.5,7.5])rect(fixtures,x,7.9,0,.15,.17,44,teal);
 function tube(points,r=.045,material=steel){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,7,false);const m=new T.Mesh(g,material);fixtures.add(m);return m;}
 for(const z of[14,-14]){for(const off of[-.45,.45])tube([[8.8,.4,z+off],[8.6,1.2,z+off],[7.7,1.18,z+off],[7.45,-1.4,z+off]]);for(let k=0;k<4;k++)rect(fixtures,7.5,-1.2+k*.48,z,.09,.06,.92,steel);}
 const glow=new T.MeshStandardMaterial({color:'#dcffff',emissive:'#50b6c9',emissiveIntensity:.5,roughness:.3});
 for(const x of[-7.97,7.97])for(const z of[-12,-4,4,12])rect(fixtures,x,-1,z,.03,.13,.55,glow);
 for(const x of[-10.4,10.4])for(const z of[-10,0,9]){rect(fixtures,x,.85,z,1.2,.13,3.5,warm);for(const dz of[-1.3,1.3])rect(fixtures,x,.52,z+dz,.9,.64,.12,dark);}
 rect(fixtures,10.5,1.3,18.5,2.8,1.9,.6,teal);rect(fixtures,10.5,2.34,18.5,3,.1,.8,stone);
 const lockerSign=new T.Mesh(new T.PlaneGeometry(2.8,.48),label('CITY EXIT / X'));lockerSign.position.set(10.5,2.8,18.5);room.add(lockerSign);
 const board=new T.Mesh(new T.PlaneGeometry(12,1.5),label('TIDEGLASS  /  COMMUNITY AQUATICS',1024,128));board.position.set(0,4.2,-21.8);room.add(board);
 for(const [x,text]of[[-5,'DEEP / 4.7 m'],[5,'FREE SWIM / ALL WELCOME']]){const sign=new T.Mesh(new T.PlaneGeometry(5,.55),label(text,512,80));sign.position.set(x,2.7,-21.8);room.add(sign);}
 const collectSign=new T.Mesh(new T.PlaneGeometry(2.3,.65),label('LOST & FOUND'));collectSign.position.set(10.2,1.7,13);collectSign.rotation.y=-Math.PI/2;room.add(collectSign);
 batchStatic(fixtures);
 const waterGeo=new T.PlaneGeometry(16,32,40,64);waterGeo.rotateX(-Math.PI/2);const waterMat=makeWaterMaterial(),water=new T.Mesh(waterGeo,waterMat);water.renderOrder=3;room.add(water);
 const actor=new T.Group();scene.add(actor);const limbs=[];function part(kind,color,pos,size,parent=actor){return mesh(parent,kind,color,pos,size);}
 part('round','#337d87',[0,0,0],[.25,.36,.18]);part('round','#c49272',[0,.53,0],[.18,.21,.18]);part('round','#39717b',[0,.66,0],[.19,.12,.19]);part('box','#213d47',[0,.55,-.167],[.29,.073,.035]);
 for(const side of[-1,1]){const arm=new T.Group();arm.position.set(side*.27,.27,0);actor.add(arm);part('round','#bd8f73',[0,-.25,0],[.067,.3,.07],arm);const leg=new T.Group();leg.position.set(side*.12,-.31,0);actor.add(leg);part('round','#316773',[0,-.28,0],[.084,.33,.09],leg);part('round','#b58c75',[0,-.57,-.08],[.08,.095,.17],leg);limbs.push({arm,leg,side});}
 const propRoot=new T.Group();scene.add(propRoot);const markerMat=new T.MeshStandardMaterial({color:'#ffd477',emissive:'#9a6518',emissiveIntensity:.3,roughness:.4});const ringG=new T.TorusGeometry(1.05,.075,8,40),rings=[];
 for(let i=0;i<7;i++){const g=new T.Group(),ring=new T.Mesh(ringG,markerMat);g.add(ring);propRoot.add(g);rings.push(g);}
 const keeps=JOBS[1].nodes.map((p,i)=>{const g=new T.Group();g.position.set(...p);propRoot.add(g);part('box',['#de995e','#d8c18a','#a9c1bb','#79b9ca'][i],[0,0,0],[.43,.28,.28],g);part('round','#e9d28d',[0,.2,0],[.12,.12,.06],g);return g;});
 const valves=JOBS[2].nodes.map((p,i)=>{const g=new T.Group();g.position.set(...p);g.rotation.y=p[0]<0?Math.PI/2:-Math.PI/2;propRoot.add(g);part('cylinder','#697e83',[0,0,-.13],[.12,.85,.12],g);const wheel=new T.Mesh(new T.TorusGeometry(.38,.06,8,24),teal);g.add(wheel);for(const angle of[0,Math.PI/2]){const bar=rect(g,0,0,0,.70,.05,.04,steel);bar.rotation.z=angle;}return g;});
 const beacon=new T.Mesh(new T.OctahedronGeometry(.15),markerMat);scene.add(beacon);
 let refraction=null,reflection=null,lastProfile='',active=false,captures=0,lastUnder=false;const mirrorMatrix=new T.Matrix4(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),forward=new T.Vector3(),aim=new T.Vector3(),eye=new T.Vector3(),clipPlane=new T.Plane(new T.Vector3(0,1,0),.02);
 function release(){refraction?.dispose();reflection?.dispose();refraction=reflection=null;lastProfile='';waterMat.uniforms.uRefraction.value=null;waterMat.uniforms.uReflection.value=null;active=false;}
 function targets(low,width,height){const enabled=!low;const key=enabled?`${Math.min(768,width)}:${Math.min(512,height)}`:'low';if(key===lastProfile)return;release();lastProfile=key;if(enabled){const w=Math.min(768,width),h=Math.max(1,Math.round(w*height/Math.max(1,width)));refraction=new T.WebGLRenderTarget(w,Math.min(512,h),{depthBuffer:true,stencilBuffer:false});reflection=new T.WebGLRenderTarget(384,384,{depthBuffer:true,stencilBuffer:false});waterMat.uniforms.uRefraction.value=refraction.texture;waterMat.uniforms.uReflection.value=reflection.texture;}active=true;}
 function render(dt,s,{low=false,quiet=false,simple=false}={}){
  const q=s.aquatics,dimensions=renderer.getDrawingBufferSize(new T.Vector2());targets(low||simple,dimensions.x,dimensions.y);camera.aspect=dimensions.x/dimensions.y;camera.fov=q.view==='first'?72:62;camera.updateProjectionMatrix();
  const p=q.p.map((v,i)=>q.previous[i]+(v-q.previous[i])*(s.poolAlpha??1));const origin=new T.Vector3(...p);forward.set(Math.sin(q.yaw),-q.pitch,-Math.cos(q.yaw)).normalize();
  if(q.view==='first'){camera.position.copy(origin).add(new T.Vector3(0,q.swimming?.42:1.6,0));aim.copy(camera.position).add(forward);actor.visible=false;}else{aim.copy(origin).add(new T.Vector3(0,q.swimming?.35:1.0,0));camera.position.copy(aim).addScaledVector(forward,-(q.swimming?3.6:5)).add(new T.Vector3(0,q.swimming?1.1:1.9,0));actor.visible=true;}
  camera.position.x=T.MathUtils.clamp(camera.position.x,-11.9,11.9);camera.position.z=T.MathUtils.clamp(camera.position.z,-21.6,21.6);camera.position.y=Math.max(poolFloor(camera.position.z)+.28,Math.min(7.8,camera.position.y));camera.up.set(0,1,0);camera.lookAt(aim);camera.updateMatrixWorld();lastUnder=camera.position.y<-.08;
  scene.fog.color.set(lastUnder?'#2c7e83':'#c4d3cf');scene.fog.near=lastUnder?1:45;scene.fog.far=lastUnder?22:95;scene.background.set(lastUnder?'#347d82':'#bdced0');
  actor.position.copy(origin);actor.position.y+=q.swimming?.05:.88;actor.rotation.set(q.swimming?-Math.PI/2:0,-q.yaw,0,'YXZ');for(const {arm,leg,side}of limbs){arm.rotation.z=side*(q.swimming?1.7+Math.sin(q.clock*3+side)*.45:.07);arm.rotation.x=q.swimming?.3:Math.sin(q.clock*7+side*Math.PI)*Math.min(.4,q.speed*.12);leg.rotation.x=Math.sin(q.clock*(q.swimming?5:7)+side*Math.PI)*Math.min(.34,q.speed*.1);}
  const job=poolJob(s),index=q.active?.index||0;for(let i=0;i<rings.length;i++){rings[i].visible=job?.type==='circuit'&&i>=index;if(rings[i].visible){rings[i].position.set(...job.nodes[i]);rings[i].scale.setScalar(i===index?1:.85);}}
  keeps.forEach((g,i)=>{g.visible=job?.type==='salvage'&&i>=index;g.rotation.y=quiet?i:q.clock*.35+i;});valves.forEach((g,i)=>{g.visible=true;g.children[1].rotation.z=i<index?Math.PI/2:0;});const t=poolTarget(s);beacon.visible=!!t&&t.kind!=='circuit';if(t){beacon.position.set(...t.p);beacon.position.y+=.65+(quiet?0:Math.sin(q.clock*2)*.08);}
  for(const mat of[tile,deck,wall]){mat.userData.poolTime.value=quiet?0:q.clock;mat.userData.causticStrength.value=low?.45:1;}
  const u=waterMat.uniforms;u.uTime.value=quiet?0:q.clock;u.uRippleStrength.value=quiet?.3:1;u.uAdvanced.value=refraction?1:0;u.uUnder.value=lastUnder?1:0;
  for(let i=0;i<12;i++){const r=!quiet&&q.splashes[i];u.uRipples.value[i].set(...(r||[0,0,-100,0]));}
  const oldTarget=renderer.getRenderTarget(),oldExposure=renderer.toneMappingExposure,oldClips=renderer.clippingPlanes,autoShadow=renderer.shadowMap.autoUpdate;renderer.toneMappingExposure=1.05;renderer.info.reset();
  try{
   if(refraction){water.visible=false;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(refraction);renderer.render(scene,camera);captures++;
    mirror.copy(camera);mirror.position.y=-camera.position.y;eye.copy(aim);eye.y=-eye.y;mirror.up.set(0,-1,0);mirror.lookAt(eye);mirror.updateMatrixWorld();mirrorMatrix.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);u.uMirrorMatrix.value.copy(mirrorMatrix);
    renderer.clippingPlanes=[clipPlane];renderer.setRenderTarget(reflection);renderer.render(scene,mirror);captures++;renderer.clippingPlanes=oldClips;water.visible=true;
   }
   renderer.shadowMap.autoUpdate=autoShadow;renderer.setRenderTarget(oldTarget);renderer.render(scene,camera);
  }finally{water.visible=true;renderer.clippingPlanes=oldClips;renderer.shadowMap.autoUpdate=autoShadow;renderer.setRenderTarget(oldTarget);renderer.toneMappingExposure=oldExposure;}
 }
 return {render,release,restored(){release();waterMat.needsUpdate=true;tile.needsUpdate=true;},inspect:()=>({active,underwater:lastUnder,shaderTime:waterMat.uniforms.uTime.value,rippleStrength:waterMat.uniforms.uRippleStrength.value,renderTargets:refraction?2:0,refractionSize:refraction?[refraction.width,refraction.height]:null,reflectionSize:reflection?[reflection.width,reflection.height]:null,extraPasses:refraction?2:0,captures,caustics:'Procedural approximation on real tiled geometry',reflection:'Local planar scene capture; no ray tracing',capacity:12,camera:camera.position.toArray()}),dispose(){release();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:o.material?[o.material]:[]))materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}}};
}
