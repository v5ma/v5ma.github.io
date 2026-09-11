import {LADDERS,ROOFS,BEACON_TARGETS} from './rooftop-world.mjs';
/* Original floating-city art, built from authored geometry, not reference
 * screenshots. Repeated structure is instanced; dynamic actor pools are bounded. */
import {EXP_DISTRICTS,EXP_BRIDGES,EXP_BUILDINGS,EXP_ROOMS,TERRACES,ROOM_SOLIDS,GATES,COVER,POSTS,THINGS,TRANSIT,BALCONY_RAILS,transitPosition} from './expedition-world.mjs';
export function expeditionScene(T,{scene,part,box,beam,label,material,movingPart,quality}){
 const P={ivory:'#f0dfb7',cream:'#fff1cc',bronze:'#c69a54',iron:'#254a54',red:'#af5a4d',teal:'#347b80',slate:'#526a85',wood:'#765445',light:'#aceddc'};
 const v=a=>new T.Vector3(...a),dynamic=new T.Group();dynamic.name='Skyward Dispatch';scene.add(dynamic);
 const glass=new T.MeshPhysicalMaterial({color:'#91d2c7',roughness:.18,metalness:.12,transparent:true,opacity:.27,depthWrite:false,side:T.DoubleSide});
 function canopy(x,y,z,w,d,color=P.teal){const g=new T.SphereGeometry(1,quality==='low'?12:24,8,0,Math.PI*2,0,Math.PI/2),m=new T.Mesh(g,glass);m.position.set(x,y,z);m.scale.set(w/2,2,d/2);scene.add(m);for(const xx of[-1,1])for(const zz of[-1,1]){part('cylinder',x+xx*w*.42,y-1.6,z+zz*d*.36,.11,3.2,.11,color,0,0,'metal');part('sphere',x+xx*w*.42,y+.03,z+zz*d*.36,.17,.17,.17,P.bronze,0,0,'metal');}
  for(let i=-2;i<=2;i++){const zz=z+i*d*.15;beam(v([x-w*.46,y,zz]),v([x,y+1.75,zz]),.055,P.bronze);beam(v([x,y+1.75,zz]),v([x+w*.46,y,zz]),.055,P.bronze);}}
 function rail(a,b){beam(v(a).add(v([0,1.13,0])),v(b).add(v([0,1.13,0])),.065,P.bronze);beam(v(a).add(v([0,.33,0])),v(b).add(v([0,.33,0])),.045,P.iron);const n=Math.max(1,Math.ceil(v(a).distanceTo(v(b))/1.25));for(let i=0;i<=n;i++){const p=v(a).lerp(v(b),i/n);beam(p,p.clone().add(v([0,1.13,0])),.042,P.iron);part('sphere',p.x,p.y+1.15,p.z,.08,.08,.08,P.bronze,0,0,'metal');}}
 function sign(text,x,y,z,w=6,h=1.5,color=P.iron){const m=label(text,x,y,z,w,h,color,P.cream);m.material.side=T.DoubleSide;return m;}
 function lamp(x,y,z){part('cylinder',x,y+1.55,z,.075,3.1,.075,P.iron,0,0,'metal');part('cylinder',x,y+.2,z,.22,.4,.22,P.bronze,0,0,'metal');box(x,y+3.12,z,.6,.68,.6,P.bronze);part('sphere',x,y+3.12,z,.22,.27,.22,'#ffe1a1',0,0,'glow');part('cone',x,y+3.67,z,.42,.45,.42,P.iron);}
 function bench(x,y,z,angle=0){box(x,y+.48,z,2.1,.12,.7,P.wood,angle);box(x,y+.98,z-.28,2.1,.75,.12,P.wood,angle);for(const a of[-.8,.8])box(x+a,y+.25,z,.1,.5,.55,P.iron,angle,'metal');}
 function planter(x,y,z,w=3,d=1.5){box(x,y+.5,z,w,1,d,P.iron);box(x,y+1.02,z,w-.2,.08,d-.2,'#64784d');for(let i=0;i<5;i++){const xx=x+(i-2)*w*.16;part('sphere',xx,y+1.2,z,.35,.42,.4,['#e9b49c','#bdbce0','#8db7a4'][i%3]);}}
 // Every flight of stairs receives visible shallow treads, substantial handrails
 // and intermediate balusters. Its collision surface is the smooth stair envelope.
 for(const b of EXP_BRIDGES){const a=v(b.a),end=v(b.b),dir=end.clone().sub(a),length=Math.hypot(dir.x,dir.z),rise=dir.y,n=Math.max(2,Math.ceil(Math.abs(rise)/.24)),angle=Math.atan2(dir.x,dir.z),depth=length/n;
  for(let i=0;i<n;i++){const q=a.clone().lerp(end,(i+.5)/n);box(q.x,q.y-.12,q.z,b.width,.22,depth+.03,P.ivory,angle);box(q.x,q.y+.002,q.z,b.width-.12,.018,.045,P.bronze,angle,'metal');}
  const side=v([-dir.z/length,0,dir.x/length]);for(const sign of[-1,1]){const aa=a.clone().addScaledVector(side,sign*(b.width/2+.1)),bb=end.clone().addScaledVector(side,sign*(b.width/2+.1));rail(aa.toArray(),bb.toArray());}
  for(const q of[a,end])for(const sign of[-1,1]){const pos=q.clone().addScaledVector(side,sign*(b.width/2+.32));box(pos.x,pos.y+.62,pos.z,.43,1.25,.43,P.ivory);part('sphere',pos.x,pos.y+1.31,pos.z,.26,.26,.26,P.bronze,0,0,'metal');}
 }
 for(const t of TERRACES){box(t.x,t.y-.18,t.z,t.w,.36,t.d,P.ivory);box(t.x,t.y-.45,t.z,t.w+.2,.18,t.d+.2,P.bronze);for(const sx of[-1,1])for(const sz of[-1,1]){const floor=EXP_DISTRICTS.find(d=>t.x>=d.x-d.w/2&&t.x<=d.x+d.w/2&&t.z>=d.z-d.d/2&&t.z<=d.z+d.d/2)?.y||0;const h=t.y-floor;part('cylinder',t.x+sx*(t.w/2-.6),floor+h/2,t.z+sz*(t.d/2-.6),.3,h,.3,P.ivory);part('cylinder',t.x+sx*(t.w/2-.6),t.y-.6,t.z+sz*(t.d/2-.6),.55,.6,.55,P.bronze,0,0,'metal');}}
 for(const r of LADDERS){const [a,b]=r.points;for(const dx of[-.5,.5])beam(v([a[0]+dx,a[1],a[2]]),v([b[0]+dx,b[1]+1,b[2]]),.075,P.bronze);for(let y=a[1]+.3;y<b[1];y+=.32)beam(v([a[0]-.5,y,a[2]]),v([a[0]+.5,y,a[2]]),.055,P.iron);sign('SERVICE LADDER / '+r.name,a[0],a[1]+2.3,a[2]+.35,4.5,.6);}
 for(const r of ROOFS){lamp(r.x+r.w/2-.9,r.y,r.z+2);sign(r.name.toUpperCase(),r.x,r.y+2,r.z-r.d/2+.3,r.w*.85,.8);}
 for(const q of BALCONY_RAILS)rail(q.a,q.b);
 // Room meshes exactly follow the wall and door-jamb collision definitions.
 for(const r of EXP_ROOMS){for(const q of ROOM_SOLIDS.filter(q=>q.id.startsWith(r.id))){box((q.x1+q.x2)/2,(q.y1+q.y2)/2,(q.z1+q.z2)/2,q.x2-q.x1,q.y2-q.y1,q.z2-q.z1,r.id==='storm-room'?P.slate:P.ivory);}
  const front=r.z+r.d/2;for(const dx of[-2.15,2.15]){part('cylinder',r.x+dx,r.y+1.9,front+.25,.25,3.8,.25,P.cream);part('cylinder',r.x+dx,r.y+3.75,front+.25,.37,.22,.37,P.bronze,0,0,'metal');}box(r.x,r.y+3.9,front+.3,5.3,.3,.8,P.bronze);sign(r.name.toUpperCase(),r.x,r.y+4.25,front+.55,r.w*.9,.65);
  for(const side of[-1,1]){lamp(r.x+side*(r.w/2-1.1),r.y,front-1);for(let j=-1;j<=1;j++){const z=r.z+j*r.d*.23;box(r.x+side*(r.w/2-.35),r.y+2,z,.16,2.6,2.2,P.iron);box(r.x+side*(r.w/2-.46),r.y+2,z,.05,2.2,1.9,'#8ab8b1');}}
  for(let j=-1;j<=1;j++){box(r.x+j*3.4,r.y+.72,r.z-r.d/2+.8,2.8,1.4,.85,P.wood);box(r.x+j*3.4,r.y+1.47,r.z-r.d/2+.8,3,.1,1.05,P.bronze);for(let k=0;k<5;k++)box(r.x+j*3.4+(k-2)*.4,r.y+1.68,r.z-r.d/2+.8,.22,.35,.35,k%2?P.teal:P.red);}
 }
 const gateMeshes=new Map();for(const q of GATES){const g=new T.Group();dynamic.add(g);g.position.set((q.x1+q.x2)/2,q.y1,(q.z1+q.z2)/2);movingPart('box',material(P.iron,'metal'),[0,1.6,0],[3.35,3.2,.21],g);for(const x of[-1.1,0,1.1])movingPart('box',material(P.bronze,'metal'),[x,1.6,.13],[.08,3.1,.04],g);movingPart('torus',material(P.bronze,'metal'),[0,1.7,.16],[.43,.43,.12],g);gateMeshes.set(q.flag,{g,y:q.y1});}
 for(const q of COVER){const x=(q.x1+q.x2)/2,z=(q.z1+q.z2)/2,w=q.x2-q.x1,d=q.z2-q.z1,h=q.y2-q.y1;if(q.id.includes('planter'))planter(x,q.y1,z,w,d);else{box(x,q.y1+h/2,z,w,h,d,P.wood);for(const dx of[-w*.4,w*.4])box(x+dx,q.y1+h/2,z,.1,h+.03,d+.05,P.bronze,0,'metal');box(x,q.y1+h,z,w+.12,.1,d+.12,P.iron);}}
 // District-scale visual identities: festival storefronts, academia, working
 // docks, a public archive, heavy industry and a high-altitude observatory.
 for(const [i,d] of EXP_DISTRICTS.entries()){
  const colors=[P.red,P.teal,P.slate,P.teal,P.slate,P.red,P.teal],color=colors[i];
  const post=POSTS.find(p=>p.id===d.id);canopy(post.x,post.y+3.5,post.z,5.4,4.7,color);sign(post.name.toUpperCase()+'\nE / REST + CHECKPOINT',post.x,post.y+2.45,post.z+1.7,4.7,1.05,color);bench(post.x-1,post.y,post.z-.4);
  for(const b of EXP_BUILDINGS.filter(b=>Math.abs(b.x-d.x)<d.w/2&&Math.abs(b.z-d.z)<d.d/2)){
   // Layered cornices, windowsills, balconies and tall facade pilasters.
   for(let y=b.y+3;y<b.y+b.h;y+=3){box(b.x,y,b.z+b.d/2+.25,b.w+.25,.14,.44,P.bronze);for(const x of[-b.w*.3,0,b.w*.3]){box(b.x+x,y-.25,b.z+b.d/2+.45,1.6,.16,.65,P.cream);for(const off of[-.62,.62])box(b.x+x+off,y-.8,b.z+b.d/2+.38,.1,1.15,.18,P.cream);}}
   for(const side of[-1,1]){box(b.x+side*(b.w/2-.55),b.y+b.h/2,b.z+b.d/2+.25,.38,b.h,.34,color);part('cylinder',b.x+side*(b.w/2-.55),b.y+b.h+1,b.z+b.d/2-.5,.18,2,.18,P.bronze,0,0,'metal');}
  }
  for(const dx of[-d.w*.32,d.w*.32])lamp(d.x+dx,d.y,d.z+d.d*.32);
  sign(d.name.toUpperCase(),d.x,d.y+4.1,d.z+d.d/2-2,Math.min(16,d.w*.44),1.5,color);
 }
 // The Clockmaker's district has striped stalls and a suspended festival canopy.
 for(const [x,z,c] of [[-84,-6,P.red],[-112,-20,P.teal],[-86,-35,P.slate]]){for(const dx of[-1.5,1.5])part('cylinder',x+dx,8.65,z,.05,3.3,.05,P.iron);for(let i=0;i<7;i++)box(x+(i-3)*.47,10.35,z, .48,.12,2.7,i%2?P.cream:c);box(x,7.65,z,2.8,1.3,1.2,P.wood);for(let i=0;i<6;i++)part('sphere',x+(i-2.5)*.35,8.47,z,.16,.16,.16,i%2?'#dab764':'#b5796b');}
 sign('THE BELLWETHER\nTONIGHT: THE OPEN ROAD',-107,14.7,-.75,10,2,P.red);sign('CLOCKWORK / COFFEE / CURIOSITIES',-103,10.2,-22.4,10,.55,P.wood);
 const wireA=v([-112,16,-10]),wireB=v([-75,14,-10]);beam(wireA,wireB,.018,P.iron);for(let i=0;i<13;i++){const q=wireA.clone().lerp(wireB,i/12);part('sphere',q.x,q.y-.12,q.z,.085,.12,.085,'#ffe2ad',0,0,'glow');part('cone',q.x,q.y-.65,q.z,.27,.65,.025,i%2?P.red:P.teal,Math.PI);}
 // Civic portico: deliberately an original sunburst, not a borrowed insignia.
 for(const x of[-105,-85]){part('cylinder',x,23,-113,.5,10,.5,P.cream);part('cylinder',x,27.8,-113,.75,.5,.75,P.bronze,0,0,'metal');}box(-95,28,-113,23,1.2,2,P.ivory);sign('AURELIAN\nMEASURE. QUESTION. REPAIR.',-95,25.8,-111.9,16,2.5,P.slate);
 part('torus',-95,31,-113,2.8,2.8,.5,P.bronze,0,0,'metal');for(let i=0;i<12;i++){const a=i*Math.PI/6;beam(v([-95+Math.cos(a)*2,31+Math.sin(a)*2,-113]),v([-95+Math.cos(a)*3.8,31+Math.sin(a)*3.8,-113]),.1,P.bronze);}
 // Docks: freight crane, mooring bollards and a high clock face.
 for(const x of[-165,-135])part('cylinder',x,3.65,-45,.35,1.3,.35,P.iron,0,0,'metal');box(-169,11,-24,1,16,1,P.iron);box(-161,18.5,-24,17,.8,.9,P.bronze);beam(v([-169,11,-24]),v([-152,18,-24]),.18,P.iron);beam(v([-155,18,-24]),v([-155,8,-24]),.05,P.iron);
 part('sphere',-160,20,-6.35,2.2,2.2,.12,P.cream);part('torus',-160,20,-6.2,2.3,2.3,.2,P.bronze,0,0,'metal');beam(v([-160,20,-6.08]),v([-160,21.6,-6.08]),.065,P.iron);beam(v([-160,20,-6.05]),v([-158.8,19.6,-6.05]),.065,P.iron);sign('GANNET\nTHE PUBLIC CROSSING',-151,8,-45,12,2,P.teal);
 // Weather engine behind an actual mission-controlled door.
 const engine=new T.Group();engine.position.set(116,29.6,-170);dynamic.add(engine);movingPart('sphere',material('#70cdbf','metal'),[0,0,0],[1.15,1.15,1.15],engine);for(const angle of[0,Math.PI/2]){const r=movingPart('torus',material(P.bronze,'metal'),[0,0,0],[1.7,1.7,1.7],engine);r.rotation.x=angle;}
 for(const x of[109,116,123]){part('cylinder',x,33.5,-170,.28,14,.28,P.iron,0,0,'metal');for(let y=28;y<=39;y+=2.8)part('torus',x,y,-170,.43,.43,.43,P.bronze,Math.PI/2,0,'metal');}
 sign('STORMGLASS\nWEATHER IS A COMMON GOOD',116,36.4,-158.6,17,1.5,P.red);
 // Dawn hangar details and a marked, reachable evacuation apron.
 sign('DAWN AERODROME\nAIRMAIL / RESCUE / PUBLIC PASSAGE',126,22,-71.3,10,2,P.slate);
 for(const x of[122,130,138]){box(x,12.025,-58,5,.035,.12,P.bronze);box(x,12.025,-52,5,.035,.12,P.bronze);}part('torus',130,12.04,-58,3.5,3.5,3.5,P.cream,Math.PI/2);sign('EVACUATION PAD',130,13.8,-60,5,.65,P.teal);
 // Solstice's orrery is visible from the city, with a separate upstairs survey.
 const orrery=new T.Group();orrery.position.set(7,51.7,-221);dynamic.add(orrery);movingPart('sphere',material('#82c2c0','metal'),[0,0,0],[2.2,2.2,2.2],orrery);for(const [i,a]of[.2,1,1.9].entries()){const r=movingPart('torus',material(i===1?P.light:P.bronze,i===1?'glow':'metal'),[0,0,0],[4.8+i*.65,4.8+i*.65,4.8+i*.65],orrery);r.rotation.x=a;r.rotation.y=a*.65;}
 part('cylinder',7,47,-221,.7,4,.7,P.iron,0,0,'metal');part('cylinder',7,45.3,-221,2,.6,2,P.bronze,0,0,'metal');sign('SOLSTICE\nLEAVE THE LIGHT ON',7,43,-230,18,2,P.slate);
 // Actual mission props, small enough not to obstruct their own use volume.
 const props=new Map();for(const t of THINGS){if(t.kind==='person')continue;const g=new T.Group();g.position.set(t.x,t.y,t.z);dynamic.add(g);const m=material(P.bronze,'metal');
  if(t.id.startsWith('roof-beacon-')){movingPart('cylinder',m,[0,.6,0],[.28,1.2,.28],g);const ring=movingPart('torus',m,[0,1.65,0],[.7,.7,.16],g);movingPart('box',material(P.light,'glow'),[0,.62,0],[.12,.28,.12],ring);g.userData.beacon=ring;g.userData.lens=movingPart('sphere',material(P.light,'glow'),[0,1.65,0],[.26,.26,.26],g);}
  else if(t.kind==='board'){movingPart('box',material(P.iron),[0,1.6,0],[2.6,2.1,.2],g);for(const x of[-1,1])movingPart('cylinder',m,[x,.7,0],[.07,1.4,.07],g);sign(t.id==='dispatch-board'?'SKYWARD DISPATCH\nL / JOURNAL    E / READ':'BELLWETHER NOTICE OFFICE\nE / DELIVER DISPATCH',t.x,t.y+1.65,t.z+.12,2.35,1.7);}
  else if(t.kind==='telescope'){movingPart('cylinder',m,[0,.9,0],[.1,1.8,.1],g);const tube=movingPart('cylinder',material(P.iron,'metal'),[0,1.7,-.35],[.22,1.5,.22],g);tube.rotation.x=Math.PI/2-.25;movingPart('sphere',material(P.light,'glow'),[0,1.9,-1.02],[.16,.16,.04],g);}
  else if(t.kind==='pickup'){movingPart('box',material(P.iron),[0,.4,0],[.7,.8,.65],g);const gem=movingPart(t.id==='regulator'?'rock':'box',material(t.id==='regulator'?P.light:P.cream,'metal'),[0,1.05,0],t.id==='regulator'?[.3,.4,.3]:[.42,.5,.05],g);g.userData.gem=gem;movingPart('torus',material(P.light,'glow'),[0,1.05,0],[.52,.52,.1],g);}
  else if(t.kind==='valve'){movingPart('cylinder',material(P.iron,'metal'),[0,.7,0],[.25,1.4,.25],g);const wheel=movingPart('torus',m,[0,1.45,.15],[.55,.55,.18],g);g.userData.wheel=wheel;movingPart('box',m,[0,0,0],[.95,.08,.08],wheel);g.userData.dial=sign('0',t.x,t.y+2.2,t.z,.75,.65);}
  else{movingPart('box',material(P.iron,'metal'),[0,.7,0],[1.1,1.4,.85],g);movingPart('box',material(P.light,'glow'),[0,1.1,.44],[.7,.4,.04],g);for(const x of[-.25,.25])movingPart('sphere',m,[x,.6,.49],[.09,.09,.06],g);}
  if(t.kind!=='board'&&t.kind!=='valve')sign(t.name.toUpperCase(),t.x,t.y+2.65,t.z+.15,3.8,.52);
  props.set(t.id,g);
 }
 // Continuously moving ferry cabins and lift platforms. Boarding uses their
 // model position, while these meshes merely display that same position.
 const cabins=new Map();for(const r of TRANSIT){const g=new T.Group();dynamic.add(g);g.name=r.id;
  if(r.kind==='ferry'){
   movingPart('box',material(P.wood),[0,-.18,0],[3.3,.35,6],g);movingPart('sphere',material(P.iron,'metal'),[0,-.7,0],[1.8,.7,3.6],g);
   for(const x of[-1.5,1.5])for(const z of[-2.3,2.3]){movingPart('cylinder',material(P.bronze,'metal'),[x,1.6,z],[.07,3.2,.07],g);movingPart('sphere',material('#ffe5a4','glow'),[x,2.9,z],[.14,.2,.14],g);}
   movingPart('box',material(P.teal),[0,3.1,0],[3.5,.22,6.4],g);movingPart('sphere',material(P.ivory),[0,5,0],[2.2,1.5,4.7],g);
   for(const z of[-2,0,2]){const band=movingPart('torus',material(P.bronze,'metal'),[0,5,z],[2.25,1.55,1],g);band.rotation.y=0;}
   for(const x of[-1.65,1.65]){movingPart('box',material(P.iron),[x,.55,0],[.08,1.1,5.5],g);const pane=new T.Mesh(new T.PlaneGeometry(5.3,1.3),glass);pane.rotation.y=Math.PI/2;pane.position.set(x,1.7,0);g.add(pane);}
   const prop=movingPart('torus',material(P.bronze,'metal'),[0,.4,3.35],[.8,.8,.3],g);g.userData.prop=prop;
  }else{movingPart('box',material(P.wood),[0,-.14,0],[2.5,.28,2.5],g);for(const x of[-1.2,1.2])movingPart('box',material(P.bronze,'metal'),[x,1.4,0],[.06,2.8,2.4],g);movingPart('box',material(P.iron),[0,2.8,0],[2.7,.18,2.7],g);
   for(const dx of[-1.4,1.4]){beam(v([r.a.x+dx,r.a.y-.5,r.a.z-1.2]),v([r.b.x+dx,r.b.y+3.3,r.b.z-1.2]),.09,P.iron);} }
  cabins.set(r.id,g);for(const pos of[r.a,r.b]){part('torus',pos.x,pos.y+.045,pos.z,1.85,1.85,1.85,P.bronze,Math.PI/2,0,'metal');sign(r.name.toUpperCase()+'\nE / CALL OR BOARD',pos.x,pos.y+2.1,pos.z+2.5,4,1,P.teal);}
 }
 // One reusable matrix pool per anatomical/material component, not hundreds
 // of independent skinned meshes. Silhouettes remain human at medium distance.
 const batches=new Map(),matrix=new T.Matrix4(),q=new T.Quaternion(),euler=new T.Euler(),pos=new T.Vector3(),scale=new T.Vector3(),color=new T.Color();
 const count=32;const geometry={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(1,1,1,12)};
 function actorPart(key,shape,mat,max=128){const mesh=new T.InstancedMesh(geometry[shape],mat,max);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=true;dynamic.add(mesh);batches.set(key,{mesh,n:0,max});}
 actorPart('cloth','box',material(P.iron),count*5);actorPart('coat','cylinder',material(P.iron),count);actorPart('leather','box',material('#29353c'),count*7);actorPart('face','sphere',material('#d3aa83'),count);actorPart('helmet','sphere',material(P.iron,'metal'),count);actorPart('brass','box',material(P.bronze,'metal'),count*9);actorPart('eyes','sphere',material('#142e36'),count*2);actorPart('glow','box',material('#fba56b','glow'),count*3);
 function place(key,b,x,y,z,sx,sy,sz,rx=0,rz=0,tint=null){const pool=batches.get(key);if(pool.n>=pool.max)return;const heading=b.heading||0,cs=Math.cos(heading),sn=Math.sin(heading);pos.set(b.x+x*cs-z*sn,b.y-1.05+y,b.z+x*sn+z*cs);euler.set(rx,-heading,rz,'YXZ');q.setFromEuler(euler);scale.set(sx,sy,sz);matrix.compose(pos,q,scale);pool.mesh.setMatrixAt(pool.n,matrix);if(tint)pool.mesh.setColorAt(pool.n,color.set(tint));pool.n++;}
 function person(b,time,friendly=false){const size=b.kind==='breacher'?1.18:1,coat=friendly?'#c2b38c':b.kind==='longshot'?'#684f86':b.kind==='skirmisher'?'#3b8e87':b.kind==='marshal'?'#6e597a':b.kind==='breacher'?'#60554d':'#3e6670',walk=b.walking?Math.sin(time*8.5+(b.x+b.z)*.03)*.34:0;
  place('cloth',b,0,1.23,0,.63*size,.64,.37*size,0,0,coat);place('coat',b,0,.88,0,.39*size,.5,.26*size,0,0,coat);
  for(const side of[-1,1]){const k=side*walk;place('cloth',b,side*.19,.62,Math.sin(k)*.12,.19,.5,.21,k,0,coat);place('leather',b,side*.19,.26,-Math.sin(k)*.14,.17,.45,.19,-k);place('leather',b,side*.19,.075,-.12-Math.sin(k)*.16,.23,.14,.36);
   place('cloth',b,side*.4*size,1.26,-.045,.19,.49,.22,friendly?-k:-.62,side*-.08,coat);place('leather',b,side*.36*size,1.03,-.29,.16,.38,.19,1.1);place('brass',b,side*.35*size,1.5,0,.2,.08,.26);
   place('eyes',b,side*.075,1.79,-.212,.028,.035,.019);}
  place('face',b,0,1.72,0,.22,.27,.23);place('helmet',b,0,1.93,.035,.26,.17,.26,0,0,friendly?'#947452':P.iron);place('brass',b,0,1.88,-.21,.4,.055,.22);place('brass',b,0,1.09,-.202,.58,.065,.06);for(const y of[1.18,1.32,1.46])place('brass',b,.075,y,-.197,.035,.035,.024);
  if(!friendly){place('leather',b,.23,1.13,-.58,.15,.2,.7);place('brass',b,.23,1.16,b.kind==='longshot'?-1.22:-1.04,.07,.075,b.kind==='longshot'?.82:.46);place('glow',b,.23,1.16,-1.29,.07,.075,.02,0,0,b.telegraph>.1?'#ff754d':'#829e9b');if(b.kind==='breacher')place('brass',b,0,1.27,-.25,.51,.42,.09);}
 }
 let visibleActors=0;
 function update(s,dt,reduced){const e=s.expedition;if(!e)return;const flags=e.flags;
  for(const [flag,o]of gateMeshes){const target=o.y+(flags.includes(flag)?3.5:0);o.g.position.y+=(target-o.g.position.y)*Math.min(1,dt*7);}
  for(const [id,g]of props){if(g.userData.beacon){const i=Number(id.at(-1));g.userData.beacon.rotation.z=e.beaconDials[i]*Math.PI/2;g.userData.lens.visible=e.beaconDials[i]===BEACON_TARGETS[i];}g.visible=!(flags.includes(id)&&THINGS.find(t=>t.id===id)?.kind==='pickup')&&!(id==='charter-original'&&flags.includes('charter'));if(g.userData.gem&&!reduced)g.userData.gem.rotation.y=s.time*.7;if(g.userData.wheel){const i=Number(id.at(-1));g.userData.wheel.rotation.z=e.valves[i]*Math.PI/2;if(g.userData.lastDial!==e.valves[i]){g.userData.lastDial=e.valves[i];const tex=g.userData.dial.material.map,c=tex.image,ctx=c.getContext('2d');ctx.fillStyle=P.iron;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=P.cream;ctx.font='bold 400px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(e.valves[i]),c.width/2,c.height/2);tex.needsUpdate=true;}}}
  for(const r of TRANSIT){const c=e.transits.find(t=>t.id===r.id),g=cabins.get(r.id),p=transitPosition(r,c.t);g.position.set(p.x,p.y,p.z);if(g.userData.prop&&!reduced)g.userData.prop.rotation.z+=dt*(c.moving?9:2);g.visible=!r.requires||flags.includes(r.requires);}
  if(!reduced){orrery.rotation.y+=dt*.09;engine.rotation.y+=dt*(flags.includes('weather-open')?.7:.14);}
  for(const b of batches.values())b.n=0;visibleActors=0;
  for(const b of s.drones){if(!b.humanoid||b.hp<=0||Math.hypot(b.x-s.p.x,b.z-s.p.z)>125)continue;person(b,s.time);visibleActors++;}
  if(Math.hypot(e.escort.x-s.p.x,e.escort.z-s.p.z)<125){person({...e.escort,y:e.escort.y+1.05},s.time,true);visibleActors++;}
  for(const b of batches.values()){b.mesh.count=b.n;b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;b.mesh.visible=b.n>0;}
 }
 return {update,stats:()=>({districts:EXP_DISTRICTS.length,rooftops:ROOFS.length,ladders:LADDERS.length,stairs:EXP_BRIDGES.length,rooms:EXP_ROOMS.length,visibleHumanoids:visibleActors,transports:TRANSIT.length})};
}
