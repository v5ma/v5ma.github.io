/* Leonardo’s Guild / first Renaissance commission. Deterministic, renderer-independent simulation.
 * Coordinates are metres; fixed-step driver calls step() at 60 Hz. All mechanisms
 * is fictional world-state interaction; no network or account APIs are used. */
export const VERSION='0.1.0';
export const SAVE_KEY='svgn.leonardos-guild.v1';
export const LIMITS={x:148,zMin:-26,zMax:406};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const heightAt=(x,z)=>20-z*.035+Math.cos(x*.014)*1.5+Math.sin(z*.018)*.6;
export const headingVector=yaw=>({x:Math.sin(yaw),z:Math.cos(yaw)});
export function district(p){return p.z<130?'Vinci Heights':p.z<270?'Artisans’ Market':'Arno Outskirts';}
export function makeWorld(){
 const houses=[],colliders=[],mailboxes=[],trees=[];let id=0;
 const rows=[24,61,98,178,215,293,331,374];
 for(const road of [-80,0,80])for(const side of[-1,1])for(const z of rows){
  if(road===0&&side===1&&z>=178&&z<=215||road===80&&side===1&&z===331)continue;
  const x=road+side*24.5,kind=id%5;
  houses.push({id:'home-'+id,x,z,side,kind,road,w:12+(kind%2)*2,d:14});
  colliders.push({id:'home-'+id,x,z,hx:6.2+(kind%2),hz:7.4});
  mailboxes.push({id:'mail-'+id,x:road+side*9.1,z:z-2,y:heightAt(road+side*9.1,z-2)+1.15,side,home:id,route:road===0&&z<130});
  trees.push({x:road+side*11.8,z:z+10,seed:id});id++;
 }
 for(let z=0;z<405;z+=27)for(const x of[-128,128])trees.push({x,z,seed:100+z+x});
 const props=[];
 for(const [x,z,type]of [[4,74,'bin'],[-4.8,112,'cone'],[4.4,204,'cone'],[-84,181,'bin'],[84,315,'bin']]){props.push({x,z,type});colliders.push({id:type+x+z,x,z,hx:.5,hz:.5,low:true});}
 const gates=[{id:'garden-gate',x:40,z:240,hx:.55,hz:6}];
 const nodes=[{id:'relay',type:'relay',name:'Bridge waterwheel',x:11.3,z:190,range:9},{id:'signals',type:'signals',name:'Market bell',x:-10,z:139,range:16}];
 const depot={x:-10,z:2},garage={x:4.3,z:228},newsroom={x:80,z:356};
 colliders.push({id:'kiosk',x:-15,z:1,hx:3.3,hz:3.3},{id:'newsroom',x:107,z:351,hx:12,hz:12});
 const shop={x:11,z:170},bandit={x:80,z:330};
 return {shop,bandit,houses,colliders,mailboxes,trees,props,gates,nodes,depot,garage,newsroom,roads:[-80,0,80],crossings:[140,240,340]};
}
export function newState(saved=null){
 const s={time:0,steps:0,mode:'bike',x:2,z:-6,yaw:0,speed:0,lift:0,vy:0,health:100,inv:0,papers:20,credits:0,score:0,deliveries:new Set(),mission:0,relay:false,scan:0,scanCD:0,signalHold:0,hackProgress:0,trace:0,completed:false,clock:0,throwCD:0,toast:'',toastT:0,events:[],shots:[],collisions:0,folio:false,defeated:false,upgraded:false,attackCD:0,attackT:0,guarding:false,banditHP:100,banditWindup:0,banditCooldown:1,banditPhase:'idle',vehicle:{bike:{x:2,z:-6,yaw:0},car:{x:4.3,z:228,yaw:0}},pedestrians:[],traffic:[],distance:0};
 for(let i=0;i<18;i++)s.pedestrians.push({id:i,x:(i%3-1)*80+(i%2?10.8:-10.8),z:30+i*19%340,yaw:i%2?0:Math.PI,phase:i*1.3});
 for(let i=0;i<7;i++)s.traffic.push({id:i,x:(i%3-1)*80+(i%2?3.1:-3.1),z:45+i*53%345,dir:i%2?1:-1,speed:0});
 if(saved){for(const k of ['credits','score','relay','completed','folio','defeated','upgraded'])s[k]=saved[k];s.deliveries=new Set(saved.deliveries);s.banditHP=s.defeated?0:100;s.mission=s.completed?4:s.folio?3:s.relay&&s.deliveries.size>=4?2:s.deliveries.size>=4?1:0;}
 return s;
}
export function readSave(raw,world){
 try{if(!raw||raw.length>12000)return null;const v=JSON.parse(raw),ids=new Set(world.mailboxes.map(b=>b.id));if(v.version!==2||!Number.isInteger(v.credits)||v.credits<0||v.credits>10000000||!Number.isInteger(v.score)||v.score<0||v.score>10000000||!Array.isArray(v.deliveries)||v.deliveries.length>64||!v.deliveries.every(id=>ids.has(id))||typeof v.relay!=='boolean'||typeof v.completed!=='boolean'||!['folio','defeated','upgraded'].every(k=>typeof v[k]==='boolean')||v.folio&&!v.defeated||v.completed&&!v.folio)return null;return {...v,deliveries:[...new Set(v.deliveries)]};}catch{return null;}
}
export function saveData(s){return {version:2,folio:s.folio,defeated:s.defeated,upgraded:s.upgraded,credits:Math.floor(s.credits),score:Math.floor(s.score),deliveries:[...s.deliveries],relay:s.relay,completed:s.completed};}
export function tell(s,text){s.toast=text;s.toastT=4;}
function event(s,type,data={}){s.events.push({type,step:s.steps,...data});if(s.events.length>160)s.events.shift();}
export function activeTarget(s,w){
 if(s.mission===0){let targets=w.mailboxes.filter(b=>b.route&&!s.deliveries.has(b.id));if(!targets.length)targets=w.mailboxes.filter(b=>!s.deliveries.has(b.id));return targets.sort((a,b)=>distance(a,s)-distance(b,s))[0]||w.depot;}
 if(s.mission===1)return w.nodes[0];if(s.mission===2)return s.defeated?w.newsroom:w.bandit;return w.depot;
}
export function missionText(s){return [
 {tag:'01 / THE MASTER’S LETTERS',title:'An apprentice’s first ride.',text:`Leonardo needs four sealed plans delivered. ${Math.min(s.deliveries.size,4)}/4 complete. Q throws left; C throws right. Follow the gold markers.`},
 {tag:'02 / THE WATERWORKS',title:'Ingenio opens the way.',text:'Ride to the market waterwheel. X inspects mechanisms. Stop and hold H to restore the bridge. A merchant nearby trades useful supplies.'},
 {tag:'03 / THE STOLEN FOLIO',title:'A sketch worth defending.',text:s.defeated?'The guard has yielded. Reach the gold marker by the archive and press H to recover Leonardo’s folio.':'A folio thief waits by the Arno road. Dismount with F. J swings your staff; hold K to brace. You can always retreat and recover at the workshop.'},
 {tag:'04 / RETURN TO LEONARDO',title:'Bring the discovery home.',text:'Ride back to Leonardo’s workshop on the hillside. Stop inside its gold marker and press H to return the recovered folio.'},
 {tag:'FIRST COMMISSION / COMPLETE',title:'Welcome to the guild.',text:'The first assignment is complete. Your progress is saved on this device. Explore, trade at the market, try the pedal carriage, or deliver more letters. Shared multiplayer is a future chapter.'}
 ][s.mission];}
