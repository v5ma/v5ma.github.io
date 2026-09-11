import {streetVehicle,streetTree} from './prop-kit.mjs';
import * as T from './vendor/three.module.js';
import {OBSTACLES,GRASS,SHELTERS} from './world.mjs';
import {rnd,colors} from './artkit.mjs';
export function buildDistrict(scene,A){const {add,mesh,ivy,label,mat,geos,mats,buckets}=A;
 add('box',0,-.2,-7,73,.4,87,0x5c6657,'ground');add('box',0,.01,-7,24,.04,87,colors.road,'paving');
 for(let z=-46;z<33;z+=3){add('box',-12.5,.04,z,1,.08,2.9,0x738078);add('box',12.5,.04,z,1,.08,2.9,0x738078);if(z<10&&z>-35)add('box',.1,.039,z,.13,.014,1.5,0xaeb398,'paint');}
 for(let i=0;i<42;i++){const x=(rnd(i+11)-.5)*50,z=-46+rnd(i+97)*77;const p=new T.Mesh(new T.CircleGeometry(1,18),new T.MeshStandardMaterial({color:0x697e78,roughness:.13,metalness:.6,transparent:true,opacity:.4}));p.rotation.x=-Math.PI/2;p.scale.set(1+rnd(i+2)*3,.35+rnd(i+9)*1.2,1);p.position.set(x,.04,z);scene.add(p);}
 for(const o of OBSTACLES){
  const tint=o.kind==='brick'?colors.brick:o.kind==='planter'||o.kind==='fountain'?0x65796a:colors.wall;
  if(['bus','truck','car'].includes(o.kind)){streetVehicle(A,o);continue;}
  add('box',o.x,o.bottom+o.h/2,o.z,o.w,o.h,o.d,tint,o.kind==='brick'?'brick':'stone');
  if(o.kind==='crate'||o.kind==='counter'){for(const x of[-.45,.45])add('box',o.x+o.w*x,o.h/2+.025,o.z,.07,o.h,o.d+.06,0x96816a,'wood');}
  if(o.h>=3&&o.w>4){add('box',o.x,o.bottom+o.h-.17,o.z,o.w+.08,.22,o.d+.12,0x818b7c);if(o.kind==='brick')ivy(o.x,.7,o.z+o.d/2+.03,o.w*.9,o.h*.7,Math.round(o.x)*99);}
  if(o.kind==='planter'){for(let k=0;k<15;k++)add('cone',o.x+(rnd(k)-.5)*o.w,.9+rnd(k+5)*.6,o.z+(rnd(k+98)-.5)*o.d,.3,.8,.3,0x516542,'leaf');}
 }
 label('LARCH WARD\nFIELD CLINIC',-21,3.45,9.57,9,1.9,'#35544e');label('TRANSIT / 08\nFREIGHT HALL',21,4,-7.4,10,1.8,'#48463d');
 label('FLOODGATE\nEMERGENCY EXIT',0,3.7,-42.5,9,2,'#405e55');label('SOUTH SHELTER',0,2.6,31.42,6,1,'#605139');
 for(const c of SHELTERS){const x=c.x+2.4,z=c.z+.5;add('box',x,1.1,z,.55,.5,.3,0xb17b40,'metal');const light=new T.PointLight(0xffc47a,6,7,2);light.position.set(x,2.1,z);scene.add(light);add('ball',x,2.1,z,.08,.15,.08,0xffdf9b,'glow');}
 add('box',-20,1.05,2,4.8,.10,1.1,0xb7bba0,'cloth');
 add('box',0,1,-43,1.7,2,1.1,0x365a55,'metal');for(let x=-.55;x<.8;x+=.35)add('box',x,1.55,-42.43,.18,.16,.02,0xb6cba5,'glow');
 for(let x=-4;x<=4;x+=.5)add('box',x,1.5,-44.5,.09,3,.1,0x6d7f74,'metal');add('box',0,3,-44.5,9,.14,.2,0xb19459,'metal');
 for(let i=0;i<14;i++){const side=i%2?1:-1,z=-46+Math.floor(i/2)*14,x=side*(39+rnd(i)*4),h=9+rnd(i+28)*12,w=8+rnd(i+6)*5;
  add('box',x,h/2,z,w,h,11,[0x64726b,0x738078,0x646b60][i%3],'brick');
  for(let y=2;y<h-1;y+=2.8)for(let zz=-3;zz<=3;zz+=2.3){add('box',x-side*(w/2+.03),y,z+zz,.08,1.6,1.1,0x293f3e,'metal');add('box',x-side*(w/2+.1),y-.85,z+zz,.25,.13,1.4,0x8c9887);}
  if(i%3===1){add('box',x-side*(w/2+.3),h*.55,z,.3,4.6,3.2,0xa29977);ivy(x-side*w/2,h*.25,z,w*.3,h*.4,i*93);}
 }
 for(const x of[-31,31]){add('box',x,7,-4,2.4,14,3,0x616e64);add('box',x,14,-4,8,1.5,6.6,0x77857a);}
 add('box',-19.5,14.1,-4,15,1.1,6.6,0x738177);add('box',24,14.1,-4,8,1.1,6.6,0x738177);
 for(let i=0;i<9;i++)add('cyl',-12+i*.4,13.95,-1.5,.04,3,.04,0x544c39,'metal',0,0,-.4-i*.1);
 for(let j=0;j<GRASS.length;j++){const patch=GRASS[j];for(let i=0;i<220;i++){const x=patch.x+(rnd(i+j*300)-.5)*patch.w,z=patch.z+(rnd(i+j*301+43)-.5)*patch.d,h=.35+rnd(i+74)*.65;add('blade',x,.02,z,.10+rnd(i+31)*.18,h,1,[0x6c7b42,0x536d47,0x778344][i%3],'grass',0,rnd(i+33)*6.28,(rnd(i+23)-.5)*.4);}}
 for(const [i,o]of OBSTACLES.filter(o=>o.kind==='planter').entries())streetTree(A,o.x,o.bottom+o.h,o.z,7+i,77+i*11);
 for(let i=0;i<12;i++)streetTree(A,(i%2?1:-1)*(38+rnd(i)*4),0,-44+Math.floor(i/2)*14,9+rnd(i+16)*5,i*41);
 for(let i=0;i<180;i++){const x=(rnd(i+79)-.5)*62,z=-47+rnd(i+15)*76,s=.1+rnd(i+97)*.22;add('box',x,.06,z,s,.08,s*.7,[0x909280,0x404d46,0x767660][i%3],'stone',0,rnd(i)*6,0);}
 for(const {geo,mat:m,items} of buckets.values()){const inst=new T.InstancedMesh(geo,m,items.length);items.forEach((v,i)=>inst.setMatrixAt(i,v));inst.instanceMatrix.needsUpdate=true;inst.castShadow=geo!==geos.plane&&geo!==geos.blade;inst.userData.windFoliage=geo===geos.blade||geo===geos.reclaimedLeaf||[...A.mats].some(([k,v])=>v===m&&k.endsWith(':leafcard'));inst.receiveShadow=true;inst.computeBoundingSphere();scene.add(inst);}
 for(const [key,m]of mats)if(key.endsWith(':grass')){m.side=T.DoubleSide;m.roughness=1;}
}
