/* Unified discovery. Legacy T/Y/N/V still open their original interfaces.
 * A dialog hands off only after its close event: no simultaneous modal inputs. */
import {nearbyChoices,guideEntries,cityTarget,setTracked,useCity,drinkTonic,clockInfo,lampMask,LAMPS,SERVICES} from './city-core.mjs';
import {stats} from './life-core.mjs';
import {renderCycleBench,renderRoadTest} from './cycle-ui.mjs';
import {ROAD_GATES,roadTarget,cancelRoadTest} from './cycle-core.mjs';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createCityUI({getState,world,setPause,save,active,lifeUI,streetUI}){
  const dialog=document.createElement('dialog');dialog.id='city-dialog';dialog.setAttribute('aria-labelledby','city-title');
  dialog.innerHTML='<header class="city-heading"><div><p>LANTERN HOURS</p><h2 id="city-title">Your city, closer together</h2></div><button id="city-close">Return to town</button></header><nav class="city-tabs"><button data-city-tab="nearby">Nearby</button><button data-city-tab="guide">Town guide</button><button data-city-tab="pack">Satchel</button><button data-city-tab="circuit">Lamp circuit</button><button data-city-tab="roadtest">Road test</button></nav><section id="city-content"></section><p id="city-message" role="status"></p>';
  document.body.append(dialog);
  const openButton=document.createElement('button');openButton.id='city-open';openButton.textContent='Nearby people & work / I';document.getElementById('mission').append(openButton);
  const touch=document.createElement('button');touch.id='city-touch';touch.dataset.action='nearby';touch.innerHTML='<b>I</b>Nearby';document.querySelector('.action-pad').append(touch);
  const clock=document.createElement('p');clock.id='city-clock';document.getElementById('riding').prepend(clock);
  const direction=document.createElement('p');direction.id='city-direction';direction.hidden=true;document.getElementById('hud').append(direction);
  const callout=document.createElement('aside');callout.id='city-callout';callout.hidden=true;callout.innerHTML='<span id="city-callout-text" role="status"></span><button id="city-dismiss" aria-label="Dismiss the resident request">Dismiss</button>';document.getElementById('hud').append(callout);
  const $=id=>document.getElementById(id);let page='nearby',selected=null,next=null,filter='ready',search='';
  function open(which='nearby'){if(!active())return;page=which;selected=null;setPause(true);render();$('city-message').textContent='';dialog.showModal();}
  function close(){if(!dialog.open)return false;dialog.close();return true;}
  dialog.addEventListener('close',()=>{setPause(false);const fn=next;next=null;fn?.();});
  $('city-close').onclick=close;openButton.onclick=()=>open();$('city-dismiss').onclick=()=>{getState().city.callout=null;getState().city.calloutT=0;callout.hidden=true;};
  function handoff(fn){next=fn;dialog.close();}
  function message(text){$('city-message').textContent=text;}
  function lampDiagram(s){const mask=lampMask(s.city);return '<div class="city-lamps">'+LAMPS.map((p,i)=>`<div class="${mask&(1<<i)?'on':'off'}"><i></i><b>${safe(p.name.split(' / ')[0])}</b><span>${mask&(1<<i)?'LIT':'DARK'}</span></div>`).join('')+'</div>';}
  function render(){const s=getState(),c=s.city,body=$('city-content');$('city-title').textContent=page==='guide'?'Everything worth returning to':page==='pack'?'A prepared apprentice':page==='roadtest'?"Bartolo's road test":page==='circuit'?'The Lamplighter\'s Circuit':page==='service'?SERVICES.find(p=>p.id===selected)?.name||LAMPS.find(p=>p.id===selected)?.name:'Who and what is nearby';
    if(page==='nearby'){
      const list=nearbyChoices(s,world);body.innerHTML='<p>One chooser for conversations, workshop tasks, stairs and restored services. The original T / Talk and Y / Work shortcuts still work.</p>'+(s.mode!=='foot'?'<p class="city-tip">Stop and press F / Ride to dismount before taking part.</p>':'')+
        (list.length?'<div class="city-options">'+list.map(p=>`<button data-city-select="${p.kind}:${p.id}" ${s.mode!=='foot'?'disabled':''}><small>${safe(p.kind.toUpperCase())} / ${p.distance.toFixed(1)} m${p.ready?'':' / requirements inside'}</small><strong>${safe(p.name)}</strong><span>${safe(p.detail)}</span></button>`).join('')+'</div>':'<p>No interaction is within reach. Walk closer to a resident or station, or use the Town guide to mark a destination.</p>')+'<p class="city-tip">Choosing a destination never moves your character. Closed doors and different floors still matter.</p>';
    }else if(page==='guide'){
      body.innerHTML='<label class="city-search">Find a name, place or activity<input id="city-search" type="search" placeholder="Ada, Lantern, music..." maxlength="80" value="'+safe(search)+'"></label><label class="city-filter">Show<select id="city-filter"><option value="ready">Available</option><option value="active">In progress</option><option value="all">All</option><option value="completed">Completed</option></select></label><div id="city-results"></div><button data-city-clear>Clear this guide marker</button>';
      $('city-filter').value=filter;drawResults();$('city-search').oninput=e=>{search=e.target.value;drawResults();};$('city-filter').onchange=e=>{filter=e.target.value;drawResults();};
    }else if(page==='pack'){
      const st=stats(s);body.innerHTML=`<div class="city-pack"><b>${c.tonics} / 3</b><span>portable tonics</span></div><p>Vitality: ${Math.ceil(s.health)} / ${st.maxHealth}. Focus: ${Math.floor(s.life.focus)} / ${st.maxFocus}.</p><button data-city-drink>Use one tonic</button><p>Each bottle restores up to 35 vitality and 12 focus. A full character does not waste a bottle. Use them while stopped on foot, away from combat.</p><p>Learn Ada's existing recipe, then return to her working bench to bottle more for 12 earned florins each. Emilia's completed community table and the repaired garden bench also become useful places to restore yourself.</p><button data-city-route="service:brewing">Mark Ada's recipe bench</button>`;
    }else if(page==='roadtest'){body.innerHTML=renderRoadTest(s);
    }else if(page==='circuit'){
      body.innerHTML=lampDiagram(s)+`<p>${c.circuit===0?'First repair the silent crossing bell with Y / Work, then accept this civic circuit there using Nearby.':c.circuit===3?'Complete. The restored lamps remain lit each evening; the one-time reward is already recorded.':'Every switch changes the lamps named on its brass plate. Aim for all three lamps lit, then return to the crossing bell. Wrong choices cost nothing and every switch is reversible.'}</p><div class="city-options">`+LAMPS.map(p=>`<button data-city-route="lamp:${p.id}"><strong>${safe(p.name)}</strong><span>Toggles: ${safe(p.affects)}</span></button>`).join('')+'</div><button data-city-route="service:lamplighter">Mark the crossing bell</button>';
    }else renderService(s,body);
  }
  function drawResults(){const s=getState(),q=search.toLowerCase();const list=guideEntries(s,world).filter(p=>(!q||(p.name+' '+p.detail).toLowerCase().includes(q))&&(filter==='all'||filter==='completed'?filter==='all'||p.complete:filter==='active'?p.progress&&!p.complete:p.ready&&!p.complete)).sort((a,b)=>a.distance-b.distance);
    $('city-results').innerHTML='<p>'+list.length+' matches. Sorted by straight-line distance; buildings may require a street approach.</p><div class="city-options">'+list.map(p=>`<button data-city-route="${p.kind}:${p.id}" ${p.complete?'disabled':''}><small>${safe(p.kind.toUpperCase())} / ${p.complete?'COMPLETED':p.ready?'AVAILABLE':'LOCKED'} / ${Number.isFinite(p.distance)?Math.round(p.distance)+' m':'see journal'}</small><strong>${safe(p.name)}</strong><span>${safe(p.detail)}</span></button>`).join('')+'</div>';
  }
  function renderService(s,body){const p=SERVICES.find(p=>p.id===selected)||LAMPS.find(p=>p.id===selected),c=s.city;
    body.innerHTML='<p>'+safe(p.description||('Switch '+p.id+' changes '+p.affects+'. Its effects appear in the live diagram.'))+'</p>';
    if(p.job&&!s.street.done.includes(p.job)){body.innerHTML+='<p>Finish the related work first. It is already part of your neighbourhood board.</p><button data-city-work="'+p.job+'">Open the existing work here</button>';return;}
    if(p.kind==='cycle'){body.innerHTML+=renderCycleBench(s);return;}
    if(p.kind==='wait')body.innerHTML+='<p>Current town time: '+clockInfo(c).text+'. Waiting changes the light, not your location, cooldowns, combat or quest completion.</p><button data-city-action="morning">Wait until 08:00</button><button data-city-action="evening">Wait until 19:30</button>';
    else if(p.kind==='brew')body.innerHTML+='<p>Packed: '+c.tonics+' / 3. Purse: '+s.credits+' florins.</p><button data-city-action="brew">Bottle a tonic / 12 florins</button>';
    else if(p.kind==='meal'||p.kind==='rest')body.innerHTML+='<button data-city-action="use">'+(p.kind==='meal'?'Share a meal':'Sit and recover focus')+'</button>';
    else {body.innerHTML+=lampDiagram(s);if(p.kind==='circuit')body.innerHTML+=c.circuit===0?'<button data-city-action="accept">Accept the Lamplighter\'s Circuit</button>':c.circuit===3?'<p>The street is restored. No repeat reward is available.</p>':'<button data-city-action="report">Report the completed circuit</button><button data-city-action="reset">Reset the circuit / no cost</button>';else body.innerHTML+='<button data-city-action="toggle">Turn this switch</button>';body.innerHTML+='<button data-city-tab="circuit">See all switch diagrams</button>';}
  }
  dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const s=getState();
    if(b.dataset.cityTab){page=b.dataset.cityTab;message('');render();}
    if(b.dataset.citySelect){const [kind,id]=b.dataset.citySelect.split(':');if(!nearbyChoices(s,world).some(p=>p.kind===kind&&p.id===id)){message('That interaction is no longer nearby.');return;}
      if(kind==='talk')handoff(()=>lifeUI.talk(id));else if(kind==='work')handoff(()=>streetUI.open('task',id));else{selected=id;page='service';message('');render();}}
    if(b.dataset.cityWork)handoff(()=>streetUI.open('task',b.dataset.cityWork));
    if(b.dataset.cityRoute){const [kind,id]=b.dataset.cityRoute.split(':');if(setTracked(s,kind,id)){save();message('Marked on your map. Travel there normally; use the signed door and stairs for interiors.');}}
    if(b.hasAttribute('data-city-clear')){s.city.tracked=null;save();message('Guide marker cleared. The original journal markers are unchanged.');}
    if(b.hasAttribute('data-cycle-cancel')){cancelRoadTest(s);save();render();message(s.toast);}
    if(b.dataset.cityAction){const r=useCity(s,world,selected,b.dataset.cityAction);save();render();message(r.text);}
    if(b.hasAttribute('data-city-drink')){const r=drinkTonic(s,world);save();render();message(r.text);}
  });
  function update(){const s=getState(),info=clockInfo(s.city),p=cityTarget(s,world),n=nearbyChoices(s,world);clock.textContent=info.text+' / '+info.phase+' / '+s.city.tonics+' tonics';
    direction.hidden=!p;direction.textContent=p?`${p.label} / ${Math.round(Math.hypot(s.x-p.x,s.z-p.z))} m. ${p.hint}`:'';
    const test=roadTarget(s);if(test){direction.hidden=false;direction.textContent=(s.cycle.pending?'ROAD TEST COMPLETE / ':`ROAD TEST ${s.cycle.active.gate+1}/5 / `)+test.name+' / Z or touch Brake stops the bicycle';}
    if(n.length)document.getElementById('context').textContent=(s.mode==='foot'?'I / Nearby: ':'Stop and dismount: ')+n[0].name+(n.length>1?' + '+(n.length-1)+' nearby choice(s)':'');
    callout.hidden=!s.city.callout;$('city-callout-text').textContent=s.city.callout?.text||'';
  }
  function drawMap(g,X,Z,full){const state=getState();if(state.cycle.active){g.fillStyle='#9bd8b4';for(const gate of ROAD_GATES.slice(state.cycle.active.gate)){g.beginPath();g.arc(X(gate.x),Z(gate.z),full?5:4,0,7);g.fill();}}const p=cityTarget(state,world);if(!p)return;g.strokeStyle='#c7adf2';g.lineWidth=2;g.setLineDash([3,6]);g.beginPath();g.moveTo(X(getState().x),Z(getState().z));g.lineTo(X(p.x),Z(p.z));g.stroke();g.setLineDash([]);g.fillStyle='#d6bcff';g.beginPath();g.arc(X(p.x),Z(p.z),full?7:4,0,7);g.fill();}
  return {open,close,update,drawMap,get opened(){return dialog.open;}};
}
