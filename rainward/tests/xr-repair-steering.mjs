/* Synthetic device driver for the real game; never writes actors, inventory,
 * health, quest state or simulation time. It is not human reaction evidence. */
import * as T from '../vendor/three.module.js';
import * as W from '../world.mjs';
const UP=new T.Vector3(0,1,0),FORWARD=new T.Vector3(0,0,-1);
export function aimHeight(enemy){return W.heightAt(enemy.x,enemy.z)+(enemy.type==='prowler'?.5:enemy.type==='brute'?1.25:enemy.type==='shrieker'?1.1:1.05);}
function defense(device,game,memo){
 const state=game.state,p=state.player,xr=game.snapshot().xr;
 const origin=new T.Vector3(...xr.weapon.muzzle);
 const targets=state.enemies.filter(e=>e.hp>0&&e.seen&&e.state==='chase'&&W.dist(e,p)<16).sort((a,b)=>W.dist(a,p)-W.dist(b,p));
 const enemy=targets.find(e=>!W.obstruction(origin,{x:e.x,y:aimHeight(e),z:e.z}));
 if(!enemy){device.button('right',0,false);device.button('left',0,false);return false;}
 const direction=new T.Vector3(enemy.x,aimHeight(enemy),enemy.z).sub(origin).normalize().applyAxisAngle(UP,-xr.rig.yaw);
 const q=new T.Quaternion().setFromUnitVectors(FORWARD,direction);device.sources.find(s=>s.handedness==='right').orientation={x:q.x,y:q.y,z:q.z,w:q.w};
 // Aim at the actual low prowler torso, not the empty space above its hitbox.
 device.button('left',0,true);device.button('right',0,p.mag>0&&!p.reload);
 if(!p.mag&&!p.reload&&p.reserve>0&&performance.now()-memo.reload>1700){device.pulse('right',5);memo.reload=performance.now();}
 if(memo.target!==enemy.id){memo.target=enemy.id;device.repairDefense.push({t:state.t,id:enemy.id,type:enemy.type,height:aimHeight(enemy),mag:p.mag,reserve:p.reserve});}
 return true;
}
export async function driveTo(x,z){
 const device=window.questDevice,game=window.Rainward,left=device.sources.find(s=>s.handedness==='left');
 if(!device.repairDefense)device.repairDefense=[];
 const path=W.findPath(game.state.player,{x,z});if(!path.length&&W.dist(game.state.player,{x,z})>1)throw Error('No actual navigation route');
 path.push({x,z});const points=path.filter((p,i,a)=>i===0||i===a.length-1||Math.abs((p.x-a[i-1].x)*(a[i+1].z-p.z)-(p.z-a[i-1].z)*(a[i+1].x-p.x))>.001);
 await new Promise((resolve,reject)=>{
  let i=0,last=-1;const begin=performance.now(),memo={reload:-Infinity,target:null};
  const stop=()=>{clearInterval(timer);left.gamepad.axes=[0,0,0,0];device.button('right',0,false);device.button('left',0,false);};
  const timer=setInterval(()=>{if(device.frames===last)return;last=device.frames;
   const p=game.state.player;if(game.mode!=='play'||performance.now()-begin>100000){stop();reject(Error('Travel stopped '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,goal:points[i],mode:game.mode})));return;}
   const q=points[i],dx=q.x-p.x,dz=q.z-p.z,distance=Math.hypot(dx,dz);
   if(distance<.35){if(++i===points.length){stop();resolve();}return;}
   defense(device,game,memo);
   const yaw=game.view.yaw,speed=p.aim?1.86:game.snapshot().freefield.runSpeed;
   let vx=dx*3-(p.vx||0)*.25,vz=dz*3-(p.vz||0)*.25,length=Math.hypot(vx,vz);
   if(length>speed){vx*=speed/length;vz*=speed/length;}
   const raw=v=>Math.abs(v)<.001?0:Math.sign(v)*(.22+.78*Math.min(1,Math.abs(v)));
   left.gamepad.axes[2]=raw((Math.cos(yaw)*vx-Math.sin(yaw)*vz)/speed);left.gamepad.axes[3]=raw((Math.sin(yaw)*vx+Math.cos(yaw)*vz)/speed);
  },16);
 });
}
export async function clearPursuer(){
 const device=window.questDevice,game=window.Rainward,memo={reload:-Infinity,target:null};if(!device.repairDefense)device.repairDefense=[];
 await new Promise((resolve,reject)=>{const begin=performance.now();let last=-1;
  const stop=()=>{clearInterval(timer);device.button('right',0,false);device.button('left',0,false);};
  const timer=setInterval(()=>{if(last===device.frames)return;last=device.frames;if(game.mode!=='play'){stop();reject(Error('Defense interrupted'));return;}
   if(!defense(device,game,memo)){stop();resolve();return;}
   if(performance.now()-begin>30000){stop();reject(Error('Real finite-ammo defense timed out '+JSON.stringify({hp:game.state.player.hp,mag:game.state.player.mag,reserve:game.state.player.reserve})));}
  },16);
 });
}
