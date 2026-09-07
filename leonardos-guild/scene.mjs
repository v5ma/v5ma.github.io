import * as T from './vendor/three.module.js';
import {Batch,materials,trees,bicycle,label,unit,rand} from './art.mjs';
import {house,person,car,dressGuild} from './guild-art.mjs';
import {heightAt,headingVector,activeTarget} from './model.mjs';
export function createScene(canvas,w,s,quality='high'){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='low'?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;renderer.shadowMap.enabled=quality!=='low';renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#9bcceb');scene.fog=new T.Fog('#b5d9dc',140,670);
 const camera=new T.PerspectiveCamera(58,1,.12,1300),m=materials(),root=new T.Group();scene.add(root);
 const ambient=new T.HemisphereLight('#d2eafb','#716b41',1.4);scene.add(ambient);const sun=new T.DirectionalLight('#ffe0ad',3.2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-70,right:70,top:85,bottom:-55,near:1,far:450});sun.shadow.bias=-.0002;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
 const skyGeo=new T.SphereGeometry(1050,24,16);const sky=new T.Mesh(skyGeo,new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#178bd9')},bottom:{value:new T.Color('#dcecef')}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(v).y*.85+.16,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.55)),1.);\n#include <colorspace_fragment>\n}',toneMapped:false}));scene.add(sky);
 const groundGeo=new T.PlaneGeometry(390,540,65,90);groundGeo.rotateX(-Math.PI/2);groundGeo.translate(0,0,180);const pos=groundGeo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(pos.getX(i),pos.getZ(i))-.06);groundGeo.computeVertexNormals();const groundMat=new T.MeshStandardMaterial({color:'#879c55',roughness:1,map:m.leaf.map.clone()});groundMat.map.repeat.set(55,75);const ground=new T.Mesh(groundGeo,groundMat);ground.receiveShadow=true;root.add(ground);
 const road=new Batch(),walk=new Batch(),detail=new Batch(),green=new Batch(),rail=new Batch();
 function strip(x1,z1,x2,z2,width,batch,c,raise=0){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),nx=-dz/len*width/2,nz=dx/len*width/2,N=Math.ceil(len/8);for(let i=0;i<N;i++){const a=i/N,b=(i+1)/N,verts=[[x1+dx*a+nx,z1+dz*a+nz],[x1+dx*b+nx,z1+dz*b+nz],[x1+dx*b-nx,z1+dz*b-nz],[x1+dx*a-nx,z1+dz*a-nz]].map(([x,z])=>[x,heightAt(x,z)+raise,z]);batch.tri(verts[0],verts[1],verts[2],c);batch.tri(verts[0],verts[2],verts[3],c);}}
 for(const x of w.roads){let prev=-30;for(const z of [...w.crossings,414]){const end=z===414?414:z-7;strip(x,prev,x,end,14,road,'#958768',.01);strip(x-9,prev,x-9,end,4,walk,'#bfb190',.08);strip(x+9,prev,x+9,end,4,walk,'#bfb190',.08);prev=z+7;}

 }
 for(const z of w.crossings){strip(-150,z,150,z,14,road,'#958768',.011);for(const dz of[-9,9])for(const [a,b]of[[-145,-91],[-69,-11],[11,69],[91,145]])strip(a,z+dz,b,z+dz,4,walk,'#bfb190',.081);}
 // Each plot has a walk, a fence with a genuine gate opening, and a front lawn.
 for(const h of w.houses){house(root,h,m);const bx=h.road+h.side*11.1;strip(bx,h.z,h.x,h.z,2.1,walk,'#cfc8ac',.1);
  for(let j=-16;j<=16;j+=.62){if(Math.abs(j)<1.7)continue;const z=h.z+j,y=heightAt(bx,z);rail.box(bx,y+.66,z,.12,1.2,.25,'#e9e5c8');rail.add(unit.cone,bx,y+1.32,z,.18,.22,.18,'#eee7ce',0,Math.PI/4);}
  for(const span of[-1,1])for(const yy of[.43,.95])rail.rod([bx,heightAt(bx,h.z+span*2)+yy,h.z+span*2],[bx,heightAt(bx,h.z+span*16)+yy,h.z+span*16],.047,'#dcdabf');
  for(let k=0;k<5;k++){const x=h.x+Math.sin(k*2.4)*6.2,z=h.z+Math.cos(k*2.4)*7.8;green.ball(x,heightAt(x,z)+.45,z,.7,.5,.8,'#678f40');}
 }
 for(const t of w.trees){const b={x:t.x,z:t.z};detail.box(b.x,heightAt(b.x,b.z)+.02,b.z,2.8,.035,2.8,'#a4a17d');}
 trees(root,w.trees,m);
 road.finish(root,new T.MeshStandardMaterial({vertexColors:true,roughness:.97,map:m.roof.map}),'Interconnected ochre stone streets');walk.finish(root,m.trim,'Footpaths and front walks');rail.finish(root,m.trim,'Picket fences');green.finish(root,m.leaf,'Garden hedges');detail.finish(root,m.trim,'Crosswalks, lane paint and street lighting');
 // A soft procedural cloud bank, not a photographed sky pasted into gameplay.
 const cloudTex=(()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');for(let i=0;i<52;i++){const x=50+rand(i)*420,y=130-Math.sin((x-40)/450*Math.PI)*50+rand(i+89)*45,r=22+rand(i+2)*48;const a=g.createRadialGradient(x-r*.15,y-r*.3,0,x,y,r);a.addColorStop(0,'#fffffff8');a.addColorStop(.6,'#fffffff0');a.addColorStop(1,'#ffffff00');g.fillStyle=a;g.fillRect(x-r,y-r,r*2,r*2);}const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;})();
 const clouds=[];for(let i=0;i<18;i++){const c=new T.Mesh(new T.PlaneGeometry(90+rand(i+23)*160,60+rand(i+5)*45),new T.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,opacity:.75}));const a=i/18*Math.PI*2;c.position.set(Math.cos(a)*490,130+rand(i)*80,190+Math.sin(a)*470);c.lookAt(0,20,190);scene.add(c);clouds.push(c);}
 const distant=new Batch();for(let i=0;i<90;i++){const x=-520+rand(i+20)*1000,z=570+rand(i+97)*260,ht=6+rand(i+12)*19;distant.box(x,ht/2-5,z,10+rand(i+4)*16,ht,10+rand(i+8)*13,i%3?'#b3b792':'#c0aa80');distant.add(unit.cone,x,ht-3,z,12,5,12,'#9d754f',0,Math.PI/4);}
 for(let i=0;i<12;i++){distant.ball(-700+i*135,-44,690+rand(i+28)*280,200,80+rand(i+28)*100,170,'#87a8a0');}
 const bg=distant.finish(scene,m.wall,'Distant harbor skyline and coastal hills');bg.castShadow=false;
 const sea=new T.Mesh(new T.PlaneGeometry(1800,950,1,1),new T.MeshStandardMaterial({color:'#589eab',roughness:.26,metalness:.18}));sea.rotation.x=-Math.PI/2;sea.position.set(0,-2,810);scene.add(sea);
 // Kiosk, civic garden and newsroom anchor the three mission chapters.
 const landmarks=new Batch();const ky=heightAt(-15,1);landmarks.box(-15,ky+2,1,6.4,4,6.2,'#b1a072');landmarks.box(-15,ky+4.3,1,7,.55,6.8,'#ac6f49');landmarks.box(-11.72,ky+2,1,.08,2.3,4.6,'#304a50');
 for(const [x,z]of[[20,178],[28,204],[34,186]]){green.ball(x,heightAt(x,z)+.3,z,4,.3,4,'#8ca858');trees(root,[{x,z,seed:x+z}],m);}
 const ny=heightAt(107,351);landmarks.box(107,ny+6,351,24,12,24,'#d9d7c3');landmarks.box(107,ny+12.4,351,25,.8,25,'#98704b');landmarks.box(94.6,ny+5,351,.22,6.5,19,'#5d6857');label(root,'ARCHIVIO\nTHE STOLEN FOLIO',94.3,ny+10,351,17,3.5,-Math.PI/2);
 for(let z=342;z<=360;z+=3)landmarks.box(94.35,ny+5,z,.24,6.6,.13,'#b6c8bf');landmarks.finish(root,m.trim,'The workshop and riverside archive');
 label(root,'VINCI\nHEIGHTS',-10.8,heightAt(-10.8,-8)+3.1,-8,3,1.6,Math.PI/2,'#24564f');label(root,'ARNO ROAD',-10.5,heightAt(-10.5,282)+3.3,282,3.8,1.2,Math.PI/2);
 const boxes=new Map();for(const b of w.mailboxes){const g=new T.Group();g.position.set(b.x,b.y-1.15,b.z);const mesh=new Batch();mesh.add(unit.cyl,0,.55,0,.075,1.1,.075,'#eee7cc');mesh.box(0,1.22,0,.75,.4,.4,b.route?'#cd7041':'#466e70');mesh.add(unit.cyl,0,1.42,0,.375,.4,.375,b.route?'#d88950':'#537d76',Math.PI/2,0,Math.PI/2);mesh.box(0,1.17,-.225,.57,.12,.04,'#193e4b');const obj=mesh.finish(g,m.trim,'Mailbox');root.add(g);const ring=new T.Mesh(new T.TorusGeometry(.65,.03,5,24),new T.MeshBasicMaterial({color:'#f9d67d',transparent:true,opacity:.72}));ring.rotation.x=Math.PI/2;ring.position.y=.07;g.add(ring);boxes.set(b.id,{g,ring,obj});}
 const deviceMeshes=[];for(const n of w.nodes){const g=new T.Group();g.position.set(n.x,heightAt(n.x,n.z),n.z);const b=new Batch();b.box(0,.95,0,.9,1.9,.65,'#896d47');b.box(0,1.2,-.35,.6,.48,.06,'#d6bb7d');b.box(0,2,0,1.1,.1,.85,'#ddbc7c');b.finish(g,m.metal,'Fictional city-link terminal');root.add(g);label(g,n.type==='relay'?'WATERWORKS':'BELLS',0,1.65,-.365,.76,.3,Math.PI);deviceMeshes.push({n,g});}
 const gate=new T.Group();gate.position.set(40,heightAt(40,240),234);root.add(gate);const gb=new Batch();gb.box(0,.65,0,.6,1.3,.6,'#455e64');gb.finish(gate,m.metal,'Gate post');const arm=new T.Group();arm.position.y=1.1;gate.add(arm);const ab=new Batch();ab.box(0,0,6,.18,.22,12,'#aa8d59');for(let i=0;i<8;i++)ab.box(-.01,0,.8+i*1.5,.19,.23,.6,'#6e5b3c');ab.finish(arm,m.trim,'Operable garden barrier');
 const obstacles=[];for(const o of w.props){const g=new T.Group();g.position.set(o.x,heightAt(o.x,o.z),o.z);const b=new Batch();if(o.type==='bin'){b.box(0,.55,0,.8,1.1,.8,'#5c8070');b.box(0,1.15,0,.88,.12,.88,'#3a6053');}else{b.add(unit.cone,0,.5,0,.38,1,.38,'#e1974a');b.box(0,.04,0,.75,.08,.75,'#435b58');}b.finish(g,m.trim,'Street obstacle');root.add(g);obstacles.push(g);}
 const bike=bicycle(m),rider=person(m),pressCar=car(m);scene.add(bike.root,rider.root,pressCar.root);label(pressCar.root,'SVGN',-1.001,.81,0,1.4,.35,-Math.PI/2,'#d59140');label(pressCar.root,'SVGN',1.001,.81,0,1.4,.35,Math.PI/2,'#d59140');
 const traffic=s.traffic.map((t,i)=>{const c=car(m,['#6e8c80','#b9876a','#d5caa3','#7898a3'][i%4]);scene.add(c.root);return c;});const peds=s.pedestrians.map((t,i)=>{const p=person(m);p.root.scale.setScalar(.92+i%3*.045);scene.add(p.root);return p;});
 const marker=new T.Mesh(new T.TorusGeometry(2.5,.09,5,48),new T.MeshBasicMaterial({color:'#ffcf78',transparent:true,opacity:.8}));marker.rotation.x=-Math.PI/2;scene.add(marker);
 const goal=new T.Mesh(new T.TorusGeometry(7,.12,6,48),new T.MeshBasicMaterial({color:'#f2d28c'}));goal.rotation.x=-Math.PI/2;goal.position.set(w.newsroom.x,heightAt(w.newsroom.x,w.newsroom.z)+.07,w.newsroom.z);root.add(goal);
 const scanRings=deviceMeshes.map(({n,g})=>{const a=new T.Mesh(new T.TorusGeometry(1.6,.05,5,32),new T.MeshBasicMaterial({color:'#88ffe0',transparent:true,opacity:.85,depthTest:false}));a.position.y=2.8;a.renderOrder=50;g.add(a);return a;});
 const paperGeo=new T.BoxGeometry(.32,.025,.22),paperMat=new T.MeshStandardMaterial({color:'#fff2cf'}),papers=[];for(let i=0;i<24;i++){const mesh=new T.Mesh(paperGeo,paperMat);mesh.visible=false;scene.add(mesh);papers.push(mesh);}
 const guild=dressGuild(root,w,m);
 const carCam=new T.Vector3(),look=new T.Vector3(),forward=new T.Vector3();let initialized=false,orbit=0,freeLook=0;
 function resize(){const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
 function update(dt,state,input={}){
  const p=state,f=headingVector(p.yaw),y=heightAt(p.x,p.z);if(input.look)orbit+=input.look;else orbit*=Math.exp(-dt*1.7);orbit=clampOrbit(orbit);
  const angle=p.yaw+orbit,follow=p.mode==='car'?9:p.mode==='foot'?5:6.6,camHeight=p.mode==='car'?4:p.mode==='foot'?2.9:3.4;
  carCam.set(p.x-Math.sin(angle)*follow,y+camHeight+p.lift*.5,p.z-Math.cos(angle)*follow);look.set(p.x+f.x*7,y+1.6+p.lift*.5,p.z+f.z*7);
  if(!initialized||input.snap){camera.position.copy(carCam);initialized=true;}else camera.position.lerp(carCam,1-Math.exp(-dt*5));camera.lookAt(look);camera.fov=T.MathUtils.lerp(camera.fov,58+Math.min(7,Math.abs(p.speed)*.2),Math.min(1,dt*3));camera.updateProjectionMatrix();
  sky.position.copy(camera.position);sun.position.set(p.x-70,y+130,p.z-85);sun.target.position.set(p.x,y,p.z+20);sun.target.updateMatrixWorld();
  for(const [key,model]of[['bike',bike],['car',pressCar]]){const v=p.vehicle[key];model.root.position.set(v.x,heightAt(v.x,v.z)+(p.mode===key?p.lift:0),v.z);model.root.rotation.set(-Math.atan((heightAt(v.x,v.z+.5)-heightAt(v.x,v.z-.5)))*Math.cos(v.yaw),v.yaw,p.mode===key&&key==='bike'?-(input.steer||0)*Math.min(.17,Math.abs(p.speed)*.012):0);if(p.mode===key)for(const wheel of model.wheels)wheel.rotation.x+=p.speed*dt/(key==='bike'?.39:.37);}
  rider.root.visible=p.mode!=='car';rider.root.position.set(p.x,y+p.lift+(p.mode==='bike'?.03:0),p.z);rider.root.rotation.set(p.mode==='bike'?.14:0,p.yaw,0);if(p.mode==='bike'){for(let i=0;i<2;i++)rider.legs[i].rotation.x=Math.sin(p.distance*3+i*Math.PI)*.6;rider.root.position.z-=f.z*.12;rider.root.position.x-=f.x*.12;}else for(let i=0;i<2;i++)rider.legs[i].rotation.x=Math.sin(p.time*10+i*Math.PI)*Math.min(.5,Math.abs(p.speed)*.14);
  for(let i=0;i<p.traffic.length;i++){const t=p.traffic[i],c=traffic[i];c.root.position.set(t.x,heightAt(t.x,t.z),t.z);c.root.rotation.y=t.dir>0?0:Math.PI;for(const w of c.wheels)w.rotation.x+=t.dir*t.speed*dt/.37;}
  for(let i=0;i<p.pedestrians.length;i++){const a=p.pedestrians[i],b=peds[i];b.root.position.set(a.x,heightAt(a.x,a.z),a.z);b.root.rotation.y=a.yaw;for(let j=0;j<2;j++)b.legs[j].rotation.x=Math.sin(a.phase+j*Math.PI)*.36;}
  const target=activeTarget(p,w);marker.position.set(target.x,heightAt(target.x,target.z)+.14,target.z);marker.scale.setScalar(1+Math.sin(p.time*2)*.045);
  for(const [id,{ring}]of boxes){ring.visible=!p.deliveries.has(id);ring.material.color.set(p.mission===0&&w.mailboxes.find(b=>b.id===id).route?'#ffd585':'#7eccc0');}
  arm.rotation.x=T.MathUtils.lerp(arm.rotation.x,p.relay?Math.PI/2:0,Math.min(1,dt*4));scanRings.forEach(r=>{r.visible=p.scan>0;r.lookAt(camera.position);r.rotation.z+=dt;});
  for(let i=0;i<papers.length;i++){const b=p.shots[i],mesh=papers[i];mesh.visible=!!b;if(b){mesh.position.set(b.x,b.y,b.z);mesh.rotation.set(p.time*13,p.time*7,p.time*9);}}
  guild.update(p,dt);rider.root.rotation.z=p.attackT>0?Math.sin(p.attackT*22)*.3:0;
  goal.visible=p.mission===2&&p.defeated;renderer.render(scene,camera);
 }
 function clampOrbit(a){return Math.max(-1.25,Math.min(1.25,a));}
 resize();return {renderer,scene,camera,update,resize,inspect:()=>({triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,webgl:renderer.capabilities.isWebGL2!==false})};
}
