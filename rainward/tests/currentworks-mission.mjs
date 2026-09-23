/* Continuous model mission: synthetic steering and ordinary actions, no state
 * assignments or resource grants. Native browser evidence is separate. */
import * as M from '../model.mjs';
import * as W from '../world.mjs';
import {GARDEN_RETURN} from '../conservatory-loop.mjs';
export function gardenMission({scavenge=true,decisionDelay=.25}={}){
 const s=M.createGame('conservatory'),trace=[];
 const tick=(i={})=>{if(s.player.hp<65&&s.player.medkit&&!s.player.craft)M.heal(s);M.update(s,i,1/60);if(s.status==='dead')throw Error('Living Conservatory route died');};
 const pause=()=>{for(let i=0;i<Math.ceil(decisionDelay*60);i++)tick();};
 function go(x,z){const path=W.findPath(s.player,{x,z});path.push({x,z});for(const p of path){let guard=0;while(W.dist(s.player,p)>.14){const dx=p.x-s.player.x,dz=p.z-s.player.z,d=Math.hypot(dx,dz);tick({x:dx/d,z:dz/d,sprint:true});if(++guard>4000)throw Error('Blocked '+JSON.stringify(p));}}pause();}
 function use(x,z){go(x,z);if(!M.interact(s))throw Error('Interaction failed '+[x,z]);pause();}
 function craft(k){if(!M.craft(s,k))throw Error('No earned supplies');while(s.player.craft)tick();}
 const mark=label=>trace.push({label,t:s.t,hp:s.player.hp,x:s.player.x,z:s.player.z,completed:[...s.completedTasks]});
 try{use(2,46);craft('medkit');craft('medkit');craft('smoke');use(-29,7);
 for(const [i,target]of [0,1,3].entries()){go(-29,[1,-7,-15][i]+1.5);let n=0;while(s.puzzle.wheels[i]!==target&&n++<4){if(!M.interact(s))throw Error('Wheel');pause();}}
 if(scavenge)use(-42,5);
 use(-40,-3);mark('catalogue opens maintenance shutter');if(scavenge)craft('smoke');use(-41,-18);use(-40,-21);
 for(const [x,z]of GARDEN_RETURN)go(x,z);mark('used the optional return loop');
 for(const [x,z]of[[-18,-23],[19,-26],[26,-27],[29,4]])go(x,z);if(scavenge){use(30,4);craft('medkit');}use(39,-19);M.smoke(s);
 for(const [x,z]of[[20,-6],[0,-27],[0,-37],[0,-61]])go(x,z);
 if(scavenge){M.smoke(s);go(-8,-66);go(-8,-72);}else{go(10,-66);go(10,-72);}use(0,-72);mark('extraction');
 return {status:s.status,hp:s.player.hp,stats:s.stats,scavenge,decisionDelay,alive:s.enemies.filter(e=>e.hp>0).length,trace};
 }catch(e){mark('failure');return {status:s.status,hp:s.player.hp,error:String(e),trace};}
}
if(process.argv[1]?.endsWith('currentworks-mission.mjs')){const result=gardenMission();console.log(JSON.stringify(result,null,2));if(result.status!=='won'||result.error)process.exitCode=1;}
