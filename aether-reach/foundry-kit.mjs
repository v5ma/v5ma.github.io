/* Original bounded material/geometry kit. No network assets or simulation writes. */
import * as T from './vendor/three.module.js';
import {makeRiftMaterial} from './skyglass-shaders.mjs';
export function surfacePixels(kind,size=128){
 const out=new Uint8Array(size*size*4),base=kind==='stone'?[188,177,151]:kind==='timber'?[128,92,57]:[62,91,92];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const seed=((x*374761393+y*668265263)^(x*y+17))>>>0,n=(seed%19)-9;
  const seam=kind==='stone'?(y%32<2||(x+(Math.floor(y/32)%2)*32)%64<2):kind==='timber'?y%32<2:false;
  const grain=kind==='timber'?Math.sin(x*.13+Math.sin(y*.19)*2)*7:kind==='metal'?(x%16===0?5:0):0;
  const i=(y*size+x)*4;for(let c=0;c<3;c++)out[i+c]=Math.max(0,Math.min(255,base[c]+n+grain-(seam?32:0)));out[i+3]=255;
 }return out;
}
export function createFoundryKit(scene){
 const root=new T.Group();root.name='foundry-finish';scene.add(root);
 const geometry={box:new T.BoxGeometry(1,1,1),cylinder:new T.CylinderGeometry(1,1,1,12),sphere:new T.SphereGeometry(1,10,8),ring:new T.TorusGeometry(1,.035,4,24)};
 const textures=[],materials={};
 for(const kind of ['stone','timber','metal']){const tx=new T.DataTexture(surfacePixels(kind),128,128,T.RGBAFormat);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.needsUpdate=true;textures.push(tx);materials[kind]=new T.MeshStandardMaterial({map:tx,roughness:kind==='metal'?.54:.92,metalness:kind==='metal'?.5:0});}
 for(const [key,color,metalness]of [['brass','#c4a367',.65],['dark','#253d44',.2],['cloth','#517e82',0],['skin','#c09370',0],['hair','#302e35',0],['paper','#eee0b8',0],['leather','#6c4736',0]])materials[key]=new T.MeshStandardMaterial({color,roughness:.75,metalness});
 materials.glow=new T.MeshBasicMaterial({color:'#a5efdb'});materials.ghost=makeRiftMaterial();
 const batches=new Map(),dummy=new T.Object3D();
 function add(shape,mat,pos,scale,parent=root){const m=new T.Mesh(geometry[shape],materials[mat]);m.position.set(...pos);m.scale.set(...scale);m.castShadow=mat!=='glow'&&mat!=='ghost';m.receiveShadow=true;parent.add(m);return m;}
 function batch(shape,mat,pos,scale,rotation=[0,0,0]){const key=shape+':'+mat;if(!batches.has(key))batches.set(key,[]);dummy.position.set(...pos);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();batches.get(key).push(dummy.matrix.clone());}
 function flush(){for(const[key,items]of batches){const[shape,mat]=key.split(':'),m=new T.InstancedMesh(geometry[shape],materials[mat],items.length);items.forEach((v,i)=>m.setMatrixAt(i,v));m.castShadow=m.receiveShadow=true;m.computeBoundingSphere();root.add(m);}batches.clear();}
 function sign(text,x,y,z,w=3){
  if(typeof document==='undefined')return null;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#193d46';c.fillRect(0,0,512,128);c.strokeStyle='#d9b97b';c.lineWidth=4;c.strokeRect(5,5,502,118);c.fillStyle='#f2dfb4';c.font='bold 28px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,64,478);const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;textures.push(tx);const mat=new T.MeshBasicMaterial({map:tx});const m=new T.Mesh(new T.PlaneGeometry(w,w/4),mat);m.position.set(x,y,z);m.name='sign:'+text;root.add(m);return m;
 }
 function dispose(){root.traverse(o=>{if(o.geometry&&!Object.values(geometry).includes(o.geometry))o.geometry.dispose();if(o.material&&!Object.values(materials).includes(o.material))o.material.dispose();});for(const g of Object.values(geometry))g.dispose();for(const m of Object.values(materials))m.dispose();for(const t of textures)t.dispose();root.removeFromParent();}
 return{root,add,batch,flush,sign,materials,dispose};
}
// Visible deck surfaces are clipped against original same-height districts.
export function exposedDeck(d,districts){let pieces=[{x1:d.x-d.w/2,x2:d.x+d.w/2,z1:d.z-d.d/2,z2:d.z+d.d/2}];for(const host of districts){if(Math.abs(host.y-d.y)>.02)continue;const b={x1:host.x-host.w/2,x2:host.x+host.w/2,z1:host.z-host.d/2,z2:host.z+host.d/2};pieces=pieces.flatMap(a=>{const l=Math.max(a.x1,b.x1),r=Math.min(a.x2,b.x2),n=Math.max(a.z1,b.z1),f=Math.min(a.z2,b.z2);if(l>=r||n>=f)return[a];return[{...a,x2:l},{...a,x1:r},{x1:l,x2:r,z1:a.z1,z2:n},{x1:l,x2:r,z1:f,z2:a.z2}].filter(p=>p.x2-p.x1>.001&&p.z2-p.z1>.001);});}return pieces;}
