import {DioramaXR as SharedXR} from './diorama-xr.js?v=rotunda1';

export const CLASSIC_XR_ENTRY_BUILD='classic-xr-entry-20260918.1';
const views=['first-person-vr','diorama-vr','diorama-ar'];
export function entryAvailability({ready=false,secure=true,api=false,vr=false,ar=false,pending=false,active=false}={}){
 const allowed=ready&&secure&&api&&!pending&&!active;
 return {vr:!!(allowed&&vr),ar:!!(allowed&&ar),message:!ready?'Checking headset support...':!secure?'Open the HTTPS game page in your headset browser. Immersive modes need a secure page.':!api?'This browser does not expose WebXR. Open this same Classic Reserve page in your Quest browser; desktop play remains available.':pending?'Headset permission or session entry is in progress.':active?'Headset mode is active. Use B for the menu, or Leave XR to return to the browser.':vr&&ar?'Choose a mode above. VR and AR use this same reserve, its missions, vehicles and saves.':vr?'VR is available here. AR passthrough is not reported by this browser.':ar?'AR diorama is available here. This browser is not reporting an immersive VR session.':'No immersive session is reported. Open this page directly in the headset browser, then Check headset again.'};
}

// Classic's import-map adapter adds entry controls only. Shared XR simulation,
// portal masks, hand/controller input, and Tidegate's implementation stay intact.
export class DioramaXR extends SharedXR {
 constructor(ctx){
  super(ctx);
  const intro=document.getElementById('classic-xr-entry');
  if(!intro)return;
  const menu=intro.cloneNode(true);menu.id='classic-xr-menu';
  menu.setAttribute('aria-labelledby','classic-xr-menu-title');
  menu.querySelector('h2').id='classic-xr-menu-title';
  document.querySelector('#menu-dialog [data-close]').after(menu);
  this.entryPanels=[intro,menu];
  // The old appended entry sat below a fixed-height, non-scrollable intro.
  document.getElementById('xr-intro').hidden=true;
  for(const panel of this.entryPanels){
   for(const button of panel.querySelectorAll('[data-classic-xr-view]'))button.onclick=()=>this.launchClassic(button.dataset.classicXrView);
   panel.querySelector('[data-classic-xr-recheck]').onclick=()=>{this.entryFailure='';this.entrySupportReady=false;this.syncEntry();this.checkSupport();};
  }
  const header=document.getElementById('classic-xr-button');header.disabled=false;
  header.onclick=()=>{
   const initial=!document.getElementById('intro').hidden;
   if(!initial&&!document.getElementById('menu-dialog').open)document.getElementById('menu-button').click();
   const panel=initial?intro:menu;
   panel.scrollIntoView({block:'nearest'});
   const button=panel.querySelector('[data-classic-xr-view]:not(:disabled)')||panel.querySelector('[data-classic-xr-recheck]');
   button.focus({preventScroll:true});
  };
  this.syncEntry();
 }
 async checkSupport(){
  await super.checkSupport();this.entrySupportReady=true;this.syncEntry();
 }
 refreshButtons(){super.refreshButtons();this.syncEntry();}
 syncEntry(){
  if(!this.entryPanels)return;
  const availability=entryAvailability({ready:this.entrySupportReady,secure:globalThis.isSecureContext!==false,api:!!navigator.xr,vr:this.supported,ar:this.supportedAR,pending:this.pending,active:this.active});
  for(const panel of this.entryPanels){
   for(const button of panel.querySelectorAll('[data-classic-xr-view]')){
    const ar=button.dataset.classicXrView==='diorama-ar';button.disabled=!(ar?availability.ar:availability.vr);
    button.title=button.disabled?availability.message:'Enter this mode in the regular Classic Reserve game';
   }
   panel.querySelector('[data-classic-xr-recheck]').disabled=!!this.pending||!!this.active;
   panel.querySelector('[data-classic-xr-status]').textContent=this.entryFailure||availability.message;
  }
 }
 async launchClassic(view){
  if(!views.includes(view)||this.pending||this.active)return;
  if(!(view==='diorama-ar'?this.supportedAR:this.supported)){this.syncEntry();return;}
  this.entryFailure='';
  const initial=!document.getElementById('intro').hidden;
  const select=document.getElementById('xr-presentation');select.value=view;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  // Do not await a capability query before requestSession: preserve the click's
  // browser user activation. The existing handler owns errors and XR lifecycle.
  const request=this.enter();this.syncEntry();
  await request;
  if(this.active){
   if(initial){if(!document.getElementById('intro').hidden)document.getElementById('start-button').click();}
   else if(this.ctx.modal())this.ctx.action('back');
   this.clear();
  }else this.entryFailure='Headset entry was not completed. Allow the browser prompt and try again. Desktop play and saved progress are unchanged.';
  this.syncEntry();
 }
 snapshot(){return {...super.snapshot(),launcherBuild:CLASSIC_XR_ENTRY_BUILD};}
}
