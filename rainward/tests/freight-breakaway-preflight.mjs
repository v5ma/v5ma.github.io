/* Classic MODEL diagnostic, not browser or human acceptance. New games only.
 * Public actions spend finite earned resources. No actor/clock/inventory writes.
 * Synthetic reactive healing and breakaway inputs are logged, including failure. */
import * as M from '../model.mjs';
import * as W from '../world.mjs';
export function freightRecovery({startDelay=0,decisionDelay=.4,reactive=true}={}){
 const s=M.createGame(),trace=[],recoveryInputs=[];let lastHeal=-Infinity,allowRecovery=false,aisleFlight=false;
 function tick(input={}){
  if(reactive&&allowRecovery&&s.t-lastHeal>.5&&s.player.hp<55&&s.player.medkit&&!s.player.craft){
   recoveryInputs.push({t:s.t,hp:s.player.hp,medkits:s.player.medkit});M.heal(s);lastHeal=s.t;
  }
  if(aisleFlight&&s.player.stance!=='stand'&&s.enemies.some(e=>e.hp>0&&e.seen&&e.state==='chase')){recoveryInputs.push({type:'breakaway',t:s.t,hp:s.player.hp,stamina:s.player.stamina});M.stance(s,'stand');}
  if(aisleFlight&&s.player.stance==='stand')input={...input,sprint:true};
  M.update(s,input,1/60);if(s.status==='dead')throw Error('Death during the actual model route');
 }
 function wait(t){for(let n=0;n<Math.ceil(t*60);n++)tick();}
 function record(label){trace.push({label,x:s.player.x,z:s.player.z,t:s.t,health:s.player.hp,medkits:s.player.medkit,smoke:s.player.smoke});}
 function go(x,z,sprint=false){
  const route=W.findPath(s.player,{x,z});route.push({x,z});
  for(const q of route){let n=0;while(W.dist(s.player,q)>.16){const dx=q.x-s.player.x,dz=q.z-s.player.z,d=Math.hypot(dx,dz);tick({x:dx/d,z:dz/d,sprint});if(++n>4000)throw Error('Blocked route '+JSON.stringify(q));}}
  wait(decisionDelay);record([x,z]);
 }
 function use(x,z,sprint=false){go(x,z,sprint);if(!M.interact(s))throw Error('Unavailable interaction '+x+','+z);wait(decisionDelay);}
 function craft(item){if(!M.craft(s,item))throw Error('Unavailable finite recipe '+item);while(s.player.craft)tick();wait(decisionDelay);}
 function healAt(label){if(s.player.hp<70&&s.player.medkit){M.heal(s);wait(decisionDelay);record(label);}}
 try{
  wait(startDelay);use(1.3,25.5);craft('medkit');craft('smoke');go(-13,23,true);M.stance(s,'crouch');go(-19,16);go(-19,7);M.stance(s,'stand');use(-24,5);use(-22,-3.5);use(-24,-1);craft('smoke');
  go(-22,-3.5,true);go(-22,-10,true);M.stance(s,'crouch');allowRecovery=true;go(-8,-10);healAt('ramp decision');if(!M.smoke(s))throw Error('Missing prepared market smoke');
  go(-5.2,-17);healAt('market recovery');go(4,-16.5);healAt('fountain recovery');go(9,-17);healAt('grass recovery');M.stance(s,'stand');go(12,-15,true);use(18,-11,true);M.stance(s,'crouch');healAt('receiver recovery');
  aisleFlight=true;go(16.2,-14);go(16.2,-18);go(16.2,-22);go(16.2,-24);aisleFlight=false;M.stance(s,'crouch');record('loading decision');
  if(!M.smoke(s))throw Error('Missing clinic-crafted commitment smoke');M.stance(s,'stand');go(17,-26,true);use(22.3,-26.7,true);record('spindle');go(17,-26,true);go(17,-24,true);go(11,-24,true);record('powered crossing');
  go(9,-21,true);go(-4,-23,true);go(-8,-10,true);go(-22,-10,true);go(-22,-3.5,true);use(-24,-1,true);healAt('clinic recovery');if(s.player.cloth&&s.player.canister)craft('medkit');
  go(-24,5,true);use(-26.1,5.8,true);go(-30,5.8,true);go(-31,11,true);go(-31,-15,true);go(-27,-24,true);go(-18,-26,true);go(-18,-42,true);use(0,-43,true);record('extraction');
  return {startDelay,decisionDelay,reactive,status:s.status,health:s.player.hp,stats:s.stats,livingEnemies:s.enemies.filter(e=>e.hp>0).length,recoveryInputs,trace};
 }catch(e){record('failure');return {startDelay,decisionDelay,reactive,status:s.status,error:String(e),health:s.player.hp,stats:s.stats,recoveryInputs,trace};}
}
if(process.argv[1]?.endsWith('freight-breakaway-preflight.mjs')){
 const results=[];for(const decisionDelay of [.15,.4,.8])for(const startDelay of [0,5,10,15,20])results.push(freightRecovery({startDelay,decisionDelay}));
 console.log(JSON.stringify({scope:'Fifteen sampled Classic model-action schedules with logged synthetic healing, directional-cover breakaway and two planned, earned smokes. Not native browser/controller/hardware or unfamiliar-player approval.',results},null,2));
}
