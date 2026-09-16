/* Reproducible MODEL preflight. Calls public model actions, not native input.
 * No actor teleports, resources, enemy removals or clock assignments. */
import * as M from '../model.mjs';import * as W from '../world.mjs';
function run(western){
 const s=M.createGame(),trace=[];
 function step(input={}){if(s.player.hp<60&&s.player.medkit)M.heal(s);M.update(s,input,1/60);if(s.status!=='playing')throw Error(JSON.stringify({x:s.player.x,z:s.player.z,hp:s.player.hp,seconds:s.t}));}
 function go(x,z,sprint=true){const route=W.findPath(s.player,{x,z});route.push({x,z});for(const target of route){let n=0;while(W.dist(s.player,target)>.16){const dx=target.x-s.player.x,dz=target.z-s.player.z,d=Math.hypot(dx,dz);step({x:dx/d,z:dz/d,sprint});if(++n>4000)throw Error('Blocked route');}}for(let i=0;i<8;i++)step();trace.push({x,z,health:s.player.hp,seconds:s.t});}
 function use(x,z){go(x,z);if(!M.interact(s))throw Error('Unavailable interaction at '+x+','+z);}
 function craft(kind){if(!M.craft(s,kind))throw Error('Unavailable recipe');while(s.player.craft)step();}
 try{
  use(1.3,25.5);craft('medkit');craft('smoke');go(-13,23);M.stance(s,'crouch');go(-19,16,false);go(-19,7,false);M.stance(s,'stand');use(-24,5);use(-22,-3.5);use(-24,-1);
  go(-22,-3.5);go(-22,-10);go(-8,-10);go(0,-8);go(10,-10);use(18,-11);go(17,-16);go(17,-26);use(22.3,-26.7);go(17,-26);M.smoke(s);go(17,-24);go(11,-24);go(9,-21);go(-4,-23);go(-8,-10);go(-22,-10);go(-22,-3.5);use(-24,-1);craft('medkit');
  if(western){go(-24,5);use(-26.1,5.8);go(-30,5.8);go(-31,11);go(-31,-15);go(-27,-24);go(-18,-26);go(-18,-42);use(0,-43);}
  else{go(-22,-3.5);go(-22,-10);go(-8,-10);go(0,-8);go(0,-43);use(0,-43);}
  return {route:western?'learned-western-return':'direct-central-return',status:s.status,health:s.player.hp,stats:s.stats,livingEnemies:s.enemies.filter(e=>e.hp>0).length,tasks:s.completedTasks,trace};
 }catch(error){return {route:western?'learned-western-return':'direct-central-return',status:s.status,error:String(error),health:s.player.hp,stats:s.stats,trace};}
}
console.log(JSON.stringify({scope:'Model-action preflight only, not native input, human performance or physical-device evidence.',results:[run(false),run(true)]},null,2));
