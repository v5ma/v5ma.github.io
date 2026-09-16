/* Model-only comparison of the legacy keyboard mission; not a browser result. */
import * as M from '../model.mjs';
import * as W from '../world.mjs';
export function legacyMission({startDelay=0,decisionDelay=.4,clinicPreparation=true}={}){
 const s=M.createGame(),trace=[],inputs=[];
 const tick=(input={})=>{if(s.player.hp<65&&s.player.medkit){inputs.push({type:'mapped heal',t:s.t,hp:s.player.hp});M.heal(s);}M.update(s,input,1/60);if(s.status==='dead')throw Error('Mission death');};
 const wait=t=>{for(let i=0;i<Math.ceil(t*60);i++)tick();};
 const record=label=>trace.push({label,x:s.player.x,z:s.player.z,t:s.t,hp:s.player.hp,stance:s.player.stance,medkit:s.player.medkit,smoke:s.player.smoke,stamina:s.player.stamina});
 const go=(x,z,sprint=true)=>{
  const route=W.findPath(s.player,{x,z});route.push({x,z});
  const points=route;
  for(const p of points){let n=0;while(W.dist(p,s.player)>.37){const dx=p.x-s.player.x,dz=p.z-s.player.z;const d=Math.hypot(dx,dz);tick({x:dx/d,z:dz/d,sprint});if(++n>2000)throw Error('Navigation blocked '+JSON.stringify(p));}}
  wait(decisionDelay);record([x,z]);
 };
 const use=(x,z)=>{go(x,z);if(!M.interact(s))throw Error('No interaction '+x+','+z);wait(decisionDelay);};
 const craft=item=>{if(!M.craft(s,item))throw Error('Missing earned recipe');while(s.player.craft)tick();wait(decisionDelay);};
 try{
  wait(startDelay);use(1.3,25.5);craft('medkit');craft('smoke');
  for(const [x,z] of [[-19,14],[-19,7],[-24,6],[-24,-3.5],[-22,-3.5]])go(x,z);
  M.interact(s);wait(decisionDelay);
  if(clinicPreparation){use(-24,5);craft('medkit');}
  use(-24,-1);
  for(const [x,z]of [[-24,6],[-19,7],[-19,12],[-31,12],[-31,-15],[-27,-16],[-27,-24],[-18,-26],[-18,-42],[12,-46],[21,-32],[21,-26.7],[22.3,-26.7]])go(x,z);
  M.interact(s);wait(decisionDelay);record('spindle');
  M.heal(s);
  M.smoke(s);
  go(21,-32);go(16,-38);
  go(0,-43);M.interact(s);record('extraction');
 }catch(e){record(String(e));}
 return {startDelay,decisionDelay,clinicPreparation,status:s.status,hp:s.player.hp,t:s.t,completedTasks:s.completedTasks,living:s.enemies.filter(e=>e.hp>0).length,inputs,trace};
}
if(process.argv[1]?.endsWith('legacy-unpowered-preflight.mjs')){
 const results=[];
 for(const variant of [{clinicPreparation:true}])for(const decisionDelay of [.15,.4,.8])for(const startDelay of [0,5,10,15,20])results.push(legacyMission({startDelay,decisionDelay,...variant}));
 console.log(JSON.stringify({scope:'Sampled unpowered route model-action schedules (continuous model steering, not the discrete keyboard browser driver) with the pre-existing synthetic mapped-heal assistance; not native-browser acceptance.',results},null,2));
}