function circleBox(x,z,r,b){return Math.hypot(x-clamp(x,b.x-b.hx,b.x+b.hx),z-clamp(z,b.z-b.hz,b.z+b.hz))<r;}
export function blocked(x,z,r,w,s,ignoreTraffic=false){
 if(x<-LIMITS.x+r||x>LIMITS.x-r||z<LIMITS.zMin+r||z>LIMITS.zMax-r)return true;
 for(const b of w.colliders)if(!(b.low&&s.lift>.9)&&circleBox(x,z,r,b))return true;
 if(!s.relay&&w.gates.some(b=>circleBox(x,z,r,b)))return true;
 if(s.mode!=='car'&&circleBox(x,z,r,{...s.vehicle.car,hx:1,hz:2.1}))return true;
 if(!ignoreTraffic&&s.traffic.some(c=>Math.hypot(x-c.x,z-c.z)<r+1.35))return true;
 return false;
}
function segmentSphere(a,b,c,r){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=dx*dx+dy*dy+dz*dz,f=clamp(((c.x-a.x)*dx+(c.y-a.y)*dy+(c.z-a.z)*dz)/(l||1),0,1);return Math.hypot(a.x+dx*f-c.x,a.y+dy*f-c.y,a.z+dz*f-c.z)<=r;}
export function throwPaper(s,w,side){
 if(s.throwCD>0)return false;if(!s.papers){tell(s,'Out of letters. Return to Leonardo’s workshop, or trade at the market.');return false;}
 const forward=headingVector(s.yaw),left={x:forward.z,z:-forward.x};
 const targets=w.mailboxes.filter(b=>!s.deliveries.has(b.id)&&distance(b,s)<28&&((b.x-s.x)*left.x+(b.z-s.z)*left.z)*side>1);
 targets.sort((a,b)=>distance(a,s)-distance(b,s));const target=targets[0];
 const start={x:s.x,y:heightAt(s.x,s.z)+(s.mode==='car'?1.25:1.5)+s.lift,z:s.z};let vx,vz,vy;
 if(target){const t=clamp(distance(s,target)/22,.28,1.1);vx=(target.x-start.x)/t;vz=(target.z-start.z)/t;vy=(target.y-start.y+4.9*t*t)/t;}else{vx=left.x*side*16+forward.x*s.speed*.4;vz=left.z*side*16+forward.z*s.speed*.4;vy=3.8;}
 s.shots.push({...start,vx,vy,vz,life:2.7});s.papers--;s.throwCD=.32;event(s,'throw',{side,target:target?.id||null});return true;
}
export function scan(s){if(s.scanCD>0)return false;s.scan=7;s.scanCD=2;event(s,'scan');tell(s,'INGENIO / nearby mechanisms revealed. Stop and hold H to operate.');return true;}
export function nearestNode(s,w){return w.nodes.filter(n=>distance(s,n)<=n.range).sort((a,b)=>distance(s,a)-distance(s,b))[0]||null;}
export function enterExit(s,w){
 if(Math.abs(s.speed)>2){tell(s,'Slow down before getting off.');return false;}
 if(s.mode!=='foot'){
  const v=s.vehicle[s.mode];Object.assign(v,{x:s.x,z:s.z,yaw:s.yaw});
  const f=headingVector(s.yaw),before=s.mode;s.mode='foot';s.speed=0;s.lift=0;
  for(const sign of[-1,1]){const x=s.x+f.z*sign*2.7,z=s.z-f.x*sign*2.7;if(!blocked(x,z,.35,w,s)){s.x=x;s.z=z;event(s,'exit',{vehicle:before});tell(s,'On foot. F beside your bicycle or pedal carriage mounts it.');return true;}}
  s.mode=before;tell(s,'No safe space to dismount here.');return false;
 }
 const entries=Object.entries(s.vehicle).filter(([,v])=>distance(s,v)<5).sort((a,b)=>distance(s,a[1])-distance(s,b[1]));
 if(entries.length){const [mode,v]=entries[0];s.mode=mode;s.x=v.x;s.z=v.z;s.yaw=v.yaw;s.speed=0;s.lift=0;event(s,'enter',{vehicle:mode});tell(s,mode==='car'?'Experimental pedal carriage / W accelerates. Space is the brake.':'Back on the bicycle.');return true;}
 if(distance(s,w.depot)<10){refill(s);return true;}
 tell(s,'Walk beside your bicycle or Leonardo’s pedal carriage to mount.');return false;
}
export function refill(s){s.papers=20;s.health=100;tell(s,'Fresh letters, restored health and a repaired invention.');event(s,'refill');}
export function recover(s){s.mode='bike';s.x=2;s.z=-6;s.yaw=0;s.speed=0;s.lift=s.vy=0;s.vehicle.bike={x:2,z:-6,yaw:0};refill(s);event(s,'recover');}
function move(s,w,dx,dz){const r=s.mode==='car'?1.22:s.mode==='bike'?.5:.33,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.4));let hit=false;
 for(let k=0;k<n;k++){if(!blocked(s.x+dx/n,s.z,r,w,s))s.x+=dx/n;else hit=true;if(!blocked(s.x,s.z+dz/n,r,w,s))s.z+=dz/n;else hit=true;}
 if(hit){if(s.inv<=0&&Math.abs(s.speed)>4){s.health=Math.max(0,s.health-12);s.inv=1.8;s.collisions++;s.trace=Math.min(1,s.trace+.12);event(s,'collision');tell(s,'Mind the corners. The workshop can repair your invention.');}s.speed*=.45;}
 if(s.health<=0){recover(s);tell(s,'Back at the workshop. Your completed commissions were kept.');}
}
function traffic(s,dt){for(const car of s.traffic){const next=car.z+(car.dir>0?14:-14),nearSignal=Math.abs(next-140)<12||Math.abs(next-340)<12,red=Math.floor(s.time/8)%2===1&&s.signalHold<=0;const leader=s.traffic.some(other=>other!==car&&Math.abs(other.x-car.x)<1.5&&(other.z-car.z)*car.dir>0&&(other.z-car.z)*car.dir<11);car.speed+=( (nearSignal&&red||leader?0:5.5)-car.speed)*Math.min(1,dt*2.5);car.z+=car.dir*car.speed*dt;if(car.z>398)car.z=-18;if(car.z< -20)car.z=396;}}
export function step(s,w,input,dt){
 if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('step expects dt in (0, 0.05]');s.time+=dt;s.steps++;
 for(const k of['inv','throwCD','scan','scanCD','signalHold','toastT'])s[k]=Math.max(0,s[k]-dt);s.trace=Math.max(0,s.trace-dt*.013);
 const throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1),old={x:s.x,z:s.z};
 if(s.mode==='foot'){
  s.yaw-=steer*2.6*dt;s.speed+=(throttle*(input.boost?7:4.6)-s.speed)*Math.min(1,dt*12);
 }else{
  const car=s.mode==='car',top=car?29:input.boost?18:13,acc=car?9:6;
  if(throttle)s.speed+=throttle*(s.speed*throttle<0?15:acc)*dt;else s.speed*=Math.exp(-dt*(car?.6:.8));
  if(input.brake)s.speed*=Math.exp(-dt*(car?3.5:5));
  s.speed=clamp(s.speed,car?-9:-4,top);s.yaw-=steer*(car?1.2:1.7)*clamp(Math.abs(s.speed)/5,0,1.2)*Math.sign(s.speed||1)*dt;
 }
 const f=headingVector(s.yaw);move(s,w,f.x*s.speed*dt,f.z*s.speed*dt);s.distance+=distance(old,s);
 if(input.jump&&s.mode!=='car'&&s.lift===0){s.vy=s.mode==='bike'?4.4:5;event(s,'jump');}
 if(s.lift>0||s.vy>0){s.vy-=12*dt;s.lift=Math.max(0,s.lift+s.vy*dt);if(s.lift===0)s.vy=0;}
 if(s.mode!=='foot')Object.assign(s.vehicle[s.mode],{x:s.x,z:s.z,yaw:s.yaw});
 if(input.leftPaper)throwPaper(s,w,1);if(input.rightPaper)throwPaper(s,w,-1);
 const node=nearestNode(s,w);
 if(input.hack&&s.scan>0&&node&&Math.abs(s.speed)<1.7){
  if(node.type==='relay'&&s.relay){s.hackProgress=0;}else{s.hackProgress+=dt/2.2;if(s.hackProgress>=1){s.hackProgress=0;s.trace=clamp(s.trace+.24,0,1);if(node.type==='relay'){s.relay=true;s.credits+=150;s.score+=300;event(s,'relay');tell(s,'The waterwheel turns! Bridge open. Follow the Arno road to recover the folio.');}else{s.signalHold=12;event(s,'signals');tell(s,'The market bell clears the wagon crossing for twelve seconds.');}}}
 }else s.hackProgress=Math.max(0,s.hackProgress-dt*2);
 for(const p of s.shots){const old={x:p.x,y:p.y,z:p.z};p.vy-=9.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.life-=dt;
  const hit=w.mailboxes.find(b=>!s.deliveries.has(b.id)&&segmentSphere(old,p,b,1));
  if(hit){s.deliveries.add(hit.id);s.credits+=25;s.score+=100;p.life=0;event(s,'delivery',{id:hit.id});tell(s,'Delivered! +100 reputation / +25 florins');}
  if(p.y<heightAt(p.x,p.z)+.08||w.colliders.some(b=>Math.abs(p.x-b.x)<b.hx&&Math.abs(p.z-b.z)<b.hz&&p.y<heightAt(b.x,b.z)+5))p.life=0;
 }
 s.shots=s.shots.filter(p=>p.life>0);
 if(s.deliveries.size>=4&&s.mission===0){s.mission=s.relay?2:1;event(s,'chapter',{chapter:s.mission});tell(s,'Four plans delivered. Restore the market bridge, then follow the stolen folio.');}
 if(s.relay&&s.mission===1){s.mission=2;event(s,'chapter',{chapter:2});}
 if(input.hack&&Math.abs(s.speed)<1.7){
  if(s.mission===2&&s.defeated&&distance(s,w.newsroom)<8){s.folio=true;s.mission=3;event(s,'folio');tell(s,'The folio is safe. Return it to Leonardo at the workshop.');}
  else if(s.mission===3&&distance(s,w.depot)<8){s.completed=true;s.mission=4;s.score+=500;s.credits+=200;event(s,'complete');tell(s,'COMMISSION COMPLETE / Leonardo welcomes you to the guild.');}
 }
 combatStep(s,w,input,dt);
 if(distance(s,w.depot)<8&&Math.abs(s.speed)<1&&input.hack&&s.toastT<1){refill(s);}
 traffic(s,dt);
 for(const p of s.pedestrians){const away=distance(p,s)<3&&Math.abs(s.speed)>2;const dir=p.id%2?1:-1;p.z+=dir*dt*(away?3.3:1.1);p.phase+=dt*(away?10:3);if(p.z>397)p.z=5;if(p.z<2)p.z=395;}
}

