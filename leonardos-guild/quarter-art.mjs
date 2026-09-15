/* Original Waterwheel Quarter architecture. Real shared scene geometry, no art
 * imported from reference games. Every walking floor uses quarter-data.mjs. */
import * as T from './vendor/three.module.js';
import {QUARTER_BOUNDS,QUARTER_FLOORS,QUARTER_WALLS,QUARTER_SITES,surfaceY} from './quarter-data.mjs';
import {inQuarter,quarterGround,quarterSurface} from './quarter-core.mjs';
import {createPersonRig} from './character-rig.mjs';
import {animatePerson,inspectMotion} from './character-motion.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createQuarterArt({scene,renderer,camera,rider,m}){
 const root=new T.Group();root.name='Waterwheel Quarter / authored production district';root.visible=false;scene.add(root);
 const materials={brick:new T.MeshStandardMaterial({color:'#c3a989',roughness:.92}),stone:new T.MeshStandardMaterial({color:'#8d9990',roughness:.92}),wood:new T.MeshStandardMaterial({color:'#93704d',roughness:.82}),tile:new T.MeshStandardMaterial({color:'#b76845',roughness:.85}),wet:new T.MeshStandardMaterial({color:'#6c8a7e',roughness:.7}),plaster:new T.MeshStandardMaterial({color:'#e0cfa4',roughness:.95}),dark:new T.MeshStandardMaterial({color:'#544937',roughness:.8}),metal:new T.MeshStandardMaterial({color:'#b09858',metalness:.5,roughness:.45}),dye:new T.MeshStandardMaterial({color:'#657b9c',roughness:.8}),cream:new T.MeshStandardMaterial({color:'#f2dfad',roughness:.9})};
 const unitBox=new T.BoxGeometry(1,1,1),unitCylinder=new T.CylinderGeometry(1,1,1,12);
 function box(x,y,z,w,h,d,mat='wood'){const o=new T.Mesh(unitBox,materials[mat]||mat);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 function cylinder(x,y,z,r,h,mat='wood'){const o=new T.Mesh(unitCylinder,materials[mat]||mat);o.position.set(x,y,z);o.scale.set(r,h,r);o.castShadow=true;root.add(o);return o;}
 function rod(a,b,width=.09,mat='wood'){const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A),o=new T.Mesh(unitCylinder,materials[mat]);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());o.scale.set(width,v.length(),width);root.add(o);return o;}
 function label(text,x,y,z,size=3){const c=document.createElement('canvas');c.width=768;c.height=128;const g=c.getContext('2d');g.fillStyle='#253c38';g.fillRect(0,0,768,128);g.strokeStyle='#d3b47b';g.lineWidth=5;g.strokeRect(5,5,758,118);g.fillStyle='#fff0c8';g.font='bold 32px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,64,720);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(size,size/6),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false}));o.position.set(x,y,z);root.add(o);return o;}
 const floorMeshes=new Map(),wallMeshes=new Map(),water=[];
 for(const f of QUARTER_FLOORS){
  const w=f.x2-f.x1,d=f.z2-f.z1,cx=(f.x1+f.x2)/2,cz=(f.z1+f.z2)/2,geo=new T.BoxGeometry(w,.24,d),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const z=pos.getZ(i)+cz;pos.setY(i,pos.getY(i)-.12+surfaceY(f,z));}geo.computeVertexNormals();const mesh=new T.Mesh(geo,materials[f.kind]);mesh.position.set(cx,0,cz);mesh.receiveShadow=true;root.add(mesh);floorMeshes.set(f.id,mesh);
  // Low masonry supports ground courts; raised timber floors remain open below.
  if(f.y===0&&f.endY===0)box(cx,-1.85,cz,w,3.2,d,'stone');
  if(f.y!==f.endY){const count=Math.ceil(d/.7);for(let j=1;j<count;j++){const z=f.z1+j*d/count;box(cx,surfaceY(f,z)+.015,z,w,.025,.045,'cream');}}
  else if(f.kind==='brick')for(let z=f.z1+.8;z<f.z2;z+=1.6)box(cx,f.y+.012,z,w,.024,.025,'stone');
  // Perimeter rails leave real joins unobstructed. They are visual edge cues;
  // collision is the exact disk-supported floor union, not a hidden wall.
  for(const [a,b]of [[[f.x1,f.z1],[f.x2,f.z1]],[[f.x2,f.z1],[f.x2,f.z2]],[[f.x2,f.z2],[f.x1,f.z2]],[[f.x1,f.z2],[f.x1,f.z1]]]){
   const len=Math.hypot(b[0]-a[0],b[1]-a[1]),N=Math.ceil(len/1.6),nx=(b[1]-a[1])/len,nz=-(b[0]-a[0])/len;
   for(let j=0;j<N;j++){const t=(j+.5)/N,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=surfaceY(f,z),outside=quarterSurface(x+nx*.18,z+nz*.18,y);if(outside&&Math.abs(outside.y-y)<.35)continue;if(y<.1)continue;
    box(x,y+.47,z,.065,.94,.065,'dark');const x1=a[0]+(b[0]-a[0])*j/N,z1=a[1]+(b[1]-a[1])*j/N,x2=a[0]+(b[0]-a[0])*(j+1)/N,z2=a[1]+(b[1]-a[1])*(j+1)/N;rod([x1,surfaceY(f,z1)+.83,z1],[x2,surfaceY(f,z2)+.83,z2],.04,'wood');
   }
  }
  if(f.kind==='wet'){
   const geo=new T.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);
   const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0},level:{value:-.15},zRange:{value:new T.Vector2(f.z1,f.z2)},yRange:{value:new T.Vector2(f.y,f.endY)}},vertexShader:'varying vec3 local;void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 local;uniform float clock;uniform float level;uniform vec2 zRange;uniform vec2 yRange;void main(){float worldZ=local.z+(zRange.x+zRange.y)*.5;float bed=mix(yRange.x,yRange.y,clamp((worldZ-zRange.x)/(zRange.y-zRange.x),0.,1.));if(bed>level-.02)discard;float a=sin(local.x*3.7+worldZ*2.8+clock)*sin(worldZ*5.2-clock*.8);float rip=pow(max(0.,a),8.);gl_FragColor=vec4(mix(vec3(.09,.34,.34),vec3(.52,.75,.61),rip*.7),.76);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});const mesh=new T.Mesh(geo,mat);mesh.position.set(cx,-.15,cz);root.add(mesh);water.push(mesh);
  }
 }
 for(const w of QUARTER_WALLS){const o=box(w.x,w.y+w.h/2,w.z,w.hx*2,w.h,w.hz*2,w.gate?'wood':w.id.includes('bench')?'wood':w.id==='crane'?'dark':'plaster');o.name=w.id;wallMeshes.set(w.id,o);}
 // Three household silhouettes with readable work, not repeated house modules.
 const precisionRoof=box(15.5,3.72,-7.5,13.5,.23,9.5,'tile');
 const dyeRoof=box(-23,3.4,-1.2,6,.2,6,'tile');
 box(-26.6,1.5,-.7,.2,7,6,'plaster');
 const galleryCanopy=box(3.5,7.6,14,32,.2,5,'wood');
 for(const x of[-11,5,18]){rod([x,3.2,15.8],[x,7.5,15.8],.13);rod([x,7.4,15.8],[x+2,6.4,15.8],.07);}
 box(-20,2.15,-17.1,12,4.3,1.8,'plaster');box(-20,4.42,-17.1,13,.24,3,'tile');box(-20,1.65,-16.13,2.3,3.3,.1,'dark');
 label("LEONARDO / SHARED INVENTIONS",-20,3.55,-16.03,8);
 label('MARTA / PRECISION WORK',16,2.8,-12.19,7);label('ILARIA / DYE AND FINISH',-23,2.3,-4.2,5);
 label('GOODS GALLERY / ROOF AND CELLAR CONNECTIONS',2,5.6,12,12);
 for(const x of[-17.95,-14.05])box(x,1.9,-3.8,.22,3.8,.6,'stone');box(-16,3.6,-3.8,4.2,.32,.65,'stone');rod([-16.8,3.8,-4.1],[-16.8,4.45,-4.1],.08,'metal');rod([-16.8,4.4,-4.1],[-16.25,4.4,-4.1],.06,'metal');cylinder(-16.3,4.2,-4.1,.17,.25,'metal');label('THE BELL-BRACKET ARCH',-16,2.9,-4.1,3.3);
 for(const [x,z]of [[-25,-1],[-25,-3]]){cylinder(x,.47,z,.57,.95,'wood');cylinder(x,.99,z,.52,.04,'dye');}
 for(const z of[20,22]){rod([-21,3.2,z],[-21,5.4,z],.06);rod([-15.8,3.2,z],[-15.8,5.4,z],.06);rod([-21,5.25,z],[-15.8,5.25,z],.04);for(let i=0;i<4;i++)box(-20.3+i*1.2,4.6,z,.95,1.2,.025,i%2?'cream':'dye');}
 box(-24,2.06,9.4,1.2,.14,.75,'wood');box(19.8,1.05,-8.2,1.6,.13,3.4,'wood');
 const gear=new T.Mesh(new T.TorusGeometry(.6,.07,6,20),materials.metal);gear.position.set(19.1,1.55,-8.2);root.add(gear);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod([19.1,1.55,-8.2],[19.1+Math.cos(a)*.6,1.55+Math.sin(a)*.6,-8.2],.035,'metal');}
 const wheel=new T.Group();wheel.position.set(5.6,-.4,5.4);root.add(wheel);for(let i=0;i<12;i++){const a=i*Math.PI/6,o=new T.Mesh(unitBox,materials.wood);o.position.set(0,Math.cos(a)*2.1,Math.sin(a)*2.1);o.scale.set(1,.22,.75);o.rotation.x=-a;wheel.add(o);}const rim=new T.Mesh(new T.TorusGeometry(2.1,.12,8,32),materials.dark);rim.rotation.y=Math.PI/2;wheel.add(rim);
 box(1.7,.6,-2.6,1,.13,.6,'wood');for(const x of[1.35,2.05])cylinder(x,.9,-2.6,.13,.4,'metal');label('SLUICES / WATCH THE WATERLINE',0,1.7,-1,6);
 rod([12.3,7.9,14.8],[1.8,7.9,14],.14,'dark');rod([1.8,7.9,14],[1.8,3.9,14],.045,'metal');box(1.8,3.45,14,2,.3,1.3,'wood');const parcel=box(1.8,3.85,14,.9,.55,.65,'cream');
 const marker=new T.Mesh(new T.RingGeometry(.45,.52,32),new T.MeshBasicMaterial({color:'#e7c582',side:T.DoubleSide,transparent:true,opacity:.8}));marker.rotation.x=-Math.PI/2;root.add(marker);
 const npcMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});const npcs=new Map(['marta','ilaria','neri'].map((id,i)=>{const p=createPersonRig({trim:npcMaterial},i===0?'master':'apprentice');root.add(p.root);return [id,p];}));
 const sun=new T.DirectionalLight('#ffe4ba',2.5);sun.position.set(-14,35,-8);root.add(sun);const hemi=new T.HemisphereLight('#c6dce2','#746751',2.2);root.add(hemi);
 // Batch static structural detail. Keep cutaway panels, gates and the parcel
 // independent so presentation and saved consequences remain reversible.
 const independent=new Set([...wallMeshes.values(),precisionRoof,dyeRoof,galleryCanopy,parcel,marker]);
 const groups=new Map();for(const o of [...root.children]){if(!o.isMesh||independent.has(o)||![unitBox,unitCylinder].includes(o.geometry))continue;const key=o.geometry.uuid+'/'+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
 for(const list of groups.values()){const instanced=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{o.updateMatrix();instanced.setMatrixAt(i,o.matrix);root.remove(o);});instanced.instanceMatrix.needsUpdate=true;instanced.castShadow=true;instanced.receiveShadow=true;instanced.name='Batched authored architecture';root.add(instanced);}
 let active=false,prior=new Map(),originalParent=null,background=null,fog=null,presentation='desktop',skipRender=false,lastState=null;
 function setPresentation(value){presentation=value;if(!lastState)return;const s=lastState,first=value==='first-person',diorama=value==='diorama';rider.root.visible=!first;marker.visible=!first;
  precisionRoof.visible=first||!(s.x>8&&s.x<23&&s.z>-13&&s.z<2);dyeRoof.visible=first||!(s.x<-20&&s.z<2);galleryCanopy.visible=first;
  for(const id of ['precision-front-left','precision-front-right'])wallMeshes.get(id).visible=!(diorama&&s.x>8&&s.z<1);
  floorMeshes.get('hoist-gallery').visible=first||s.quarter.groundY>-.4;
 }
 function deactivate(){if(!active)return;active=false;root.visible=false;originalParent?.add(rider.root);for(const [o,v]of prior)o.visible=v;prior.clear();scene.background=background;scene.fog=fog;rider.root.visible=true;}
 function update(s,dt,options={}){if(!inQuarter(s)){deactivate();return false;}if(!active){background=scene.background;fog=scene.fog;for(const o of scene.children)if(o!==root){prior.set(o,o.visible);o.visible=false;}originalParent=rider.root.parent;root.add(rider.root);root.visible=true;active=true;scene.background=new T.Color('#a6c7c5');scene.fog=new T.Fog('#c8d4bd',65,180);}
  lastState=s;const q=s.quarter;for(const w of QUARTER_WALLS)if(w.gate)wallMeshes.get(w.id).visible=!q[w.gate];parcel.visible=!q.parcel;wheel.rotation.x=q.goodsAccess?s.time*.24:s.time*.025;for(const mesh of water){mesh.position.y=q.waterY;mesh.material.uniforms.level.value=q.waterY;mesh.material.uniforms.clock.value=s.time;}
  for(const a of q.actors){const p=npcs.get(a.id);p.root.position.set(a.x,a.y,a.z);p.root.rotation.y=a.yaw;animatePerson(p,s.time,{motion:a.motion,ground:(x,z)=>quarterSurface(x,z,a.y)?.y??a.y});}
  rider.root.position.set(s.x,q.groundY+s.lift,s.z);rider.root.rotation.set(0,s.yaw,0);animatePerson(rider,s.time,{motion:s.lift>.04?'jump':s.doors.dodge>0?'dodge':s.resonance.aim?'aim':Math.abs(s.speed)>5?'run':'walk',level:100+Math.round(q.groundY),ground:(x,z)=>quarterGround(s,x,z)});
  const target=QUARTER_SITES.find(a=>a.id===(q.parcel?'workshop':'parcel'));marker.position.set(target.x,target.y+.05,target.z);
  const yaw=Number.isFinite(options.yaw)?options.yaw:s.yaw,anchor=new T.Vector3(s.x,q.groundY+(s.resonance.aim?1.65:1.2),s.z),dist=s.resonance.aim?2.8:6.5,eye=new T.Vector3(s.x-Math.sin(yaw)*dist,q.groundY+(s.resonance.aim?1.85:4.6),s.z-Math.cos(yaw)*dist);
  // Continuous boom trace against the same authored physical wall boxes.
  for(let f=.08;f<=1;f+=.025){const p=anchor.clone().lerp(eye,f),hit=QUARTER_WALLS.find(b=>(!b.gate||!q[b.gate])&&p.x>b.x-b.hx-.2&&p.x<b.x+b.hx+.2&&p.z>b.z-b.hz-.2&&p.z<b.z+b.hz+.2&&p.y>b.y-.1&&p.y<b.y+b.h+.15);if(hit){eye.copy(anchor.clone().lerp(eye,Math.max(.08,f-.04)));break;}}
  camera.position.copy(eye);camera.lookAt(anchor);camera.updateMatrixWorld(true);setPresentation(presentation);if(!skipRender)renderer.render(scene,camera);return true;
 }
 return {root,update,deactivate,setPresentation,setSkipRender:value=>skipRender=!!value,available:()=>active,bounds:QUARTER_BOUNDS,inspect:()=>({active,revision:'waterwheel-1',floorCount:QUARTER_FLOORS.length,actors:npcs.size,character:inspectMotion(rider),water:lastState?.quarter.waterY,physicalScene:true,presentation,skipRender})};
}
