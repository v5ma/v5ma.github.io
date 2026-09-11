import {padState,rumble} from './controller.mjs';
import {ART_VERSION} from './street-art.mjs';
import {VERSION,RADIUS,WORLD,CITY,travelTo,cross,dot,tangent,at,add,mul,norm,distance,localPosition,initial,step,nearest,interact,throwPaper,switchRide,readSave,saveData,SAVE_KEY,LEGACY_SAVE_KEY,target} from './model.mjs';
import {createScene} from './scene.mjs';
const $=id=>document.getElementById(id),canvas=$('world');let saved=null,storage=true;try{saved=readSave(localStorage.getItem(SAVE_KEY));if(!saved)saved=readSave(localStorage.getItem(LEGACY_SAVE_KEY));}catch{storage=false;}
let s=initial(saved),started=false,paused=false,graphicsLost=false,failed=false,view,keys=new Set(),stick=[0,0],jump=false,boost=false,orbitDrag=null,last=0,lastRender=0,lastUI=0,lastSave=0,acc=0,mode=0,vehicle=saved?.vehicle||'unicycle',saveStamp='',wasPlaying=false,renderDirty=true;const diagnostics=[];let waypoint=null,lastReward=0;
$('vehicle').value=$('vehicle-pause').value=vehicle;
const cityStops=[{id:'post',name:'Original delivery depot',mail:WORLD.sites[0].mail},...CITY.districts];
for(const d of cityStops){const option=document.createElement('option');option.value=d.id;option.textContent=d.name;$('district-select').append(option);}

