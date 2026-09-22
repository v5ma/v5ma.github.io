import {watchState} from './watch.mjs';

export const CAMPAIGN_REWARDS=Object.freeze({flight:150,predator:180,interiors:160,freeflow:200,finale:260});
export const CAMPAIGN_SYSTEMS=Object.freeze([
 {id:'market-speaker',label:'Market speaker loop',cases:Object.freeze(['predator','finale']),x:-20.5,y:0,z:-4.2,effect:'distract',radius:9,target:Object.freeze({x:-20.5,y:0,z:-2.7})},
 {id:'court-lights',label:'Receiving-court work lights',cases:Object.freeze(['freeflow','finale']),x:4.8,y:0,z:6.2,effect:'stun',radius:5.5},
 {id:'loft-brake',label:'Loading-hoist brake',cases:Object.freeze(['freeflow','finale']),x:10.2,y:4.4,z:-1.8,effect:'stun',radius:7}
]);
const INTERIOR_REVEALS=Object.freeze({
 'room-print':'Ada’s press logs show the outage arrived as timed maintenance commands, not a random failure.',
 'room-kitchen':'Bea’s kitchen timers lost power before the street lamps. Someone staged the blackout from inside the service network.',
 'room-store':'Tomas’s sort board repeats the same relay signature on deliveries that crossed the north quay.',
 'room-green':'Lin’s greenhouse controller shows the signal hopping through ordinary neighborhood equipment to hide its source.',
 'room-workshop':'Neri’s foundry recorder captures the final handoff: the bell-tower relay is rebroadcasting the forged maintenance sequence.',
 'room-water':'The canal service bed carries the same cable run beneath the ward. Ada now has a complete physical path back to the relay.',
 'room-report':'Ada pins the evidence together: whoever hijacked the ward expected every system to look like somebody else’s problem.'
});
const point=(id,label,x,y,z,kind='interact')=>({id,label,x,y,z,kind});
export const CAMPAIGN_CASES=Object.freeze([
 {id:'flight',title:'Case 02: Rooftop Run',reward:150,summary:'Recover the cape rig, learn the service perches, then glide to a safe lower landing and reuse the familiar stair route.',steps:[
  point('flight-brief','Meet Sal in the loading loft',12,4.4,0),point('flight-rig','Recover the folded cape rig on the print terrace',-14.5,4.4,-4.4),point('flight-launch','Reach the print-terrace launch rail',-16,4.4,-4.4,'launch'),point('flight-land','Glide to the marked arcade landing; release the cape above it',-20.5,0,-10.5,'land'),point('flight-report','Report the route to Sal',12,4.4,0)]},
 {id:'predator',title:'Case 03: Quiet Circuit',reward:180,summary:'Read patrols, use overhead space and service vents, and shut down the hijacked security net without a brawl.',steps:[
  point('predator-brief','Meet Mara at the watch desk',-10,0,14),point('predator-vantage','Observe the north storehouse from the roof approach',-10,4.4,-4.2,'observe'),point('predator-clear','Silently disable the storehouse patrols',-10,0,-17.5,'clear'),point('predator-vent','Use the market service vent to cross unseen',-20.5,0,-2.7,'vent'),point('predator-relay','Disable the greenhouse security relay',18,0,-17,'relay'),point('predator-report','Return to Mara',-10,0,14)]},
 {id:'interiors',title:'Case 04: Rooms of the Ward',reward:160,summary:'Trace the blackout through the working interiors. Learn what each building actually does.',steps:[
  point('room-print','Inspect Ada’s press room',-9.6,0,1.1),point('room-kitchen','Inspect Bea’s market kitchen',-20.5,0,-2.7),point('room-store','Inspect Tomas’s north storehouse',-10,0,-17.5),point('room-green','Inspect Lin’s greenhouse service bench',18,0,-16.5),point('room-workshop','Inspect Neri’s workshop floor',15,0,6),point('room-water','Inspect the lower canal service bed',-.5,-2,-7),point('room-report','Return the systems map to Ada',-9.5,0,4.5)]},
 {id:'freeflow',title:'Case 05: Courtyard Surge',reward:200,summary:'Keep moving through a multi-sentry encounter. Lunge, counter, pulse and reposition instead of trading stationary hits.',steps:[
  point('flow-brief','Meet Mara before the surge',-10,0,14),point('flow-court','Clear the receiving-court sentries',6,0,8,'combat'),point('flow-loft','Clear the loading-loft sentries',15,4.4,0,'combat'),point('flow-report','Return to Mara',-10,0,14)]},
 {id:'finale',title:'Case 06: Last Light',reward:260,summary:'Choose a stealth roof route or a direct courtyard route, restore the neighborhood signal, then return through the connections you mastered.',steps:[
  point('finale-brief','Meet Sal at the radio loft',12,4.4,0),point('finale-choice','Reach the final signal through roof stealth or courtyard combat',6,4.4,-3.5,'choice'),point('finale-relay','Restore the final relay at the bell tower',20,4.4,-3,'relay'),point('finale-home','Return to the depot through any learned connection',-10,0,14)]}
]);

