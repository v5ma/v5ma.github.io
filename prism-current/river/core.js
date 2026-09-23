/* River Prism 1: authored beat waves, swept cuts, aimed shots, oriented shields.
   Pure gameplay module. No renderer, storage, clock mutation, or remote service. */
(function(root){'use strict';
 const D=typeof module!=='undefined'&&module.exports?require('./difficulty'):root.PrismDifficulty;
 const BPM=132,BEAT=60/BPM,DURATION=196*BEAT,BOSS_BEAT=152,KEY='prism-current.river.chromatic.records.v1',PACING_KEY='prism-current.river.pacing.records.v1',LEGACY_KEY='prism-current.river.records.v1';
 const PALETTES=Object.freeze([Object.freeze({name:'MINT',symbol:'O',color:0x73ffd7,css:'#73ffd7'}),Object.freeze({name:'ROSE',symbol:'<>',color:0xff99c0,css:'#ff99c0'})]);
 const MATCH_BONUS=40;
 const DIRS=[[0,-1],[0,1],[-1,0],[1,0],[-.707,-.707],[.707,-.707],[-.707,.707],[.707,.707]];
 const PHASES=[{name:'Duck Armada',cue:'Slice the fruit. Shoot the catapult ducks before they fire.',level:-.18,beat:0},{name:'Toyboat Rapids',cue:'Cut or shoot the purple blocks. Mint health boxes restore HEALTH.',level:.22,beat:64},{name:'High Tide Airshow',cue:'Planes launch fruit and blocks. Cut, shoot or shield the blocks.',level:.64,beat:112},{name:'Admiral Quack',cue:'Admiral Quack arrives! Shoot the glowing engine after his entrance.',level:.38,beat:152}];
 const SPACE=[{name:'First Contact',cue:'Triggers fire saber lasers. Shoot the small ships.',level:-.18,beat:0},{name:'Interceptor Swarm',cue:'Escorts toss fruit and cuttable blocks. Cut, shoot or shield them.',level:.22,beat:64},{name:'Final Approach',cue:'Gather health supplies. The mothership arrives in the final phrase.',level:.64,beat:112},{name:'Mothership Core',cue:'The glowing core is open. Keep shooting, slicing and shielding.',level:.38,beat:152}];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
 const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),length=a=>Math.hypot(...a),norm=a=>scale(a,1/(length(a)||1)),lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 function segment(p,a,b){const v=sub(b,a),d=dot(v,v);return length(sub(p,add(a,scale(v,d?clamp(dot(sub(p,a),v)/d,0,1):0))));}
 function raySphere(o,d,p,r){const v=sub(p,o),b=dot(v,d),q=b*b-dot(v,v)+r*r;if(q<0||b+Math.sqrt(q)<0)return Infinity;return Math.max(0,b-Math.sqrt(q));}
 function phase(chapter,time){const a=chapter==='mothership'?SPACE:PHASES;let i=0;while(i<3&&time>=a[i+1].beat*BEAT)i++;return {...a[i],index:i};}
 function water(chapter,time){const p=phase(chapter,time),a=chapter==='mothership'?SPACE:PHASES;if(!p.index)return p.level;const k=clamp((time-p.beat*BEAT)/(4*BEAT),0,1),smooth=k*k*(3-2*k);return a[p.index-1].level+(p.level-a[p.index-1].level)*smooth;}
 function plan(chapter,difficulty='easy'){
  if(!['duck-armada','mothership'].includes(chapter))throw Error('Unknown chapter');
  const profile=D.get(difficulty),out=[];let seq=0;
  const push=(type,beat,extra={})=>out.push({type,at:beat*BEAT,seq:seq++,...extra});
  for(let beat=8,i=0;beat<184;beat+=profile.itemStep,i++){
   push('fruit',beat,{x:i%2?.50:-.50,y:[1.12,1.52,1.30,1.68][i%4],hand:i%2,dir:i%8,travel:profile.travelBeats*BEAT});
  }
  for(let beat=12,i=0;beat<144;beat+=profile.enemyStep,i++){
   const type=chapter==='mothership'?'fighter':beat<64?'catapult':beat<108?'boat':'plane';
   const count=['plane','fighter'].includes(type)?profile.formation:1;
   for(let j=0;j<count;j++)push(type,beat+j*2,{x:count===2?(j?1.55:-1.55):(i%2?1.55:-1.55),y:type==='plane'||type==='fighter'?2.05:.5,hand:(i+j)%2,life:profile.lifeBeats*BEAT});
  }
  if(profile.bombStep)for(let beat=64,i=0;beat<180;beat+=profile.bombStep,i++)push('bomb',beat+1,{x:i%2?.42:-.42,y:1.30,hand:i%2,travel:profile.travelBeats*BEAT});
  for(const [i,beat]of profile.healthBeats.entries())push('health',beat,{x:i%2?.42:-.42,y:1.25,travel:(profile.travelBeats+2)*BEAT,heal:profile.heal,hand:i%2});
  // A real final-phrase entrance. There is no offscreen/dormant boss at time zero.
  push('boss',BOSS_BEAT,{x:0,y:chapter==='mothership'?2.0:1.35,life:(196-BOSS_BEAT)*BEAT,hp:Math.round(profile.bossHP*(chapter==='mothership'?1.25:1)),hand:0});
  return out.sort((a,b)=>a.at-b.at||a.seq-b.seq);
 }
 function create(chapter='duck-armada',cruise=false,difficulty='easy'){
  difficulty=D.normalize(difficulty);
  const s={chapter,cruise,time:0,mode:'ready',duration:DURATION,health:100,maxHealth:100,score:0,combo:0,bestCombo:0,bladeColors:[0,1],entities:[],timeline:plan(chapter,difficulty),cursor:0,nextId:1,eventId:0,events:[],bossDefeated:false,lastShot:[-10,-10],lastSlice:[-10,-10],stats:{slices:0,shots:0,shotHits:0,blocks:0,reflects:0,dodges:0,misses:0,damage:0,bossDamage:0,pickups:0,healed:0,cutBlocks:0,colorMatches:0,colorBonus:0},body:[0,1.45,0]};
  // Menu preferences cannot relabel the encounter or the record it earns.
  Object.defineProperty(s,'difficulty',{value:difficulty,enumerable:true});
  return s;
 }
 function emit(s,type,data={}){s.events.push({id:++s.eventId,type,time:s.time,...data});if(s.events.length>100)s.events.shift();}
 function spawn(s,e){if(s.entities.length>=80)return null;const hp=e.hp||(['fruit','block','health','bomb','bolt'].includes(e.type)?1:e.type==='catapult'?4:e.type==='boat'?4:2),p=phase(s.chapter,e.at??s.time);const n={id:s.nextId++,...e,at:e.at??s.time,hp,maxHP:hp,r:e.type==='boss'?1.15:['fruit','block','health'].includes(e.type)?D.get(s.difficulty).hitRadius:e.type==='bomb'?.20:e.type==='bolt'?.12:.48,dead:false,volley:0};
  n.start=e.start||[e.x||0,e.type==='fruit'?(e.y||1.3)-.35:e.y||1.3,e.type==='fruit'?-9:e.type==='bomb'?-10:-15];
  if(['fruit','block','health','bomb','bolt'].includes(e.type)){n.end=e.end||[e.x||0,e.y||1.3,.6];n.travel=e.travel||6*BEAT;}
  if(e.type==='catapult'||e.type==='boat')n.y=water(s.chapter,n.at)+.6;
  s.entities.push(n);emit(s,'spawn',{entity:n.id,kind:n.type});if(n.type==='boss')emit(s,'boss-arrival',{entity:n.id,name:s.chapter==='mothership'?'Mothership':'Admiral Quack'});return n;}
 function position(s,n,time=s.time){const age=time-n.at;
  if(['fruit','block','health','bomb','bolt','return'].includes(n.type)){const f=clamp(age/n.travel,0,1.15),p=lerp(n.start,n.end,f);if(n.type==='fruit')p[1]+=Math.sin(clamp(f,0,1)*Math.PI)*.70;return p;}
  if(n.type==='boss'){const enter=clamp(age/(4*BEAT),0,1),ease=enter*enter*(3-2*enter);return [Math.sin(age*.30)*.45,n.y+(s.chapter==='mothership'?Math.sin(age*.5)*.12:0),-24+ease*(s.chapter==='mothership'?12:15)];}
  const f=clamp(age/n.life,0,1);return [n.x+Math.sin(age*.70+n.id)*.18,n.y+Math.sin(age*.9)*.07,-13+f*9];
 }
 function open(s,n){return n.type!=='boss'||s.time>=n.at+4*BEAT;}
 function cycleColor(s,hand){
  if(!s||s.mode!=='playing'||![0,1].includes(hand)||!Array.isArray(s.bladeColors))return false;
  s.bladeColors[hand]=1-s.bladeColors[hand];emit(s,'blade-color',{hand,color:s.bladeColors[hand]});return true;
 }
 function reward(s,value){s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);const points=Math.round(value*(1+Math.min(3,Math.floor(s.combo/8))*.25));s.score+=points;return points;}
 function kill(s,n,reason,p,hand){if(n.dead)return;n.dead=true;if(n.type==='boss')s.bossDefeated=true;
  const base=n.type==='boss'?2500:n.type==='fruit'?120:180;
  const matched=n.type==='fruit'&&reason==='slice'&&[0,1].includes(hand)&&s.bladeColors[hand]===(n.hand||0);
  // Award the exact previous base formula once, then an additive optional bonus.
  // A mismatch never invalidates a good cut or reduces its original reward.
  const basePoints=reward(s,base),bonusPoints=matched?Math.round(MATCH_BONUS*(1+Math.min(3,Math.floor(s.combo/8))*.25)):0;
  s.score+=bonusPoints;if(matched){s.stats.colorMatches++;s.stats.colorBonus+=bonusPoints;}
  emit(s,'destroy',{entity:n.id,kind:n.type,position:p,reason,hand:hand??n.hand??0,dir:n.dir||0,matched,basePoints,bonusPoints,points:basePoints+bonusPoints});
 }
 function heal(s,n,reason,p){
  if(n.dead)return false;n.dead=true;const amount=Math.min(n.heal||D.get(s.difficulty).heal,Math.max(0,(s.maxHealth||100)-s.health));
  s.health+=amount;s.stats.pickups++;s.stats.healed+=amount;reward(s,50);emit(s,'heal',{entity:n.id,position:p,amount,health:s.health,reason});return true;
 }
 function hurt(s,amount,p){s.combo=0;s.stats.damage+=amount;if(!s.cruise)s.health=Math.max(0,s.health-amount);emit(s,'damage',{position:p,amount});if(s.health===0){s.mode='failed';emit(s,'end');}}
 function damage(s,n,amount,reason,p,hand){if(n.type==='health')return heal(s,n,reason,p);if(!open(s,n)){emit(s,'armored',{position:p});return false;}n.hp-=amount;if(n.type==='boss')s.stats.bossDamage+=amount;if(n.hp<=0)kill(s,n,reason,p,hand);else emit(s,'hit',{position:p,kind:n.type});return true;}
 function shoot(s,hand,origin,direction){if(s.mode!=='playing'||![0,1].includes(hand)||!valid(origin)||!valid(direction)||s.time-s.lastShot[hand]<.18||length(direction)<.1)return false;
  s.lastShot[hand]=s.time;s.stats.shots++;const d=norm(direction);let target=null,best=40;
  for(const n of s.entities){if(n.dead||n.type==='return')continue;const r=raySphere(origin,d,position(s,n),n.r);if(r<best){best=r;target=n;}}
  emit(s,'laser',{hand,start:origin.slice(),end:add(origin,scale(d,best))});
  if(target){if(damage(s,target,1,'laser',position(s,target),hand))s.stats.shotHits++;return true;}return false;
 }
 function slice(s,hand,prior,pose,t0,t1){if(s.mode!=='playing'||![0,1].includes(hand)||!prior||!pose||![prior.a,prior.b,pose.a,pose.b].every(valid)||!Number.isFinite(t0)||!Number.isFinite(t1)||t1<=t0||t1-t0>.12)return 0;
  const movement=sub(pose.b,prior.b),speed=length(movement)/(t1-t0);if(speed<.45||speed>22)return 0;let count=0;
  for(const n of s.entities){if(s.mode!=='playing')break;if(n.dead||!['fruit','block','health','bomb','bolt'].includes(n.type))continue;const p=position(s,n),d=Math.min(segment(p,prior.a,pose.a),segment(p,prior.b,pose.b),segment(p,pose.a,pose.b),segment(p,prior.a,prior.b));if(d>n.r+.08)continue;
   if(n.type==='bomb'){n.dead=true;hurt(s,8,p);emit(s,'badcut',{position:p});continue;}
   if(n.type==='health'){heal(s,n,'slice',p);count++;continue;}
   if(n.type==='block'||n.type==='bolt'){s.stats.cutBlocks++;s.stats.slices++;kill(s,n,'slice',p,hand);count++;continue;}
   const dir=DIRS[n.dir]||DIRS[0],flat=Math.hypot(movement[0],movement[1]);if(D.get(s.difficulty).directionRequired&&(flat<.01||(movement[0]*dir[0]+movement[1]*dir[1])/flat<.25)){emit(s,'wrongcut',{position:p});continue;}
   s.stats.slices++;kill(s,n,'slice',p,hand);count++;
  }return count;
 }
 function shieldHit(s,n,a,b,shields){for(const h of shields||[]){if(!h.active||!valid(h.center)||!valid(h.normal)||segment(h.center,a,b)>.50+n.r||dot(sub(b,a),h.normal)>=0)continue;
   const perfect=s.time-h.raised>=0&&s.time-h.raised<.24;n.dead=true;s.stats.blocks++;if(perfect)s.stats.reflects++;reward(s,perfect?220:80);emit(s,'block',{position:b,hand:h.hand||0,perfect});
   const parent=s.entities.find(v=>v.id===n.parent&&!v.dead);if(parent)spawn(s,{type:'return',start:b,end:position(s,parent),travel:.5,parent:parent.id,power:perfect?3:1,hand:h.hand||0});return true;
  }return false;}
 function advance(s,time,body=s.body,shields=[]){if(s.mode!=='playing'||!Number.isFinite(time)||time<s.time)return;const before=s.time;s.time=Math.min(time,s.duration);s.body=valid(body)?body.slice():s.body;
  while(s.cursor<s.timeline.length&&s.timeline[s.cursor].at<=s.time)spawn(s,s.timeline[s.cursor++]);
  const list=s.entities.slice();for(const n of list){if(s.mode!=='playing')break;if(n.dead)continue;const age=s.time-n.at,p=position(s,n);
   if(['catapult','boat','plane','fighter','boss'].includes(n.type)){
    const profile=D.get(s.difficulty),interval=profile.volleyBeats*BEAT,first=(n.type==='boss'?6:3)*BEAT;
    // Residents make repeated readable throws. No red-bolt emitter remains.
    while(age>=first+n.volley*interval&&n.volley<20){
     const at=n.at+first+n.volley*interval;n.volley++;
     if(at>n.at+(n.type==='boss'?n.life:n.life-2*BEAT)||at+profile.travelBeats*BEAT>s.duration-.35)break;
     const h=n.volley%2,kind=n.volley%3===0?'block':'fruit',origin=position(s,n,at);
     spawn(s,{type:kind,at,start:origin.slice(),end:[h?.52:-.52,[1.16,1.52][h],.6],travel:profile.travelBeats*BEAT,hand:h,dir:(n.id+n.volley)%8,parent:n.id});
     emit(s,'throw',{entity:n.id,kind,position:origin});
    }
    if(n.type!=='boss'&&age>=n.life){n.dead=true;emit(s,'depart',{entity:n.id});}continue;
   }
   if(n.type==='return'){if(age>=n.travel){const parent=s.entities.find(v=>v.id===n.parent&&!v.dead);if(parent)damage(s,parent,n.power,'reflect',position(s,parent));n.dead=true;}continue;}
   if(n.type==='health'){if(segment(s.body,position(s,n,Math.max(n.at,before)),p)<.38+n.r)heal(s,n,'contact',p);else if(age>n.travel)n.dead=true;continue;}
   if(['block','bolt','bomb'].includes(n.type)){
    const a=position(s,n,Math.max(n.at,before));if(shieldHit(s,n,a,p,shields))continue;
    if(p[2]>=-.20){if(segment(s.body,a,p)<.38+n.r)hurt(s,n.type==='bomb'?8:D.get(s.difficulty).blockDamage,p);else{s.stats.dodges++;s.score+=35;emit(s,'dodge',{entity:n.id});}n.dead=true;}
   }else if(n.type==='fruit'&&age>n.travel){n.dead=true;s.stats.misses++;s.combo=0;emit(s,'miss',{entity:n.id});}
  }
  s.entities=s.entities.filter(n=>!n.dead);
  if(s.mode==='playing'&&s.time>=s.duration){s.mode=s.bossDefeated?'complete':'escaped';emit(s,'end');}
 }
 function result(s){return {chapter:s.chapter,difficulty:s.difficulty,score:s.score,combo:s.bestCombo,health:s.health,bossDefeated:s.bossDefeated,complete:s.mode==='complete',...s.stats};}
 function records(text){const clean={};try{const d=JSON.parse(text);for(const [k,v]of Object.entries(d||{}))if(/^(duck-armada|mothership)\/(desktop|gamepad|vr|ar)\/(easy|normal|hard|ultra-hard)\/(arcade|cruise)$/.test(k)&&v&&Number.isSafeInteger(v.score)&&v.score>=0&&Number.isSafeInteger(v.wins)&&v.wins>=1)clean[k]={score:v.score,wins:v.wins};}catch{}return clean;}
 const api={BPM,BEAT,DURATION,BOSS_BEAT,KEY,PACING_KEY,LEGACY_KEY,PALETTES,MATCH_BONUS,cycleColor,DIFFICULTIES:D,DIRS,PHASES,SPACE,phase,water,plan,create,advance,position,shoot,slice,result,records,open,segment,raySphere};root.RiverCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
