import * as T from './vendor/three.module.js';
import {HERDS_BUILD,lifeOf,profileFor,buildHerdGrid,HerdCueBudget} from './herd-behavior.js?v=herds1';
import {STUDY_STEPS,STUDY_REWARD,readStudy,saveStudy,startStudy,studyAdvance} from './herd-study.js?v=herds1';
import {PENS,insidePen} from './frontier-data.js?v=herds1';
const $=id=>document.getElementById(id),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export class LivingHerds{
 constructor(ctx){
  this.ctx=ctx;this.s=readStudy(ctx.storage);this.time=0;this.uiAt=0;this.budget=new HerdCueBudget();this.lastWarnings=new Map();this.baseline={};this.audioAt=0;
  ctx.audio.herdDirector=true;this.installUI();this.makeMarkers();this.captureBaseline();
  this.context={grid:null,atGate:a=>{const p=PENS.find(p=>p.id===a.pen);return p&&Math.abs(a.x-p.x)<9&&a.z>p.z+p.hz-9;},visible:(a,p)=>this.visible(a,p),canStep:(a,old,next)=>this.canStep(a,old,next)};
 }
 captureBaseline(){for(const a of this.ctx.animals){const l=lifeOf(a);this.baseline[a.uid]={response:l.responseCount,warnings:l.warningCount,interrupt:l.interruptCount||0};}}
 save(){return saveStudy(this.ctx.storage,this.s);}
 pause(){this.s.active=false;this.save();}
 begin(){this.ctx.director.suspend();this.ctx.ranch.pauseTracking();startStudy(this.s);this.captureBaseline();this.ctx.close();this.save();this.ctx.radio(STUDY_STEPS[this.s.stage].detail);}
 installUI(){
  document.body.insertAdjacentHTML('beforeend',`<dialog id="living-herds-dialog" aria-labelledby="herds-title"><p class="eyebrow">FIELD BEHAVIOR / LIVING HERDS</p><h2 id="herds-title">Watch. Understand. Guide.</h2><p>The same residents now look toward you, pause to feed or rest, warn before charging, and recover after a tool interruption. Watch the lifted head and amber warning ring, not just a text label.</p><p>Short water bursts guide animals. Zapper pulses interrupt a warning or charge. The horn moves nearby animals away. Repeated pulses have diminishing shove strength; allow recovery and reposition behind the animal rather than holding it stunned.</p><p id="herds-study-status"></p><div class="entry-list"><button class="primary" id="herds-study-start">Start or continue the field study</button><button id="herds-study-pause">Suspend study and explore</button><button id="herds-close">Back to play / B</button></div><div class="settings"><label>Wildlife call density <select id="herds-cue-density"><option value="balanced">Balanced</option><option value="quiet">Quiet</option><option value="off">Off / visual cues only</option></select></label></div><p>First completion pays 450 credits. Replay is available without duplicating the reward. These are fictional gameplay behaviors, not claims about extinct animal psychology. Existing saves and no-damage vehicles are retained.</p><p class="pad-help">D-pad / left stick navigates. A selects. B closes. Left/right adjusts the focused setting. X reloads during play.</p></dialog>`);
  document.querySelector('#menu-dialog .menu-grid')?.insertAdjacentHTML('afterbegin','<button id="menu-living-herds">Living Herds: field study</button>');
  document.querySelector('#outpost-dialog .entry-list')?.insertAdjacentHTML('beforeend','<button id="outpost-living-herds">Living Herds: field study</button>');
  $('menu-living-herds').onclick=$('outpost-living-herds').onclick=()=>this.open();
  $('herds-study-start').onclick=()=>this.begin();$('herds-study-pause').onclick=()=>{this.pause();this.ctx.close();};$('herds-close').onclick=()=>this.ctx.close();
  $('herds-cue-density').value=this.s.cues;$('herds-cue-density').onchange=e=>{this.s.cues=e.target.value;this.save();};
  $('living-herds-dialog').addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});
  $('living-herds-dialog').addEventListener('close',()=>this.ctx.input.clear());
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-job],[data-track],#campaign-track,#pen-track,#aaa-director-start,#aaa-director-resume,#northstar-start,#northstar-restart'))this.pause();},true);
 }
 open(){const step=STUDY_STEPS[this.s.stage];$('herds-study-status').textContent=this.s.complete&&!this.s.active?'Report completed. Replay the study to practice; the reward is paid once.':`Stage ${this.s.stage+1} / 5: ${step.title}`;this.ctx.show('living-herds-dialog');}
 task(){if(!this.s.active)return null;const s=STUDY_STEPS[this.s.stage],a=this.ctx.animals.find(a=>a.uid===s.uid);return {name:'Living Herds / '+s.title,detail:s.detail,target:a||s.target,done:this.s.stage,total:5};}
 next(){studyAdvance(this.s);this.captureBaseline();this.save();if(this.s.active)this.ctx.radio(STUDY_STEPS[this.s.stage].detail);}
 candidate(){if(!this.s.active||this.s.stage!==4)return null;const f=this.ctx.fleet;if(f.position.y<4&&distance(f.position,{x:0,z:51})<7&&Math.abs(f.actor.speed)<3)return {kind:'herds',label:'File Living Herds report / A'};return null;}
 interact(){if(!this.candidate())return false;const awarded=window.__dinoEconomy?.grant?.(STUDY_REWARD,'aaa:living-herds');this.next();this.ctx.info('FIELD STUDY COMPLETE','Read the animal before you act.',`<p>You observed a grazer, guided it with water, recognized a predator warning, interrupted the charge and returned your report.</p><p>${awarded?'450 credits added to your existing supply balance.':'Your report is recorded; an already-collected reward is not paid again.'}</p><p>These behaviors apply throughout the reserve. Feeders, safe gate closure and the earlier ranching assignments remain available.</p>`);this.ctx.save();return true;}
 makeMarkers(){
  this.markers=Array.from({length:3},()=>{const g=new T.Group(),m=new T.Mesh(new T.RingGeometry(.86,1,36),new T.MeshBasicMaterial({color:0xffc16b,side:T.DoubleSide,transparent:true,opacity:.6,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.18;g.add(m);
   const arrow=new T.Mesh(new T.ConeGeometry(.5,1.25,3),new T.MeshBasicMaterial({color:0xffd49a}));arrow.rotation.x=Math.PI/2;g.add(arrow);g.visible=false;this.ctx.scene.add(g);return {g,m,arrow};});
 }
 staticCollider(c){return !c.isSensor()&&(!c.parent()||c.parent().isFixed());}
 visible(a,p){
  const R=this.ctx.R,dx=p.x-a.x,dz=p.z-a.z,len=Math.hypot(dx,dz);if(len<.01)return true;
  const hit=this.ctx.physics.world.castRay(new R.Ray({x:a.x,y:1.3,z:a.z},{x:dx/len,y:0,z:dz/len}),len,true,undefined,undefined,a.collider?.collider(0),a.collider,c=>this.staticCollider(c));
  return !hit;
 }
 canStep(a,old,next){
  const world=this.ctx.physics.world,R=this.ctx.R,dx=next.x-old.x,dz=next.z-old.z,len=Math.hypot(dx,dz);if(len<1e-6)return true;
  // Three horizontal rays cover centre and shoulders. Physics always filters the actor itself.
  const side=Math.min(a.radius*.65,1.45),ux=dx/len,uz=dz/len;
  for(const offset of [0,-side,side]){
   const hit=world.castRay(new R.Ray({x:old.x-uz*offset,y:1.15,z:old.z+ux*offset},{x:ux,y:0,z:uz}),len+.12,false,undefined,undefined,a.collider?.collider(0),a.collider,c=>this.staticCollider(c));
   if(hit)return false;
  }
  return true;
 }
 beforeStep(){this.context.grid=buildHerdGrid(this.ctx.animals);return this.context;}
 update(dt,time){
  if(dt<=0)return;this.time+=dt;
  const {animals,fleet,audio,settings}=this.ctx,p=fleet.position;
  const near=animals.filter(a=>distance(a,p)<45).sort((a,b)=>distance(a,p)-distance(b,p));
  const danger=near.filter(a=>['alert','charge'].includes(lifeOf(a).state));
  this.markers.forEach((o,i)=>{const a=danger[i];o.g.visible=!!a;if(a){const l=lifeOf(a),r=a.radius+1.7;o.g.position.set(a.x,0,a.z);o.m.scale.setScalar(r);o.m.material.color.setHex(l.state==='charge'?0xe8855c:0xffc16b);o.m.material.opacity=settings.reduced?.45:.4+Math.min(1,l.warning/profileFor(a).warning)*.35;o.arrow.position.set(Math.sin(a.angle)*(r+.7),.55,Math.cos(a.angle)*(r+.7));o.arrow.rotation.z=-a.angle;}});
  for(const a of danger){const l=lifeOf(a);if(l.warningCount>(this.lastWarnings.get(a.uid)||0)){this.lastWarnings.set(a.uid,l.warningCount);this.call(a,true);}}
  if(near.length&&this.time>this.audioAt){this.audioAt=this.time+2;const a=near.find(a=>!['interrupted','charge'].includes(lifeOf(a).state));if(a)this.call(a,false);}
  if(this.s.active){const step=STUDY_STEPS[this.s.stage],a=animals.find(a=>a.uid===step.uid),base=this.baseline[a?.uid]||{};
   if(this.s.stage===0&&a){if(p.y<5&&distance(p,a)>=7&&distance(p,a)<=20&&Math.abs(fleet.actor.speed)<.8&&this.visible(a,p))this.s.calm+=dt;else this.s.calm=0;if(this.s.calm>=2)this.next();}
   else if(this.s.stage===1&&a&&lifeOf(a).responseCount>base.response&&a.effect==='water')this.next();
   else if(this.s.stage===2&&a&&lifeOf(a).warningCount>base.warnings&&distance(a,p)<25)this.next();
   else if(this.s.stage===3&&a&&(lifeOf(a).interruptCount||0)>base.interrupt)this.next();
  }
 }
 call(a,priority){const audio=this.ctx.audio;if(!audio.settings.enabled||!audio.context||audio.context.state!=='running'||!this.budget.take(a.uid,this.time,priority,this.s.cues))return;
  const p=this.ctx.fleet.position,profile=profileFor(a),pan=Math.max(-1,Math.min(1,(a.x-p.x)/35));audio.animal(a.species,distance(a,p),{frequency:profile.voice*(priority?.85:1),pan});}
 hud(){const p=this.ctx.fleet.position;const a=this.ctx.animals.filter(a=>distance(a,p)<24).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(a){const l=lifeOf(a),verbs={alert:'HEAD RAISED / CHARGE WARNING',charge:'CHARGING / ZAPPER INTERRUPTS',recovering:'RECOVERING / GIVE IT SPACE',interrupted:'CHARGE INTERRUPTED',feed:'FEEDING / APPROACH QUIETLY',rest:'RESTING / KEEP YOUR DISTANCE',watch:'WATCHING YOUR APPROACH',retreat:'MOVING AWAY FROM YOUR TOOL'};if(verbs[l.state])$('encounter-label').textContent=verbs[l.state];}
 }
 snapshot(){return {build:HERDS_BUILD,study:{...this.s},cues:{accepted:this.budget.accepted,dropped:this.budget.dropped,density:this.s.cues},animals:this.ctx.animals.map(a=>({uid:a.uid,species:a.species,state:lifeOf(a).state,speed:lifeOf(a).speed,warning:lifeOf(a).warning,warningCount:lifeOf(a).warningCount,interrupts:lifeOf(a).interruptCount||0,responseCount:lifeOf(a).responseCount,group:profileFor(a).name}))};}
}
