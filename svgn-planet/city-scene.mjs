import {coastalMaterial,worldRoadMaterial,addShopSigns} from './coastal-materials.mjs';
/* Instanced city silhouettes stay resident; detailed streets stream in nearby.
   The original neighborhood, licensed artwork and character are not replaced. */
import * as T from './vendor/three.module.js';
import {CITY,RADIUS,point,norm,add,mul,cross,dot} from './world.mjs';
import {cubePoint,FACES} from './city-data.mjs';
const box=new T.BoxGeometry(1,1,1),trunk=new T.CylinderGeometry(.16,.22,1,7);
const roof=new T.ConeGeometry(1,1,4);roof.rotateY(Math.PI/4);
const dummy=new T.Object3D(),matrix=new T.Matrix4(),color=new T.Color();
const bodyMat=coastalMaterial('stucco');
const roofMat=coastalMaterial('roof');
const trunkMat=new T.MeshStandardMaterial({color:'#a18462',roughness:1});
const leafMat=new T.MeshStandardMaterial({color:'#5f945b',roughness:1,side:T.DoubleSide});
const trimMat=new T.MeshStandardMaterial({color:'#f2e8d0',roughness:.84});
const glassMat=new T.MeshStandardMaterial({color:'#557b88',roughness:.22,metalness:.45});
const darkMat=new T.MeshStandardMaterial({color:'#35545b',roughness:.8});
const woodMat=new T.MeshStandardMaterial({color:'#a97c52',roughness:.9});leafMat.userData.atmosphereRole='leaf';glassMat.userData.atmosphereRole='window';
function palmGeometry(){const p=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,f=[Math.cos(a),0,Math.sin(a)],r=[-f[2],0,f[0]],root=[0,0,0],tip=[f[0]*3,-.7,f[2]*3],left=[f[0]*1.3+r[0]*.55,.3,f[2]*1.3+r[2]*.55],right=[f[0]*1.3-r[0]*.55,.3,f[2]*1.3-r[2]*.55];p.push(...root,...left,...tip,...root,...tip,...right);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;}
const leaves=palmGeometry();
function surface(n,front){const up=new T.Vector3(...n),f=new T.Vector3(...front).projectOnPlane(up).normalize(),r=new T.Vector3().crossVectors(up,f).normalize();return new T.Matrix4().makeBasis(r,up,f).setPosition(new T.Vector3(...point(n,.04)));}
function local(base,p,size){dummy.position.set(...p);dummy.scale.set(...size);dummy.quaternion.identity();dummy.updateMatrix();return new T.Matrix4().multiplyMatrices(base,dummy.matrix);}
function instances(parent,geometry,material,entries,shadow=false){if(!entries.length)return null;const m=new T.InstancedMesh(geometry,material,entries.length);entries.forEach((e,i)=>{m.setMatrixAt(i,e.matrix||e);if(e.color)m.setColorAt(i,color.set(e.color));});m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
function ribbon(out,points,offset,width,lift,skip){
 for(let i=0;i<points.length-1;i++){
  if(skip?.(i))continue;
  const verts=[];
  for(const index of [i,i+1]){const n=points[index],f=norm(add(points[Math.min(points.length-1,index+1)],mul(points[Math.max(0,index-1)],-1))),r=norm(cross(n,f));for(const sign of[-1,1]){const v=norm(add(n,mul(r,(offset+sign*width/2)/RADIUS)));verts.push(point(v,lift));}}
  for(const index of[0,2,1,2,3,1])out.push(...verts[index]);
 }
}
function ribbonMesh(parent,positions,shade){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const m=new T.Mesh(g,shade==='#526469'?worldRoadMaterial():new T.MeshStandardMaterial({color:shade,roughness:.94,side:T.DoubleSide}));m.receiveShadow=true;parent.add(m);return m;}
export function createPlanetCity(parent){
 const root=new T.Group();root.name='Neighborhood Missions - whole-planet city';parent.add(root);
 const roadGroups=[];
 for(let face=0;face<6;face++){
  const roads=new T.Group();roadGroups.push(roads);root.add(roads);const asphalt=[],paving=[],lanes=[],stripes=[];
  for(const r of CITY.roads.filter((r,i)=>i%6===face)){
   const skip=i=>!r.id.startsWith('connector')&&CITY.original(norm(add(r.points[i],r.points[i+1])));
   ribbon(asphalt,r.points,0,r.width,.19,skip);
   for(const side of[-1,1]){
    ribbon(paving,r.points,side*(r.width/2+1.05),2.05,.235,i=>skip(i)||(!r.id.startsWith('connector')&&(i%8===0||i%8===7)));
    ribbon(lanes,r.points,side*(r.width/2-.55),.8,.205,skip);
   }
   ribbon(stripes,r.points,0,.1,.215,i=>skip(i)||i%2===0);
  }
  ribbonMesh(roads,asphalt,'#526469');ribbonMesh(roads,paving,'#d4c8b1');ribbonMesh(roads,lanes,'#739e91');ribbonMesh(roads,stripes,'#ead39a');
 }
 const clusters=[];
 for(let face=0;face<6;face++)for(let ci=0;ci<6;ci++)for(let cj=0;cj<6;cj++){
  const group=new T.Group();root.add(group);const center=cubePoint(face,-1+(ci*2+1)/6,-1+(cj*2+1)/6);
  const shells=[],flatRoofs=[],hips=[],trunks=[],crowns=[];
  const blocks=CITY.blocks.filter(b=>b.face===face&&Math.floor(b.i/2)===ci&&Math.floor(b.j/2)===cj);
  for(const b of blocks.flatMap(b=>b.buildings)){
   const base=surface(b.n,b.front);b.matrix=base;b.inverseMatrix=base.clone().invert();
   shells.push({matrix:local(base,[0,b.h/2,0],[b.w,b.h,b.d]),color:b.color});
   if(b.style==='home')hips.push({matrix:local(base,[0,b.h+.92,0],[b.w*.76,1.85,b.d*.76]),color:b.seed%2?'#aa7155':'#617c83'});
   else flatRoofs.push({matrix:local(base,[0,b.h+.12,0],[b.w+.5,.28,b.d+.5]),color:'#d9d6c8'});
  }
  for(const t of blocks.flatMap(b=>b.trees)){const base=surface(t.n,FACES[face].v);trunks.push(local(base,[0,t.h/2,0],[1,t.h,1]));crowns.push(local(base,[0,t.h,0],[1,1,1]));}
  instances(group,box,bodyMat,shells,true);instances(group,box,roofMat,flatRoofs);instances(group,roof,roofMat,hips,true);instances(group,trunk,trunkMat,trunks);instances(group,leaves,leafMat,crowns);
  group.traverse(m=>{if(m.isMesh)m.userData.coastalShadow=m.castShadow;});clusters.push({g:group,n:center});
 }
 const hubs=[];
 for(const d of CITY.districts){
  const g=new T.Group();g.matrixAutoUpdate=false;g.matrix.copy(surface(d.mail,d.front));root.add(g);
  const stem=new T.Mesh(box,woodMat);stem.position.set(1.9,1.25,0);stem.scale.set(.12,2.5,.12);g.add(stem);
  const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#234c57';ctx.fillRect(0,0,512,160);ctx.strokeStyle='#ebce91';ctx.lineWidth=8;ctx.strokeRect(5,5,502,150);ctx.textAlign='center';ctx.fillStyle='#fff0c8';ctx.font='bold 27px system-ui';ctx.fillText(d.name.toUpperCase(),256,64,477);ctx.font='22px system-ui';ctx.fillText('NEIGHBORHOOD MISSIONS',256,108,465);
  const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(3.2,1),new T.MeshStandardMaterial({map:tx,roughness:.8,side:T.DoubleSide}));sign.position.set(1.9,2.3,0);g.add(sign);
  const ring=new T.Mesh(new T.TorusGeometry(2,.065,6,32),new T.MeshBasicMaterial({color:'#f7c665'}));ring.rotation.x=Math.PI/2;ring.position.y=.26;g.add(ring);hubs.push({g,ring,d});
  const center=surface(d.n,d.front),park=new T.Group();root.add(park);
  instances(park,box,trimMat,[local(center,[0,.12,0],[28,.2,28])]);
  const waterMat=new T.MeshStandardMaterial({color:/Marina|Canals|Bay|Coast/.test(d.name)?'#65afba':'#719961',roughness:.4});
  instances(park,box,waterMat,[local(center,[0,.24,0],[23,.12,23])]);
  const benches=[];for(const side of[-1,1]){benches.push(local(center,[side*11,.55,0],[.55,.18,3]));benches.push(local(center,[side*11.3,1,0],[.14,.85,3]));}instances(park,box,woodMat,benches);
 }
 const detailRoot=new T.Group();root.add(detailRoot);const cache=new Map();let last=-Infinity,visible=0,createdChunks=0;
 function detail(block){
  const g=new T.Group(),frames=[],windows=[],doors=[],awnings=[],lamps=[],wood=[];
  for(const b of block.buildings){
   const base=b.matrix,rows=Math.max(1,Math.floor(b.h/2.8));
   for(let row=0;row<rows;row++)for(const side of[-1,1])for(const x of[-.29,0,.29]){
    if(row===0&&x===0&&side===1)continue;
    frames.push(local(base,[x*b.w,1.9+row*2.8,side*(b.d/2+.04)],[1.65,1.7,.16]));
    windows.push(local(base,[x*b.w,1.9+row*2.8,side*(b.d/2+.14)],[1.36,1.4,.04]));
   }
   for(let row=0;row<rows;row++)for(const side of[-1,1])for(const z of[-.25,.25]){
    frames.push(local(base,[side*(b.w/2+.04),1.9+row*2.8,z*b.d],[.16,1.7,1.65]));
    windows.push(local(base,[side*(b.w/2+.14),1.9+row*2.8,z*b.d],[.04,1.4,1.36]));
   }
   frames.push(local(base,[0,1.22,b.d/2+.09],[1.55,2.45,.17]));doors.push(local(base,[0,1.13,b.d/2+.20],[1.2,2.24,.09]));
   frames.push(local(base,[0,.2,b.d/2+.85],[3.5,.25,1.8]));
   if(b.style==='shop'||b.style==='kiosk')awnings.push(local(base,[0,2.8,b.d/2+.8],[b.w*.83,.2,1.8]));
   if(b.style==='tower')doors.push(local(base,[0,b.h+.5,0],[b.w*.4,.7,b.d*.4]));
   frames.push(local(base,[0,.18,0],[b.w+.35,.36,b.d+.35]));
   if(b.style==='home'){
    frames.push(local(base,[0,3.35,b.d/2+1.2],[b.w*.54,.16,2.5]));
    for(const side of[-1,1])frames.push(local(base,[side*b.w*.24,1.76,b.d/2+2.2],[.15,3.1,.15]));
    wood.push(local(base,[b.w*.24,1,b.d/2+.8],[2.2,.65,.7]));
   }
   if(b.style==='apartment'||b.style==='tower')for(let row=1;row<Math.min(rows,5);row++){
    frames.push(local(base,[0,.95+row*2.8,b.d/2+.6],[b.w*.75,.14,1.2]));
    lamps.push(local(base,[0,1.85+row*2.8,b.d/2+1.18],[b.w*.75,.065,.065]));
    for(const x of[-.34,-.17,0,.17,.34])lamps.push(local(base,[x*b.w,1.42+row*2.8,b.d/2+1.18],[.055,.88,.055]));
   }
  }
  const n=cubePoint(block.face,-1+(block.i+.04)*2/12,-1+(block.j+.04)*2/12),base=surface(n,FACES[block.face].v);
  lamps.push(local(base,[0,2.9,0],[.12,5.8,.12]));lamps.push(local(base,[0,5.73,.48],[.13,.12,1.1]));frames.push(local(base,[0,5.64,.94],[.4,.12,.55]));
  const intersection=cubePoint(block.face,-1+block.i*2/12,-1+block.j*2/12),walk=surface(intersection,FACES[block.face].v);
  if(!CITY.original(intersection))for(let i=-3;i<=3;i++)frames.push(local(walk,[i*.9,.24,4.8],[.45,.025,2]));
  instances(g,box,trimMat,frames);instances(g,box,glassMat,windows);instances(g,box,darkMat,doors);instances(g,box,roofMat,awnings);instances(g,box,darkMat,lamps);instances(g,box,woodMat,wood);addShopSigns(g,block.buildings);detailRoot.add(g);cache.set(block.id,{g,block,used:performance.now()});createdChunks++;return g;
 }
 function update(n,overview,low){
  const now=performance.now();if(now-last<70)return;last=now;
  const limit=low?175:290,preload=low?220:365;
  for(const c of clusters){const d=Math.sqrt(Math.max(0,2-2*dot(n,c.n)))*RADIUS;c.g.visible=overview||d<650;const shadows=!low&&!overview&&d<225;if(c.shadows!==shadows){c.shadows=shadows;c.g.traverse(m=>{if(m.isMesh)m.castShadow=shadows&&!!m.userData.coastalShadow;});}}
  const close=CITY.blocks.map(b=>({b,d:Math.sqrt(Math.max(0,2-2*dot(n,b.n)))*RADIUS})).filter(x=>x.d<preload).sort((a,b)=>a.d-b.d);
  let budget=1;for(const {b}of close)if(!cache.has(b.id)&&budget-->0)detail(b);
  visible=0;for(const [id,c]of cache){const d=Math.sqrt(Math.max(0,2-2*dot(n,c.block.n)))*RADIUS;c.g.visible=!overview&&d<limit;if(c.g.visible){visible++;c.used=now;}if(cache.size>48&&d>550){c.g.traverse(o=>{if(o.isInstancedMesh)o.dispose?.();else if(o.isMesh)o.geometry.dispose();});detailRoot.remove(c.g);cache.delete(id);}}
  for(const {g,d}of hubs)g.visible=!overview&&dot(n,d.mail)>.96;
 }
 return {update,inspect:()=>({version:CITY.version,buildings:CITY.buildings.length,blocks:CITY.blocks.length,roads:CITY.roads.length,districts:CITY.districts.length,palms:CITY.trees.length,createdChunks,streamBudget:1,residentClusters:clusters.length,detailChunks:cache.size,visibleDetailChunks:visible,radius:RADIUS})};
}
