import * as T from './vendor/three.module.js';
import {label,box} from './ranger-art.js';
import {BUILDINGS,distance} from './ranch-data.js';
import {STORM_ID,STORM_BUILD,STORM_STAGES,STORM_COAST,EAST,NORTH,SOUTH,EAST_PIER,SOUTH_PIER,MERIDIAN_APPROACH,AIR_DESK,AIR_PAD,BOAT_DESK,canResume,startDirector,suspendDirector,advanceDirector,automaticStage,actionAt,checkpointSpawn,readDirector,saveDirector} from './storm-mission.js';
export {sanitizeDirector,readDirector,saveDirector} from './storm-mission.js';
export const AAA_BUILD=STORM_BUILD;
const $=id=>document.getElementById(id);
const messages=['','Meridian reached. Park outside, enter on foot and restore backup power.','Backup power restored. Air Transfer is beside the building; A calls your helicopter to its pad.','Northstar roof reached. Walk over to calibrate the storm beacon.','Beacon calibrated. Reboard your helicopter for South Coast Biosecurity.','South Coast roof reached. Use the maintenance lift for the ground-floor telemetry case.','Telemetry secured. South Rescue Pier has a Boat Transfer terminal. Call the boat there with A.','Boat launch confirmed. Follow the offshore buoys east, keeping the island on your left.'];

