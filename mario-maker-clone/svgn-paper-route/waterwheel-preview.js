/* Explicit Workshop preview: original campaign and existing record owners stay intact. */
import {build,PREVIEW,REVISION,TRANSFERS} from './waterwheel-layout-core.mjs';
import {populate,draw2D} from './waterwheel-preview-art.mjs';
const BACKUP='svgn.skycycle.waterwheel-preview-backup.v1';
const $=id=>document.getElementById(id);
let resume=false,focus=null;
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./waterwheel-preview.css',import.meta.url);document.head.append(style);
const panel=document.createElement('dialog');panel.id='ww-preview';panel.setAttribute('aria-labelledby','ww-preview-title');
panel.innerHTML='<small>SKY CYCLE / CHAPTER DESIGN LAB</small><h2 id="ww-preview-title">Waterwheel Boulevard / revision 2</h2><p>A new South Quay, Parcel Market, Service Bridge, Millworkers Court and Wheelhouse Depot. Try the delivery road, the short porch detour, or the connected express line.</p><p>This is an editable development preview, not a replacement for your campaign. Preview finishes do not award medals, badges, stamps, daily results or ghost records. The larger braking fork, whip link and human playtest gates remain unfinished.</p><p id="ww-preview-status" role="status">Save or export any dirty Workshop draft before opening another document.</p><div class="ww-preview-actions"><button id="ww-preview-ride">Ride the new layout</button><button id="ww-preview-ground">Ride with the sky hidden</button><button id="ww-preview-edit">Open editable blueprint</button><button id="ww-preview-restore">Restore previous blueprint</button><button id="ww-preview-back">Back</button></div>';
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
function begin(groundOnly=false,editOnly=false){
 if(!safe())return;
 try{
  const current=RouteWorkshop.state.doc;
  if(!current?.extra?.gp?.waterwheel?.preview){
   const code=current?WorkshopCore.encode(current):levelCode();WorkshopCore.decode(code);
   localStorage.setItem(BACKUP,JSON.stringify({version:1,code}));
  }
  const code=GroundCampaign.encode(build(__gameRefs.T,{groundOnly}));WorkshopCore.decode(code);
  resume=false;panel.close();window.SkyCycleFlightDeck?.releaseForTravel();RouteWorkshop.open(code);
  if(!editOnly)RouteWorkshop.action('test');
 }catch(error){note('Preview could not start safely: '+error.message+'. Existing campaign records are unchanged.');}
}
function restore(){
 if(!safe())return;
 try{const saved=JSON.parse(localStorage.getItem(BACKUP)||'null');if(saved?.version!==1||typeof saved.code!=='string')throw Error('No previous blueprint backup');WorkshopCore.decode(saved.code);resume=false;panel.close();RouteWorkshop.open(saved.code);window.SkyCycleFlightDeck?.resetInput();}
 catch(error){note(error.message+'. No current document was changed.');}
}
$('ww-preview-ride').onclick=()=>begin();$('ww-preview-ground').onclick=()=>begin(true);$('ww-preview-edit').onclick=()=>begin(false,true);$('ww-preview-restore').onclick=restore;$('ww-preview-back').onclick=()=>panel.close();
panel.addEventListener('cancel',e=>{e.preventDefault();panel.close();});panel.addEventListener('close',()=>{if(resume&&!document.hidden&&mode==='play'&&!won&&!__delivery.state.menu&&!document.querySelector('dialog[open]'))__delivery.act('resume');resume=false;if(focus?.isConnected&&focus.getClientRects().length)focus.focus({preventScroll:true});window.SkyCycleFlightDeck?.resetInput();});
window.addEventListener('blur',()=>{resume=false;});document.addEventListener('visibilitychange',()=>{if(document.hidden)resume=false;});
function mount(){for(const [host,id] of [[document.querySelector('#delivery-menu .delivery-hero'),'ww-preview-open'],[document.querySelector('#route-workshop .maker-library details'),'ww-preview-workshop']]){if(!host||$(id))continue;const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='Waterwheel r2 design preview';b.setAttribute('aria-haspopup','dialog');b.onclick=show;host.append(b);}}
const watcher=new MutationObserver(mount);watcher.observe(document.body,{subtree:true,childList:true});mount();
const prior=GroundArt.populate;window.GroundArt={...GroundArt,populate(args){prior(args);if(args.course.gp?.waterwheel?.preview)populate(args);}};
window.Waterwheel2D=Object.freeze({draw:draw2D});
window.SkyCycleWaterwheel=Object.freeze({id:PREVIEW,revision:REVISION,show,build,get transfers(){return TRANSFERS.map(x=>({...x}));}});
window.addEventListener('pagehide',()=>watcher.disconnect());window.addEventListener('pageshow',e=>{if(e.persisted){watcher.observe(document.body,{subtree:true,childList:true});mount();}});
