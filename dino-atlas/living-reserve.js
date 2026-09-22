import * as T from './vendor/three.module.js';
import R from './vendor/rapier.mjs';
import {makePerson} from './frontier-art.js?v=grounded1';
import {box,label} from './ranger-art.js';
import {LIVING_BUILD,LIVING_TITLE,ORIGIN,CHAPTER_STEPS,SCENES,readLiving,futureLiving,saveLiving,corridorRestored,chapterComplete,livingEligibility,advanceLiving} from './living-reserve-core.js';
const $=id=>document.getElementById(id);
// An optional authored chapter inside the regular simulation. No second scene,
// actor teleport, existing ledger mutation or per-frame conversation pop-up.
export class LivingReserve{
 constructor(ctx){
  this.ctx=ctx;this.s=readLiving(ctx.storage);this.readonly=futureLiving(ctx.storage);this.dialogue=null;this.lastStage=-1;
  this.root=new T.Group();this.root.name='The Living Reserve / First Light';ctx.root.add(this.root);this.people=[];
  for(const [id,name,p,c] of [['mara','Mara / Senior ranger',{x:5,z:44},0xd0af6f],['ivo','Ivo / Field engineer',{x:24,z:17},0x84c5ba],['leena','Dr. Leena Rao',{x:-4,z:44},0xb7c3e5]]){
   const group=new T.Group();group.position.set(p.x,0,p.z);group.name=name;const person=makePerson();group.add(person);box(group,c,0,1.58,0,.47,.13,.46);
   const plate=label(name,4.2,.55);plate.position.set(0,2.45,0);group.add(plate);this.root.add(group);this.people.push({id,group,plate});
  }
  // Visual markings only. Do not add new solids at historical save positions.
  const ring=new T.Mesh(new T.RingGeometry(1.4,1.5,32),new T.MeshBasicMaterial({color:0xffd27d,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(-12,.09,13);this.root.add(ring);
  const service=label('SERVICE / NORTH OF RAMP',5.5,.6);service.position.set(10,1.15,14);this.root.add(service);
  this.install();this.sync();
 }
 save(){if(!saveLiving(this.ctx.storage,this.s)&&!this.warned){this.warned=true;this.ctx.notify(this.readonly?'A newer story save is preserved. This version will not overwrite it.':'The story could not be saved in this browser. Existing reserve progress is unchanged.');}}
 install(){
  const dialog=document.createElement('dialog');dialog.id='living-dialog';dialog.className='living-dialog';dialog.setAttribute('aria-labelledby','living-speaker');
  dialog.innerHTML='<p class="eyebrow">THE LIVING RESERVE / FIRST LIGHT</p><h2 id="living-speaker"></h2><p id="living-line"></p><p id="living-page" class="fine-print"></p><button class="primary" id="living-next">Continue</button><button id="living-close">Back to the reserve</button>';
  dialog.addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});document.body.append(dialog);
  $('living-next').onclick=()=>this.next();$('living-close').onclick=()=>this.ctx.close();
  const journal=document.createElement('dialog');journal.id='living-journal';journal.className='living-dialog';journal.setAttribute('aria-labelledby','living-title');
  journal.innerHTML='<p class="eyebrow">STORY / SAVED CHAPTER AND RECORDINGS</p><h2 id="living-title">The Living Reserve</h2><p id="living-status"></p><button class="primary" id="living-resume">Begin First Light</button><button id="living-origin">Read the Singularity origin</button><button id="living-suspend">Suspend story / keep progress</button><button id="living-storm">Play the existing Storm Response operation</button><div id="living-records" class="entry-list"></div><button id="living-journal-close">Back to the reserve</button>';
  journal.addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});document.body.append(journal);
  $('living-resume').onclick=()=>this.begin();$('living-origin').onclick=()=>this.conversation(ORIGIN,null);$('living-suspend').onclick=()=>{this.suspend();this.ctx.close();this.ctx.notify('Story suspended. Its evidence and restored corridor remain saved.');};
  $('living-storm').onclick=()=>{this.suspend();this.ctx.close();$('menu-aaa-director')?.click();};$('living-journal-close').onclick=()=>this.ctx.close();
  const menu=document.createElement('button');menu.id='menu-living-reserve';menu.textContent='Story: The Living Reserve / First Light';menu.onclick=()=>this.journal();document.querySelector('#menu-dialog .menu-grid').prepend(menu);
  const intro=document.createElement('button');intro.id='living-play';intro.className='primary living-play';intro.textContent=this.s.stage?'Continue story: The Living Reserve':'Play story: The Living Reserve';intro.onclick=()=>this.begin();$('start-button').after(intro);
  const help=document.createElement('button');help.id='living-help-story';help.textContent='Story objective and recordings';help.onclick=()=>this.journal();$('field-help-dialog')?.append(help);
  // Choosing another real activity relinquishes story guidance, not evidence.
  // Capturing before its own click handler preserves the existing activity flow.
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-job],[data-track],#campaign-track,#pen-track,#aaa-director-start,#aaa-director-resume,#herds-study-start,#aquatics-start,[id^="field-start-"]'))this.suspend();},true);
 }
 begin(){
  if(this.readonly){this.ctx.notify('A newer story save is preserved; this build cannot continue it.');return;}
  if(!this.ctx.started())$('start-button').click();
  if(chapterComplete(this.s)){this.journal();return;}
  this.ctx.track();this.s.active=true;this.save();this.sync();
  if(this.s.stage===0)this.conversation(SCENES.prologue,null);else{this.ctx.close();this.ctx.notify('Story resumed: '+CHAPTER_STEPS[this.s.stage].name+'. Follow the gold goal.');}
 }
 suspend(){if(this.s.active){this.s.active=false;this.save();}this.sync();}
 journal(){
  const done=chapterComplete(this.s),step=CHAPTER_STEPS[this.s.stage];$('living-status').textContent=done?'First Light completed. The corridor remains restored. Your next story chapter is not yet implemented; existing reserve operations remain playable.':`Chapter 1 / ${this.s.stage} of ${CHAPTER_STEPS.length} field steps complete. ${step.name}. ${step.detail}`;
  $('living-resume').textContent=this.s.stage?'Continue saved chapter':'Begin First Light';$('living-resume').disabled=done||this.readonly;$('living-suspend').disabled=!this.s.active;
  const records=$('living-records');records.replaceChildren();for(const step of CHAPTER_STEPS.slice(0,this.s.stage)){const b=document.createElement('button');b.textContent='Replay: '+step.name;b.onclick=()=>this.conversation(this.lines(step.id),null);records.append(b);}
  this.ctx.show('living-journal');
 }
 lines(id){return SCENES[id].map(([speaker,line])=>[speaker,line.replace('{animal}',this.s.observation?.species||this.observed?.species||'A plant-eater').replace('{mood}',this.s.observation?.mood||this.observed?.mood||'moving through the reserve')]);}
 conversation(lines,onFinish){this.dialogue={lines,index:0,onFinish};this.paintDialogue();this.ctx.show('living-dialog');}
 paintDialogue(){const d=this.dialogue;if(!d)return;const [speaker,line]=d.lines[d.index];$('living-speaker').textContent=speaker;$('living-line').textContent=line;$('living-page').textContent=`${d.index+1} / ${d.lines.length}. Continue when ready. Completed recordings can be replayed in the story journal.`;$('living-next').textContent=d.index===d.lines.length-1?'Finish conversation':'Continue';}
 next(){const d=this.dialogue;if(!d)return;if(++d.index<d.lines.length){this.paintDialogue();return;}this.dialogue=null;this.ctx.close();d.onFinish?.();}
 sight(target){
  const f=this.ctx.fleet,p=f.position,o=new T.Vector3(p.x,p.y+.45,p.z),q=new T.Vector3(target.x,target.y??1.3,target.z),d=q.sub(o),length=d.length();if(length<.1)return true;d.normalize();
  const hit=this.ctx.physics.world.castRay(new R.Ray(o,d),length,true,undefined,undefined,f.actor.collider,f.actor.body);
  return !hit||hit.timeOfImpact>=length-.45||target.collider?.collider(0).handle===hit.collider.handle;
 }
 animal(){
  const p=this.ctx.fleet.position;return this.ctx.animals.filter(a=>!['rex','allosaur','raptor','spinosaur'].includes(a.kind)&&a.species!=='coelophysis'&&Math.hypot(a.x-p.x,a.z-p.z)<55).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).find(a=>this.sight({x:a.x,y:a.collider.translation().y,z:a.z,collider:a.collider}))||null;
 }
 context(){const step=CHAPTER_STEPS[this.s.stage],f=this.ctx.fleet;return {position:f.position,mode:f.mode,speed:f.actor.speed,visible:step?this.sight({...step.target,y:1.3}):false,animal:step?.id==='watch'?this.animal():null};}
 candidate(){
  const step=CHAPTER_STEPS[this.s.stage];
  if(this.s.active&&step&&!livingEligibility(this.s,this.context()))return {kind:'living',label:step.label,type:step.id};
  const f=this.ctx.fleet,p=f.position;if(!this.root.visible||f.mode!=='foot'||Math.abs(f.actor.speed)>.6||p.y>3)return null;
  const known=this.people.find(e=>e.group.visible&&CHAPTER_STEPS.findIndex(s=>s.id===e.id)<this.s.stage&&Math.hypot(p.x-e.group.position.x,p.z-e.group.position.z)<4.4&&this.sight({x:e.group.position.x,y:1.3,z:e.group.position.z}));
  return known?{kind:'living',label:'Talk again: '+known.group.name,type:known.id,replay:true}:null;
 }
 interact(){
  const c=this.candidate();if(!c||this.ctx.modal())return false;
  if(c.replay){this.conversation(chapterComplete(this.s)?[['FIELD TEAM','The corridor remains open and your report is saved. The Tidegate message is our next lead. Restock, explore, or replay a recording from the story journal.']]:this.lines(c.type),null);return true;}
  // Physical work is committed at the in-reach interaction. Conversation can be
  // dismissed; all completed text stays replayable and progress does not depend on reading speed.
  const context=this.context();if(!advanceLiving(this.s,c.type,context))return false;
  this.observed=context.animal;this.save();this.ctx.saveWorld();this.sync();
  const lines=this.lines(c.type);this.conversation(lines,()=>{const next=CHAPTER_STEPS[this.s.stage];this.ctx.notify(next?'NEXT: '+next.name+'. '+next.detail:'First Light completed. Your corrected field atlas is saved.');});return true;
 }
 task(){
  if(!this.s.active)return null;const step=CHAPTER_STEPS[this.s.stage];if(!step)return null;const p=this.ctx.fleet.position;
  let target=step.target,detail=step.detail;
  if(step.id==='recorder'&&p.z>-37){target={x:37,y:0,z:-36};detail='The research gate is open. Follow the road to it, then continue to the recorder. Keep the return route clear.';}
  if(this.ctx.fleet.mode!=='foot'&&Math.hypot(p.x-step.target.x,p.z-step.target.z)<12)detail='Park and step out. '+step.detail;
  return {name:'First Light / '+step.name,detail,target,done:this.s.stage,total:CHAPTER_STEPS.length,hint:detail};
 }
 sync(){
  this.root.visible=this.s.active||this.s.stage>0;for(const p of this.people)p.group.visible=p.id!=='mara'||this.s.stage<4;
  this.ctx.power(corridorRestored(this.s));
 }
 update(dt){
  if(this.lastStage!==this.s.stage){this.lastStage=this.s.stage;this.sync();}
  if(!this.root.visible)return;const p=this.ctx.fleet.position;for(const e of this.people){const yaw=Math.atan2(p.x-e.group.position.x,p.z-e.group.position.z);e.plate.rotation.y=yaw;}
 }
 snapshot(){return {build:LIVING_BUILD,title:LIVING_TITLE,...this.s,complete:chapterComplete(this.s),corridorRestored:corridorRestored(this.s),task:this.task(),candidate:this.candidate()?.type||null,readonly:this.readonly};}
}