function record(type,message=''){diagnostics.push({type,message,time:Date.now()});if(diagnostics.length>20)diagnostics.shift();}
function clear(){keys.clear();stick=[0,0];jump=boost=false;acc=0;$('stick').querySelector('i').style.transform='';}
function persist(){s.vehicle=vehicle;const raw=JSON.stringify(saveData(s));if(raw===saveStamp)return;try{localStorage.setItem(SAVE_KEY,raw);saveStamp=raw;}catch{storage=false;}}
function showFailure(message){failed=true;for(const id of ['pause-dialog','map-dialog','help-dialog'])if($(id).open)$(id).close();clear();persist();$('failure').hidden=false;$('failure-message').textContent=message;record('error',message);}
function pause(){if(!started||paused||graphicsLost||failed)return;paused=true;clear();persist();$('pause-dialog').showModal();}
function resume(){if(graphicsLost||failed)return;paused=false;clear();last=0;for(const id of ['pause-dialog','map-dialog','help-dialog'])if($(id).open)$(id).close();canvas.focus({preventScroll:true});}
for(const id of ['pause-dialog','map-dialog','help-dialog'])$(id).addEventListener('close',()=>{if(graphicsLost||failed||!paused||document.querySelector('dialog[open]'))return;paused=false;clear();last=0;canvas.focus({preventScroll:true});});
$('start').onclick=()=>{started=true;paused=false;vehicle=$('vehicle').value;s.ride=true;clear();$('welcome').hidden=true;document.body.classList.remove('title');view.setCamera('street');mode=0;canvas.focus({preventScroll:true});record('started');};$('pause').onclick=pause;$('resume').onclick=resume;
$('reset').onclick=()=>{$('confirm-reset').hidden=false;$('cancel-reset').focus();};$('cancel-reset').onclick=()=>{$('confirm-reset').hidden=true;$('reset').focus();};$('accept-reset').onclick=()=>{s=initial();s.ride=true;saveStamp='';persist();$('confirm-reset').hidden=true;resume();};$('vehicle-pause').onchange=e=>{vehicle=e.target.value;$('vehicle').value=vehicle;persist();};$('vehicle').onchange=e=>{vehicle=e.target.value;$('vehicle-pause').value=vehicle;};
function changeView(){if(!view)return;renderDirty=true;mode=(mode+1)%3;view.setCamera(['street','adventure','overview'][mode]);$('view').textContent=['Street view','Adventure view','World overview'][mode];}$('view').onclick=()=>{changeView();canvas.focus({preventScroll:true});};
function action(code){if(!started||paused||failed||graphicsLost)return;if(code==='KeyE'){if(nearest(s))interact(s);else throwPaper(s);persist();}if(code==='KeyQ')throwPaper(s);if(code==='KeyF'){switchRide(s);persist();}if(code==='Space')jump=true;if(code==='KeyV')changeView();if(code==='KeyM')openMap();if(code==='KeyH')openHelp();if(code==='KeyC'){view.recenter();renderDirty=true;}}
const codes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE','KeyQ','KeyF','KeyV','KeyM','KeyH','KeyC'];window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat&&started){e.preventDefault();paused?resume():pause();return;}if(!started||paused)return;if(codes.includes(e.code)){e.preventDefault();keys.add(e.code);if(!e.repeat)action(e.code);}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();persist();pause();}last=0;});window.addEventListener('pagehide',persist);
canvas.addEventListener('pointerdown',e=>{orbitDrag={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(orbitDrag?.id===e.pointerId){view?.orbitBy((e.clientX-orbitDrag.x)*.005);renderDirty=true;orbitDrag.x=e.clientX;}});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>orbitDrag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();mode=e.deltaY>0?1:0;view.setCamera(mode?'adventure':'street');$('view').textContent=mode?'Adventure view':'Street view';renderDirty=true;},{passive:false});
$('touch-interact').onclick=()=>action('KeyE');$('touch-ride').onclick=()=>action('KeyF');$('touch-jump').onclick=()=>action('Space');$('touch-boost').onpointerdown=e=>{boost=true;e.currentTarget.setPointerCapture(e.pointerId);};for(const type of ['pointerup','pointercancel','lostpointercapture'])$('touch-boost').addEventListener(type,()=>boost=false);
let pointer=null;const pad=$('stick');function moveStick(e){const r=pad.getBoundingClientRect(),x=(e.clientX-r.x-r.width/2)/38,y=(e.clientY-r.y-r.height/2)/38,l=Math.max(1,Math.hypot(x,y));stick=[x/l,-y/l];pad.querySelector('i').style.transform=`translate(${stick[0]*30}px,${-stick[1]*30}px)`;}pad.onpointerdown=e=>{pointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);};pad.onpointermove=e=>{if(pointer===e.pointerId)moveStick(e);};for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,()=>{pointer=null;stick=[0,0];pad.querySelector('i').style.transform='';});if(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)document.body.classList.add('touch');
function input(){
 const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick[0]+padState.x;
 const z=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+stick[1]+padState.y;
 const b=view.movementBasis(s),magnitude=Math.min(1,Math.hypot(x,z));
 return {direction:magnitude>.05?norm(add(mul(b.right,x),mul(b.forward,z))):null,throttle:magnitude,brake:padState.brake,boost:padState.boost||boost||keys.has('ShiftLeft')||keys.has('ShiftRight'),jump};
}
function drawMap(){
 const c=$('map'),g=c.getContext('2d'),w=c.width,h=c.height;
 const P=n=>({x:(Math.atan2(n[0],n[1])/(2*Math.PI)+.5)*(w-40)+20,y:(.5-Math.asin(Math.max(-1,Math.min(1,-n[2])))/Math.PI)*(h-60)+22});
 g.fillStyle='#173f4c';g.fillRect(0,0,w,h);g.lineWidth=1;g.strokeStyle='#2e5963';
 for(let i=1;i<12;i++){g.beginPath();g.moveTo(i*w/12,10);g.lineTo(i*w/12,h-25);g.stroke();}
 for(const r of CITY.roads){g.strokeStyle='#68958e';g.beginPath();let prev=null;for(const n of r.points){const p=P(n);if(!prev||Math.abs(prev.x-p.x)>w/2)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);prev=p;}g.stroke();}
 for(const r of WORLD.roads){g.strokeStyle='#c9c5aa';g.beginPath();let prev=null;for(const n of r.points){const p=P(n);if(!prev||Math.abs(prev.x-p.x)>w/2)g.moveTo(p.x,p.y);else g.lineTo(p.x,p.y);prev=p;}g.stroke();}
 const chosen=cityStops.find(d=>d.id===$('district-select').value);
 for(const d of cityStops){const p=P(d.mail),done=d.id==='post'?s.complete:s.bonusDelivered.has(d.id);g.fillStyle=done?'#74d1a4':'#f0c379';g.beginPath();g.arc(p.x,p.y,chosen?.id===d.id?7:4,0,Math.PI*2);g.fill();if(chosen?.id===d.id){g.strokeStyle='#fff4d0';g.lineWidth=2;g.beginPath();g.arc(p.x,p.y,11,0,Math.PI*2);g.stroke();}}
 const me=P(s.n);g.fillStyle='#ffffff';g.beginPath();g.arc(me.x,me.y,5,0,Math.PI*2);g.fill();g.font='12px system-ui';g.fillStyle='#d6e8de';g.fillText('White: you   Gold: district mission   Green: completed   Roads wrap around the globe',16,h-10);
 const stop=chosen||cityStops[0];$('district-detail').textContent=stop.name+' | '+Math.round(distance(s.n,stop.mail))+' m away'+(stop.id==='post'?' | Your original route and progress are preserved.':' | Deliver news, collect 2 postmarks and complete the local sprint gate.');
}
function openMap(){if(!started||paused)return;paused=true;clear();drawMap();$('map-dialog').showModal();$('map-close').focus();}$('atlas').onclick=openMap;$('map-close').onclick=resume;
function ui(){
 const reward=s.delivered.size+s.bonusDelivered.size+s.stamps.size+s.stunts.size;if(reward>lastReward&&started)rumble(.3,100);lastReward=reward;
 const t=waypoint?cityStops.find(d=>d.id===waypoint)||target(s):target(s),near=nearest(s),bonusLeft=WORLD.bonusStops.length-s.bonusDelivered.size;
 $('mail-count').textContent=s.delivered.size+' / '+WORLD.homes.length;
 $('bonus-count').textContent=s.bonusDelivered.size+' / '+WORLD.bonusStops.length;
 $('stunt-count').textContent=s.stunts.size+' / '+WORLD.stuntGates.length;
 $('stamp-count').textContent=String(s.stamps.size)+' / '+WORLD.stars.length;
 $('score').textContent=String(s.delivered.size*100+s.bonusDelivered.size*150+s.stamps.size*25+s.stunts.size*200).padStart(5,'0');
 $('speed').textContent=Math.round(s.speed*3.6)+' km/h';$('energy').style.width=s.energy*100+'%';
 $('ride-name').textContent=s.ride?(vehicle==='bicycle'?'BICYCLE':'ELECTRIC UNICYCLE'):'ON FOOT';document.body.classList.toggle('boosting',s.boosting);
 $('district-name').textContent=CITY.districtAt(s.n).name;
 $('objective-title').textContent=t.name;
 $('objective-text').textContent=Math.round(distance(s.n,t.mail))+' m | '+(s.complete&&!bonusLeft?'All deliveries complete. Keep exploring.':(padState.connected?'X delivers nearby. LB throws.':'E delivers nearby. Q throws.'));
 const b=view?.movementBasis(s);if(b){const toward=tangent(add(t.mail,mul(s.n,-1)),s.n);$('waypoint-arrow').style.transform='rotate('+Math.atan2(dot(toward,b.right),dot(toward,b.forward))+'rad)';}
 $('save-status').textContent=storage?'Saved on this device':'Storage unavailable - play continues';
 $('toast').textContent=s.toast;$('toast').classList.toggle('visible',s.toastT>0);$('context').textContent=started&&near?(padState.connected?'X | ':'E | ')+near.name:'';
}
function openHelp(){if(!started||failed||graphicsLost)return;paused=true;clear();for(const id of ['pause-dialog','map-dialog'])if($(id).open)$(id).close();$('help-dialog').showModal();$('help-close').focus();}
$('help').onclick=openHelp;$('help-close').onclick=resume;$('pause-help').onclick=openHelp;
$('district-select').onchange=drawMap;
$('set-waypoint').onclick=()=>{waypoint=$('district-select').value;s.toast='Follow your compass to '+cityStops.find(d=>d.id===waypoint).name;s.toastT=4;resume();};
$('clear-waypoint').onclick=()=>{waypoint=null;resume();};
$('transit').onclick=()=>{const id=$('district-select').value;if(travelTo(s,id)){waypoint=id;view.recenter();view.setCamera('street');mode=0;$('view').textContent='Street view';renderDirty=true;persist();resume();}else{$('district-detail').textContent='That landing is blocked. Select another district.';}};
$('return-home').onclick=()=>{travelTo(s,'post');waypoint=null;view.setCamera('street');mode=0;$('view').textContent='Street view';view.recenter();renderDirty=true;persist();resume();};
window.addEventListener('nm-action',e=>{
 const name=e.detail.name;
 if(name==='disconnect'){clear();pause();return;}
 if(name==='pause'){paused?resume():pause();return;}
 if(name==='help'){openHelp();return;}
 if(!started||paused||failed||graphicsLost)return;
 const codes={hop:'Space',interact:'KeyE',ride:'KeyF',throw:'KeyQ',camera:'KeyV',map:'KeyM',recenter:'KeyC'};
 if(codes[name])action(codes[name]);
 if(name==='next-district'||name==='previous-district'){
  const i=cityStops.findIndex(d=>d.id===waypoint),next=(Math.max(0,i)+(name==='next-district'?1:-1)+cityStops.length)%cityStops.length;
  waypoint=cityStops[next].id;$('district-select').value=waypoint;s.toast='Waypoint: '+cityStops[next].name;s.toastT=3;
 }
});
$('material-look').onchange=e=>{view.setLook(e.target.value);renderDirty=true;};$('quiet-effects').onchange=e=>{view.setQuiet(e.target.checked);renderDirty=true;};
$('quality').onchange=e=>{view?.setQuality(e.target.value);renderDirty=true;record('quality',e.target.value);};$('retry').onclick=()=>{if(graphicsLost){view?.restoreGraphics();record('recovery-requested');return;}try{if(!view)view=createScene(canvas);$('material-look').value=view.inspect().jewel.look;$('quiet-effects').checked=view.inspect().jewel.quiet;$('start').disabled=false;view.setQuality('low');renderDirty=true;failed=false;$('failure').hidden=true;last=0;resume();}catch(e){showFailure(String(e.message||e));}};$('copy-diagnostics').onclick=async()=>{const text=JSON.stringify({version:VERSION,artVersion:ART_VERSION,engineVersion:VERSION,started,paused,graphicsLost,events:diagnostics,render:view?.inspect(),viewport:[innerWidth,innerHeight,devicePixelRatio]},null,2);$('diagnostics').hidden=false;$('diagnostics').value=text;try{await navigator.clipboard.writeText(text);}catch{};};
function boot(){try{view=createScene(canvas);$('material-look').value=view.inspect().jewel.look;$('quiet-effects').checked=view.inspect().jewel.quiet;record('renderer-ready');view.artReady.then(()=>{$('start').disabled=false;$('start').textContent=saved?'Continue route':'Start riding';renderDirty=true;record('art-ready',view.inspect().art.status);});}catch(e){showFailure(String(e.message||e));}}canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();wasPlaying=started&&!paused;graphicsLost=true;for(const id of ['pause-dialog','map-dialog','help-dialog'])if($(id).open)$(id).close();clear();persist();$('failure').hidden=false;$('failure-message').textContent='Graphics paused. Your route is still here. Waiting for the browser to restore graphics; Retry requests recovery.';record('context-lost');});canvas.addEventListener('webglcontextrestored',()=>{queueMicrotask(()=>{graphicsLost=false;failed=false;view.restoreAppearance();view.setQuality('low');$('material-look').value='light';$('quality').value='low';$('failure').hidden=true;clear();last=0;lastRender=performance.now();renderDirty=true;if(wasPlaying)paused=false;else if(started){paused=false;pause();}record('context-restored');});});boot();window.addEventListener('resize',()=>{view?.resize();renderDirty=true;});
Object.defineProperty(window,'SVGNPlanet',{value:Object.freeze({inspect:()=>({version:VERSION,artVersion:ART_VERSION,engineVersion:VERSION,started,paused,graphicsLost,failed,vehicle,waypoint,controller:{...padState},city:{buildings:CITY.buildings.length,roads:CITY.roads.length,districts:CITY.districts.length,blocks:CITY.blocks.length},time:s.time,n:[...s.n],north:[...s.north],facing:[...s.facing],basis:view?.movementBasis(s),radius:RADIUS,lift:s.lift,ride:s.ride,boosting:s.boosting,speed:s.speed,steps:s.steps,distance:s.distance,deliveries:[...s.delivered],bonusDeliveries:[...s.bonusDelivered],stunts:[...s.stunts],stamps:[...s.stamps],complete:s.complete,nearest:nearest(s)?.id||null,sites:[...WORLD.sites,...WORLD.bonusStops].map(p=>({id:p.id,n:[...p.mail]})),events:s.events.map(e=>({...e})),diagnostics:diagnostics.map(e=>({...e})),render:view?.inspect()})})});
function frame(now){requestAnimationFrame(frame);if(!view||failed||graphicsLost||document.hidden){last=0;return;}renderDirty=view.consumeArtRedraw()||renderDirty;const dt=last?Math.min(.075,(now-last)/1000):0;last=now;try{if(started&&!paused){if(padState.lookX||padState.lookY){view.lookBy(padState.lookX*dt*2,padState.lookY*dt*1.2);renderDirty=true;}acc=Math.min(.1,acc+dt);while(acc>=1/60){step(s,input(),1/60);jump=false;acc-=1/60;}}else acc=0;if((renderDirty||(started&&!paused))&&now-lastRender>=1000/view.fps-1){view.update(paused?0:Math.min(.1,(now-lastRender)/1000),s,{vehicle});lastRender=now;renderDirty=false;}if(now-lastUI>120){ui();lastUI=now;}if(now-lastSave>1000){persist();lastSave=now;}}catch(e){showFailure(String(e.message||e));}}requestAnimationFrame(frame);
