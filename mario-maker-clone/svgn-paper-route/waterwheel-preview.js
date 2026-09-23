/* Explicit Workshop preview: original campaign and existing record owners stay intact. */
import {build,PREVIEW,REVISION,TRANSFERS} from './waterwheel-layout-core.mjs';
import {populate,draw2D} from './waterwheel-preview-art.mjs';
import './depth-path.mjs';
import {PROFILE} from './depth-path-core.mjs';
import {noticePlacement} from './sensory-core.mjs';
const BACKUP='svgn.skycycle.waterwheel-preview-backup.v1';
const $=id=>document.getElementById(id);
let resume=false,focus=null,noticeFrame=0;
// Preview dialogue must not obscure the existing riding HUD. Keep every warning;
// only move its box. Outside the preview the original toast layout owns it again.
function fitNotice(){
 const el=$('toast'),host=el?.offsetParent;
 if(!el)return;
 if(!window.RouteWorkshop?.testing||!RouteWorkshop.state.doc?.extra?.gp?.waterwheel?.preview||!host){el.removeAttribute('data-waterwheel-notice');return;}
 const blockers=[...document.querySelectorAll('#cloud-hud .cloud-flight-status,#bathhouse-objective,#bathhouse-use')].filter(n=>!n.hidden&&n.getClientRects().length).map(n=>n.getBoundingClientRect());
 const bottom=noticePlacement(host.getBoundingClientRect(),el.getBoundingClientRect().height,blockers);
 if(bottom===null){el.removeAttribute('data-waterwheel-notice');return;}
 el.style.setProperty('--waterwheel-notice-bottom',bottom+'px');el.setAttribute('data-waterwheel-notice','');
}
function scheduleNotice(){fitNotice();cancelAnimationFrame(noticeFrame);noticeFrame=requestAnimationFrame(fitNotice);}
const previousToast=window.toast;
window.toast=function(...args){const result=previousToast.apply(this,args);scheduleNotice();return result;};
const noticeObserver=new MutationObserver(scheduleNotice);
function observeNotice(){const el=$('toast');if(el)noticeObserver.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});}
observeNotice();window.addEventListener('resize',scheduleNotice);
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./waterwheel-preview.css',import.meta.url);document.head.append(style);
const panel=document.createElement('dialog');panel.id='ww-preview';panel.setAttribute('aria-labelledby','ww-preview-title');
panel.innerHTML='<small>SKY CYCLE / CHAPTER DESIGN LAB</small><h2 id="ww-preview-title">Waterwheel Boulevard / revision 2</h2><p>A new South Quay, Parcel Market, Service Bridge, Millworkers Court and Wheelhouse Depot. Try the delivery road or short porch. At the express runway, keep speed for the high gallery or brake and release for canal deliveries.</p><p>The curved 2.5D option sweeps the market road away and back through real depth in AR, VR and desktop 3D. Currentworks mesh clouds and island gardens frame the bends; these background gardens are scenery, not extra collision platforms. Classic materials or 2D return to the earlier presentation. The same controls and physics apply; 2D remains straight. This is an editable development preview, not a replacement for your campaign. Preview finishes do not award medals, badges, stamps, daily results or ghost records. The new optional Mill Bell anchor links the high crescent to the gallery: hold your mapped whip action near the bell and release while rising right. Keep speed for the original no-whip crossing, or recover on the lower road. Campaign promotion and physical-device approval remain unfinished.</p><p id="ww-preview-status" role="status">Save or export any dirty Workshop draft before opening another document.</p><div class="ww-preview-actions"><button id="ww-preview-curve">Ride curved 2.5D layout</button><button id="ww-preview-ride">Ride the new layout</button><button id="ww-preview-ground">Ride with the sky hidden</button><button id="ww-preview-edit">Open editable blueprint</button><button id="ww-preview-restore">Restore previous blueprint</button><button id="ww-preview-back">Back</button></div>';
document.body.append(panel);
function note(text){$('ww-preview-status').textContent=text;}
function show(){if(panel.open)return;resume=mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu;focus=document.activeElement;if(resume)__delivery.act('pause');panel.showModal();$('ww-preview-ride').focus();window.SkyCycleFlightDeck?.resetInput();}
function safe(){
 const workshop=window.RouteWorkshop;
 if(!workshop){note('The original Workshop is still loading. No document was changed.');return false;}
 if(workshop.testing){note('Return to Workshop from the current playtest first.');return false;}
 if(workshop.state.dirty){note('Save or export your unsaved Workshop draft first. Your draft has not been replaced.');return false;}
 if(mode==='edit'&&!workshop.active&&!__delivery.state.menu){note('Open the Workshop and save the current legacy-editor document before switching.');return false;}
 return true;
}
function begin(groundOnly=false,editOnly=false,curved=false){
 if(!safe())return;
 try{
  const current=RouteWorkshop.state.doc;
  if(!current?.extra?.gp?.waterwheel?.preview){
   const code=current?WorkshopCore.encode(current):levelCode();WorkshopCore.decode(code);
   localStorage.setItem(BACKUP,JSON.stringify({version:1,code}));
  }
  const document=build(__gameRefs.T,{groundOnly,whipLink:!groundOnly});
  if(curved)document.gp.waterwheel.depthPath={version:PROFILE.version,id:PROFILE.id};
  const code=GroundCampaign.encode(document);WorkshopCore.decode(code);
  resume=false;panel.close();window.SkyCycleFlightDeck?.releaseForTravel();RouteWorkshop.open(code);
  if(!editOnly)RouteWorkshop.action('test');
 }catch(error){note('Preview could not start safely: '+error.message+'. Existing campaign records are unchanged.');}
}
function restore(){
 if(!safe())return;
 try{const saved=JSON.parse(localStorage.getItem(BACKUP)||'null');if(saved?.version!==1||typeof saved.code!=='string')throw Error('No previous blueprint backup');WorkshopCore.decode(saved.code);resume=false;panel.close();RouteWorkshop.open(saved.code);window.SkyCycleFlightDeck?.resetInput();}
 catch(error){note(error.message+'. No current document was changed.');}
}
$('ww-preview-curve').onclick=()=>begin(false,false,true);
$('ww-preview-ride').onclick=()=>begin();$('ww-preview-ground').onclick=()=>begin(true);$('ww-preview-edit').onclick=()=>begin(false,true);$('ww-preview-restore').onclick=restore;$('ww-preview-back').onclick=()=>panel.close();
panel.addEventListener('cancel',e=>{e.preventDefault();panel.close();});panel.addEventListener('close',()=>{if(resume&&!document.hidden&&mode==='play'&&!won&&!__delivery.state.menu&&!document.querySelector('dialog[open]'))__delivery.act('resume');resume=false;if(focus?.isConnected&&focus.getClientRects().length)focus.focus({preventScroll:true});window.SkyCycleFlightDeck?.resetInput();});
window.addEventListener('blur',()=>{resume=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden)resume=false;});
function labelPreviewResult(){
 const result=document.querySelector('#delivery-results.open');
 if(!result||!window.RouteWorkshop?.testing||!RouteWorkshop.state.doc?.extra?.gp?.waterwheel?.preview||result.querySelector('#ww-preview-result-note'))return;
 const stats=result.querySelector('.delivery-result-stats');if(!stats)return;
 const note=document.createElement('p');note.id='ww-preview-result-note';note.setAttribute('role','status');note.style.gridColumn='1 / -1';note.textContent='Waterwheel design preview complete. These are playtest results only; no campaign medals, career records or layout records were awarded. Return to Workshop to keep editing.';stats.prepend(note);
 const medal=result.querySelector('.medal');if(medal)medal.hidden=true;
 const kicker=result.querySelector('.delivery-kicker');if(kicker)kicker.textContent='DESIGN PREVIEW COMPLETE / NO CAMPAIGN AWARD';
}
function mount(){labelPreviewResult();scheduleNotice();for(const [host,id] of [[document.querySelector('#delivery-menu .delivery-hero'),'ww-preview-open'],[document.querySelector('#route-workshop .maker-library details'),'ww-preview-workshop']]){if(!host||$(id))continue;const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='Waterwheel r2 design preview';b.setAttribute('aria-haspopup','dialog');b.onclick=show;host.append(b);}}
const watcher=new MutationObserver(mount);watcher.observe(document.body,{subtree:true,childList:true});mount();
const prior=GroundArt.populate;window.GroundArt={...GroundArt,populate(args){prior(args);if(args.course.gp?.waterwheel?.preview)populate(args);}};
window.Waterwheel2D=Object.freeze({draw:draw2D});
window.SkyCycleWaterwheel=Object.freeze({id:PREVIEW,revision:REVISION,show,build,get transfers(){return TRANSFERS.map(x=>({...x}));}});
window.addEventListener('pagehide',()=>{watcher.disconnect();noticeObserver.disconnect();cancelAnimationFrame(noticeFrame);});window.addEventListener('pageshow',e=>{if(e.persisted){watcher.observe(document.body,{subtree:true,childList:true});observeNotice();mount();}});
