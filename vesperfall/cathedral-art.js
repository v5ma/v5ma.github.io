/* Local CC0 photographed materials and finished sculpture; original structural
 * meshes. See the asset register for sources, license and optimized derivatives. */
(function(root){'use strict';
 const previous=VesperArt.create;
 VesperArt.create=function(T,scene){
  const kit=previous(T,scene),sharedMaterials=new Set(),sharedGeometry=new Set(),tex=new Map(),archive=new Map();
  const status={textures:0,expectedTextures:6,sculptures:0,errors:[]},loader=new T.TextureLoader();
  function texture(name,color=false){if(tex.has(name))return tex.get(name);const t=loader.load('./assets/cathedral/'+name+'.jpg',()=>status.textures++,undefined,()=>status.errors.push('Texture failed: '+name));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;tex.set(name,t);return t;}
  function material(name,color,kind='masonry',roughness=.95){const m=new T.MeshStandardMaterial({color,roughness,metalness:0,map:texture(kind+'-color',true),normalMap:texture(kind+'-normal'),roughnessMap:texture(kind+'-arm'),aoMap:texture(kind+'-arm'),aoMapIntensity:.72,normalScale:new T.Vector2(.75,.75)});m.name=name;m.aoMap.channel=0;sharedMaterials.add(m);return m;}
  const stone=material('CC0 weathered castle masonry','#c6cdca'),pale=material('Limestone trim','#e6dcc5'),dark=material('Cool shadow masonry','#849391'),paving=material('CC0 photographed cobblestones','#d1d0c2','paving',.82),slate=material('Dark paving','#636f71','paving',.86);
  const gold=new T.MeshStandardMaterial({color:'#bca278',metalness:.55,roughness:.4}),copper=new T.MeshStandardMaterial({color:'#517e78',metalness:.35,roughness:.73}),wood=new T.MeshStandardMaterial({color:'#514034',roughness:.88}),ivory=new T.MeshStandardMaterial({color:'#d6c7a5',roughness:.62}),ember=new T.MeshBasicMaterial({color:'#ffce83'});
  for(const m of[gold,copper,wood,ivory,ember])sharedMaterials.add(m);
  const unitBox=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,16),sphere=new T.SphereGeometry(1,12,8);for(const g of[unitBox,cylinder,sphere])sharedGeometry.add(g);
  const lathe=new T.LatheGeometry([[0,0],[.49,0],[.49,.12],[.40,.18],[.31,.24],[.25,.32],[.23,.42],[.23,.88],[.3,.91],[.39,.96],[.4,1],[0,1]].map(p=>new T.Vector2(...p)),16);sharedGeometry.add(lathe);const railLathe=new T.LatheGeometry(lathe.parameters.points,8);sharedGeometry.add(railLathe);
  class Batch{
   constructor(){this.parts=new Map();this.count=0;}
   add(geo,mat,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0){let cells=this.parts.get(mat);if(!cells){cells=new Map();this.parts.set(mat,cells);}const cell=Math.floor(x/18)+':'+Math.floor(z/18);let group=cells.get(cell);if(!group){group={positions:[],normals:[],uvs:[],indices:[]};cells.set(cell,group);}const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz)),normalMatrix=new T.Matrix3().getNormalMatrix(matrix),pos=geo.getAttribute('position'),norm=geo.getAttribute('normal'),base=group.positions.length/3,p=new T.Vector3(),n=new T.Vector3();
    for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(matrix);n.fromBufferAttribute(norm,i).applyMatrix3(normalMatrix).normalize();group.positions.push(p.x,p.y,p.z);group.normals.push(n.x,n.y,n.z);const a=[Math.abs(n.x),Math.abs(n.y),Math.abs(n.z)],scale=mat===paving||mat===slate?2.7:2.2;group.uvs.push((a[0]>a[1]&&a[0]>a[2]?p.z:p.x)/scale,(a[1]>a[0]&&a[1]>a[2]?p.z:p.y)/scale);}
    const index=geo.getIndex();if(index)for(let i=0;i<index.count;i++)group.indices.push(base+index.getX(i));else for(let i=0;i<pos.count;i++)group.indices.push(base+i);this.count++;
   }
   box(mat,x,y,z,w,h,d,ry=0){this.add(unitBox,mat,x,y,z,w,h,d,ry);}
   finish(parent){for(const [mat,cells]of this.parts)for(const p of cells.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(p.normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(p.uvs,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setIndex(p.indices);g.computeBoundingSphere();const m=new T.Mesh(g,mat);m.name=mat.name||'Batched cathedral detail';m.castShadow=m.receiveShadow=true;parent.add(m);}return this.count;}
  }
  function line(b,a,c,r,mat){const v=new T.Vector3(...c).sub(new T.Vector3(...a)),p=new T.Vector3(...a).add(new T.Vector3(...c)).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()),e=new T.Euler().setFromQuaternion(q);b.add(cylinder,mat,p.x,p.y,p.z,r,v.length(),r,e.y,e.x,e.z);}
  function archGeometry(w,h,depth=.3){const key=w.toFixed(2)+'/'+h.toFixed(2)+'/'+depth;if(archive.has(key))return archive.get(key);const wall=.20;
   function points(width,height){const p=[[-width,0],[-width,height*.56]],theta=Math.acos(1/3);for(let i=1;i<=16;i++){const a=i/16*theta;p.push([width/2-1.5*width*Math.cos(a),height*.56+height*.44*Math.sin(a)/Math.sqrt(8/9)]);}for(let i=15;i>=0;i--){const a=i/16*theta;p.push([-width/2+1.5*width*Math.cos(a),height*.56+height*.44*Math.sin(a)/Math.sqrt(8/9)]);}p.push([width,0]);return p;}
   const p=points(w,h).concat(points(w-wall,h-wall).reverse()),shape=new T.Shape();shape.moveTo(...p[0]);for(const q of p.slice(1))shape.lineTo(...q);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:8});g.translate(0,0,-depth/2);archive.set(key,g);sharedGeometry.add(g);return g;
  }
  function arch(b,x,y,z,w,h,ry=0,mat=pale){b.add(archGeometry(w,h),mat,x,y,z,1,1,1,ry);}
  function column(b,x,y,z,h){b.add(lathe,pale,x,y,z,.85,h,.85);for(let j=0;j<6;j++){const a=j*Math.PI/3;b.add(cylinder,stone,x+Math.cos(a)*.19,y+h*.56,z+Math.sin(a)*.19,.045,h*.67,.045);}}
  function roofGeometry(w,h,d){const key='roof'+w+h+d;if(archive.has(key))return archive.get(key);const shape=new T.Shape();shape.moveTo(-w,0);shape.lineTo(0,h);shape.lineTo(w,0);shape.lineTo(-w,0);const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1});g.translate(0,0,-d/2);archive.set(key,g);sharedGeometry.add(g);return g;}
  function glassTexture(){const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.fillStyle='#162d3a';g.fillRect(0,0,1024,1024);g.translate(512,512);const colors=['#578c91','#d2a95f','#637a9c','#8b516d','#a4bbb0','#b38660'];
   for(let ring=0;ring<4;ring++){const n=ring<2?12:24,r=60+ring*112;for(let j=0;j<n;j++){g.save();g.rotate(j*Math.PI*2/n+(ring%2?.12:0));g.translate(0,-r);g.fillStyle=colors[(j+ring*2)%colors.length];g.strokeStyle='#141f27';g.lineWidth=10;g.beginPath();g.moveTo(0,-58);g.bezierCurveTo(42,-8,39,25,0,65);g.bezierCurveTo(-39,25,-42,-8,0,-58);g.fill();g.stroke();g.strokeStyle='#d0bea0';g.lineWidth=2;g.stroke();g.restore();}}
   for(const r of[48,142,260,379,483]){g.strokeStyle='#d3c19c';g.lineWidth=12;g.beginPath();g.arc(0,0,r,0,7);g.stroke();}const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false});sharedMaterials.add(m);return m;
  }
  const glass=glassTexture(),roseGeo=new T.CircleGeometry(1,64),ringGeo=new T.TorusGeometry(1,.052,8,56);sharedGeometry.add(roseGeo);sharedGeometry.add(ringGeo);
  function rose(parent,b,x,y,z,r,ry){const m=new T.Mesh(roseGeo,glass);m.name='Original leaded rose-glass window';m.position.set(x,y,z);m.rotation.y=ry;m.scale.setScalar(r);parent.add(m);b.add(ringGeo,pale,x,y,z,r*1.06,r*1.06,r*1.8,ry);b.add(ringGeo,gold,x,y,z,r*.97,r*.97,r*.3,ry);}
  function candle(b,x,y,z){b.add(cylinder,gold,x,y+.08,z,.08,.16,.08);b.add(cylinder,ivory,x,y+.27,z,.055,.28,.055);b.add(sphere,ember,x,y+.47,z,.042,.13,.042);}
  const sculpture=new Promise(resolve=>{new T.GLTFLoader().load('./assets/cathedral/marble-bust.glb',g=>{g.scene.traverse(o=>{if(o.geometry)sharedGeometry.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])sharedMaterials.add(m);});status.sculptures=1;resolve(g.scene);},undefined,()=>{status.errors.push('Sculpture failed to load');resolve(null);});});
  function world(model){
   const parent=new T.Group();parent.name='Living Cathedral / material-authored district';parent.userData.cathedral=true;const b=new Batch();
   for(const f of model.floors){if(f.type==='stair'){
     const n=36,ascending=(f.slopeZ||0)>0;for(let i=0;i<n;i++){const z=f.z-f.d/2+(i+.5)*f.d/n,y=CloisterLayout.elevation(f,[f.x,0,z]);b.box(paving,f.x,y-.035,z,f.w,.07,f.d/n+.01);b.box(gold,f.x,y+.004,z+(ascending?-1:1)*f.d/n*.35,f.w,.013,.035);}continue;
    }
    if(f.y===0)b.box(dark,f.x,-.35,f.z,f.w,.7,f.d);
    // Keep the visible paving cap 5 mm above its supporting block, below the 18 mm outer inlay. Collision floors are unchanged.
    b.box(f.y?pale:paving,f.x,f.y-.005,f.z,f.w,.02,f.d);
    if(f.type==='bridge'){const along=f.w>f.d;for(const side of[-1,1]){const x=f.x+(along?0:side*(f.w/2-.16)),z=f.z+(along?side*(f.d/2-.16):0);b.box(pale,x,.64,z,along?f.w:.13,.15,along?.13:f.d);const n=Math.floor((along?f.w:f.d)/.65);for(let i=0;i<=n;i++)b.add(railLathe,stone,x+(along?(i/n-.5)*(f.w-.3):0),0,z+(along?0:(i/n-.5)*(f.d-.3)),.22,.63,.22);}}
   }
   for(const s of model.solids){const p=s.min.map((v,i)=>(v+s.max[i])/2),d=s.max.map((v,i)=>v-s.min[i]);
    if(s.type==='roof-volume'||s.type==='statue-plinth')continue;
    if(s.type==='column'){column(b,p[0],0,p[2],d[1]);continue;}
    if(s.type==='balustrade'){const along=d[0]>d[2],n=Math.max(1,Math.ceil((along?d[0]:d[2])/.52));b.box(pale,p[0],s.max[1]-.055,p[2],d[0]+.08,.13,d[2]+.08);b.box(dark,p[0],s.min[1]+.08,p[2],d[0],.16,d[2]);for(let j=0;j<=n;j++)b.add(railLathe,pale,p[0]+(along?(j/n-.5)*d[0]:0),s.min[1]+.12,p[2]+(along?0:(j/n-.5)*d[2]),.16,d[1]-.22,.16);continue;}
    b.box(s.type==='cover'?dark:s.type==='gallery-deck'?pale:stone,...p,...d);
    if(s.type==='wall'){b.box(pale,p[0],s.max[1]+.06,p[2],d[0]+.18,.16,d[2]+.18);if(s.min[1]<.1){b.box(dark,p[0],.18,p[2],d[0]+.16,.36,d[2]+.16);if(d[1]>6)b.box(pale,p[0],3.0,p[2],d[0]+.06,.12,d[2]+.06);}}
   }
   for(const r of model.rooms){const hw=r.w/2,hd=r.d/2,tall=r.planFamily==='nave',height=tall?10.4:r.planFamily==='court'?4.4:8.4;
    for(const n of model.links[r.id]){const q=model.rooms[n],dx=Math.sign(q.x-r.x),dz=Math.sign(q.z-r.z);arch(b,r.x+dx*hw,0,r.z+dz*hd,2.5,6.2,dx?Math.PI/2:0);}
    const solidSide=[[0,-1],[0,1],[-1,0],[1,0]].find(([dx,dz])=>!model.links[r.id].some(n=>Math.sign(model.rooms[n].x-r.x)===dx&&Math.sign(model.rooms[n].z-r.z)===dz));
    if(solidSide&&r.planFamily!=='court'){const [dx,dz]=solidSide;rose(parent,b,r.x+dx*(hw-.23),tall?6.5:5.65,r.z+dz*(hd-.23),tall?2.65:2.0,dx?Math.PI/2:0);}
    for(const side of[-1,1])for(let i=0;i<(tall?4:2);i++){const z=r.z+(i-(tall?1.5:.5))*(tall?4.3:4.8),x=r.x+side*(hw-.24);if(r.planFamily==='transept'&&Math.abs(z-r.z)>5.6)continue;arch(b,x,3.5,z,.69,3.2,Math.PI/2);b.box(copper,x-side*.03,4.9,z,.025,2.0,1.08);for(const dz of[-.3,0,.3])b.box(pale,x-side*.07,4.9,z+dz,.10,2.1,.044);}
    if(r.planFamily==='nave'||r.planFamily==='archive'){
     const count=tall?4:3;for(let i=0;i<count;i++){const z=r.z+(i-(count-1)/2)*(r.d-4)/(count-1);arch(b,r.x,0,z,hw-.7,height+1.5,0);for(const side of[-1,1])column(b,r.x+side*(hw-.7),0,z,height*.53);}
     b.add(roofGeometry(hw+.4,3.0,r.d+.6),r.planFamily==='archive'?copper:slate,r.x,height+1.6,r.z);
    }else if(r.planFamily==='court'){
     for(let i=0;i<12;i++)for(const side of[-1,1])b.box(pale,r.x+(i-5.5)*(r.w/12),4.2,r.z+side*hd,.8,.9,.7);
    }else{
     const span=r.planFamily==='transept'?5.8:hw-.7;for(const z of[-hd+1.1,hd-1.1])arch(b,r.x,0,r.z+z,span,9.1,0);
     for(const side of[-1,1])for(const end of[-1,1]){let p=[r.x+side*Math.min(6,hw-1),6.2,r.z+end*Math.min(6,hd-1)];for(let j=1;j<=12;j++){const t=j/12,q=[r.x+side*Math.min(6,hw-1)*(1-t),6.2+3.0*Math.sin(t*Math.PI/2),r.z+end*Math.min(6,hd-1)*(1-t)];line(b,p,q,.08,pale);p=q;}}
    }
    for(const side of[-1,1]){const x=r.x+side*(hw+.3),z=r.z-hd+.5;b.box(dark,x,3.9,z,1.3,7.8,1.3);b.box(pale,x,7.9,z,1.6,.25,1.6);b.add(roofGeometry(1.05,4.2,2.1),r.planFamily==='archive'?copper:slate,x,8,z,1,1,1,Math.PI/4);}
    for(const side of[-1,1])b.box(pale,r.x+side*2.55,.015,r.z,.055,.015,Math.min(12,r.d-3));
    if(r.planFamily==='archive')for(const s of model.solids.filter(s=>s.type==='cover'&&s.room===r.id)){const x=(s.min[0]+s.max[0])/2,z=(s.min[2]+s.max[2])/2;for(let j=0;j<8;j++)b.box(j%2?wood:copper,x+(j%3)*.025,1.12+j*.065,z,.54,.06,.32,(j%3-1)*.08);candle(b,x+.58,1.1,z);}
    kit.label(parent,r.label.toUpperCase(),r.x,2.25,r.z+hd-.28,3.5,.28,'#1e3038','#e6d2a0').rotation.y=Math.PI;
    for(const side of[-1,1])candle(b,r.x+side*(hw-1),.1,r.z+hd-1);
    b.add(roofGeometry(hw,4,r.d),dark,r.x,-.7,r.z,1,1,1,0,Math.PI);
   }
   for(const loft of [...model.architecture.lofts,...model.architecture.extraLofts]){const r=model.rooms[loft.room];kit.label(parent,'UPPER WALK / '+r.label.toUpperCase(),loft.entry[0],.85,loft.entry[2]-.5,2.4,.24,'#21383f','#e6d1a0');}
   kit.label(parent,'CHOIR GALLERY / ASCEND',-4.65,.9,4.4,2.35,.23,'#21383f','#e6d1a0');
   for(const route of model.architecture.routes){for(const p of[route.a,route.b])arch(b,p[0],p[1],p[2],1.4,3.0,Math.PI/2,pale);kit.label(parent,'PROCESSIONAL SKYWALK / RELIQUARY',route.a[0]+3.5,4.45,route.a[2]-.98,3.0,.25,'#223039','#e8cf94');}
   const tower=model.architecture.tower;if(tower)kit.label(parent,'BELFRY CROWN / 6.4 m',tower.entry[0],4.05,tower.entry[2]+.12,2.8,.25,'#263846','#e5cca0');
   for(const p of model.decorations||[]){b.add(lathe,dark,p.x,0,p.z,.75,1.0,.75);sculpture.then(asset=>{if(!asset||parent.userData.retired)return;const model=asset.clone(true),bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),s=1.35/size.y;model.scale.setScalar(s);model.position.set(p.x-center.x*s,1-bounds.min.y*s,p.z-center.z*s);model.rotation.y=p.yaw||0;model.name='CC0 Marble Bust 01 / Poly Haven';model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});parent.add(model);parent.userData.loadedSculptures=(parent.userData.loadedSculptures||0)+1;if(scene.renderer)scene.renderer.shadowMap.needsUpdate=true;});}
   for(const [i,p]of model.targets.entries()){b.add(cylinder,gold,p[0],p[1]/2,p[2],.05,p[1],.05);b.add(ringGeo,gold,...p,.48,.48,.3);b.add(sphere,copper,...p,.28,.28,.09);}
   const exit=model.rooms[model.exit];arch(b,exit.x,0,exit.z-4,2.2,6.3,0,gold);kit.label(parent,'THE NEXT BELL',exit.x,4.95,exit.z-3.8,3.7,.45);const gate=new T.Group();gate.position.set(exit.x,1.8,exit.z-3.8);parent.add(gate);kit.mesh('ring','#80b8ac',gate,0,0,0,1.1,1.4,1);kit.mesh('ring','#b69a6d',gate,0,0,.02,.82,1.1,.8);
   const instances=b.finish(parent);parent.userData.materials=status;parent.userData.architecture={floorCount:model.floors.length,solidCount:model.solids.length,roseWindows:parent.children.filter(c=>c.name==='Original leaded rose-glass window').length,gallery:true,roomFamilies:[...new Set(model.rooms.map(r=>r.planFamily))]};return {group:parent,gate,instances};
  }
  function dispose(group){if(!group.userData.cathedral)return kit.dispose(group);group.userData.retired=true;group.traverse(o=>{if(o.geometry&&!sharedGeometry.has(o.geometry)&&!Object.values(kit.geos).includes(o.geometry))o.geometry.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!sharedMaterials.has(m)&&m.map?.isCanvasTexture){m.map.dispose();m.dispose();}});group.removeFromParent();}
  return {...kit,world,dispose,cathedralStatus:status};
 };
})(globalThis);
