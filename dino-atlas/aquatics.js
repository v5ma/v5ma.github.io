import * as T from './vendor/three.module.js';
import {AQUATICS_BUILD,LAB,AQUA_HARBOR,HOME_DOCK,ROUTE,POINTS,STEPS,readAquatics,saveAquatics,beginAquatics,advanceAquatics,tickAquatics,insideLab,inBasin,inArchive,near,gap,movementInLab,actionAtAquatics,shallowSafe} from './aquatics-data.js';
const $=id=>document.getElementById(id);
const labels={'boat-service':'Request patrol boat at Wetland Dock','breaker':'Restore pool safety circuit',intake:'Operate seawater intake',pump:'Operate drain pump',archive:'Recover habitat archive',sample:'Recover sealed sample case',deliver:'Deliver Pelagic research cases'};
export class AquaticsMission{
 constructor(ctx){
  this.ctx=ctx;this.s=ctx.progress;this.world=ctx.world;this.lastStage=this.s.stage;this.splashClock=0;this.pumpAudio=null;this.pumpStarts=0;this.safePoint={x:-395,y:3.65,z:21};this.safetyTimer=0;this.rewardPending=false;
  ctx.fleet.extraHarbors=[...(ctx.fleet.extraHarbors||[]).filter(h=>h.id!==AQUA_HARBOR.id),AQUA_HARBOR];
  ctx.fleet.person.terrain=(p)=>insideLab(p)?movementInLab(this.s,p):{scale:1};
  this.installUI();this.update(0);this.world.update(this.s,0,ctx.fleet.position,ctx.settings);
  this.reconcileReward();
 }
 save(){return saveAquatics(this.ctx.storage,this.s);}
 persist(){this.save();this.ctx.save?.();}
 begin(){
  if(!beginAquatics(this.s)){this.ctx.notify('Pelagic recovery is complete. The drained research facility remains open to explore.');return;}
  this.ctx.director.suspend();this.ctx.herds.pause();this.ctx.ranch.pauseTracking();this.ctx.close();this.persist();this.ctx.radio(STEPS[this.s.stage].detail);
 }
 suspend(){this.s.active=false;this.s.pumping=false;this.save();}
 installUI(){
  document.querySelector('#menu-dialog .menu-grid')?.insertAdjacentHTML('afterbegin','<button id="menu-aquatics">Water mission: Pelagic Recovery</button>');
  document.querySelector('#outpost-dialog .entry-list')?.insertAdjacentHTML('afterbegin','<button id="outpost-aquatics">Pelagic research assignment</button>');
  document.body.insertAdjacentHTML('beforeend',`<dialog id="aquatics-dialog" aria-labelledby="aquatics-title"><p class="eyebrow">COASTAL OPERATIONS / FLOODED RESEARCH</p><h2 id="aquatics-title">Pelagic Recovery.</h2><p>Reach the isolated aquatic-research station by boat. Restore power, close the seawater intake, drain the tiled pool, and wade into the archive wing to recover two sealed research cases. Return them to Wetland Dock for 1,200 credits, awarded once.</p><p id="aquatics-progress"></p><div class="entry-list"><button class="primary" id="aquatics-start">Accept or continue the assignment / A</button><button id="aquatics-suspend">Suspend assignment and explore</button><button id="aquatics-recover">Recover to the marked safe landing</button><button id="aquatics-close">Return to play / B</button></div><div class="settings"><label><input type="checkbox" id="aquatics-inspection">First-person inspection inside this facility</label><label><input type="checkbox" id="aquatics-refraction">Pool refraction / one nearby scene pass</label></div><p><b>Controls.</b> RT sails and LT reverses. Y boards or exits at a pier. Left stick moves on foot; right stick looks. A operates controls and collects cases. X still reloads. B closes every panel. Walk up the real entry stairs; no vehicle fits inside.</p><p><b>Safety.</b> The deep pool is closed for maintenance until drained. This release includes shallow wading, not swimming, diving or drowning. Recovery explicitly moves only your ranger to the dry landing; it does not erase progress or move your parked vehicles.</p><p class="pad-help">D-pad navigates. A selects. B closes. Right stick scrolls. Reduced Motion freezes decorative caustics and ripples, not the functional drainage indicator.</p></dialog><dialog id="aquatics-control" aria-labelledby="aquatics-control-title"><p class="eyebrow">PELAGIC ENGINEERING</p><h2 id="aquatics-control-title"></h2><p id="aquatics-control-copy"></p><div class="entry-list"><button class="primary" id="aquatics-control-use"></button><button id="aquatics-control-close">Return to the facility / B</button></div></dialog><aside id="aquatics-gauge" hidden aria-live="polite"><strong>PELAGIC / WATER LEVEL</strong><span id="aquatics-depth"></span><progress id="aquatics-water" max="2.25" value="2.25" aria-label="Pool water depth"></progress><small id="aquatics-status"></small></aside>`);
  const style=document.createElement('style');style.textContent=`#aquatics-gauge{position:fixed;right:25px;top:325px;width:235px;z-index:14;padding:14px;background:#173f38ee;color:#d8efe4;border:1px solid #8dcbbb66;border-radius:9px;font:12px/1.5 system-ui;pointer-events:none}#aquatics-gauge strong,#aquatics-gauge span,#aquatics-gauge small{display:block;margin:4px 0}#aquatics-gauge span{font-size:22px;color:#d6eee2}body[data-aquatics="inside"] #ranch-status{display:none}body[data-aquatics="inside"] .telemetry{opacity:.65}@media(max-width:720px){#aquatics-gauge{top:auto;bottom:285px;right:10px;width:160px;padding:8px;font-size:9px}#aquatics-gauge span{font-size:15px}}`;
  document.head.appendChild(style);
  $('menu-aquatics').onclick=$('outpost-aquatics').onclick=()=>this.open();$('aquatics-start').onclick=()=>this.begin();
  $('aquatics-suspend').onclick=()=>{this.suspend();this.ctx.close();this.ctx.notify('Pelagic assignment suspended. The water level, recovered cases and boat remain saved.');};
  $('aquatics-recover').onclick=()=>this.recover();$('aquatics-close').onclick=$('aquatics-control-close').onclick=()=>this.ctx.close();
  for(const k of ['inspection','refraction']){$('aquatics-'+k).checked=this.s[k];$('aquatics-'+k).onchange=e=>{this.s[k]=e.target.checked;this.save();};}
  for(const id of ['aquatics-dialog','aquatics-control']){$(id).addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});$(id).addEventListener('close',()=>this.ctx.input.clear());}
  // Exclusive task tracking: old activities can be selected without the new one
  // masking their HUD. Suspending retains the partial drainage and samples.
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-job],[data-track],#campaign-track,#pen-track,#aaa-director-start,#aaa-director-resume,#herds-study-start'))this.suspend();},true);
 }
 open(){
  $('aquatics-progress').textContent=this.s.completed?'Assignment completed. The pool stays drained, and both cases remain recorded.':`Stage ${this.s.stage+1} / 6: ${STEPS[this.s.stage]?.name}. Water ${this.s.water.toFixed(2)} m. ${this.s.active?'Active.':'Ready to continue.'}`;
  $('aquatics-start').disabled=this.s.completed;$('aquatics-recover').disabled=this.s.stage<1;
  this.ctx.show('aquatics-dialog');
 }
 task(){if(!this.s.active)return null;const f=this.ctx.fleet,step=STEPS[this.s.stage];let target,detail=step.detail;
  if(this.s.stage===0)target=f.mode==='boat'?ROUTE[this.s.leg]:HOME_DOCK.land;
  else if(this.s.stage===1)target=f.mode==='boat'?AQUA_HARBOR.boat:POINTS.breaker;
  else if(this.s.stage===2)target=POINTS.intake;
  else if(this.s.stage===3){target=POINTS.pump;detail=this.s.pumping?`Pump running. Water ${this.s.water.toFixed(2)} m. Watch the pool empty; access unlocks below 0.72 m. ${Math.max(0,Math.ceil((this.s.water-LAB.low)/.22))} seconds remaining.`:step.detail;}
  else if(this.s.stage===4){target=!this.s.archive?POINTS.archive:POINTS.sample;detail+=` Cases secured: ${Number(this.s.archive)+Number(this.s.sample)} / 2.`;}
  else if(this.s.stage===5){target=f.mode==='boat'?[...ROUTE.slice(0,-1).reverse(),HOME_DOCK.boat][this.s.returnLeg]:AQUA_HARBOR.land;}
  return {name:step.name,detail,target,done:this.s.stage,total:6};
 }
 candidate(){const f=this.ctx.fleet,type=actionAtAquatics(this.s,f.position,f.mode,f.actor.speed);return type?{kind:'aquatics',type,label:labels[type]+' / A'}:null;}
 interact(c){
  const current=this.candidate();if(!current||current.type!==c.type)return false;
  const {fleet,notify,audio,input}=this.ctx;
  if(c.type==='boat-service'){
   const boat=fleet.vehicles.find(v=>v.type==='boat');if(!boat||fleet.active===boat.id)return false;
   boat.drive.reset({...HOME_DOCK.boat,y:.78},-Math.PI/2);this.persist();notify('Patrol boat moored at Wetland Dock. Your ranger has not moved. Y / F boards it.');return true;
  }
  if(c.type==='intake'||c.type==='pump'){
   const pump=c.type==='pump';$('aquatics-control-title').textContent=pump?'Drain pump / interlock':'Seawater intake / isolation';
   $('aquatics-control-copy').textContent=pump?`${this.s.breaker?'Safety power is online.':'Safety power is offline.'} ${this.s.intakeClosed?'The seawater intake is closed.':'Close the seawater intake before drainage.'} Current level ${this.s.water.toFixed(2)} m.`:'The open seawater intake is refilling the pool. Close it before operating the pump. The wheel turns the intake off; it does not harm any animals.';
   const b=$('aquatics-control-use');b.textContent=pump?'Start the drain pump':'Close the seawater intake';b.disabled=pump?!(this.s.stage===3&&this.s.breaker&&this.s.intakeClosed&&!this.s.pumping):this.s.intakeClosed;
   b.onclick=()=>{const f=this.ctx.fleet;if(f.mode!=='foot'||!near(f.position,pump?POINTS.pump:POINTS.intake))return;if(advanceAquatics(this.s,pump?'pump':'isolate')){this.cue(pump?125:390,.2);this.ctx.close();this.persist();this.ctx.radio(pump?'Drain pump online. Stay on the deck while the water falls.':'Intake isolated. The drain pump is at the north end of the same walkway.');}};
   this.ctx.show('aquatics-control');return true;
  }
  if(advanceAquatics(this.s,c.type)){
   this.cue(c.type==='deliver'?720:510,.13);input.pulse(.18,140);this.persist();
   if(c.type==='deliver'){this.reconcileReward();this.ctx.info('PELAGIC RECOVERY COMPLETE','The research is back on dry land.',`<p>You reached the station by boat, restored its safety circuit, isolated the intake, drained the pool, recovered both research cases on foot and delivered them to Wetland Dock.</p><p>${this.s.rewarded?'1,200 credits are recorded in your existing supply balance.':'Completion is saved. The reward will be reconciled with the supply ledger when available.'} This reward is paid once.</p><p>The drained facility remains explorable. Menu opens the earlier races, roundups and missions.</p>`);}
   else this.ctx.radio(c.type==='archive'?'Habitat archive secured. The sealed sample case is in the south end of this room.':c.type==='sample'?'Both cases are safe. Return through the pool steps, board at Pelagic Pier and take the west channel back to Wetland Dock.':STEPS[this.s.stage].detail);
   return true;
  }return false;
 }
 reconcileReward(){if(!this.s.completed||this.s.rewarded)return;
  const economy=window.__dinoEconomy;if(!economy)return;
  const tag='aaa:pelagic-recovery',paid=economy.grant?.(1200,tag),already=economy.state?.rewardLedger?.includes(tag);
  if(paid||already){this.s.rewarded=true;this.save();}
 }
 recover(){if(this.s.stage<1)return;const f=this.ctx.fleet;f.active='foot';f.person.setActive(true,{x:-395,y:3.65,z:21});this.ctx.close();this.persist();this.ctx.notify('Your ranger is back on the dry entrance deck. Parked vehicles and recovered cases are unchanged.');}
 cue(freq,duration){const a=this.ctx.audio;if(a.context&&a.settings.enabled)a.tone(freq,duration);}
 update(dt){
  const f=this.ctx.fleet,p=f.position,old=this.s.stage;this.safetyTimer=Math.max(0,this.safetyTimer-dt);
  if(dt>0&&this.s.active){
   if(this.s.stage===0&&f.mode==='boat'){
    if(this.s.leg<4&&gap(p,ROUTE[this.s.leg])<24)this.s.leg++;
    if(gap(p,AQUA_HARBOR.boat)<17&&Math.abs(f.actor.speed)<3)advanceAquatics(this.s,'arrive');
   }
   if(this.s.stage===5&&f.mode==='boat'){const path=[...ROUTE.slice(0,-1).reverse(),HOME_DOCK.boat];if(this.s.returnLeg<4&&gap(p,path[this.s.returnLeg])<24)this.s.returnLeg++;}
   if(tickAquatics(this.s,dt)){this.persist();this.ctx.radio('Drainage complete. The pool access gate is open. Take the south steps, cross the shallow basin, and enter the east archive wing.');this.cue(620,.15);}
   if(this.s.stage!==old){this.persist();if(this.s.stage===1)this.ctx.radio(STEPS[1].detail);}
  }
  const inside=f.mode==='foot'&&insideLab(p),env=inside?movementInLab(this.s,p):{wet:false,deep:false};
  document.body.dataset.aquatics=inside?'inside':'outside';
  if(inside&&p.y>LAB.deck+.6)this.safePoint={x:p.x,y:p.y,z:p.z};
  if(inside&&env.deep&&this.safetyTimer===0){f.person.setActive(true,this.safePoint);this.safetyTimer=2;this.ctx.notify('Deep pool access is closed. Drain the water before descending. No damage or progress lost.');}
  if(inside&&env.wet&&Math.abs(f.actor.speed)>.4&&dt>0){this.splashClock+=dt;if(this.splashClock>.46){this.splashClock=0;this.world.splash(p);const a=this.ctx.audio;if(a.context&&a.settings.enabled)a.noiseHit(.12,.045,820,'bandpass');}}
  this.updatePumpAudio(inside&&dt>0&&this.s.pumping);
  if(this.s.completed&&!this.s.rewarded)this.reconcileReward();
  this.world.update(this.s,dt,p,{reduced:this.ctx.settings.reduced,enhanced:this.ctx.optics?.current!=='classic'});
 }
 updatePumpAudio(on){
  const a=this.ctx.audio,c=a.context;if(!c||!a.settings.enabled)on=false;
  if(on&&!this.pumpAudio){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=72;g.gain.value=.0001;o.connect(g);g.connect(a.ambBus);o.start();this.pumpAudio={o,g};this.pumpStarts++;}
  if(this.pumpAudio&&c){this.pumpAudio.g.gain.setTargetAtTime(on?.09:0,c.currentTime,.12);if(!on){const {o,g}=this.pumpAudio;o.stop(c.currentTime+.4);o.onended=()=>{o.disconnect();g.disconnect();};this.pumpAudio=null;}}
 }
 hud(){const inside=this.ctx.fleet.mode==='foot'&&insideLab(this.ctx.fleet.position);$('aquatics-gauge').hidden=!inside;$('aquatics-depth').textContent=this.s.water.toFixed(2)+' m';$('aquatics-water').value=this.s.water;$('aquatics-status').textContent=shallowSafe(this.s)?'SHALLOW / STAIRS OPEN':this.s.pumping?'PUMP RUNNING / STAY ON DECK':'DEEP / RESTORE POWER AND DRAIN';}
 useInspection(){return this.s.inspection&&this.ctx.fleet.mode==='foot'&&insideLab(this.ctx.fleet.position);}
 camera(camera,yaw,pitch){if(!this.useInspection())return false;const p=this.ctx.fleet.position;camera.position.set(p.x,p.y+.64,p.z);camera.lookAt(p.x-Math.sin(yaw)*Math.cos(pitch)*10,p.y+.64-Math.sin(pitch)*10,p.z-Math.cos(yaw)*Math.cos(pitch)*10);return true;}
 prepareFrame(camera){const f=this.ctx.fleet;this.ctx.personModel.visible=f.mode==='foot'&&!this.useInspection();
  if(f.mode==='foot'&&insideLab(f.position)&&this.ctx.director?.rain)this.ctx.director.rain.visible=false;
  this.world.capture(this.ctx.renderer,camera,this.ctx.settings,this.s.refraction&&this.ctx.optics?.current!=='classic'&&!this.ctx.optics?.failed);
 }
 drawMap(ctx,to,k,full){const [x,z]=to(LAB.x,LAB.z);ctx.fillStyle='#a1e7dd';ctx.fillRect(x-5,z-5,10,10);if(full){ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('PELAGIC STATION',x,z-10);}}
 snapshot(){return {build:AQUATICS_BUILD,progress:{...this.s},task:this.task(),inspection:this.useInspection(),world:this.world.snapshot(),pumpVoices:this.pumpAudio?1:0,pumpStarts:this.pumpStarts};}
}
