/* Original visible city density. Instanced architectural detail, articulated
 * citizens, model-aligned open rooms and real stair/landing-pad geometry. */
import {ROOMS,roomWalls,CITY_GATES,CITY_FURNITURE,PEOPLE,CITIZENS,CATS,THINGS,DOCKS,STAIR,catPosition,citizenPose,insideRoom} from './city-world.mjs';
export function buildCityScene(T,scene,camera,quality='balanced'){
 const low=quality==='low',buckets=new Map(),mats=new Map(),matrices=new T.Matrix4(),q=new T.Quaternion();
 const geos={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,low?12:24,low?8:16),cyl:new T.CylinderGeometry(1,1,1,low?12:24),cone:new T.ConeGeometry(1,1,low?12:24),ring:new T.TorusGeometry(1,.065,low?6:10,low?24:48)};
 const mat=(color,kind='')=>{const key=color+kind;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:kind==='metal'?.35:.78,metalness:kind==='metal'?.6:0,emissive:kind==='glow'?color:0,emissiveIntensity:kind==='glow'?.6:0}));return mats.get(key);};
 function add(shape,pos,scale,color,rotation=[0,0,0],kind=''){
  const key=shape+color+kind;if(!buckets.has(key))buckets.set(key,{geometry:geos[shape],material:mat(color,kind),items:[]});
  q.setFromEuler(new T.Euler(...rotation));matrices.compose(new T.Vector3(...pos),q,new T.Vector3(...scale));buckets.get(key).items.push(matrices.clone());
 }
 const box=(x,y,z,w,h,d,c,rot=0)=>add('box',[x,y,z],[w,h,d],c,[0,rot,0]);
 function beam(a,b,r,color){
  const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).addScaledVector(v,.5),e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));
  add('cyl',mid.toArray(),[r,v.length(),r],color,[e.x,e.y,e.z],'metal');
 }
 function sign(text,pos,w=3,h=.65,color='#274a50',parent=scene,rotation=0){
  const c=document.createElement('canvas');c.width=768;c.height=Math.round(768*h/w);const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,c.width,c.height);g.strokeStyle='#d4b374';g.lineWidth=4;g.strokeRect(7,7,c.width-14,c.height-14);g.fillStyle='#fff1ce';g.textAlign='center';g.textBaseline='middle';g.font=`600 ${Math.min(65,c.height*.56)}px Georgia`;g.fillText(text,384,c.height/2,725);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));m.position.set(...pos);m.rotation.y=rotation;parent.add(m);return m;
 }
 function furnitureTable(x,y,z,color='#754e3e'){
  add('cyl',[x,y+.82,z],[.85,.13,.85],color);add('cyl',[x,y+.42,z],[.07,.75,.07],'#b69867',[], 'metal');
  for(const side of[-1,1]){box(x+side*1.1,y+.46,z,.55,.12,.58,'#a88761');box(x+side*1.36,y+.87,z,.10,.78,.61,'#477475');for(const zz of[-.20,.20])box(x+side*1.1,y+.22,z+zz,.07,.4,.07,'#423a34');}
  add('cyl',[x,y+.95,z],[.12,.20,.12],'#eee0bd');add('ring',[x+.13,y+.96,z],[.07,.07,.07],'#eee0bd',[0,Math.PI/2,0]);
 }
 for(const r of ROOMS){
  // Structural geometry uses exactly the segments used by collision and rays.
  for(const wall of roomWalls(r))box((wall.x1+wall.x2)/2,(wall.y1+wall.y2)/2,(wall.z1+wall.z2)/2,wall.x2-wall.x1,wall.y2-wall.y1,wall.z2-wall.z1,r.color);
  if(r.id==='basement'){
   box(r.x,r.y-.13,r.z,r.w,.26,r.d,'#4f696b');
   for(let k=0;k<5;k++){beam([r.x+2.9,r.y+.4,r.z-3+k*1.4],[r.x+2.9,r.y+3.35,r.z-3+k*1.4],.12,'#bfa275');add('ring',[r.x+2.7,r.y+1.25,r.z-2+k*1.1],[.32,.32,.32],'#bd765a',[0,Math.PI/2,0]);}
   sign('UNDERQUAY / PUMP VAULT',[r.x,r.y+2.3,r.z+3.74],4.5,.7,'#344d57',scene,Math.PI);
  }else{
   // Timber boards on top of the city deck, with the actual stair aperture.
   for(let x=r.x-r.w/2+.45;x<r.x+r.w/2-.3;x+=.56){
    const a=r.z-r.d/2+.27,b=r.z+r.d/2-.27;
    if(r.id==='cafe'&&x>STAIR.x1-.26&&x<STAIR.x2+.26){if(STAIR.z1>a)box(x,r.y+.025,(a+STAIR.z1)/2,.53,.045,STAIR.z1-a,'#947150');if(b>STAIR.z2)box(x,r.y+.025,(b+STAIR.z2)/2,.53,.045,b-STAIR.z2,'#947150');}
    else box(x,r.y+.025,(a+b)/2,.53,.045,b-a,r.id==='greenhouse'?'#b3bca0':'#a68763');
   }
   const doorZ=r.z+(r.door==='north'?-r.d/2:r.d/2),rot=r.door==='north'?Math.PI:0;
   for(const side of[-1,1]){box(r.x+side*1.48,r.y+1.5,doorZ,.21,3.1,.55,'#a38155');add('cyl',[r.x+side*1.5,r.y+1.5,doorZ],[.12,3,.12],'#d6bd83',[], 'metal');}
   sign(r.name,[r.x,r.y+3.20,doorZ+(r.door==='north'?-.2:.2)],Math.min(6,r.w-.7),.56,r.accent,scene,rot);
   // Interior wainscot, ceiling coffers, individual bricks, wall pictures.
   for(const side of[-1,1]){
    box(r.x+side*(r.w/2-.3),r.y+.55,r.z,.09,1.05,r.d-.5,r.accent);
    for(let z=r.z-r.d/2+.5;z<r.z+r.d/2;z+=1.2)box(r.x+side*(r.w/2-.4),r.y+r.height-.2,z,.25,.28,1.0,'#ad936d');
   }
   for(let x=r.x-r.w/2+.6;x<r.x+r.w/2-.4;x+=1.4)box(x,r.y+r.height-.1,r.z,.10,.13,r.d-.55,'#957c5c');
   for(let i=0;i<3;i++){const x=r.x+(i-1)*1.7,z=r.z+(r.door==='north'?r.d/2-.32:-r.d/2+.32);
    box(x,r.y+2,z,1.1,1.3,.06,'#826641');box(x,r.y+2,z+(r.door==='north'?-.04:.04),.91,1.09,.07,['#719a93','#99a899','#b88966'][i]);}
   const lampX=r.id==='cafe'?-9:r.x;
   beam([lampX,r.y+r.height,r.z],[lampX,r.y+r.height-.7,r.z],.035,'#bd9a62');
   add('sphere',[lampX,r.y+r.height-.85,r.z],[.21,.24,.21],'#ffe2a0',[],'glow');
   const light=new T.PointLight('#ffcf8d',low?1.1:1.9,11,1.3);light.position.set(lampX,r.y+r.height-.9,r.z);scene.add(light);
  }
 }
 // A continuously sloped physical stair, with visible treads and handrails.
 const cx=(STAIR.x1+STAIR.x2)/2,count=22;for(let i=0;i<count;i++){
  const z=STAIR.z1+(i+.5)/count*(STAIR.z2-STAIR.z1),y=STAIR.top+(i+.5)/count*(STAIR.bottom-STAIR.top);
  box(cx,y-.10,z,STAIR.x2-STAIR.x1,.2,(STAIR.z2-STAIR.z1)/count,'#7e8a83');
 }
 for(const x of[STAIR.x1+.04,STAIR.x2-.04]){beam([x,1,STAIR.z1],[x,STAIR.bottom+1,STAIR.z2],.043,'#c7ae78');for(let i=0;i<6;i++){const z=STAIR.z1+i/5*(STAIR.z2-STAIR.z1),y=-i/5*4.2;beam([x,y,z],[x,y+1,z],.03,'#476361');}}
 sign('SERVICE STAIR ↓',[-12.13,1.7,5.02],1.7,.42,'#48676b',scene,Math.PI);
 furnitureTable(-8.0,0,8.4); // Keep the left stair corridor clear.
 // Counter/furniture colliders are not enlarged by decorative mesh detail.
 for(const b of CITY_FURNITURE){const x=(b.x1+b.x2)/2,y=(b.y1+b.y2)/2,z=(b.z1+b.z2)/2;box(x,y,z,b.x2-b.x1,b.y2-b.y1,b.z2-b.z1,'#66513e');box(x,b.y2+.04,z,b.x2-b.x1+.08,.09,b.z2-b.z1+.08,'#cbad80');}
 for(let i=0;i<7;i++){add('cyl',[-7.5+(i%3)*.2,1.25,11+(Math.floor(i/3)*.25)],[.08,.25,.08],['#ede2c3','#5e9b8f','#ac6470'][i%3]);box(-9.7+i*.22,1.15,47,.17,.12,.55,['#596f82','#bb9471','#4d7165'][i%3]);}
 sign('COFFEE & COMPANY',[-6.02,2.25,9],3,.6,'#375e5e',scene,-Math.PI/2);
 // Police cell is visual/interactable lore, not a simulated justice system.
 for(let x=-14;x<-11.7;x+=.3)box(x,1.4,42,.075,2.8,.075,'#566d76');
 // Hangar tools, racks and articulated flying-machine landing pads.
 for(let i=0;i<6;i++){beam([-44.6,3.5,43+i],[-44.6,4.6,43+i],.045,'#a48b61');add('ring',[-44.6,4.6,43+i],[.18,.18,.18],'#a48b61',[0,Math.PI/2,0],'metal');}
 for(const d of DOCKS){add('cyl',[d.x,d.y+.04,d.z],[2.9,.08,2.9],'#516f75');add('ring',[d.x,d.y+.10,d.z],[2.6,2.6,2.6],'#eed298',[Math.PI/2,0,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4;add('sphere',[d.x+Math.sin(a)*2.7,d.y+.18,d.z+Math.cos(a)*2.7],[.10,.10,.10],'#aae6cf',[],'glow');}sign('KESTREL / LANDING PAD',[d.x,d.y+.8,d.z+3.1],3,.6,'#315561');}
 // New south district has street furniture, arches and pavement without
 // blocking the old map's rails, combat targets or original objective routes.
 for(let i=0;i<7;i++){
  const x=(i%2?1:-1)*17,z=32+Math.floor(i/2)*6.3;
  box(x,.25,z,1.5,.5,1.5,'#b7ab8c');add('cyl',[x,2.3,z],[.085,4.2,.085],'#375864');add('cone',[x,4.45,z],[.45,.40,.45],'#bba478');add('sphere',[x,4.15,z],[.22,.30,.22],'#ffeab5',[],'glow');
 }
 for(const side of[-1,1])for(let i=0;i<5;i++){box(side*5,.08,32+i*4,1.6,.12,.5,'#e3c9a0');}
 for(const x of[-18,18])for(let z=32;z<55;z+=1.2){box(x,.48,z,.24,.9,.24,'#bba684');box(x,.98,z,.36,.13,1.3,'#e4c994');}
 sign('LANTERN COMMONS',[0,3.1,31.7],6.7,1.2,'#436f73',scene,Math.PI);
 sign('LANTERN WATCH',[-10,5.3,38.7],6.9,1.1,'#315574',scene,Math.PI);
 sign('CIVIC HALL',[10,6.1,38.7],6,1.1,'#567c67',scene,Math.PI);
 sign('SKYWRIGHT / HANGAR',[-39,8.1,40.8],9,1.3,'#95674d',scene,Math.PI);
 // Observable mission props, not just UI triggers.
 const propGroups=new Map();
 for(const n of THINGS){
  const g=new T.Group();g.position.set(n.x,n.y,n.z);scene.add(g);propGroups.set(n.id,g);
  function mesh(shape,pos,scale,color,kind=''){const m=new T.Mesh(geos[shape],mat(color,kind));m.position.set(...pos);m.scale.set(...scale);m.castShadow=!low;g.add(m);return m;}
  if(n.id.startsWith('glyph')){mesh('cyl',[0,.45,0],[.42,.9,.42],'#756682');const jewel=mesh('sphere',[0,1.13,0],[.26,.33,.26],'#97e5d1','glow');g.userData.jewel=jewel;const ring=mesh('ring',[0,1.13,0],[.44,.44,.44],'#e4b785','metal');g.userData.ring=ring;}
  else if(n.id==='pump-fuse'){mesh('box',[0,.53,0],[.7,1.05,.6],'#53676b');mesh('cyl',[0,1.17,0],[.13,.36,.13],'#e3d6ae');}
  else if(n.id==='cargo-ledger'){mesh('box',[0,.48,0],[.62,.96,.48],'#667878');mesh('box',[0,1.02,0],[.5,.09,.43],'#e4c98b');}
  else{mesh('box',[0,.67,0],[.95,1.35,.65],'#4b7985');mesh('ring',[0,1.22,.37],[.23,.23,.23],'#c9ae70','metal');mesh('sphere',[0,1.65,0],[.12,.12,.12],'#9de3c3','glow');}
  sign(n.name,[0,1.95,.12],n.id.startsWith('glyph')?1.8:2.8,.4,'#3b555e',g);
 }
 const gateMeshes=CITY_GATES.map(d=>{const g=new T.Group();g.position.set((d.x1+d.x2)/2,d.y1,(d.z1+d.z2)/2);scene.add(g);
  for(let x=d.x1+.12;x<d.x2;x+=.24){const m=new T.Mesh(new T.CylinderGeometry(.04,.04,d.y2-d.y1,12),mat('#bd9d68','metal'));m.position.set(x-g.position.x,(d.y2-d.y1)/2,0);g.add(m);}
  const board=sign(d.id==='cellar'?'NORA / SERVICE KEY':'MAYOR / PERMIT',[0,2.1,0],d.id==='cellar'?1.65:2.5,.45,'#826449',g,Math.PI);return {d,g};});
 // Flush static pieces in shared material/shape batches.
 for(const b of buckets.values()){const m=new T.InstancedMesh(b.geometry,b.material,b.items.length);b.items.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=!low;m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);}
 function actor(def,isCat=false){
  const g=new T.Group();scene.add(g);const moving=[];
  const make=(shape,pos,scale,color,parent=g)=>{const m=new T.Mesh(geos[shape],mat(color));m.position.set(...pos);m.scale.set(...scale);m.castShadow=!low;parent.add(m);return m;};
  if(isCat){
   make('sphere',[0,.34,0],[.23,.23,.40],def.color);const head=make('sphere',[0,.58,.34],[.21,.20,.20],def.color);
   for(const side of[-1,1]){make('cone',[side*.13,.79,.34],[.11,.24,.09],def.color);make('sphere',[side*.08,.61,.50],[.032,.045,.021],'#b0bf73');for(const z of[-.22,.23])make('sphere',[side*.14,.14,z],[.065,.17,.07],def.color);}
   make('sphere',[0,.54,.54],[.037,.028,.025],'#b6807c');const tail=make('ring',[0,.52,-.40],[.27,.48,.28],def.color);moving.push(tail);
  }else{
   make('cyl',[0,1.06,0],[.24,.58,.18],def.coat);
   const head=new T.Group();head.position.y=1.63;g.add(head);make('sphere',[0,0,0],[.175,.215,.17],def.skin,head);make('sphere',[0,.112,-.033],[.18,.15,.167],def.hair,head);
   for(const side of[-1,1]){make('sphere',[side*.071,.015,.152],[.023,.018,.022],'#29343b',head);make('sphere',[side*.17,-.02,0],[.035,.06,.04],def.skin,head);}
   make('sphere',[0,-.014,.182],[.032,.045,.032],def.skin,head);
   if(['police','engineer'].includes(def.style)){make('cyl',[0,.19,0],[.19,.1,.185],def.coat,head);make('box',[0,.145,.13],[.36,.035,.25],def.coat,head);}
   if(def.style==='mage')make('cone',[0,.45,-.02],[.21,.46,.20],def.coat,head);
   if(def.style==='mayor')make('box',[.10,1.13,.195],[.06,.43,.022],'#d0b37a');
   if(def.style==='apron')make('box',[0,1.0,.19],[.33,.57,.035],'#e5d3b8');
   for(const side of[-1,1]){
    const arm=new T.Group();arm.position.set(side*.30,1.25,0);g.add(arm);make('cyl',[0,-.19,0],[.080,.41,.077],def.coat,arm);make('sphere',[0,-.43,0],[.071,.10,.065],def.skin,arm);moving.push(arm);
    const leg=new T.Group();leg.position.set(side*.12,.75,0);g.add(leg);make('cyl',[0,-.32,0],[.09,.65,.09],'#3a4d53',leg);make('sphere',[0,-.67,.056],[.10,.08,.16],'#3d3731',leg);moving.push(leg);
   }
   g.userData.head=head;
  }
  const name=sign(def.name,[0,isCat?1.15:2.18,0],isCat?1.0:2.25,isCat?.28:.45,def.style==='police'?'#315574':'#274b51',g);name.visible=false;
  return {g,def,moving,name,isCat};
 }
 const actors=[...PEOPLE.map(p=>actor(p)),...CITIZENS.map(p=>actor(p)),...CATS.map(p=>actor(p,true))];
 const craft=new T.Group();scene.add(craft);const rotors=[];
 function craftPart(shape,pos,scale,color,rotation=[0,0,0]){const m=new T.Mesh(geos[shape],mat(color,'metal'));m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rotation);m.castShadow=!low;craft.add(m);return m;}
 craftPart('sphere',[0,.4,0],[1.08,.45,1.95],'#715e4b');
 craftPart('box',[0,.92,.35],[.95,.30,.85],'#d7b779');craftPart('box',[0,1.16,.64],[.95,.65,.16],'#456979');
 craftPart('box',[0,1.14,-.8],[1.22,.19,.56],'#557b85');
 for(const side of[-1,1]){
  craftPart('sphere',[side*1.1,2.32,0],[.66,.70,2.1],'#dfcfa4');
  for(const z of[-1.25,0,1.25])craftPart('ring',[side*1.1,2.32,z],[.69,.73,.69],'#98784d');
  craftPart('cyl',[side*.8,1.42,0],[.035,1.65,.035],'#bfa875',[0,0,side*-.2]);
  for(const z of[-1.1,1.1]){craftPart('cyl',[side*1.6,.86,z],[.17,.25,.17],'#416975');const rotor=craftPart('box',[side*1.6,1.02,z],[1.3,.04,.11],'#5a4637');rotors.push(rotor);}
 }
 craftPart('cone',[0,.67,2.02],[.50,.9,.3],'#976846',[Math.PI/2,0,0]);sign('K E S T R E L',[0,.70,1.87],1.55,.28,'#415764',craft);
 let lastRoom=null;
 return {update(s,dt,menu=false,reduced=false){
  for(const {d,g}of gateMeshes)g.visible=!s.city.flags.includes(d.requires);
  propGroups.get('pump-fuse').visible=!s.city.flags.includes('fuse');
  for(const [id,g]of propGroups)if(g.userData.ring){g.userData.ring.rotation.y=reduced?0:s.time*.6;g.userData.jewel.scale.setScalar(s.city.flags.includes('glyph-solved')?1.12:1);}
  for(const a of actors){
   const loc=a.def.route?citizenPose(a.def,s.time):a.isCat?catPosition(a.def,s):a.def;
   a.g.position.set(loc.x,loc.y,loc.z);a.g.rotation.y=loc.yaw||0;const d=Math.hypot(s.p.x-loc.x,s.p.y-loc.y,s.p.z-loc.z);a.g.visible=d<(low?65:115)||menu;
   a.name.visible=!menu&&d<8;a.name.lookAt(camera.getWorldPosition(new T.Vector3()));if(a.g.userData.head&&d<5)a.g.userData.head.rotation.y=Math.atan2(s.p.x-loc.x,s.p.z-loc.z)-(loc.yaw||0);
   a.moving.forEach((m,i)=>{if(a.isCat)m.rotation.y=reduced?0:Math.sin(s.time*2)*.18;else m.rotation.x=a.def.route&&!reduced?Math.sin(s.time*5+(i%2?Math.PI:0))*.32:Math.sin(s.time*.9+i)*.035;});
  }
  craft.position.set(s.skiff.x,s.skiff.y,s.skiff.z);craft.rotation.y=-s.skiff.yaw;craft.visible=true;rotors.forEach((r,i)=>r.rotation.y+=dt*(s.p.vehicle?40:3)*(i%2?-1:1));
 }};
}