export const freshCampaign=()=>({v:1,active:null,progress:{},completed:[],credits:0,route:'stealth'});
export function parseCampaign(raw){
 if(raw==null)return freshCampaign();
 if(!raw||raw.v!==1||!Array.isArray(raw.completed)||!raw.progress||typeof raw.progress!=='object'||Array.isArray(raw.progress)||!['stealth','combat'].includes(raw.route))throw Error('Unsupported Night Watch campaign save. Existing progress retained.');
 const ids=new Set(CAMPAIGN_CASES.map(c=>c.id)),completed=[...new Set(raw.completed)];if(completed.length!==raw.completed.length||completed.some(id=>!ids.has(id))||raw.active!==null&&!ids.has(raw.active))throw Error('Invalid campaign identity.');
 const progress={};for(const [id,n] of Object.entries(raw.progress)){const c=CAMPAIGN_CASES.find(x=>x.id===id);if(!c||!Number.isInteger(n)||n<0||n>c.steps.length)throw Error('Invalid campaign stage.');progress[id]=n;}
 for(const c of CAMPAIGN_CASES)if((progress[c.id]===c.steps.length)!==completed.includes(c.id))throw Error('Inconsistent campaign completion.');
 const credits=completed.reduce((n,id)=>n+CAMPAIGN_REWARDS[id],0);if(raw.credits!==credits||raw.active&&completed.includes(raw.active))throw Error('Invalid campaign credit ledger.');
 return {v:1,active:raw.active,progress,completed,credits,route:raw.route};
}
export const campaignState=s=>s.campaign||(s.campaign=freshCampaign());
export function campaignAvailable(s,id){const i=CAMPAIGN_CASES.findIndex(c=>c.id===id);if(i<0)return false;if(i===0)return watchState(s).stage===4;return campaignState(s).completed.includes(CAMPAIGN_CASES[i-1].id);}
export function campaignCanGlide(s){const c=campaignState(s);return c.completed.includes('flight')||(c.active==='flight'&&(c.progress.flight||0)>=2);}
export function campaignOptions(s){const c=campaignState(s);return CAMPAIGN_CASES.filter(m=>campaignAvailable(s,m.id)||c.completed.includes(m.id)||c.active===m.id).map(m=>({id:'campaign:'+m.id,title:m.title+(c.completed.includes(m.id)?' / complete':''),detail:m.summary,disabled:c.completed.includes(m.id),active:c.active===m.id,stage:c.progress[m.id]||0}));}
export function trackCampaign(s,id){id=id.replace(/^campaign:/,'');const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===id);if(!m||!campaignAvailable(s,id)||c.completed.includes(id))return 'That case is not available yet.';c.active=id;if(c.progress[id]==null)c.progress[id]=0;if(s.city)s.city.active=null;if(s.watch)s.watch.tracking=false;return 'Tracking '+m.title+'. '+campaignTarget(s).label+'.';}
export function campaignTarget(s){const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===c.active);if(!m)return null;const n=c.progress[m.id]||0,step=m.steps[n];if(!step)return null;if(m.id==='finale'&&step.id==='finale-choice'&&c.route==='combat')return {...step,label:'Reach the final signal through the receiving-court combat route',x:6,y:0,z:8,kind:'campaign',caseId:m.id};return {...step,kind:'campaign',caseId:m.id};}
export function campaignGoal(s){const t=campaignTarget(s);return t?CAMPAIGN_CASES.find(c=>c.id===t.caseId).title+': '+t.label:'';}

