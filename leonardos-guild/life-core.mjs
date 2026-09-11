/* Local RPG progression and authored interactions; no payment/account APIs.
 * All rewards are idempotent. Public read-only observations live in app.mjs. */
import {LIFE_VERSION,ROOMS,PEOPLE,CATS,OBJECTS,QUESTS,GOODS,LEVELS,ATTRIBUTES} from './life-data.mjs';
export {ROOMS,PEOPLE,CATS,OBJECTS,QUESTS,GOODS,ATTRIBUTES};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const qmap=new Map(QUESTS.map(q=>[q.id,q])),pmap=new Map(PEOPLE.map(p=>[p.id,p]));
export function notify(s,text,type='town',data={}){s.toast=text;s.toastT=5;s.events.push({type,step:s.steps,...data});if(s.events.length>160)s.events.shift();}
export function enhanceWorld(w){
 w.limits={x:148,zMin:-26,zMax:566};w.originalHouseCount=w.houses.length;w.rooms=[];
 for(const [x,z,side]of [[24.5,496,1],[-24.5,459,-1],[104.5,496,1],[-104.5,496,-1]]){
  const id='garden-home-'+w.houses.length;w.houses.push({id,x,z,side,kind:w.houses.length%5,road:x-side*24.5,w:12,d:14,expansion:true});w.colliders.push({id,x,z,hx:6.2,hz:7.4});
 }
 for(const spec of ROOMS){const h=w.houses.find(h=>h.x===spec.x&&h.z===spec.z);if(!h)throw Error('Missing room house '+spec.id);h.room=spec.id;
  const room={...spec,hx:h.w/2,hz:h.d/2,door:{x:h.x-h.side*(h.w/2+.7),z:h.z},stairs:{x:h.x+h.side*(h.w/2-2),z:h.z-4}};w.rooms.push(room);
  w.colliders=w.colliders.filter(c=>c.id!==h.id);
  const front=h.x-h.side*(room.hx-.2),back=h.x+h.side*(room.hx-.2);
  w.colliders.push({id:spec.id+'-back',x:back,z:h.z,hx:.25,hz:room.hz},{id:spec.id+'-north',x:h.x,z:h.z-room.hz+.2,hx:room.hx,hz:.25},{id:spec.id+'-south',x:h.x,z:h.z+room.hz-.2,hx:room.hx,hz:.25});
  for(const sign of[-1,1])w.colliders.push({id:spec.id+'-door-wall',x:front,z:h.z+sign*(room.hz+1.6)/2,hx:.25,hz:(room.hz-1.6)/2});
  // Furniture occupies a side wall; the entrance and center remain navigable.
  w.colliders.push({id:spec.id+'-counter',x:h.x,z:h.z+room.hz-1.1,hx:2.7,hz:.55});
 }
 // Gate spans the original northern border. Low arches are not a payment gate.
 for(const sign of[-1,1])w.colliders.push({id:'north-wall',x:sign*78,z:407,hx:70.8,hz:1.5});
 w.townGate={id:'north-gate',x:0,z:407,hx:7.1,hz:1.5};
 for(let z=423;z<557;z+=22)for(const x of[-125,-55,55,125])w.trees.push({x,z,seed:x+z*3});
 w.people=PEOPLE;w.objects=OBJECTS;return w;
}
export function level(l){let n=1;for(let i=1;i<LEVELS.length;i++)if(l.xp>=LEVELS[i])n=i+1;return n;}
export function stats(s){const a=s.life?.attrs||{};return {level:s.life?level(s.life):1,maxHealth:100+12*(a.vitality||0),maxFocus:60+15*(a.ingenuity||0),rideBonus:.6*(a.riding||0),discount:1-.03*(a.empathy||0),maxPapers:s.life?.bike==='cargo'?30:20};}
export function points(l){return level(l)-1-Object.values(l.attrs).reduce((a,b)=>a+b,0);}
export function freshLife(){return {version:LIFE_VERSION,xp:0,attrs:{vitality:0,riding:0,ingenuity:0,empathy:0},quests:{},flags:{},paid:[],friends:{},gifted:[],owned:['standard'],bike:'standard',partner:null,cat:false,tracked:null,focus:60,aura:0,spellCD:0,inside:null,runes:[],enemies:{rocco:70},petX:91,petZ:202,visits:[],lastHit:0,attackPending:false};}
export function readLife(raw){
 const l=freshLife();if(!raw||typeof raw!=='object'||raw.version!==LIFE_VERSION)return l;
 const integer=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
 if(integer(raw.xp,50000))l.xp=raw.xp;
 for(const k of Object.keys(l.attrs))if(integer(raw.attrs?.[k],9))l.attrs[k]=raw.attrs[k];
 if(points(l)<0)l.attrs=freshLife().attrs;
 for(const q of QUESTS)if(integer(raw.quests?.[q.id],q.stages.length+1))l.quests[q.id]=raw.quests[q.id];
 // Known flags only: no unbounded objects or inherited keys enter live state.
 for(const k of ['ink','pippa','prism','lantern','warrant','ledger','rocco','charter','cog','garden','sailcloth','wind','compass','airframe'])if(raw.flags?.[k]===true)l.flags[k]=true;
 if(Array.isArray(raw.paid))l.paid=[...new Set(raw.paid.filter(x=>typeof x==='string'&&/^(mail-[0-9]{1,3}|first-folio|quest-[a-z]+)$/.test(x)))].slice(0,80);
 for(const p of PEOPLE)if(integer(raw.friends?.[p.id],20))l.friends[p.id]=raw.friends[p.id];
 if(Array.isArray(raw.gifted))l.gifted=[...new Set(raw.gifted.filter(x=>['isabella','sofia'].includes(x)))];
 if(Array.isArray(raw.owned))l.owned=[...new Set(['standard',...raw.owned.filter(x=>['courier','cargo'].includes(x))])];
 if(l.owned.includes(raw.bike))l.bike=raw.bike;
 if(['isabella','sofia'].includes(raw.partner)&&l.friends[raw.partner]>=3)l.partner=raw.partner;
 l.cat=raw.cat===true&&done(l,'cat');l.tracked=qmap.has(raw.tracked)?raw.tracked:null;
 if(Array.isArray(raw.visits))l.visits=[...new Set(raw.visits.filter(x=>ROOMS.some(r=>r.id===x)))];
 l.focus=60+15*l.attrs.ingenuity;l.enemies.rocco=l.flags.rocco?0:70;
 return l;
}
export function initLife(s,raw){s.life=readLife(raw);return s;}
export function saveLife(l){return {version:l.version,xp:l.xp,attrs:{...l.attrs},quests:{...l.quests},flags:{...l.flags},paid:[...l.paid],friends:{...l.friends},gifted:[...l.gifted],owned:[...l.owned],bike:l.bike,partner:l.partner,cat:l.cat,tracked:l.tracked,visits:[...l.visits]};}
export function done(l,id){const q=qmap.get(id);return !!q&&l.quests[id]===q.stages.length+1;}
export function questStatus(s,q){const n=s.life.quests[q.id]||0;return {n,done:done(s.life,q.id),available:q.requires.every(id=>done(s.life,id)),target:n>0&&n<=q.stages.length?q.stages[n-1][0]:q.giver,text:done(s.life,q.id)?'Commission complete':n>0?q.stages[n-1][1]:'Speak with '+pmap.get(q.giver).name};}
export function grant(s,id,xp,florins=0){if(s.life.paid.includes(id))return false;const was=level(s.life);s.life.paid.push(id);s.life.xp+=xp;s.credits+=florins;
 if(level(s.life)>was)notify(s,`Level ${level(s.life)}! Open your notebook to spend an attribute point.`,'level-up',{level:level(s.life)});return true;}