// Local, bounded single-player interaction. No account, payment or network calls.
export function trade(s,w,item){
 if(distance(s,w.shop)>7||Math.abs(s.speed)>1.7){tell(s,'Stop beside the market stall to trade.');return false;}
 const prices={supplies:20,staff:45};const cost=prices[item];if(!cost||item==='staff'&&s.upgraded){tell(s,'That commission is not available.');return false;}
 if(s.credits<cost){tell(s,`You need ${cost} florins. Deliver more letters first.`);return false;}
 s.credits-=cost;if(item==='supplies'){s.health=100;s.papers=20;}else s.upgraded=true;
 event(s,'trade',{item,cost});tell(s,item==='supplies'?'Supplies purchased: health and letters restored.':'The smith reinforces your staff.');return true;
}
export function attack(s,w){
 if(s.mode!=='foot'){tell(s,'Dismount with F to use your staff.');return false;}
 if(s.attackCD>0)return false;s.attackCD=.6;s.attackT=.25;event(s,'swing');
 if(!s.defeated&&distance(s,w.bandit)<3.5){s.banditHP=Math.max(0,s.banditHP-(s.upgraded?50:34));event(s,'hit');
  if(s.banditHP===0){s.defeated=true;s.banditPhase='yielded';s.banditWindup=0;s.score+=150;event(s,'duel-won');tell(s,'The guard yields. Retrieve the folio beyond the crossing.');}
  else tell(s,'Good strike. Brace with K when the guard raises his staff.');return true;
 }return false;
}
function combatStep(s,w,input,dt){
 s.attackCD=Math.max(0,s.attackCD-dt);s.attackT=Math.max(0,s.attackT-dt);s.guarding=!!input.guard&&s.mode==='foot';
 if(s.defeated)return;const near=distance(s,w.bandit);s.banditCooldown=Math.max(0,s.banditCooldown-dt);
 if(near>5||s.mode!=='foot'){s.banditWindup=0;s.banditPhase='idle';return;}
 if(s.banditWindup>0){s.banditPhase='windup';s.banditWindup-=dt;if(s.banditWindup<=0){if(near<3.8&&s.inv<=0){const harm=s.guarding?2:12;s.health=Math.max(0,s.health-harm);s.inv=.65;event(s,s.guarding?'blocked-hit':'duel-hit');tell(s,s.guarding?'Braced! Counter with J.':'Guard’s strike. Hold K to brace, or move away.');}s.banditCooldown=1.3;s.banditPhase='idle';if(s.health<=0){recover(s);tell(s,'Leonardo tends your wounds. Your deliveries and discoveries remain.');}}}
 else if(s.banditCooldown===0&&near<3.8){s.banditWindup=.85;s.banditPhase='windup';}
}
