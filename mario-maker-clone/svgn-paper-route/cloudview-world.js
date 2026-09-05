/* Cloudview replaces the sky's visible art, not its physics or level data.
   Runtime models, lights, animations and surfaces are real Three.js geometry. */
'use strict';
window.Cloudview=(()=>{
 const VERSION='2026.09.04-cloudview1';
 let engine,kit,root,hero,blimp,water=[],mail=[],pickups=[],sparkles,tail,tailPoints=[],previous=-1,course,stats={},signature='',lastHUD=0;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function single(g,mat,parent=root){const m=engine.makeSingle(g,mat);parent.add(m);return m;}
 function sign(text,x,y,z,w=110,h=56,gold=false){
  const T=engine.THREE,c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const g=c.getContext('2d');
  g.fillStyle=gold?'#e7a925':'#2e5e9c';g.beginPath();g.roundRect(0,0,c.width,c.height,15);g.fill();g.strokeStyle=gold?'#ffe396':'#b5d5e9';g.lineWidth=8;g.strokeRect(7,7,c.width-14,c.height-14);
  const lines=text.split('\n');g.fillStyle=gold?'#243f61':'#fff2cf';g.font='900 '+Math.min(65,Math.round(c.height/(lines.length+1)*.9))+'px system-ui';g.textAlign='center';g.textBaseline='middle';lines.forEach((s,i)=>g.fillText(s,256,c.height*(i+1)/(lines.length+1),470));
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const m=single(new T.PlaneGeometry(w,h),new T.MeshBasicNodeMaterial({map:tx,side:T.DoubleSide}));m.position.set(x,y,z);return m;
 }
 function cloudBank(T,course,night){
  const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
  // A reusable procedural weather texture, not an image of the level.
  for(let i=0;i<24;i++){const x=70+(i*83%365),y=142-Math.sin(i*2.7)*35,r=38+i%5*9,gr=g.createRadialGradient(x-r*.28,y-r*.35,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.96)');gr.addColorStop(.48,'rgba(244,252,255,.93)');gr.addColorStop(.78,'rgba(173,206,238,.64)');gr.addColorStop(1,'rgba(166,204,239,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
  const im=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicNodeMaterial({map:tx,transparent:true,depthWrite:false,color:night?'#dbe7fa':'#ffffff',side:T.DoubleSide,fog:false}),80),matrix=new T.Matrix4();
  for(let i=0;i<80;i++){const x=-1000+i*135,y=-2150-(i%3)*125+Math.sin(i*2.13)*120,z=-1100-(i%5)*130;matrix.makeScale(260+i%4*60,140+i%3*35,1);matrix.setPosition(x,y,z);im.setMatrixAt(i,matrix);}im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;root.add(im);
 }
 function cliffTexture(T){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#e5e6e3';g.fillRect(0,0,128,128);let seed=7;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<3000;i++){const v=175+Math.floor(rand()*80);g.fillStyle=`rgba(${v},${v},${v},.18)`;g.fillRect(rand()*128,rand()*128,1+rand()*5,1+rand()*2);}for(let i=0;i<30;i++){g.strokeStyle='rgba(65,79,96,.10)';g.beginPath();let x=rand()*128,y=rand()*128;g.moveTo(x,y);for(let j=0;j<4;j++){x+=rand()*12;y+=rand()*8-4;g.lineTo(x,y);}g.stroke();}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=1000;t.colorSpace=T.SRGBColorSpace;return t;}
 function build(m){
  engine=m;const T=m.THREE;kit=CloudAssets.create(T);
  const spherePrimitive=kit.sphere();
  for(let i=0;i<spherePrimitive.p.length;i+=9)for(const key of ['p','n'])for(let j=0;j<3;j++){const a=spherePrimitive[key][i+3+j];spherePrimitive[key][i+3+j]=spherePrimitive[key][i+6+j];spherePrimitive[key][i+6+j]=a;}
  root=new T.Group();root.name='Cloudview playable world';m.scene.add(root);
  const menu=window.__delivery?.state.menu,active=window.__sky?.active();course=active?__sky.state.data:SkyRoutes.build(4,__gameRefs.T);
  const night=active&&themeName==='city',paths=active?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,sky:t.sky})):menu?course.ct.map(p=>({pts:p,sky:p.sky})):[];
  previous=-1;tailPoints=[];water=[];mail=[];pickups=[];signature=paths.map(p=>p.sky.id).join('|');
  stats={version:VERSION,rails:paths.length,goldPlates:0,islands:0,trees:0,waterfalls:0,vertices:0,model:'helmeted courier with jet bike',source:'procedural geometry; no reference image is loaded'};
  const metal=new kit.Batch(),glow=new kit.Batch(),terrain=new kit.Batch(),greenery=new kit.Batch(),clouds=new kit.Batch(),far=new kit.Batch();
  // Soft atmospheric sky fills the camera, with no copied concept image.
  const c=document.createElement('canvas');c.width=32;c.height=512;const ctx=c.getContext('2d'),grad=ctx.createLinearGradient(0,0,0,512);
  grad.addColorStop(0,night?'#254684':'#227cdc');grad.addColorStop(.52,night?'#5b94c4':'#68b6ed');grad.addColorStop(1,night?'#bacfd4':'#e4f3f9');ctx.fillStyle=grad;ctx.fillRect(0,0,32,512);
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const sky=single(new T.PlaneGeometry(Math.max(16000,course.width*36+9000),2600),new T.MeshBasicNodeMaterial({map:tx,depthWrite:false,fog:false}));sky.position.set(course.width*18,-2200,-2400);sky.renderOrder=-100;
  m.renderer.setClearColor(night?'#6f9ccb':'#77bce8',1);m.scene.fog=new T.Fog(night?'#9ebbd6':'#b5dff6',1050,2450);
  const sun=new T.DirectionalLight(night?'#e0edff':'#fff2d2',2.4);sun.position.set(-1300,1800,1800);root.add(sun);root.add(new T.AmbientLight(night?'#b9d2f6':'#b9d8f3',1.25));const fill=new T.DirectionalLight('#83cffd',.8);fill.position.set(1300,-600,500);root.add(fill);
  function island(x,y,z,r,depth,seed,trees=5){kit.rock(terrain,x,y,z,r,depth,seed);kit.grass(greenery,x,y+2,z,r,1);for(let j=0;j<trees;j++){const a=j*2.4,rr=r*.72;kit.tree(greenery,x+Math.sin(a)*rr,y+5,z+Math.cos(a)*rr*.48,.6+(j%3)*.25,j);stats.trees++;}for(let j=0;j<4;j++)kit.flowers(greenery,x+(j-1.5)*r*.38,y+7,z+r*.4,1);stats.islands++;}
  function fall(x,y,z,height,width){
   const group=new T.Group();group.position.set(x,y,z);root.add(group);const b=new kit.Batch();
   b.box(0,-height/2,0,width,height,3,'#81d5ee');for(let j=0;j<5;j++)b.box((j-2)*width/5,-height/2-4*Math.sin(j),1.7,width/12,height*.97,1,'#d0f3ff');b.finish(m,group,{unlit:true,transparent:true,opacity:.75,depthWrite:false});
   const mist=new kit.Batch();for(let j=0;j<7;j++)mist.ell((j-3)*width*.28,-height,0,10+j%3*4,4+j%2*3,5,'#effdff');mist.finish(m,group,{unlit:true,transparent:true,opacity:.5,depthWrite:false});
   const foam=new T.Group();group.add(foam);const fb=new kit.Batch();for(let j=0;j<16;j++)fb.box(Math.sin(j*2.4)*width*.4,-j/16*height,3,1.3,12+j%3*6,.8,'#eeffff');fb.finish(m,foam,{unlit:true,transparent:true,opacity:.8,depthWrite:false});water.push({foam,height});stats.waterfalls++;
  }
  // Foreground paths exactly follow the existing collision geometry.
  for(const {pts,sky:tag}of paths){
   let distance=0,lastPlate=-100,lastTie=-100,lastArrow=-100;
   const total=SkyRoutes.length(pts),begin=tag.begin*total,end=tag.end*total;
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=-(b[1]-a[1]),len=Math.hypot(dx,dy);if(len<.01)continue;distance+=len;
    const angle=Math.atan2(dy,dx),nx=-dy/len,ny=dx/len,x=(a[0]+b[0])/2,y=-(a[1]+b[1])/2;
    const goldSector=distance>begin+(end-begin)*.55&&distance<end+4;
    metal.box(x-nx*7,y-ny*7,0,len+.8,13,42,'#3c5a77',angle);
    metal.box(x-nx*1,y-ny*1,0,len+.4,2.2,35,'#577491',angle);
    metal.box(x-nx*7,y-ny*7,24,len+.5,16,5,'#e6a82e',angle);
    metal.box(x-nx*7,y-ny*7,-24,len+.5,16,5,'#f1be49',angle);
    glow.box(x+nx*1.2,y+ny*1.2,19,len+.4,1.6,2.4,goldSector?'#ffed8f':'#6df4ff',angle);
    glow.box(x+nx*1.2,y+ny*1.2,-19,len+.4,1.6,2.4,goldSector?'#ffed8f':'#49c9fc',angle);
    if(distance-lastPlate>24){
     lastPlate=distance;stats.goldPlates++;
     metal.box(x-nx*7,y-ny*7,27,2,17,1.5,'#8b7044',angle);
     for(const side of[-1,1]){metal.ell(x-nx*6+dx/len*7,y-ny*6+dy/len*7,side*27.5,2,2,.9,'#314a60');metal.ell(x-nx*6+dx/len*7,y-ny*6+dy/len*7,side*28.3,1,1,.45,'#d3d9d3');}
    }
    if(distance-lastArrow>32){
     lastArrow=distance;const cx=x-nx*7,cy=y-ny*7,c=Math.cos(angle),s=Math.sin(angle),q=(u,v,z=28)=>[cx+u*c-v*s,cy+u*s+v*c,z];
     // Front fascia chevrons are thick little light prisms, not screen arrows.
     const chevron=goldSector?'#fff5ac':'#ffdc72';glow.tri(q(-6,6),q(-1,6),q(6,0),chevron);glow.tri(q(-6,6),q(6,0),q(1,0),chevron);glow.tri(q(1,0),q(6,0),q(-1,-6),chevron);glow.tri(q(1,0),q(-1,-6),q(-6,-6),chevron);
     // Gold-sector chevrons remain legible; do not cover them with a luminous plate.
    }
    if(distance-lastTie>46){lastTie=distance;metal.box(x-nx*18,y-ny*18,0,8,9,63,'#294560',angle);metal.box(x-nx*21,y-ny*21,0,14,4,68,'#70879b',angle);}
   }
   const base=pts[21]||pts[0],cx=base[0],by=-base[1],lip=pts.at(-1),lp=pts.at(-2),ang=-Math.atan2(lip[1]-lp[1],lip[0]-lp[0]);
   // Engineering structure and green land beneath each loop.
   if(!course.gp){
   island(cx-45,by-57,-58,185,205,tag.stage+3,9);
   metal.rod([cx-145,by-37,-16],[cx+30,by-43,-16],5,'#38536c');metal.rod([cx-110,by-55,10],[cx+110,by-5,10],3.5,'#435e77');
   for(const xo of[-120,0,100]){metal.box(cx+xo,by-40,0,8,65,36,'#3d5870');metal.box(cx+xo,by-30,0,16,8,46,'#efb538');}
   metal.box(lip[0],-lip[1]-8,0,23,24,54,'#334e65',ang);metal.box(lip[0],-lip[1]-8,29,27,23,5,'#ffc444',ang);
   const c=Math.cos(ang),s=Math.sin(ang),q=(u,v)=>[lip[0]+u*c-v*s,-lip[1]-8+u*s+v*c,32];glow.tri(q(-7,-7),q(4,0),q(-7,7),'#fff2a4');glow.tri(q(1,-7),q(12,0),q(1,7),'#fff2a4');
   sign(tag.recovery?'LOWER\nSKYWAY':'BIG JUMPS\nBRIGHTER DAYS',cx+145,by-101,42,77,64);metal.rod([cx+112,by-7,31],[cx+112,by-66,31],1.1,'#aab9c3');metal.rod([cx+178,by-7,31],[cx+178,by-66,31],1.1,'#aab9c3');
   if(!tag.recovery){
    // A floating city is behind, not pasted into the foreground.
    const ix=cx+355,iy=by+72,iz=-520;island(ix,iy,iz,180,300,tag.stage+9,12);kit.city(far,ix,iy+9,iz,.95);
    fall(ix-40,iy+7,iz+105,235,17);fall(ix+53,iy+8,iz+83,320,12);
    sign('CLOUDVIEW\nCITY',ix,iy-62,iz+120,116,59);
    island(cx-355,by+116,-700,115,220,tag.stage+1,7);kit.city(far,cx-355,by+120,-700,.5);
   }
   }
  }
  // Distant rail networks, scaled into the scenery for the sky-maze silhouette.
  if(!course.gp)for(let k=0;k<course.stages+2;k++){
   const cx=150+k*850,by=-1790+Math.sin(k*1.7)*120,z=-800-(k%2)*150,r=110;
   for(let i=0;i<48;i++){const a=i/48*2*Math.PI,b=(i+1)/48*2*Math.PI;far.rod([cx+Math.cos(a)*r,by+Math.sin(a)*r,z],[cx+Math.cos(b)*r,by+Math.sin(b)*r,z],5.5,'#dcba61');if(i%4===0)far.ell(cx+Math.cos(a)*r,by+Math.sin(a)*r,z+6,2.5,2.5,2,'#b5f7fa');}
   far.rod([cx-100,by-95,z],[cx+700,by-20,z-65],3.5,'#82a9bd');far.rod([cx-100,by-85,z],[cx+700,by-10,z-65],3.5,'#c9dbe0');
  }
  cloudBank(T,course,night);
  if(course.gp)GroundArt.populate({course,m,root,kit,metal,terrain,greenery,far,sign});
  // Playable depot surface is still the original collision pad.
  if(course.goal&&!course.gp){const x=course.goal.x*36,y=-course.goal.y*36;island(x,y-45,-35,170,190,23,8);metal.box(x,y-17,0,330,30,68,'#496079');metal.box(x,y-3,0,330,8,73,'#e8b53b');for(let i=0;i<15;i++)metal.box(x-155+i*23,y-14,38,4,22,2,'#8b732d');sign('SVGN.io\nAIRMAIL DEPOT',x,y+97,-12,140,65);}
  metal.finish(m,root,{roughness:.4,metalness:.12});glow.finish(m,root,{unlit:true});terrain.finish(m,root,{roughness:.95,metalness:0,map:cliffTexture(T)});greenery.finish(m,root,{roughness:.9,metalness:0});clouds.finish(m,root,{roughness:1,metalness:0});far.finish(m,root,{roughness:.75,metalness:.05});
  // Red postal buoys occupy the existing mailbox hit locations.
  for(const box of course.boxes||[]){
   const g=new T.Group(),x=box.x*36+18,y=-box.y*36-18;g.position.set(x,y,0);g.name='Red airmail target';root.add(g);const b=new kit.Batch();
   b.box(0,-3,0,26,27,17,'#d94c43');b.ell(0,11,0,13,9,8.5,'#ed6755');b.box(0,-16,0,29,4,19,'#952d36');b.box(0,5,9,17,5,1.2,'#3b3444');b.box(0,-6,9,14,10,1,'#f5dac0');kit.envelope(b,0,-6,10,.6);
   b.box(15,15,0,1.5,27,1.5,'#674153');b.box(22,25,0,14,10,1,'#e94e43');b.ell(22,25,1,2.8,2.8,1,'#ffead2');
   b.box(0,-26,0,55,8,36,'#35536c');b.box(0,-22,0,58,3,39,'#f0b632');kit.rock(b,0,-30,-2,26,42,box.x%10);kit.flowers(b,-21,-20,9,.5);kit.flowers(b,20,-20,8,.5);b.finish(m,g,{roughness:.45,metalness:.12});
   const flag=new T.Group();g.add(flag);const fb=new kit.Batch();fb.ell(0,13,13,6,6,1,'#8ef8d3');fb.rod([-3,13,15],[-.5,10,15],.7,'#27625e');fb.rod([-.5,10,15],[4,16,15],.7,'#27625e');fb.finish(m,flag,{unlit:true});flag.visible=false;mail.push({g,flag,box});
  }
  // Existing real pickups, individually hidden when collected.
  if(active){for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(grid[y*LW+x]===__gameRefs.T.GEAR){const g=new T.Group();g.position.set(x*36+18,-y*36-18,30);root.add(g);const b=new kit.Batch();kit.envelope(b,0,0,0,1.05,.08);b.finish(m,g,{roughness:.55});pickups.push({g,x,y});}}
  hero=kit.courier(m,root);hero.group.visible=active;hero.group.renderOrder=5100;
  // Background airship: actual mesh and signage, with a gentle drift.
  blimp=new T.Group();blimp.position.set(850,-1580,-700);root.add(blimp);const bb=new kit.Batch();bb.ell(0,0,0,100,31,29,'#f5ebcc');bb.ell(-77,0,0,15,22,25,'#dfaa48');bb.ell(72,0,0,20,21,21,'#deb652');bb.box(-4,-38,0,55,14,25,'#3f83b0');bb.rod([-22,-30,0],[-22,-38,0],1,'#6c96ae');bb.rod([20,-30,0],[20,-38,0],1,'#6c96ae');bb.tri([75,0,0],[115,27,0],[105,-5,0],'#6199c8');bb.tri([75,0,0],[118,-19,0],[109,10,0],'#487dba');bb.finish(m,blimp,{roughness:.65});const bs=sign('DELIVER A BRIGHTER\nTOMORROW',0,0,30,125,31);root.remove(bs);blimp.add(bs);
  const tailGeo=new T.BufferGeometry();tailGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(48*6*3),3));tailGeo.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(48*6*3),3));tailGeo.setDrawRange(0,0);tail=single(tailGeo,new T.MeshBasicNodeMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false}));tail.frustumCulled=false;tail.renderOrder=1000;
  sparkles=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicNodeMaterial({color:'#d6fcff',transparent:true,opacity:.8,depthWrite:false}),96);sparkles.count=0;sparkles.frustumCulled=false;root.add(sparkles);
  root.traverse(o=>{if(o.geometry)stats.vertices+=o.geometry.getAttribute('position')?.count||0;});root.userData.cloudview=stats;window.__cloudview={version:VERSION,stats,get root(){return root},get hero(){return hero},get water(){return water},get targets(){return mail},get signature(){return signature}};
  kit.dispose();return root;
 }
 function update(){
  if(!root||!engine||!window.__sky)return;
  if(!__sky.active()&&!__delivery.state.menu)engine.scene.fog=null;
  const active=__sky.active(),menu=__delivery.state.menu,s=__sky.state,p=player,t=(active?s.steps:performance.now()/16.667)/60,T=engine.THREE;
  // Renderer rebuilt legacy assets this frame. Hide only replacements in sky play.
  if(active){
   engine.posePool.forEach(o=>o.visible=false);if(engine.rider.body)engine.rider.body.visible=false;if(engine.rider.wheel)engine.rider.wheel.visible=false;if(engine.body)engine.body.visible=false;if(engine.playerVox)engine.playerVox.visible=false;
   for(const [key,obj]of engine.voxMesh){const id=Number(String(key).split('#')[0]);if([__gameRefs.T.MAILBOX,__gameRefs.T.MAILDONE,__gameRefs.T.GEAR,__gameRefs.T.STEEL,__gameRefs.T.GOAL,__gameRefs.T.EUCDOCK].includes(id))obj.visible=false;}
   if(engine.cloudReplaced){const [gears]=engine.cloudReplaced();if(gears)gears.visible=false;}
  }
  hero.group.visible=active&&!p.dead;
  if(active){
   const track=p.track,angle=track?-(p.drawA||0):Math.max(-.65,Math.min(.65,Math.atan2(-p.vy,Math.abs(p.vx)||1)*.32));
   hero.group.position.set(p.x+13,-p.y-15,22);hero.group.rotation.z=angle;hero.group.rotation.y=track?0:p.dir<0?Math.PI:0;
   hero.scarf.rotation.z=reduced()?0:Math.sin(t*12)*.1;hero.flame.scale.x=(p.track?.65:1.7)*(reduced()?1:1+Math.sin(t*33)*.2);
   for(const item of mail){const done=pg(item.box.x,item.box.y)===__gameRefs.T.MAILDONE;item.flag.visible=done;}
   for(const item of pickups){item.g.visible=pg(item.x,item.y)===__gameRefs.T.GEAR;if(!reduced())item.g.rotation.y=Math.sin(t*2+item.x)*.24;}
   if(previous!==s.steps){previous=s.steps;tailPoints.push([p.x+13,-p.y-15]);if(tailPoints.length>48)tailPoints.shift();}
   const pos=tail.geometry.attributes.position,col=tail.geometry.attributes.color;let k=0;
   if(Math.hypot(p.vx,p.vy)>9&&!p.dead)for(let i=1;i<tailPoints.length;i++){
    const a=tailPoints[i-1],b=tailPoints[i],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;if(l>70)continue;const width=i/tailPoints.length*3,nx=-dy/l*width,ny=dx/l*width;
    for(const v of[[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[a[0]-nx,a[1]-ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny]]){pos.setXYZ(k,v[0],v[1],18);col.setXYZ(k,.13+i/tailPoints.length*.35,.65+i/tailPoints.length*.3,1);k++;}
   }
   tail.geometry.setDrawRange(0,k);pos.needsUpdate=col.needsUpdate=true;
   const matrix=new T.Matrix4();sparkles.count=reduced()?0:Math.min(60,tailPoints.length);
   for(let i=0;i<sparkles.count;i++){const a=tailPoints[Math.min(i,tailPoints.length-1)],sz=.5+(i%3)*.4;matrix.makeScale(sz,sz,sz);matrix.setPosition(a[0]+Math.sin(i*4+t*5)*8,a[1]+Math.cos(i*2+t*4)*11,28);sparkles.setMatrixAt(i,matrix);}sparkles.instanceMatrix.needsUpdate=true;
  }else{tail.geometry.setDrawRange(0,0);sparkles.count=0;}
  if(!reduced()){for(const f of water)f.foam.position.y=-(t*45%18);blimp.position.x=850+Math.sin(t*.08)*100;blimp.position.y=-1580+Math.sin(t*.4)*5;}
  window.CloudHUD?.update();
 }
 return {build,update,version:VERSION};
})();
// The existing rendering hook is retained: one scene, one renderer, one frame loop.
window.SkyVisual=window.Cloudview;
