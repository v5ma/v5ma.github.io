/* Cloudview art direction. Original real-time geometry, not a screenshot backdrop.
   All collision, launch, delivery and checkpoint rules remain in the sky engine. */
'use strict';
(() => {
  const previous = window.SkyVisual;
  const VERSION = 'cloudview-20260904-2';
  let world=null, api=null, courier=null, wheels=[], scarf=null, boost=null, mailboxes=[], waterfalls=[], clouds=null;
  let envelopes=[], lastStep=-1, trail=[], trailMesh=null, hidden=new Map(), lastUi=0, units=null, colorCache=new Map();
  const stats={version:VERSION,builds:0,triangles:0,objects:0,trackPanels:0,islands:0,mailboxes:0};
  const C={gold:'#ffc327',goldLight:'#ffdf67',goldDark:'#dc8b17',steel:'#344b69',dark:'#203047',asphalt:'#43546c',blue:'#26c9ff',white:'#fff4d8',green:'#76b83b',red:'#e54838'};
  const live=()=>window.__sky?.active();
  const preview=()=>window.__delivery?.state.menu;
  const rnd=n=>{const t=Math.sin(n*127.1+311.7)*43758.5453;return t-Math.floor(t);};
  function color(T,s){if(!colorCache.has(s))colorCache.set(s,new T.Color(s));return colorCache.get(s);}
  class GeometryBatch {
    constructor(T,material){this.T=T;this.material=material;this.p=[];this.n=[];this.c=[];this.uv=[];}
    add(g,x,y,z,sx=1,sy=1,sz=1,rz=0,tint='#ffffff',ry=0,rx=0){
      const T=this.T,m=new T.Matrix4(),q=new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz));m.compose(new T.Vector3(x,y,z),q,new T.Vector3(sx,sy,sz));
      const a=g.attributes.position,b=g.attributes.normal,idx=g.index,col=color(T,tint),e=m.elements;
      const nr=new T.Vector3(),v=new T.Vector3();
      for(let k=0;k<(idx?idx.count:a.count);k++){
        const i=idx?idx.getX(k):k;const uv=g.attributes.uv;this.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);v.set(a.getX(i),a.getY(i),a.getZ(i)).applyMatrix4(m);this.p.push(v.x,v.y,v.z);
        nr.set(b.getX(i)/sx,b.getY(i)/sy,b.getZ(i)/sz).applyQuaternion(q).normalize();this.n.push(nr.x,nr.y,nr.z);
        const shade=.83+.17*Math.max(0,nr.y);this.c.push(col.r*shade,col.g*shade,col.b*shade);
      }
    }
    finish(parent,name){
      if(!this.p.length)return null;
      const T=this.T,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.computeBoundingSphere();
      const m=api.makeSingle(g,this.material);m.name=name;m.frustumCulled=true;m.castShadow=true;m.receiveShadow=true;parent.add(m);stats.triangles+=this.p.length/9;stats.objects++;return m;
    }
  }
  function paintFinish(T){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    g.fillStyle='#f5f5f5';g.fillRect(0,0,128,128);
    const edge=g.createLinearGradient(0,0,0,128);edge.addColorStop(0,'#fff');edge.addColorStop(.04,'#eee');edge.addColorStop(.94,'#f8f8f8');edge.addColorStop(1,'#a9adb3');g.fillStyle=edge;g.fillRect(0,0,128,128);
    for(let i=0;i<280;i++){g.fillStyle=i%4?'#5564750c':'#ffffff77';g.fillRect(rnd(i)*128,rnd(i+901)*128,1+rnd(i+7)*5,1);}
    g.strokeStyle='#67798766';g.lineWidth=1;g.strokeRect(1,1,126,126);
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  function materials(T){return {
    painted:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:.65,metalness:0}),
    metal:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:.42,metalness:.2,map:paintFinish(T)}),
    glow:new T.MeshBasicNodeMaterial({vertexColors:true}),
    nature:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:1,metalness:0}),
    actor:new T.MeshStandardNodeMaterial({vertexColors:true,roughness:.48,metalness:.12,depthTest:true})
  };}
  function primitives(T){return {box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,14,10),rock:new T.DodecahedronGeometry(1,0),cone:new T.ConeGeometry(1,1,7),cyl:new T.CylinderGeometry(1,1,1,12),torus:new T.TorusGeometry(1,.22,8,24)};}
  function beam(batch,a,b,r,tint){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);if(len<.01)return;batch.add(units.cyl,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,len,r,-Math.atan2(dx,dy),tint,0,Math.atan2(dz,Math.hypot(dx,dy)));}
  function label(parent,text,x,y,z,w,h,options={}){
    const T=api.THREE,c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
    g.fillStyle=options.bg||'#183f69';g.beginPath();g.roundRect(5,5,502,246,22);g.fill();g.strokeStyle=options.border||'#ffcb42';g.lineWidth=10;g.stroke();
    g.fillStyle=options.color||'#fff6d2';g.font='900 48px Arial';g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n');lines.forEach((s,i)=>g.fillText(s,256,128+(i-(lines.length-1)/2)*56,460));
    const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;
    const m=api.makeSingle(new T.PlaneGeometry(w,h),new T.MeshBasicNodeMaterial({map:tx,transparent:true,side:T.DoubleSide}));m.position.set(x,y,z);parent.add(m);stats.objects++;return m;
  }
  function chevron(batch,x,y,z,rz,tint,size=1){
    const co=Math.cos(rz),si=Math.sin(rz);
    batch.add(units.box,x+(-2*co-3*si)*size,y+(-2*si+3*co)*size,z,8*size,2.2*size,1,rz-Math.PI/4,tint);
    batch.add(units.box,x+(-2*co+3*si)*size,y+(-2*si-3*co)*size,z,8*size,2.2*size,1,rz+Math.PI/4,tint);
  }
  function trackArt(parent,pts,tag,mats,scale=1,depth=0,scenic=false){
    const T=api.THREE,b=new GeometryBatch(T,mats.painted),metal=new GeometryBatch(T,mats.metal),glow=new GeometryBatch(T,mats.glow);
    const total=SkyRoutes.length(pts),begin=(tag?.begin||0)*total,end=(tag?.end||0)*total;let walk=0,serial=0;
    for(let j=1;j<pts.length;j++){
      const a=pts[j-1],v=pts[j],dx=v[0]-a[0],dy=-(v[1]-a[1]),len=Math.hypot(dx,dy);if(len<.01)continue;
      const angle=Math.atan2(dy,dx),nx=-dy/len,ny=dx/len,steps=Math.max(1,Math.ceil(len/(scenic?22:13)));
      for(let k=0;k<steps;k++){
        const f=(k+.5)/steps,x=a[0]+dx*f,y=-a[1]+dy*f,s=walk+len*f,goldSector=s>begin+(end-begin)*.55&&s<end,wide=scale*62;
        const at=(normal,zz=0)=>[x+nx*normal*scale,y+ny*normal*scale,depth+zz*scale];
        b.add(units.box,...at(-9),len/steps+.4,16*scale,wide,angle,C.steel);
        b.add(units.box,...at(-1.7),len/steps+.35,3.2*scale,wide-12*scale,angle,C.asphalt);
        for(const side of[-1,1]){
          const zz=side*33;
          metal.add(units.box,...at(-7,zz),len/steps-.65,17*scale,8*scale,angle,serial%4===0?C.goldLight:C.gold);
          if(!scenic&&serial%3===0)metal.add(units.cyl,...at(-8,side*37.5),2*scale,1.6*scale,2*scale,angle,C.steel,0,Math.PI/2);
          if(serial%3===0)glow.add(units.box,...at(1,side*27),7*scale,2*scale,2.5*scale,angle,goldSector?'#fff197':C.blue);
        }
        if(!scenic&&serial%4===0){
          const q=at(-6,38.1);chevron(glow,...q,angle,goldSector?'#fff6a6':'#c9f7ff',scale*.86);
          for(const side of[-1,1])glow.add(units.box,...at(.15,side*5),8*scale,.65*scale,2*scale,angle,C.blue,side*.55,0);
        }
        if(serial%8===0)metal.add(units.box,...at(-19),5*scale,9*scale,wide+11*scale,angle,C.dark);
        serial++;stats.trackPanels++;
      }
      walk+=len;
    }
    b.finish(parent,'Painted road and dark riding surface');metal.finish(parent,'Gold rail armor, bolts and crossmembers');glow.finish(parent,'Blue lights and gold-sector chevrons');
    if(!scenic){
      const lip=pts.at(-1),a=pts.at(-2),ang=Math.atan2(a[1]-lip[1],lip[0]-a[0]),n=[-Math.sin(ang),Math.cos(ang)];
      const hardware=new GeometryBatch(T,mats.metal);
      hardware.add(units.box,lip[0]+n[0]*-14,-lip[1]+n[1]*-14,depth,23,30,80,ang,C.dark);
      hardware.add(units.box,lip[0]+n[0]*-13,-lip[1]+n[1]*-13,depth+43,25,28,5,ang,C.gold);
      hardware.finish(parent,'Rocket exit housing');
      const sign=label(parent,'>>>',lip[0]+n[0]*-13,-lip[1]+n[1]*-13,depth+46,25,21,{bg:'#34425d'});sign.rotation.z=ang;
    }
  }
  function tree(b,x,y,z,h,seed){
    b.add(units.cyl,x,y+h*.25,z,h*.037,h*.5,h*.037,0,'#856241');
    for(let i=0;i<4;i++)b.add(units.cone,x,y+h*(.35+i*.155),z,h*(.27-i*.043),h*.46,h*(.27-i*.043),0,['#3e7f49','#579943','#71ab48','#83b746'][i]);
  }
  function island(parent,x,y,z,r,seed,mats,town=false){
    stats.islands++;const T=api.THREE,b=new GeometryBatch(T,mats.nature),stone=new GeometryBatch(T,mats.painted);
    b.add(units.rock,x,y-r*.52,z,r*.95,r*.8,r*.56,0,'#8998ab',seed*.7);
    b.add(units.rock,x-r*.34,y-r*.68,z+r*.19,r*.32,r*.7,r*.35,.22,'#a4abc0',seed);
    b.add(units.rock,x+r*.46,y-r*.48,z-r*.04,r*.33,r*.63,r*.27,-.25,'#667e95',seed*.5);
    b.add(units.cyl,x,y-r*.06,z,r*1.03,r*.14,r*.59,0,'#658d42');
    b.add(units.ball,x,y,z,r*1.04,r*.07,r*.6,0,'#8ac64a');
    for(let i=0;i<12;i++){
      const a=i*2.4,xx=x+Math.cos(a)*r*(.45+rnd(seed+i)*.48),zz=z+Math.sin(a)*r*.52;
      if(i%2===0||!town)tree(b,xx,y+3,zz,r*(.22+rnd(i+seed)*.26),i);
      b.add(units.ball,xx,y+3,zz,r*.095,r*.075,r*.085,0,['#6aad3c','#8ac746','#b1d25a'][i%3]);
      if(z>-200&&i%2){b.add(units.ball,xx+5,y+r*.08,zz+r*.1,2,3,2,0,i%3?'#ffbb2b':'#f06465');}
    }
    for(let k=0;k<13;k++){const a=k*2.399,rr=r*(.78+rnd(seed+k)*.12);b.add(units.rock,x+Math.cos(a)*rr,y-r*(.23+rnd(k+seed+100)*.23),z+Math.sin(a)*r*.42,r*.16,r*(.33+rnd(k)*.25),r*.19,(rnd(k+42)-.5)*.4,k%3?'#9dabbc':'#c3c9cd',k);}
    if(town){
      for(let i=0;i<20;i++){
        const xx=x+(i%5-2)*r*.29,zz=z+(Math.floor(i/5)-1.5)*r*.24,ht=r*(.2+rnd(i+seed*3)*.37),ww=r*.17;
        stone.add(units.box,xx,y+ht/2,zz,ww,ht,ww*.78,0,i%3?'#ffedcd':'#e3dce6');
        stone.add(units.cone,xx,y+ht+ww*.24,zz,ww*.77,ww*.6,ww*.7,0,i%3?'#457ca2':C.gold,Math.PI/4);
        stone.add(units.box,xx,y+ht*.22,zz+ww*.4,ww*.18,ht*.28,1,0,'#3b6b86');
        for(let row=0;row<3;row++)for(const dx of[-.24,.24])stone.add(units.box,xx+ww*dx,y+ht*(.45+row*.15),zz+ww*.404,ww*.13,ht*.085,1,0,'#63b1d6');
      }
      for(const shift of[-.77,.65]){
        const xx=x+r*shift,ht=r*(shift>0?.95:1.16);
        stone.add(units.cyl,xx,y+ht*.5,z-r*.06,r*.075,ht,r*.075,0,'#fff2d8');
        for(let k=1;k<=3;k++)stone.add(units.cyl,xx,y+ht*k/3,z-r*.06,r*.095,r*.038,r*.095,0,C.goldLight);
        stone.add(units.cone,xx,y+ht+r*.12,z-r*.06,r*.14,r*.29,r*.14,0,'#4285ae');
        stone.add(units.cyl,xx,y+ht+r*.32,z-r*.06,r*.01,r*.18,r*.01,0,C.gold);
      }
      label(parent,'CLOUDVIEW\nCITY',x,y+r*.14,z+r*.63,r*.76,r*.3,{bg:'#738bad',border:'#b6d4d7'});
    }
    b.finish(parent,'Grass, pines and floating geology');stone.finish(parent,'Cloudview buildings and tower windows');
    if(town||seed%2===0){
      const w=Math.max(6,r*.065),height=r*1.45;
      const cv=document.createElement('canvas');cv.width=64;cv.height=256;const g=cv.getContext('2d'),gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,'#fff6');gr.addColorStop(.3,'#c8faff');gr.addColorStop(.5,'#ffffff');gr.addColorStop(1,'#82cde633');g.fillStyle=gr;g.fillRect(0,0,64,256);for(let i=0;i<35;i++){g.fillStyle=i%2?'#fffa':'#71c8f055';g.fillRect(i*17%64,i*41%256,2+(i%4),15+i%31);}
      const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.wrapT=T.RepeatWrapping;
      const wf=api.makeSingle(new T.PlaneGeometry(w,height),new T.MeshBasicNodeMaterial({map:tx,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}));wf.position.set(x+r*.47,y-height*.49,z+r*.56);parent.add(wf);waterfalls.push(tx);
    }
  }
  function support(parent,pts,mats){
    const T=api.THREE,b=new GeometryBatch(T,mats.painted),base=pts[21]||pts[0],x=base[0],y=-base[1];
    for(const side of[-1,1]){
      const xx=x+side*83;
      beam(b,[xx,y-17,-22],[xx-side*27,y-104,-24],6,C.steel);
      beam(b,[xx,y-19,-24],[xx-side*82,y-97,-24],4,'#5a7286');
      b.add(units.box,xx,y-22,-24,28,18,49,0,C.gold);
      for(let j=0;j<3;j++)b.add(units.cyl,xx-9+j*9,y-22,3,2,2,2,0,C.dark,0,Math.PI/2);
    }
    b.finish(parent,'Industrial island supports');
  }
  function blimp(parent,x,y,z,mats){
    const T=api.THREE,b=new GeometryBatch(T,mats.painted);
    b.add(units.ball,x,y,z,92,31,29,0,'#fff3d4');b.add(units.cone,x-91,y,z,19,29,19,-Math.PI/2,C.gold);
    b.add(units.box,x+77,y+25,z,31,21,3,.3,'#3d7ead');b.add(units.box,x+82,y,z+25,32,3,29,0,'#427f9f');
    b.add(units.box,x,y-40,z,38,15,20,0,C.steel);beam(b,[x-18,y-18,z],[x-13,y-34,z],1.5,C.dark);beam(b,[x+18,y-18,z],[x+13,y-34,z],1.5,C.dark);
    b.finish(parent,'Postal airship');label(parent,'A BRIGHTER TOMORROW\nDELIVERED',x-5,y,z+30,110,32,{bg:'#ebf3ed',border:'#afc6d4',color:'#345d8f'});
  }
  function buildCourier(parent,mats){
    const T=api.THREE,root=new T.Group();root.name='Animated helmeted Cloudview courier';parent.add(root);
    const b=new GeometryBatch(T,mats.actor),metal=new GeometryBatch(T,mats.metal),glow=new GeometryBatch(T,mats.glow);
    for(const x of[-18,18]){
      const w=new T.Group();w.position.set(x,10,0);root.add(w);
      const wb=new GeometryBatch(T,mats.actor);wb.add(units.torus,0,0,0,8.2,8.2,13,0,'#15243c');wb.add(units.cyl,0,0,0,6,7,6,0,'#cedbdc',0,Math.PI/2);wb.add(units.torus,0,0,4,5.1,5.1,2,0,C.blue);
      for(let k=0;k<5;k++)wb.add(units.box,0,0,4.2,1.2,10,1,k*Math.PI/5,'#3d6175');wb.finish(w,'Tire, hub, spokes and blue rim');wheels.push(w);
    }
    beam(metal,[-18,10,0],[-4,21,0],2.2,C.gold);beam(metal,[-4,21,0],[18,10,0],2.2,C.gold);beam(metal,[-18,10,0],[7,10,0],2,C.steel);
    beam(metal,[18,10,-3],[12,31,-3],2,'#dde4e6');beam(metal,[12,31,-3],[21,34,-3],1.6,C.dark);
    b.add(units.ball,2,21,0,17,7,7,0,C.white);b.add(units.ball,12,24,0,10,8,7.5,-.2,'#357eaf');
    b.add(units.box,-8,26,0,22,4,13,-.06,C.dark);
    b.add(units.box,-25,27,0,17,18,16,-.07,'#df9a35');b.add(units.box,-25,28,8.2,3,17,1,0,C.goldLight);b.add(units.box,-25,34,8.7,13,1.5,1,0,'#ffe4a0');
    glow.add(units.ball,19,28,2,3.5,3,3,0,'#c6ffff');
    b.add(units.ball,-3,39,0,8,12,6,-.35,'#f7a52e');b.add(units.ball,2,48,0,5,4,5,0,'#f4bc7c');
    beam(b,[-5,30,4],[5,23,5],4,'#1e385b');beam(b,[5,23,5],[0,12,6],3.1,'#1e385b');b.add(units.ball,3,11,6,6,2.7,4,0,C.dark);
    beam(b,[1,44,4],[9,36,6],2.8,'#e58920');beam(b,[9,36,6],[17,34,6],2.4,'#ffce8e');b.add(units.ball,17,34,6,3,2.5,3,0,'#24394c');
    b.add(units.ball,4,55,0,8,9,7,0,'#ffc78d');
    b.add(units.ball,2,59,-1,10,10,8,0,'#194b80');b.add(units.box,2,66,1,13,3,9,-.1,C.gold);b.add(units.ball,7,57,5,7,5.4,3,-.13,'#f8d494');
    b.add(units.ball,9,59,7.5,3.7,2.8,1.3,0,'#173951');glow.add(units.ball,10,59.5,8.5,.8,.7,.5,0,'#d7faff');
    b.add(units.ball,12,55,7,2,1.7,1.5,0,'#ffca93');b.add(units.box,9,52,7.6,3.6,.7,1,-.08,'#9c543a');
    b.add(units.ball,0,48,0,6,2.5,6,0,C.red);b.add(units.box,-6,36,7,3,17,1,-.3,'#925a32');
    b.finish(root,'Courier body, helmet, parcel and motorcycle fairing');metal.finish(root,'Bike frame and suspension');glow.finish(root,'Headlamp and eye glint');
    const sb=new GeometryBatch(T,mats.actor);sb.add(units.box,-9,48,1,17,3,1.5,.19,C.red);sb.add(units.box,-20,51,1,12,3,1.3,-.18,'#ff5b40');scarf=sb.finish(root,'Wind-animated scarf');
    const fire=new GeometryBatch(T,new T.MeshBasicNodeMaterial({vertexColors:true,transparent:true,opacity:.8,depthWrite:false}));fire.add(units.cone,-33,17,0,4,24,4,-Math.PI/2,'#6ce8ff');fire.add(units.cone,-29,17,0,2.5,19,2.5,-Math.PI/2,'#f4ffff');boost=fire.finish(root,'Rocket exhaust');
    return root;
  }
  function makeEnvelope(parent,x,y,mats){
    const T=api.THREE,root=new T.Group();root.position.set(x*36+18,-y*36-18,25);root.rotation.z=-.12+(x%3)*.12;parent.add(root);
    const b=new GeometryBatch(T,mats.painted),glow=new GeometryBatch(T,mats.glow);
    b.add(units.box,0,0,0,22,15,3,0,'#ffedbd');
    b.add(units.box,-4.4,1,1.7,12,1,1,-.57,'#ca9759');b.add(units.box,4.4,1,1.7,12,1,1,.57,'#ca9759');
    b.add(units.ball,0,-1,2.3,2.4,2.4,.9,0,'#d95138');
    glow.add(units.box,0,7,1.5,20,.65,1,0,'#fffbe1');
    b.finish(root,'Collectible sealed envelope');glow.finish(root,'Envelope edge light');envelopes.push({root,x,y,height:root.position.y});
  }
  function mailbox(parent,box,mats){
    const T=api.THREE,x=box.x*36+18,y=-box.y*36-18,root=new T.Group();root.position.set(x,y,28);parent.add(root);
    const b=new GeometryBatch(T,mats.painted),m=new GeometryBatch(T,mats.metal);
    b.add(units.box,0,-5,0,27,34,21,0,C.red);b.add(units.cyl,0,12,0,13.5,21,13.5,0,'#f46048',0,Math.PI/2);
    b.add(units.box,0,3,11,19,8,1,0,'#431d2c');b.add(units.box,0,-18,0,33,6,27,0,'#be3032');
    b.add(units.box,-8,-30,-2,6,25,7,0,C.steel);b.add(units.box,8,-30,-2,6,25,7,0,C.steel);
    b.add(units.cyl,19,25,0,1.2,36,1.2,0,'#e5eef4');b.add(units.box,28,40,0,19,12,1,0,C.red);
    m.add(units.box,0,-8,11.5,19,3,1,0,'#ffcc67');m.add(units.cyl,9,-13,12,1.4,1,1.4,0,C.gold,0,Math.PI/2);
    b.finish(root,'Red airmail collection box');m.finish(root,'Brass mailbox details');
    const check=label(root,'DELIVERED',0,-8,13,23,7,{bg:'#217554',border:'#9ade91'});check.visible=false;
    mailboxes.push({root,box,check});
    island(parent,x,y-60,-12,58,15+box.x,mats,false);
    label(parent,'GOOD THINGS\nARRIVE HIGHER',x,y-115,30,73,38,{bg:'#426590'});
  }
  function build(m){
    api=m;world=new m.THREE.Group();world.name='Cloudview City / real-time reference-inspired world';m.scene.add(world);
    wheels=[];waterfalls=[];mailboxes=[];envelopes=[];trail=[];lastStep=-1;stats.builds++;stats.triangles=stats.objects=stats.trackPanels=stats.islands=stats.mailboxes=0;colorCache=new Map();
    const T=m.THREE;units=primitives(T);const mats=materials(T);
    const data=window.__sky?.state.data||SkyRoutes.build(Math.max(0,window.__delivery?.state.route||0),__gameRefs.T);
    if(!live()&&!preview()){world.userData.cloudview=true;return world;}
    const paths=live()?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,sky:t.sky})):data.ct.map(p=>({pts:p,sky:p.sky}));
    const night=themeName==='city',bg=night?'#779dcc':'#66b4f2';m.renderer.setClearColor(bg,1);m.scene.fog=new T.Fog(night?'#c4dced':'#b4dcf5',1050,2600);
    const skyCanvas=document.createElement('canvas');skyCanvas.width=64;skyCanvas.height=512;const sg=skyCanvas.getContext('2d'),gr=sg.createLinearGradient(0,0,0,512);gr.addColorStop(0,night?'#6486bd':'#3b97ed');gr.addColorStop(.5,night?'#bed4e7':'#a5d6fa');gr.addColorStop(1,'#f6faff');sg.fillStyle=gr;sg.fillRect(0,0,64,512);
    const st=new T.CanvasTexture(skyCanvas);st.colorSpace=T.SRGBColorSpace;const sky=m.makeSingle(new T.PlaneGeometry(data.width*36+7000,7500),new T.MeshBasicNodeMaterial({map:st,depthWrite:false,fog:false}));sky.position.set(data.width*18,-2400,-2600);sky.renderOrder=-100;world.add(sky);
    const sun=new T.DirectionalLight('#fff0ca',2.65);sun.position.set(-600,800,1500);world.add(sun);
    const fill=new T.HemisphereLight('#def7ff','#53749c',1.7);world.add(fill);const rim=new T.DirectionalLight('#adf4ff',.75);rim.position.set(700,100,-1000);world.add(rim);
    // Soft volumetric-cloud impostors are scenery only. Main islands, roads,
    // targets and the rider remain actual geometry. Four textures avoid clones.
    for(let variant=0;variant<4;variant++){
      const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
      // Overlapping shaded billows, with soft alpha edges and no dark outline.
      for(let k=0;k<40;k++){
        const x=75+rnd(k+variant*47)*360,y=104+rnd(k+variant*13+7)*70,r=25+rnd(k+30)*48;
        const grad=g.createRadialGradient(x-r*.15,y-r*.3,r*.07,x,y,r);
        grad.addColorStop(0,'#fffffffa');grad.addColorStop(.54,'#fbffffee');grad.addColorStop(.8,'#def1fadd');grad.addColorStop(1,'#c6e5f600');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
      }
      const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
      const cloud=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicNodeMaterial({map:tx,transparent:true,depthWrite:false,opacity:.91,side:T.DoubleSide,fog:false}),30);
      cloud.frustumCulled=false;cloud.renderOrder=-20+variant;const mm=new T.Matrix4();
      for(let i=0;i<30;i++){const id=i*4+variant,w=260+rnd(id+18)*420;mm.makeScale(w,w*.5,1);mm.setPosition(-950+id*211%(data.width*36+2300),-2350-rnd(id+57)*270,-850-rnd(id+60)*1350);cloud.setMatrixAt(i,mm);}
      cloud.instanceMatrix.needsUpdate=true;world.add(cloud);
    }
    for(let i=0;i<paths.length;i++){
      const p=paths[i];if(p.sky.recovery)continue;const c=p.pts[21]||p.pts[0],x=c[0],y=-c[1];
      island(world,x+220,y+115,-700,140+i%2*25,20+i,mats,true);
      island(world,x-300,y+75,-1150,110,i+30,mats,true);
      island(world,x-20,y-96,-45,105,i+1,mats,false);support(world,p.pts,mats);
      const distant=p.pts.map(v=>[x+(v[0]-x)*.72+430,-y+(v[1]+y)*.72-160]);trackArt(world,distant,p.sky,mats,.44,-920,true);
      if(i%2===0)blimp(world,x+500,y+350,-850,mats);
      label(world,i===0?'SKY HIGHER\nDELIVER BRIGHTER':'BIG JUMPS\nBRIGHTER DAYS',x-145,y-117,18,69,86,{bg:'#325f97'});
    }
    paths.forEach(p=>trackArt(world,p.pts,p.sky,mats));
    for(const b of data.boxes||[])mailbox(world,b,mats);stats.mailboxes=mailboxes.length;
    for(let k=0;k<data.cells.length;k++)if(data.cells[k]===__gameRefs.T.GEAR)makeEnvelope(world,k%data.width,Math.floor(k/data.width),mats);
    if(data.goal){const gx=data.goal.x*36,gy=-data.goal.y*36;island(world,gx,gy-22,-65,190,50,mats,true);label(world,'SVGN.io\nSKY POST DEPOT',gx,gy+100,-25,140,65,{bg:'#245783'});}
    courier=buildCourier(world,mats);courier.position.set(490,-2080,55);courier.visible=!!live();
    const tb=new GeometryBatch(T,mats.glow);tb.add(units.ball,0,0,0,1,1,1,0,'#d7fcff');const tgeo=new T.SphereGeometry(1,6,4);
    trailMesh=new T.InstancedMesh(tgeo,new T.MeshBasicNodeMaterial({color:'#7ce8ff',transparent:true,opacity:.65,depthWrite:false}),64);trailMesh.count=0;trailMesh.frustumCulled=false;world.add(trailMesh);
    Object.values(units).forEach(g=>g.dispose());world.userData.cloudview=true;world.userData.stats={...stats};return world;
  }
  function hide(obj){if(!obj)return;if(!hidden.has(obj))hidden.set(obj,obj.visible);obj.visible=false;}
  function restore(){for(const[o,v]of hidden)o.visible=v;hidden.clear();}
  function update(){
    if(!api||!world?.parent)return;
    const active=live(),menu=preview();
    if(active||menu){
      for(const obj of api.scene.children)if(obj.isLight)hide(obj);
      hide(api.activePose);hide(api.rider?.body);hide(api.rider?.wheel);hide(api.playerVox);hide(api.body);
      if(active)for(const[k,v]of api.voxMesh){const id=Number(String(k).split('#')[0]);if([__gameRefs.T.MAILBOX,__gameRefs.T.MAILDONE,__gameRefs.T.GEAR].includes(id))hide(v);}
    }else{restore();api.scene.fog=null;if(courier)courier.visible=false;return;}
    if(courier)courier.visible=!!active;
    if(active){
      const p=player,s=__sky.state,step=s.steps,dt=Math.min(4,Math.max(0,step-lastStep)),t=step/60;
      const angle=-(p.drawA||0),tx=Math.cos(angle),ty=Math.sin(angle);
      courier.position.set(p.x+13+Math.sin(angle)*24,-p.y-15-Math.cos(angle)*24,40);courier.rotation.z=angle;courier.rotation.y=0;
      courier.visible=p.dead<=0;
      for(const w of wheels)w.rotation.z=-(p.roll||t*6);
      if(scarf){scarf.rotation.z=Math.sin(t*16)*.045;scarf.position.y=Math.sin(t*12)*.45;}
      if(boost){boost.visible=!p.track&&Math.hypot(p.vx,p.vy)>10;boost.scale.x=1+Math.sin(t*37)*.13;}
      for(const e of envelopes){e.root.visible=pg(e.x,e.y)===__gameRefs.T.GEAR;e.root.position.y=e.height+Math.sin(t*2+e.x)*1.5;}
      for(const box of mailboxes){const done=pg(box.box.x,box.box.y)===__gameRefs.T.MAILDONE;box.check.visible=done;}
      if(step!==lastStep){trail.push([p.x+13,-p.y-15,40]);if(trail.length>64)trail.shift();lastStep=step;for(const tx of waterfalls)tx.offset.y=-t*.35;}
      const fast=!p.track&&Math.hypot(p.vx,p.vy)>12;trailMesh.count=fast?trail.length:0;
      const mm=new api.THREE.Matrix4();for(let i=0;i<trail.length;i++){const f=i/trail.length,sz=.4+f*2.7;mm.makeScale(sz,sz,sz);mm.setPosition(...trail[i]);trailMesh.setMatrixAt(i,mm);}trailMesh.instanceMatrix.needsUpdate=true;
    }
    window.__cloudviewUI?.();
  }
  window.SkyVisual={build,update,tube:previous.tube};
  window.__cloudview={version:VERSION,stats,get world(){return world},get courier(){return courier},get mailboxes(){return mailboxes}};
})();
