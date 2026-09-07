import {chooseCity} from './model.mjs';
import {conversation,levelInfo,missionHint,MISSIONS,trainAttribute,castMend,maxHealth} from './city-state.mjs';
import {ATTRIBUTES,PEOPLE,ROOMS,DOCKS,insideRoom} from './city-world.mjs';
export function installCityUI(api){
 const $=id=>document.getElementById(id);let currentPerson=null,lastUpdate=0;
 const makeButton=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;return b;};
 const journalButton=makeButton('J · City journal',()=>openJournal());journalButton.id='city-journal-button';$('combat-tools').append(journalButton);
 const mend=makeButton('V · Mend',()=>{if(!api.playing()||api.paused())return;api.action('mend');});mend.id='mend-button';mend.hidden=true;$('combat-tools').append(mend);
 const info=document.createElement('div');info.id='city-progress';info.innerHTML='<b></b><span></span><small></small>';$('hud').append(info);
 const vehicleInfo=document.createElement('div');vehicleInfo.id='skiff-status';vehicleInfo.hidden=true;$('hud').append(vehicleInfo);
 const pauseLink=makeButton('City missions & attributes',()=>{$('pause-dialog').close();openJournal();});$('pause-dialog').insertBefore(pauseLink,$('return-title'));
 const mapLink=makeButton('City missions & attributes',()=>{$('map-dialog').close();openJournal();});mapLink.id='city-map-journal';$('map-dialog').append(mapLink);
 const journal=$('city-journal'),talk=$('city-dialog');
 function showTalk(id){
  currentPerson=id;const data=conversation(api.state(),id);if(!data)return;
  $('city-speaker').textContent=data.name;$('city-role').textContent=data.role;$('city-speech').textContent=data.text;$('city-choices').replaceChildren();
  const portrait=$('city-portrait');portrait.textContent=data.name.split(' ').map(t=>t[0]).slice(0,2).join('');portrait.style.setProperty('--portrait',data.coat);
  for(const choice of data.choices){const b=makeButton(choice.label,()=>{
   if(!chooseCity(api.state(),id,choice.id)){api.toast('That choice is no longer available, or you need more credits.');return;}
   api.events();showTalk(id);
  });b.dataset.cityChoice=choice.id;$('city-choices').append(b);}
  $('city-wallet').textContent=api.state().kit.credits+' credits · level '+levelInfo(api.state()).level;
  if(!talk.open)api.show('city-dialog');
 }
 function journalContent(){
  const s=api.state(),l=levelInfo(s);$('city-character').textContent=`Level ${l.level} · ${l.xp} XP · ${l.points} unspent attribute point${l.points===1?'':'s'} · ${s.city.done.length}/${MISSIONS.length} city stories completed`;
  $('city-attributes').replaceChildren();
  for(const [key,d]of Object.entries(ATTRIBUTES)){
   const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),b=makeButton('Improve '+d.name+' · 1 point',()=>{if(trainAttribute(s,key)){api.events();journalContent();}});
   h.textContent=d.name+' '+s.city.skills[key]+'/3';p.textContent=d.description;b.dataset.train=key;b.disabled=l.points<1||s.city.skills[key]>=3;article.append(h,p,b);$('city-attributes').append(article);
  }
  $('city-missions').replaceChildren();
  for(const m of MISSIONS){
   const card=document.createElement('article');card.className='city-mission';
   const status=s.city.done.includes(m.id)?'COMPLETE':s.city.active.includes(m.id)?'ACTIVE':'DISCOVER';
   const badge=document.createElement('small');badge.textContent=status;badge.className=status.toLowerCase();
   const h=document.createElement('h3');h.textContent=m.title;const p=document.createElement('p');p.textContent=status==='ACTIVE'?missionHint(s,m.id):m.description;
   const extra=document.createElement('small');extra.textContent=`${m.xp} XP · ${m.credits} credits · ${PEOPLE.find(n=>n.id===m.giver)?.name}`;
   card.append(badge,h,p,extra);
   if(status!=='COMPLETE'){const b=makeButton(s.city.tracked===m.id?'TRACKED':'Track this story',()=>{s.city.tracked=m.id;api.persist();journalContent();});b.dataset.trackMission=m.id;card.append(b);}
   $('city-missions').append(card);
  }
  $('city-relations').textContent=s.city.flags.includes('dating')?'Mara: dating, by mutual choice. This is an initial dialogue relationship, not a full life simulation.':s.city.flags.includes('friends')?'Mara: a close friend. Both friendship and dating are optional.':s.city.done.includes('cat')?'Mara: grateful friend. Help Nora as well to unlock the optional café invitation.':'Relationships grow through helping people. Speak with Mara inside the Copper Cup.';
 }
 function openJournal(){if(!api.playing())return;journalContent();api.show('city-journal');}
 function update(){
  const s=api.state(),live=api.playing()&&!api.paused();info.hidden=!live||!!api.xr()||s.p.scoped;
  mend.hidden=!s.city.flags.includes('mend');mend.disabled=s.p.energy<30||s.p.health>=maxHealth(s)||(s.cityMendCooldown||0)>0;
  vehicleInfo.hidden=!live||!s.p.vehicle||!!api.xr();
  if(!vehicleInfo.hidden)vehicleInfo.textContent=`KESTREL · ${Math.round(Math.hypot(s.p.vx,s.p.vz)*3.6)} km/h · altitude ${s.p.y.toFixed(1)} m · SPACE ↑ / C ↓ · E parks on a pad`;
  if(performance.now()-lastUpdate<160)return;lastUpdate=performance.now();
  const l=levelInfo(s),room=insideRoom(s.p);info.querySelector('b').textContent='LEVEL '+l.level+(l.points?' · '+l.points+' POINTS':'')+' / '+(room?.name||'MERIDIAN CITIZEN');
  info.querySelector('span').textContent=missionHint(s);info.querySelector('small').textContent='J journal · '+s.city.done.length+'/'+MISSIONS.length+' city stories';
  if(s.city.flags.includes('mend'))mend.textContent=s.cityMendCooldown>0?'Mend · '+Math.ceil(s.cityMendCooldown)+'s':'V · Mend';
 }
 function effect(e){
  if(e.type==='city-talk')showTalk(e.id);
  if(e.type==='city-message')api.toast(e.text,5);
  if(e.type==='city-complete')api.toast(e.title+' complete'+(e.xp?' · +'+e.xp+' XP · +'+e.credits+' credits':''),6);
  if(e.type==='level-up')api.toast('LEVEL '+e.level+' · Spend your attribute point in the city journal (J).',6);
 }
 function paintMap(g,X,Z){
  g.font='10px Arial';g.textAlign='left';
  for(const n of PEOPLE){g.fillStyle='#ffce9d';g.beginPath();g.arc(X(n.x),Z(n.z),3.1,0,7);g.fill();}
  for(const r of ROOMS){g.strokeStyle='#ccdfb2';g.lineWidth=1;g.strokeRect(X(r.x-r.w/2),Z(r.z-r.d/2),r.w*(X(1)-X(0)),r.d*(Z(1)-Z(0)));}
  for(const d of DOCKS){g.strokeStyle='#edc076';g.beginPath();g.arc(X(d.x),Z(d.z),7,0,7);g.stroke();g.fillStyle='#ffdb9a';g.fillText('AIR',X(d.x)+9,Z(d.z));}
 }
 return {effect,update,openJournal,paintMap};
}