const sessions=new WeakMap();
const patrols={
 predator:[
  {id:'quiet-1',role:'Watcher',home:[-12,-17.2],route:[[-14,-17.2],[-8,-17.2],[-8,-15.8],[-14,-15.8]]},
  {id:'quiet-2',role:'Watcher',home:[-6,-13.5],route:[[-6,-14],[-4,-14],[-4,-13.4],[-6,-13.4]]},
  {id:'quiet-3',role:'Watcher',home:[-23,-5],route:[[-23,-5],[-22.8,-5],[-22.8,-1],[-23,-1]]}
 ],
 freeflow:[
  {id:'flow-1',role:'Scout',home:[5,7],route:[[5,7],[7,7]]},{id:'flow-2',role:'Shield',home:[7,9],route:[[7,9],[5,9]]},{id:'flow-3',role:'Brute',home:[5,10],route:[[5,10],[8,10]]},{id:'flow-4',role:'Scout',home:[8,7],route:[[8,7],[8,10]]}
 ],
 finale:[
  {id:'final-1',role:'Watcher',home:[4,-3.5],route:[[4,-3.5],[8,-3.5]]},{id:'final-2',role:'Shield',home:[10,-3.5],route:[[10,-3.5],[14,-3.5]]},{id:'final-3',role:'Scout',home:[16,-2],route:[[16,-2],[18,-4]]}
 ]
};
function makeEnemy(e){return {...e,x:e.home[0],y:e.id.startsWith('final')?4.4:0,z:e.home[1],yaw:0,hp:e.role==='Brute'?5:3,phase:'patrol',timer:0,routeIndex:0,awareness:0,stun:0,distract:0,distractPoint:null};}
function runtimeFor(id){return {caseId:id,enemies:(patrols[id]||[]).map(makeEnemy),smoke:0,smokeCooldown:0,pulseCooldown:0,strikeCooldown:0,lunge:null,glideSeconds:0,glideLanded:false,takedowns:0,dropTakedowns:0,counters:0,bestCombo:0,combo:0,alertPeak:0,selected:'grapple',holsterDraws:0,guard:false,guardWindow:0,focus:false,systemsUsed:[],systemUses:0};}
export function campaignRuntime(s){const c=campaignState(s);let r=sessions.get(s);if(!r||r.caseId!==c.active){r=runtimeFor(c.active);sessions.set(s,r);}return r;}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const eye=s=>({x:s.x,y:s.y+1.3,z:s.z});
const visible=(s,e,api)=>api.lineClear(s,eye(s),{x:e.x,y:e.y+1,z:e.z});
function enemyStepClear(s,e,x,z,api){const floor=api.support(s,x,z,e.y+.1);return !!floor&&Math.abs(api.floorHeight(floor,z)-e.y)<.4&&!api.blocked(s,x,e.y,z);}
function behind(s,e){const to=Math.atan2(s.x-e.x,s.z-e.z),d=Math.atan2(Math.sin(to-e.yaw),Math.cos(to-e.yaw));return Math.abs(d)>2.15;}
function close(s,t,api,r=1.9){return distance(s,t)<r&&api.lineClear(s,eye(s),{x:t.x,y:t.y+1,z:t.z});}
function nearbySystem(s,m,r,api){
 return CAMPAIGN_SYSTEMS.filter(n=>n.cases.includes(m.id)&&!r.systemsUsed.includes(n.id)&&distance(s,n)<2.5&&api.lineClear(s,eye(s),{x:n.x,y:n.y+1,z:n.z})).sort((a,b)=>distance(s,a)-distance(s,b))[0]||null;
}
function useSystem(s,m,r,node,api){
 let affected=[];
 if(node.effect==='distract'){
  affected=r.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,node.target)-distance(b,node.target)).slice(0,2);
  if(!affected.length){api.say(s,'The '+node.label+' is ready, but no active patrol can hear it.');return true;}
  for(const e of affected){e.distract=4.5;e.distractPoint={x:node.target.x,z:node.target.z};e.awareness=0;e.phase='investigate';}
  api.say(s,node.label+': rerouted audio. '+affected.length+' patrol'+(affected.length===1?' is':'s are')+' investigating the false call.');
 }else{
  affected=r.enemies.filter(e=>e.hp>0&&distance(e,node)<=node.radius);
  if(!affected.length){api.say(s,'The '+node.label+' is ready, but no sentry is inside its safe effect zone.');return true;}
  for(const e of affected){e.stun=Math.max(e.stun,2.4);e.awareness=0;e.phase='stunned';}
  api.say(s,node.label+': maintenance pulse fired. '+affected.length+' sentr'+(affected.length===1?'y is':'ies are')+' briefly staggered.');
 }
 r.systemsUsed.push(node.id);r.systemUses++;
 return true;
}
function completeCase(s,m){const c=campaignState(s);if(!c.completed.includes(m.id)){c.completed.push(m.id);c.credits+=m.reward;}c.progress[m.id]=m.steps.length;c.active=null;return m.title+' complete. +'+m.reward+' Watch campaign credits.';}
function next(s,text){const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===c.active);c.progress[m.id]=(c.progress[m.id]||0)+1;return c.progress[m.id]>=m.steps.length?completeCase(s,m):text+' Next: '+campaignTarget(s).label+'.';}
export function campaignInteract(s,api){const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===c.active),t=campaignTarget(s);if(!m||!t)return null;const r=campaignRuntime(s);t.kind=m.steps[c.progress[m.id]||0].kind;
 if(t.kind==='combat'||t.kind==='clear')return r.enemies.every(e=>e.hp<=0)?next(s,'Area secure.'):'Threats remain. Keep moving, counter blue cues, or break sight.';
 if(t.kind==='land')return r.glideLanded&&close(s,t,api,4)?next(s,'Glide route proven.'):'Hop from the print-terrace rail toward the marked arcade landing. Release the cape above it, then return by the print-shop stairs.';
 if(t.kind==='choice')return c.route==='stealth'&&r.enemies.every(e=>e.hp<=0)||c.route==='combat'&&r.enemies.every(e=>e.hp<=0)?next(s,'Final approach clear.'):'Choose stealth or combat from Field tools, then clear the signal approach.';
 if(!close(s,t,api,t.kind==='observe'?3:2.1))return null;
 if(t.kind==='observe')return next(s,'Patrol timing mapped from above.');
 if(t.kind==='vent')return next(s,'Service vent used. The route reconnects behind the market line.');
 if(m.id==='finale'&&t.id==='finale-relay')return next(s,'The bell-tower relay accepts the repaired neighborhood key. The forged maintenance chain collapses and every district system comes back under local control.');
 if(t.kind==='relay')return next(s,'Relay disabled.');
 if(t.kind==='launch')return next(s,'Cape rig armed. Hop, glide west over the arcade, and release above the marked landing. Reuse the print-shop stairs to return.');
 if(m.id==='interiors'&&INTERIOR_REVEALS[t.id])return next(s,INTERIOR_REVEALS[t.id]);
 if(m.id==='finale'&&t.id==='finale-home')return next(s,'Mara and Sal hear the ward come back room by room. The routes you reopened are now the fastest way home.');
 return next(s,'Done.');
}
function strikeEnemy(s,e,r,api){if(e.role==='Shield'&&!e.stun&&!behind(s,e)){r.combo=0;api.say(s,'Shield held. Counter, pulse, or attack from behind.');return;}e.hp--;e.stun=.7;e.phase=e.hp?'stunned':'disabled';r.combo++;r.bestCombo=Math.max(r.bestCombo,r.combo);api.say(s,e.hp?'Strike landed. Keep the flow moving.':'Sentry disabled.');}
function aimScore(s,e,ray){const o=ray?.origin||eye(s),d=ray?.direction||{x:-Math.sin(s.yaw||0),y:0,z:-Math.cos(s.yaw||0)},v={x:e.x-o.x,y:e.y+1-o.y,z:e.z-o.z},n=Math.hypot(v.x,v.y,v.z)*Math.hypot(d.x,d.y,d.z);return n?(v.x*d.x+v.y*d.y+v.z*d.z)/n:-1;}
export function campaignAction(s,name,api,ray){const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===c.active),kitUnlocked=watchState(s).stage===4||c.completed.length>0;const r=campaignRuntime(s);
 if(name==='scan'&&m){r.focus=!r.focus;api.say(s,r.focus?'Neighborhood Focus on. City systems, patrol states and useful infrastructure are highlighted in the world.':'Neighborhood Focus off.');return true;}
 if(name==='interact'&&m&&r.focus){const node=nearbySystem(s,m,r,api);if(node)return useSystem(s,m,r,node,api);}
 if(name.startsWith('holster-')&&kitUnlocked){const tool=name.slice(8);if(!['grapple','pulse','smoke','cape'].includes(tool))return false;r.selected=tool;r.holsterDraws++;api.say(s,tool==='cape'?'Cape rig ready.':'Drew '+tool+' from the body holster.');return true;}
 if(name==='tool-cycle'&&kitUnlocked){r.selected=['grapple','pulse','smoke','cape'][(['grapple','pulse','smoke','cape'].indexOf(r.selected)+1)%4];api.say(s,'Campaign tool: '+r.selected+'.');return true;}
 if(!m)return false;
 if(name==='campaign-route'){c.route=c.route==='stealth'?'combat':'stealth';if(m.id==='finale'&&(c.progress.finale||0)===1){r.enemies=(patrols.finale||[]).map(makeEnemy);if(c.route==='combat')for(const [i,e]of r.enemies.entries()){e.y=0;e.x=5+i*1.2;e.z=7+(i%2)*2;e.home=[e.x,e.z];e.route=[[e.x,e.z],[e.x+1.3,e.z]];}}api.say(s,'Final approach: '+c.route+'. You can change it without losing progress.');return true;}
 if(name==='smoke'||name==='tool'&&r.selected==='smoke'){if(r.smokeCooldown)return true;r.smoke=4;r.smokeCooldown=10;api.say(s,'Smoke out. Break sight, reposition, or move to a takedown angle.');return true;}
 if(name==='pulse'||name==='tool'&&r.selected==='pulse'){if(r.pulseCooldown)return true;const e=r.enemies.filter(e=>e.hp>0&&distance(s,e)<8&&visible(s,e,api)&&(!ray||aimScore(s,e,ray)>.2)).sort((a,b)=>ray?aimScore(s,b,ray)-aimScore(s,a,ray):distance(s,a)-distance(s,b))[0];if(!e){api.say(s,'No active security target in pulse range.');return true;}r.pulseCooldown=3;e.stun=2;e.phase='stunned';api.say(s,'Pulse staggered '+e.role+'.');return true;}
 if(name==='interact'&&(m.id==='predator'||m.id==='finale')){const candidates=r.enemies.filter(e=>{const h=Math.hypot(s.x-e.x,s.z-e.z),drop=s.y>e.y+2&&h<2.5,closeGround=Math.abs(s.y-e.y)<1.4&&h<1.7;return e.hp>0&&(drop||closeGround)&&visible(s,e,api);});const e=candidates.sort((a,b)=>distance(s,a)-distance(s,b))[0];if(e&&(behind(s,e)||s.y>e.y+2)){e.hp=0;e.phase='disabled';if(s.y>e.y+2)r.dropTakedowns++;else r.takedowns++;r.combo++;api.say(s,s.y>e.y+2?'Drop takedown. Stay above the remaining patrols.':'Silent takedown. Patrol gap created.');return true;}}
 if(name==='strike'&&(m.id==='freeflow'||m.id==='finale')){if(r.strikeCooldown||r.lunge)return true;const e=r.enemies.filter(e=>e.hp>0&&distance(s,e)<5.2&&Math.abs(s.y-e.y)<1.2&&visible(s,e,api)&&aimScore(s,e,ray)>.15).sort((a,b)=>distance(s,a)-distance(s,b))[0];if(!e){api.say(s,'No target in the freeflow lane. Reposition instead of swinging at empty space.');return true;}const d=distance(s,e);r.strikeCooldown=.34;if(d>2.25){const L=Math.hypot(e.x-s.x,e.z-s.z),to={x:e.x-(e.x-s.x)/(L||1)*1.25,y:e.y,z:e.z-(e.z-s.z)/(L||1)*1.25};if(!api.lineClear(s,eye(s),{x:to.x,y:to.y+1,z:to.z})){api.say(s,'No safe lunge lane. Use the route or close normally.');return true;}r.lunge={from:{x:s.x,y:s.y,z:s.z},to,target:e,t:0};api.say(s,'Freeflow lunge.');return true;}strikeEnemy(s,e,r,api);return true;}
 return false;
}
export function campaignBlocks(s,x,y,z){const r=campaignRuntime(s);return r.enemies.some(e=>e.hp>0&&Math.abs(y-e.y)<1.6&&Math.hypot(x-e.x,z-e.z)<.58);}
export function advanceCampaign(s,input,dt,api){const c=campaignState(s),m=CAMPAIGN_CASES.find(x=>x.id===c.active);if(!m)return false;const r=campaignRuntime(s);if(input.guard&&!r.guard)r.guardWindow=.5;r.guard=!!input.guard;for(const k of ['smoke','smokeCooldown','pulseCooldown','strikeCooldown','guardWindow'])r[k]=Math.max(0,r[k]-dt);
 if(r.lunge){const l=r.lunge;l.t=Math.min(1,l.t+dt/.22);const q=l.t*l.t*(3-2*l.t),x=l.from.x+(l.to.x-l.from.x)*q,z=l.from.z+(l.to.z-l.from.z)*q;if(api.blocked(s,x,l.to.y,z)){r.lunge=null;api.say(s,'Lunge lane closed. Recovered before the obstruction.');return true;}s.x=x;s.y=l.to.y;s.z=z;s.vx=s.vy=s.vz=s.speed=0;if(l.t===1){strikeEnemy(s,l.target,r,api);r.lunge=null;}return true;}
 if(input.glide&&campaignCanGlide(s)&&s.ride==='foot'){r.glideSeconds+=dt;if(s.y>1.0){s.vy=Math.max(s.vy-3.2*dt,-1.15);const speed=5.6;s.vx=-Math.sin(s.yaw)*speed;s.vz=-Math.cos(s.yaw)*speed;}}
 if(m.id==='flight'&&(c.progress.flight||0)===3&&r.glideSeconds>.25){const landing=m.steps.find(t=>t.id==='flight-land');if(Math.hypot(s.x-landing.x,s.z-landing.z)<2.5){const sf=api.support(s,s.x,s.z,s.y),ground=sf?api.floorHeight(sf,s.z):-99;if(Math.abs(s.y-ground)<.36&&Math.abs(s.y-landing.y)<.36&&s.vy<=0)r.glideLanded=true;}}
 if(!r.enemies.length)return false;
 let attacker=r.enemies.find(e=>e.phase==='windup'&&e.hp>0);for(const e of r.enemies){if(e.hp<=0)continue;e.stun=Math.max(0,e.stun-dt);e.timer+=dt;if(e.stun){e.phase='stunned';continue;}
  if(e.distract>0&&e.distractPoint){e.distract=Math.max(0,e.distract-dt);const dx=e.distractPoint.x-e.x,dz=e.distractPoint.z-e.z,L=Math.hypot(dx,dz);if(L>.2){const step=Math.min(L,dt*1.05),x=e.x+dx/L*step,z=e.z+dz/L*step;if(enemyStepClear(s,e,x,z,api)){e.x=x;e.z=z;e.yaw=Math.atan2(dx,dz);}}e.awareness=0;e.phase=e.distract>0?'investigate':'search';continue;}
  const dx=s.x-e.x,dz=s.z-e.z,d=Math.hypot(dx,dz),toPlayer=Math.atan2(dx,dz),facing=Math.cos(toPlayer-e.yaw),seen=d<8&&Math.abs(s.y-e.y)<1.3&&!r.smoke&&facing>.25&&visible(s,e,api);e.awareness=Math.max(0,Math.min(1.2,e.awareness+(seen?dt*1.2:-dt*.55)));r.alertPeak=Math.max(r.alertPeak,e.awareness);
  if(m.id==='predator'&&e.awareness<1){const p=e.route[e.routeIndex%e.route.length],px=p[0]-e.x,pz=p[1]-e.z,L=Math.hypot(px,pz);if(L<.18)e.routeIndex++;else{const step=Math.min(L,dt*.7);const x=e.x+px/L*step,z=e.z+pz/L*step;if(enemyStepClear(s,e,x,z,api)){e.x=x;e.z=z;}else e.routeIndex++;e.yaw=Math.atan2(px,pz);}e.phase=e.awareness>.35?'suspicious':'patrol';continue;}
  if(e.phase==='windup'){if(input.guard&&r.guardWindow>0&&e.timer>.22&&e.timer<1.05){e.phase='stunned';e.stun=1.45;e.timer=0;r.guardWindow=0;r.counters++;r.combo++;r.bestCombo=Math.max(r.bestCombo,r.combo);api.say(s,'Counter opening. Lunge or strike the next target.');continue;}if(e.timer>=1.05){e.phase='recover';e.timer=0;if(d<2.1&&!input.guard){r.combo=0;api.say(s,'Hit absorbed by the suit. Break the line or counter the blue cue.');}continue;}}
  if(e.phase==='recover'&&e.timer<.75)continue;if(d>1.7){const step=Math.min(dt*(e.role==='Brute'?.85:1.25),d-1.5),nx=e.x+dx/d*step,nz=e.z+dz/d*step;if(enemyStepClear(s,e,nx,nz,api)){e.x=nx;e.z=nz;e.yaw=toPlayer;}e.phase='pursue';}else if(!attacker){e.phase='windup';e.timer=0;attacker=e;}
 }
 if((m.id==='predator'||m.id==='freeflow'||m.id==='finale')&&r.enemies.length&&r.enemies.every(e=>e.hp<=0)){const n=c.progress[m.id]||0,t=m.steps[n];if(t&&(t.kind==='clear'||t.kind==='combat'||t.kind==='choice')){c.progress[m.id]=n+1;if(m.id==='freeflow'&&n===1){r.enemies=[{id:'loft-a',role:'Scout',home:[12,-1],route:[[12,-1],[16,-1]]},{id:'loft-b',role:'Shield',home:[16,1],route:[[16,1],[12,1]]},{id:'loft-c',role:'Brute',home:[18,-2],route:[[18,-2],[15,-3]]}].map(e=>({...makeEnemy(e),y:4.4}));}else r.enemies=[];api.say(s,'Encounter cleared. '+(campaignTarget(s)?.label||'Return to your contact.'));}}
 return false;
}
export function campaignInspect(s){const c=campaignState(s),r=campaignRuntime(s);return {progress:{...c},selected:r.selected,focus:r.focus,systemsUsed:[...r.systemsUsed],systemUses:r.systemUses,activeSystems:CAMPAIGN_SYSTEMS.filter(n=>n.cases.includes(c.active)).map(n=>n.id),glideSeconds:r.glideSeconds,glideLanded:r.glideLanded,takedowns:r.takedowns,dropTakedowns:r.dropTakedowns,counters:r.counters,bestCombo:r.bestCombo,alertPeak:r.alertPeak,holsterDraws:r.holsterDraws,enemies:r.enemies.map(e=>({...e,distractPoint:e.distractPoint?{...e.distractPoint}:null,route:e.route.map(p=>[...p])}))};}