export class AAADirector {
 constructor(ctx){
  this.ctx=ctx;this.s=readDirector(ctx.storage);this.time=0;this.lightning=9;this.flash=0;this.thunder=-1;this.stormMix=0;this.savedClock=0;
  this.stormColor=new T.Color(0x405862);this.installWeather();this.installMarkers();this.installUI();
  if(this.s.active===STORM_ID)this.s.storm=true;
 }
 installWeather(){
  const g=new T.BufferGeometry(),pos=new Float32Array(420*3);
  for(let i=0;i<420;i++){pos[i*3]=(Math.random()-.5)*70;pos[i*3+1]=Math.random()*35;pos[i*3+2]=(Math.random()-.5)*70;}
  g.setAttribute('position',new T.BufferAttribute(pos,3));
  this.rain=new T.Points(g,new T.PointsMaterial({color:0xbfd7df,size:.13,transparent:true,opacity:0,depthWrite:false}));
  this.rain.frustumCulled=false;this.rain.visible=false;this.ctx.scene.add(this.rain);
  this.flashLight=new T.HemisphereLight(0xe9f6ff,0x26323a,0);this.ctx.scene.add(this.flashLight);
 }
 installMarkers(){
  const scene=this.ctx.scene;this.serviceMarkers=[];
  for(const [p,text] of [[AIR_DESK,'AIR TRANSFER / A'],[BOAT_DESK,'BOAT TRANSFER / A'],[MERIDIAN_APPROACH,'MERIDIAN / PARK HERE']]){
   const g=new T.Group();g.position.set(p.x,0,p.z);box(g,0x3c665d,0,.8,0,.9,1.6,.9);
   const sign=label(text,8,.9);sign.position.set(0,3.5,0);g.add(sign);
   const ring=new T.Mesh(new T.RingGeometry(1.2,1.4,28),new T.MeshBasicMaterial({color:0xefcf8f,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.1;g.add(ring);scene.add(g);this.serviceMarkers.push(g);
  }
  const h=label('H / RANGER TRANSFER',11,3,'#36594b','#cfedcf');h.rotation.x=-Math.PI/2;h.position.set(AIR_PAD.x,.11,AIR_PAD.z);scene.add(h);
  // Optional guide buoys, not extra mandatory race gates or a teleport route.
  this.buoys=STORM_COAST.map((p,i)=>{const g=new T.Group();g.position.set(p.x,0,p.z);box(g,0xb39b60,0,.7,0,1.3,1.3,1.3);const m=new T.Mesh(new T.OctahedronGeometry(.6),new T.MeshBasicMaterial({color:0xffdc94}));m.position.y=3;g.add(m);const text=label('STORM ROUTE '+(i+1),9,.9);text.position.y=5;g.add(text);g.visible=false;scene.add(g);return g;});
 }
 installUI(){
  document.body.insertAdjacentHTML('beforeend',`<dialog id="aaa-director-dialog" aria-labelledby="aaa-director-title"><p class="eyebrow">STORY MISSIONS / STORM RESPONSE</p><h2 id="aaa-director-title">One connected ranger operation.</h2><div id="aaa-director-copy"></div><div class="entry-list"><button class="primary" id="aaa-director-resume">Continue saved mission / A</button><button id="aaa-director-start">Start or restart Storm Response</button><button id="aaa-director-recover">Recover at this mission checkpoint</button><button id="aaa-director-abandon">Suspend mission and explore</button><button data-aaa-close>Return to the reserve / B</button></div><div class="settings"><label><input type="checkbox" id="story-flashes">Allow storm lightning flashes</label></div><p class="pad-help">A selects. B closes. X reloads during play. Restart changes only this story; recovery moves you to a safe point for the current stage. Your journal, cargo and other activities are retained.</p></dialog>
  <dialog id="aaa-roadmap-dialog" aria-labelledby="aaa-roadmap-title"><p class="eyebrow">DEVELOPMENT / QUALITY GATES</p><h2 id="aaa-roadmap-title">The path to a finished game.</h2><button class="primary" data-aaa-close>Back to play / B</button><p>Dino Atlas is an expanding playable sandbox. Storm Response connects its vehicles and interiors into an authored mission. This is not a claim that the full game has reached AAA production quality.</p><p><b>Current gate:</b> prove a coherent mission with clear instructions, reachable destinations, controller-only interactions, reliable saves and no repeated reward exploits.</p><p><b>Next:</b> animation and dinosaur behavior, a more detailed signature interior, and real-device performance and controller testing. Feature quantity alone does not close these gates.</p><p><b>Later:</b> complete planned content, balance the economy, add accessibility and remapping, run long-session tests, then check release and rollback readiness.</p><p>The version-controlled checklist is stored beside the game in <code>AAA-ROADMAP.md</code>. Every milestone has acceptance criteria; hardware testing is tracked separately from automated testing.</p><p><a href="./AAA-ROADMAP.md" target="_blank" rel="noopener">Read the full development checklist in a new tab</a></p><p class="pad-help">D-pad navigates. Right stick scrolls. B closes this panel without leaving the game.</p></dialog>`);
  const grid=document.querySelector('#menu-dialog .menu-grid');
  grid?.insertAdjacentHTML('afterbegin','<button id="menu-aaa-director">Story mission: Storm Response</button><button id="menu-aaa-roadmap">Development roadmap</button>');
  $('menu-aaa-director').onclick=()=>this.open();$('menu-aaa-roadmap').onclick=()=>this.ctx.show('aaa-roadmap-dialog');
  for(const b of document.querySelectorAll('[data-aaa-close]'))b.onclick=()=>this.ctx.close();
  for(const id of ['aaa-director-dialog','aaa-roadmap-dialog']){const d=$(id);d.addEventListener('cancel',e=>{e.preventDefault();this.ctx.close();});d.addEventListener('close',()=>this.ctx.input.clear());}
  $('aaa-director-start').onclick=()=>this.begin(true);$('aaa-director-resume').onclick=()=>this.begin(false);
  $('aaa-director-abandon').onclick=()=>this.abandon();$('aaa-director-recover').onclick=()=>this.recoverCheckpoint();
  $('story-flashes').checked=this.s.flashes;$('story-flashes').onchange=e=>{this.s.flashes=e.target.checked;this.save();};this.refreshDialog();
 }
 open(){this.refreshDialog();this.ctx.show('aaa-director-dialog');}
 refreshDialog(){
  const available=canResume(this.s),complete=this.s.completed.includes(STORM_ID);
  $('aaa-director-copy').innerHTML=`<p>Restore Meridian's backup power, transfer to helicopter operations, recover telemetry inside South Coast Biosecurity, and finish with a coastal boat delivery.</p><p><b>Status:</b> ${available?(this.s.suspended?'Suspended':'Active')+' at stage '+(this.s.stage+1)+' / 8: '+STORM_STAGES[this.s.stage].name:complete?'Completed. Replays do not repeat the 1,800-credit reward.':'Ready. First completion awards 1,800 credits.'}</p><p>Vehicles take no damage. Service terminals bring your unoccupied helicopter or boat to the next departure point only when you request it.</p>`;
  $('aaa-director-resume').disabled=!available;$('aaa-director-recover').disabled=!available;$('aaa-director-abandon').disabled=this.s.active!==STORM_ID;
 }
 begin(fresh){this.s=startDirector(this.s,fresh);this.ctx.ranch?.pauseTracking?.();this.ctx.close();this.persist();this.ctx.radio(messages[this.s.stage]||'Storm Response begins at the parking bay outside Meridian Logistics. Follow the gold marker.');}
 suspend(){suspendDirector(this.s);this.persist();}
 abandon(){this.suspend();this.ctx.close();this.ctx.notify('Story suspended. Continue saved mission restores this stage; nothing was erased.');}
 save(){return saveDirector(this.ctx.storage,this.s);}
 persist(){this.save();this.ctx.save?.();}
 start(){if(this.s.active===STORM_ID)this.ctx.notify('Story checkpoint restored: '+STORM_STAGES[this.s.stage].name);}
 task(){
  if(this.s.active!==STORM_ID)return null;const x=STORM_STAGES[this.s.stage],fleet=this.ctx.fleet,p=fleet.position;let target=x.target,detail=x.detail;
  const air=fleet.vehicles.find(v=>v.type==='helicopter');
  if(this.s.stage===2){target=fleet.mode==='helicopter'?NORTH:air&&distance(air.drive.position,AIR_PAD)<14?air.drive.position:AIR_DESK;if(fleet.mode==='helicopter')detail='Fly to the Northstar roof. RT rises; LT descends. Land, stop, then Y / F exits onto the roof.';}
  if(this.s.stage===4&&fleet.mode==='foot'&&air){target=air.drive.position;detail='Your next flight starts in the parked helicopter. Y / F boards it. The marker switches to South Coast once aboard.';}
  if(this.s.stage===5&&p.y>5){target={x:SOUTH.x-12,z:SOUTH.z-9};}
  if(this.s.stage===6&&fleet.mode==='foot'&&p.y<4&&distance(p,SOUTH)<28){target={x:SOUTH.x,z:SOUTH.z+SOUTH.hz+8};detail='Leave through the front ground-floor doorway, then head to South Rescue Pier. Or return to the roof lift for your helicopter.';}
  if(this.s.stage===7){target=STORM_COAST[this.s.coastIndex]||EAST_PIER;}
  return {name:'Storm Response / '+x.name,detail,target,done:this.s.stage,total:8};
 }
 advance(){const result=advanceDirector(this.s);if(!result)return;
  if(result.complete){const awarded=result.first&&window.__dinoEconomy?.grant?.(1800,'aaa:storm-response');this.ctx.audio.mission?.();this.ctx.input.pulse(.45,240);this.ctx.info('STORM RESPONSE COMPLETE','Reserve systems stabilized.',`<p>Ground response, two helicopter rooftops, on-foot exploration and coastal delivery are complete.</p><p>${awarded?'1,800 credits were added to your saved balance.':result.first?'The reward could not be confirmed; your mission completion is saved.':'The first-completion reward was already collected. Replaying does not award it again.'}</p><p>Continue exploring, or open Menu for more activities and the development roadmap.</p>`);}
  else{this.ctx.audio.tone?.(620,.12);this.ctx.input.pulse(.16,90);this.ctx.radio(messages[this.s.stage]);}
  this.persist();
 }
 candidate(){
  const fleet=this.ctx.fleet,p=fleet.position,type=actionAt(this.s,p,fleet.mode,fleet.actor.speed);
  const labels={generator:'Start Meridian emergency generator',beacon:'Calibrate Northstar storm beacon',telemetry:'Recover marine telemetry',delivery:'Deliver storm telemetry'};
  if(type)return {kind:'director',label:labels[type]+' / A',type};
  if(this.s.active===STORM_ID&&fleet.mode==='foot'&&p.y<3&&Math.abs(fleet.actor.speed)<3){
   if(this.s.stage===2&&distance(p,AIR_DESK)<5)return {kind:'director',label:'Request helicopter transfer / A',type:'air-transfer'};
   if(this.s.stage===6&&distance(p,BOAT_DESK)<6)return {kind:'director',label:'Request boat transfer / A',type:'boat-transfer'};
  }
  return null;
 }
 interact(c){
  const current=this.candidate();if(!current||current.type!==c.type)return false;
  if(c.type.endsWith('-transfer')){const fleet=this.ctx.fleet,id=c.type==='air-transfer'?'helicopter':'boat',v=fleet.vehicles.find(v=>v.type===id);if(!v||fleet.active===v.id)return false;
   const p=id==='helicopter'?AIR_PAD:{...SOUTH_PIER.boat,y:.78};v.drive.reset(p,id==='helicopter'?Math.PI:Math.PI/2);v.recovery=0;
   this.persist();this.ctx.notify(id==='helicopter'?'Helicopter transferred to the adjacent marked pad. Approach and press Y / F to board.':'Patrol boat transferred to South Rescue Pier. Walk to the jetty and press Y / F.');return true;
  }
  this.advance();return true;
 }
 recoverCheckpoint(){
  if(!canResume(this.s))return;this.s=startDirector(this.s);const spawn=checkpointSpawn(this.s.stage),fleet=this.ctx.fleet;
  fleet.person.setActive(false);
  if(spawn.air){fleet.vehicles.find(v=>v.type==='helicopter').drive.reset(spawn.air,Math.PI);}
  if(spawn.mode==='foot'){fleet.active='foot';fleet.person.setActive(true,spawn.p);}
  else{const v=fleet.vehicles.find(v=>v.type===spawn.mode);fleet.active=v.id;v.drive.reset(spawn.p,spawn.mode==='boat'?Math.PI/2:Math.PI);v.lastDry={...spawn.p};}
  if(this.s.stage===7)this.s.coastIndex=0;
  this.ctx.ranch?.pauseTracking?.();this.ctx.close();this.ctx.input.clear();this.persist();this.ctx.notify('Recovered safely at the current story stage. Journal, cargo and other mission progress are unchanged.');
 }
 update(dt,time){
  this.time=time;if(this.s.active===STORM_ID&&dt>0){this.s.elapsed+=dt;const f=this.ctx.fleet,p=f.position;
   if(automaticStage(this.s,p,f.mode,f.actor.speed))this.advance();
   if(this.s.stage===7&&f.mode==='boat'&&STORM_COAST[this.s.coastIndex]&&distance(p,STORM_COAST[this.s.coastIndex])<30){this.s.coastIndex++;this.save();}
  }
  this.updateWeather(dt);this.buoys.forEach((g,i)=>g.visible=this.s.active===STORM_ID&&this.s.stage===7&&i>=this.s.coastIndex&&distance(g.position,this.ctx.fleet.position)<210);
 }
 updateWeather(dt){
  const target=this.s.storm?1:0;this.stormMix+=(target-this.stormMix)*Math.min(1,dt*1.2);const mix=this.stormMix,p=this.ctx.fleet.position;
  const inside=BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.hx&&Math.abs(p.z-b.z)<b.hz&&p.y<b.h-1);
  this.rain.visible=mix>.02&&!inside;this.rain.material.opacity=(this.ctx.settings.reduced?.22:.48)*mix;this.rain.position.set(p.x,p.y+1,p.z);
  if(this.rain.visible&&dt>0){const a=this.rain.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(18+a.getX(i)%5),x=a.getX(i)+dt*2.7;if(y<0)y+=35;if(x>35)x-=70;a.setXYZ(i,x,y,a.getZ(i));}a.needsUpdate=true;}
  const scene=this.ctx.scene;if(scene.fog){scene.fog.near=100-45*mix;scene.fog.far=245-65*mix;scene.fog.color.lerp(this.stormColor,mix*.4);}scene.background?.lerp(this.stormColor,mix*.4);
  // The base world sets daylight/dusk each frame; this weather grade never compounds.
  if(this.ctx.park){this.ctx.park.sun.intensity*=1-.38*mix;this.ctx.park.hemi.intensity*=1-.18*mix;}
  if(dt>0){this.lightning-=dt;if(this.s.storm&&this.lightning<=0){this.lightning=10+Math.random()*8;this.flash=this.s.flashes&&!this.ctx.settings.reduced?.3:0;this.thunder=1.2+Math.random()*1.6;}
   if(this.thunder>=0){this.thunder-=dt;if(this.thunder<0&&this.s.storm){const a=this.ctx.audio;if(a.context&&a.enabled){a.noiseHit?.(1,.045,160);a.tone?.(48,.25);}}}
   this.flash=Math.max(0,this.flash-dt*1.3);
  }
  this.flashLight.intensity=this.s.flashes&&!this.ctx.settings.reduced?this.flash*3*mix:0;
 }
 drawMap(ctx,to,k,full){const t=this.task()?.target;if(!t)return;const [x,z]=to(t.x,t.z);ctx.strokeStyle='#f6e09a';ctx.lineWidth=full?3:2;ctx.beginPath();ctx.arc(x,z,full?13:8,0,Math.PI*2);ctx.stroke();}
 snapshot(){return {build:AAA_BUILD,state:JSON.parse(JSON.stringify(this.s)),task:this.task(),stormMix:this.stormMix,flash:this.flashLight.intensity};}
}