export function roomAt(s,w){if(s.doors?.level)return w.rooms.find(r=>r.id===s.doors.room)||null;if(s.life.inside)return w.rooms.find(r=>r.id===s.life.inside);return w.rooms.find(r=>Math.abs(s.x-r.x)<r.hx-.25&&Math.abs(s.z-r.z)<r.hz-.25)||null;}
export function roomBlocked(s,w,x,z,radius){const r=w.rooms.find(r=>r.id===s.life.inside);if(!r)return true;return Math.abs(x-r.x)>r.hx-radius-.4||Math.abs(z-r.z)>r.hz-radius-.4;}
export function sameSpace(s,o){return !s.doors?.level&&(o.inside||null)===(s.life.inside||null);}
export function personAt(p,s){if(s.life.partner===p.id&&s.life.flags.garden)return {...p,x:18,z:464,room:null};return p;}
export function targets(s,w){
 const list=PEOPLE.map(p=>({...personAt(p,s),type:'person'})).concat(OBJECTS.map(p=>({...p,type:'object'})),CATS.map(p=>({...p,type:'cat',...(p.id==='pippa'&&s.life.cat?{x:s.life.petX,z:s.life.petZ}:{})})));
 for(const room of w.rooms.filter(r=>r.cellar)){if(!s.life.inside)list.push({id:'down-'+room.id,type:'stairs',name:'Descend to '+room.name+' basement',...room.stairs,room:room.id});else if(s.life.inside===room.id)list.push({id:'up-'+room.id,type:'stairs',name:'Return upstairs',inside:room.id,room:room.id,x:room.stairs.x,z:room.stairs.z});}
 return list.filter(p=>sameSpace(s,p)&&(!p.room||!s.life.inside||p.room===s.life.inside)&&(!(p.z>410)||s.life.flags.garden));
}
export function nearest(s,w){if(Math.abs(s.speed)>1.7)return null;return targets(s,w).filter(p=>dist(p,s)<(p.type==='cat'?2.8:3.4)).sort((a,b)=>dist(a,s)-dist(b,s))[0]||null;}
export function mapTarget(s,w){const q=qmap.get(s.life.tracked);if(!q)return null;const status=questStatus(s,q);if(status.done)return null;let p=targets({...s,life:{...s.life,inside:null}},w).find(p=>p.id===status.target);
 if(!p){const x=OBJECTS.find(x=>x.id===status.target)||PEOPLE.find(x=>x.id===status.target);if(x?.inside){const room=w.rooms.find(r=>r.id===x.inside);p={...room.door,name:'Stairs inside '+room.name};}else if(x)p=x;}
 return p?{...p,quest:q.name,locked:p.z>407&&!s.life.flags.garden}:null;
}
export function startQuest(s,id){const q=qmap.get(id);if(!q||s.life.quests[id]||!q.requires.every(x=>done(s.life,x)))return false;s.life.quests[id]=1;s.life.tracked=id;notify(s,'New commission: '+q.name,'quest-start',{id});return true;}
function advance(s,id){const q=qmap.get(id),l=s.life,n=l.quests[id];if(!n||n>q.stages.length)return false;l.quests[id]=n+1;
 if(n===q.stages.length){grant(s,'quest-'+id,q.xp,q.florins);l.friends[q.giver]=Math.min(20,(l.friends[q.giver]||0)+2);
  if(id==='ink')l.flags.ink=true;if(id==='cat'){l.flags.pippa=true;l.cat=true;l.petX=91;l.petZ=202;}
  if(id==='lantern')l.flags.lantern=true;if(id==='receipts')l.flags.charter=true;if(id==='sky')l.flags.airframe=true;
  notify(s,`${q.name} complete / +${q.xp} experience / +${q.florins} florins`,'quest-complete',{id});
 }else notify(s,q.stages[n][1],'quest-stage',{id,stage:n+1});return true;}
