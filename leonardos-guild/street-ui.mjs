import {STREET_JOBS,JOB_MAP,available,nearby,eligibleAt,currentSite,inSpace,work,notes,streetTarget} from './street-core.mjs';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createStreetUI({getState,world,setPause,save,active}){
 const dialog=document.createElement('dialog');dialog.id='street-dialog';dialog.setAttribute('aria-labelledby','street-title');dialog.innerHTML='<header><p>THE CITY BETWEEN COMMISSIONS</p><button id="street-close">Return to town</button><h2 id="street-title">Market life</h2></header><nav><button data-street-tab="board">Neighbourhood work</button><button data-street-tab="notes">Field notes</button></nav><section id="street-content"></section><p id="street-message" role="status"></p>';
 document.body.append(dialog);let page='board',job=null,sound=null,audioNodes=[],wasActive=false;
 const openButton=document.createElement('button');openButton.id='street-open';openButton.textContent='Neighbourhood work / V';openButton.title='Open optional repairs, deliveries, recipes, music and discoveries';document.getElementById('mission').append(openButton);
 const touch=document.createElement('button');touch.dataset.action='work';touch.id='street-touch';touch.innerHTML='<b>Y</b>Work';document.querySelector('.action-pad').append(touch);
 const $=id=>document.getElementById(id);
 function open(which='board',id=null){if(!active())return;wasActive=true;page=which;job=id;setPause(true);$('street-message').textContent='';render();dialog.showModal();}
 openButton.onclick=()=>open();$('street-close').onclick=()=>dialog.close();
 function quiet(){for(const n of audioNodes)try{n.stop();}catch{}audioNodes=[];sound?.suspend().catch(()=>{});}
 dialog.addEventListener('close',()=>{quiet();const s=getState();s.street.sequence=[];s.street.sequenceJob=null;if(wasActive)setPause(false);wasActive=false;});
 function describe(j,s){const n=s.street.progress[j.id]||0;return (n===0?j.description:'Next: '+currentSite(s,j).name)+(available(s,j)?'':' Requires '+j.requires+'.');}
 function render(){const s=getState(),c=$('street-content');$('street-title').textContent=page==='task'?JOB_MAP.get(job).title:page==='notes'?'Things you changed':'The city has other plans';
  if(page==='board'){
   c.innerHTML='<p class="street-intro">Twenty-two optional encounters inside the existing town. They are not required for The Stolen Folio. Amber markers indicate nearby work; Y or Work interacts. Repairs and discoveries stay completed, rather than paying again after a reload.</p><div class="street-grid">'+STREET_JOBS.map(j=>{const finished=s.street.done.includes(j.id),p=currentSite(s,j);return `<article class="${finished?'street-done':''}"><small>${safe(j.kind.toUpperCase())} / ${finished?'COMPLETED':available(s,j)?'AVAILABLE':'LATER'}</small><h3>${safe(j.title)}</h3><p>${safe(describe(j,s))}</p><p class="street-place">${safe(p.name)}${p.inside?' / basement':p.room?' / inside':''}</p><button data-street-track="${j.id}" ${finished?'disabled':''}>${s.street.tracked===j.id?'Marked on map':'Mark location'}</button></article>`;}).join('')+'</div><button id="street-clear-track">Clear neighbourhood marker</button><p class="street-intro">More planned work, character animation and the art-production register are kept in <a href="./UPGRADE-CHECKLIST.md" target="_blank" rel="noopener">the GitHub upgrade checklist</a>. No multiplayer or paid entitlements are introduced here.</p>';
  }else if(page==='notes'){
   const n=notes(s);c.innerHTML=n.length?'<div class="street-grid">'+n.map(e=>`<article><h3>${safe(e.title)}</h3><p>${safe(e.text)}</p>${e.choice?`<strong>Chosen: ${safe(e.choice)}</strong>`:''}</article>`).join('')+'</div>':'<p>Complete a repair, delivery, discovery or small commission to leave a record here. Old journal missions are kept separately.</p>';
  }else{
   const j=JOB_MAP.get(job),p=currentSite(s,j),finished=s.street.done.includes(j.id),n=s.street.progress[j.id]||0,last=n===j.sites.length-1;
   c.innerHTML=`<p class="street-intro">${safe(j.description)}</p><p><strong>${safe(p.name)}</strong> / step ${Math.min(n+1,j.sites.length)} of ${j.sites.length}</p>`;
   if(finished){c.innerHTML+=`<p>${safe(j.result)}</p><p>This encounter is complete. No second payout is available.</p>`;if(j.kind==='melody')c.innerHTML+='<button id="street-listen">Play the learned refrain</button>';return;}
   if(!available(s,j)){c.innerHTML+=`<p>Come back after ${safe(j.requires)}. Other neighbourhood work is available now.</p>`;return;}
   if(s.mode!=='foot'){c.innerHTML+='<p>Dismount first. Your bicycle remains parked where you leave it.</p>';return;}
   if(!inSpace(s,world,p)||Math.hypot(s.x-p.x,s.z-p.z)>3.1){c.innerHTML+='<p>Next destination marked on the map. Close this panel and travel there; remote interaction is not available.</p>';return;}
   if(!last)c.innerHTML+=`<button class="street-primary" data-street-action="continue">${n===0?'Take this small commission':j.kind==='investigation'?'Read / listen and remember':'Collect or hand over the marked item'}</button>`;
   else if(j.answer){
    if(j.kind==='melody')c.innerHTML+='<button id="street-listen">Listen / show the refrain</button><p>The written note sequence remains above; hearing audio is not required.</p>';
    c.innerHTML+=`<div class="street-puzzle">${j.options.map(o=>`<button data-street-action="${safe(o)}">${safe(o.toUpperCase())}</button>`).join('')}</div><p id="street-sequence">${s.street.sequenceJob===j.id?s.street.sequence.map(safe).join(' / '):'Follow the clue; mistakes cost nothing.'}</p><button data-street-action="reset">Reset attempt</button>`;
   }else if(j.kind==='palette')c.innerHTML+='<p>Choose the mood of the finished display. All choices are valid.</p><div class="street-puzzle">'+j.options.map(o=>`<button data-street-action="${safe(o)}">${safe(o)}</button>`).join('')+'</div>';
   else c.innerHTML+=`<button class="street-primary" data-street-action="${j.kind==='lantern'?'read':'continue'}">${j.kind==='lantern'?'Read with active Lantern':'Finish this encounter'}</button>`;
   if(j.kind==='lantern')c.innerHTML+='<p>Close this panel and cast R / Magic nearby, then return while Lantern is active. The panel pauses the spell, not its resource cost.</p>';
   c.innerHTML+=`<p class="street-reward">One-time reward: ${j.xp} XP and ${j.coins} florins.</p>`;
  }
 }
 function listen(j){quiet();const C=window.AudioContext||window.webkitAudioContext;if(!C){$('street-message').textContent='Audio unavailable. Read the written notes above.';return;}sound??=new C();sound.resume().catch(()=>{});j.answer.forEach((note,i)=>{const o=sound.createOscillator(),g=sound.createGain(),t=sound.currentTime+i*.32;o.frequency.value={C:261.63,E:329.63,G:392}[note];o.type='triangle';g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g);g.connect(sound.destination);o.start(t);o.stop(t+.3);audioNodes.push(o);o.onended=()=>{o.disconnect();g.disconnect();};});$('street-message').textContent='Refrain: '+j.answer.join(' / ');}
 dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const s=getState();
  if(b.dataset.streetTab){quiet();page=b.dataset.streetTab;render();}
  if(b.dataset.streetTrack){s.street.tracked=b.dataset.streetTrack;save();render();$('street-message').textContent='Amber destination marked. You still travel there using the normal controls.';}
  if(b.id==='street-clear-track'){s.street.tracked=null;save();render();}
  if(b.dataset.streetJob){job=b.dataset.streetJob;page='task';render();}
  if(b.dataset.streetAction){const r=work(s,world,job,b.dataset.streetAction);save();render();$('street-message').textContent=r.text;}
  if(b.id==='street-listen')listen(JOB_MAP.get(job));
 });
 function interact(){if(!active())return;const s=getState(),p=nearby(s,world);if(!p){s.toast='Look for amber neighbourhood markers. Y or Work interacts nearby; V lists the optional encounters.';s.toastT=5;return;}const candidates=eligibleAt(s,p).filter(j=>available(s,j));
  if(p.id==='board'||!candidates.length){open();return;}open('task',candidates[0].id);
  if(candidates.length>1)$('street-content').insertAdjacentHTML('afterbegin','<div class="street-puzzle">'+candidates.map(j=>`<button data-street-job="${j.id}">${safe(j.title)}</button>`).join('')+'</div>');
 }
 function update(){const s=getState(),p=nearby(s,world);openButton.textContent=`Neighbourhood work / ${s.street.done.length}/${STREET_JOBS.length}`;if(p&&eligibleAt(s,p).length)document.getElementById('context').textContent=(s.mode==='foot'?'Y / Work: ':'Dismount for ')+p.name;}
 function drawMap(g,X,Z,full){const s=getState(),p=streetTarget(s);if(!p)return;g.strokeStyle='#edb066';g.lineWidth=2;g.setLineDash([4,3]);g.beginPath();g.moveTo(X(s.x),Z(s.z));g.lineTo(X(p.x),Z(p.z));g.stroke();g.setLineDash([]);g.fillStyle='#ffcc78';g.beginPath();g.arc(X(p.x),Z(p.z),full?7:4,0,7);g.fill();}
 return {open,interact,update,drawMap,close(){if(!dialog.open)return false;dialog.close();return true;},get opened(){return dialog.open;}};
}
