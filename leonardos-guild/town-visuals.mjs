/* Original procedural art; no external textures, models, or reference images.
 * Thin instanced foliage replaces solid canopy balls and reduces geometry. */
import * as T from './vendor/three.module.js';
import {Batch,unit,rand} from './art.mjs';
import {heightAt} from './model.mjs';
let sharedLeaves=null;
function foliageTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
 for(let i=0;i<32;i++){const a=i*2.399,r=16+Math.sqrt(rand(i+10))*90,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;g.strokeStyle='#e5e9c477';g.lineWidth=2;g.beginPath();g.moveTo(128,150);g.lineTo(x,y);g.stroke();g.save();g.translate(x,y);g.rotate(a);const light=210+Math.floor(rand(i+8)*42);g.fillStyle=`rgb(${light-8},${light},${light-38})`;g.beginPath();g.ellipse(0,0,10+rand(i)*9,4+rand(i+1)*4,0,0,Math.PI*2);g.fill();g.strokeStyle='#9da57c88';g.lineWidth=1;g.beginPath();g.moveTo(-12,0);g.lineTo(12,0);g.stroke();g.restore();}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
export function grove(parent,list,m){
 if(!sharedLeaves)sharedLeaves=new T.MeshStandardMaterial({map:foliageTexture(),alphaTest:.38,side:T.DoubleSide,roughness:.94,metalness:0});
 const wood=new Batch(),geo=new T.PlaneGeometry(1,1),leaves=new T.InstancedMesh(geo,sharedLeaves,list.length*7*15),matrix=new T.Matrix4(),q=new T.Quaternion(),col=new T.Color();let id=0;
 for(const {x,z,seed}of list){const y=heightAt(x,z),h=6.8+rand(seed+88)*3;
  wood.rod([x,y,z],[x+.24,y+h*.78,z-.25],.24,'#6c6346');wood.rod([x-.18,y+.07,z-.1],[x+.28,y+2.5,z],.18,'#8c815c');
  for(let i=0;i<7;i++){const a=i*2.4,dx=Math.cos(a)*(1.7+rand(seed+i)*1.1),dz=Math.sin(a)*(1.5+rand(seed+i*2)*1.2),yy=y+h*(.68+rand(seed+i*8)*.24);wood.rod([x+.12,y+h*.46,z],[x+dx,yy,z+dz],.09,'#7e704e');
   for(let j=0;j<15;j++){const s=seed*137+i*31+j*3,theta=j*2.399,spread=Math.sqrt(rand(s+11))*2,px=x+dx+Math.cos(theta)*spread,pz=z+dz+Math.sin(theta)*spread,py=yy+(rand(s+7)-.35)*2.4;
    q.setFromEuler(new T.Euler(rand(s+4)*Math.PI,rand(s+14)*Math.PI,rand(s+24)*Math.PI));const size=1.65+rand(s+2)*1.45;matrix.compose(new T.Vector3(px,py,pz),q,new T.Vector3(size,size,1));leaves.setMatrixAt(id,matrix);col.setHSL(.205+rand(s+43)*.07,.34+rand(s)*.14,.24+rand(s+9)*.17);leaves.setColorAt(id++,col);
   }
  }
 }
 wood.finish(parent,m.trim,'Natural olive trunks');leaves.name='Instanced olive leaf sprays';leaves.castShadow=true;leaves.receiveShadow=true;leaves.computeBoundingSphere();parent.add(leaves);return leaves;
}
function shadeTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),a=g.createRadialGradient(64,64,12,64,64,63);a.addColorStop(0,'rgba(17,32,25,.47)');a.addColorStop(.4,'rgba(17,32,25,.32)');a.addColorStop(1,'rgba(17,32,25,0)');g.fillStyle=a;g.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
function groundDecals(list,texture){const pos=[],uv=[];for(const {x,z,w,d}of list)for(let i=0;i<4;i++)for(let j=0;j<4;j++){const a=i/4,b=j/4;for(const [u,v]of[[a,b],[a+.25,b+.25],[a+.25,b],[a,b],[a,b+.25],[a+.25,b+.25]]){const xx=x+(u-.5)*w,zz=z+(v-.5)*d;pos.push(xx,heightAt(xx,zz)+.14,zz);uv.push(u,v);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return new T.Mesh(g,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));}
export function enhanceTown(scene,root,w,m,rider){
 const texture=shadeTexture(),decals=groundDecals([...w.houses.map(h=>({x:h.x,z:h.z,w:h.w+5,d:h.d+6})),...w.trees.map(t=>({x:t.x+1,z:t.z+1.7,w:7,d:9}))],texture);decals.name='Terrain-following ambient contact shadows';root.add(decals);
 const riderShadow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));riderShadow.rotation.x=-Math.PI/2;riderShadow.name='Rider contact shadow';scene.add(riderShadow);
 const details=new Batch(),flags=new Batch();
 for(const h of w.houses){const sy=heightAt(h.x,h.z),fx=h.road+h.side*17.4;
  // Planters remain outside the roadway and do not change collision footprints.
  for(const offset of[-3.1,3.1]){const z=h.z+offset,y=heightAt(fx,z);details.add(unit.cyl,fx,y+.35,z,.36,.65,.3,'#bb7d53');details.ball(fx,y+.8,z,.44,.4,.44,'#71833f');for(let k=0;k<4;k++)details.ball(fx+Math.cos(k*1.57)*.23,y+1+rand(k+h.kind)*.15,z+Math.sin(k*1.57)*.24,.1,.1,.1,['#cfbd82','#e2c297','#b76759','#9aa672'][h.kind%4]);}
  if(h.kind%2===0){const poleX=h.road+h.side*16.9,z=h.z+5;details.rod([poleX,sy+3.5,z],[poleX,sy+6.2,z],.045,'#71603f');flags.box(poleX,sy+4.95,z+.41,.025,1.75,.75,['#986145','#4c7263','#a8884a'][h.kind%3]);details.box(poleX,sy+5.1,z+.81,.04,.22,.05,'#e3c681');}
 }
 // Stone edging and drainage lips make the road read as a constructed surface.
 for(const x of w.roads)for(let z=-20;z<400;z+=3){if(w.crossings.some(c=>Math.abs(c-z)<11))continue;for(const side of[-1,1]){const xx=x+side*7.13;details.box(xx,heightAt(xx,z)+.1,z,.2,.19,2.9,'#d2c6a8');}}
 details.finish(root,m.trim,'Stone edging, terracotta planters and flowers');flags.finish(root,m.trim,'Artisan hanging banners');
 // Variegated ground color and a softer plaster instead of modern clapboards.
 const ground=root.children.find(o=>o.geometry?.type==='PlaneGeometry');if(ground){const a=ground.geometry.attributes.position,c=[];for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),v=.5+.09*Math.sin(x*.2+z*.031)+.09*Math.sin(z*.12-x*.04);const color=new T.Color().setHSL(.19,.28,v);c.push(color.r,color.g,color.b);}ground.geometry.setAttribute('color',new T.Float32BufferAttribute(c,3));ground.material.color.set('#afb17d');ground.material.vertexColors=true;ground.material.needsUpdate=true;}
 const plaster=document.createElement('canvas');plaster.width=plaster.height=128;const ctx=plaster.getContext('2d');ctx.fillStyle='#eee9dc';ctx.fillRect(0,0,128,128);for(let i=0;i<4500;i++){const v=180+Math.floor(rand(i)*60);ctx.fillStyle=`rgba(${v},${v},${v},.16)`;ctx.fillRect(rand(i+1)*128,rand(i+51)*128,2,2);}const ptx=new T.CanvasTexture(plaster);ptx.colorSpace=T.SRGBColorSpace;ptx.wrapS=ptx.wrapT=T.RepeatWrapping;m.wall.map=ptx;m.wall.needsUpdate=true;
 return {update(s){riderShadow.position.set(s.x,heightAt(s.x,s.z)+.17,s.z);riderShadow.scale.set(s.mode==='car'?3.2:s.mode==='bike'?1.5:1.25,s.mode==='car'?5:s.mode==='bike'?2.5:1.6,1);riderShadow.material.opacity=Math.max(.15,1-s.lift*.25);},inspect:()=>({instancedFoliage:true,contactShadows:true,proceduralMaterials:true})};
}
