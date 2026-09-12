import * as T from './vendor/three.module.js';
import {FLOODGATE_NOTES} from './floodgate-content.mjs';
/* Original environmental storytelling. Static props are batched by material;
 * the low garden walls themselves use the authoritative collision geometry. */
export function createFirstLightArt(scene,A,chapter){
 if(chapter.id!=='district')return {update(){},stats:()=>({notes:0,instances:0})};
 const buckets=new Map(),records=[];let count=0;
 function add(shape,scale,color,at,type='wood',rotation=0){const material=A.mat(color,type),key=shape+'/'+color+'/'+type;let bucket=buckets.get(key);if(!bucket){bucket={geometry:A.geos[shape],material,items:[]};buckets.set(key,bucket);}bucket.items.push(new T.Matrix4().compose(new T.Vector3(...at),new T.Quaternion().setFromEuler(new T.Euler(0,rotation,0)),new T.Vector3(...scale)));count++;}
 // Pergola posts stay within the physical low walls. Broken rafters leave the
 // playable route open; lamps and signs direct attention rather than gate it.
 for(const z of [14.4,19.6]){add('box',[.18,2.8,.18],0x726b51,[-29,1.4,z]);add('box',[.21,.19,1.9],0x827655,[-29,2.75,z-.55]);}
 add('box',[.23,.24,6.2],0x605b48,[-29,2.8,17]);
 for(const x of [-24.1,-19.9]){add('box',[.16,2.2,.17],0x726b51,[x,1.1,22]);add('box',[.28,.1,.36],0x484e40,[x,2.3,22]);}
 add('box',[4.4,.17,.19],0x777051,[-22,2.22,22]);
 A.label('RAIN GARDEN\nCLINIC / WEST',-22,1.75,22.12,3.0,.68,'#344f45','#e2dbb8');
 // Mark the existing eastern approach, not an unimplemented extra district.
 A.label('FREIGHT HALL\nEAST VERGE / NORTH',8.41,1.9,16.8,2,.75,'#544f3e','#eee0b6');
 A.label('RECORD AT SHELTER\nTHEN CONTINUE NORTH',-26.95,2.3,8.41,2,.63,'#344f45','#e2dbb8');
 for(const n of FLOODGATE_NOTES){
  // A narrow stand next to the standing point: no invisible wall is introduced.
  const x=n.x,z=n.z-.42;add('box',[.08,.7,.08],0x666959,[x,.35,z]);add('box',[.40,.035,.30],0x76674e,[x,.74,z]);add('box',[.28,.01,.23],0xc9b88a,[x,.765,z]);add('box',[.028,.018,.24],0x4e5544,[x-.08,.78,z]);
  const lamp=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshStandardMaterial({color:0xe6c98b,emissive:0x92672b,emissiveIntensity:.6}));lamp.position.set(x+.16,.79,z);scene.add(lamp);records.push({id:n.id,lamp});
  A.label('FIELD RECORD',x,1.12,z-.06,1.0,.23,'#344338','#e5d7ad');
 }
 // A cloth evacuation line and seed trays give the quiet corner a human scale.
 for(let i=0;i<5;i++){add('box',[.48,.16,.36],0x645f44,[-28.7,.63,14.8+i*.83]);for(let k=0;k<3;k++)add('cone',[.10,.25,.10],0x64774a,[-28.65+(k-1)*.12,.82,14.8+i*.83]);}
 for(const bucket of buckets.values()){const mesh=new T.InstancedMesh(bucket.geometry,bucket.material,bucket.items.length);bucket.items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);}
 return {update(s){for(const item of records){const read=(s.fieldNotes||[]).includes(item.id);item.lamp.material.emissiveIntensity=read?.08:.6;item.lamp.material.color.setHex(read?0x8a9e7b:0xe6c98b);}},stats:()=>({notes:records.length,instances:count})};
}
