import {ACTIVE_BUILD,readTravel,writeTravel,CruiseState} from './active-controls.js';
export const ACTIVE_HELP='Quest active: either grip interacts. LT aims; RT fires in every vehicle. Left stick travels/steers; right stick turns, and up/down changes helicopter altitude. A jumps on foot or brakes/hovers in a vehicle. B opens/closes menus; X reloads; Y boards/exits. Left-stick click toggles unlimited-duration express travel; right-stick click opens the map. Direct Water/Zapper tiles remain available.';
export class TravelControls{
 constructor(ctx){
  this.ctx=ctx;this.settings=readTravel(ctx.storage);this.cruise=new CruiseState(this.settings.multiplier);ctx.input.travel=this;ctx.fleet.controlHint=()=>ctx.xr?.active&&this.activeLayout?'LT aims, RT fires. Right-stick up/down changes flight altitude.':this.settings.xboxLayout==='active'?'Left stick pilots; LT aims, RT fires. D-pad up/down changes flight altitude.':'Hold LB and RT to use tools. RT/LT pilot; left-stick click toggles express.';
  const panel=document.createElement('div');panel.className='settings';panel.id='travel-settings';
  panel.innerHTML='<label>Quest controls <select id="travel-xr-layout"><option value="active">Active: grips interact, triggers aim/fire</option><option value="legacy">Legacy: A interacts, triggers pilot</option></select></label><label>Xbox controls <select id="travel-xbox-layout"><option value="legacy">Familiar: triggers drive, LB aims</option><option value="active">Active: stick drives, LT/RT aim/fire</option></select></label><label>Express vehicle speed <select id="travel-multiplier"><option value="2">2x / unlimited duration</option><option value="4">4x / unlimited duration</option><option value="8">8x / unlimited duration</option></select></label><label><input id="travel-guidance" type="checkbox"> Clear goal compass and world marker</label><p id="travel-help"></p><p>Click the left stick once, or press T, to toggle express speed. There is no timer, stamina drain or cooldown. Brake to stop express mode. Pausing, boarding, leaving XR or losing input also turns it off. Real collision and map boundaries still apply.</p>';
  document.getElementById('menu-dialog').append(panel);
  for(const [id,key] of [['travel-xr-layout','xrLayout'],['travel-xbox-layout','xboxLayout'],['travel-multiplier','multiplier'],['travel-guidance','guidance']]){
   const e=document.getElementById(id);if(e.type==='checkbox')e.checked=this.settings[key];else e.value=this.settings[key];
   e.onchange=()=>{this.settings[key]=e.type==='checkbox'?e.checked:key==='multiplier'?Number(e.value):e.value;this.cruise.multiplier=this.settings.multiplier;this.reset();ctx.input.clear();ctx.xr?.clear();if(!writeTravel(ctx.storage,this.settings))ctx.notify('Travel preference could not be saved. Existing progress is unchanged.');this.help();};
  }
  this.button=document.createElement('button');this.button.id='express-button';this.button.onclick=()=>this.toggle();
  const actions=document.querySelector('#hud .actions'),telemetry=document.querySelector('#hud .telemetry');
  (actions||telemetry||document.getElementById('hud')).append(this.button);if(!actions)this.button.style.cssText='position:absolute;bottom:53px;right:0;padding:5px 8px;font-size:10px;white-space:nowrap';
  // Keep the original Classic controller guide explicit about legacy bindings.
  const guide=document.querySelector('#controls-dialog .control-copy');
  if(guide){const current=document.createElement('p');current.id='travel-guide-help';guide.prepend(current);for(const p of guide.querySelectorAll('p')){const b=p.querySelector('b');if(b?.textContent==='Quest VR.')b.textContent='Legacy Quest preset.';if(b?.textContent==='Move and look.')p.innerHTML=p.innerHTML.replace('Click the left stick to sprint or boost.','On foot, hold left-stick click to sprint. In a vehicle, click it once to toggle Express speed.');}}
  this.help();this.update();
 }
 help(){document.getElementById('travel-help').textContent=ACTIVE_HELP+' Xbox Active: left stick drives/steers, D-pad up/down raises/lowers the helicopter; A interacts, X reloads, Y boards, B brakes, View opens map. Familiar bindings remain selectable.';const guide=document.getElementById('travel-guide-help');if(guide)guide.textContent='Current travel profiles. '+document.getElementById('travel-help').textContent+' Choose either profile in Settings. The following trigger-piloting instructions describe the Familiar Xbox and Legacy Quest presets.';}
 get activeLayout(){return this.settings.xrLayout==='active';}
 reset(){this.cruise.reset();}
 toggle(){const mode=this.ctx.fleet.mode;if(this.ctx.modal()||mode==='foot'){this.ctx.notify(mode==='foot'?'Board a vehicle for express travel. On foot, hold left stick click or Shift to run.':'Close the menu before engaging express travel.');return;}const active=this.cruise.toggle(mode);this.ctx.notify(active?`Express ${this.settings.multiplier}x engaged. Unlimited duration; brake cancels.`:'Normal vehicle speed.');this.update();}
 apply(v,mode){this.cruise.apply(v,mode,!!this.ctx.modal()||document.hidden||this.ctx.xr?.invisible===true);return v;}
 update(){const mode=this.ctx.fleet.mode,active=this.cruise.active;this.button.disabled=mode==='foot';this.button.textContent=active?`EXPRESS ${this.settings.multiplier}x ON / LS or T: off`:`LS / T: Express ${this.settings.multiplier}x`;this.button.setAttribute('aria-pressed',String(active));}
 snapshot(){return {build:ACTIVE_BUILD,...this.settings,express:this.cruise.active,durationLimit:null};}
}
