/* Floodgate Recovery: deterministic mission rules; no rhythm-score access. */
(function(root){'use strict';
 const KEY='prism-current.v1.water-mission',VERSION=1,RADIUS=.28;
 const objectives=[
  {id:'power',name:'Restore auxiliary power',hint:'Find the amber console on the right of the arrival deck.',pos:[5.45,1.1,1.1]},
  {id:'drain',name:'Open the intake floodgate',hint:'Turn the red pump valve at the left edge of the pool. The water will drain.',pos:[-5.7,1.05,-2.4]},
  {id:'core',name:'Recover the submerged prism',hint:'Cross the lowered basin. Dive below the far arch in the deep pool; follow the cyan guide lights.',pos:[0,-2.85,-37.6]},
  {id:'extract',name:'Return the prism to the arrival console',hint:'Swim back, use the arrival ladder or the ramp, and install the prism at the green console.',pos:[2.5,1.1,3.8]}
 ];
 const regions=[[-6.8,6.8,-15,5.8],[-1.6,1.6,-19,-14.5],[-6,6,-31,-18.5],[-1.8,1.8,-35.5,-30.5],[-4,4,-40,-35]];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
 function ground(x,z){
  if(z>=-3.0)return 0;
  if(z>-7&&x< -3.15&&x> -5.15)return -1.5*clamp((-z-3)/4,0,1);
  if(z>=-15&&(Math.abs(x)>5.2))return 0;
  if(z>=-18.5)return -1.5;
  return -4;
 }
 function ceiling(x,z){return z< -30.75&&z> -35.5?-1.95:6;}
 function inside(x,z){return [[0,0],[-RADIUS,0],[RADIUS,0],[0,-RADIUS],[0,RADIUS]].every(([dx,dz])=>regions.some(([a,b,c,d])=>x+dx>a&&x+dx<b&&z+dz>c&&z+dz<d));}
 function checkpoint(stage){return stage>=2&&stage<4?{x:0,y:-.72,z:-22,yaw:stage===3?Math.PI:0,pitch:0}:{x:0,y:1.65,z:3,yaw:0,pitch:0};}
 function read(text){try{const s=JSON.parse(text);if(s?.version===VERSION&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=4)return {stage:s.stage,best:Number.isFinite(s.best)&&s.best>0?s.best:null};}catch{}return {stage:0,best:null};}
 function create(saved){const p=read(saved);return {stage:p.stage,best:p.best,player:checkpoint(p.stage),water:p.stage>=2?-1.05:-.10,targetWater:p.stage>=2?-1.05:-.10,oxygen:32,elapsed:0,mode:'briefing',diving:false,torch:true,events:[],rescues:0};}
 function distance(a,b){return Math.hypot(a.x-b[0],a.y-b[1],a.z-b[2]);}
 function near(s){
  const p=s.player,o=objectives[s.stage];
  if(o&&distance(p,o.pos)<2.25)return {...o,label:s.stage===2?'Recover prism':s.stage===3?'Install prism':s.stage===1?'Turn pump valve':'Restore power'};
  if(p.z> -6&&p.z< -1&&p.x>3.6&&p.y<1.2)return {id:'ladder',label:'Climb arrival ladder'};
  return null;
 }
 function serial(s){return JSON.stringify({version:VERSION,stage:s.stage,best:s.best});}
 function interact(s){if(s.mode!=='playing')return false;const o=near(s);if(!o)return false;
  if(o.id==='ladder'){Object.assign(s.player,{x:5.7,y:1.65,z:-1.7});s.diving=false;s.oxygen=32;s.events.push('ladder');return true;}
  const expected=objectives[s.stage];if(!expected||expected.id!==o.id)return false;
  s.stage++;s.events.push(o.id);if(s.stage===2)s.targetWater=-1.05;
  if(s.stage===4){s.mode='complete';s.best=s.best===null?s.elapsed:Math.min(s.best,s.elapsed);s.diving=false;}
  return true;
 }
 function rescue(s){s.player=checkpoint(s.stage);s.oxygen=32;s.diving=false;s.rescues++;s.events.push('rescue');}
 function move(s,input,dt){
  if(s.mode!=='playing')return;dt=clamp(dt,0,.05);s.elapsed+=dt;
  s.water+=(s.targetWater-s.water)*Math.min(1,dt*.8);
  const p=s.player;let forward=clamp(input.forward,-1,1),side=clamp(input.side,-1,1),m=Math.max(1,Math.hypot(forward,side));forward/=m;side/=m;
  const floor=ground(p.x,p.z),depth=s.water-floor,wet=p.y-1.3<s.water,swim=wet&&depth>1.15;
  const speed=swim?2.35:wet?2.25:input.sprint?4.8:3.3;
  let dx=(-Math.sin(p.yaw)*forward+Math.cos(p.yaw)*side)*speed*dt,dz=(-Math.cos(p.yaw)*forward-Math.sin(p.yaw)*side)*speed*dt;
  if(swim&&p.z< -30&&p.z> -36)dz+=.18*dt;
  function pass(x,z){if(!inside(x,z))return false;
   if(s.stage<2&&z< -14.4)return false;
   if(ceiling(x,z)<p.y+.15)return false;
   if(ground(x,z)+1.6>p.y+.42&&!swim)return false;
   if(swim&&ground(x,z)>s.water+.30)return false;
   return true;
  }
  if(pass(p.x+dx,p.z))p.x+=dx;if(pass(p.x,p.z+dz))p.z+=dz;
  const bottom=ground(p.x,p.z),deep=s.water-bottom>1.15;
  const up=clamp(input.up,0,1),down=clamp(input.down,0,1);
  if(deep&&p.y<s.water+.5){
   if(down)s.diving=true;if(up&&p.y>s.water-.15)s.diving=false;
   if(down||up)p.y+=(up-down)*2*dt;
   else if(!s.diving)p.y+=(s.water+.22-p.y)*Math.min(1,dt*4);
   p.y=clamp(p.y,bottom+.48,Math.min(s.water+.35,ceiling(p.x,p.z)-.28));
  }else{p.y+=(bottom+1.65-p.y)*Math.min(1,dt*10);s.diving=false;}
  const underwater=p.y<s.water-.08;
  s.oxygen=underwater?Math.max(0,s.oxygen-dt):Math.min(32,s.oxygen+dt*9);
  if(s.oxygen<=0)rescue(s);
 }
 function look(s,yaw,pitch){s.player.yaw=(s.player.yaw+(Number.isFinite(yaw)?yaw:0))%(Math.PI*2);s.player.pitch=clamp(s.player.pitch+(Number.isFinite(pitch)?pitch:0),-1.35,1.35);}
 const api={KEY,VERSION,objectives,regions,ground,ceiling,inside,checkpoint,read,create,near,serial,interact,rescue,move,look};root.PrismWaterCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
