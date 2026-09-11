/* Original reusable street props. Geometry stays inside the collision footprint.
 * Trees are planted inside authored planters or outside the playable boundary. */
import * as T from './vendor/three.module.js';
import {rnd} from './artkit.mjs';
export function streetVehicle(A,o){
 const {add,geos,mat}=A;
 if(!geos.sedan){const s=new T.Shape();s.moveTo(-.48,.24);s.lineTo(.49,.24);s.lineTo(.49,.46);s.lineTo(.27,.50);s.lineTo(.125,.93);s.lineTo(-.14,.96);s.lineTo(-.29,.63);s.lineTo(-.48,.51);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.96,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.018,bevelThickness:.018});g.translate(0,0,-.48);g.rotateY(Math.PI/2);geos.sedan=g;
  const positions=[-.40,.526,-.256,.40,.526,-.256,.365,.904,-.117,-.40,.526,-.256,.365,.904,-.117,-.365,.904,-.117,-.365,.931,.145,.365,.931,.145,.40,.649,.284,-.365,.931,.145,.40,.649,.284,-.40,.649,.284];const glass=new T.BufferGeometry();glass.setAttribute('position',new T.Float32BufferAttribute(positions,3));glass.computeVertexNormals();geos.carGlass=glass;geos.tire=new T.CylinderGeometry(1,1,1,16);}
 const sideways=o.w>o.d,angle=sideways?Math.PI/2:0,w=Math.min(o.w,o.d),l=Math.max(o.w,o.d),h=o.h,y0=o.bottom||0;
 const local=(shape,x,y,z,sx,sy,sz,c,type='metal',rx=0,ry=0,rz=0)=>add(shape,o.x+Math.cos(angle)*x+Math.sin(angle)*z,y0+y,o.z-Math.sin(angle)*x+Math.cos(angle)*z,sx,sy,sz,c,type,rx,ry+angle,rz);
 const paint=o.kind==='bus'?0x637367:o.kind==='truck'?0x6c7064:0x7e857b;
 if(o.kind==='car'){
  local('sedan',0,0,0,w,h,l,paint,'carpaint');local('carGlass',0,0,0,w,h,l,0x304344,'window');
  for(const side of[-1,1]){
   local('box',side*w*.494,h*.736,.02*l,.021,h*.29,l*.285,0x344546,'window');
   local('box',side*w*.505,h*.743,0,.023,h*.30,.035,0x383e39,'metal');
   local('box',side*w*.497,h*.44,.0,.017,.025,l*.43,0x4e534c,'metal');
   local('box',side*w*.505,h*.50,l*.125,.022,.022,.14,0x242f2e,'metal');
   local('box',side*w*.335,h*.40,-l*.487,w*.21,h*.115,.032,0xb9bda8,'glass');
   local('box',side*w*.338,h*.39,l*.483,w*.20,h*.1,.032,0x754b3e,'glass');
  }
 }else{
  local('box',0,h*.27,0,w*.94,h*.34,l*.97,0x414d49,'metal');local('box',0,h*.65,0,w*.91,h*.68,l*.94,paint,'carpaint');
  local('box',0,h*.994,0,w*.94,.08,l*.95,0x59655e,'metal');
  for(const side of[-1,1])for(let k=0;k<(o.kind==='bus'?7:3);k++)local('box',side*w*.459,h*.77,-l*.34+k*l*(o.kind==='bus'?.108:.30),.035,h*.25,l*(o.kind==='bus'?.087:.16),0x2e4343,'window');
  local('box',0,h*.77,-l*.476,w*.8,h*.28,.022,0x2e4343,'window');
  local('box',0,h*.41,-l*.488,w*.58,.18,.045,0x263936,'metal');
 }
 for(const side of[-1,1])for(const end of[-1,1]){
  const radius=Math.min(.39,h*.225);local('tire',side*w*.45,radius,end*l*.31,radius,.18,radius,0x252a28,'rubber',0,0,Math.PI/2);local('tire',side*w*.498,radius,end*l*.31,radius*.55,.025,radius*.55,0x6c7167,'metal',0,0,Math.PI/2);
 }
 local('box',0,h*.24,-l*.49,w*.94,.11,.10,0x505a55,'metal');local('box',0,h*.24,l*.49,w*.94,.11,.10,0x505a55,'metal');
 for(let i=0;i<12;i++){const side=i%2?1:-1;local('box',side*w*.5,h*(.31+rnd(i+o.x)*.19),(rnd(i+o.z)-.5)*l*.79,.012,.012+rnd(i)*.06,.05+rnd(i+7)*.15,0x71563f,'rust');}
 mat(paint,'carpaint').roughness=.54;mat(paint,'carpaint').metalness=.35;mat(0x304344,'window').roughness=.17;mat(0x304344,'window').metalness=.32;
}
function leaves(A){
 if(A.geos.reclaimedLeaf)return;
 A.geos.reclaimedLeaf=new T.PlaneGeometry(1,1);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.clearRect(0,0,128,128);
 for(let i=0;i<22;i++){const x=15+rnd(i+19)*98,y=13+rnd(i+91)*99;c.fillStyle=['#d9dfbe','#bbc9a5','#e1e4c6'][i%3];c.beginPath();c.ellipse(x,y,6+rnd(i)*8,3+rnd(i+5)*4,rnd(i+7)*6,0,Math.PI*2);c.fill();c.strokeStyle='#7e916e';c.lineWidth=.6;c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 for(const color of[0x657c48,0x849354,0x4e6c44]){const m=A.mat(color,'reclaimedLeaves');m.map=texture;m.alphaTest=.38;m.side=T.DoubleSide;m.roughness=.96;}
}
export function streetTree(A,x,y,z,h=11,seed=0){
 leaves(A);const {add}=A;
 add('cyl',x,y+h*.42,z,.17,h*.84,.20,0x554e3e,'wood',0,0,.05);
 for(let j=0;j<11;j++){const a=j*2.4+seed,r=1.3+rnd(j+seed)*2.7,by=y+h*(.60+rnd(j+11)*.28),tipX=x+Math.sin(a)*r,tipZ=z+Math.cos(a)*r;
  add('cyl',x+Math.sin(a)*r*.5,by, z+Math.cos(a)*r*.5,.055,r*1.5,.055,0x554e3e,'wood',Math.cos(a)*.85,0,-Math.sin(a)*.85);
  for(let k=0;k<13;k++){const s=j*23+k+seed,px=tipX+(rnd(s)-.5)*2.8,py=by+.8+(rnd(s+3)-.5)*2,pz=tipZ+(rnd(s+19)-.5)*2.8;add('reclaimedLeaf',px,py,pz,1.7+rnd(s+9),1.3+rnd(s+29),1,[0x657c48,0x849354,0x4e6c44][k%3],'reclaimedLeaves',rnd(s)*2.8,rnd(s+1)*6,rnd(s+2)*3);}
 }
}
export function bakeStreet(scene,A){
 for(const {geo,mat,items}of A.buckets.values()){const inst=new T.InstancedMesh(geo,mat,items.length);items.forEach((m,i)=>inst.setMatrixAt(i,m));inst.instanceMatrix.needsUpdate=true;const foliage=geo===A.geos.blade||geo===A.geos.reclaimedLeaf;inst.castShadow=geo!==A.geos.blade;inst.receiveShadow=true;inst.userData.windFoliage=foliage;inst.name=foliage?'Instanced reclaimed vegetation':'Instanced district masonry and props';inst.computeBoundingSphere();scene.add(inst);}
 for(const [k,m]of A.mats)if(k.endsWith(':grass')){m.side=T.DoubleSide;m.roughness=1;}
}
