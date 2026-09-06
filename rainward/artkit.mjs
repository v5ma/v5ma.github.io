import * as T from './vendor/three.module.js';
export const rnd=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const colors={brick:0x5f655f,wall:0x49534e,road:0x303c3c,moss:0x496343,metal:0x3c5756,amber:0xdfb781};
export function artkit(scene){
 const textures={};
 function texture(type){if(textures[type])return textures[type];const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=type==='road'?'#969e99':type==='brick'?'#d2c4ad':'#bdc7b6';g.fillRect(0,0,256,256);
  for(let i=0;i<4400;i++){const x=rnd(i+11)*256,y=rnd(i+73)*256;g.fillStyle=i%3?'#13292a16':'#e4ecd616';g.fillRect(x,y,1+rnd(i)*4,1+rnd(i+7)*5);}
  if(type==='brick'){g.strokeStyle='#333f4160';g.lineWidth=2;for(let y=0;y<256;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();for(let x=(y/32%2)*32;x<256;x+=64){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+32);g.stroke();}}}
  else{g.strokeStyle='#243e3c55';g.lineWidth=1;for(let i=0;i<12;i++){g.beginPath();g.moveTo(rnd(i)*256,rnd(i+5)*256);for(let j=0;j<4;j++)g.lineTo(rnd(i+j+9)*256,rnd(i+j+91)*256);g.stroke();}}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;textures[type]=t;return t;
 }
 const geos={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,10,8),cyl:new T.CylinderGeometry(1,1,1,8),cone:new T.ConeGeometry(1,1,7),plane:new T.PlaneGeometry(1,1),capsule:new T.CapsuleGeometry(.5,1,4,8)};
 const mats=new Map(),buckets=new Map(),dynamic=[];
 function mat(color,type='stone',extra={}){const key=color+':'+type;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:type==='metal'?.42:.9,metalness:type==='metal'?.4:0,map:['stone','brick','road'].includes(type)?texture(type):null,...extra}));return mats.get(key);}
 function add(shape,x,y,z,sx,sy,sz,color,type='stone',rx=0,ry=0,rz=0){const m=mat(color,type),key=shape+':'+color+':'+type;let b=buckets.get(key);if(!b){b={geo:geos[shape],mat:m,items:[]};buckets.set(key,b);}const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));b.items.push(matrix);}
 function mesh(shape,scale,color,type='cloth'){const m=new T.Mesh(geos[shape],mat(color,type));m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;return m;}
 function label(text,x,y,z,w,h,bg='#283e39',fg='#ddd6ac',rotation=0){const c=document.createElement('canvas');c.width=512;c.height=160;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,160);g.strokeStyle=fg;g.lineWidth=3;g.strokeRect(9,9,494,142);g.fillStyle=fg;g.font='bold 39px Arial';g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n');lines.forEach((l,i)=>g.fillText(l,256,80+(i-(lines.length-1)/2)*46,470));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,roughness:.85,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;scene.add(m);return m;}
 function ivy(x,y,z,width,height,seed=0,side=0){for(let i=0;i<70;i++){const px=x+(rnd(i+seed)-.5)*width,py=y+rnd(i+seed+500)*height,pz=z+(rnd(i+300)*.1);add('ball',px,py,pz,.10+rnd(i)*.12,.045,.16,[0x425b3e,0x527147,0x647847][i%3],'leaf',rnd(i)*3,side+rnd(i+5)*2,rnd(i+11)*2);}}
 return {geos,mats,buckets,mat,mesh,add,label,ivy};
}
