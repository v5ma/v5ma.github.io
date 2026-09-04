/* True 3D rails and sky scenery in the existing WebGPURenderer scene. */
'use strict';
window.SkyVisual=(()=>{
 let group=null,trail=null,history=[],previous=-1,engine=null;
 function tube(T,pts,z,r){
  const p=[],n=[],rings=[];
  for(let i=0;i<pts.length;i++){
   const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,ring=[];
   for(let k=0;k<8;k++){const t=k/8*Math.PI*2,c=Math.cos(t),s=Math.sin(t);ring.push({p:[pts[i][0]+dy/l*r*c,-pts[i][1]+dx/l*r*c,z+r*s],n:[dy/l*c,dx/l*c,s]});}rings.push(ring);
  }
  function v(a){p.push(...a.p);n.push(...a.n);}
  for(let i=1;i<rings.length;i++)for(let j=0;j<8;j++){const k=(j+1)%8;v(rings[i-1][j]);v(rings[i][j]);v(rings[i][k]);v(rings[i-1][j]);v(rings[i][k]);v(rings[i-1][k]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));return g;
 }
 function sphere(T){
  const p=[];const at=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
  for(let i=0;i<7;i++)for(let j=0;j<12;j++){const a=i*Math.PI/7,b=(i+1)*Math.PI/7,c=j*Math.PI/6,d=(j+1)*Math.PI/6;p.push(...at(a,c),...at(b,c),...at(b,d),...at(a,c),...at(b,d),...at(a,d));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
 }
 function build(m){
  engine=m;const T=m.THREE,course=window.__sky?.state.data||SkyRoutes.build(0,globalThis.__gameRefs?.T||{}),night=themeName==='city';
  group=new T.Group();group.name='Sky Post loop world';m.scene.add(group);history=[];previous=-1;
  const mat=(c,glow=0)=>new T.MeshStandardNodeMaterial({color:c,roughness:.36,metalness:.45,emissive:c,emissiveIntensity:glow,side:T.DoubleSide});
  const cyan=mat('#77eee4',.55),white=mat('#d5e3f2',.12),gold=mat('#ffd079',.85),steel=mat('#3e6178');
  function mesh(g,material,x=0,y=0,z=0){const obj=m.makeSingle(g,material);obj.position.set(x,y,z);obj.frustumCulled=false;group.add(obj);return obj;}
  // A textured plane is scenery only; every playable rail below is volumetric.
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const c=canvas.getContext('2d');
  const gr=c.createLinearGradient(0,0,0,768);gr.addColorStop(0,night?'#111d3f':'#326c91');gr.addColorStop(.58,night?'#36577d':'#72a9bc');gr.addColorStop(1,night?'#7c7189':'#edc8ab');c.fillStyle=gr;c.fillRect(0,0,1536,768);
  if(night){for(let i=0;i<180;i++){c.fillStyle=i%3?'#a4ddd677':'#fcdfb9';c.fillRect(i*137%1536,i*71%590,i%4?2:3,2);}}else{c.fillStyle='#fae5bc';c.beginPath();c.arc(1150,220,72,0,7);c.fill();}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  mesh(new T.PlaneGeometry(Math.max(10000,course.width*36+2000),4400),new T.MeshBasicNodeMaterial({map:tex,depthWrite:false}),course.width*18,-1900,-300).renderOrder=-100;
  const ties=new T.InstancedMesh(new T.BoxGeometry(1,1,1),steel,600);ties.count=0;ties.frustumCulled=false;const matrix=new T.Matrix4();let count=0;
  const paths=mode==='play'?tracks.filter(t=>t.sky).map(t=>({pts:t.pts,sky:t.sky})):course.ct.map(p=>({pts:p,sky:p.sky}));
  for(const {pts,sky}of paths){
   const front=mesh(tube(T,pts,15,3.1),cyan),back=mesh(tube(T,pts,-15,4.2),white);front.renderOrder=back.renderOrder=200;
   const total=SkyRoutes.length(pts),start=sky.begin*total,end=sky.end*total;let s=0,goldPts=[];
   for(let i=1;i<pts.length;i++){
    s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
    if(s>start+(end-start)*.55&&s<=end+4)goldPts.push(pts[i]);
    if(i%6===0&&count<600){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];matrix.makeRotationZ(-Math.atan2(dy,dx));matrix.scale(new T.Vector3(5,5,37));matrix.setPosition(pts[i][0],-pts[i][1],0);ties.setMatrixAt(count++,matrix);}
   }
   if(goldPts.length>1){mesh(tube(T,goldPts,15,4.8),gold).renderOrder=210;}
   const lip=pts.at(-1),a=pts.at(-2),dx=lip[0]-a[0],dy=lip[1]-a[1],angle=-Math.atan2(dy,dx);
   for(let j=0;j<3;j++){const o=mesh(new T.BoxGeometry(9,12,48),j===1?gold:steel,lip[0]-(2-j)*12*Math.cos(angle),-lip[1]-(2-j)*12*Math.sin(angle),0);o.rotation.z=angle;}
   const center=pts[21]||pts[0],label=document.createElement('canvas');label.width=512;label.height=112;const lc=label.getContext('2d');lc.fillStyle='#143045dd';lc.beginPath();lc.roundRect(0,0,512,112,18);lc.fill();lc.fillStyle=sky.recovery?'#ffcd84':'#a6f1e9';lc.font='bold 32px system-ui';lc.textAlign='center';lc.fillText(sky.recovery?'LOWER DETOUR':`LOOP ${String(sky.stage+1).padStart(2,'0')}`,256,43);lc.font='18px system-ui';lc.fillStyle='#e0e7e9';lc.fillText('THROTTLE / TIME THE GOLD EXIT',256,80);
   const tx=new T.CanvasTexture(label);tx.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(200,44),new T.MeshBasicNodeMaterial({map:tx,transparent:true,depthTest:false}),center[0],-center[1]+290,32).renderOrder=220;
  }
  ties.count=count;ties.instanceMatrix.needsUpdate=true;group.add(ties);
  // Distant low-poly cloud banks: instanced for constant draw-call cost.
  const clouds=new T.InstancedMesh(sphere(T),new T.MeshStandardNodeMaterial({color:night?'#5f7a95':'#daebe8',roughness:1,metalness:0}),180);clouds.frustumCulled=false;
  for(let i=0;i<180;i++){const x=i*147%(course.width*36+1500)-700,y=-2340-Math.sin(i*1.21)*80-(i%3)*60;matrix.makeScale(50+i%5*18,16+i%4*8,25);matrix.setPosition(x,y,-120-i%5*24);clouds.setMatrixAt(i,matrix);}clouds.instanceMatrix.needsUpdate=true;group.add(clouds);
  const light=new T.DirectionalLight(night?'#badde9':'#ffe5c1',2.4);light.position.set(-100,1500,300);group.add(light);group.add(new T.AmbientLight('#8cbdd4',1.8));
  trail=new T.InstancedMesh(new T.BoxGeometry(6,6,6),new T.MeshBasicNodeMaterial({color:'#95f9e5',transparent:true,opacity:.48,depthTest:false}),36);trail.count=0;trail.renderOrder=4900;trail.frustumCulled=false;group.add(trail);
  return group;
 }
 function update(){
  if(!trail||!window.__sky?.active())return;
  const s=__sky.state,p=player,T=engine.THREE;
  if(s.steps!==previous){previous=s.steps;history.push([p.x+13,-p.y-15]);if(history.length>36)history.shift();}
  const fast=Math.hypot(p.vx,p.vy)>12&&!p.dead;trail.count=fast?history.length:0;
  const matrix=new T.Matrix4();for(let i=0;i<history.length;i++){const size=(i+1)/history.length;matrix.makeScale(size,size,size);matrix.setPosition(history[i][0],history[i][1],25);trail.setMatrixAt(i,matrix);}trail.instanceMatrix.needsUpdate=true;
 }
 return {build,update,tube};
})();
