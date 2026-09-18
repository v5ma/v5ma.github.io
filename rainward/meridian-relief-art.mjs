import * as T from './vendor/three.module.js';
import {meridianHeight} from './meridian-relief.mjs';
/* Original representative architecture, not borrowed map art or final approval. */
export function dressMeridian(scene,A,building){
 const {polygon,x,z,w,d,h,form,label}=building,base=meridianHeight(x,z);
 const shape=new T.Shape();polygon.forEach(([px,pz],i)=>i?shape.lineTo(px,-pz):shape.moveTo(px,-pz));shape.closePath();
 const floor=new T.ShapeGeometry(shape);floor.rotateX(-Math.PI/2);const pos=floor.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,meridianHeight(pos.getX(i),pos.getZ(i))+.045);floor.computeVertexNormals();
 const paving=new T.Mesh(floor,A.mat(0x7e8370,'paving'));paving.receiveShadow=true;scene.add(paving);
 if(form==='dome'){
  const dome=new T.Mesh(new T.SphereGeometry(8.7,24,12,0,Math.PI*1.6,0,Math.PI/2),A.mat(0x547371,'metal'));dome.scale.y=.43;dome.position.set(40,base+h,-18);scene.add(dome);
  for(const px of [28,52])A.add('box',px,base+h-1,z,.35,2,d,0x677572,'stone');
 }else if(form==='sawtooth'){
  for(let pz=z-d/2+4;pz<z+d/2-2;pz+=6){A.add('box',x,base+h-.4,pz,w-1,.2,4.8,0x566968,'metal',0,0,-.10);A.add('box',x,base+h-.8,pz+2.6,w-1,1.3,.14,0x668d89,'window');}
 }else if(form==='arcade'){
  for(let pz=20;pz<=40;pz+=5){for(const px of [31,48])A.add('box',px,base+h/2,pz,.42,h,.42,0x918672,'brick');A.add('box',39.5,base+h,pz,17.5,.20,.30,0x5c695b,'wood');}A.add('box',44,base+h+.2,30,9,.16,21,0x576758,'cloth');
 }else if(form==='courtyard'){
  A.add('box',-45,base+h-.15,17,11,.3,5,0x756e5e,'wood');A.add('box',-29,base+h-.15,30,3,.3,17,0x756e5e,'wood');
 }else if(form==='garden'){
  for(const pz of [-57,-52])A.add('box',-38,base+h-.2,pz,21,.18,3,0x76876a,'ground');
 }else if(form==='tower'){
  const cap=new T.Mesh(new T.ConeGeometry(10.5,3,8),A.mat(0x4c686a,'metal'));cap.position.set(x,base+h+1.3,z);scene.add(cap);
 }
 const door=building.doors.find(o=>o.edge===polygon.length-2)||building.doors[0],a=polygon[door.edge],b=polygon[(door.edge+1)%polygon.length],n=Math.hypot(b[0]-a[0],b[1]-a[1]),px=a[0]+(b[0]-a[0])*door.at/n,pz=a[1]+(b[1]-a[1])*door.at/n;
 A.label(label,px,meridianHeight(px,pz)+3.1,pz+.42,Math.min(7,w*.5),.65,'#374e4a','#ecddb7');
 const lamp=new T.PointLight(0xffdab3,4,9,2);lamp.position.set(px,meridianHeight(px,pz)+2.8,pz);scene.add(lamp);
}
