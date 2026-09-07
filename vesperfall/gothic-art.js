/* Reference-led environment pass: original masonry, vaulted arcades and rose
 * glass. Static detail is instanced; textures are generated locally. Playable
 * architecture uses the same floors and solids as the simulation. */
(function(root){'use strict';
 const previous=VesperArt.create;
 function create(T,scene){
  const kit=previous(T,scene),stone=['#7b8589','#535f68','#a2aaa9'],gold='#b8a57a',dark='#39454f';
  const texCache=new Map();
  function texture(kind){if(texCache.has(kind))return texCache.get(kind);const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d'),random=VesperCore.rng(48219+(kind==='floor'?18:0));
   g.fillStyle=kind==='floor'?'#818587':'#9da1a1';g.fillRect(0,0,512,512);
   const rowH=kind==='floor'?32:64,colW=kind==='floor'?48:118;
   for(let y=-1;y<512/rowH+1;y++)for(let x=-1;x<512/colW+1;x++){const xx=x*colW+(y%2?colW/2:0),yy=y*rowH,v=Math.floor(135+random()*43);g.fillStyle=`rgb(${v},${v+3},${v+4})`;g.fillRect(xx+1,yy+1,colW-2,rowH-2);g.fillStyle='rgba(32,41,49,.4)';g.fillRect(xx,yy,colW,2);g.fillRect(xx,yy,2,rowH);g.fillStyle='rgba(232,232,218,.3)';g.fillRect(xx+3,yy+3,colW-6,1);
    for(let n=0;n<30;n++){const v=random()>.5?'rgba(5,17,23,.055)':'rgba(255,255,235,.065)';g.fillStyle=v;g.fillRect(xx+random()*colW,yy+random()*rowH,2+random()*9,1+random()*4);}
   }
   const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=2;texCache.set(kind,t);return t;
  }
  for(const c of stone){const m=kit.mat(c);m.map=texture('stone');m.bumpMap=m.map;m.bumpScale=.035;m.roughness=.9;}
  const floorColor='#a5aaa7',floorMat=kit.mat(floorColor);floorMat.map=texture('floor');floorMat.bumpMap=floorMat.map;floorMat.bumpScale=.018;floorMat.roughness=.84;
  const marble='#dad5bf';kit.mat(marble).roughness=.72;
  function box(b,c,x,y,z,w,h,d,ry=0){b.add('box',c,x,y,z,w,h,d,0,ry);}
  function line(b,a,c,width,color=stone[1]){kit.beam(b,a,c,width,color);}
  function pointed(b,x,y,z,w,h,rotation=0,weight=.2,color=stone[2]){
   const tr=p=>[x+p[0]*Math.cos(rotation),y+p[1],z-p[0]*Math.sin(rotation)];
   for(const side of[-1,1]){let last=[side*w,0];line(b,tr(last),tr([side*w,h*.56]),weight,color);last=[side*w,h*.56];for(let i=1;i<=18;i++){const t=i/18,angle=Math.acos(1/3)*t,p=[side*(-w/2+1.5*w*Math.cos(angle)),h*.56+h*.44*Math.sin(angle)/Math.sqrt(8/9)];line(b,tr(last),tr(p),weight,color);last=p;}}
  }
  function roseTexture(){if(texCache.has('rose'))return texCache.get('rose');const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.translate(256,256);g.fillStyle='#172936';g.beginPath();g.arc(0,0,249,0,7);g.fill();const palette=['#46888c','#8d7186','#b9956f','#6089a0','#4b647b','#b0b7a0'];
   for(let ring=0;ring<3;ring++){const count=ring===0?8:16,r=58+ring*74;for(let k=0;k<count;k++){const a=k/count*2*Math.PI+(ring%2?.1:0);g.save();g.rotate(a);g.translate(0,-r);g.fillStyle=palette[(k+ring*2)%palette.length];g.strokeStyle='#d2c6a4';g.lineWidth=3;g.beginPath();g.moveTo(0,-36);g.bezierCurveTo(38,-15,26,26,0,42);g.bezierCurveTo(-26,26,-38,-15,0,-36);g.fill();g.stroke();g.beginPath();g.moveTo(0,-30);g.lineTo(0,35);g.stroke();g.restore();}}
   for(const r of[25,106,179,240]){g.strokeStyle='#c5b997';g.lineWidth=5;g.beginPath();g.arc(0,0,r,0,7);g.stroke();}g.fillStyle='#c1d9c4';g.beginPath();g.arc(0,0,16,0,7);g.fill();const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;texCache.set('rose',t);return t;
  }
  const roseMat=new T.MeshBasicMaterial({map:roseTexture(),side:T.DoubleSide,toneMapped:false});
  const roseGeo=new T.CircleGeometry(1,48);
  function rose(parent,b,x,y,z,r,rotation){const m=new T.Mesh(roseGeo,roseMat);m.name='Original radial stained glass';m.position.set(x,y,z);m.rotation.y=rotation;m.scale.setScalar(r);parent.add(m);b.add('ring',gold,x,y,z,r*1.04,r*1.04,r*.7,0,rotation,0,.25);b.add('ring',stone[1],x,y,z+.02,r*1.12,r*1.12,r*1.5,0,rotation);}
  function pillar(b,x,z,height=6.6){box(b,stone[1],x,.18,z,.78,.36,.78);b.add('cylinder',stone[0],x,height/2,z,.24,height,.24);for(const dx of[-.19,.19])for(const dz of[-.19,.19])b.add('cylinder',stone[2],x+dx,height/2,z+dz,.075,height,.075);for(const y of[.4,height-.45])box(b,stone[1],x,y,z,.62,.2,.62);box(b,gold,x,height-.58,z,.55,.08,.55);box(b,stone[2],x,height-.2,z,.76,.3,.76);}
  function candle(b,x,y,z){b.add('cylinder',gold,x,y+.1,z,.055,.2,.055);b.add('cylinder','#e4d5b6',x,y+.3,z,.04,.2,.04);b.add('ball','#ffcb79',x,y+.45,z,.045,.12,.045,0,0,0,0,true);}
  function world(model){
   const group=new T.Group();group.name='Vesperfall / playable cathedral cloisters';const b=new kit.Batch(),random=VesperCore.rng(VesperCore.hash(model.seed));let roseCount=0;
   for(const f of model.floors){if(f.type==='stair'){
     const count=44;for(let i=0;i<count;i++){const z=f.z+f.d/2-(i+.5)*f.d/count,y=CloisterLayout.elevation(f,[f.x,0,z]);box(b,floorColor,f.x,y-.04,z,f.w,.08,f.d/count+.01);box(b,gold,f.x,y+.005,z-f.d/count*.35,f.w,.018,.035);}
     continue;
    }const mat=f.type==='gallery'?marble:floorColor;box(b,stone[1],f.x,f.y-.25,f.z,f.w,.5,f.d);box(b,mat,f.x,f.y-.022,f.z,f.w,.04,f.d);
    if(f.type==='bridge'){const along=f.w>f.d;for(const side of[-1,1]){for(let i=0;i<=8;i++){const a=-.5+i/8;const x=f.x+(along?a*(f.w-.2):side*(f.w/2-.18)),z=f.z+(along?side*(f.d/2-.18):a*(f.d-.2));box(b,stone[2],x,.38,z,.11,.76,.11);}const x=f.x+(along?0:side*(f.w/2-.18)),z=f.z+(along?side*(f.d/2-.18):0);box(b,stone[2],x,.82,z,along?f.w:.2,.16,along?.2:f.d);}}
   }
   for(const solid of model.solids){const p=solid.min.map((a,i)=>(a+solid.max[i])/2),size=solid.max.map((a,i)=>a-solid.min[i]);
    if(solid.type==='balustrade'){
     const wide=size[0]>size[2],n=Math.ceil((wide?size[0]:size[2])/.46);for(let j=0;j<=n;j++)box(b,stone[2],p[0]+(wide?(j/n-.5)*size[0]:0),p[1],p[2]+(wide?0:(j/n-.5)*size[2]),.09,size[1],.09);box(b,marble,p[0],solid.max[1],p[2],size[0]+.12,.14,size[2]+.12);continue;
    }
    if(solid.type==='column'){pillar(b,p[0],p[2],7.6);continue;}
    box(b,solid.type==='cover'?stone[1]:stone[0],...p,...size);
    box(b,stone[2],p[0],solid.max[1]+.035,p[2],size[0]+.13,.12,size[2]+.13);
    if(solid.type==='wall'){
     for(const y of[.22,2.75,6.85])box(b,stone[1],p[0],y,p[2],size[0]+.08,.11,size[2]+.08);
     const along=size[0]>size[2],count=Math.max(1,Math.floor((along?size[0]:size[2])/3.7));
     for(let k=0;k<count;k++){const shift=((k+.5)/count-.5)*(along?size[0]:size[2]),x=p[0]+(along?shift:0),z=p[2]+(along?0:shift);
      if(count>=3&&k===1)continue;
      const nearest=model.rooms.reduce((a,q)=>Math.hypot(q.x-x,q.z-z)<Math.hypot(a.x-x,a.z-z)?q:a,model.rooms[0]);const sign=along?Math.sign(nearest.z-z):Math.sign(nearest.x-x),xx=x+(along?0:sign*.245),zz=z+(along?sign*.245:0),rot=along?0:Math.PI/2;
      pointed(b,xx,3.9,zz,.54,2.25,rot,.09,stone[2]);
      box(b,'#68949a',xx+(along?0:sign*.012),4.8,zz+(along?sign*.012:0),along?.78:.035,1.45,along?.035:.78,0);
      for(const offset of[-.25,0,.25])box(b,stone[2],xx+(along?offset:0),4.8,zz+(along?0:offset),along?.037:.06,1.6,along?.06:.037);
     }
    }
   }
   for(const r of model.rooms){
    // The connected doorways remain open. Vertical depth comes from ribs and
    // clerestories rather than placing blockers in the validated floor route.
    for(const n of model.links[r.id]){const q=model.rooms[n],dx=Math.sign(q.x-r.x),dz=Math.sign(q.z-r.z);pointed(b,r.x+dx*6.8,0,r.z+dz*6.8,2.15,6.65,dx?Math.PI/2:0,.28,stone[2]);}
    const closed=[[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dz])=>!model.links[r.id].some(id=>Math.sign(model.rooms[id].x-r.x)===dx&&Math.sign(model.rooms[id].z-r.z)===dz));
    if(closed){const [dx,dz]=closed;rose(group,b,r.x+dx*6.53,5.2,r.z+dz*6.53,1.6,dx?Math.PI/2:0);roseCount++;}
    // A checker inlay gives the archery lanes scale without a noisy full floor.
    for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)box(b,(x+z)%2?dark:marble,r.x+x*.72,.009,r.z+z*.72,.71,.008,.71);
    for(const z of[-6,6])for(const dx of[-6,6])box(b,stone[1],r.x+dx,8.4,r.z+z,.7,2,.7);
    for(const x of[-6,6])for(const z of[-6,6])b.add('cone',dark,r.x+x,10.9,r.z+z,1.0,4.8,1.0,0,Math.PI/4);
    // High crossing vault ribs, no post in the player's central movement lane.
    const corners=[[-6,-6],[6,-6],[-6,6],[6,6]];for(const [x,z]of corners){let prev=[r.x+x,6.7,r.z+z];for(let i=1;i<=15;i++){const t=i/15,next=[r.x+x*(1-t),6.7+2.4*Math.sin(t*Math.PI/2),r.z+z*(1-t)];line(b,prev,next,.13,stone[2]);prev=next;}}
    for(const [x,z]of [[-5,-5],[5,-5],[-5,5],[5,5]]){box(b,stone[1],r.x+x,.26,r.z+z,.7,.52,.7);candle(b,r.x+x,.53,r.z+z);}
    if(r.id!==1&&r.style===1){
     // Archive clutter sits atop a collision-covered plinth, not across doors.
     const cover=model.solids.find(q=>q.type==='cover'&&Math.hypot((q.min[0]+q.max[0])/2-r.x,(q.min[2]+q.max[2])/2-r.z)<5);
     if(cover){const x=(cover.min[0]+cover.max[0])/2,z=(cover.min[2]+cover.max[2])/2;for(let i=0;i<6;i++)box(b,i%2?'#78634c':'#506270',x+.04*(i%3),1.15+i*.09,z,.62,.075,.38,(random()-.5)*.35);candle(b,x+.5,1.14,z);}
    }
    // Undercroft gives the suspended blocks depth. Distant forms use the same
    // small batch and geometry; no additional texture download or light per room.
    b.add('cone',stone[1],r.x,-4,r.z,8,7,8,Math.PI,Math.PI/4);
   }
   // Optional upper choir gallery: its steps and balustrade are collision-backed.
   for(const x of[-5.65,-3.65])line(b,[x,.45,4.6],[x,3.65,-4.2],.09,gold);
   for(let j=0;j<9;j++){const z=4.6-j*1.1,y=j*.4;box(b,gold,-5.65,y+.22,z,.07,.44,.07);}
   kit.label(group,'CHOIR GALLERY  /  WALK UP THE STAIR',-4.65,1.05,4.65,2.7,.29,'#273c46','#eadab6');
   kit.label(group,'THE COURT BELOW',3.85,3.95,-5.46,1.45,.22,'#263743','#e5d3a5');
   for(const [i,p]of model.targets.entries()){b.add('cylinder',gold,p[0],.65,p[2],.065,1.3,.065);b.add('ring','#dcc992',...p,.48,.48,.48,0,0,0,.25);b.add('ball','#77b8ac',...p,.25,.25,.1,0,0,0,0,true);}
   const exit=model.rooms[model.exit];pointed(b,exit.x,0,exit.z-4,2.25,6.1,0,.22,gold);kit.label(group,'THE NEXT BELL',exit.x,5.25,exit.z-3.8,3.8,.5);
   const gate=new T.Group();gate.name='Exit beacon';gate.position.set(exit.x,1.8,exit.z-3.8);group.add(gate);kit.mesh('ring','#648c88',gate,0,0,0,1.1,1.4,1);kit.mesh('ring',gold,gate,0,0,.03,.84,1.1,.9);
   for(let i=0;i<24;i++){const a=i/24*2*Math.PI,x=Math.sin(a)*79,z=Math.cos(a)*75-22,h=12+random()*24;box(b,stone[1],x,h/2-8,z,4,h,4,a);b.add('cone',dark,x,h-6,z,3,8,3,0,a+Math.PI/4);}
   const instances=b.finish(group);group.userData.architecture={floorCount:model.floors.length,solidCount:model.solids.length,roseWindows:roseCount,gallery:true};return {group,gate,instances};
  }
  function bow(){const bow=kit.bow(),b=new kit.Batch();
   // Original leather wrist brace and a brass grip, attached to the actual bow.
   b.add('cylinder','#433f38',0,-.11,.13,.055,.20,.055,-.45);for(const y of[-.16,-.09,-.025])b.add('box',gold,0,y,.18,.092,.026,.025);
   b.add('ball','#b2aa92',.015,-.01,.07,.064,.09,.061);
   for(let i=0;i<4;i++)b.add('cylinder','#8b8774',-.018+i*.021,.02,.018,.012,.08,.012,.45);
   b.add('ring',gold,0,.02,-.034,.079,.11,.079,0,0,0,.4);b.finish(bow.group);return bow;
  }
  function enemy(kind){const m=kit.enemy(kind),b=new kit.Batch();const scale=kind==='warden'?1.18:1;
   for(const side of[-1,1]){b.add('ball',stone[2],side*.29,.27,0,.18,.13,.2);box(b,gold,side*.29,.32,.035,.24,.04,.31);}
   box(b,kind==='stalker'?'#555e53':'#67545c',0,-.11,.285,.2,.78,.035);box(b,gold,0,.28,.29,.32,.07,.035);box(b,stone[2],0,.59,.267,.3,.34,.018);box(b,dark,0,.63,.282,.22,.035,.012);b.finish(m);return m;
  }
  // Shared generated textures/materials live for the component's life. Room
  // rebuilds dispose only per-world labels and instantiated geometry wrappers.
  const dispose=kit.dispose;
  function release(group){group.traverse(o=>{if(o.geometry===roseGeo){o.geometry=kit.geos.ring;o.material=kit.mat(gold);}});dispose(group);}
  return {...kit,world,bow,enemy,dispose:release};
 }
 root.VesperArt={create};
})(globalThis);
