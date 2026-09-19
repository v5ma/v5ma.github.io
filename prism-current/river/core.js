/* River Prism 1: authored beat waves, swept cuts, aimed shots, oriented shields.
   Pure gameplay module. No renderer, storage, clock mutation, or remote service. */
(function(root){'use strict';
 const BPM=132,BEAT=60/BPM,DURATION=196*BEAT,KEY='prism-current.river.records.v1';
 const DIRS=[[0,-1],[0,1],[-1,0],[1,0],[-.707,-.707],[.707,-.707],[-.707,.707],[.707,.707]];
 const PHASES=[{name:'Duck Armada',cue:'Slice the fruit. Shoot the catapult ducks before they fire.',level:-.18,beat:0},{name:'Bombboat Rapids',cue:'Triggers break boat engines. Grips block the red bombs.',level:.22,beat:64},{name:'High Tide Airshow',cue:'Shoot the planes. Cut high fruit; lean away from incoming fire.',level:.64,beat:112},{name:'Admiral Quack',cue:'The flagship core is exposed. Shoot it while defending the river.',level:.38,beat:152}];
 const SPACE=[{name:'First Contact',cue:'Triggers fire saber lasers. Shoot the small ships.',level:-.18,beat:0},{name:'Interceptor Swarm',cue:'Destroy the escorts or grip-shield their incoming bolts.',level:.22,beat:64},{name:'Shield Break',cue:'The mothership shield is weakening. Survive the next wave.',level:.64,beat:112},{name:'Mothership Core',cue:'The glowing core is open. Keep shooting, slicing and shielding.',level:.38,beat:152}];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
 const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),length=a=>Math.hypot(...a),norm=a=>scale(a,1/(length(a)||1)),lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 const valid=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 function segment(p,a,b){const v=sub(b,a),d=dot(v,v);return length(sub(p,add(a,scale(v,d?clamp(dot(sub(p,a),v)/d,0,1):0))));}
 function raySphere(o,d,p,r){const v=sub(p,o),b=dot(v,d),q=b*b-dot(v,v)+r*r;if(q<0||b+Math.sqrt(q)<0)return Infinity;return Math.max(0,b-Math.sqrt(q));}
 function phase(chapter,time){const a=chapter==='mothership'?SPACE:PHASES;let i=0;while(i<3&&time>=a[i+1].beat*BEAT)i++;return {...a[i],index:i};}
 function water(chapter,time){const p=phase(chapter,time),a=chapter==='mothership'?SPACE:PHASES;if(!p.index)return p.level;const k=clamp((time-p.beat*BEAT)/(4*BEAT),0,1),smooth=k*k*(3-2*k);return a[p.index-1].level+(p.level-a[p.index-1].level)*smooth;}
 function plan(chapter){if(!['duck-armada','mothership'].includes(chapter))throw Error('Unknown chapter');const out=[];let seq=0;const push=(type,beat,extra={})=>out.push({type,at:beat*BEAT,seq:seq++,...extra});
  for(let b=8;b<188;b+=4){const i=(b-8)/4,h=i%2,dir=i%8,y=[1.12,1.68,.90,1.86][i%4];push('fruit',b,{x:h?.55:-.55,y,hand:h,dir,travel:6*BEAT});
   if(b>=64&&b<180&&b%8===0)push('fruit',b+2,{x:h?-.7:.7,y:1.4,hand:1-h,dir:(dir+3)%8,travel:6*BEAT});
   if(chapter==='duck-armada'){
    if(b<64&&b%8===0)push('catapult',b,{x:i%2?1.8:-1.8,y:.3,hand:h,life:9*BEAT});
    if(b>=64&&b<112&&b%8===0)push('boat',b,{x:(i%3-1)*1.7,y:.6,hand:h,life:10*BEAT});
    if(b>=112&&b<184&&b%8===0){push('plane',b,{x:-1.4,y:2.15,hand:0,life:9*BEAT});push('plane',b+1,{x:1.4,y:2.55,hand:1,life:9*BEAT});}
   }else if(b%8===0){for(let j=0;j<(b>=112?3:2);j++)push('fighter',b+j,{x:(j-1)*1.6,y:1.6+(j%2)*.65,hand:j%2,life:9*BEAT});}
   if(b%16===8&&b>=40)push('bomb',b+1,{x:h?.42:-.42,y:1.35,hand:h,travel:7*BEAT});
  }
  push('boss',chapter==='mothership'?0:128,{x:0,y:chapter==='mothership'?2.1:1.45,life:DURATION,hp:chapter==='mothership'?60:44});
  return out.sort((a,b)=>a.at-b.at||a.seq-b.seq);
 }
 function create(chapter='duck-armada',cruise=false){return {chapter,cruise,time:0,mode:'ready',duration:DURATION,health:100,score:0,combo:0,bestCombo:0,entities:[],timeline:plan(chapter),cursor:0,nextId:1,eventId:0,events:[],bossDefeated:false,lastShot:[-10,-10],lastSlice:[-10,-10],stats:{slices:0,shots:0,shotHits:0,blocks:0,reflects:0,dodges:0,misses:0,damage:0,bossDamage:0},body:[0,1.45,0]};}
 function emit(s,type,data={}){s.events.push({id:++s.eventId,type,time:s.time,...data});if(s.events.length>100)s.events.shift();}
 function spawn(s,e){if(s.entities.length>=80)return null;const hp=e.hp||(e.type==='catapult'?4:e.type==='boat'?4:2),p=phase(s.chapter,e.at??s.time);const n={id:s.nextId++,...e,at:e.at??s.time,hp,maxHP:hp,r:e.type==='boss'?1.0:e.type==='fruit'?.24:e.type==='bomb'?.20:e.type==='bolt'?.12:.48,dead:false,volley:0};
  n.start=e.start||[e.x||0,e.type==='fruit'?(e.y||1.3)-.35:e.y||1.3,e.type==='fruit'?-9:e.type==='bomb'?-10:-15];
  if(e.type==='fruit'||e.type==='bomb'||e.type==='bolt'){n.end=e.end||[e.x||0,e.y||1.3,.6];n.travel=e.travel||6*BEAT;}
  if(e.type==='catapult'||e.type==='boat')n.y=water(s.chapter,n.at)+.6;
  s.entities.push(n);emit(s,'spawn',{entity:n.id,kind:n.type});return n;}
 function position(s,n,time=s.time){const age=time-n.at;
  if(['fruit','bomb','bolt','return'].includes(n.type)){const f=clamp(age/n.travel,0,1.15),p=lerp(n.start,n.end,f);if(n.type==='fruit')p[1]+=Math.sin(clamp(f,0,1)*Math.PI)*.70;return p;}
  if(n.type==='boss')return [Math.sin(time*.42)*.85,n.y+(s.chapter==='mothership'?Math.sin(time*.6)*.17:0),s.chapter==='mothership'?-12:-9];
  const f=clamp(age/n.life,0,1);return [n.x+Math.sin(age*1.6+n.id)*.28,n.y+Math.sin(age*1.8)*.09,-13+f*9];
 }
 function open(s,n){return n.type!=='boss'||s.time>=152*BEAT;}
 function reward(s,value){s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.score+=Math.round(value*(1+Math.min(3,Math.floor(s.combo/8))*.25));}
 function kill(s,n,reason,p){if(n.dead)return;n.dead=true;if(n.type==='boss')s.bossDefeated=true;reward(s,n.type==='boss'?2500:n.type==='fruit'?120:180);emit(s,'destroy',{entity:n.id,kind:n.type,position:p,reason,hand:n.hand||0,dir:n.dir||0});}
 function hurt(s,amount,p){s.combo=0;s.stats.damage+=amount;if(!s.cruise)s.health=Math.max(0,s.health-amount);emit(s,'damage',{position:p,amount});if(s.health===0){s.mode='failed';emit(s,'end');}}
 function damage(s,n,amount,reason,p){if(!open(s,n)){emit(s,'armored',{position:p});return false;}n.hp-=amount;if(n.type==='boss')s.stats.bossDamage+=amount;if(n.hp<=0)kill(s,n,reason,p);else emit(s,'hit',{position:p,kind:n.type});return true;}
 function shoot(s,hand,origin,direction){if(s.mode!=='playing'||![0,1].includes(hand)||!valid(origin)||!valid(direction)||s.time-s.lastShot[hand]<.18||length(direction)<.1)return false;
  s.lastShot[hand]=s.time;s.stats.shots++;const d=norm(direction);let target=null,best=40;
  for(const n of s.entities){if(n.dead||['fruit','return','bolt'].includes(n.type))continue;const r=raySphere(origin,d,position(s,n),n.r);if(r<best){best=r;target=n;}}
  emit(s,'laser',{hand,start:origin.slice(),end:add(origin,scale(d,best))});
  if(target){if(damage(s,target,1,'laser',position(s,target)))s.stats.shotHits++;return true;}return false;
 }
 function slice(s,hand,prior,pose,t0,t1){if(s.mode!=='playing'||![0,1].includes(hand)||!prior||!pose||![prior.a,prior.b,pose.a,pose.b].every(valid)||!Number.isFinite(t0)||!Number.isFinite(t1)||t1<=t0||t1-t0>.12)return 0;
  const movement=sub(pose.b,prior.b),speed=length(movement)/(t1-t0);if(speed<.45||speed>22)return 0;let count=0;
  for(const n of s.entities){if(n.dead||!['fruit','bomb'].includes(n.type))continue;const p=position(s,n),d=Math.min(segment(p,prior.a,pose.a),segment(p,prior.b,pose.b),segment(p,pose.a,pose.b),segment(p,prior.a,prior.b));if(d>n.r+.08)continue;
   if(n.type==='bomb'){n.dead=true;hurt(s,8,p);emit(s,'badcut',{position:p});continue;}
   const dir=DIRS[n.dir],flat=Math.hypot(movement[0],movement[1]);if(n.hand!==hand||flat<.01||(movement[0]*dir[0]+movement[1]*dir[1])/flat<.25){emit(s,'wrongcut',{position:p});continue;}
   s.stats.slices++;kill(s,n,'slice',p);count++;
  }return count;
 }
 function shieldHit(s,n,a,b,shields){for(const h of shields||[]){if(!h.active||!valid(h.center)||!valid(h.normal)||segment(h.center,a,b)>.50+n.r||dot(sub(b,a),h.normal)>=0)continue;
   const perfect=s.time-h.raised>=0&&s.time-h.raised<.24;n.dead=true;s.stats.blocks++;if(perfect)s.stats.reflects++;reward(s,perfect?220:80);emit(s,'block',{position:b,hand:h.hand||0,perfect});
   const parent=s.entities.find(v=>v.id===n.parent&&!v.dead);if(parent)spawn(s,{type:'return',start:b,end:position(s,parent),travel:.5,parent:parent.id,power:perfect?3:1,hand:h.hand||0});return true;
  }return false;}
 function advance(s,time,body=s.body,shields=[]){if(s.mode!=='playing'||!Number.isFinite(time)||time<s.time)return;const before=s.time;s.time=Math.min(time,s.duration);s.body=valid(body)?body.slice():s.body;
  while(s.cursor<s.timeline.length&&s.timeline[s.cursor].at<=s.time)spawn(s,s.timeline[s.cursor++]);
  const list=s.entities.slice();for(const n of list){if(n.dead)continue;const age=s.time-n.at,p=position(s,n);
   if(['catapult','boat','plane','fighter','boss'].includes(n.type)){
    const max=n.type==='boss'?40:2,interval=n.type==='boss'?4*BEAT:3*BEAT,first=n.type==='boss'?16*BEAT:2*BEAT;
    while(n.volley<max&&age>=first+n.volley*interval){n.volley++;if(n.type==='boss'&&s.bossDefeated)break;
     const h=n.volley%2,x=s.body[0]+(h?.34:-.34),y=s.body[1]-.05;
     if(n.type==='catapult')spawn(s,{type:'fruit',at:s.time,start:p.slice(),end:[h?.6:-.6,[1.12,1.72][h],.6],travel:6*BEAT,hand:h,dir:(n.id+n.volley)%8,parent:n.id});
     else spawn(s,{type:n.type==='boat'?'bomb':'bolt',at:s.time,start:p.slice(),end:[x,y,.6],travel:(n.type==='boss'?7:6)*BEAT,hand:h,parent:n.id});
    }
    if(n.type!=='boss'&&age>=n.life){n.dead=true;emit(s,'depart',{entity:n.id});}continue;
   }
   if(n.type==='return'){if(age>=n.travel){const parent=s.entities.find(v=>v.id===n.parent&&!v.dead);if(parent)damage(s,parent,n.power,'reflect',position(s,parent));n.dead=true;}continue;}
   if(['bolt','bomb'].includes(n.type)){
    const a=position(s,n,Math.max(n.at,before));if(shieldHit(s,n,a,p,shields))continue;
    if(p[2]>=-.20){if(segment(s.body,a,p)<.38+n.r)hurt(s,n.type==='bomb'?8:6,p);else{s.stats.dodges++;s.score+=35;emit(s,'dodge',{entity:n.id});}n.dead=true;}
   }else if(n.type==='fruit'&&age>n.travel){n.dead=true;s.stats.misses++;s.combo=0;emit(s,'miss',{entity:n.id});}
  }
  s.entities=s.entities.filter(n=>!n.dead);
  if(s.mode==='playing'&&s.time>=s.duration){s.mode=s.bossDefeated?'complete':'escaped';emit(s,'end');}
 }
 function result(s){return {chapter:s.chapter,score:s.score,combo:s.bestCombo,health:s.health,bossDefeated:s.bossDefeated,complete:s.mode==='complete',...s.stats};}
 function records(text){const clean={};try{const d=JSON.parse(text);for(const [k,v]of Object.entries(d||{}))if(/^(duck-armada|mothership)\/(desktop|gamepad|vr|ar)\/(arcade|cruise)$/.test(k)&&v&&Number.isSafeInteger(v.score)&&v.score>=0&&Number.isSafeInteger(v.wins)&&v.wins>=1)clean[k]={score:v.score,wins:v.wins};}catch{}return clean;}
 const api={BPM,BEAT,DURATION,KEY,DIRS,PHASES,SPACE,phase,water,plan,create,advance,position,shoot,slice,result,records,open,segment,raySphere};root.RiverCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
