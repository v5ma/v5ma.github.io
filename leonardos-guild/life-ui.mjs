import {QUESTS,PEOPLE,ROOMS,ATTRIBUTES,nearest,targets,actions,use,spend,cast,stats,points,questStatus,done,lifeDescription,mapTarget} from './life-core.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createLifeUI({getState,world,setPause,save,active,onTransition}){
 const dialog=document.createElement('dialog');dialog.id='life-dialog';dialog.setAttribute('aria-labelledby','life-title');dialog.innerHTML='<header class="life-heading"><div><p class="eyebrow">A LIFE IN LEONARDO’S TOWN</p><h2 id="life-title">Apprentice’s Notebook</h2></div><button id="life-close">Return to town</button></header><nav id="life-tabs"><button data-tab="quests">Commissions</button><button data-tab="people">People & places</button><button data-tab="character">Character</button></nav><main id="life-content"></main><p id="life-message" role="status"></p>';
 document.body.append(dialog);let page='quests',target=null,wasActive=false;
 const $=id=>document.getElementById(id);$('life-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(wasActive)setPause(false);onTransition();});
 function open(kind='quests',subject=null){if(!active())return;wasActive=true;setPause(true);page=kind;target=subject;$('life-message').textContent='';render();dialog.showModal();}
 function note(){open('quests');}
 function talk(id=null){const s=getState(),t=id?targets(s,world).find(p=>p.id===id&&Math.hypot(s.x-p.x,s.z-p.z)<3.4):nearest(s,world);if(!t){s.toast='Walk close to a resident, cat, marked object or basement stairs. T / Talk interacts; N opens your notebook.';s.toastT=4;return false;}open('talk',t);return true;}
 function report(text){$('life-message').textContent=text;}
 function render(){const s=getState(),l=s.life,content=$('life-content');$('life-tabs').hidden=page==='talk';
  if(page==='quests'){
   $('life-title').textContent='Your growing list of commissions';
   content.innerHTML='<p class="life-intro">The Stolen Folio remains your first commission. These nine additional stories overlap its neighborhoods. Track one to mark the map; there is no fast travel.</p><button data-clear-track>Track only the original commission</button><div class="life-cards">'+QUESTS.map(q=>{const st=questStatus(s,q);return `<article class="quest ${st.done?'complete':''}"><p>${st.done?'COMPLETED':st.n?'IN PROGRESS':st.available?'AVAILABLE':'LOCKED'} · ${q.xp} XP / ${q.florins} fl</p><h3>${escape(q.name)}</h3><div>${escape(q.description)}</div><strong>${escape(st.text)}</strong>${!st.available&&!st.n?`<small>Requires: ${q.requires.map(id=>escape(QUESTS.find(q=>q.id===id).name)).join(', ')}</small>`:''}<button data-track="${q.id}" ${st.done?'disabled':''}>${l.tracked===q.id?'Currently tracked':'Mark on map'}</button></article>`;}).join('')+'</div>';
  }else if(page==='character'){
   const st=stats(s);$('life-title').textContent='Your apprentice, your choices';
   content.innerHTML=`<p class="life-intro">You are an adult apprentice, age 22. All relationship options are adults. This local single-player character has no paid attributes or real-money purchases.</p><div class="life-summary"><b>LEVEL ${st.level}</b><span>${l.xp} experience</span><span>${points(l)} unspent points</span><span>${s.credits} florins</span></div><div class="life-cards">`+Object.entries(ATTRIBUTES).map(([key,name])=>`<article><h3>${name} · ${l.attrs[key]}</h3><p>${{vitality:'+12 maximum vitality per point.',riding:'+0.6 bicycle speed per point. The joystick and keyboard still do the riding.',ingenuity:'+15 focus and longer Lantern spells per point.',empathy:'3% lower prices in the new character shops per point.'}[key]}</p><button data-attribute="${key}" ${points(l)<=0?'disabled':''}>Spend one point</button></article>`).join('')+`</div><p><b>Vitality</b> ${Math.ceil(s.health)} / ${st.maxHealth} · <b>Focus</b> ${Math.floor(l.focus)} / ${st.maxFocus}</p><p><b>Magic:</b> ${l.flags.lantern?'Lantern learned. R or the Magic touch button reveals hidden ink near you.':'Complete Ada’s A Light Below to learn Lantern.'}</p><p><b>Equipped cycle:</b> ${escape(l.bike)} · Owned: ${l.owned.map(escape).join(', ')}. Visit Bartolo to buy or change an unlocked bicycle.</p><p><b>Relationship:</b> ${l.partner?escape(PEOPLE.find(p=>p.id===l.partner).name):'None. Friendship and romance are optional and never gate missions.'}</p><p><b>Flying machine:</b> ${l.flags.airframe?'Design assembled. A piloted flying vehicle is planned; it cannot be flown in this release.':'Skyward, One Day opens Leonardo’s flying-machine research after the garden commissions.'}</p>${done(l,'cat')?`<button data-companion>${l.cat?'Ask Pippa to stay at the inn':'Invite Pippa to follow on the streets'}</button>`:''}`;
  }else if(page==='people'){
   $('life-title').textContent='Meet the people behind the doors';
   content.innerHTML='<p class="life-intro">Walk through the signed, open doors. The roof and front wall cut away when you step inside. Use T at marked stairs to descend; the same stair brings you back. Buildings without an open doorway remain scenery.</p><div class="life-cards">'+ROOMS.map(r=>`<article><p>${l.visits.includes(r.id)?'VISITED':'UNDISCOVERED'}</p><h3>${escape(r.name)}</h3><span>${r.cellar?'Walkable ground floor and basement':'Walkable ground floor'}${r.id==='observatory'?' · North garden charter required':''}</span></article>`).join('')+'</div><div class="life-cards">'+PEOPLE.map(p=>`<article><h3>${escape(p.name)}${p.age?' · '+p.age:''}</h3><p>${escape(p.role)} · ${l.friends[p.id]||0} friendship</p><span>${escape(p.text)}</span></article>`).join('')+'</div>';
  }else{
   const t=targets(s,world).find(p=>p.id===target.id&&Math.hypot(s.x-p.x,s.z-p.z)<3.6);if(!t){dialog.close();return;}target=t;$('life-title').textContent=t.name;
   const offered=actions(s,t,world),intro=t.text||({stairs:t.id==='down-inn'?'Beatrice keeps the cellar locked until you help find Pippa. The upstairs inn is always open.':'Stairs connect the two floors of this building. Your vehicle stays outside.',cat:'A town cat, not a collectible. You can stop and spend a moment together.',object:t.kind==='runes'?'The lock responds to LEAF, WATER and STAR. Neri knows the verse.':t.kind==='hidden'?'Only Lantern reveals the old ink. Use R outside this dialog, then read the ledger.':t.id==='pump'?'This pump needs the original repaired waterwheel, a bronze cog, and the mayor’s garden charter.':t.kind==='plant'?'Gather only the material needed for your current commission.':t.name}[t.type]||'');
   content.innerHTML=`<p class="life-intro">${escape(intro)}</p>`+(offered.length?offered.map(a=>`<button class="life-option" data-use="${escape(a.id)}" ${a.disabled?'disabled':''}>${escape(a.label)}</button>`).join(''):'<p>There is no active commission here yet. Your notebook lists who needs your help.</p>');
  }
 }
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const s=getState();
  if(b.dataset.tab){page=b.dataset.tab;report('');render();}
  if(b.dataset.track){s.life.tracked=b.dataset.track;save();render();report('Objective marked on your map. Travel there normally.');}
  if(b.hasAttribute('data-clear-track')){s.life.tracked=null;save();render();}
  if(b.dataset.attribute){if(spend(s,b.dataset.attribute)){save();render();report(s.toast);}}
  if(b.hasAttribute('data-companion')){s.life.cat=!s.life.cat;save();render();}
  if(b.dataset.use){const r=use(s,world,target.id,b.dataset.use);save();if(r.close){dialog.close();}else{render();report(r.text);}}
 });
 $('notebook-button').onclick=note;
 function update(){const s=getState(),st=stats(s),target=nearest(s,world),track=mapTarget(s,world),where=lifeDescription(s,world);
  $('life-status').textContent=`LEVEL ${st.level} · ${s.life.xp} XP · ${Math.floor(s.life.focus)} focus${points(s.life)>0?' · +'+points(s.life)+' point(s)':''}`;
  const panel=$('side-commission');panel.hidden=!track;panel.textContent=track?`${track.quest} → ${track.name||track.role||track.id}${track.locked?' / Gate locked':''}`:'';
  $('life-enemy').hidden=!(s.life.inside==='inn'&&!s.life.flags.rocco&&Math.hypot(s.x-105,s.z-180)<7);$('life-enemy').textContent='ROCCO · '+s.life.enemies.rocco+'/70 · '+(s.life.attackPending?'WINDUP / BRACE OR STEP AWAY':'T: talk with evidence / J: defend');
  if(where)$('district').textContent=where.toUpperCase();
  if(target)$('context').textContent=(s.mode==='foot'?'T / Talk: ':'Stop and dismount to meet ')+target.name;
 }
 function drawMap(g,X,Z,full){const s=getState();
  for(const room of world.rooms){g.fillStyle=s.life.visits.includes(room.id)?'#d0e4c5':'#f2d4a2';g.fillRect(X(room.door.x)-3,Z(room.door.z)-3,6,6);}
  if(full){g.fillStyle='#e6e0c1';g.textAlign='center';g.font='13px Arial';g.fillText(s.life.flags.garden?'NORTH GARDEN / OPEN':'NORTH GARDEN / CHARTER & PUMP',X(0),Z(440));}
  const track=mapTarget(s,world);if(track){g.strokeStyle='#a5d5f3';g.lineWidth=2;g.setLineDash([3,5]);g.beginPath();g.moveTo(X(s.x),Z(s.z));g.lineTo(X(track.x),Z(track.z));g.stroke();g.setLineDash([]);g.fillStyle='#a5d5f3';g.beginPath();g.arc(X(track.x),Z(track.z),full?6:4,0,7);g.fill();}
 }
 return {note,talk,update,drawMap,close(){if(dialog.open){dialog.close();return true;}return false;},get open(){return dialog.open;}};
}
