import * as T from './vendor/three.module.js';
const materials=new Map();
export function material(color,roughness=.85){const key=color+':'+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,flatShading:true}));return materials.get(key);}
const cube=new T.BoxGeometry(1,1,1),ball=new T.IcosahedronGeometry(1,1),up=new T.Vector3(0,1,0);
export function part(parent,geometry,mat,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geometry,typeof mat==='number'||mat?.isColor?material(mat?.isColor?mat.getHex():mat):mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export const box=(p,c,x,y,z,sx,sy,sz)=>part(p,cube,c,x,y,z,sx,sy,sz);
export const ellipsoid=(p,c,x,y,z,sx,sy,sz)=>part(p,ball,c,x,y,z,sx,sy,sz);
export function bone(p,c,a,b,r1,r2=r1){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A);const m=part(p,new T.CylinderGeometry(r2,r1,d.length(),7),c,...A.add(B).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(up,d.normalize());return m;}
export function label(text,width=8,height=1.5,bg='#183c31',fg='#f4e8c9'){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=fg;ctx.lineWidth=3;ctx.strokeRect(8,8,c.width-16,c.height-16);ctx.fillStyle=fg;ctx.font=`700 ${Math.round(c.height*.47)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,c.height*.52,c.width*.92);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:tx,roughness:.85,side:T.DoubleSide}));
}
export function makeJeep(){
  const g=new T.Group(),sand=0xd7c09b,red=0xa54232,dark=0x26322d,steel=0x637167;
  box(g,dark,0,-.08,0,2.1,.28,3.7);box(g,sand,0,.22,0,2.05,.55,3.65);
  box(g,sand,0,.69,1.08,1.9,.48,1.5);box(g,red,0,.94,1.1,1.91,.025,.3);
  box(g,dark,0,.62,-.62,1.75,.34,1.7);
  for(const x of [-1.1,1.1])for(const z of [-1.17,1.17]){box(g,red,x,.36,z,.55,.19,1.26);box(g,dark,x,.2,z,.6,.12,1.38);}
  box(g,red,0,.44,-1.76,2.08,.45,.1);box(g,red,0,.44,1.85,2.08,.24,.12);
  box(g,dark,0,-.03,2.05,2.45,.22,.21);box(g,dark,0,-.03,-2,2.4,.2,.18);
  // Open cabin, two seats, windscreen and exposed roll cage.
  for(const x of [-.48,.48]){box(g,0x574d39,x,.8,-.48,.65,.23,.68);const back=box(g,0x574d39,x,1.13,-.8,.67,.67,.18);back.rotation.x=-.12;}
  box(g,dark,0,1,.28,1.7,.25,.3);
  for(const x of [-.89,.89]){
    bone(g,dark,[x,.55,.39],[x,1.86,.2],.06);bone(g,dark,[x,.55,-1.27],[x,1.83,-1.21],.075);
    bone(g,dark,[x,1.83,-1.21],[x,1.86,.2],.07);
    bone(g,sand,[x,1.05,.49],[x,1.88,.26],.055);
    box(g,sand,x,.64,-.88,.17,.62,1.35);
  }
  bone(g,dark,[-.89,1.84,-1.21],[.89,1.84,-1.21],.065);bone(g,sand,[-.89,1.87,.25],[.89,1.87,.25],.065);
  const glass=new T.MeshStandardMaterial({color:0xc8e6de,transparent:true,opacity:.27,roughness:.2,side:T.DoubleSide});const windshield=box(g,glass,0,1.47,.39,1.69,.76,.025);windshield.rotation.x=-.23;
  const wheel=new T.Mesh(new T.TorusGeometry(.21,.03,5,14),material(dark));wheel.position.set(.46,1.17,.03);wheel.rotation.x=-.5;g.add(wheel);
  for(let i=-3;i<=3;i++)box(g,dark,i*.17,.63,1.849,.075,.28,.015);
  const lamps=[];for(const x of [-.72,.72]){const l=part(g,new T.CylinderGeometry(.17,.17,.05,12),new T.MeshStandardMaterial({color:0xffebbd,emissive:0xffe8aa,emissiveIntensity:1.4}),x,.67,1.91);l.rotation.x=Math.PI/2;lamps.push(l);}
  for(const x of [-.68,.68]){const l=ellipsoid(g,0xf8dd9e,x,1.91,-.05,.16,.11,.13);lamps.push(l);}
  for(const x of [-1.035,1.035]){const sign=label('DA / 07',1,.37,'#d7c09b','#343e31');sign.position.set(x,.64,-.87);sign.rotation.y=x<0?-Math.PI/2:Math.PI/2;g.add(sign);}
  const tireGeo=new T.CylinderGeometry(.49,.49,.35,14),hubGeo=new T.CylinderGeometry(.27,.27,.365,10);
  function tire(){const t=new T.Group();const a=part(t,tireGeo,dark,0,0,0);a.rotation.z=Math.PI/2;const b=part(t,hubGeo,steel,0,0,0);b.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;const tread=box(t,0x182420,0,Math.sin(a)*.485,Math.cos(a)*.485,.37,.12,.12);tread.rotation.x=-a;}return t;}
  const tires=[];for(let i=0;i<4;i++){const pivot=new T.Group(),roll=tire();pivot.add(roll);g.add(pivot);tires.push({pivot,roll});}
  const spare=tire();spare.rotation.y=Math.PI/2;spare.position.set(0,.72,-2.03);g.add(spare);
  box(g,steel,-.64,.94,-1.64,.48,.65,.26);box(g,red,.65,.85,-1.67,.32,.45,.27);
  const light=new T.SpotLight(0xffe4a0,0,38,.55,.45,1.3);light.position.set(0,.9,1.7);light.target.position.set(0,0,18);g.add(light,light.target);
  g.userData={tires,light};return g;
}
export function makeParkDinosaur(d){
  const g=new T.Group(),skin=d.color,belly=new T.Color(skin).lerp(new T.Color(0xd6c8a1),.25),legs=[];
  const body=(x,y,z,sx,sy,sz)=>ellipsoid(g,skin,x,y,z,sx,sy,sz);
  const eye=(x,y,z,size=.075)=>{ellipsoid(g,0xf3c36b,x,y,z,size,size,size);ellipsoid(g,0x17271d,x*1.015,y,z+.02,size*.5,size*.7,size*.8);};
  function leg(x,y,z,length,thick){const p=new T.Group();p.position.set(x,y,z);g.add(p);ellipsoid(p,skin,0,-length*.38,0,thick,length*.56,thick);ellipsoid(p,belly,0,-length+.15,.13,thick*.9,.2,thick*1.4);legs.push(p);}
  if(d.kind==='sauropod'){
    body(0,3.6,0,2,1.65,3.05);body(0,4,1.9,1.35,1.15,1.7);
    for(const x of [-1.2,1.2])for(const z of [-1.75,1.55])leg(x,3.45,z,3.45,.55);
    const neck=[[0,4,2],[0,5.2,4.2],[0,7,6.4],[0,8.8,8.1],[0,9.5,9.4]];
    for(let i=1;i<neck.length;i++)bone(g,skin,neck[i-1],neck[i],1.02-i*.13,.94-i*.14);
    body(0,9.6,9.7,.48,.44,.95);eye(-.43,9.76,9.9);eye(.43,9.76,9.9);
    const tail=[[0,3.6,-2.3],[0,3.35,-4.7],[.3,2.75,-7.2],[.8,2,-9.8],[1.2,1.1,-12.4]];
    for(let i=1;i<tail.length;i++)bone(g,skin,tail[i-1],tail[i],.95/i,.8/(i+1));
  }else if(d.kind==='trike'||d.kind==='stego'){
    body(0,2,0,1.32,1.3,2.45);for(const x of [-.85,.85])for(const z of [-1.35,1.35])leg(x,1.9,z,1.9,.4);
    bone(g,skin,[0,2,-1.7],[0,1.35,-4.5],.7,.12);
    if(d.kind==='trike'){
      body(0,2,2.4,1.02,.95,1.3);const frill=body(0,2.9,1.98,1.65,1.55,.25);frill.rotation.x=-.18;
      ellipsoid(g,belly,0,1.5,3.4,.62,.55,.83);
      for(const x of [-.58,.58])bone(g,0xeee1c2,[x,2.8,2.8],[x*1.15,3.75,4.25],.17,.015);
      bone(g,0xeee1c2,[0,2.05,3.65],[0,2.8,3.9],.18,.01);eye(-.91,2.24,2.8,.095);eye(.91,2.24,2.8,.095);
    }else{
      body(0,1.53,2.6,.43,.43,.88);eye(-.36,1.68,2.93);eye(.36,1.68,2.93);
      for(let i=0;i<8;i++){const z=-2.15+i*.6;const m=part(g,new T.OctahedronGeometry(1),0xb78a58,(i%2?.22:-.22),3.02+Math.sin(i/7*Math.PI)*.25,z,.24,.8+Math.sin(i/7*Math.PI)*.5,.57);m.rotation.z=i%2?-.2:.2;}
      for(const x of [-1,1])for(const z of [-3.5,-4.15])bone(g,0xe7d7b6,[0,1.45,z],[x*.85,2.1,z-.35],.14,.01);
    }
  }else{
    const rex=d.kind==='rex';body(0,3.1,0,rex?1.1:.7,rex?1.3:1.0,rex?1.9:1.3);
    leg(-.75,2.9,-.4,2.9,rex?.52:.34);leg(.75,2.9,-.4,2.9,rex?.52:.34);
    bone(g,skin,[0,3,-1.3],[0,2.1,-4.2],.8,.23);bone(g,skin,[0,2.1,-4.2],[.3,1.85,-6.4],.25,.015);
    bone(g,skin,[0,3.5,1],[0,rex?4.35:4.6,rex?2:2.6],rex?.75:.42,rex?.65:.25);
    if(rex){
      body(0,4.55,2.65,.87,.72,1.18);box(g,skin,0,4.56,3.22,1.3,.72,1.4);box(g,belly,0,4.13,3.05,1.17,.26,1.55);
      for(const x of [-.56,.56])for(let z=2.55;z<3.8;z+=.27){const tooth=part(g,new T.ConeGeometry(.075,.22,5),0xefe4c9,x,4.19,z);tooth.rotation.x=Math.PI;}
      eye(-.81,4.83,2.6,.14);eye(.81,4.83,2.6,.14);
    }else{body(0,4.63,2.95,.35,.38,.7);eye(-.31,4.78,3.1);eye(.31,4.78,3.1);}
    for(const x of [-.68,.68]){bone(g,skin,[x,3.25,.9],[x*1.2,2.85,1.6],.15,.08);bone(g,skin,[x*1.2,2.85,1.6],[x*1.2,3,1.93],.08,.035);}
  }
  g.scale.setScalar(d.scale);g.userData={legs,kind:d.kind};return g;
}
