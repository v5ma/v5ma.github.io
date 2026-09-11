import * as T from './vendor/three.module.js';
import {byId,readProgress,writeProgress,addDiscovery,escapeHTML} from './core.js';
import {HOME,LAKE,ROADS,STATIONS,MISSIONS,clamp,distance,emptyRanger,readRanger,saveRanger,advance,waypoint,makeAnimalState,stepAnimal} from './ranger-data.js';
import {initPhysics,ParkPhysics,RangerJeep,RAPIER} from './ranger-physics.js';
import {buildPark} from './ranger-world.js';
import {RangerAudio} from './ranger-audio.js';
import {ALL_ANIMALS,NEW_SPECIES,MAP_RADIUS,LAGOON,inWater,OUTPOSTS,ENCLOSURES,VEHICLES,ROUTES,CHECKPOINTS,JOBS,gateConsole,feederPosition,insidePen,readFrontier,saveFrontier,jobTarget,managementStep,applyDeterrent,toolTarget} from './frontier-data.js';
import {makeAnimalModel,makeVehicleModel,makeRanger,makeToolMount} from './frontier-art.js';
import {makeVehicle,WalkingRanger,safeExit,autoRecover,upright,constrainVehicle} from './frontier-actors.js';
import {expandPark} from './frontier-world.js';
const $=id=>document.getElementById(id),esc=escapeHTML;
const speciesInfo=id=>byId(id)||NEW_SPECIES.find(a=>a.id===id);
const TOOL_NAMES={water:'PRESSURE WATER',zap:'HERDING ZAPPER',lure:'FEED LURE',scan:'FIELD SCANNER'};
export async function boot(){
 await initPhysics();
 let storage;try{storage=localStorage;}catch{storage=null;}
 let campaign=readRanger(storage),reserve=readFrontier(storage),started=false,time=0,last=performance.now(),accumulator=0;
 let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,night=false,cameraMode='orbit',yaw=.65,pitch=.72,zoom=34,candidate=null,drag=null;
 let hornAt=-100,saveClock=0,uiClock=0,tool='water',water=100,battery=100,toolCooldown=0,lure=null,lastTarget=null;
 let radioTimer,toastTimer,saveWarning=false,lowFrames=0,qualityChosen=false,mouseAim=false,toolClock=0;
 const held=new Set(),touch=new Set(),audio=new RangerAudio(),canvas=$('park');
 const dialogs=[$('info-dialog'),$('map-dialog'),$('menu-dialog'),$('orders-dialog')],isPaused=()=>!started||dialogs.some(d=>d.open)||document.hidden;
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(44,1,.1,850),physics=new ParkPhysics();
 const vehicles=VEHICLES.map(d=>{const v=makeVehicle(physics,d);v.model=makeVehicleModel(d.type);scene.add(v.model);return v;});
 let active=vehicles[0];const walker=new WalkingRanger(physics),person=makeRanger();scene.add(person);person.visible=false;
 const park=buildPark(scene,physics),expansion=expandPark(scene,physics,reserve),mount=makeToolMount();scene.add(mount);
 const aimRing=new T.Mesh(new T.RingGeometry(.45,.56,24),new T.MeshBasicMaterial({color:0x9ce1e1,side:T.DoubleSide,depthTest:false}));aimRing.rotation.x=-Math.PI/2;scene.add(aimRing);
 const animals=ALL_ANIMALS.map((d,i)=>{const a=makeAnimalState(d,i);a.model=makeAnimalModel(d);a.collider=physics.animal(d.radius,d.x,d.z);scene.add(a.model);return a;});
 const unlocked=new Set(readProgress(storage).progress.observed);for(const id of [...campaign.observed,...unlocked])if(!reserve.observed.includes(id))reserve.observed.push(id);
 if(reserve.checkpoint!=='base'){const rest=OUTPOSTS.find(p=>p.id===reserve.checkpoint);active.reset({x:rest.x,z:rest.z+7});}
 for(let i=0;i<100;i++){for(const v of vehicles)v.drive({},1/60,false);physics.world.step();}
 let lastPosition={...active.position},previousPad=[];
 const actor=()=>active||walker;
 const size=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};window.addEventListener('resize',size);size();
 camera.position.set(32,24,77);camera.lookAt(-3,2,31);park.setPowered(campaign.stage>=3);$('motion-toggle').checked=reduced;
 const raycaster=new T.Raycaster(),pointer=new T.Vector2(),groundPlane=new T.Plane(new T.Vector3(0,1,0),0),aimPoint=new T.Vector3();
 function clearInput(){held.clear();touch.clear();drag=null;document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));accumulator=0;}
 function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3800);}
 function radio(text){$('radio-text').textContent=text;$('radio').classList.add('show');clearTimeout(radioTimer);radioTimer=setTimeout(()=>$('radio').classList.remove('show'),6500);}
 function save(){const a=saveRanger(storage,campaign),b=saveFrontier(storage,reserve);if((!a||!b)&&!saveWarning){saveWarning=true;toast('This browser cannot save progress. Your current session still works.');}}
 function mission(event){if(advance(campaign,event)){save();park.setPowered(campaign.stage>=3);radio(MISSIONS[campaign.stage].radio);audio.tone(660,.14);return true;}return false;}
 function showDialog(id){clearInput();if(!$(id).open)$(id).showModal();}
 function info(kicker,title,html){$('info-kicker').textContent=kicker;$('info-title').textContent=title;$('info-body').innerHTML=html;showDialog('info-dialog');}
 dialogs.forEach(d=>d.addEventListener('close',()=>{clearInput();if(started)canvas.focus({preventScroll:true});}));
 function record(id,show=true){
  const d=speciesInfo(id);if(!d)return;
  if(!reserve.observed.includes(id))reserve.observed.push(id);
  if(byId(id)){
   if(!campaign.observed.includes(id))campaign.observed.push(id);
   const p=readProgress(storage).progress;addDiscovery(p,'observed',id);writeProgress(storage,p);
  }
  if(d.diet==='Plant-eater')mission('survey');save();
  if(show)info('SPECIES RECORDED / FIELD REGISTER',d.name,`<p>${esc(d.detail||d.note)}</p>${d.evidence?`<p class="fact"><b>THE EVIDENCE</b>${esc(d.evidence)}</p><p>${esc(d.unknown)}</p>`:'<p>Original stylized game model. Animal behavior and this mixed-period reserve are fictional.</p>'}<p>${reserve.observed.length} of 12 species recorded. The original journal, notes and excavation progress are unchanged.</p><p><a href="./field-guide.html#journal" target="_blank" rel="noopener">Open the original field journal</a></p>`);
  else toast(d.name+' recorded in your reserve register.');
 }
 function rest(p){
  if(!reserve.outposts.includes(p.id))reserve.outposts.push(p.id);reserve.checkpoint=p.id;water=100;battery=100;save();
  info('CHECKPOINT SAVED / TOOLS REFILLED',p.name,`<p>Your next session resumes near this outpost. Water and zapper charge are full. Vehicles never take damage, and rollovers recover in place.</p><p>${reserve.outposts.length} of 6 outposts active. ${reserve.checkpoints.length} of 10 trail checkpoints visited.</p><p>Use the radio orders for more assignments. Nearby vehicles remain parked when you disembark.</p>`);
 }
 function interact(){
  if(isPaused())return;updateCandidate();if(!candidate)return;
  if(Math.abs(actor().speed)>3){toast('Slow down before interacting.');return;}
  if(active?.type==='helicopter'&&active.position.y>2.8){toast('Land with Z before using ground stations.');return;}
  const c=candidate;
  if(c.kind==='gate'){
   const e=c.data,closing=!!reserve.gates[e.id];
   if(closing&&vehicles.some(v=>Math.abs(v.position.x-e.x)<7&&Math.abs(v.position.z-(e.z+e.d/2))<3&&v.position.y<4)){toast('Move vehicles clear of the gate before closing it.');return;}
   if(closing&&animals.some(a=>a.pen===e.id&&Math.abs(a.x-e.x)<7&&Math.abs(a.z-(e.z+e.d/2))<2)){toast('An animal is in the gate. Let it clear the opening.');return;}
   reserve.gates[e.id]=!closing;save();toast(e.name+(closing?' gate closed.':' gate opened.'));checkSecured();
  }else if(c.kind==='feeder'){
   if(!reserve.fed.includes(c.data.id))reserve.fed.push(c.data.id);save();toast(c.data.name+' feeder active. Open the gate for animals outside.');checkSecured();
  }else if(c.kind==='outpost')rest(c.data);
  else if(c.kind==='animal')record(c.data.id);
  else if(c.kind==='power'){mission('power');toast('Relay restored. Northern research access is open.');}
  else if(c.kind==='recorder'){if(mission('recorder'))info('RECORDER SECURED','Bring it home.','<p>Return the recorder to the visitor center. You can take any available vehicle. Your progress survives every rollover.</p>');}
  else if(c.kind==='home'){if(mission('home'))info('FIRST EXPEDITION COMPLETE','The whole reserve awaits.',`<p>Your original mission is complete. Open Orders for 13 new reserve assignments: herd the Fern Hollow stray home, activate outposts, patrol by helicopter, cross the lagoon and survey all 12 species.</p>`);}
  else if(c.kind==='lab')info('FOSSIL FIELD','Read the evidence.','<p><a href="./field-guide.html#dig" target="_blank" rel="noopener">Enter the preserved fossil lab and field guide.</a></p>');
 }
 function checkSecured(){
  for(const e of ENCLOSURES){if(!reserve.gates[e.id]&&reserve.fed.includes(e.id)&&animals.filter(a=>a.pen===e.id).every(a=>insidePen(a,e))&&!reserve.secured.includes(e.id)){reserve.secured.push(e.id);toast(e.name+' secured: all residents inside and gate closed.');save();}}
 }
 function board(){
  if(isPaused())return;
  if(active){
   if(Math.abs(active.speed)>3){toast('Stop before leaving your vehicle.');return;}
   const pos=safeExit(physics,active);if(!pos){toast(active.type==='helicopter'?'Land with Z before disembarking.':'Approach a clear shore before leaving the boat.');return;}
   walker.body.setEnabled(true);walker.setPosition(pos);walker.heading=active.heading;active=null;person.visible=true;mouseAim=false;clearInput();toast('On foot. V boards a nearby vehicle. Aim and hold F to use your tool.');
  }else{
   const near=vehicles.filter(v=>distance(v.position,walker.position)<(v.type==='boat'?15:7)&&v.position.y<3.2).sort((a,b)=>distance(a.position,walker.position)-distance(b.position,walker.position))[0];
   if(!near){toast('Approach a parked vehicle, then press V.');return;}
   active=near;walker.body.setEnabled(false);person.visible=false;clearInput();mouseAim=false;toast('Boarded '+active.name+(active.type==='helicopter'?'. Q rises, Z descends.':'. WASD drives.'));
  }
  lastPosition={...actor().position};
 }
 function recover(){if(active){upright(active);toast('Vehicle upright, right here. No damage and no progress lost.');}else{toast('You are on foot. The Return to checkpoint option is in Menu.');}}
 function returnCheckpoint(){const p=OUTPOSTS.find(p=>p.id===reserve.checkpoint)||OUTPOSTS[0];
  if(active&&active.type!=='boat')active.reset({x:p.x,z:p.z+7});else{active=null;walker.body.setEnabled(true);walker.setPosition({x:p.x+2,z:p.z+3});person.visible=true;}
  lastPosition={...actor().position};clearInput();$('menu-dialog').close();toast('Returned to '+p.name+'. Your discoveries are safe.');
 }
 function selectTool(name){tool=name;toolCooldown=0;toast(TOOL_NAMES[tool]+': aim with the mouse and hold F.');}
 function orders(){
  $('orders-list').innerHTML=JOBS.map(j=>`<article class="order-card ${j.done(reserve)?'done':''}"><div><h3>${j.done(reserve)?'COMPLETE / ':''}${esc(j.title)}</h3><p>${esc(j.text)}</p></div><button data-track="${j.id}">${reserve.tracked===j.id?'Tracked':'Track'}</button></article>`).join('');
  $('orders-progress').textContent=JOBS.filter(j=>j.done(reserve)).length+' / '+JOBS.length+' assignments complete';
  $('species-list').innerHTML=[...new Set(ALL_ANIMALS.map(a=>a.id))].map(id=>`<span class="species-tag ${reserve.observed.includes(id)?'known':''}">${reserve.observed.includes(id)?'Recorded: ':'Unknown: '}${esc(speciesInfo(id).name)}</span>`).join('');showDialog('orders-dialog');
 }
 $('orders-list').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(b){reserve.tracked=b.dataset.track;save();$('orders-dialog').close();toast('Tracking '+JOBS.find(j=>j.id===reserve.tracked).title);}});
 function action(key){
  if(!started)return;
  if(['map','menu','orders'].includes(key)){const id=key==='orders'?'orders-dialog':key+'-dialog';if($(id).open)$(id).close();else if(!dialogs.some(d=>d.open)){if(key==='orders')orders();else showDialog(id);}return;}
  if(isPaused())return;
  if(key==='interact')interact();else if(key==='board')board();else if(key==='reset')recover();
  else if(key==='horn'){hornAt=time;audio.horn();toast('Horn sounded. Nearby animals may move away.');}
  else if(key==='camera'){cameraMode=cameraMode==='orbit'?'chase':'orbit';$('camera-select').value=cameraMode;}
  else if(TOOL_NAMES[key])selectTool(key);
 }
 const actions={KeyE:'interact',KeyV:'board',KeyR:'reset',KeyH:'horn',KeyM:'map',KeyC:'camera',KeyB:'orders',Digit1:'water',Digit2:'zap',Digit3:'lure',Digit4:'scan',Escape:'menu'};
 const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyJ','KeyQ','KeyZ','KeyF'];
 window.addEventListener('keydown',e=>{
  if(!started||e.ctrlKey||e.metaKey||e.altKey)return;
  if(dialogs.some(d=>d.open)){if(e.code==='KeyM'&&$('map-dialog').open){e.preventDefault();$('map-dialog').close();}if(e.code==='KeyB'&&$('orders-dialog').open){e.preventDefault();$('orders-dialog').close();}return;}
  if(movement.includes(e.code)||actions[e.code])e.preventDefault();if(!e.repeat&&actions[e.code])action(actions[e.code]);if(movement.includes(e.code))held.add(e.code);
 });
 window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden&&started&&!dialogs.some(d=>d.open))showDialog('menu-dialog');});
 document.querySelectorAll('[data-drive]').forEach(b=>{const end=()=>{touch.delete(b.dataset.drive);b.classList.remove('pressed');};b.addEventListener('pointerdown',e=>{e.preventDefault();if(isPaused())return;b.setPointerCapture(e.pointerId);touch.add(b.dataset.drive);b.classList.add('pressed');mouseAim=false;});for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,end);});
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>selectTool(b.dataset.tool)));
 canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointermove',e=>{
  pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);mouseAim=true;
  if(drag&&!isPaused()){yaw-=(e.clientX-drag.x)*.007;pitch=clamp(pitch+(e.clientY-drag.y)*.004,.3,1.15);drag={x:e.clientX,y:e.clientY};cameraMode='orbit';$('camera-select').value='orbit';}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null);
 canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.024,16,100);},{passive:false});
 $('start-button').addEventListener('click',()=>{started=true;$('intro').hidden=true;$('hud').hidden=false;canvas.focus({preventScroll:true});radio('Reserve operations are online. V exits your jeep. 1-4 select tools. B opens ranger assignments.');last=performance.now();});
 for(const [id,key] of [['interact-button','interact'],['vehicle-button','board'],['touch-horn','horn'],['touch-reset','reset'],['map-button','map'],['minimap-button','map'],['menu-button','menu'],['orders-button','orders'],['assignment-button','orders']])$(id).addEventListener('click',()=>action(key));
 $('return-checkpoint').addEventListener('click',returnCheckpoint);
 $('sound-button').addEventListener('click',async()=>{try{const on=await audio.toggle();$('sound-button').textContent=on?'Sound on':'Sound off';$('sound-button').setAttribute('aria-pressed',String(on));}catch{toast('Audio is unavailable.');}});
 $('camera-select').addEventListener('change',e=>cameraMode=e.target.value);$('night-toggle').addEventListener('change',e=>night=e.target.checked);$('motion-toggle').addEventListener('change',e=>reduced=e.target.checked);
 function quality(value){renderer.setPixelRatio(value==='low'?1:Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=value!=='low';scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)m.needsUpdate=true;});$('quality-select').value=value;size();}
 $('quality-select').addEventListener('change',e=>{qualityChosen=true;quality(e.target.value);});
 $('restart-button').addEventListener('click',()=>{campaign=emptyRanger();park.setPowered(false);save();$('menu-dialog').close();radio('Original expedition restarted. Reserve progress and both journals are unchanged.');});
 function input(){
  const down=(...k)=>k.some(s=>held.has(s));const v={throttle:Number(down('KeyW','ArrowUp')||touch.has('forward'))-Number(down('KeyS','ArrowDown')||touch.has('back')),steer:Number(down('KeyA','ArrowLeft')||touch.has('left'))-Number(down('KeyD','ArrowRight')||touch.has('right')),brake:down('Space')||touch.has('brake'),boost:down('ShiftLeft','ShiftRight')||touch.has('boost'),jump:down('KeyJ'),rise:down('KeyQ')||touch.has('rise'),descend:down('KeyZ')||touch.has('descend'),fire:down('KeyF')||touch.has('fire')};
  let pad;try{pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);}catch{}
  if(pad){const b=pad.buttons,axis=pad.axes[0]||0;if(Math.abs(axis)>.16)v.steer=-axis;const t=(b[7]?.value||0)-(b[6]?.value||0);if(Math.abs(t)>.08)v.throttle=t;if(!active&&Math.abs(pad.axes[1]||0)>.16)v.throttle=-pad.axes[1];v.brake||=!!b[1]?.pressed;v.fire||=!!b[5]?.pressed;v.rise||=!!b[12]?.pressed;v.descend||=!!b[13]?.pressed;
   for(const [i,a] of [[0,'interact'],[2,'board'],[3,'reset'],[9,'menu']])if(b[i]?.pressed&&!previousPad[i])action(a);
   if(b[4]?.pressed&&!previousPad[4])selectTool(Object.keys(TOOL_NAMES)[(Object.keys(TOOL_NAMES).indexOf(tool)+1)%4]);previousPad=b.map(x=>x.pressed);
  }else previousPad=[];return v;
 }
 function getAim(){const a=actor(),p=a.position;aimPoint.set(p.x+Math.sin(a.heading)*20,0,p.z+Math.cos(a.heading)*20);
  if(mouseAim&&!drag){raycaster.setFromCamera(pointer,camera);const q=new T.Vector3();if(raycaster.ray.intersectPlane(groundPlane,q)&&q.distanceTo(new T.Vector3(p.x,0,p.z))<300)aimPoint.copy(q);}
  return aimPoint;
 }
 function useTool(dt,fire){
  toolCooldown=Math.max(0,toolCooldown-dt);battery=Math.min(100,battery+dt*7);if(lure){lure.life-=dt;if(lure.life<=0)lure=null;}
  const p=actor().position,aim=getAim();lastTarget=toolTarget(animals,p,aim,tool==='zap'?11:tool==='scan'?32:24);
  if(!fire||toolCooldown>0||p.y>7)return;
  const dx=aim.x-p.x,dz=aim.z-p.z,len=Math.hypot(dx,dz)||1;
  if(tool==='lure'){
   const k=Math.min(13,len)/len,pos={x:p.x+dx*k,z:p.z+dz*k,life:24};if(inWater(pos)){toast('Place feed lures on dry land.');toolCooldown=1;return;}
   lure=pos;toolCooldown=2.5;toast('Lure placed. Nearby animals will investigate for 24 seconds.');return;
  }
  if(tool==='scan'){toolCooldown=1;if(lastTarget)record(lastTarget.id,false);else toast('Aim the scanner at a nearby dinosaur.');return;}
  if((tool==='water'&&water<1)||(tool==='zap'&&battery<18)){toolCooldown=.7;toast(tool==='water'?'Water empty. Rest at an outpost to refill.':'Zapper recharging.');return;}
  const range=tool==='zap'?11:24,from={x:p.x+dx/len*1.6,y:p.y+(active?1.3:.55),z:p.z+dz/len*1.6};
  let end=lastTarget?{x:lastTarget.x,y:1.7,z:lastTarget.z}:{x:p.x+dx/len*range,y:1,z:p.z+dz/len*range};
  const vector=new T.Vector3(end.x-from.x,end.y-from.y,end.z-from.z),maxToi=vector.length();vector.normalize();
  const hit=physics.world.castRay(new RAPIER.Ray(from,vector),maxToi,true,undefined,undefined,undefined,actor().body);
  const reachable=!hit||hit.collider.parent()?.handle===lastTarget?.collider.handle;
  if(hit&&!reachable)end={x:from.x+vector.x*hit.timeOfImpact,y:from.y+vector.y*hit.timeOfImpact,z:from.z+vector.z*hit.timeOfImpact};
  expansion.stream(from,end,tool);
  if(tool==='water'){water=Math.max(0,water-1.15);toolCooldown=.12;}else{battery-=18;toolCooldown=.8;audio.tone(220,.08);}
  if(lastTarget&&reachable){applyDeterrent(lastTarget,p,tool);reserve.stats[tool]++;}
 }
 function explode(c){
  if(c.spent)return;c.spent=true;const p={...c.body.translation()};c.mesh.visible=false;c.body.setEnabled(false);reserve.stats.explosions++;
  expansion.burst(p,0xffb459,70,17);expansion.burst(p,0x9a8063,30,10);audio.tone(65,.28);
  for(const v of vehicles){const gap=distance(v.position,p);if(gap<12){const k=1-gap/12,m=v.body.mass(),dx=v.position.x-p.x,dz=v.position.z-p.z,n=Math.hypot(dx,dz)||1;
   v.body.applyImpulseAtPoint({x:dx/n*m*8*k,y:m*8*k,z:dz/n*m*8*k},{x:v.position.x+1,y:v.position.y-.5,z:v.position.z+.7},true);
   v.body.applyTorqueImpulse({x:m*6*k,y:0,z:m*12*k},true);
  }}
  for(const a of animals)if(distance(a,p)<18)applyDeterrent(a,p,'water');toast('Blast crate! Vehicles recover in place. No damage.');save();
 }
 function updateCandidate(){
  const p=actor().position;candidate=null;
  const key=MISSIONS[campaign.stage].key,station=STATIONS[key];if(['power','recorder','home'].includes(key)&&station&&distance(p,station)<7)candidate={kind:key};
  if(!candidate){let best=Infinity;for(const e of ENCLOSURES)for(const [kind,pos] of [['gate',gateConsole(e)],['feeder',feederPosition(e)]]){const gap=distance(p,pos);if(gap<5.6&&gap<best){best=gap;candidate={kind,data:e};}}}
  if(!candidate){const post=OUTPOSTS.find(o=>distance(o,p)<7.5);if(post)candidate={kind:'outpost',data:post};}
  if(!candidate){let best=Infinity;for(const a of animals){const gap=distance(p,a);if(gap<a.radius+8&&gap<best){best=gap;candidate={kind:'animal',data:a};}}}
  if(!candidate&&distance(p,{x:-48,z:-15})<7)candidate={kind:'lab'};
  const tooFast=Math.abs(actor().speed)>3,air=active?.type==='helicopter'&&p.y>2.8;
  let text='Explore the reserve';if(candidate){text=candidate.kind==='animal'?'Observe '+speciesInfo(candidate.data.id).name:candidate.kind==='outpost'?'Rest / refill at '+candidate.data.name:candidate.kind==='gate'?(reserve.gates[candidate.data.id]?'Close ':'Open ')+candidate.data.name:candidate.kind==='feeder'?'Activate feeder':({power:'Restore research relay',recorder:'Recover field recorder',home:'Deliver recorder',lab:'Explore the fossil lab'})[candidate.kind];if(tooFast)text='Slow down to investigate';if(air)text='Land with Z to interact';}
  $('interact-label').textContent=text;$('interact-button').disabled=!candidate||tooFast||air;
  const near=active?null:vehicles.find(v=>distance(v.position,p)<(v.type==='boat'?15:7)&&v.position.y<3.2);
  $('vehicle-button').textContent=active?'V / Exit '+active.name:near?'V / Board '+near.name:'V / Approach a vehicle';$('vehicle-button').disabled=!active&&!near;
  $('encounter-label').textContent=lastTarget?speciesInfo(lastTarget.id).name+' / '+lastTarget.mood:active?.type==='helicopter'?'Q rise / Z descend / V disembark after landing':'Aim with the mouse. Hold F to use your selected tool.';
 }
 function drawMap(cv,full=false){
  const c=cv.getContext('2d'),s=cv.width,k=s/(MAP_RADIUS*2.16),pos=(x,z)=>[s/2+x*k,s/2+z*k];c.clearRect(0,0,s,s);c.save();if(!full){c.beginPath();c.arc(s/2,s/2,s/2-1,0,7);c.clip();}
  c.fillStyle='#284f51';c.fillRect(0,0,s,s);c.fillStyle='#597553';c.beginPath();c.arc(s/2,s/2,MAP_RADIUS*k,0,7);c.fill();
  c.fillStyle='#4a99a4';c.beginPath();c.ellipse(...pos(LAGOON.x,LAGOON.z),LAGOON.rx*k,LAGOON.rz*k,0,0,7);c.fill();c.beginPath();c.arc(...pos(LAKE.x,LAKE.z),LAKE.r*k,0,7);c.fill();
  c.strokeStyle='#bdae80';c.lineWidth=full?2:1;c.lineJoin='round';for(const r of [...ROADS,...ROUTES]){c.beginPath();r.forEach(([x,z],i)=>i?c.lineTo(...pos(x,z)):c.moveTo(...pos(x,z)));c.stroke();}
  c.font=`600 ${full?10:6}px sans-serif`;c.textAlign='center';
  for(const e of ENCLOSURES){const [x,z]=pos(e.x-e.w/2,e.z-e.d/2);c.fillStyle=reserve.secured.includes(e.id)?'#73bb8555':'#dfb97035';c.fillRect(x,z,e.w*k,e.d*k);c.strokeStyle=reserve.gates[e.id]?'#ffd37e':'#d2d5a7';c.strokeRect(x,z,e.w*k,e.d*k);if(full){c.fillStyle='#fff0c7';c.fillText(e.name,...pos(e.x,e.z));}}
  c.strokeStyle='#d2a582';c.strokeRect(...pos(20,-76),50*k,37*k);
  for(const cp of CHECKPOINTS){c.fillStyle=reserve.checkpoints.includes(cp.id)?'#b3d3bc':'#6ed9ed';const [x,z]=pos(cp.x,cp.z);c.fillRect(x-1.4,z-1.4,2.8,2.8);}
  for(const a of animals){c.fillStyle=reserve.observed.includes(a.id)?'#bfd394':'#cb9d7a';c.beginPath();c.arc(...pos(a.x,a.z),full?2:1.3,0,7);c.fill();}
  for(const o of OUTPOSTS){const [x,z]=pos(o.x,o.z);c.fillStyle=reserve.outposts.includes(o.id)?'#a6eed4':'#f2c66f';c.fillRect(x-3,z-3,6,6);if(full)c.fillText(o.name,x,z-8);}
  for(const v of vehicles){c.fillStyle=v===active?'#fff6dc':v.type==='boat'?'#93deef':'#dadacf';c.beginPath();c.arc(...pos(v.position.x,v.position.z),full?3:1.7,0,7);c.fill();}
  if(campaign.stage<5){c.strokeStyle='#f2c66f';c.lineWidth=2;c.beginPath();c.arc(...pos(waypoint(campaign).x,waypoint(campaign).z),full?7:4,0,7);c.stroke();}
  const t=jobTarget(reserve.tracked);c.strokeStyle='#92ecdd';c.lineWidth=2;c.beginPath();c.arc(...pos(t.x,t.z),full?9:5,0,7);c.stroke();
  const p=actor().position,[x,z]=pos(p.x,p.z);c.translate(x,z);c.rotate(Math.PI+actor().heading);c.fillStyle='#ffffff';c.beginPath();c.moveTo(0,-6);c.lineTo(4,5);c.lineTo(0,3);c.lineTo(-4,5);c.closePath();c.fill();c.restore();
 }
 function ui(){
  const job=JOBS.find(j=>j.id===reserve.tracked)||JOBS[0],p=actor().position,done=JOBS.filter(j=>j.done(reserve)).length;
  const m=campaign.stage<5?MISSIONS[campaign.stage]:{title:job.title,text:job.text};$('mission-title').textContent=m.title;$('mission-copy').textContent=m.text;
  $('mission-index').textContent=campaign.stage<5?(campaign.stage+1)+' / 5':'RESERVE';$('mission-progress').max=campaign.stage<5?5:JOBS.length;$('mission-progress').value=campaign.stage<5?campaign.stage:done;
  $('waypoint-distance').textContent=Math.round(distance(p,campaign.stage<5?waypoint(campaign):jobTarget(job.id)))+' m';
  $('assignment-title').textContent=(job.done(reserve)?'COMPLETE / ':'')+job.title;$('assignment-count').textContent=done+' / '+JOBS.length+' orders';
  $('speed').textContent=String(Math.round(Math.abs(actor().speed)*3.6)).padStart(2,'0');$('gear').textContent=active?.type==='helicopter'?Math.round(Math.max(0,p.y-1))+'m':active?'D':'WALK';
  $('vehicle-name').textContent=active?active.name:'RANGER ON FOOT';$('integrity-label').textContent=active?.rollTime>.1?'AUTO-RIGHTING...':'NO VEHICLE DAMAGE';
  $('integrity').value=100;$('tool-name').textContent=TOOL_NAMES[tool];$('tool-water').value=water;$('tool-battery').value=battery;$('water-number').textContent=Math.round(water)+'%';$('battery-number').textContent=Math.round(battery)+'%';
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(tool===b.dataset.tool)));
  document.body.dataset.vehicle=active?.type||'foot';
  $('region-label').textContent=inWater(p)?'THE WESTERN LAGOON':ENCLOSURES.find(e=>insidePen(p,e,-12))?.name.toUpperCase()||OUTPOSTS.find(o=>distance(p,o)<22)?.name.toUpperCase()||(p.z< -95?'NORTHERN HIGHLANDS':p.z>100?'SOUTHERN FRONTIER':'ATLAS CENTRAL RESERVE');
  updateCandidate();drawMap($('minimap'));if($('map-dialog').open)drawMap($('fullmap'),true);
  park.beacon.visible=campaign.stage<5;if(park.beacon.visible){const w=waypoint(campaign);park.beacon.position.set(w.x,0,w.z);}
  const t=jobTarget(reserve.tracked);expansion.objective.position.set(t.x,.14,t.z);expansion.beacon.position.set(t.x,5,t.z);expansion.beacon.rotation.y=time*.5;
 }
 function drawModels(dt){
  for(const v of vehicles){v.model.position.copy(v.position);v.model.quaternion.copy(v.body.rotation());
   if(v.model.userData.tires)v.model.userData.tires.forEach(({pivot,roll},i)=>{const c=v.connections[i];pivot.position.set(c.x,c.y-(v.controller.wheelSuspensionLength(i)??.42),c.z);pivot.rotation.y=i<2?v.steer:0;roll.rotation.x=v.controller.wheelRotation(i)||0;});
   if(v.model.userData.light)v.model.userData.light.intensity=night?90:0;
   if(v.type==='helicopter'){v.model.userData.rotor.rotation.y+=dt*(v===active?48:4);v.model.userData.tail.rotation.x+=dt*(v===active?65:6);}
  }
  if(!active){person.position.set(walker.position.x,Math.max(0,walker.position.y-.9),walker.position.z);person.rotation.y=walker.heading;for(const [i,l] of person.userData.legs.entries())l.rotation.x=reduced?0:Math.sin(time*9+i*Math.PI)*(walker.speed>.1?.4:0);}
  const p=actor().position,aim=getAim(),ang=Math.atan2(aim.x-p.x,aim.z-p.z);mount.position.set(p.x,p.y+(active?1.35:.5),p.z);mount.rotation.y=ang;mount.visible=started&&p.y<7;aimRing.position.set(aim.x,.2,aim.z);aimRing.visible=started&&!dialogs.some(d=>d.open)&&mouseAim;
  for(const a of animals){a.model.visible=distance(a,p)<(active?.type==='helicopter'?240:140);a.model.position.set(a.x,0,a.z);a.model.rotation.y=a.angle;if(a.model.visible)for(const [i,l] of a.model.userData.legs.entries())l.rotation.x=reduced?0:Math.sin(time*(a.mood==='herding'?6:2)+i*Math.PI)*.16;}
 }
 function tick(controls,dt){
  time+=dt;
  const p=actor().position;
  for(const a of animals){
   if(a.pen||a.deterrent>0||lure&&distance(a,lure)<40)managementStep(a,p,dt,time,reserve,lure);
   else stepAnimal(a,p,dt,time,campaign.stage>=3,time-hornAt);
   if(time-hornAt<.16&&distance(a,p)<20&&a.kind!=='rex')applyDeterrent(a,p,'water');
   a.collider.setNextKinematicTranslation({x:a.x,y:1,z:a.z});
  }
  useTool(dt,controls.fire);
  for(const v of vehicles)v.drive(v===active?controls:{brake:true},dt,v===active);
  if(!active)walker.move(controls,cameraMode==='chase'?walker.heading+Math.PI:yaw,dt);
  physics.world.step();
  for(const v of vehicles){constrainVehicle(v);if(autoRecover(v,dt)){reserve.stats.recoveries++;toast(v.name+' recovered upright in place.');save();}}
  if(!active)walker.constrain();
  for(const a of animals){
   if(a.radius<2||a.deterrent>0||a.hitAt&&time-a.hitAt<2.5)continue;
   for(const v of vehicles){const gap=distance(a,v.position);if(gap<a.radius+1.7&&v.position.y<3){a.hitAt=time;const dx=v.position.x-a.x,dz=v.position.z-a.z,n=gap||1,m=v.body.mass();v.body.applyImpulseAtPoint({x:dx/n*m*5,y:m*3.8,z:dz/n*m*5},{x:v.position.x+.8,y:v.position.y-.4,z:v.position.z+.9},true);v.body.applyTorqueImpulse({x:0,y:0,z:m*8},true);if(v===active)toast(speciesInfo(a.id).name+' bumped the vehicle. Use water to make space.');break;}}
  }
  for(const c of expansion.crates){if(c.spent||time<c.armedAt)continue;const cp=c.body.translation();if(vehicles.some(v=>distance(v.position,cp)<3.2&&Math.abs(v.speed)>2.4))explode(c);}
  const q=actor().position;if(campaign.stage===0&&distance(q,STATIONS.gate)<5)mission('gate');
  const traveled=distance(q,lastPosition);if(traveled<5){campaign.meters+=traveled;if(active?.type==='helicopter'&&q.y>5)reserve.stats.flight+=traveled;if(active?.type==='boat')reserve.stats.sailing+=traveled;}lastPosition={x:q.x,z:q.z};
  for(const c of CHECKPOINTS)if(distance(q,c)<5&&q.y<5&&!reserve.checkpoints.includes(c.id)){reserve.checkpoints.push(c.id);toast('Trail checkpoint '+reserve.checkpoints.length+' / 10 recorded.');save();}
  saveClock+=dt;if(saveClock>8){saveClock=0;checkSecured();save();}
 }
 function frame(now){
  requestAnimationFrame(frame);const realDt=clamp((now-last)/1000,0,.1);last=now;const paused=isPaused(),dt=paused?0:realDt;
  if(!paused){const controls=input();accumulator+=dt;let steps=0;while(accumulator>=1/60&&steps<6&&!isPaused()){tick(controls,1/60);accumulator-=1/60;steps++;}}else accumulator=0;
  drawModels(dt);park.update(dt,time,actor(),night,reduced);expansion.update(dt,time,actor().position,reserve,lure);audio.update(actor().speed,!paused&&!!active);
  if(started){const p=actor().position,ang=cameraMode==='chase'?actor().heading+Math.PI:yaw,dist=cameraMode==='chase'?active?.type==='helicopter'?32:18:zoom,vertical=cameraMode==='chase'?.4:pitch;
   const target=new T.Vector3(p.x+Math.sin(ang)*dist*Math.cos(vertical),Math.max(0,p.y)+dist*Math.sin(vertical),p.z+Math.cos(ang)*dist*Math.cos(vertical));camera.position.lerp(target,reduced?1:1-Math.exp(-realDt*5));camera.lookAt(p.x,Math.max(1,p.y)+.5,p.z);
  }
  uiClock+=realDt;if(uiClock>.12){uiClock=0;ui();}renderer.render(scene,camera);
  if(started&&!paused&&!qualityChosen&&$('quality-select').value==='high'){lowFrames=realDt>.046?lowFrames+realDt:Math.max(0,lowFrames-realDt);if(lowFrames>5){quality('low');qualityChosen=true;toast('Battery-saver graphics enabled. Change this in Menu.');}}
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();if(started&&!dialogs.some(d=>d.open))showDialog('menu-dialog');toast('Graphics interrupted. Reload to resume from the last outpost.');});window.addEventListener('pagehide',save);
 ui();drawModels(0);park.update(0,time,actor(),night,reduced);expansion.update(0,time,actor().position,reserve,lure);renderer.render(scene,camera);
 $('start-button').disabled=false;$('start-button').textContent='Enter the reserve';$('load-status').textContent='WASD to drive. V to explore on foot. B for ranger orders.';
 const debug={get state(){return {ready:true,started,paused:isPaused(),stage:campaign.stage,observed:[...campaign.observed],reserve:JSON.parse(JSON.stringify(reserve)),meters:campaign.meters,position:{...actor().position},speed:actor().speed,grounded:actor().grounded,health:100,vehicle:active?.id||null,mode:active?.type||'foot',tool,water,battery,candidate:candidate?{kind:candidate.kind,id:candidate.data?.id}:null,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,cameraMode,night,treeCount:expansion.treeCount,vehicles:vehicles.map(v=>({id:v.id,type:v.type,position:{...v.position},rotation:{...v.body.rotation()},rollTime:v.rollTime})),animals:animals.map(({uid,id,x,z,mood,pen})=>({uid,id,x,z,mood,pen})),crates:expansion.crates.map(c=>({id:c.id,spent:c.spent,position:{...c.body.translation()}}))};}};
 if(new URLSearchParams(location.search).get('test')==='1')Object.assign(debug,{
  teleport:(x,z,heading=Math.PI)=>{if(active)active.reset({x,z},heading);else{walker.setPosition({x,z});walker.heading=heading;}lastPosition={x,z};mouseAim=false;},
  aim:(x,z)=>{mouseAim=false;const h=Math.atan2(x-actor().position.x,z-actor().position.z);if(active)active.body.setRotation({x:0,y:Math.sin(h/2),z:0,w:Math.cos(h/2)},true);else walker.heading=h;},
  flip:()=>{if(active){active.body.setRotation({x:1,y:0,z:0,w:0},true);active.body.setAngvel({x:0,y:0,z:0},true);}},
  render:()=>{ui();renderer.render(scene,camera);},physics,jeep:vehicles[0],vehicles,animals,
 });window.__dinoRanger=debug;requestAnimationFrame(frame);
}
