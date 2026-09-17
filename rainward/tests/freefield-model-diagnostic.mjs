/* Public model actions only; this is not browser or human acceptance. */
import * as M from '../model.mjs';import * as W from '../world.mjs';
function run(delay){const s=M.createGame('meridian'),log=[];
 const tick=(input={})=>{if(s.player.hp<55&&s.player.medkit&&!s.player.craft)M.heal(s);M.update(s,{freeStride:true,runSpeed:9,...input},1/60);if(s.status==='dead')throw Error('death');};
 const wait=t=>{for(let i=0;i<t*60;i++)tick();};
 const go=(x,z)=>{const raw=W.findPath(s.player,{x,z});if(!raw.length&&W.dist(s.player,{x,z})>1)throw Error('no route '+x+','+z);const route=raw.filter((p,i,a)=>!i||i===a.length-1||(p.x-a[i-1].x)!==(a[i+1].x-p.x)||(p.z-a[i-1].z)!==(a[i+1].z-p.z));route.push({x,z});for(const q of route){let n=0;while(W.dist(s.player,q)>.25){const dx=q.x-s.player.x,dz=q.z-s.player.z,d=Math.hypot(dx,dz),rate=Math.min(1,Math.max(.05,d/2.7));tick({x:dx/d*rate,z:dz/d*rate,sprint:true});if(++n>2000)throw Error('stuck');}}wait(delay);log.push({x,z,hp:s.player.hp,t:s.t});};
 const use=(x,z)=>{go(x,z);if(!M.interact(s))throw Error('no interact '+x+','+z);wait(delay);};
 const craft=()=>{if(!M.craft(s,'medkit'))throw Error('no craft');while(s.player.craft)tick();};
 try{use(2,56);craft();craft();use(-42,35);use(-43,20);use(-34,34);go(-42,32.5);use(-42,29);M.interact(s);wait(delay);use(-47,31);go(0,-29);use(33,-24);use(42,-27);use(42,-15);use(45,-12);for(let i=0;i<2&&s.player.cloth>0&&s.player.medkit<3;i++)craft();go(22,-26);go(0,-29);go(0,-50);go(0,-60);use(0,-72);use(0,-80);}catch(e){return{delay,status:s.status,error:String(e),hp:s.player.hp,log};}return{delay,status:s.status,hp:s.player.hp,objectives:s.objectives,log};}
console.log(JSON.stringify({scope:'Continuous model-action diagnostics with disclosed reactive earned-medkit use, not browser or human evidence',results:[run(0),run(.3),run(.6)]},null,2));
