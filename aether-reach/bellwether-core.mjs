/* Deterministic mission state. No renderer, DOM, remote requests or pose saves. */
import {BELL_TASK,BELL_POINTS,BELL_TARGETS,BELL_WAVES,BELL_STAGES,bellProgress,bellGoal} from './bellwether-world.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function cleanBellwether(v){v=v&&typeof v==='object'?v:{};return {stage:Number.isInteger(v.stage)?Math.max(0,Math.min(6,v.stage)):0,dials:[0,1,2].map(i=>Number.isInteger(v.dials?.[i])?Math.max(0,Math.min(3,v.dials[i])):0)};}
export function bellSnapshot(s){return {...cleanBellwether(s.bellwether),encounter:s.bellwether?.encounter||null,hold:s.bellwether?.hold||0,objective:BELL_STAGES[s.bellwether?.stage||0],progress:bellProgress(s),goal:bellGoal(s)};}
export function createBellwether({emit,clearLine,groundAt,occupied,drop}){
 const eye=s=>({...s.p,y:s.p.y+(s.p.crouched?.9:1.5)});
 const say=(s,text)=>emit(s,'expedition-message',{text});
 function init(s,v){s.bellwether={...cleanBellwether(v),encounter:null,hold:0,gap:0,wave:0};if(s.expedition.flags.includes(BELL_TASK.flag))s.bellwether.stage=6;else if(s.bellwether.stage===6)s.bellwether.stage=5;}
 function save(s){emit(s,'save');}
 function advance(s,stage,text){s.bellwether.stage=stage;s.bellwether.encounter=null;s.bellwether.hold=0;say(s,text);emit(s,'bell-stage',{stage});save(s);}
 function nearby(s){const b=s.bellwether,p=s.p;if(!b||!p.grounded||p.rail||p.ride||p.climb)return null;
  const available=BELL_POINTS.filter(q=>q.kind==='desk'||(b.stage===2&&['dial','tester'].includes(q.kind))||([3,4,5].includes(b.stage)&&q.kind==='signal'));
  const q=available.filter(q=>dist(p,q)<1.8&&clearLine(eye(s),{...q,y:q.y+1.2},s)).sort((a,b)=>dist(p,a)-dist(p,b))[0];
  return q?{type:'bellwether',id:q.id,label:'X / E - '+q.name+(q.kind==='dial'?' / '+b.dials[Number(q.id.at(-1))]:'')}:null;
 }
 function spawn(s,wave){const b=s.bellwether,roof=wave!=='street',home=roof?{x:-107,y:27.5,z:-9,w:14,d:16}:{x:-93,y:7,z:-18,w:48,d:40};
  for(const [i,q]of BELL_WAVES[wave].entries()){
   if(occupied(q.x,q.y,q.z,s)||Math.abs(groundAt(q.x,q.z,q.y+.2).y-q.y)>.2)throw new Error('Bellwether spawn has no clear floor: '+wave+i);
   const y=q.y+1.05;s.drones.push({id:'bell-blackout-'+wave+'-'+i,bellwetherEnemy:true,humanoid:true,kind:q.kind,home:'bellmarket',arenaHome:home,x:q.x,y,z:q.z,hp:q.hp,maxHp:q.hp,stun:0,attack:2.2+i*.45,telegraph:0,patrol:[[q.x,q.z],[q.x,q.z+1.2]],patrolIndex:0,origin:{x:q.x,y,z:q.z},range:roof?23:32,chaseSpeed:wave==='guardian'?1.3:1.8,projectileSpeed:q.kind==='longshot'?27:18,shotDamage:wave==='guardian'?10:11,attackDelay:wave==='guardian'?3.4:2.8,gun:q.kind==='longshot'?'sniper':q.kind==='breacher'?'scatter':'carbine',reward:0});
  }
  b.gap=2;emit(s,'bell-wave',{wave,at:{...BELL_POINTS[roof?5:0]}});
 }
 function begin(s,roof){const b=s.bellwether;if(b.encounter||s.skirmish.battle.phase==='active'||s.expedition.defense.active||s.tactics.encounter.phase==='active'){say(s,'Finish or leave the active encounter before starting the Blackout defense.');return false;}
  s.drones=s.drones.filter(e=>!e.bellwetherEnemy);b.encounter=roof?'roof':'street';b.stage=roof?4:1;b.wave=0;b.hold=0;s.expedition.tracked=BELL_TASK.id;s.checkpoint='bellmarket';spawn(s,b.encounter);say(s,roof?'TAVI: Receiver online. Two boarders are closing in; keep the ladder exit clear.':'TAVI: Stop the two street disruptors. The Arcade entrance is on the northwest side of the market.');save(s);return true;
 }
 function handle(s,id){if(s.won||nearby(s)?.id!==id)return false;const b=s.bellwether;s.expedition.tracked=BELL_TASK.id;
  if(id==='bell-dispatch'){
   if(b.stage<2)return begin(s,false);
   if(b.stage===5){if(!s.expedition.flags.includes(BELL_TASK.flag)){s.expedition.flags.push(BELL_TASK.flag);s.kit.credits=Math.min(99999,s.kit.credits+BELL_TASK.reward);emit(s,'expedition-complete',{id:BELL_TASK.id,name:BELL_TASK.name,credits:BELL_TASK.reward});}advance(s,6,'TAVI: The market is back on its own frequency. The lamps are lit, the Arcade is running, and the rooftop route is open. Your 300-credit dispatch reward is recorded.');return true;}
   say(s,b.stage===6?'Bellwether remains restored. Your reward and completed adventure are saved.':'Current dispatch: '+BELL_STAGES[b.stage]+'. Track this adventure in the journal for the next destination.');save(s);return true;
  }
  if(id.startsWith('bell-dial-')&&b.stage===2){const i=Number(id.at(-1));b.dials[i]=(b.dials[i]+1)%4;emit(s,'bell-dial',{dial:i,value:b.dials[i],at:{...BELL_POINTS[i+1]}});say(s,'Arcade dials '+b.dials.join(', ')+'. The maintenance card calls for 2, 1, 3 from west to east.');save(s);return true;}
  if(id==='bell-test'&&b.stage===2){if(!BELL_TARGETS.every((v,i)=>v===b.dials[i])){say(s,'Circuit unstable. Set the three Arcade dials to 2, 1, 3, then test again.');return false;}advance(s,3,'TAVI: Arcade power is stable. Take the Theatre service ladder from the south street, then reconnect the rooftop receiver.');return true;}
  if(id==='bell-signal'){if(b.stage===3||b.stage===4&&!b.encounter)return begin(s,true);say(s,b.stage===5?'Receiver synchronized. Return to the eastern dispatch desk for your reward.':bellProgress(s));return true;}return false;
 }
 function killed(s,e){if(!e.bellwetherEnemy)return false;if(e.credited)return true;e.credited=true;e.hp=0;s.stats.defeated++;drop(s,e);emit(s,'defeat',{id:e.id,at:{x:e.x,y:e.y,z:e.z}});return true;}
 function abort(s,reason='interrupted'){const b=s.bellwether;if(!b?.encounter)return;b.encounter=null;b.hold=0;s.drones=s.drones.filter(e=>!e.bellwetherEnemy);say(s,'Blackout encounter '+reason+'. Completed circuit work is kept. Use the dispatch desk or rooftop receiver to retry.');save(s);}
 function tick(s,dt){const b=s.bellwether;if(!b?.encounter)return;const roof=b.encounter==='roof',p=s.p;if(roof?(Math.abs(p.x+107)>18||Math.abs(p.z+9)>20||p.y<24||p.y>38):(Math.hypot(p.x+93,p.z+18)>43||Math.abs(p.y-7)>12)){abort(s,'left behind');return;}
  if(s.drones.some(e=>e.bellwetherEnemy&&e.hp>0))return;
  if(!roof){advance(s,2,'TAVI: The disruptors are down. Enter the Clockmaker\'s Arcade and read the maintenance card. Three dials restore the workshop circuit.');return;}
  if(b.wave===0){b.gap-=dt;if(b.gap<=0){b.wave=1;spawn(s,'guardian');say(s,'TAVI: Signal guard incoming. Watch the wind-up, use the low rooftop cover, and keep moving.');}return;}
  const receiver=BELL_POINTS[5];if(p.grounded&&dist(p,receiver)<2.8)b.hold=Math.min(6,b.hold+dt);else b.hold=Math.max(0,b.hold-dt*.5);
  if(b.hold>=6)advance(s,5,'TAVI: Signal locked. Bellwether\'s lamps are lit again. Descend by ladder or Foldwing and report to the eastern dispatch desk.');
 }
 return {init,nearby,handle,killed,abort,tick};
}
