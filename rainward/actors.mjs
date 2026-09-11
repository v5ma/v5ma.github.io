/* Rainward original survivor rig. The body is a real weighted SkinnedMesh,
 * not a chain of capsules. No commercial character or animation is embedded. */
import * as T from './vendor/three.module.js';
const caches=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function textile(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#b7b4ab';x.fillRect(0,0,128,128);
 for(let y=0;y<128;y+=2)for(let n=0;n<128;n+=2){const v=150+((n*17+y*13)%53);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(n,y,1,2);}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,4);t.colorSpace=T.SRGBColorSpace;return t;
}
function bodyGeometry(enemy,role){
 const names=['hips','spine','chest','neck','head','armL','elbowL','handL','armR','elbowR','handR','legL','kneeL','footL','legR','kneeR','footR'];
 const bind=[[0,.94,0],[0,1.105,0],[0,1.325,0],[0,1.50,0],[0,1.61,0],[-.244,1.415,0],[-.262,1.115,0],[-.276,.855,-.008],[.244,1.415,0],[.262,1.115,0],[.276,.855,-.008],[-.103,.92,0],[-.105,.49,0],[-.105,.105,0],[.103,.92,0],[.105,.49,0],[.105,.105,0]];
 const parent=[-1,0,1,2,3,2,5,6,2,8,9,0,11,12,0,14,15];
 const pieces=Array.from({length:5},()=>[]),tmp=new T.Matrix4(),q=new T.Quaternion(),one=new T.Vector3(1,1,1);
 const rigid=i=>()=>[[i,1]];
 const blend=(a,b,v)=>[[a,1-v],[b,v]];
 const torsoWeight=y=>y<1.04?rigid(0)():y<1.24?blend(0,1,clamp((y-1.04)/.12,0,1)):blend(1,2,clamp((y-1.24)/.11,0,1));
 function put(g,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],weight=rigid(0)){
  g=g.toNonIndexed();tmp.compose(new T.Vector3(...position),q.setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));g.applyMatrix4(tmp);
  pieces[material].push({g,weight});
 }
 const box=(p,s,m,b,r=[0,0,0])=>put(new T.BoxGeometry(1,1,1),m,p,s,r,rigid(b));
 const ellipsoid=(p,s,m,b)=>put(new T.SphereGeometry(1,12,8),m,p,s,[0,0,0],rigid(b));
 function loft(rings,material,weight,segments=20){
  const pos=[],uv=[],idx=[];
  rings.forEach(([y,cx,cz,rx,rz],j)=>{for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2;pos.push(cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uv.push(k/segments,j/(rings.length-1));}});
  for(let j=0;j<rings.length-1;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();put(g,material,[0,0,0],[1,1,1],[0,0,0],weight);
 }
 // Tailored jacket: hips, waist, ribs, shoulders and collar are a continuous surface.
 loft([[.825,0,.008,.179,.117],[.86,0,.009,.182,.12],[.94,0,0,.172,.118],[1.08,0,0,.158,.105],[1.24,0,0,.181,.116],[1.35,0,0,.216,.123],[1.41,0,.003,.219,.108],[1.475,0,.012,.146,.081],[1.48,0,.012,.07,.07]],0,(_,y)=>torsoWeight(y),24);
 loft([[1.47,0,0,.061,.055],[1.57,0,0,.060,.058],[1.59,0,0,.060,.06]],1,rigid(3),16);
 // Face with a narrow jaw, cheek plane, brow and crown. Front is negative Z.
 loft([[1.55,0,-.024,.041,.046],[1.575,0,-.011,.061,.067],[1.60,0,-.004,.079,.077],[1.64,0,0,.087,.090],[1.68,0,.002,.085,.091],[1.735,0,.005,.081,.082],[1.775,0,.005,.052,.058],[1.79,0,.005,.006,.013]],1,rigid(4),28);
 ellipsoid([0,1.67,-.088],[.014,.032,.025],1,4);ellipsoid([0,1.645,-.101],[.018,.012,.018],1,4);
 ellipsoid([0,1.608,-.083],[.033,.005,.005],3,4);
 for(const side of[-1,1]){
  ellipsoid([side*.086,1.657,.0],[.014,.023,.016],1,4);
  ellipsoid([side*.033,1.682,-.086],[.023,.012,.007],3,4);
  ellipsoid([side*.033,1.682,-.091],[.013,.008,.004],4,4);
  ellipsoid([side*.033,1.683,-.095],[.004,.005,.003],3,4);
  box([side*.034,1.699,-.086],[.042,.007,.005],3,4,[0,0,side*.06]);
 }
 // Hair follows the cranium rather than a giant helmet. Hero has a tied braid.
 loft([[1.69,0,.026,.087,.077],[1.725,0,.018,.086,.086],[1.766,0,.012,.063,.071],[1.798,0,.013,.002,.009]],3,rigid(4),24);
 ellipsoid([-.047,1.724,-.06],[.044,.051,.035],3,4);
 if(!enemy){ellipsoid([0,1.679,.095],[.040,.04,.045],3,4);for(let i=0;i<6;i++)ellipsoid([.018*Math.sin(i),1.65-i*.027,.118+i*.009],[.018-i*.0014,.026,.018-i*.0014],3,4);}
 if(role==='sentinel'){ellipsoid([0,1.737,.01],[.106,.079,.108],2,4);box([0,1.72,-.092],[.20,.035,.04],2,4);}
 if(role==='drifter'){box([0,1.63,-.086],[.135,.072,.038],2,4);for(let i=0;i<6;i++)box([-.05+i*.02,1.634,-.109],[.006,.023,.006],4,4);}
 for(const side of[-1,1]){
  const arm=side<0?5:8,elbow=arm+1,hand=arm+2,leg=side<0?11:14,knee=leg+1,foot=leg+2;
  const armWeight=(_,y)=>y>1.19?rigid(arm)():y>1.075?blend(arm,elbow,clamp((1.19-y)/.115,0,1)):rigid(elbow)();
  loft([[.89,side*.273,0,.044,.042],[1.04,side*.268,0,.051,.048],[1.115,side*.262,0,.060,.055],[1.24,side*.254,0,.066,.062],[1.37,side*.243,0,.077,.071],[1.431,side*.228,0,.054,.055]],0,armWeight,16);
  box([side*.273,.90,0],[.105,.035,.098],2,elbow);
  ellipsoid([side*.278,.827,-.012],[.041,.068,.026],1,hand);
  for(let i=0;i<4;i++)ellipsoid([side*(.255+i*.014),.780,-.015],[.007,.032,.009],1,hand);
  ellipsoid([side*.242,.827,-.026],[.013,.029,.013],1,hand);
  const legWeight=(_,y)=>y>.565?rigid(leg)():y>.43?blend(leg,knee,clamp((.565-y)/.135,0,1)):rigid(knee)();
  loft([[.16,side*.105,0,.061,.061],[.31,side*.105,0,.067,.067],[.48,side*.105,0,.076,.074],[.56,side*.105,0,.082,.079],[.75,side*.103,0,.09,.088],[.91,side*.103,0,.101,.097]],2,legWeight,20);
  // Fabric knee patches, cargo pockets, rounded boot uppers and deep soles.
  box([side*.108,.498,-.073],[.112,.12,.019],0,knee);
  box([side*.192,.73,.015],[.036,.145,.115],0,leg);
  ellipsoid([side*.105,.101,-.038],[.068,.095,.131],3,foot);
  box([side*.105,.032,-.047],[.135,.042,.236],3,foot);
  box([side*.105,.145,-.105],[.088,.025,.043],2,foot);
  for(let i=0;i<4;i++)box([side*.105,.132-i*.014,-.105-i*.008],[.087,.005,.007],4,foot);
  // Jacket seams, breast and hip pockets, and shoulder straps.
  box([side*.10,1.275,-.114],[.109,.123,.024],0,2);
  box([side*.12,.955,-.116],[.11,.046,.033],2,0);
  box([side*.129,1.262,-.133],[.034,.40,.021],2,2,[0,0,side*.08]);
 }
 for(let j=0;j<6;j++)box([0,1.02+j*.07,-.124],[.016,.013,.009],4,j<2?1:2);
 box([0,.902,-.118],[.30,.046,.025],3,0);box([.016,.9,-.135],[.052,.045,.014],4,0);
 // Rounded backpack, roll, straps, buckle and two distinct pockets.
 ellipsoid([0,1.19,.193],[.169,.225,.097],2,2);
 ellipsoid([0,1.38,.203],[.166,.08,.102],0,2);
 box([0,1.09,.276],[.235,.13,.028],0,2);
 for(const side of[-1,1]){box([side*.115,1.17,.283],[.027,.31,.018],3,2);box([side*.115,1.05,.302],[.045,.035,.012],4,2);}
 if(role==='sentinel'){box([0,1.29,-.15],[.37,.31,.065],2,2);for(let i=0;i<3;i++)box([-.115+i*.115,1.18,-.2],[.094,.14,.025],3,2);}
 const position=[],normal=[],uv=[],si=[],sw=[],groups=[];
 for(let mat=0;mat<pieces.length;mat++){const start=position.length/3;for(const {g,weight}of pieces[mat]){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){position.push(p.getX(i),p.getY(i),p.getZ(i));normal.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u?.getX(i)||0,u?.getY(i)||0);const weights=weight(p.getX(i),p.getY(i),p.getZ(i));for(let j=0;j<4;j++){si.push(weights[j]?.[0]||0);sw.push(weights[j]?.[1]||0);}}g.dispose();}groups.push([start,position.length/3-start,mat]);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));groups.forEach(g=>geometry.addGroup(...g));geometry.computeBoundingSphere();
 return {geometry,bind,parent,names};
}
export function actor(scene,mesh,color,enemy=false,role='watcher'){
 let cache=caches.get(scene);if(!cache){cache={geometries:new Map(),fabric:textile()};caches.set(scene,cache);}const key=enemy?role:'survivor';if(!cache.geometries.has(key))cache.geometries.set(key,bodyGeometry(enemy,role));const data=cache.geometries.get(key);
 const coat=enemy?(role==='raider'?0x78645a:role==='marksman'?0x566154:role==='sentinel'?0x525c60:color):0x748473;
 const materials=[new T.MeshStandardMaterial({color:coat,map:cache.fabric,roughness:.94}),new T.MeshStandardMaterial({color:enemy?0xaa8870:0xc6a38a,roughness:.68}),new T.MeshStandardMaterial({color:enemy?0x414941:0x444e47,map:cache.fabric,roughness:.92}),new T.MeshStandardMaterial({color:enemy?0x292b25:0x392b24,roughness:.86}),new T.MeshStandardMaterial({color:0xbebca9,roughness:.52,metalness:.14})];
 const root=new T.Group(),rig=new T.Group();root.name=enemy?'Rainward '+role:'Rainward survivor';root.add(rig);scene.add(root);
 const bones=data.names.map((name,i)=>{const b=new T.Bone();b.name=name;const p=data.parent[i],v=data.bind[i],from=p<0?[0,0,0]:data.bind[p];b.position.set(v[0]-from[0],v[1]-from[1],v[2]-from[2]);return b;});bones.forEach((b,i)=>{if(data.parent[i]>=0)bones[data.parent[i]].add(b);});
 const skin=new T.SkinnedMesh(data.geometry,materials);skin.name='Weighted survivor surface / 17 bone skeleton';skin.add(bones[0]);skin.bind(new T.Skeleton(bones));skin.castShadow=skin.receiveShadow=true;skin.frustumCulled=false;skin.boundingSphere=new T.Sphere(new T.Vector3(0,.9,0),2.4);rig.add(skin);
 // Weapon travels with the actual wrist. Its silhouette distinguishes rifle patrols.
 const weapon=new T.Group(),long=role==='marksman';const gunmat=new T.MeshStandardMaterial({color:0x343c3e,metalness:.65,roughness:.42});
 function part(size,at,material=gunmat){const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.set(...at);m.castShadow=true;weapon.add(m);return m;}
 if(role==='raider'){part([.048,.64,.048],[0,-.26,0]);part([.073,.32,.075],[0,-.41,0]);}else{part([.055,long?.59:.225,.08],[0,long?-.13:-.10,-.016]);part([.045,.095,.095],[0,.015,.024]);if(long){part([.049,.18,.07],[0,-.42,-.016]);part([.042,.085,.11],[0,-.08,.046]);part([.065,.13,.07],[0,.135,-.018]);}}bones[10].add(weapon);
 const tools=new T.Group(),club=new T.Mesh(new T.CylinderGeometry(.042,.025,.60,10),new T.MeshStandardMaterial({color:0x625445,roughness:.85})),blade=new T.Mesh(new T.BoxGeometry(.075,.38,.013),gunmat),longWeapon=new T.Group(),wrap=new T.Mesh(new T.BoxGeometry(.11,.06,.03),new T.MeshStandardMaterial({color:0xd3c9af,roughness:1}));
 club.position.y=-.24;blade.position.y=-.17;tools.add(club,blade,wrap);bones[10].add(tools);bones[10].add(longWeapon);
 for(const [size,at]of [[[.055,.65,.065],[0,-.16,0]],[[.033,.28,.033],[0,-.62,0]],[[.075,.24,.07],[0,.22,0]],[[.05,.1,.1],[0,-.1,.05]]]){const m=new T.Mesh(new T.BoxGeometry(...size),gunmat);m.position.set(...at);longWeapon.add(m);}
 tools.visible=longWeapon.visible=false;
 return {root,rig,skin,bones,weapon,tools,club,blade,wrap,longWeapon,role,enemy,gait:0,materials};
}
export function pose(a,p,time,enemy=false){
 const dt=a.lastTime===undefined?1/60:clamp(time-a.lastTime,0,.10);a.lastTime=time;const moving=Math.max(0,p.speed||0),stance=p.stance||'stand',crouch=stance==='crouch',prone=stance==='prone',aim=!!p.aim;
 a.gait+=moving*dt*(crouch?5.1:3.9);const step=Math.sin(a.gait),swing=Math.min(1,moving/2.2),breath=Math.sin(time*1.8)*.012;
 a.root.position.set(p.x,prone?.13:0,p.z);const delta=Math.atan2(Math.sin(p.yaw-a.root.rotation.y),Math.cos(p.yaw-a.root.rotation.y));a.root.rotation.y+=delta*(1-Math.exp(-dt*18));
 a.rig.rotation.set(prone?-Math.PI/2:0,0,0);a.rig.position.set(0,crouch?-.55:0,prone?.79:0);a.bones.forEach(b=>b.rotation.set(0,0,0));
 a.bones[0].position.y=.94+(prone?0:Math.cos(a.gait*2)*.014*swing);a.bones[1].rotation.x=crouch?.85:breath;a.bones[2].rotation.x=crouch?.15:breath*.6;
 a.bones[2].rotation.y=aim?-.09:step*.035*swing;a.bones[4].rotation.x=aim?-.055:-breath*.5;
 for(const side of[-1,1]){const leg=side<0?11:14,arm=side<0?5:8,s=side*step;
  a.bones[leg].rotation.x=(crouch?1.17:0)+s*swing*(crouch?.21:.50);a.bones[leg+1].rotation.x=(crouch?-2.385:-.04)-Math.max(0,-s)*swing*.72;a.bones[leg+2].rotation.x=crouch?1.215:Math.max(0,-s)*swing*.23;
  a.bones[arm].rotation.x=-s*swing*.34+.065;a.bones[arm+1].rotation.x=.12+Math.max(0,s)*swing*.12;
  if(aim){a.bones[arm].rotation.x=side>0?1.25:1.16;a.bones[arm+1].rotation.x=side>0?.34:.66;a.bones[arm].rotation.z=side>0?-.12:.46;a.bones[arm+1].rotation.z=side>0?-.08:.20;}
  if(prone){a.bones[leg].rotation.x=.025+s*swing*.045;a.bones[leg+1].rotation.x=-.04;a.bones[leg+2].rotation.x=-Math.PI/2;a.bones[arm].rotation.x=3.10+s*.025*swing;a.bones[arm+1].rotation.x=.08;}
 }
 if(p.phase==='windup'||(a.role==='raider'&&p.aimTime>.1)){a.bones[8].rotation.x=2.0;a.bones[9].rotation.x=.7;}
 a.weapon.visible=enemy?true:aim&&['pistol','rifle',undefined].includes(p.equipped);a.longWeapon.visible=!enemy&&aim&&p.equipped==='rifle';if(a.longWeapon.visible)a.weapon.visible=false;a.tools.visible=!enemy&&!!(p.melee||p.healing||p.craft);a.club.visible=!!p.melee&&p.melee.weapon==='club';a.blade.visible=!!p.melee&&p.melee.weapon==='blade';a.wrap.visible=!!(p.healing||p.craft);
 if(p.melee){const t=1-p.melee.left/p.melee.total;a.bones[2].rotation.y=Math.sin(t*Math.PI*2)*.4;a.bones[8].rotation.x=1.2+Math.sin(t*Math.PI)*1.0;a.bones[8].rotation.z=-.6*Math.sin(t*Math.PI);a.bones[9].rotation.x=.4;a.weapon.visible=false;}
 if(p.healing||p.craft){const t=time*8;a.bones[8].rotation.x=1.0;a.bones[8].rotation.z=-.45;a.bones[9].rotation.x=.7+Math.sin(t)*.15;a.bones[5].rotation.x=.8;a.bones[5].rotation.z=.45;a.bones[6].rotation.x=.9;a.bones[4].rotation.x=.22;a.weapon.visible=false;}
 if(p.reload){a.bones[5].rotation.x=1.1;a.bones[6].rotation.x=.8+Math.sin(time*9)*.18;a.weapon.visible=true;}
 if(p.vault){const f=Math.sin(Math.PI*clamp(p.vault.t/p.vault.duration,0,1));a.rig.position.y+=f*.95;a.bones[11].rotation.x+=f*.75;a.bones[14].rotation.x+=f*.5;}
 if(p.hp<=0){a.rig.rotation.set(0,0,-1.47);a.rig.position.set(0,.14,0);a.weapon.visible=false;a.tools.visible=false;a.longWeapon.visible=false;}
 a.root.updateMatrixWorld(true);a.skin.skeleton.update();
}
