import * as T from '../vendor/three.module.js';
import {HIGHLINE_TOWERS,highlineRestored} from './highline-layout.mjs';

// Two instanced draws per stair flight rather than one draw per tread/post.
// The support slope and visible tread samples come from the same floor record.
export function addHighlineStair(group,f,material,floorHeight){
 const geo=new T.BoxGeometry(1,1,1),matrix=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3(),scale=new T.Vector3();
 const treads=new T.InstancedMesh(geo,material(0xc1aa87),16),posts=new T.InstancedMesh(geo,material(0x435f68),18);
 for(let i=0;i<16;i++){const z=f.z-f.d/2+(i+.5)*f.d/16;p.set(f.x,floorHeight(f,z)-.13,z);scale.set(f.w,.26,f.d/16+.03);matrix.compose(p,q,scale);treads.setMatrixAt(i,matrix);}
 let n=0;for(const x of [f.x-f.w/2,f.x+f.w/2])for(let i=0;i<9;i++){const z=f.z-f.d/2+i*f.d/8;p.set(x,floorHeight(f,z)+.48,z);scale.set(.06,.96,.06);matrix.compose(p,q,scale);posts.setMatrixAt(n++,matrix);}
 for(const mesh of [treads,posts]){mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);}
}

export function createHighlineView({world,wallMeshes,box,cyl,label}){
 const group=new T.Group();group.name='Highline / occupied upper city';world.add(group);
 const geometry=new T.BoxGeometry(1,1,1),windowMat=new T.MeshStandardMaterial({color:0x426879,roughness:.3,metalness:.2,emissive:0x173740,emissiveIntensity:.24});
 let windowCount=0;
 // Windows are children of their real collision walls. A cutaway hides the
 // entire facade, so glass rectangles cannot remain floating across the player.
 for(const {w,m} of wallMeshes.filter(v=>v.w.highline&&!v.w.id.startsWith('highline-rail'))){
  const horizontal=w.w>w.d,length=horizontal?w.w:w.d,cols=Math.max(1,Math.floor((length-.8)/1.7)),rows=Math.max(1,Math.floor(w.h/3.2));
  const windows=new T.InstancedMesh(geometry,windowMat,cols*rows),matrix=new T.Matrix4(),p=new T.Vector3(),scale=new T.Vector3(),q=new T.Quaternion();
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const along=(col-(cols-1)/2)*1.7,y=w.y+1.45+row*3.2;
   p.set(horizontal?along/w.w:0,(y-(w.y+w.h/2))/w.h,horizontal?0:along/w.d);
   scale.set(horizontal?1.05/w.w:1.12,1.5/w.h,horizontal?1.12:1.05/w.d);matrix.compose(p,q,scale);windows.setMatrixAt(row*cols+col,matrix);
  }
  windows.instanceMatrix.needsUpdate=true;m.add(windows);windowCount+=cols*rows;
 }
 for(const t of HIGHLINE_TOWERS){
  for(let i=1;i<=t.flights;i++){const y=Math.round((4.4+i*3.2)*10)/10,z=i%2?2.5:-5.05;
   // Landing lights and a readable floor number; no head-locked waypoint plane.
   for(const x of [t.x-t.w/2+.3,t.x+t.w/2-.3])box(group,0xe5bd69,x,y+.08,z,.32,.08,.42);
   if(i%2===0)label(t.name+' / '+y+' m',t.x,y+1.55,z-.33,4.2,.42,'#203d4a','#ffe6aa',group);
  }
  label(t.name,t.x,t.top-1.5,3.72,t.w-.8,.7,t.id==='print'?'#754e39':'#305b68','#ffe8b7',group);
 }
 label('HIGHLINE STAIRS / ARCHIVE',-15,5.65,-4.55,3.1,.38,'#754e39','#ffe8b7',group);
 label('HIGHLINE STAIRS / RADIO MAST',18,5.65,-4.55,3.4,.38,'#305b68','#ffe8b7',group);
 // Original relay props carry investigation and an observable saved consequence.
 box(group,0x5c5147,-12.5,11.4,-5.3,.9,1.2,.35);
 label('ADA / UPPER ARCHIVE',-12.5,12.55,-5.38,2.8,.36,'#754e39','#ffe8b7',group);
 box(group,0x405f68,15,24.2,-5.35,.75,1.2,.35);
 cyl(group,0x3b5661,16.8,25.2,-5.05,.075,3.2);
 for(const y of [24.8,25.4,26])box(group,0x779a9f,16.8,y,-5.05,1.7,.035,.035);
 const lamp=box(group,0xffa35b,15,24.66,-5.1,.32,.22,.12);lamp.material=lamp.material.clone();
 let restored=false;
 return {update(s){restored=highlineRestored(s);lamp.material.color.setHex(restored?0x79e8bc:0xffa35b);lamp.material.emissive.setHex(restored?0x174e35:0x53250e);},
  inspect:()=>({towers:HIGHLINE_TOWERS.map(t=>({id:t.id,roof:t.top})),crossings:[10.8,17.2],windows:windowCount,repeaterRestored:restored,sharedCollisionGeometry:true,forcedCamera:false})};
}
