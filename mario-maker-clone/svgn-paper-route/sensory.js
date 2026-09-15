/* Quiet Water: bounded sound and optional notices, using the original game and mixer. */
import {STORE,sanitize,transientGain,createNoticeState,admitNotice,waterEvents,ambienceGain,noticePlacement} from './sensory-core.mjs';
import {createWaterAudio} from './water-audio.mjs';
let settings=sanitize(null),saveOK=true,epoch=0,previous=null,rig=null,rigContext=null,lastLevel=-1,lastCue=-Infinity,optionalVisible=false,disposed=false,lastNoticeLayout=0;
const notice=createNoticeState(),counts={arrival:0,sluice:0,waterline:0},originalToast=window.toast;
try{settings=sanitize(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{saveOK=false;}
const $=id=>document.getElementById(id);
const onContextState=()=>{if(rigContext?.state!=='running')window.__score?.clearEffects?.();lastLevel=-1;sync();};
const active=()=>typeof mode!=='undefined'&&mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu&&!document.hidden;
function placeNotice(){
  const el=$('toast'),parent=el?.offsetParent;if(!el||!parent)return false;
  const boxes=[...document.querySelectorAll('#bathhouse-objective,#bathhouse-use,#cloud-hud .cloud-flight-status')].filter(n=>!n.hidden&&n.getClientRects().length).map(n=>n.getBoundingClientRect());
  const bottom=noticePlacement(parent.getBoundingClientRect(),el.getBoundingClientRect().height,boxes);
  if(bottom===null){el.classList.remove('show');return false;}
  el.style.setProperty('--sensory-notice-bottom',bottom+'px');el.style.bottom=bottom+'px';el.style.transition='none';return true;
}
function notify(message,options={}){
  const optional=options?.optional===true,key=options?.key??message;
  if(optional){if(!active()||!admitNotice(notice,key,performance.now(),settings))return false;}
  else notice.essentialUntil=performance.now()+2200;
  optionalVisible=optional;const el=$('toast');if(el){el.toggleAttribute('data-sensory-optional',optional);if(!optional){el.style.removeProperty('bottom');el.style.removeProperty('transition');}}originalToast?.(message);
  if(optional&&!placeNotice()){notice.shown--;notice.suppressed++;return false;}return true;
}
window.toast=notify; // Unknown/legacy notices remain essential, including every save and input warning.
function syncControls(){
  for(const k of ['notices','transients','ambience']){const el=$('sensory-'+k);if(el)el.value=k==='ambience'?Math.round(settings[k]*100):settings[k];}
  if($('sensory-save'))$('sensory-save').textContent=saveOK?'Comfort choices save on this device.':'Saving unavailable. Comfort choices apply to this session only; existing saves are untouched.';
}
function changed(){
  if(optionalVisible&&settings.notices==='essential'){$('toast')?.classList.remove('show');optionalVisible=false;}
  window.__score?.clearEffects?.();lastLevel=-1;syncControls();sync();
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(settings));saveOK=true;}catch{saveOK=false;}changed();}
function mount(){
  const dialog=$('score-dialog');if(!dialog||$('sensory-settings'))return;
  const section=document.createElement('section');section.id='sensory-settings';section.setAttribute('aria-labelledby','sensory-title');
  section.innerHTML='<h3 id="sensory-title">Quiet Water / comfort</h3><p>Control optional water notices and effect sharpness. Save warnings, controller warnings and riding guidance stay visible. Water ambience follows Effects and stops during pause or travel.</p><label for="sensory-notices">Optional notices</label><select id="sensory-notices" aria-label="Optional notices"><option value="balanced">Balanced</option><option value="quiet">Quiet</option><option value="essential">Essential only</option></select><label for="sensory-transients">Effect intensity</label><select id="sensory-transients" aria-label="Effect intensity"><option value="gentle">Gentle</option><option value="soft">Soft</option><option value="full">Full</option></select><label for="sensory-ambience">Water ambience</label><input id="sensory-ambience" aria-label="Water ambience" type="range" min="0" max="100" step="1"><p id="sensory-save" role="status"></p>';
  const form=dialog.querySelector('form');dialog.insertBefore(section,form);
  for(const k of ['notices','transients','ambience'])$("sensory-"+k).addEventListener(k==='ambience'?'input':'change',e=>{settings=sanitize({...settings,[k]:k==='ambience'?Number(e.target.value)/100:e.target.value});save();});
  syncControls();
}
function portalCue(tone){
  const gap=settings.notices==='quiet'?3500:1200;
  if(settings.notices==='essential'||document.hidden||performance.now()-lastCue<gap)return;
  lastCue=performance.now();window.beep?.(tone,.16,'sine',.025,12);
}
function sync(){
  if(disposed)return;
  if(optionalVisible&&$('toast')?.classList.contains('show')&&performance.now()-lastNoticeLayout>=160){lastNoticeLayout=performance.now();placeNotice();}
  const score=window.__score,state=window.SkyCycleBathhouse?.state;
  const sample={route:window.DeliveryCampaign?.routes[window.__delivery?.state.route]?.id,epoch,active:active(),opened:!!state?.opened,drain:state?.drain||0};
  const context=score?.context,level=ambienceGain(sample,settings,{muted:typeof muted==='undefined'||muted,effects:score?.prefs.effects??0,state:context?.state});
  if(context&&score?.effectsBus&&context!==rigContext){rigContext?.removeEventListener('statechange',onContextState);rig?.dispose();rigContext=context;rig=createWaterAudio(context,score.effectsBus);context.addEventListener('statechange',onContextState);lastLevel=-1;}
  if(previous?.active&&!sample.active)score?.clearEffects?.();
  if(rig&&level!==lastLevel){try{rig.setLevel(level);lastLevel=level;}catch{rig.stop();lastLevel=0;}}
  for(const event of waterEvents(previous,sample)){
    counts[event]++;
    if(event==='arrival'){window.beep?.(262,.24,'sine',.035,65);notify('Tideglass Baths / the dry promenade leads to the depot.',{optional:true,key:'water-arrival'});}
    else if(event==='sluice'){window.beep?.(155,.35,'triangle',.045,-35);notify('Sluice open / Mirror Pool is draining.',{optional:true,key:'water-sluice'});}
    else{window.beep?.(392,.3,'sine',.04,80);notify('Waterline revealed / the optional rail is ready.',{optional:true,key:'waterline-ready'});}
  }
  previous=sample;
}
const oldStart=window.startPlay;window.startPlay=function(...args){epoch++;const result=oldStart.apply(this,args);sync();return result;};
const oldTick=window.tick;window.tick=function(...args){const result=oldTick.apply(this,args);sync();return result;};
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./sensory.css',import.meta.url);document.head.append(style);
mount();const observer=new MutationObserver(()=>{mount();});observer.observe(document.body,{childList:true});
window.addEventListener('skycycle:mix',()=>{lastLevel=-1;sync();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){rig?.stop();window.__score?.clearEffects?.();lastLevel=-1;}sync();});
window.addEventListener('storage',event=>{if(event.key===STORE){try{settings=sanitize(JSON.parse(event.newValue||'null'));saveOK=true;changed();}catch{saveOK=false;syncControls();}}});
window.addEventListener('pagehide',()=>{disposed=true;rigContext?.removeEventListener('statechange',onContextState);rig?.dispose();rig=null;rigContext=null;window.__score?.clearEffects?.();observer.disconnect();});
window.addEventListener('pageshow',event=>{if(event.persisted){disposed=false;lastLevel=-1;previous=null;mount();observer.observe(document.body,{childList:true});sync();}});
window.SkyCycleSensory=Object.freeze({version:'0.22.0',get settings(){return {...settings};},get saveOK(){return saveOK;},get intensity(){return transientGain(settings);},portalCue,notify,
 get diagnostics(){return {audio:rig?.diagnostics||{sources:0,nodes:0,starts:0},level:lastLevel,notices:{shown:notice.shown,suppressed:notice.suppressed,keys:notice.keys.size},events:{...counts},epoch};}});
sync();
