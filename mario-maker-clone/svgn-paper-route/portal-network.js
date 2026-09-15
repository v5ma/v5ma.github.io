/* Shared atlas presentation. No route generation, score changes or save writes. */
import {BUILD,DESTINATIONS,resolveDestination,travelGate,DEPARTURE} from './portal-network-core.mjs';
export function createAtlas({recordText}){
 const atlas=document.createElement('dialog');atlas.id='bathhouse-atlas';atlas.setAttribute('aria-labelledby','bathhouse-atlas-title');
 atlas.innerHTML='<header><div><small>SKY CYCLE / PORTAL NETWORK</small><h2 id="bathhouse-atlas-title">Destination atlas</h2></div><button id="bathhouse-close" class="delivery-btn">Back</button></header><p>Choose a finished destination. A enters the highlighted route. B returns without traveling.</p><div class="bathhouse-poster" aria-hidden="true"><span id="portal-name"></span><i id="portal-subtitle"></i></div><p id="portal-description"></p><p id="bathhouse-record" role="status"></p><p id="bathhouse-departure"></p><div class="bathhouse-actions" id="portal-destinations"></div><p>E or D-pad Down uses a nearby portal or sluice. A jumps; RT boosts; RB throws; LB whips. Your saved gameplay remaps remain in effect.</p>';
 document.body.append(atlas);
 const $=id=>atlas.querySelector('#'+id);let resumeOwned=false,focusReturn=null,pending=false,lastCue=-Infinity,selected=DESTINATIONS[0].id;
 const available=()=>window.DeliveryCampaign?.routes||[];
 const gate=id=>travelGate(id,available(),{dirty:!!window.RouteWorkshop?.state.dirty,ready:window.PaperDeliveryCampaign?.status==='ready'});
 function preview(d,audible=false){selected=d.id;atlas.style.setProperty('--portal-color',d.color);atlas.dataset.pattern=d.pattern;$('portal-name').textContent=d.name;$('portal-subtitle').textContent=d.slot+' / '+d.subtitle;$('portal-description').textContent=d.description;$('bathhouse-record').textContent=d.id==='tideglass-baths'?recordText():'All banked Sunrise progress remains in its existing save namespace.';
  for(const b of $('portal-destinations').children)b.setAttribute('aria-current',String(b.dataset.destination===selected));
  // A bounded cue reuses the existing effects bus and its mute/gain ownership.
  if(audible&&performance.now()-lastCue>900){lastCue=performance.now();if(window.SkyCycleSensory)window.SkyCycleSensory.portalCue(d.tone);else window.beep?.(d.tone,.16,'sine',.025,12);}
 }
 function refresh(){for(const b of $('portal-destinations').children){const g=gate(b.dataset.destination);b.disabled=!g.ok;b.title=g.ok?'Starts a new run':g.reason;}$('bathhouse-departure').textContent=gate(selected).ok?DEPARTURE:gate(selected).reason;}
 function travel(id){const g=gate(id);if(!g.ok){$('bathhouse-departure').textContent=g.reason;refresh();return false;}
  pending=true;resumeOwned=false;window.SkyCycleFlightDeck?.releaseForTravel?.();
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  __delivery.startRoute(g.destination.index);
  queueMicrotask(()=>{pending=false;cv.focus({preventScroll:true});});return true;
 }
 for(const d of DESTINATIONS){const b=document.createElement('button');b.id=d.button;b.className='delivery-btn';b.dataset.destination=d.id;b.textContent=d.action;b.style.setProperty('--destination-color',d.color);b.addEventListener('focus',()=>preview(d,true));b.onclick=()=>travel(d.id);$('portal-destinations').append(b);}
 function show(){if(atlas.open)return;focusReturn=document.activeElement;resumeOwned=mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu;if(resumeOwned)__delivery.act('pause');preview(DESTINATIONS.find(d=>d.id===selected)||DESTINATIONS[0]);refresh();atlas.showModal();$('bathhouse-close').focus();}
 const invalidate=()=>{resumeOwned=false;};window.addEventListener('blur',invalidate);window.addEventListener('gamepaddisconnected',invalidate);document.addEventListener('visibilitychange',()=>{if(document.hidden)invalidate();});
 $('bathhouse-close').onclick=()=>atlas.close();atlas.addEventListener('cancel',e=>{e.preventDefault();atlas.close();});atlas.addEventListener('close',()=>{if(resumeOwned&&!pending&&!document.hidden&&mode==='play'&&!won&&!document.querySelector('dialog[open]'))__delivery.act('resume');resumeOwned=false;if(!pending&&focusReturn?.isConnected)focusReturn.focus({preventScroll:true});});
 preview(DESTINATIONS[0]);
 const direct=new URLSearchParams(location.search).get('destination');
 if(direct){let attempts=0;const timer=setInterval(()=>{if(++attempts>1200){clearInterval(timer);return;}if(window.PaperDeliveryCampaign?.status==='ready'&&window.SkyCycleFlightDeck&&window.SkyCycleCompass){clearInterval(timer);if(resolveDestination(direct,available()))travel(direct);else{show();$('bathhouse-departure').textContent='Unknown destination. Choose one of the available routes below.';}}},50);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}
 return Object.freeze({build:BUILD,show,travel,get destinations(){return DESTINATIONS.map(d=>resolveDestination(d.id,available())).filter(Boolean);},get selected(){return selected;}});
}
