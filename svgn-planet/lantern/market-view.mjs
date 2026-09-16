import * as T from '../vendor/three.module.js';
import {QUAY,marketState,marketStatus} from './market.mjs';
/* The cart is real geometry in the existing world group: never an XR overlay.
 * Static markings explain the safe approach, full north loop and loading bay. */
export function createMarketView({world,box,cyl,label,batch}){
 const fixed=new T.Group(),cart=new T.Group();world.add(fixed,cart);
 box(cart,0x71513e,0,.48,0,QUAY.width,.25,QUAY.depth);
 for(const x of[-.69,.69])for(const z of[-.48,.48]){
  const wheel=cyl(cart,0x273a3d,x,.23,z,.22,.11);wheel.rotation.z=Math.PI/2;
 }
 for(const x of[-.46,.46]){
  box(cart,0xc59a58,x,.88,0,.78,.54,1.12);
  box(cart,0xd7b675,x,1.35,-.1,.7,.4,.8);
 }
 for(const x of[-.64,.64])box(cart,0x536666,x,.78,-.78,.055,.07,.46);
 // Different shapes as well as color: crossbars at the loading seam, a
 // continuous perimeter line through the bypass, and striped bay corners.
 for(const x of[-3.7,3.7])for(let z=-14.8;z< -12.9;z+=.28)box(fixed,0xe9d8a4,x,.04,z,.16,.035,.14);
 for(const x of[-1.85,1.85])for(let z=-15.5;z>=-20;z-=.75)box(fixed,0xe8d9b4,x,.045,z,.12,.035,.4);
 for(let x=-1.6;x<=1.7;x+=.55)box(fixed,0xe8d9b4,x,.045,-20,.3,.035,.12);
 for(const x of[-1.1,1.1])for(const z of[-17,-19.2])box(fixed,0xe2bd71,x,.04,z,.32,.04,.32);
 const west=label('LOADING QUAY / SIGNAL IVO',-4.3,2.3,-14.6,3.6,.52,'#394f56', '#ffe1a0',fixed);west.rotation.y=-Math.PI/2;
 const east=label('LOADING QUAY / SIGNAL IVO',4.3,2.3,-14.6,3.6,.52,'#394f56', '#ffe1a0',fixed);east.rotation.y=Math.PI/2;
 label('NORTH LOOP / KEEP RIDING',-1.7,1.9,-16,3.2,.5,'#365c61','#f8e4be',fixed);
 label('CART BAY / KEEP CLEAR',0,2.3,-20.2,3.5,.45,'#6e573c','#ffe1a0',fixed);
 label('ROOF: SEE THE QUAY BEFORE COMMITTING',-10.9,5.9,-5.3,6.5,.45,'#526a73','#f8e4be',fixed);
 const signals=[[-3.7,-14.8],[3.7,-14.8]].map(([x,z],i)=>{
  cyl(fixed,0x425861,x,1.4,z,.045,2.8);
  const lamp=box(fixed,0xe5bc6e,x,2.65,z,.3,.3,.3);lamp.material=lamp.material.clone();
  const text=label('LOADING / SIGNAL',x,3.1,z,2.8,.5,'#334b50','#f8e4be',fixed);text.rotation.y=i?Math.PI/2:-Math.PI/2;
  const handle=box(fixed,0xe9d8a4,i?5:-5,.85,i?-15:-13.5,.25,.15,.3);
  return {lamp,text,handle};
 });
 batch?.(fixed);
 let last='';
 return {update(s){
  const m=marketState(s),status=marketStatus(s);cart.position.set(0,0,m.z);
  const words=status.clear?'CLEAR / CROSS':m.phase==='withdrawing'?'PULLING NORTH':'LOADING / SIGNAL';
  if(words!==last){last=words;for(const {lamp,text}of signals){
   lamp.material.color.setHex(status.clear?0x92d2b8:0xe5bc6e);
   const texture=text.material.map,ctx=texture.image.getContext('2d');ctx.fillStyle='#334b50';ctx.fillRect(0,0,768,128);
   ctx.strokeStyle='#f8e4be';ctx.lineWidth=4;ctx.strokeRect(8,8,752,112);ctx.fillStyle='#f8e4be';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.fillText(words,384,79,726);texture.needsUpdate=true;
  }}
 },inspect:()=>({cart:[cart.position.x,cart.position.y,cart.position.z],footprint:[QUAY.width,QUAY.depth],signal:last})};
}
