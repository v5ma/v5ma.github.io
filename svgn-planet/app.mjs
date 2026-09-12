import {mountAtmosphereUI} from './atmosphere-ui.mjs';
import {mountHomecomingDOM,createHomecomingUI} from './homecoming-ui.mjs';
import {storyTarget} from './homecoming.mjs';
import {createFrameHealth} from './frame-health.mjs';
import {padState,rumble} from './controller.mjs';
import {preferences} from './coastal-prefs.mjs';
import {createCoastalAudio} from './coastal-audio.mjs';
import {buildCoastalDOM,createCoastalInterface} from './coastal-interface.mjs';
import {capturePose,renderPose} from './coastal-motion.mjs';
import {jobTarget} from './activities.mjs';
import {ART_VERSION} from './street-art.mjs';
import {VERSION,RADIUS,WORLD,CITY,travelTo,cross,dot,tangent,at,add,mul,norm,distance,localPosition,initial,step,nearest,interact,throwPaper,switchRide,readSave,saveData,SAVE_KEY,LEGACY_SAVE_KEY,target} from './model.mjs';
import {createScene} from './scene.mjs';
buildCoastalDOM();mountHomecomingDOM();
const $=id=>document.getElementById(id),canvas=$('world'),audio=createCoastalAudio(),metrics=createFrameHealth();
const dialogs=['pause-dialog','map-dialog','help-dialog','jobs-dialog','repair-dialog','photo-dialog','homecoming-dialog','health-dialog','production-dialog'];
let touchBraking=false;let saved=null,storage=true;try{saved=readSave(localStorage.getItem(SAVE_KEY));if(!saved)saved=readSave(localStorage.getItem(LEGACY_SAVE_KEY));}catch{storage=false;}
let s=initial(saved),started=false,paused=false,graphicsLost=false,failed=false,view,keys=new Set(),stick=[0,0],jump=false,boost=false,orbitDrag=null,last=0,lastRender=0,lastUI=0,lastSave=0,acc=0,mode=0,vehicle=saved?.vehicle||'unicycle',saveStamp='',wasPlaying=false,renderDirty=true,previousPose=null,saveQueued=false;
const diagnostics=[];let waypoint=null,lastReward=0;
$('vehicle').value=$('vehicle-pause').value=vehicle;
const cityStops=[{id:'post',name:'Original delivery depot',mail:WORLD.sites[0].mail},...CITY.districts];
for(const d of cityStops){const option=document.createElement('option');option.value=d.id;option.textContent=d.name;$('district-select').append(option);}
function record(type,message=''){diagnostics.push({type,message,time:Date.now()});if(diagnostics.length>30)diagnostics.shift();}
function clear(){metrics.gap();touchBraking=false;keys.clear();stick=[0,0];jump=boost=false;acc=0;previousPose=null;$('stick').querySelector('i').style.transform='';}
function persist(){s.vehicle=vehicle;const raw=JSON.stringify(saveData(s));if(raw===saveStamp)return;try{localStorage.setItem(SAVE_KEY,raw);saveStamp=raw;}catch{storage=false;}}
function idleSave(){if(saveQueued)return;saveQueued=true;const run=()=>{saveQueued=false;persist();};if(window.requestIdleCallback)requestIdleCallback(run,{timeout:2500});else setTimeout(run,0);}
function closeDialogs(){for(const id of dialogs)if($(id).open)$(id).close();}
function showFailure(message){failed=true;closeDialogs();clear();persist();audio.setPlaying(false);$('failure').hidden=false;$('failure-message').textContent=message;record('error',message);}
function pause(){if(!started||paused||graphicsLost||failed)return;paused=true;clear();persist();audio.setPlaying(false);$('pause-dialog').showModal();$('resume').focus();}
function resume(){if(graphicsLost||failed)return;paused=false;clear();last=0;closeDialogs();canvas.focus({preventScroll:true});audio.unlock();}
function openDialog(id){if(!started||failed||graphicsLost)return;paused=true;clear();persist();audio.setPlaying(false);closeDialogs();$(id).showModal();($(id).querySelector('[data-pad-default]')||$(id).querySelector('button'))?.focus();}
for(const id of dialogs)$(id).addEventListener('close',()=>{if(graphicsLost||failed||!paused||document.querySelector('dialog[open]'))return;paused=false;clear();last=0;canvas.focus({preventScroll:true});});
$('start').onclick=()=>{if(!view||$('start').disabled)return;started=true;paused=false;vehicle=$('vehicle').value;s.ride=true;clear();$('welcome').hidden=true;document.body.classList.remove('title');view.setCamera('street');mode=0;canvas.focus({preventScroll:true});audio.unlock();record('started');};
$('pause').onclick=pause;$('resume').onclick=resume;
$('reset').onclick=()=>{$('confirm-reset').hidden=false;$('cancel-reset').focus();};$('cancel-reset').onclick=()=>{$('confirm-reset').hidden=true;$('reset').focus();};
$('accept-reset').onclick=()=>{s=initial();s.ride=true;saveStamp='';persist();$('confirm-reset').hidden=true;resume();};
$('vehicle-pause').onchange=e=>{vehicle=e.target.value;$('vehicle').value=vehicle;persist();};$('vehicle').onchange=e=>{vehicle=e.target.value;$('vehicle-pause').value=vehicle;};
function changeView(){if(!view)return;renderDirty=true;mode=(mode+1)%3;view.setCamera(['street','adventure','overview'][mode]);$('view').textContent=['Street view','Adventure view','World overview'][mode];}
$('view').onclick=()=>{changeView();canvas.focus({preventScroll:true});};
function action(code){
 if(!started||paused||failed||graphicsLost)return;
 if(code==='KeyE'){if(!storyUI.interact()&&!pulseUI.interact(!nearest(s))){if(nearest(s))interact(s);else throwPaper(s);}persist();}
 if(code==='KeyQ')throwPaper(s);if(code==='KeyF'){switchRide(s);persist();}if(code==='Space')jump=true;
 if(code==='KeyV')changeView();if(code==='KeyM')openMap();if(code==='KeyH')openHelp();if(code==='KeyJ')pulseUI.jobs();
 if(code==='KeyC'){view.recenter();renderDirty=true;}if(code==='KeyG'){audio.cue('bell');view.life?.bell(s.time);}if(code==='KeyK')audio.toggleMute();
}
const codes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyB','KeyE','KeyQ','KeyF','KeyV','KeyM','KeyH','KeyC','KeyJ','KeyG','KeyK'];
window.addEventListener('keydown',e=>{if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat&&started){e.preventDefault();if($('confirm-reset').hidden===false){$('cancel-reset').click();return;}paused?resume():pause();return;}if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(!started||paused)return;if(codes.includes(e.code)){e.preventDefault();keys.add(e.code);if(!e.repeat)action(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();persist();pause();}last=0;});window.addEventListener('pagehide',persist);
canvas.addEventListener('pointerdown',e=>{orbitDrag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(orbitDrag?.id===e.pointerId){view?.orbitBy((e.clientX-orbitDrag.x)*.005);renderDirty=true;orbitDrag.x=e.clientX;}});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>orbitDrag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();if(!view)return;mode=e.deltaY>0?1:0;view.setCamera(mode?'adventure':'street');$('view').textContent=mode?'Adventure view':'Street view';renderDirty=true;},{passive:false});
$('touch-interact').onclick=()=>action('KeyE');$('touch-ride').onclick=()=>action('KeyF');$('touch-jump').onclick=()=>action('Space');$('touch-boost').onpointerdown=e=>{boost=true;e.currentTarget.setPointerCapture(e.pointerId);};for(const type of ['pointerup','pointercancel','lostpointercapture'])$('touch-boost').addEventListener(type,()=>boost=false);
const touchBrake=document.createElement('button');touchBrake.id='touch-brake';touchBrake.textContent='BRAKE';$('touch-boost').after(touchBrake);touchBrake.onpointerdown=e=>{touchBraking=true;e.currentTarget.setPointerCapture(e.pointerId);};for(const type of ['pointerup','pointercancel','lostpointercapture'])touchBrake.addEventListener(type,()=>touchBraking=false);
let pointer=null;const pad=$('stick');function moveStick(e){const r=pad.getBoundingClientRect(),x=(e.clientX-r.x-r.width/2)/38,y=(e.clientY-r.y-r.height/2)/38,l=Math.max(1,Math.hypot(x,y));stick=[x/l,-y/l];pad.querySelector('i').style.transform=`translate(${stick[0]*30}px,${-stick[1]*30}px)`;}
pad.onpointerdown=e=>{pointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);};pad.onpointermove=e=>{if(pointer===e.pointerId)moveStick(e);};for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,()=>{pointer=null;stick=[0,0];pad.querySelector('i').style.transform='';});if(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)document.body.classList.add('touch');
function input(){const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick[0]+padState.x,z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+stick[1]+padState.y,b=view.movementBasis(s),magnitude=Math.min(1,Math.hypot(x,z));return {direction:magnitude>.05?norm(add(mul(b.right,x),mul(b.forward,z))):null,throttle:magnitude,brake:padState.brake||touchBraking||keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyB'),boost:padState.boost||boost||keys.has('ShiftLeft')||keys.has('ShiftRight'),jump};}
function drawMap(){
 const c=$('map'),g=c.getContext('2d'),w=c.width,h=c.height,P=n=>({x:(Math.atan2(n[0],n[1])/(2*Math.PI)+.5)*(w-40)+20,y:(.5-Math.asin(Math.max(-1,Math.min(1,-n[2])))/Math.PI)*(h-60)+22});
 g.fillStyle='#173f4c';g.fillRect(0,0,w,h);g.lineWidth=1;
 for(const r of [...CITY.roads,...WORLD.roads]){g.strokeStyle=r.coords?'#c9c5aa':'#68958e';g.beginPath();let previous=null;for(const n of r.points){const p=P(n);if(!previous||Math.abs(previous.x-p.x)>w/2)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);previous=p;}g.stroke();}
 const chosen=cityStops.find(d=>d.id===$('district-select').value);for(const d of cityStops){const p=P(d.mail),done=d.id==='post'?s.complete:s.bonusDelivered.has(d.id);g.fillStyle=done?'#74d1a4':'#f0c379';g.beginPath();g.arc(p.x,p.y,chosen?.id===d.id?7:4,0,Math.PI*2);g.fill();}
 const me=P(s.n);g.fillStyle='#ffffff';g.beginPath();g.arc(me.x,me.y,5,0,Math.PI*2);g.fill();const task=jobTarget(s);if(task){const p=P(task.n);g.strokeStyle='#f5ffff';g.lineWidth=2;g.strokeRect(p.x-7,p.y-7,14,14);}g.font='12px system-ui';g.fillStyle='#d6e8de';g.fillText('White: you / active job   Gold: district   Green: delivered   Roads wrap around the globe',16,h-10);
 const stop=chosen||cityStops[0];$('district-detail').textContent=stop.name+' | '+Math.round(distance(s.n,stop.mail))+' m away | '+(stop.id==='post'?'Original route and six local contracts.':'Deliveries, postmarks, sprint gates and four replayable contracts.');
}
function openMap(){if(!started||paused)return;drawMap();openDialog('map-dialog');$('map-close').focus();}$('atlas').onclick=openMap;$('map-close').onclick=resume;
function openHelp(){openDialog('help-dialog');$('help-close').focus();}$('help').onclick=openHelp;$('help-close').onclick=resume;$('pause-help').onclick=openHelp;
$('district-select').onchange=drawMap;$('set-waypoint').onclick=()=>{waypoint=$('district-select').value;s.toast='Follow your compass to '+cityStops.find(d=>d.id===waypoint).name;s.toastT=4;resume();};$('clear-waypoint').onclick=()=>{waypoint=null;resume();};
function transit(id){if(!travelTo(s,id))return false;waypoint=id==='post'?null:id;view.recenter();view.setCamera('street');mode=0;$('view').textContent='Street view';renderDirty=true;persist();resume();return true;}
$('transit').onclick=()=>{if(!transit($('district-select').value))$('district-detail').textContent='That landing is blocked. Select another district.';};$('return-home').onclick=()=>transit('post');
function ui(){
 const reward=s.delivered.size+s.bonusDelivered.size+s.stamps.size+s.stunts.size+s.jobs.completed.length;if(reward>lastReward&&started)rumble(.28,95);lastReward=reward;
 const t=storyTarget(s)||jobTarget(s)||(waypoint?cityStops.find(d=>d.id===waypoint)||target(s):target(s)),near=nearest(s);
 $('mail-count').textContent=s.delivered.size+' / '+WORLD.homes.length;$('bonus-count').textContent=s.bonusDelivered.size+' / '+WORLD.bonusStops.length;$('stunt-count').textContent=s.stunts.size+' / '+WORLD.stuntGates.length;$('stamp-count').textContent=s.stamps.size+' / '+WORLD.stars.length;
 $('score').textContent=String(s.delivered.size*100+s.bonusDelivered.size*150+s.stamps.size*25+s.stunts.size*200+s.jobs.earned).padStart(5,'0');$('speed').textContent=Math.round(s.speed*3.6)+' km/h';$('energy').style.width='100%';$('ride-name').textContent=s.ride?(vehicle==='bicycle'?'BICYCLE':'ELECTRIC UNICYCLE'):'ON FOOT';document.body.classList.toggle('boosting',s.boosting);$('district-name').textContent=CITY.districtAt(s.n).name;
 $('objective-title').textContent=t.name;$('objective-text').textContent=Math.round(distance(s.n,t.mail))+' m | '+(padState.connected?'X delivers. LB throws. D-pad down opens jobs.':'E delivers. Q throws. J opens city jobs.');
 const b=view?.movementBasis(s);if(b){const toward=tangent(add(t.mail,mul(s.n,-1)),s.n);$('waypoint-arrow').style.transform='rotate('+Math.atan2(dot(toward,b.right),dot(toward,b.forward))+'rad)';}
 $('save-status').textContent=storage?'Progress saved on this device':'Storage unavailable - play continues';$('toast').textContent=s.toast;$('toast').classList.toggle('visible',s.toastT>0);$('context').textContent=started&&near?(padState.connected?'X | ':'E | ')+near.name:'';pulseUI.update();storyUI.update();
}
window.addEventListener('nm-action',e=>{const name=e.detail.name;if(name==='disconnect'){clear();pause();return;}if(name==='pause'){paused?resume():pause();return;}if(name==='help'){openHelp();return;}if(!started||paused||failed||graphicsLost)return;const codes={hop:'Space',interact:'KeyE',ride:'KeyF',throw:'KeyQ',camera:'KeyV',map:'KeyM',recenter:'KeyC',jobs:'KeyJ',bell:'KeyG'};if(codes[name])action(codes[name]);if(name==='next-district'||name==='previous-district'){const i=cityStops.findIndex(d=>d.id===waypoint),next=(Math.max(0,i)+(name==='next-district'?1:-1)+cityStops.length)%cityStops.length;waypoint=cityStops[next].id;$('district-select').value=waypoint;s.toast='Waypoint: '+cityStops[next].name;s.toastT=3;}});
$('material-look').onchange=e=>{view.setLook(e.target.value);renderDirty=true;};$('quiet-effects').onchange=e=>{view.setQuiet(e.target.checked);renderDirty=true;};$('quality').onchange=e=>{view?.setQuality(e.target.value);renderDirty=true;record('quality',e.target.value);};
$('retry').onclick=()=>{if(graphicsLost){view?.restoreGraphics();return;}try{if(!view)view=createScene(canvas);$('material-look').value=view.inspect().jewel.look;$('quiet-effects').checked=view.inspect().jewel.quiet;$('start').disabled=false;view.setQuality('low');renderDirty=true;failed=false;$('failure').hidden=true;last=0;resume();}catch(e){showFailure(String(e.message||e));}};
$('copy-diagnostics').onclick=async()=>{const text=JSON.stringify({version:VERSION,artVersion:ART_VERSION,started,paused,graphicsLost,events:diagnostics,render:view?.inspect(),coastal:pulseUI.inspect(),homecoming:storyUI.inspect(),viewport:[innerWidth,innerHeight,devicePixelRatio]},null,2);$('diagnostics').hidden=false;$('diagnostics').value=text;try{await navigator.clipboard.writeText(text);}catch{}};
const storyUI=createHomecomingUI({state:()=>s,view:()=>view,metrics,open:openDialog,resume,persist});
const pulseUI=createCoastalInterface({state:()=>s,view:()=>view,audio,open:openDialog,resume,persist});
function boot(){try{view=createScene(canvas);$('material-look').value=view.inspect().jewel.look;$('quiet-effects').checked=view.inspect().jewel.quiet;record('renderer-ready');view.artReady.then(()=>{$('start').disabled=false;$('start').textContent=saved?'Continue your neighborhood':'Start riding';renderDirty=true;record('art-ready',view.inspect().art.status);});}catch(e){showFailure(String(e.message||e));}}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();wasPlaying=started&&!paused;graphicsLost=true;closeDialogs();clear();persist();audio.setPlaying(false);$('failure').hidden=false;$('failure-message').textContent='Graphics paused. Your route and contracts are saved. Retry requests recovery.';record('context-lost');});
canvas.addEventListener('webglcontextrestored',()=>{queueMicrotask(()=>{graphicsLost=false;failed=false;view.restoreAppearance();view.setQuality('low');$('material-look').value='light';$('quality').value='low';$('failure').hidden=true;clear();last=0;lastRender=performance.now();renderDirty=true;if(wasPlaying)paused=false;else if(started){paused=false;pause();}record('context-restored');});});
boot();const atmosphereUI=mountAtmosphereUI({view:()=>view});window.addEventListener('nm-atmosphere-change',()=>{renderDirty=true;});window.addEventListener('resize',()=>{view?.resize();renderDirty=true;});
Object.defineProperty(window,'SVGNPlanet',{value:Object.freeze({inspect:()=>({version:VERSION,artVersion:ART_VERSION,engineVersion:VERSION,started,paused,graphicsLost,failed,vehicle,waypoint,controller:{...padState},coastal:pulseUI.inspect(),homecoming:storyUI.inspect(),city:{buildings:CITY.buildings.length,roads:CITY.roads.length,districts:CITY.districts.length,blocks:CITY.blocks.length},time:s.time,n:[...s.n],north:[...s.north],facing:[...s.facing],basis:view?.movementBasis(s),radius:RADIUS,lift:s.lift,ride:s.ride,boosting:s.boosting,speed:s.speed,steps:s.steps,distance:s.distance,deliveries:[...s.delivered],bonusDeliveries:[...s.bonusDelivered],stunts:[...s.stunts],stamps:[...s.stamps],complete:s.complete,nearest:nearest(s)?.id||null,sites:[...WORLD.sites,...WORLD.bonusStops].map(p=>({id:p.id,n:[...p.mail]})),events:s.events.map(e=>({...e})),diagnostics:diagnostics.map(e=>({...e})),render:view?.inspect()})})});
function frame(now){
 requestAnimationFrame(frame);
 if(!view||failed||graphicsLost||document.hidden){audio.setPlaying(false);last=0;return;}
 renderDirty=view.consumeArtRedraw()||renderDirty;const dt=last?Math.min(.12,(now-last)/1000):0;last=now;
 try{
  if(started&&!paused){
   if(padState.lookX||padState.lookY){view.lookBy(padState.lookX*dt*2*preferences.sensitivity*(preferences.invertX?-1:1),padState.lookY*dt*1.2*preferences.sensitivity*(preferences.invertY?-1:1));renderDirty=true;}
   acc=Math.min(.20,acc+dt);while(acc>=1/60){previousPose=capturePose(s);step(s,input(),1/60);jump=false;acc-=1/60;}
  }else{acc=0;previousPose=null;}
  if((renderDirty||(started&&!paused))&&(view.fps>=60||now-lastRender>=1000/view.fps-.5)){
   const workStart=performance.now();view.update(paused?0:Math.min(.2,(now-lastRender)/1000),renderPose(previousPose,s,acc*60),{vehicle});if(started&&!paused)metrics.frame(now,s.time,performance.now()-workStart);else metrics.gap();lastRender=now;renderDirty=false;
  }
  audio.update(s,{active:started&&!paused,vehicle,brake:padState.brake||touchBraking||keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyB'),traffic:view.life?.traffic(),rain:view.atmosphere?.rainLevel||0});
  if(now-lastUI>120){ui();lastUI=now;}if(now-lastSave>5000){idleSave();lastSave=now;}
 }catch(e){showFailure(String(e.message||e));}
}
requestAnimationFrame(frame);