function match(s,id,target){const q=qmap.get(id),n=s.life.quests[id];return n>0&&n<=q.stages.length&&q.stages[n-1][0]===target;}
export function canProgress(s,id,target){if(!match(s,id,target))return false;const l=s.life;
 if(target==='prism')return !!l.flags.prism;
 if(target==='ledger')return l.aura>0&&l.flags.warrant;
 if(target==='pump')return !!(s.relay&&l.flags.charter&&l.flags.cog);
 if(target==='rocco')return !!(l.flags.ledger&&l.flags.warrant);
 return true;
}
function finishStage(s,id,target){if(!canProgress(s,id,target))return false;const flags={prism:'prism',ledger:'ledger',pump:'garden',rocco:'rocco',cog:'cog'};if(flags[target])s.life.flags[flags[target]]=true;
 if(target==='lucia')s.life.flags.warrant=true;if(target==='pump')notify(s,'The north gate opens. You can ride directly into the gardens.','area-unlocked',{id:'garden'});
 if(target==='rocco')s.life.enemies.rocco=0;return advance(s,id);}
export function actions(s,target,w){
 if(!target)return [];
 if(s.mode!=='foot')return [{id:'dismount',label:'Dismount first to talk, explore indoors or handle objects.',disabled:true}];
 const out=[];if(target.type==='person')for(const q of QUESTS){if(q.giver===target.id&&!s.life.quests[q.id])out.push({id:'start:'+q.id,label:'Accept: '+q.name,disabled:!questStatus(s,q).available});}
 for(const q of QUESTS)if(match(s,q.id,target.id))out.push({id:'progress:'+q.id,label:target.id===q.giver?'Complete / report: '+q.name:q.stages[(s.life.quests[q.id]||1)-1][1],disabled:!canProgress(s,q.id,target.id)});
 if(target.type==='stairs'){out.push({id:'stairs',label:target.name,disabled:target.id==='down-inn'&&!done(s.life,'cat')});}
 if(target.type==='cat')out.push({id:'pet',label:'Pet '+target.name});
 if(target.id==='prism'&&!s.life.flags.prism)for(const rune of['leaf','water','star'])out.push({id:'rune:'+rune,label:'Turn symbol: '+rune.toUpperCase()});
 if(target.id==='airframe')out.push({id:'inspect',label:s.life.flags.airframe?'Inspect the assembled flying-machine design (not flyable yet)':'Study the unfinished wing (future flight research)'});
 for(const item of GOODS.filter(i=>i.seller.includes(target.id)))out.push({id:'buy:'+item.id,label:(s.life.owned.includes(item.id)?'Equip ':`Buy ${price(s,item)} fl / `)+item.name,disabled:!!item.quest&&!done(s.life,item.quest)});
 if(target.romance){const q=target.id==='isabella'?'pigments':'lenses';out.push({id:'chat',label:'Ask about their own work and interests'});
  out.push({id:'gift',label:'Offer a bouquet (12 florins, once)',disabled:s.life.gifted.includes(target.id)||s.credits<12});
  if(done(s.life,q)&&(s.life.friends[target.id]||0)>=3&&!s.life.partner)out.push({id:'date',label:'Ask to spend an evening together in the garden'});
  if(s.life.partner===target.id)out.push({id:'friends',label:'Talk kindly about staying friends instead'});
 }
 return out;
}
export function price(s,item){return Math.max(1,Math.ceil(item.price*stats(s).discount));}
export function use(s,w,id,action){
 const target=targets(s,w).find(p=>p.id===id);
 if(!target||dist(s,target)>3.6||Math.abs(s.speed)>1.7||s.mode!=='foot')return {ok:false,text:'Walk close to the person or object and stop first.'};
 const offered=actions(s,target,w).find(a=>a.id===action);if(!offered||offered.disabled)return {ok:false,text:'This option is not available yet. Check the commission requirements.'};
 let text='';let close=false;
 if(action.startsWith('start:')){startQuest(s,action.slice(6));text=s.toast;}
 else if(action.startsWith('progress:')){if(!finishStage(s,action.slice(9),id))return {ok:false,text:'The required discovery is still missing.'};text=s.toast;}
 else if(action==='stairs'){
  const r=w.rooms.find(r=>r.id===target.room);s.life.inside=s.life.inside?null:r.id;s.x=r.stairs.x;s.z=r.stairs.z+.7;s.yaw=0;s.lift=s.vy=s.speed=0;s.life.runes=[];close=true;text=s.life.inside?'Downstairs. Find the marked stairs to return.':'Back upstairs. Your parked bicycle is where you left it.';notify(s,text,'stairs',{room:s.life.inside});
 }
 else if(action==='pet'){text=target.name+' leans into your hand.';if(id==='pippa'&&match(s,'cat','pippa')){advance(s,'cat');text=s.toast;}notify(s,text,'pet',{id});}
 else if(action.startsWith('rune:')){const rune=action.slice(5),expected=['leaf','water','star'];s.life.runes.push(rune);
  if(rune!==expected[s.life.runes.length-1]){s.life.runes=[];text='The lock turns back. Read Neri’s verse, then try again.';}
  else if(s.life.runes.length===3){s.life.flags.prism=true;text='The prism is revealed. Take it, then return to Ada.';}
  else text=`${s.life.runes.map(x=>x.toUpperCase()).join(' → ')}. The mechanism is listening.`;
 }
 else if(action.startsWith('buy:')){const item=GOODS.find(x=>x.id===action.slice(4));if(['standard','courier','cargo'].includes(item.id)&&s.life.owned.includes(item.id)){s.life.bike=item.id;text=item.name+' equipped.';}
  else{const cost=price(s,item);if(s.credits<cost)return {ok:false,text:`You need ${cost} florins. No real-money purchases are used.`};s.credits-=cost;
   if(item.id==='tonic')s.health=stats(s).maxHealth;else if(item.id==='focus')s.life.focus=stats(s).maxFocus;
   else{s.life.owned.push(item.id);s.life.bike=item.id;}text=text||item.name+' purchased.';notify(s,text,'town-trade',{item:item.id,cost});}
 }
 else if(action==='chat'){if((s.life.friends[id]||0)<3)s.life.friends[id]=(s.life.friends[id]||0)+1;text=id==='isabella'?'Isabella tells you about painting the town as its citizens remember it.':'Sofia explains why she makes instruments rather than selling predictions.';}
 else if(action==='gift'){s.credits-=12;s.life.gifted.push(id);s.life.friends[id]=Math.min(20,(s.life.friends[id]||0)+1);text=target.name+' accepts the flowers as a friendly gesture. Friendship, not spending, opens the shared story.';}
 else if(action==='date'){s.life.partner=id;text=target.name+' smiles: “Yes. Meet me by the north garden bench when our work is done.” Your optional relationship is recorded; quests never require romance.';}
 else if(action==='friends'){s.life.partner=null;text='You both agree to stay friends. No rewards or completed commissions are lost.';}
 else if(action==='inspect')text=s.life.flags.airframe?'The wing, compass and sailcloth now form a flying-machine design. Piloted flight is not in this release.':'An unfinished machine waits for sailcloth and wind studies. Ask Leonardo about Skyward, One Day after helping the artisans.';
 return {ok:true,text,close};
}
export function spend(s,attribute){if(!Object.hasOwn(ATTRIBUTES,attribute)||points(s.life)<=0)return false;s.life.attrs[attribute]++;notify(s,ATTRIBUTES[attribute]+' improved.','attribute',{attribute});return true;}
export function cast(s){const l=s.life;if(!l.flags.lantern){notify(s,'Ada can teach Lantern after A Light Below.');return false;}if(l.focus<18||l.spellCD>0){notify(s,'Lantern needs 18 focus and a short rest between casts.');return false;}l.focus-=18;l.spellCD=7;l.aura=7+1.5*l.attrs.ingenuity;notify(s,'LANTERN / hidden ink and old markings become visible.','magic');return true;}
export function hitRocco(s,w){if(s.life.inside!=='inn'||s.life.flags.rocco||dist(s,PEOPLE.find(p=>p.id==='rocco'))>3.5)return false;s.life.enemies.rocco=Math.max(0,s.life.enemies.rocco-(s.upgraded?35:24));if(!s.life.enemies.rocco){s.life.flags.rocco=true;notify(s,'Rocco yields. Present your warrant and evidence to close the investigation.','town-duel');}return true;}
export function lifeStep(s,w,input,dt){const l=s.life;l.focus=Math.min(stats(s).maxFocus,l.focus+dt*.9);l.aura=Math.max(0,l.aura-dt);l.spellCD=Math.max(0,l.spellCD-dt);if(s.doors?.level)return;
 for(const id of s.deliveries)grant(s,id,15);if(s.completed)grant(s,'first-folio',150);
 const room=roomAt(s,w);if(room&&!l.visits.includes(room.id)){l.visits.push(room.id);notify(s,'Discovered '+room.name,'interior',{id:room.id});}
 if(l.cat&&!l.inside){const d=Math.hypot(l.petX-s.x,l.petZ-s.z);if(d>2.5){const step=Math.min(d-2.5,dt*8),dx=(s.x-l.petX)/d*step,dz=(s.z-l.petZ)/d*step;const blocked=(x,z)=>w.colliders.some(b=>Math.abs(x-b.x)<b.hx+.17&&Math.abs(z-b.z)<b.hz+.17)||(!l.flags.garden&&Math.abs(x)<7.3&&Math.abs(z-407)<1.7);if(!blocked(l.petX+dx,l.petZ))l.petX+=dx;if(!blocked(l.petX,l.petZ+dz))l.petZ+=dz;}}
 if(l.inside==='inn'&&!l.flags.rocco&&dist(s,PEOPLE.find(p=>p.id==='rocco'))<3.5){l.lastHit=Math.max(0,l.lastHit-dt);if(l.lastHit===0){l.lastHit=2.2;l.attackPending=true;notify(s,'Rocco raises his staff. Brace, retreat upstairs, or show the evidence.','town-windup');}else if(l.attackPending&&l.lastHit<1.4){l.attackPending=false;s.health=Math.max(0,s.health-(input.guard?2:9));notify(s,input.guard?'You brace against Rocco’s staff.':'Rocco’s staff catches you. Step away or brace.','town-hit');}}else{l.attackPending=false;l.lastHit=0;}
}
export function lifeDescription(s,w){const room=roomAt(s,w);if(s.life.inside)return room.name+' / Basement';if(room)return room.name;if(s.z>410)return 'North Garden & Observatory';return null;}
