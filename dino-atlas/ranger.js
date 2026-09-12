import * as T from './vendor/three.module.js';
import {LivingHerds} from './living-herds.js?v=herds1';
import {HERDS_BUILD} from './herd-behavior.js?v=herds1';
import {animateResident} from './herd-rig.js?v=herds1';
import {byId,readProgress,writeProgress,addDiscovery,escapeHTML,brushPatch,digPercent} from './core.js';
import {HOME,LAKE,ROADS,STATIONS,MISSIONS,clamp,distance,readRanger,saveRanger,advance,waypoint} from './ranger-data.js';
import {initPhysics,ParkPhysics} from './ranger-physics.js?v=storm2';
import {makeJeep} from './ranger-art.js';
import {buildPark} from './ranger-world.js?v=storm2';
import {RangerAudio} from './ranger-audio.js';
import {BUILD,WORLD_RADIUS,WATER,DOCK,OUTPOSTS,PENS,TRAILS,TOOLS,CHECKPOINTS,ALL_ANIMALS,SPECIES,PREDATORS,readFrontier,saveFrontier,operations,penState,penTerminal,insidePen,speciesById,createResident,stepResident,deterAnimal} from './frontier-data.js?v=storm2';
import {Fleet} from './frontier-vehicles.js?v=storm2';
import {makeResident,makeHelicopter,makeBoat,makeBuggy,makePerson,makeTool} from './frontier-art.js?v=storm2';
import {buildFrontier} from './frontier-world.js?v=storm2';
import {RangerInput,focusable} from './ranger-input.js?v=storm2';
import {RangerTools} from './ranger-tools.js?v=storm2';
import {RanchGame,calibrateResident,scaleNote} from './ranch-game.js?v=storm2';
import {buildRanchWorld} from './ranch-world.js';
import {EXTRA_ROADS,LAND_RADIUS,RANCH_BUILD} from './ranch-data.js';
import {AAADirector,AAA_BUILD} from './aaa-director.js?v=storm2';
import {NorthstarSignature,buildNorthstarSignature,NORTHSTAR_BUILD} from './northstar-signature.js?v=northstar1';
const $=id=>document.getElementById(id),esc=escapeHTML;
export async function boot(){
 const R=await initPhysics();let storage;try{storage=localStorage;}catch{storage=null;}
 const campaign=readRanger(storage),state=readFrontier(storage),settings=state.settings;
 for(const id of campaign.observed)if(!state.observed.includes(id))state.observed.push(id);
 let ranch=null,director=null,herds=null,signature=null;
 let started=false,time=0,accumulator=0,last=performance.now(),uiClock=0,saveClock=0,hornAt=-100,startedAt=0,candidate=null,aiming=false,drag=null,beamAge=10,toastTimer,radioTimer,backTarget=null;
 let cameraMode=settings.camera,yaw=.65,pitch=.65,aimPitch=.04,zoom=34,campaignPinned=campaign.stage<5,lastPosition={...HOME},lastNotice='',noticeAt=-100,lastJournalSelection=null;
 settings.reduced||=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const canvas=$('park'),audio=new RangerAudio(),renderer=new T.WebGLRenderer({canvas,antialias:!settings.low,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(46,1,.1,750),physics=new ParkPhysics(),park=buildPark(scene,physics),fleet=new Fleet(physics,state),frontier=buildFrontier(scene,physics,state),ranchWorld=buildRanchWorld(scene,physics),signatureWorld=buildNorthstarSignature(scene,physics),tools=new RangerTools(state);
 const models={jeep:makeJeep,helicopter:makeHelicopter,boat:makeBoat,buggy:makeBuggy};
 for(const v of fleet.vehicles){v.model=models[v.type]();scene.add(v.model);}
 const personModel=makePerson(),toolModel=makeTool();scene.add(personModel,toolModel);
 const animals=ALL_ANIMALS.map((d,i)=>{const a=createResident(d,i),p=PENS.find(p=>p.id===a.pen);if(p&&penState(state,p).secured){a.x=p.x+(i%3-1)*8;a.z=p.z+(i%2?6:-6);a.origin={x:a.x,z:a.z};}a.model=makeResident(a);calibrateResident(a);a.collider=physics.animal(a.radius,a.x,a.z,a.collisionHeight);scene.add(a.model);return a;});
 for(let i=0;i<120;i++){fleet.drive({},1/60,0,yaw);physics.world.step();}park.setPowered(campaign.stage>=3);
 const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(39),3));const beam=new T.Line(lineGeo,new T.LineBasicMaterial({color:0x8bdcf2,transparent:true,opacity:.9}));beam.frustumCulled=false;beam.visible=false;scene.add(beam);
 const flash=new T.Mesh(new T.IcosahedronGeometry(.3,1),new T.MeshBasicMaterial({color:0xabeaff,transparent:true,opacity:.7}));scene.add(flash);flash.visible=false;
 const modals=()=>[...document.querySelectorAll('dialog[open]')],modal=()=>!started?$('intro'):modals().at(-1)||null,isPaused=()=>!!modal()||document.hidden;
 const input=new RangerInput({action,modal,mode:()=>fleet.mode,onDevice:updateDevice,onDisconnect:()=>{if(started&&!modal())show('menu-dialog');toast('Controller disconnected. The game is paused; reconnect and press B to resume.');}});input.vibration=settings.vibration;
 fleet.onNotice=toast;fleet.onRecover=v=>{if(v.id===fleet.active)toast('Vehicle auto-righted in place. No damage or progress lost.');input.pulse(.45,180);};
 function quality(low){settings.low=!!low;renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?.75:1.6));renderer.shadowMap.enabled=!low;$('quality-select').value=low?'low':'high';}
 quality(settings.low);const size=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};window.addEventListener('resize',size);size();
 camera.position.set(32,24,77);camera.lookAt(-3,2,31);
 function toast(text){if(text===lastNotice&&time-noticeAt<2)return;lastNotice=text;noticeAt=time;$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
 function radio(text){$('radio-text').textContent=text;$('radio').classList.add('show');clearTimeout(radioTimer);radioTimer=setTimeout(()=>$('radio').classList.remove('show'),6500);}
 function save(){signature?.save();herds?.save();ranch?.save();director?.save();fleet.capture();settings.camera=cameraMode;const a=saveRanger(storage,campaign),b=saveFrontier(storage,state);if(!a||!b)toast('This browser cannot save progress. Keep the tab open or enable local storage.');}
 function close(){const d=modals().at(-1);if(d)d.close();input.clear();if(backTarget){const target=backTarget;backTarget=null;if(target==='journal')openJournal();else if(target==='operations')openOperations();else if(target==='menu')show('menu-dialog');}else canvas.focus({preventScroll:true});}
 function show(id){for(const d of modals())if(d.id!==id)d.close();input.clear();const d=$(id);if(!d.open)d.showModal();focusable(d)[0]?.focus({preventScroll:true});}
 function info(kicker,title,html,back=null){backTarget=back;$('info-kicker').textContent=kicker;$('info-title').textContent=title;$('info-body').innerHTML=html;show('info-dialog');}
 for(const d of document.querySelectorAll('dialog')){d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('close',()=>input.clear());}
 document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
 function mission(event){if(advance(campaign,event)){park.setPowered(campaign.stage>=3);save();radio(MISSIONS[campaign.stage].radio);input.pulse(.22);audio.tone(660,.14);if(campaign.stage===5)campaignPinned=false;return true;}return false;}
 function observe(id){const d=speciesById(id),old=byId(id);if(!d)return;if(!state.observed.includes(id))state.observed.push(id);
  if(old){if(!campaign.observed.includes(id))campaign.observed.push(id);const p=readProgress(storage).progress;addDiscovery(p,'observed',id);writeProgress(storage,p);}
  if(old?old.diet==='Plant-eater':!PREDATORS.has(d.kind))mission('survey');save();
  info('SPECIES RECORDED / RANGER JOURNAL',d.name,`<p>${esc(d.role)}</p><p class="fact">${esc(scaleNote(d.id))}</p>${old?`<p class="fact"><b>THE FOSSIL EVIDENCE</b>${esc(old.evidence)}</p><p class="fact"><b>STILL UNKNOWN</b>${esc(old.unknown)}</p>`:'<p class="fact"><b>RESERVE NOTE</b>This animal model and its behavior are stylized for a fictional mixed-period reserve, not a validated reconstruction.</p>'}<p>${state.observed.length} of ${SPECIES.length} species recorded. Your earlier field-guide notes and discoveries remain untouched.</p>`);
 }
 function openJournal(){backTarget=null;$('journal-list').innerHTML=SPECIES.map(d=>`<button class="entry" data-species="${d.id}"><span>${esc(d.name)}</span><small>${state.observed.includes(d.id)?'RECORDED':'NOT YET OBSERVED'}</small></button>`).join('');$('journal-summary').textContent=state.observed.length+' / '+SPECIES.length+' species recorded';show('journal-dialog');}
 $('journal-list').addEventListener('click',e=>{const b=e.target.closest('[data-species]');if(!b)return;const d=speciesById(b.dataset.species);lastJournalSelection=d.id;info(state.observed.includes(d.id)?'RECORDED SPECIES':'RESERVE FIELD GUIDE',d.name,`<p>${esc(d.role)}</p><p class="fact">${esc(scaleNote(d.id))}</p><p>Approach this animal and press A to record a field observation. Use short tool bursts to guide it without injuring it.</p>`,'journal');});
 function openOperations(){backTarget=null;const tasks=operations(state);$('operations-list').innerHTML=tasks.map(o=>`<button class="entry" data-track="${o.id}"><span>${esc(o.name)}<small>${esc(o.detail)}</small></span><b>${o.done} / ${o.total}</b></button>`).join('');show('operations-dialog');}
 $('operations-list').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(b){state.tracked=b.dataset.track;campaignPinned=false;director?.suspend();ranch?.pauseTracking();close();save();toast('Operation pinned to your HUD and map.');}});
 function openMap(){backTarget=null;$('outpost-list').innerHTML=OUTPOSTS.map(o=>`<button class="entry" data-travel="${o.id}" ${state.outposts.includes(o.id)?'':'disabled'}><span>${esc(o.name)}</span><small>${state.outposts.includes(o.id)?'TRAVEL':'VISIT TO UNLOCK'}</small></button>`).join('');drawMap($('fullmap'),true);show('map-dialog');}
 $('outpost-list').addEventListener('click',e=>{const b=e.target.closest('[data-travel]');if(b&&fleet.travel(b.dataset.travel)){tools.refill();close();save();toast('Arrived at '+OUTPOSTS.find(o=>o.id===b.dataset.travel).name+'. Equipment refilled.');}});
 function openOutpost(o){if(!state.outposts.includes(o.id)){state.outposts.push(o.id);radio(o.name+' is on the ranger network. It is now a rest point and travel destination.');}state.checkpoint=o.id;tools.refill();save();backTarget=null;
  $('outpost-title').textContent=o.name;$('outpost-summary').textContent='Checkpoint saved. Water tanks and zapper batteries are full. '+state.outposts.length+' of 6 outposts established.';show('outpost-dialog');}
 let selectedPen=null;
 function openPen(p){selectedPen=p;backTarget=null;updatePenPanel();show('pen-dialog');}
 function updatePenPanel(){const p=selectedPen,ps=penState(state,p),count=animals.filter(a=>a.pen===p.id&&insidePen(a,p,2)).length;$('pen-title').textContent=p.name;$('pen-status').textContent=`${count} / 4 residents inside. Gate ${ps.open?'open':'closed'}. Feeder ${ps.fed?'stocked':'empty'}. ${ps.secured?'Containment recorded.':'Guide everyone inside, then close the gate.'}`;$('pen-gate').textContent=ps.open?'Close enclosure gate':'Open enclosure gate';$('pen-feed').textContent=ps.fed?'Replenish feeder':'Fill feeder and call residents';}
 $('pen-gate').onclick=()=>{const ps=penState(state,selectedPen),t=selectedPen;if(ps.open&&distance(fleet.position,{x:t.x,z:t.z+t.hz})<7){toast('Move clear of the gateway before closing it.');return;}ps.open=!ps.open;updatePenPanel();save();};
 $('pen-feed').onclick=()=>{penState(state,selectedPen).fed=true;updatePenPanel();save();toast('Feeder stocked. Residents can return through an open gate.');};
 $('pen-track').onclick=()=>{director?.suspend();ranch?.pauseTracking();state.tracked='pens';campaignPinned=false;close();};
 function openLab(){const p=readProgress(storage).progress,id=lastJournalSelection&&byId(lastJournalSelection)?lastJournalSelection:'diplodocus',d=byId(id);backTarget=null;$('lab-species').value=id;updateLab();show('lab-dialog');}
 function updateLab(){const p=readProgress(storage).progress,id=$('lab-species').value;$('dig-status').textContent=digPercent(p,id)+'% brushed. Each patch needs two careful passes.';$('dig-progress').value=digPercent(p,id);$('lab-brush').disabled=digPercent(p,id)===100;}
 $('lab-species').onchange=updateLab;$('lab-brush').onclick=()=>{const p=readProgress(storage).progress,id=$('lab-species').value,index=(p.digs[id]||Array(48).fill(0)).findIndex(v=>v<2);if(index>=0){brushPatch(p,id,index);writeProgress(storage,p);updateLab();input.pulse(.07,35);}};
 function interact(){if(isPaused()||!candidate)return;if(candidate.kind==='director'){director.interact(candidate);return;}if(candidate.kind==='northstar'){signature.interact();return;}if(candidate.kind==='herds'){herds.interact();return;}if(candidate.kind==='ranch'){ranch.interact(candidate);return;}if(Math.abs(fleet.actor.speed)>3){toast('Slow down before interacting.');return;}const c=candidate;
  if(c.kind==='animal')observe(c.id);
  else if(c.kind==='pen')openPen(c.pen);
  else if(c.kind==='outpost')openOutpost(c.outpost);
  else if(c.kind==='power'){mission('power');toast('Relay restored. The original northern gate is opening.');}
  else if(c.kind==='recorder'){if(mission('recorder'))info('FIELD RECORDER SECURED','Return the recorder to base.','<p>Follow the amber marker to the visitor center. Your vehicle takes no damage; a rollover automatically rights itself in place.</p>');}
  else if(c.kind==='home'){if(mission('home'))info('ORIGINAL EXPEDITION COMPLETE','A bigger reserve awaits.',`<p>Your recorder is safe. Ranger Operations now offers eight new enclosures, six outposts, a wetland patrol, and 30 species to discover.</p><p>Press View for the map or Menu for the operations board.</p>`);}
  else if(c.kind==='lab')openLab();else if(c.kind==='vehicle')fleet.board();
 }
 function action(key){
  if(!started){if(key==='back')return;return;}
  if(key==='back'){close();return;}
  if(key==='tabPrev'||key==='tabNext'){if(!modal())return;const tabs=['operations-dialog','journal-dialog','map-dialog','menu-dialog'],i=tabs.indexOf(modal().id),idx=(i+(key==='tabNext'?1:-1)+tabs.length)%tabs.length;backTarget=null;[openOperations,openJournal,openMap,()=>show('menu-dialog')][idx]();return;}
  if(key==='menu'){if(modal())close();else{backTarget=null;show('menu-dialog');}return;}
  if(key==='map'){if(modal()?.id==='map-dialog')close();else openMap();return;}
  if(key==='operations'){openOperations();return;}if(key==='journal'){openJournal();return;}
  if(isPaused())return;
  if(key==='interact')interact();
  else if(key==='board'){if(fleet.board()){input.clear();save();}}
  else if(key==='reload'){if(tools.reload()){audio.tone(360,.08);toast(TOOLS[state.tool].id==='water'?'Reloading water tank...':'Replacing zapper battery...');}else if(state.reserve[state.tool]===0)toast('No spare supplies. Rest at an outpost to replenish.');else if(tools.reloadLeft===0)toast('This tool is already full.');}
  else if(key==='nextTool'||key==='prevTool'){tools.switch(key==='nextTool'?1:-1);toast(tools.tool.name+' selected. X reloads.');}
  else if(key==='water'||key==='zapper'){state.tool=key==='water'?0:1;tools.reloadLeft=0;tools.reloadTool=null;}
  else if(key==='recover'){if(fleet.current)fleet.recover();else toast('You are on foot. Vehicles right themselves automatically.');}
  else if(key==='horn'){hornAt=time;ranch?.horn();audio.horn();input.pulse(.15,120);if(!ranch)toast('Horn sounded. Give nearby animals room to move.');}
  else if(key==='camera'){cameraMode=cameraMode==='orbit'?'chase':'orbit';$('camera-select').value=cameraMode;toast(cameraMode==='orbit'?'Orbit camera':'Chase camera');}
  else if(key==='lights'){settings.night=!settings.night;$('night-toggle').checked=settings.night;}
 }
 function updateDevice(device){document.body.dataset.input=device;$('input-status').textContent=device==='gamepad'?'XBOX / STANDARD GAMEPAD':device==='touch'?'TOUCH CONTROLS':'KEYBOARD + MOUSE';$('interact-key').textContent=device==='gamepad'?'A':'E';$('board-key').textContent=device==='gamepad'?'Y':'F';$('reload-key').textContent=device==='gamepad'?'X':'R';}
 $('start-button').onclick=()=>{started=true;startedAt=performance.now();$('intro').hidden=true;$('hud').hidden=false;input.clear();canvas.focus({preventScroll:true});radio('Ranger Operations is online. Y exits your vehicle. X reloads. View opens the map. Menu opens every setting.');last=performance.now();lastPosition={...fleet.position};if(!state.rides.includes(fleet.mode)&&fleet.mode!=='foot')state.rides.push(fleet.mode);ranch?.start();director?.start();};
 $('interact-button').onclick=interact;$('board-button').onclick=()=>action('board');$('reload-button').onclick=()=>action('reload');$('tool-button').onclick=()=>action('nextTool');
 for(const id of ['map-button','minimap-button','menu-map'])$(id).onclick=openMap;
 $('menu-button').onclick=()=>action('menu');$('menu-operations').onclick=openOperations;$('menu-journal').onclick=openJournal;$('menu-lab').onclick=openLab;
 $('menu-controls').onclick=()=>{backTarget='menu';show('controls-dialog');};$('outpost-operations').onclick=openOperations;$('outpost-map').onclick=openMap;
 $('campaign-track').onclick=()=>{director?.suspend();ranch?.pauseTracking();campaignPinned=campaign.stage<5;close();};
 $('manual-recover').onclick=()=>{close();if(fleet.current)fleet.recover();};
 $('resupply-button').onclick=()=>{tools.refill();save();toast('Water tanks and battery reserves replenished.');};
 $('sound-button').onclick=async()=>{try{const on=await audio.toggle();$('sound-button').textContent=on?'Sound: on':'Sound: off';}catch{toast('This browser has not enabled audio playback.');}};
 $('camera-select').value=cameraMode;$('camera-select').onchange=e=>cameraMode=e.target.value;
 $('quality-select').onchange=e=>quality(e.target.value==='low');
 for(const [id,key] of [['night-toggle','night'],['motion-toggle','reduced'],['vibration-toggle','vibration']]){$(id).checked=settings[key];$(id).onchange=e=>{settings[key]=e.target.checked;input.vibration=settings.vibration;};}
 $('sensitivity').value=settings.sensitivity;$('sensitivity').oninput=e=>{settings.sensitivity=Number(e.target.value);$('sensitivity-value').textContent=settings.sensitivity.toFixed(1);};
 // No native confirm/alert can trap a controller user.
 $('reset-training').onclick=()=>{backTarget='menu';$('confirm-title').textContent='Reset training crates?';$('confirm-copy').textContent='Only the ten practice blast crates will return. All journals, missions, enclosures and checkpoints are preserved.';show('confirm-dialog');};
 $('confirm-yes').onclick=()=>{state.exploded=[];for(const c of frontier.crates){c.exploded=false;c.body.setEnabled(true);}backTarget=null;close();save();toast('Practice blast crates restored.');};
 for(const b of document.querySelectorAll('[data-drive]')){const end=()=>{input.touch.delete(b.dataset.drive);b.classList.remove('pressed');};b.onpointerdown=e=>{e.preventDefault();if(isPaused())return;input.setDevice('touch');b.setPointerCapture(e.pointerId);input.touch.add(b.dataset.drive);b.classList.add('pressed');};for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,end);}
 for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>action(b.dataset.action);
 canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('pointerdown',e=>{if(isPaused())return;input.setDevice(e.pointerType==='touch'?'touch':'keyboard');canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,button:e.button};if(e.button===2)input.mouseAim=true;else if(e.button===0&&(input.mouseAim||fleet.mode==='foot'))input.mouseFire=true;});
 canvas.addEventListener('pointermove',e=>{if(!drag||isPaused())return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;yaw-=dx*.005*settings.sensitivity;if(input.mouseAim)aimPitch=clamp(aimPitch+dy*.004,-.6,.8);else pitch=clamp(pitch+dy*.004,.3,1.15);drag={...drag,x:e.clientX,y:e.clientY};});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{drag=null;input.mouseAim=false;input.mouseFire=false;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.025,18,68);},{passive:false});
 window.addEventListener('blur',()=>{input.clear();if(started&&!modal()){backTarget=null;show('menu-dialog');}});document.addEventListener('visibilitychange',()=>{input.clear();if(document.hidden&&started&&!modal()){backTarget=null;show('menu-dialog');}});window.addEventListener('pagehide',save);
 function updateCandidate(){const p=fleet.position;candidate=null;const key=MISSIONS[campaign.stage].key;
  if(p.y<5&&['power','recorder','home'].includes(key)&&distance(p,STATIONS[key])<7)candidate={kind:key};
  if(!candidate&&p.y<4){const pen=PENS.find(p=>distance(fleet.position,penTerminal(p))<8);if(pen)candidate={kind:'pen',pen};}
  if(!candidate&&p.y<4){const outpost=OUTPOSTS.find(o=>distance(p,o)<7);if(outpost)candidate={kind:'outpost',outpost};}
  if(!candidate&&p.y<7){let gap=Infinity;for(const a of animals){const d=distance(p,a);if(d<a.radius+8&&d<gap){gap=d;candidate={kind:'animal',id:a.species,mood:a.mood};}}}
  if(!candidate&&distance(p,{x:-48,z:-15})<8)candidate={kind:'lab'};
  const nearVehicle=fleet.mode==='foot'?fleet.nearest():null;if(!candidate&&nearVehicle)candidate={kind:'vehicle'};
  candidate=director?.candidate()||signature?.candidate()||herds?.candidate()||ranch?.candidate()||candidate;
  const labels={power:'Restore research relay',recorder:'Recover field recorder',home:'Deliver recorder',lab:'Explore the fossil lab',vehicle:'Board nearby vehicle'};
  $('interact-label').textContent=candidate?(Math.abs(fleet.actor.speed)>3?'Slow down to interact':candidate.kind==='herds'?candidate.label:candidate.kind==='director'?candidate.label:candidate.kind==='ranch'?candidate.label:candidate.kind==='animal'?'Observe '+speciesById(candidate.id).name:candidate.kind==='pen'?'Manage '+candidate.pen.name:candidate.kind==='outpost'?'Rest at '+candidate.outpost.name:labels[candidate.kind]):'Explore the reserve';$('interact-button').disabled=!candidate||Math.abs(fleet.actor.speed)>3;
  $('board-label').textContent=fleet.mode==='foot'?(nearVehicle?'Board '+nearVehicle.name:'Approach a vehicle'):'Exit '+fleet.current.name;$('board-button').disabled=fleet.mode==='foot'&&!nearVehicle;
  const threat=animals.find(a=>a.mood==='pursuing'&&distance(a,p)<20);document.body.classList.toggle('danger',!!threat);$('encounter-label').textContent=threat?'CHARGE WARNING / USE YOUR RANGER TOOL':candidate?.kind==='animal'?candidate.mood:'No vehicle damage. Automatic in-place recovery.';
 }
 function activeTask(){const story=director?.task();if(story)return story;const facility=signature?.task();if(facility)return facility;const study=herds?.task();if(study)return study;const guided=ranch?.task();if(guided)return guided;if(campaignPinned&&campaign.stage<5){const m=MISSIONS[campaign.stage];return {name:m.title,detail:m.text.replaceAll('press E','press A / E'),target:waypoint(campaign),done:campaign.stage,total:5};}return operations(state).find(o=>o.id===state.tracked)||operations(state)[0];}
 function drawMap(cv,full=false){const ctx=cv.getContext('2d'),s=cv.width,p=fleet.position,span=full?1110:145,k=s/span,cx=full?0:p.x,cz=full?0:p.z,to=(x,z)=>[s/2+(x-cx)*k,s/2+(z-cz)*k];ctx.clearRect(0,0,s,s);ctx.save();if(!full){ctx.beginPath();ctx.arc(s/2,s/2,s/2-1,0,7);ctx.clip();}ctx.fillStyle='#24493e';ctx.fillRect(0,0,s,s);ctx.fillStyle='#516b4c';ctx.beginPath();ctx.arc(...to(0,0),LAND_RADIUS*k,0,7);ctx.fill();
  for(const w of WATER){ctx.fillStyle='#548e91';ctx.beginPath();ctx.ellipse(...to(w.x,w.z),w.rx*k,w.rz*k,0,0,7);ctx.fill();}ctx.beginPath();ctx.arc(...to(LAKE.x,LAKE.z),LAKE.r*k,0,7);ctx.fill();
  ranch?.drawMap(ctx,to,k,full);signature?.drawMap(ctx,to,k,full);director?.drawMap(ctx,to,k,full);ctx.strokeStyle='#c4af7e';ctx.lineWidth=full?2:3;for(const r of [...ROADS,...TRAILS,...EXTRA_ROADS]){ctx.beginPath();r.forEach(([x,z],i)=>i?ctx.lineTo(...to(x,z)):ctx.moveTo(...to(x,z)));ctx.stroke();}
  for(const pen of PENS){const [x,z]=to(pen.x-pen.hx,pen.z-pen.hz);ctx.fillStyle=state.pens[pen.id]?.secured?'#7ca67455':'#b1945b55';ctx.fillRect(x,z,pen.hx*2*k,pen.hz*2*k);ctx.strokeStyle='#a5b286';ctx.strokeRect(x,z,pen.hx*2*k,pen.hz*2*k);if(full){ctx.fillStyle='#e3dac0';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(pen.name,...to(pen.x,pen.z-pen.hz-5));}}
  for(const a of animals){ctx.fillStyle=PREDATORS.has(a.kind)?'#e4a274':'#b3d9a6';ctx.beginPath();ctx.arc(...to(a.x,a.z),full?2:3,0,7);ctx.fill();}
  for(const o of OUTPOSTS){const [x,z]=to(o.x,o.z);ctx.fillStyle=state.outposts.includes(o.id)?'#f4d591':'#a4b6b6';ctx.fillRect(x-4,z-4,8,8);if(full){ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(o.name,x,z+17);}}
  for(const v of fleet.vehicles){const [x,z]=to(v.drive.position.x,v.drive.position.z);ctx.fillStyle='#b6e6ed';ctx.beginPath();ctx.arc(x,z,full?4:4.5,0,7);ctx.fill();if(full){ctx.font='9px sans-serif';ctx.fillText(v.type,x,z-8);}}
  const target=activeTask().target;if(target){ctx.strokeStyle='#ffdb84';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...to(target.x,target.z),full?10:8,0,7);ctx.stroke();}
  const [x,z]=to(p.x,p.z);ctx.save();ctx.translate(x,z);ctx.rotate(Math.PI+fleet.actor.heading);ctx.fillStyle='#fff5d9';ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(0,3);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#eed9a8';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('N',s/2,16);ctx.restore();
 }
 function shoot(){const t=tools.fire();if(!t){if(state.ammo[state.tool]<1&&tools.reloadLeft===0)toast('Tool empty. Press X / R to reload.');return;}
  const p=fleet.position,dir={x:-Math.sin(yaw)*Math.cos(aimPitch),y:-Math.sin(aimPitch),z:-Math.cos(yaw)*Math.cos(aimPitch)},reach=fleet.mode==='foot'?1.2:3.5,side=fleet.mode==='foot'?.35:.85,origin={x:p.x+dir.x*reach+Math.cos(yaw)*side,y:p.y+(fleet.mode==='foot'?.35:1.65)+dir.y*reach,z:p.z+dir.z*reach-Math.sin(yaw)*side};
  const actor=fleet.actor,hit=physics.world.castRay(new R.Ray(origin,dir),t.range,true,undefined,undefined,actor.collider,actor.body);let length=hit?hit.timeOfImpact:t.range;
  if(hit){const a=animals.find(a=>a.collider.collider(0).handle===hit.collider.handle);if(a&&!ranch){deterAnimal(a,origin,t.id);state.toolHits[t.id]++;}const c=frontier.crates.find(c=>!c.exploded&&c.body.collider(0).handle===hit.collider.handle);if(c)blast(c);}
  if(ranch){const a=hit?animals.find(a=>a.collider.collider(0).handle===hit.collider.handle):null;ranch.shot(t,origin,dir,length,a);}
  const positions=lineGeo.attributes.position;for(let i=0;i<=12;i++){const f=i/12,shake=t.id==='zapper'&&i>0&&i<12?Math.sin(i*24+time*47)*.12:0;positions.setXYZ(i,origin.x+dir.x*length*f+shake,origin.y+dir.y*length*f+(t.id==='water'?.12*Math.sin(f*Math.PI):shake),origin.z+dir.z*length*f);}positions.needsUpdate=true;beam.material.color.setHex(t.color);beamAge=0;beam.visible=true;flash.visible=true;flash.material.color.setHex(t.color);flash.position.set(origin.x+dir.x*length,origin.y+dir.y*length,origin.z+dir.z*length);
  if(t.id==='zapper')audio.tone(160,.08);
 }
 function blast(c){const origin=frontier.detonate(c);if(!origin)return;fleet.blast(origin);for(const a of animals)if(distance(a,origin)<22)deterAnimal(a,origin,'water');toast('Training crate detonated. Vehicles take no damage and auto-right.');audio.tone(80,.25);input.pulse(.8,250);save();}
 function syncModels(dt){for(const v of fleet.vehicles){const d=v.drive;v.model.position.copy(d.position);v.model.quaternion.copy(d.body.rotation());if(v.model.userData.tires)v.model.userData.tires.forEach(({pivot,roll},i)=>{const c=d.connections[i];pivot.position.set(c.x,c.y-(d.controller.wheelSuspensionLength(i)??.42),c.z);pivot.rotation.y=i<2?d.steer:0;roll.rotation.x=d.controller.wheelRotation(i)||0;});if(v.model.userData.light){v.model.userData.light.visible=settings.night&&v.id===fleet.active;v.model.userData.light.intensity=settings.night?95:0;}if(v.model.userData.rotor){v.model.userData.rotor.rotation.y+=dt*(v.id===fleet.active?38:3);v.model.userData.tailRotor.rotation.x+=dt*45;}}
  personModel.visible=fleet.mode==='foot';personModel.position.set(fleet.person.position.x,fleet.person.position.y-.9,fleet.person.position.z);personModel.rotation.y=aiming?yaw+Math.PI:fleet.person.heading;for(const [i,l] of personModel.userData.legs.entries())l.rotation.x=settings.reduced?0:Math.sin(time*9+i*Math.PI)*Math.min(.45,fleet.person.speed*.08);
  const p=fleet.position;for(const a of animals){a.model.visible=distance(a,p)<(settings.low?110:165);a.model.position.set(a.x,0,a.z);a.model.rotation.y=a.angle;if(a.model.visible)animateResident(a,dt,time,settings.reduced);}
  toolModel.visible=aiming||fleet.mode==='foot';const reach=fleet.mode==='foot'?.4:2,side=fleet.mode==='foot'?.35:.85;toolModel.scale.setScalar(fleet.mode==='foot'?1:2);toolModel.position.set(p.x-Math.sin(yaw)*Math.cos(aimPitch)*reach+Math.cos(yaw)*side,p.y+(fleet.mode==='foot'?.35:1.65)-Math.sin(aimPitch)*reach,p.z-Math.cos(yaw)*Math.cos(aimPitch)*reach-Math.sin(yaw)*side);toolModel.rotation.set(aimPitch,yaw+Math.PI,0,'YXZ');
  beamAge+=dt;beam.visible=beamAge<.13;flash.visible=beamAge<.13;beam.material.opacity=Math.max(0,1-beamAge/.15);flash.material.opacity=Math.max(0,.6-beamAge*4);
 }
 function ui(){ranch?.hud();const task=activeTask(),p=fleet.position;$('mission-title').textContent=task.name;$('mission-copy').textContent=task.detail;$('mission-index').textContent=task.done+' / '+task.total;$('mission-progress').max=task.total;$('mission-progress').value=task.done;$('waypoint-distance').textContent=task.target?Math.round(distance(p,task.target))+' m':'RANGER OPERATIONS';
  $('speed').textContent=String(Math.round(Math.abs(fleet.actor.speed)*3.6)).padStart(2,'0');$('mode-label').textContent=fleet.current?.name||'Ranger on foot';$('altitude').textContent=fleet.mode==='helicopter'?Math.round(Math.max(0,p.y-1))+' m ALT':state.outposts.length+' / 6 OUTPOSTS';
  $('tool-name').textContent=tools.tool.name;$('ammo').textContent=Math.ceil(state.ammo[state.tool]);$('ammo-reserve').textContent=Math.floor(state.reserve[state.tool]);$('ammo-bar').value=state.ammo[state.tool];$('ammo-bar').max=tools.tool.capacity;$('reload-status').textContent=tools.reloadLeft>0?'Reloading '+tools.reloadLeft.toFixed(1)+' s':state.ammo[state.tool]<1?'EMPTY / X TO RELOAD':'X / R RELOAD';$('reload-bar').hidden=tools.reloadLeft===0;$('reload-bar').value=tools.tool.reload-tools.reloadLeft;$('reload-bar').max=tools.tool.reload;
  $('vehicle-status').textContent=fleet.current?.recovery>.1?'AUTO-RIGHTING...':'NO VEHICLE DAMAGE';$('region-label').textContent=[...OUTPOSTS].sort((a,b)=>distance(a,p)-distance(b,p))[0].name.toUpperCase();$('reticle').hidden=!(aiming||fleet.mode==='foot');
  $('mode-controls').textContent=input.device==='gamepad'?(fleet.mode==='foot'?'LS move / RT fire / LT aim / X reload / Y board':fleet.mode==='helicopter'?'LS fly / RT rise / LT land / LB+RT tool / Y exit':'RT drive / LT reverse / LB+RT tool / X reload / Y exit'):(fleet.mode==='foot'?'WASD move / Mouse fire / R reload / F board':fleet.mode==='helicopter'?'WASD fly / Z rise / X descend / F exit':'WASD drive / Space brake / Shift boost / F exit');
  document.body.dataset.mode=fleet.mode;updateCandidate();herds?.hud();drawMap($('minimap'));if($('map-dialog').open)drawMap($('fullmap'),true);park.beacon.visible=!!task.target;if(task.target)park.beacon.position.set(task.target.x,0,task.target.z);
 }
 let slowFrames=0,qualityAutoChanged=false;
 function frame(now){requestAnimationFrame(frame);const realDt=Math.min(Math.max((now-last)/1000,0),.1);last=now;
  // Always poll UI/controller first, even in intro screens, pause menus, and modals.
  const controls=input.sample(realDt);const paused=isPaused(),dt=paused?0:realDt;aiming=!paused&&controls.aim;
  if(!paused){yaw-=controls.lookX*realDt*2.15*settings.sensitivity;if(aiming||fleet.mode==='foot')aimPitch=clamp(aimPitch+controls.lookY*realDt*1.1*settings.sensitivity,-.65,.9);else pitch=clamp(pitch+controls.lookY*realDt*.85,.3,1.15);
   if(cameraMode==='chase'&&!aiming&&Math.abs(controls.lookX)<.1&&fleet.mode!=='foot'&&fleet.mode!=='helicopter'){const wanted=fleet.actor.heading+Math.PI;yaw+=Math.atan2(Math.sin(wanted-yaw),Math.cos(wanted-yaw))*Math.min(1,realDt*2);}
   accumulator+=dt;let steps=0;
   while(accumulator>=1/60&&steps<6&&!isPaused()){const step=1/60;time+=step;tools.tick(step);const herdContext=herds?.beforeStep();
    for(const a of animals){stepResident(a,fleet.position,step,time,state,time-hornAt,herdContext);a.collider.setNextKinematicTranslation({x:a.x,y:a.collisionHeight/2,z:a.z});}
    fleet.drive(controls,step,time,yaw);physics.world.step();fleet.afterStep(step);frontier.update(step,time,fleet.position,settings.reduced);
    if(controls.fire)shoot();
    for(const a of animals)if(a.deter===0&&(a.mood==='pursuing'||['sauropod','brachio','trike','ankylosaur'].includes(a.kind)&&distance(a,fleet.position)<a.radius+1.4)){if(fleet.hitBy(a)){toast(speciesById(a.species).name+' shoved the vehicle. Auto-recovery is active.');input.pulse(.55,190);}}
    for(const c of frontier.crates)if(!c.exploded&&fleet.current&&Math.abs(fleet.actor.speed)>4.5&&distance(c.body.translation(),fleet.position)<3&&fleet.position.y<4)blast(c);
    const p=fleet.position;if(campaign.stage===0&&distance(p,STATIONS.gate)<5)mission('gate');const walked=distance(p,lastPosition);if(walked<4)campaign.meters+=walked;lastPosition={x:p.x,z:p.z};
    for(const pen of PENS){const ps=penState(state,pen);if(!ps.secured&&!ps.open&&ps.fed&&animals.filter(a=>a.pen===pen.id).every(a=>insidePen(a,pen,2))){ps.secured=true;radio(pen.name+' secured. Containment recorded.');save();}}
    if(!state.patrolDone&&distance(p,CHECKPOINTS[state.patrol])<8){state.patrol++;if(state.patrol>=CHECKPOINTS.length)state.patrolDone=true;toast(state.patrolDone?'Perimeter patrol completed.':'Patrol checkpoint '+state.patrol+' / '+CHECKPOINTS.length);save();}
    if(fleet.mode!=='foot'&&!state.rides.includes(fleet.mode)&&Math.abs(fleet.actor.speed)>1)state.rides.push(fleet.mode);
    accumulator-=step;steps++;
   }
   saveClock+=dt;if(saveClock>8){saveClock=0;save();}
  }else accumulator=0;
  syncModels(dt);herds?.update(dt,time);ranch?.update(dt,time);park.update(dt,time,fleet.actor,settings.night,settings.reduced);director?.update(dt,time);signature?.update(dt,time);audio.update(fleet.actor.speed,!paused&&fleet.mode!=='foot');
  if(started){const p=fleet.position;if(aiming||fleet.mode==='foot'&&controls.fire){const dir=new T.Vector3(-Math.sin(yaw)*Math.cos(aimPitch),-Math.sin(aimPitch),-Math.cos(yaw)*Math.cos(aimPitch));const back=fleet.mode==='foot'?5.4:8,side=fleet.mode==='foot'?.75:2.2,height=fleet.mode==='foot'?1.45:3.8;const shoulder=new T.Vector3(p.x+Math.sin(yaw)*back+Math.cos(yaw)*side,p.y+height,p.z+Math.cos(yaw)*back-Math.sin(yaw)*side);camera.position.lerp(shoulder,1-Math.exp(-realDt*12));const toolReach=fleet.mode==='foot'?1.2:3.5,toolSide=fleet.mode==='foot'?.35:.85;const target=new T.Vector3(p.x+Math.cos(yaw)*toolSide,p.y+(fleet.mode==='foot'?.35:1.65),p.z-Math.sin(yaw)*toolSide).addScaledVector(dir,35+toolReach);camera.lookAt(target);}else{const dist=fleet.mode==='helicopter'?Math.max(zoom,40):fleet.mode==='foot'?Math.min(zoom,18):zoom;const target=new T.Vector3(p.x+Math.sin(yaw)*dist*Math.cos(pitch),Math.max(0,p.y)+dist*Math.sin(pitch),p.z+Math.cos(yaw)*dist*Math.cos(pitch));camera.position.lerp(target,settings.reduced?1:1-Math.exp(-realDt*4));camera.lookAt(p.x,p.y+1.2,p.z);}}
  uiClock+=realDt;if(uiClock>.1){uiClock=0;ui();}renderer.render(scene,camera);
  if(started&&!paused&&!settings.low&&!qualityAutoChanged){slowFrames=realDt>.05?slowFrames+realDt:Math.max(0,slowFrames-realDt);if(slowFrames>8){quality(true);qualityAutoChanged=true;toast('Low graphics enabled for smoother play. You can change this in Menu.');}}
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();input.clear();if(started&&!modal())show('menu-dialog');toast('Graphics context interrupted. Reload the game to restore rendering; your saved progress is retained.');});
 ranch=new RanchGame({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,ranchWorld,started:()=>started,notify:toast,radio,save,close,show:id=>{backTarget=null;show(id);},info,ranchSnapshot:()=>ranch.snapshot()});
 director=new AAADirector({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,ranch,settings,park,started:()=>started,notify:toast,radio,save,close,show:id=>{backTarget=null;show(id);},info});
 herds=new LivingHerds({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,ranch,director,settings,notify:toast,radio,save,close,show:id=>{backTarget=null;show(id);},info});
 signature=new NorthstarSignature({scene,physics,R,fleet,animals,state,storage,audio,input,frontier,ranch,director,herds,settings,signatureWorld,notify:toast,radio,save,close,show:id=>{backTarget=null;show(id);},info});
 window.__dinoHerds={get state(){return herds.snapshot();}};
 ui();syncModels(0);frontier.update(0,0,fleet.position,settings.reduced);park.update(0,0,fleet.actor,settings.night,settings.reduced);renderer.render(scene,camera);
 $('start-button').disabled=false;$('start-button').textContent=campaign.stage||state.outposts.length>1?'Continue ranger operations':'Start your engine';$('load-status').textContent='Ready. Press A on your controller, or select Start.';updateDevice('keyboard');
 const debug={get state(){return {ready:true,build:HERDS_BUILD,storyBuild:AAA_BUILD,signatureBuild:NORTHSTAR_BUILD,started,paused:isPaused(),stage:campaign.stage,observed:[...campaign.observed],species:[...state.observed],position:{...fleet.position},speed:fleet.actor.speed,grounded:fleet.actor.grounded,health:100,mode:fleet.mode,active:fleet.active,tool:tools.tool.id,ammo:[...state.ammo],reserve:[...state.reserve],reloading:tools.reloadLeft,toolHits:{...state.toolHits},outposts:[...state.outposts],checkpoint:state.checkpoint,patrol:state.patrol,pens:JSON.parse(JSON.stringify(state.pens)),exploded:[...state.exploded],drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,cameraMode,night:settings.night,yaw,aimPitch,device:input.device,vehicles:fleet.vehicles.map(v=>({id:v.id,type:v.type,position:{...v.drive.position},recoveries:v.recoveries,rotation:{...v.drive.body.rotation()}})),animals:animals.map(({uid,species,x,z,mood,pen,deter})=>({uid,id:species,x,z,mood,pen,deter}))};}};
 if(new URLSearchParams(location.search).get('test')==='1')Object.assign(debug,{teleport:(x,z,heading=Math.PI)=>{if(fleet.current)fleet.current.drive.reset({x,z},heading);else fleet.person.setActive(true,{x,y:1,z});lastPosition={x,z};},setAim:(angle,elevation=.04)=>{yaw=angle;aimPitch=elevation;},render:ui,ranch,director,herds,signature,physics,fleet,animals,frontier,tools,progress:state,jeep:fleet.vehicles[0].drive});
 window.__dinoRanger=debug;window.__dinoNorthstar={get state(){return signature?.snapshot?.()||null;},open:()=>signature?.open?.()};window.__dinoAAA={get state(){return director?.snapshot?.()||null;},open:()=>director?.open?.(),suspend:()=>director?.suspend?.()};requestAnimationFrame(frame);
}
