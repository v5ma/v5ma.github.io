/* Original low-poly sculpture and architecture inspired by gothic forms.
 * No models, textures, characters or symbols copied from the reference game. */
(function(root){'use strict';
 const previous=VesperArt.create;
 VesperArt.create=function(T,scene){
  const kit=previous(T,scene),baseEnemy=kit.enemy,baseWorld=kit.world,baseDispose=kit.dispose;
  const iron='#adb6b9',dark='#222c39',gold='#c5a76a',bone='#c8c1af';
  const geo=kit.geos;
  geo.mantle=new T.LatheGeometry([[0,-.98],[.40,-.94],[.36,-.55],[.25,-.05],[.31,.26],[.24,.37],[0,.40]].map(p=>new T.Vector2(...p)),16);
  geo.helmet=new T.LatheGeometry([[0,.39],[.22,.42],[.25,.55],[.25,.76],[.16,.88],[0,.93]].map(p=>new T.Vector2(...p)),16);
  geo.bell=new T.LatheGeometry([[0,.62],[.20,.62],[.28,.42],[.38,0],[.62,-.4],[.75,-.48],[.72,-.56],[.57,-.46],[.32,-.04],[.18,.45],[0,.45]].map(p=>new T.Vector2(...p)),24);
  const wing=new T.Shape();wing.moveTo(0,0);wing.bezierCurveTo(.42,.7,1.25,1.15,1.6,.85);wing.lineTo(1.28,.15);wing.lineTo(1.06,.5);wing.lineTo(.84,-.03);wing.lineTo(.6,.33);wing.lineTo(.33,-.18);wing.lineTo(0,0);geo.wing=new T.ShapeGeometry(wing,8);
  geo.disk=new T.CircleGeometry(1,32);geo.facet=new T.OctahedronGeometry(1,0);
  function materialMesh(geometry,material,parent,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  function enemy(kind){
   const d=VesperBestiary.catalog[kind];if(!d)return baseEnemy(kind);
   const g=new T.Group(),b=new kit.Batch(),parts={},robe=['hexer','alchemist','abbess','leech','mirror','widow'].includes(kind),cloth=d.color;
   g.name=d.name;const box=(c,x,y,z,w,h,depth)=>b.add('box',c,x,y,z,w,h,depth),ball=(c,x,y,z,w,h,depth)=>b.add('ball',c,x,y,z,w,h,depth);
   if(robe){materialMesh(geo.mantle,kit.mat(cloth),g);ball(cloth,0,.45,-.05,.30,.36,.25);ball(bone,0,.62,.09,.17,.23,.15);box(dark,0,.70,.235,.25,.035,.02);box(gold,0,.15,.27,.06,.65,.035);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;b.add('cone',i%2?dark:cloth,Math.sin(a)*.21,-.48,Math.cos(a)*.21,.085,.94,.055,0,a,.07*Math.sin(a));}
    if(kind==='abbess'||kind==='widow')for(const side of[-1,1]){box('#2c2739',side*.19,.38,.09,.09,.58,.10);b.add('cone',dark,side*.28,-.39,-.1,.08,1.15,.04,0,0,side*.24);}
    if(kind==='leech'){b.add('ring',gold,0,1.0,-.04,.34,.34,.34,0,0,0,.7);ball('#b9ebc4',0,.26,.30,.08,.09,.04);}
   }else{
    const wide=kind==='colossus'?1.48:1;
    ball(cloth,0,.03,0,.35*wide,.48,.26*wide);box(iron,0,.09,.07,.53*wide,.56,.30);materialMesh(geo.helmet,kit.mat(kind==='gargoyle'?'#8b918a':iron,.65),g);
    box(dark,0,.66,.249,.31,.041,.025);box(gold,0,.52,.255,.035,.22,.03);box(cloth,0,-.45,.12,.38,.57,.10);
    for(const side of[-1,1]){ball(iron,side*.39*wide,.26,0,.20,.17,.23);box(gold,side*.40*wide,.26,.19,.25,.043,.04);}
    if(kind==='colossus'){box(gold,0,-.12,.28,.78,.16,.05);for(const side of[-1,1])b.add('cone',gold,side*.54,.66,-.07,.13,.65,.10,0,0,-side*.28);box('#d4bea0',0,.12,.28,.21,.42,.04);}
    if(kind==='archer'){ball('#695447',0,.62,-.04,.285,.34,.27);box(dark,0,.66,.249,.30,.12,.023);for(let j=0;j<5;j++)b.add('cylinder',gold,.26+j*.025,.23,-.30,.012,1.02,.012,.2,0,-.2);}
   }
   for(const side of[-1,1]){
    const arm=new T.Group();arm.position.set(side*(kind==='colossus'?.55:.32),.26,0);g.add(arm);kit.mesh('cylinder',robe?cloth:iron,arm,side*.025,-.19,.03,.085,.39,.09,-side*.12);kit.mesh('ball',bone,arm,side*.065,-.42,.05,.066,.088,.055);parts[side<0?'leftArm':'rightArm']=arm;
    const leg=new T.Group();leg.position.set(side*.17,-.36,0);g.add(leg);kit.mesh('cylinder',robe?dark:iron,leg,0,-.24,0,.095,.46,.11);kit.mesh('box',dark,leg,0,-.59,.08,.18,.15,.30);parts[side<0?'leftLeg':'rightLeg']=leg;
   }
   const weapon=new T.Group();parts.rightArm.add(weapon);weapon.position.set(.08,-.43,.06);parts.weapon=weapon;
   if(kind==='lancer'){kit.mesh('cylinder','#594638',weapon,0,.35,0,.024,2.65,.024);kit.mesh('cone',iron,weapon,0,1.80,0,.095,.42,.06);kit.mesh('box',gold,weapon,0,1.54,0,.24,.045,.055);}
   else if(kind==='duelist'){for(const a of[parts.leftArm,parts.rightArm]){kit.mesh('box',iron,a,.05,-.73,.13,.075,.63,.025);kit.mesh('box',gold,a,.05,-.42,.13,.26,.04,.08);}}
   else if(kind==='archer'){const bow=kit.bow();weapon.add(bow.group);bow.group.scale.setScalar(.72);bow.group.rotation.z=.2;}
   else if(kind==='gaoler'){for(let j=0;j<9;j++){const m=kit.mesh('ring',iron,weapon,Math.sin(j*.7)*.03,-j*.09,0,.075,.07,.075);m.rotation.y=j%2*Math.PI/2;}kit.mesh('ball',iron,weapon,0,-.88,0,.17,.20,.17);}
   else if(kind==='colossus'){kit.mesh('cylinder',dark,weapon,0,.18,0,.04,1.5,.04);kit.mesh('box',gold,weapon,0,.96,0,.75,.43,.42);kit.mesh('box',bone,weapon,0,.99,.23,.41,.18,.055);}
   else if(kind==='alchemist'){kit.mesh('ball','#c87939',weapon,0,.13,0,.17,.22,.15);kit.mesh('cylinder',gold,weapon,0,.35,0,.055,.12,.055);parts.flame=kit.mesh('facet','#ffbf6f',weapon,0,.51,0,.05,.13,.05);parts.flame.material=kit.mat('#ffbd6e',0,true);}
   else if(robe){kit.mesh('cylinder',dark,weapon,0,.36,0,.024,1.8,.024);kit.mesh('ring',gold,weapon,0,1.23,0,.20,.27,.20);parts.flame=kit.mesh('facet',cloth,weapon,0,1.23,0,.10,.18,.10);parts.flame.material=kit.mat(cloth,0,true);if(kind==='hexer')for(const side of[-1,1])kit.mesh('box',gold,weapon,side*.15,1.23,0,.02,.36,.02);}
   if(kind==='mirror'){const shield=new T.Group();shield.position.set(0,0,.78);g.add(shield);materialMesh(geo.disk,kit.mat('#cccae9',.92),shield,0,0,0,.53,.53,1);kit.mesh('ring',gold,shield,0,0,.025,.53,.53,.53);parts.guard=shield;}
   if(kind==='gargoyle'){
    parts.wings=[];for(const side of[-1,1]){const w=new T.Group();w.position.set(side*.22,.35,-.12);g.add(w);const mat=kit.mat('#777f7b',.12);mat.side=T.DoubleSide;materialMesh(geo.wing,mat,w,0,0,0,side,1,1);parts.wings.push(w);for(let j=0;j<4;j++)b.add('cone',iron,side*(.15+j*.08),.88-j*.035,-.08,.043,.36,.043,0,0,-side*.3);}
   }
   for(const side of[-1,1])ball('#e6dfbe',side*.066,.674,.247,.018,.017,.01);
   b.finish(g);
   const ring=kit.mesh('ring',cloth,g,0,-1.015,0,.66,.66,.66);ring.rotation.x=-Math.PI/2;ring.material=kit.mat(cloth,0,true);parts.ring=ring;
   const plate=new T.Group();g.add(plate);plate.position.y=1.2;kit.label(plate,d.name.toUpperCase(),0,.09,0,2.05,.23,'#14212c','#e4d8bd');kit.mesh('box',dark,plate,0,-.05,0,1.25,.05,.02);parts.hp=kit.mesh('box',cloth,plate,0,-.05,.02,1.25,.05,.025);parts.plate=plate;
   const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:cloth,transparent:true,opacity:.8}));line.frustumCulled=false;g.add(line);parts.warning=line;g.userData.dominion=parts;return g;
  }
  function floorTexture(style){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#777b78';c.fillRect(0,0,512,512);for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   c.fillStyle=(x+y)%2?(style===1?'#373a47':'#323e43'):(style===1?'#beb3a4':'#d5d4c8');c.fillRect(x*64+2,y*64+2,60,60);
   if(style===2){c.strokeStyle='#9b906c';c.lineWidth=3;c.beginPath();c.moveTo(x*64+32,y*64+9);c.lineTo(x*64+55,y*64+32);c.lineTo(x*64+32,y*64+55);c.lineTo(x*64+9,y*64+32);c.closePath();c.stroke();}
   c.strokeStyle='rgba(24,34,39,.12)';c.lineWidth=1;for(let j=0;j<4;j++){c.beginPath();c.moveTo(x*64+9+j*11,y*64+7);c.lineTo(x*64+16+j*10,y*64+43+j*3);c.stroke();}
  }const data=c.getImageData(0,0,512,512),tex=new T.DataTexture(data.data,512,512);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.anisotropy=4;tex.needsUpdate=true;return new T.MeshStandardMaterial({map:tex,roughness:.62,metalness:.12});}
  const floors=[floorTexture(0),floorTexture(1),floorTexture(2)],plane=new T.PlaneGeometry(1,1);geo.dominionPlane=plane;
  function world(model){if(model.ar){const group=new T.Group(),arena=new T.Group();group.add(arena);arena.position.set(...model.arOrigin);arena.rotation.y=model.arYaw;const gate=new T.Group();arena.add(gate);gate.position.set(0,2.1,-6);kit.mesh('ring','#b8d9cd',gate,0,0,0,2.6,2.6,2.6);kit.mesh('ring',gold,gate,0,0,0,2.4,2.4,2.4);const boundary=kit.mesh('ring','#a9d8cc',arena,0,.03,-3.8,3.1,3.1,3.1);boundary.rotation.x=-Math.PI/2;for(const p of model.targets){const target=new T.Group();group.add(target);target.position.set(...p);kit.mesh('ring',gold,target,0,0,0,.48,.48,.48);kit.mesh('ball','#99d6c7',target,0,0,0,.22,.22,.05);}return {group,gate,instances:5};}const result=baseWorld(model);if(!model.dominions)return result;const own=new T.Group();own.name='Hollow Dominions / original decorative meshes';result.group.add(own);result.group.userData.dominionArt=own;
   for(const r of model.rooms.filter(r=>r.outer)){
    const group=new T.Group();group.position.set(r.x,0,r.z);group.name=r.label;own.add(group);const floor=materialMesh(plane,floors[r.style],group,0,.018,0,r.w-.55,r.d-.55,1);floor.rotation.x=-Math.PI/2;
    const b=new kit.Batch(),accent=r.style===1?'#bb7653':r.style===2?'#8da9a2':gold;
    // Buttress fins, carved pinnacles, and a distinctive suspended bell.
    for(const side of[-1,1])for(const end of[-1,1]){
     const x=side*(r.w/2+.4),z=end*(r.d/2-.4),height=r.style===1?15:19;
     b.add('cylinder','#a6afaa',x,6.5,z,.47,13,.47);b.add('cone','#627576',x,13+(height-13)/2,z,.92,height-13,.92);
     for(let j=0;j<3;j++)b.add('ring',accent,x,10+j*.65,z,.49,.49,.49,Math.PI/2,0,0,.5);
    }
    if(['procession','observatory','eclipse','foundry'].includes(r.planFamily)){
     const bell=materialMesh(geo.bell,kit.mat(accent,.78),group,0,8.1,0,1.35,1.35,1.35);bell.name='Cast bell';b.add('cylinder',dark,0,9.65,0,.06,2,.06);b.add('ball',gold,0,7.28,0,.16,.2,.16);
     for(const side of[-1,1])kit.beam(b,[side*4,7.5,0],[0,10.8,0],.17,'#c2c8bf');
    }
    if(['sepulchre','roost','vault','apse'].includes(r.planFamily))for(const side of[-1,1]){
     const x=side*(r.w/2-1.15),z=r.d/2-1.2;b.add('cylinder','#8e9998',x,.52,z,.58,1.04,.58);b.add('cone',bone,x,1.65,z,.37,1.5,.31);b.add('ball',bone,x,2.65,z,.21,.27,.22);
     for(const sign of[-1,1]){b.add('cone',bone,x+sign*.55,2.27,z-.13,.2,1.65,.08,0,0,-sign*.75);kit.beam(b,[x+sign*.12,2.34,z],[x+sign*.57,1.98,z+.16],.10,bone);}
    }
    if(r.style===1){for(const side of[-1,1])for(const z of[-6,6]){b.add('cylinder',dark,side*8,1.65,z,.11,3.3,.11);b.add('cone',gold,side*8,3.4,z,.27,.4,.27,Math.PI);b.add('ball','#ff9d54',side*8,3.8,z,.10,.35,.10,0,0,0,0,true);}}
    if(r.planFamily==='orchard'||r.planFamily==='choir-garden'){for(const side of[-1,1]){const x=side*8,z=-7;kit.beam(b,[x,0,z],[x+.2,5.7,z],.15,dark);for(let j=0;j<5;j++){const angle=j*2.4;kit.beam(b,[x,2.3+j*.5,z],[x+Math.sin(angle)*1.5,4.2+j*.4,z+Math.cos(angle)*1.2],.065,dark);}}}
    b.finish(group);
   }return result;
  }
  function dispose(group){const own=group.userData.dominionArt;if(own){own.traverse(o=>{if(o.isInstancedMesh)o.dispose();});own.removeFromParent();}baseDispose(group);}
  return {...kit,enemy,world,dispose};
 };
 function install(g){
  const T=g.T,C=VesperCore,$=id=>document.getElementById(id),old=g.visuals.bind(g),q=new T.Quaternion(),v=new T.Vector3(),local=new T.Quaternion();let seen=null,last=0,staticMeshes=[],lastCull=-1;
  const root=new T.Group();root.name='Bounded combat telegraphs';g.scene.object3D.add(root);const hazards=[];for(let i=0;i<12;i++){const m=new T.Mesh(new T.RingGeometry(.92,1,40),new T.MeshBasicMaterial({color:'#ffbb70',transparent:true,opacity:.68,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;root.add(m);hazards.push(m);}
  g.visuals=function(dt){old(dt);const s=g.game,active=g.running&&!g.paused;
   if(s!==seen){seen=s;last=0;lastCull=-1;staticMeshes=[];g.worldArt.group.updateMatrixWorld(true);g.worldArt.group.traverse(o=>{if(o.isMesh&&o.geometry&&o!==g.worldArt.gate){o.geometry.computeBoundingSphere();const sphere=(o.isInstancedMesh?o.boundingSphere:o.geometry.boundingSphere)?.clone();if(sphere){sphere.applyMatrix4(o.matrixWorld);staticMeshes.push({mesh:o,sphere});}}});}
   g.head.object3D.getWorldQuaternion(q);
   for(let i=0;i<g.enemyMeshes.length;i++){
    const m=g.enemyMeshes[i],e=s.world.enemies[i],p=m.userData.dominion;if(!p)continue;
    m.visible=!e.dead&&C.len(C.sub(e.p,s.p))<(g.xr?48:70);if(!m.visible)continue;m.scale.setScalar(1);m.position.set(...e.p);if(e.facing)m.rotation.y=Math.atan2(e.facing[0],e.facing[2]);
    const stride=e.phase==='hunting'||e.phase==='charging'?Math.sin(s.time*(e.charge?18:7))*.4:0,wind=e.wind>0;
    p.leftLeg.rotation.x=stride;p.rightLeg.rotation.x=-stride;p.leftArm.rotation.x=wind?-1.1:-stride;p.rightArm.rotation.x=wind?-1.2:e.combo>0?-1.8:stride;
    if(p.wings)for(let j=0;j<2;j++)p.wings[j].rotation.y=(j?1:-1)*(wind?.6:.18+Math.sin(s.time*4)*.12);
    if(p.guard)p.guard.visible=VesperBestiary.guardActive(e);
    p.ring.visible=active&&(wind||e.frozen>0||e.recovery>0);p.ring.scale.setScalar(wind?.74+Math.sin(s.time*12)*.05:.65);p.ring.material=g.art.mat(e.frozen>0?'#a3e5ee':e.recovery>0?'#a9dcba':VesperBestiary.catalog[e.kind].color,0,true);
    const clear=active&&C.len(C.sub(e.p,s.head))<22&&!C.segmentBlocked(s.world,s.head,C.add(e.p,[0,.62,0]));p.plate.visible=clear;p.plate.quaternion.copy(local.copy(m.quaternion).invert().multiply(q));p.hp.scale.x=1.25*Math.max(0,e.hp/e.maxHp);p.hp.position.x=-.625*(1-e.hp/e.maxHp);
    p.warning.visible=clear&&wind&&!!e.aim;if(p.warning.visible){m.updateMatrixWorld(true);v.fromArray(e.aim);m.worldToLocal(v);const a=p.warning.geometry.attributes.position;a.setXYZ(0,0,.45,0);a.setXYZ(1,v.x,v.y,v.z);a.needsUpdate=true;}
   }
   hazards.forEach((m,i)=>{const h=s.hazards?.[i];m.visible=!!h;if(h){m.position.set(h.p[0],h.p[1]+.035,h.p[2]);m.scale.setScalar(h.radius);m.material.opacity=.4+.3*Math.sin(s.time*22);}});
   if(active){s.discovered.add(C.roomAt(s.world,s.p));for(const e of s.events)if(e.seq>last&&e.type==='kill')s.orders.add(e.kind);
    const relics=s.world.pickups.filter(p=>p.kind==='relic'&&p.taken).length,outer=[...s.discovered].filter(id=>s.world.rooms[id]?.outer).length,orders=[...s.orders].filter(k=>VesperBestiary.catalog[k]).length;
    for(const event of s.events)if(event.seq>last&&event.type==='side-expedition')g.toast('Side expedition complete: '+event.key+' / +200 score, healing and arrows.');
    const el=$('expedition-progress');if(el)el.textContent='OUTER DISTRICTS '+outer+'/16  |  SEALS '+Math.min(8,relics)+'/8  |  ORDERS '+orders+'/12';
   }
   last=s.eventSeq||0;
   // Render-distance culling changes visibility only, never simulation geometry.
   if(s.time-lastCull>.3||lastCull<0){lastCull=s.time;const eye=new T.Vector3(...s.p),range=g.xr?48:70;for(const {mesh,sphere}of staticMeshes)mesh.visible=eye.distanceTo(sphere.center)<range+sphere.radius;}
  };
  return {dispose(){for(const m of hazards){m.geometry.dispose();m.material.dispose();}root.removeFromParent();}};
 }
 root.DominionArt=Object.freeze({install});
})(globalThis);
