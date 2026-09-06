/* Original procedural sky-city assets. No imported franchise models or art. */
import * as T from './vendor/three.module.js';
import {DISTRICTS,BRIDGES,RAILS,RELAYS,RECORDS,BUILDINGS,EXTRACTION,pointOnRail,forward} from './model.mjs';
import {combatScene} from './combat-scene.mjs';
export {T};
const palette={stone:'#efe2c2',pale:'#faf0d5',edge:'#ac9170',metal:'#284b53',gold:'#c9984c',teal:'#417b80',roof:'#578d90',red:'#b8674e',dark:'#213b49',grass:'#839e57',glass:'#75bbbc'};
export function makeView(canvas,quality='balanced'){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='low'?1:1.5));renderer.shadowMap.enabled=quality!=='low';renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const scene=new T.Scene();scene.fog=new T.Fog('#bbdce1',140,530);const camera=new T.PerspectiveCamera(75,1,.06,1100);camera.rotation.order='YXZ';
 const hemi=new T.HemisphereLight('#e2f6ff','#819591',1.6);scene.add(hemi);const sun=new T.DirectionalLight('#fff0cb',3.2);sun.position.set(-60,120,50);sun.target.position.set(15,6,-60);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-145,right:145,top:125,bottom:-140,near:.5,far:360});sun.shadow.bias=-.00025;sun.shadow.normalBias=.14;scene.add(sun,sun.target);
 const sky=new T.Mesh(new T.SphereGeometry(850,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#598fae')},bottom:{value:new T.Color('#f4e6c6')}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 p;void main(){float t=clamp(normalize(p).y*.72+.24,0.,1.);gl_FragColor=vec4(mix(bottom,top,t),1.);}'}));scene.add(sky);
 const geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,14,10),rock:new T.DodecahedronGeometry(1,0),cylinder:new T.CylinderGeometry(1,1,1,16),cone:new T.ConeGeometry(1,1,8),torus:new T.TorusGeometry(1,.1,6,24)};
 const buckets=new Map(),materials=new Map();const material=(color,kind='paint')=>{const k=color+kind;if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness:kind==='metal'?.36:.83,metalness:kind==='metal'?.65:0,emissive:kind==='glow'?color:'#000000',emissiveIntensity:kind==='glow'?1:0}));return materials.get(k);};
 const matrix=new T.Matrix4(),quat=new T.Quaternion();
 function part(shape,x,y,z,sx,sy,sz,color,rz=0,ry=0,kind='paint'){
  const k=shape+color+kind;if(!buckets.has(k))buckets.set(k,{g:geometries[shape],m:material(color,kind),items:[]});quat.setFromEuler(new T.Euler(0,ry,rz));matrix.compose(new T.Vector3(x,y,z),quat,new T.Vector3(sx,sy,sz));buckets.get(k).items.push(matrix.clone());
 }
 const box=(x,y,z,w,h,d,c,ry=0,kind)=>part('box',x,y,z,w,h,d,c,0,ry,kind);
 function beam(a,b,r,color){const mid=new T.Vector3().addVectors(a,b).multiplyScalar(.5),dir=new T.Vector3().subVectors(b,a),len=dir.length(),key='beam'+color;if(!buckets.has(key))buckets.set(key,{g:geometries.cylinder,m:material(color,'metal'),items:[]});quat.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());matrix.compose(mid,quat,new T.Vector3(r,len,r));buckets.get(key).items.push(matrix.clone());}
 function label(text,x,y,z,w=8,h=3,bg='#244f5b',fg='#ffebbb',rotation=0){const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.strokeStyle=fg;g.lineWidth=4;g.strokeRect(10,10,c.width-20,c.height-20);g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n'),fs=Math.min(85,c.height/(lines.length+1));g.font='600 '+fs+'px Georgia';g.fillStyle=fg;lines.forEach((line,i)=>g.fillText(line,384,c.height/2+(i-(lines.length-1)/2)*fs*1.16,695));const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.8,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);return mesh;}
 const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 // Patterned stone plaza slabs are texture geometry, not a screenshot background.
 const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=256;const tc=texCanvas.getContext('2d');tc.fillStyle='#e5d8b9';tc.fillRect(0,0,256,256);for(let i=0;i<600;i++){tc.fillStyle=i%2?'#ffffff12':'#66523d0b';tc.fillRect(rand(i)*256,rand(i+8)*256,1+rand(i+3)*4,1);}tc.strokeStyle='#ad9e8255';tc.lineWidth=2;for(let i=0;i<=256;i+=64){tc.beginPath();tc.moveTo(i,0);tc.lineTo(i,256);tc.moveTo(0,i);tc.lineTo(256,i);tc.stroke();}const paving=new T.CanvasTexture(texCanvas);paving.wrapS=paving.wrapT=T.RepeatWrapping;paving.repeat.set(4,4);paving.colorSpace=T.SRGBColorSpace;
 const decks=[];
 for(let n=0;n<DISTRICTS.length;n++){
  const d=DISTRICTS[n];const floor=new T.Mesh(new T.BoxGeometry(d.w,.9,d.d),new T.MeshStandardMaterial({map:paving,color:({harbor:'#fff0ce',park:'#dae9d7',garden:'#c8e0c9',foundry:'#b5a4a0',spire:'#becfdf'})[d.theme],roughness:.94}));floor.position.set(d.x,d.y-.45,d.z);floor.receiveShadow=true;floor.castShadow=true;scene.add(floor);decks.push(floor);
  box(d.x,d.y-1.3,d.z,d.w+1,.65,d.d+1,palette.gold);box(d.x,d.y-2.2,d.z,d.w-1,1.2,d.d-1,palette.stone);
  part('rock',d.x,d.y-9,d.z,d.w*.58,11,d.d*.52,'#789297',0,n*.7);part('rock',d.x+3,d.y-12,d.z-3,d.w*.36,13,d.d*.34,'#a0ac9c',.12,n*.4);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,x=d.x+Math.cos(a)*d.w*.4,z=d.z+Math.sin(a)*d.d*.41;part('rock',x,d.y-5-rand(i+n)*5,z,3+rand(i)*4,7,4,i%2?'#9daba0':'#b4bda7',.2,n+i);}
  part('cylinder',d.x,d.y-6,d.z,6,3,6,palette.metal,0,0,'metal');part('torus',d.x,d.y-7.6,d.z,7,7,7,palette.gold,Math.PI/2,0,'metal');
  for(const a of[-1,1])for(const b of[-1,1]){const x=d.x+a*(d.w/2-1.3),z=d.z+b*(d.d/2-1.3);box(x,d.y+.27,z,2.8,.5,2.8,palette.stone);part('cylinder',x,d.y+2,z,.16,3.8,.16,palette.metal);box(x,d.y+4,z,.9,1.1,.9,palette.gold);part('sphere',x,d.y+4,z,.32,.4,.32,'#fff0ae',0,0,'glow');}
  // Corner balustrades leave the central bridge/rail boarding approaches open.
  for(const side of[-1,1])for(const corner of[-1,1])for(let j=0;j<4;j++){const x=d.x+side*(d.w/2-.6),z=d.z+corner*(d.d/2-1-j*1.5);box(x,d.y+.6,z,.28,1.2,.28,palette.stone);box(x,d.y+1.15,z,.42,.18,1.6,palette.gold);}
  for(let i=0;i<6;i++){const x=d.x+(i%2?1:-1)*(d.w*.4),z=d.z+(i/6-.5)*d.d*.65;box(x,d.y+.22,z,2.8,.5,2.8,palette.metal);box(x,d.y+.5,z,2.6,.15,2.6,'#718b49');part('cylinder',x,d.y+1.65,z,.16,2.4,.16,'#7c6850');for(let j=0;j<3;j++)part('sphere',x+(j-1)*.6,d.y+3.2+(.4*(j%2)),z,1.25,1.55,1.2,['#738f53','#8b9b58','#6b9c82'][n%3]);}
  if(d.theme==='park'){part('cylinder',d.x,d.y+.35,d.z,4,.7,4,palette.stone);part('cylinder',d.x,d.y+.75,d.z,3.5,.13,3.5,'#67babc');part('cylinder',d.x,d.y+1.4,d.z,.45,1.1,.45,palette.gold);part('sphere',d.x,d.y+2.1,d.z,.8,.8,.8,palette.gold,0,0,'metal');}
 }
 for(const d of BUILDINGS){
  box(d.x,d.y+d.h/2,d.z,d.w,d.h,d.d,d.id==='enginehall'?'#895f4f':d.id==='works-house'?'#b37559':d.id==='spire-tower'?'#939ebb':d.id==='observatory'?'#6e89a2':d.id==='greenhouse'?'#bedacf':palette.stone);box(d.x,d.y+.6,d.z,d.w+.4,1.2,d.d+.4,palette.edge);
  box(d.x,d.y+d.h+.35,d.z,d.w+1,.7,d.d+1,palette.pale);box(d.x,d.y+d.h-.7,d.z,d.w+.3,.35,d.d+.3,palette.gold);
  part('cone',d.x,d.y+d.h+2.2,d.z,d.w*.8,4,d.d*.8,d.id.includes('works')||d.id==='enginehall'?palette.red:palette.roof,0,Math.PI/4);
  for(let floor=0;floor<Math.floor(d.h/3);floor++)for(let col=-1;col<=1;col++){
   const y=d.y+2+floor*2.7,x=d.x+col*d.w*.29;box(x,y,d.z+d.d/2+.035,1.32,1.85,.16,palette.edge);box(x,y+.1,d.z+d.d/2+.14,1.06,1.4,.04,palette.glass);box(x,y+.1,d.z+d.d/2+.17,.075,1.4,.06,palette.gold);
   for(const side of[-1,1]){const z=d.z+col*d.d*.29;box(d.x+side*(d.w/2+.05),y,z,.16,1.8,1.3,palette.edge);box(d.x+side*(d.w/2+.15),y+.1,z,.04,1.4,1.05,palette.glass);}
  }
  for(const side of[-1,1])box(d.x+side*(d.w/2-.22),d.y+d.h/2,d.z+d.d/2+.22,.5,d.h,.5,palette.pale);
  if(d.id==='spire-tower'){for(let i=0;i<4;i++){const y=d.y+d.h+4+i*1.4;part('torus',d.x,y,d.z,3-i*.55,3-i*.55,3-i*.55,palette.gold,Math.PI/2,0,'metal');}part('cylinder',d.x,d.y+d.h+11,d.z,.15,17,.15,palette.gold);part('sphere',d.x,d.y+d.h+18,d.z,.75,.75,.75,'#b9ffe3',0,0,'glow');}
  if(d.id==='enginehall')for(const offset of[-3,3]){part('cylinder',d.x+offset,d.y+d.h+5,d.z-2,.55,11,.55,palette.metal,0,0,'metal');part('torus',d.x+offset,d.y+d.h+9,d.z-2,.7,.7,.7,palette.gold,Math.PI/2);}
 }
 for(const b of BRIDGES){const a=new T.Vector3(...b.a),end=new T.Vector3(...b.b),len=a.distanceTo(end),dx=end.x-a.x,dz=end.z-a.z,horizontal=Math.hypot(dx,dz),side=new T.Vector3(-dz/horizontal,0,dx/horizontal);const up=new T.Vector3().crossVectors(new T.Vector3().subVectors(end,a).normalize(),side).normalize();
  const geo=new T.BufferGeometry(),verts=[],idx=[];for(const p of[a,end])for(const s of[-1,1]){const q=p.clone().addScaledVector(side,s*b.width/2);verts.push(q.x,q.y-.02,q.z);}geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:'#d9ccad',roughness:.9,side:T.DoubleSide}));m.receiveShadow=true;scene.add(m);
  for(const sign of[-1,1]){const aa=a.clone().addScaledVector(side,sign*(b.width/2+.1)),bb=end.clone().addScaledVector(side,sign*(b.width/2+.1));aa.y+=1.05;bb.y+=1.05;beam(aa,bb,.075,palette.gold);for(let i=0;i<=len;i+=3){const p=a.clone().lerp(end,i/len).addScaledVector(side,sign*(b.width/2+.1));beam(p,p.clone().add(new T.Vector3(0,1.05,0)),.055,palette.metal);}}
  for(let i=0;i<len;i+=2){const p=a.clone().lerp(end,i/len);beam(p.clone().addScaledVector(side,-b.width/2),p.clone().addScaledVector(side,b.width/2),.04,palette.edge);}
 }
 const railMat=new T.MeshStandardMaterial({color:'#c8a15f',metalness:.8,roughness:.3}),railLight=new T.MeshBasicMaterial({color:'#75ddd2'});const railMeshes=[];
 class RailCurve extends T.Curve{constructor(r,offset=0){super();this.r=r;this.offset=offset;}getPoint(t,target=new T.Vector3()){const p=pointOnRail(this.r,t*this.r.length),v=p.tangent,l=Math.hypot(v.x,v.z)||1;return target.set(p.x+v.z/l*this.offset,p.y,p.z-v.x/l*this.offset);}}
 for(const r of RAILS){for(const offset of[-.16,.16]){const mesh=new T.Mesh(new T.TubeGeometry(new RailCurve(r,offset),Math.ceil(r.length*1.3),.095,7,false),railMat);mesh.castShadow=false;mesh.name=r.id;scene.add(mesh);railMeshes.push(mesh);}const glow=new T.Mesh(new T.TubeGeometry(new RailCurve(r),Math.ceil(r.length),.027,5,false),railLight);scene.add(glow);
  for(let s=0;s<=r.length;s+=4){const p=pointOnRail(r,s);box(p.x,p.y-.025,p.z,.7,.11,.13,palette.metal,Math.atan2(p.tangent.x,p.tangent.z),'metal');}
  for(const s of[0,r.length]){const p=pointOnRail(r,s);part('cylinder',p.x,p.y-1.4,p.z,.12,2.8,.12,palette.gold);part('torus',p.x,p.y+.12,p.z,.58,.58,.58,palette.gold,0,0,'metal');label((s===0?r.to:r.from).toUpperCase()+'\nE  /  SKY CLAMP',p.x,p.y-1.15,p.z+.2,3.4,1.15);}
 }
 // Civic signage, original visual language, readable at street level.
 label('AETHER REACH\nPUBLIC FREIGHT AUTHORITY',-10,7.8,13.56,7,2.6);
 label('A CITY IS A PROMISE.\nKEEP IT.',11,6,-8.94,5.8,2.4,'#b5674e');
 label('GLASSHOUSE\nGARDENS',74,13,-29.9,7,2.6);
 label('COPPERLIGHT\nWORKS',-35,20,-81.9,8,3,'#89654e');
 label('THE MERIDIAN\nLISTEN. THEN SPEAK.',44,33,-127.85,9,3.2);
 label('SIGNAL TERMINAL\nRETURN WHEN THE RELAYS ARE LIT',0,2.9,9.5,6,1.8);
 const relays=new Map(),notes=new Map(),bots=new Map();
 function movingPart(shape,mat,pos,scale,parent){const m=new T.Mesh(geometries[shape],mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
 for(const d of RELAYS){const group=new T.Group();group.position.set(d.x,d.y,d.z);scene.add(group);movingPart('cylinder',material(palette.dark,'metal'),[0,.6,0],[.65,1.2,.65],group);movingPart('box',material(palette.stone),[0,1.4,0],[1.4,1.1,1.1],group);const orb=movingPart('sphere',new T.MeshStandardMaterial({color:'#ffd280',emissive:'#ffac42',emissiveIntensity:.7,metalness:.35,roughness:.2}),[0,2.25,0],[.5,.5,.5],group);const ring=movingPart('torus',railMat,[0,2.25,0],[.86,.86,.86],group);relays.set(d.id,{group,orb,ring});label('RESTORE\nRELAY',d.x,d.y+1.4,d.z+.57,1.25,.8);}
 for(const d of RECORDS){const group=new T.Group();group.position.set(d.x,d.y+.9,d.z);scene.add(group);movingPart('box',material(palette.gold,'metal'),[0,-.35,0],[.55,.7,.55],group);const tablet=movingPart('box',new T.MeshStandardMaterial({color:'#afd7bf',emissive:'#68aabc',emissiveIntensity:.35}),[0,.3,0],[.65,.8,.12],group);notes.set(d.id,{group,tablet});}
 const terminal=new T.Group();terminal.position.set(EXTRACTION.x,0,EXTRACTION.z);scene.add(terminal);movingPart('box',material(palette.metal,'metal'),[0,.6,0],[1.5,1.2,1],terminal);const terminalLight=movingPart('sphere',new T.MeshStandardMaterial({color:'#72bdc5',emissive:'#335e6c',emissiveIntensity:.5}),[0,1.5,0],[.3,.3,.3],terminal);
 // Distant districts and airships add depth without adding fake playable rails.
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,x=20+Math.cos(a)*(170+rand(i)*170),z=-65+Math.sin(a)*(165+rand(i+20)*140),y=rand(i+10)*45-10,r=18+rand(i+3)*23;part('rock',x,y-11,z,r,16,r*.7,'#93b6b4',0,i);part('cylinder',x,y,z,r,.8,r*.74,palette.stone);for(let j=0;j<6;j++){const xx=x+(j%3-1)*r*.5,zz=z+(Math.floor(j/3)-.5)*r*.65,h=10+rand(i*12+j)*38;box(xx,y+h/2,zz,5,h,6,i%3===0?'#b5c7bd':'#cfdfd0');part('cone',xx,y+h+3,zz,5,6,5,palette.roof,0,Math.PI/4);}}
 for(const [x,y,z]of [[-90,65,-130],[140,75,-170],[-180,50,40]]){part('sphere',x,y,z,23,6,6,'#e7dec5');box(x,y-8,z,10,3,4,palette.teal);part('cone',x-23,y,z,4,9,4,palette.gold,Math.PI/2);box(x+18,y+5,z,9,4,.4,palette.teal,.2);label('AETHER POST',x,y,z+6.05,23,3,'#ddd6b6','#3a646b');}
 // Soft generated cloud sprites; move gently underneath the physical islands.
 const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=256;const cc=cloudCanvas.getContext('2d');for(let i=0;i<28;i++){const x=65+rand(i)*370,y=160-Math.sin((x-65)/370*Math.PI)*60+rand(i+7)*30,r=30+rand(i+19)*50,grad=cc.createRadialGradient(x-r*.15,y-r*.25,r*.1,x,y,r);grad.addColorStop(0,'#fffffff9');grad.addColorStop(.7,'#ffffffed');grad.addColorStop(1,'#ffffff00');cc.fillStyle=grad;cc.fillRect(x-r,y-r,r*2,r*2);}const cloudTex=new T.CanvasTexture(cloudCanvas);cloudTex.colorSpace=T.SRGBColorSpace;const clouds=[];
 for(let i=0;i<60;i++){const m=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color:i%3?'#f8ffff':'#dfedf1',transparent:true,depthWrite:false,opacity:.83}));const x=(rand(i+120)-.5)*850,z=(rand(i+320)-.5)*850-70,y=-24-rand(i+79)*60;m.position.set(x,y,z);const w=40+rand(i)*110;m.scale.set(w,w*.5,1);scene.add(m);clouds.push(m);}
 // Flags, bridge ornaments and moving turbine blades.
 const flags=[],turbines=[];
 for(const d of DISTRICTS){const x=d.x-d.w*.4,z=d.z-d.d*.35;part('cylinder',x,d.y+5,z,.065,10,.065,palette.gold);const flag=new T.Mesh(new T.PlaneGeometry(3,1.8,8,2),new T.MeshStandardMaterial({color:d.theme==='foundry'?palette.red:'#467c88',side:T.DoubleSide,roughness:1}));flag.position.set(x+1.5,d.y+8,z);scene.add(flag);flags.push(flag);
  const hub=new T.Group();hub.position.set(d.x,d.y-8.4,d.z);hub.rotation.x=Math.PI/2;scene.add(hub);for(let i=0;i<5;i++){const blade=new T.Mesh(new T.BoxGeometry(4,.65,.1),material(palette.gold,'metal'));const a=i/5*Math.PI*2;blade.rotation.z=a;blade.position.set(Math.cos(a)*2.6,Math.sin(a)*2.6,0);hub.add(blade);}turbines.push(hub);
 }
 const combatArt=combatScene(T,{scene,camera,part,box,label,material,movingPart});
 for(const bucket of buckets.values()){const mesh=new T.InstancedMesh(bucket.g,bucket.m,bucket.items.length);bucket.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);}
 const hand=new T.Group(),hook=new T.Group();camera.add(hand,hook);scene.add(camera);
 const handMetal=material('#997441','metal'),glove=material('#2b4248'),skin=material('#dfb881');
 movingPart('box',glove,[.38,-.44,-.75],[.21,.22,.45],hand);movingPart('box',handMetal,[.39,-.33,-.95],[.21,.22,.65],hand);movingPart('cylinder',handMetal,[.39,-.23,-1.04],[.065,.45,.065],hand).rotation.x=Math.PI/2;
 for(let i=0;i<5;i++)movingPart('torus',material('#72bab5','metal'),[.39,-.26,-.84-i*.085],[.095,.095,.095],hand);
 movingPart('box',material('#eee1bb'),[.39,-.18,-.76],[.08,.08,.06],hand);movingPart('sphere',material('#90ffe2','glow'),[.39,-.26,-1.17],[.048,.048,.05],hand);
 movingPart('box',glove,[-.38,-.35,-.64],[.23,.19,.4],hook);movingPart('torus',handMetal,[-.37,-.22,-.86],[.18,.2,.18],hook);movingPart('box',handMetal,[-.37,-.05,-.88],[.09,.24,.07],hook);movingPart('sphere',material('#85d5cb','glow'),[-.36,-.19,-.76],[.04,.04,.04],hook);
 const sparks=[];let lastShot=-1;const projectileGeo=new T.SphereGeometry(.1,6,4),enemyMat=new T.MeshBasicMaterial({color:'#ff7b5b'});const bulletMeshes=Array.from({length:32},()=>{const m=new T.Mesh(projectileGeo,enemyMat);m.visible=false;scene.add(m);return m;});
 function effect(e){combatArt.effect(e);if(e.type==='shot'){const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(e.o.x,e.o.y,e.o.z),new T.Vector3(e.end.x,e.end.y,e.end.z)]),line=new T.Line(geo,new T.LineBasicMaterial({color:e.hit?'#fff3af':'#83e5d5',transparent:true,opacity:1}));scene.add(line);sparks.push({mesh:line,t:.10});lastShot=performance.now();}if(e.type==='pulse'){const mesh=new T.Mesh(new T.SphereGeometry(1,18,10),new T.MeshBasicMaterial({color:'#73e5d9',transparent:true,opacity:.25,wireframe:true}));camera.getWorldPosition(mesh.position);scene.add(mesh);sparks.push({mesh,t:.6,pulse:true});}}
 function update(state,dt,menu=false,reduced=false){const t=state.time;
  for(const [id,v]of relays){const on=state.relays.has(id);v.orb.material.color.set(on?'#8deac0':'#ffd280');v.orb.material.emissive.set(on?'#52bfa0':'#d18c38');v.ring.rotation.y=t*.6;}
  for(const [id,v]of notes){v.group.visible=!state.records.has(id);v.tablet.rotation.y=Math.sin(t)*.15;}
  terminalLight.material.emissive.set(state.relays.size===3?'#72ffc9':'#335e6c');
  for(let i=0;i<bulletMeshes.length;i++){const v=bulletMeshes[i],b=state.bullets[i];v.visible=!!b;if(b)v.position.set(b.x,b.y,b.z);}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.t-=dt;if(s.t<=0){scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();sparks.splice(i,1);continue;}if(s.pulse){s.mesh.scale.setScalar(1+(1-s.t/.6)*13);s.mesh.material.opacity=s.t*.35;}else s.mesh.material.opacity=s.t*10;}
  if(!reduced){turbines.forEach(g=>g.rotation.z+=dt*.2);flags.forEach((m,i)=>{const pos=m.geometry.attributes.position;for(let k=0;k<pos.count;k++){const x=pos.getX(k);pos.setZ(k,Math.sin(x*1.5+t*2.3+i)*.18*(x+1.5)/3);}pos.needsUpdate=true;m.geometry.computeVertexNormals();});}
  hand.visible=false;hook.visible=!menu&&!renderer.xr.isPresenting&&!(state.p.scoped&&state.p.weapon==='sniper');hook.scale.setScalar(.78);hook.position.x=-.055;hook.position.z=-.09;combatArt.update(state,dt,menu,reduced,renderer.xr.isPresenting);hook.position.y=state.p.rail?.24:0;hook.rotation.z=state.p.rail?-.18:0;
  const recoil=Math.max(0,1-(performance.now()-lastShot)/140);hand.position.z=recoil*.075;hand.rotation.x=recoil*.06;
 }
 function resize(w,h){if(renderer.xr.isPresenting)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 return {renderer,scene,camera,resize,update,effect,render:()=>renderer.render(scene,camera),stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries})};
}
