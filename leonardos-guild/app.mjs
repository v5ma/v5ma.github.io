import {createResonanceAudio} from './resonance-audio.mjs';
import {createResonanceUI} from './resonance-ui.mjs';
import {reloadSling,toggleCover,specialAbility,fireTool} from './resonance-core.mjs';
import {createDoorsUI} from './doors-ui.mjs';
import {createGamepad} from './gamepad.mjs';
import {dodgeDoor,nearbyDoors,useDoor} from './doors-core.mjs';
import {createCityUI} from './city-ui.mjs';
import {createStreetUI} from './street-ui.mjs';
import {createLifeUI} from './life-ui.mjs';
import {stats,cast,lifeDescription} from './life-core.mjs';
import {makeWorld,newState,readSave,saveData,SAVE_KEY,VERSION,step,throwPaper,enterExit,scan,recover,activeTarget,missionText,nearestNode,district,distance,trade,attack,tell} from './model.mjs';
import {createScene} from './scene.mjs';
import {createTouchControls} from './touch-controls.mjs';
const $=id=>document.getElementById(id),world=makeWorld();
const preferenceKey='svgn.leonardos-guild.preferences.v1',isTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
let preferences={touch:!!isTouch,quality:isTouch?'balanced':'high',distance:1};
try{const v=JSON.parse(localStorage.getItem(preferenceKey));if(v){if(typeof v.touch==='boolean')preferences.touch=v.touch;if(['high','balanced','low'].includes(v.quality))preferences.quality=v.quality;if([.8,1,1.4].includes(v.distance))preferences.distance=v.distance;}}catch{}
const queryQuality=new URLSearchParams(location.search).get('quality');if(['high','balanced','low'].includes(queryQuality))preferences.quality=queryQuality;
function savePreferences(){try{localStorage.setItem(preferenceKey,JSON.stringify(preferences));}catch{}}
let thumb=null,lastMode=null,lifeUI=null,streetUI=null,cityUI=null,doorsUI=null,consoleUI=null,pad=null;function showTouch(){document.body.classList.toggle('touch',preferences.touch);}showTouch();
let storage=true,saved=null;
try{saved=readSave(localStorage.getItem(SAVE_KEY),world);}catch{storage=false;}
let state=newState(saved),view,playing=false,paused=false,keys=new Set(),touch=new Set(),accumulator=0,last=0,lastSave='',lastUI=0,jump=false,look=0,drag=null,audio=null,flash='';
audio=createResonanceAudio({getState:()=>state,world});
function save(){const value=JSON.stringify(saveData(state));if(value===lastSave)return;try{localStorage.setItem(SAVE_KEY,value);lastSave=value;$('save-status').textContent='Progress saved on this device';}catch{storage=false;$('save-status').textContent='Storage unavailable — this session is not saved';}}
function clearInput(){thumb?.reset();keys.clear();touch.clear();jump=false;look=0;drag=null;document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));accumulator=0;}
function setPause(v){if(!v&&document.querySelector('dialog[open]'))v=true;paused=v;document.body.classList.toggle('game-paused',v);clearInput();audio?.setPaused(v);if(v)consoleUI?.cancelWheel();if(!v)$('world').focus({preventScroll:true});}
function pause(){if(!playing)return;setPause(true);if(!$('pause-dialog').open)$('pause-dialog').showModal();}
function map(){if(!playing)return;setPause(true);drawMap($('city-map'),true);$('map-dialog').showModal();}
function toggleSound(){audio.toggle();}
function openShop(){
 if(!playing||paused)return;
 if(state.doors.level||state.life.inside||distance(state,world.shop)>7||Math.abs(state.speed)>1.7){tell(state,'Stop beside the market stall to trade.');return;}
 setPause(true);$('shop-florins').textContent=state.credits;$('shop-staff').disabled=state.upgraded;$('shop-dialog').showModal();
}
for(const [id,item]of [['shop-supplies','supplies'],['shop-staff','staff']])$(id).onclick=()=>{trade(state,world,item);$('shop-message').textContent=state.toast;$('shop-florins').textContent=state.credits;$('shop-staff').disabled=state.upgraded;save();};
$('shop-close').onclick=()=>$('shop-dialog').close();$('shop-dialog').addEventListener('close',()=>setPause(false));
function start(){playing=true;paused=false;document.body.classList.remove('game-paused');clearInput();$('menu').hidden=true;$('menu').style.display='none';$('hud').hidden=false;$('world').focus();audio.start();audio.setPaused(false);}
$('start').onclick=start;$('pause-button').onclick=pause;$('map-button').onclick=$('minimap-button').onclick=map;$('sound').onclick=toggleSound;
$('resume').onclick=()=>$('pause-dialog').close();$('map-close').onclick=()=>$('map-dialog').close();
$('pause-dialog').addEventListener('close',()=>{if(playing)setPause(false);});$('map-dialog').addEventListener('close',()=>{if(playing)setPause(false);});
$('recover').onclick=()=>{recover(state);$('pause-dialog').close();view?.update(0,state,{snap:true});};
const resetDialog=document.createElement('dialog');resetDialog.id='reset-confirm';resetDialog.setAttribute('aria-label','Confirm new commission');resetDialog.innerHTML='<h2>Start a new commission?</h2><p>This clears only Leonardo’s Guild progress on this device. All deliveries, florins, original and new commissions will reset. Your other games are untouched.</p><button id="reset-cancel" data-pad-default>Keep my adventure / B</button><button id="reset-accept">Yes, start this game again</button>';document.body.append(resetDialog);
$('reset').onclick=()=>resetDialog.showModal();$('reset-cancel').onclick=()=>resetDialog.close();$('reset-accept').onclick=()=>{state=newState();lastSave='';save();resetDialog.close();$('pause-dialog').close();view?.update(0,state,{snap:true});};resetDialog.addEventListener('close',()=>setPause(false));
$('menu-return').onclick=()=>{playing=false;setPause(true);$('pause-dialog').close();$('hud').hidden=true;$('menu').hidden=false;$('menu').style.display='flex';$('start').textContent='Continue exploring →';};
const handled=new Set(['KeyU','Tab','KeyG','KeyO','KeyZ','KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ','KeyC','KeyE','KeyF','KeyX','KeyH','KeyJ','KeyK','KeyB','KeyN','KeyT','KeyR','KeyY','KeyV','KeyI','KeyM','KeyP','Escape','ShiftLeft','ShiftRight']);
window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||!playing)return;
 if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){if(resetDialog.open)resetDialog.close();else if(consoleUI?.close()){}else if(doorsUI?.close()){}else if(cityUI?.close()){}else if(streetUI?.close()){}else if(lifeUI?.close()){}else if($('settings-dialog').open)$('settings-dialog').close();else if($('shop-dialog').open)$('shop-dialog').close();else if($('map-dialog').open)$('map-dialog').close();else if($('pause-dialog').open)$('pause-dialog').close();else pause();e.preventDefault();return;}
 if(paused||consoleUI?.wheelActive())return;if(handled.has(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(e.code==='KeyU'){consoleUI.dispatch();return;}if(e.code==='Tab'){consoleUI.openWheel('tools');return;}if(e.code==='KeyG'){doorsUI.open();return;}if(e.code==='KeyO'){dodgeDoor(state);return;}if(e.code==='KeyI'){cityUI.open();return;}if(e.code==='KeyV'){streetUI.open();return;}if(e.code==='KeyY'){streetUI.interact();return;}if(e.code==='KeyN'){lifeUI.note();return;}if(e.code==='KeyT'){lifeUI.talk();return;}if(e.code==='KeyR'){cast(state);return;}
 if(e.code==='KeyQ')throwPaper(state,world,1);if(e.code==='KeyC')throwPaper(state,world,-1);
 if(e.code==='KeyM')map();if(e.code==='KeyF'||e.code==='KeyE'){if(distance(state,world.shop)<7&&Math.abs(state.speed)<1.7)openShop();else enterExit(state,world);}if(e.code==='KeyX')scan(state);if(e.code==='Space')jump=true;if(e.code==='KeyJ')attack(state,world);if(e.code==='KeyB')openShop();
});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{if(playing&&!paused)pause();else clearInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)pause();});
function touchAction(action){if(!playing||paused)return;switch(action){case'adventures':doorsUI.open();break;case'nearby':cityUI.open();break;case'work':streetUI.interact();break;case'social':lifeUI.talk();break;case'magic':cast(state);break;case'vehicle':if(distance(state,world.shop)<7&&Math.abs(state.speed)<1.7)openShop();else enterExit(state,world);break;case'attack':fireTool(state,world,{attack,throwPaper,cast});break;case'dispatch':consoleUI.dispatch();break;case'reload':reloadSling(state);break;case'jump':jump=true;break;case'recenter':view?.recenter();break;}}
lifeUI=createLifeUI({getState:()=>state,world,setPause,save,active:()=>playing&&!paused,onTransition:()=>view?.update(0,state,{snap:true})});
streetUI=createStreetUI({getState:()=>state,world,setPause,save,active:()=>playing&&!paused});
cityUI=createCityUI({getState:()=>state,world,setPause,save,active:()=>playing&&!paused,lifeUI,streetUI});
doorsUI=createDoorsUI({getState:()=>state,world,setPause,save,active:()=>playing&&!paused,onTransition:()=>view?.update(0,state,{snap:true}),legacyNearby:()=>cityUI.open(),journal:()=>lifeUI.note(),settings:()=>$('settings-button').click()});
consoleUI=createResonanceUI({getState:()=>state,world,audio,setPause,save,active:()=>playing&&!paused,playing:()=>playing,actions:{nearby:()=>cityUI.open(),guide:()=>doorsUI.open('adventures'),journal:()=>lifeUI.note(),map}});
function consoleJump(){
 if(consoleUI.preferences.profile==='console'&&state.mode==='foot'){
  const p=nearbyDoors(state,world).find(p=>['up','down','roofexit','tunnel','cellexit'].includes(p.action)&&distance(state,p)<1.6);
  if(p){const result=useDoor(state,world,p.id,'use');if(result.ok){view?.update(0,state,{snap:true});save();}else tell(state,result.text);return;}
 }
 jump=true;
}
pad=createGamepad({getState:()=>state,playing:()=>playing,active:()=>playing&&!paused,getPreferences:()=>consoleUI.preferences,actions:{
 start,pause,map,jump:consoleJump,dodge:()=>dodgeDoor(state),interact:()=>doorsUI.interact(),vehicle:()=>enterExit(state,world),
 throwLeft:()=>{if(!state.doors.level&&!state.life.inside)throwPaper(state,world,1);},throwRight:()=>{if(!state.doors.level&&!state.life.inside)throwPaper(state,world,-1);},attack:()=>attack(state,world),recenter:()=>view?.recenter(),guide:()=>doorsUI.open('adventures'),journal:()=>lifeUI.note(),magic:()=>cast(state),scan:()=>scan(state),
 gesture:()=>audio.unlock(),uiSound:name=>audio.play(name,{ui:true,volume:.12}),heading:()=>view?.heading()??state.yaw,dispatch:()=>consoleUI.dispatch(),
 openWheel:kind=>consoleUI.openWheel(kind),updateWheel:(...args)=>consoleUI.updateWheel(...args),closeWheel:commit=>consoleUI.closeWheel(commit),cancelWheel:()=>consoleUI.cancelWheel(),wheelActive:()=>consoleUI.wheelActive(),
 reload:()=>reloadSling(state),cover:()=>toggleCover(state,world),special:()=>specialAbility(state),horn:()=>audio.play('horn',{source:state,volume:.48,caption:'Vehicle bell'}),headlight:()=>{state.resonance.headlight=!state.resonance.headlight;audio.play('switch',{volume:.25});tell(state,'Vehicle lamp '+(state.resonance.headlight?'on':'off')+'.');}
}});
audio.setHaptics(kind=>pad.rumble(kind));
$('dispatch-button').onclick=()=>consoleUI.dispatch();
$('adventures-button').onclick=()=>doorsUI.open();
for(const suffix of ['title','pause']){const block=document.createElement('div');block.className='pad-supplement';block.innerHTML=`<button id="${suffix}-settings">Controls and graphics</button><button id="${suffix}-sound">Audio and controller</button>`;$(suffix==='title'?'start':'resume').after(block);$(suffix+'-settings').onclick=()=>{setPause(true);$('settings-dialog').showModal();};$(suffix+'-sound').onclick=()=>consoleUI.openAudio();}

thumb=createTouchControls({stick:$('move-stick'),surface:$('world'),active:()=>playing&&!paused,show:()=>{},onPress:touchAction,onHold:(code,down)=>{if(!down){touch.delete(code);return;}if(!playing||paused)return;if(code==='hack'&&distance(state,world.shop)<7&&Math.abs(state.speed)<1.7){openShop();return;}touch.add(code);if(code==='q')throwPaper(state,world,1);if(code==='c')throwPaper(state,world,-1);if(code==='hack')scan(state);}});
$('show-joystick').checked=preferences.touch;$('graphics-quality').value=preferences.quality;$('camera-distance').value=preferences.distance;
$('settings-button').onclick=()=>{setPause(true);$('settings-dialog').showModal();};$('settings-close').onclick=()=>$('settings-dialog').close();$('settings-dialog').addEventListener('close',()=>setPause(false));
$('show-joystick').onchange=()=>{clearInput();preferences.touch=$('show-joystick').checked;showTouch();savePreferences();};
$('graphics-quality').onchange=()=>{preferences.quality=$('graphics-quality').value;view?.setQuality(preferences.quality);savePreferences();};
$('camera-distance').onchange=()=>{preferences.distance=Number($('camera-distance').value);view?.setDistance(preferences.distance);savePreferences();};
$('mission').classList.toggle('collapsed',!!preferences.touch);$('mission-toggle').onclick=()=>{const collapsed=$('mission').classList.toggle('collapsed');$('mission-toggle').textContent=collapsed?'＋':'−';$('mission-toggle').setAttribute('aria-expanded',String(!collapsed));};
function controls(dt){const has=(a,b)=>keys.has(a)||keys.has(b),a=preferences.touch?thumb.axes():{x:0,y:0,strength:0},keyboardThrottle=Number(has('KeyW','ArrowUp'))-Number(has('KeyS','ArrowDown')),keyboardSteer=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft')),camera=thumb.consumeLook(),gp=pad?.controls(dt)||{};return {...gp,consoleOptions:consoleUI.preferences,moveYaw:keyboardThrottle||keyboardSteer||a.strength?undefined:gp.moveYaw,throttle:keyboardThrottle||a.y||gp.throttle||0,steer:keyboardSteer||a.x||gp.steer||0,analog:!keyboardThrottle&&(a.strength>0||gp.analog),boost:has('ShiftLeft','ShiftRight')||touch.has('boost')||gp.boost,brake:keys.has('Space')&&state.mode==='car'||keys.has('KeyZ')&&state.mode==='bike'||touch.has('brake')||gp.brake,jump,leftPaper:keys.has('KeyQ')||touch.has('q'),rightPaper:keys.has('KeyC')||touch.has('c'),hack:keys.has('KeyH')||touch.has('hack')||gp.hack,guard:keys.has('KeyK')||touch.has('guard')||gp.guard,look:camera.x+(gp.look||0),lookY:camera.y+(gp.lookY||0)};}
function drawMap(canvas,full=false){const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height,scale=full?Math.min(w/330,h/650):1.55,ox=full?w/2:w/2-state.x*scale,oy=full?55:-state.z*scale+h*.52;
 const X=x=>ox+x*scale,Z=z=>oy+z*scale;g.fillStyle='#224650';g.fillRect(0,0,w,h);g.fillStyle='#54765e';g.fillRect(X(-148),Z(-26),296*scale,592*scale);
 for(const x of world.roads){g.fillStyle='#213e48';g.fillRect(X(x-7),Z(-26),14*scale,592*scale);g.fillStyle='#8f9b84';g.fillRect(X(x-10),Z(-26),2*scale,592*scale);}
 for(const z of [...world.crossings,459,520]){g.fillStyle='#213e48';g.fillRect(X(-148),Z(z-7),296*scale,14*scale);}
 for(const b of world.houses){g.fillStyle='#b9b396';g.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),b.w*scale,b.d*scale);}
 for(const b of world.mailboxes){g.fillStyle=state.deliveries.has(b.id)?'#688c70':b.route?'#edbd7d':'#9bbdac';g.fillRect(X(b.x)-2,Z(b.z)-2,4,4);}
 for(const n of world.nodes){g.strokeStyle=state.relay&&n.type==='relay'?'#80bf9f':'#8bd6c1';g.lineWidth=2;g.beginPath();g.arc(X(n.x),Z(n.z),full?7:4,0,7);g.stroke();}
 const goal=activeTarget(state,world);g.strokeStyle='#f5daae';g.lineWidth=1.4;g.setLineDash([4,6]);g.beginPath();g.moveTo(X(state.x),Z(state.z));g.lineTo(X(goal.x),Z(goal.z));g.stroke();g.setLineDash([]);g.save();g.translate(X(goal.x),Z(goal.z));g.rotate(Math.PI/4);g.fillStyle='#f4cb85';g.fillRect(-4,-4,8,8);g.restore();
 for(const [type,v]of Object.entries(state.vehicle))if(state.mode!==type){g.fillStyle=type==='car'?'#eda065':'#83c2cf';g.fillRect(X(v.x)-3,Z(v.z)-5,6,10);}
 g.save();g.translate(X(state.x),Z(state.z));g.rotate(-state.yaw);g.fillStyle='#fff9d3';g.beginPath();g.moveTo(0,8);g.lineTo(5,-5);g.lineTo(-5,-5);g.closePath();g.fill();g.restore();
 if(full){g.fillStyle='#e1e7cc';g.font='600 15px Arial';g.textAlign='center';for(const [name,z]of[['VINCI HEIGHTS',-13],["ARTISANS’ MARKET",157],['ARNO OUTSKIRTS',310]])g.fillText(name,X(0),Z(z));g.font='11px Arial';g.textAlign='left';g.fillText('N ↑',15,22);g.fillText('Blue objective: tracked commission. Open your notebook for details.',20,h-20);}
 lifeUI?.drawMap(g,X,Z,full);streetUI?.drawMap(g,X,Z,full);cityUI?.drawMap(g,X,Z,full);doorsUI?.drawMap(g,X,Z,full);consoleUI?.drawMap(g,X,Z,full);
}
function updateUI(){if(state.mode!==lastMode){thumb?.reset();touch.clear();lastMode=state.mode;document.querySelectorAll('.foot-action').forEach(b=>b.hidden=state.mode!=='foot');}const p=missionText(state),set=(id,text)=>{if($(id).textContent!==text)$(id).textContent=text;};set('mission-tag',p.tag);set('mission-title',p.title);set('mission-description',p.text);set('target-distance',Math.round(distance(state,activeTarget(state,world)))+' m');set('district',district(state).toUpperCase());set('mode-name',state.mode==='bike'?(state.life.bike==='standard'?'LEONARDO’S BICYCLE':state.life.bike.toUpperCase()+' BICYCLE'):state.mode==='car'?'PEDAL CARRIAGE':'ON FOOT / GUILD APPRENTICE');set('speed',String(Math.round(Math.abs(state.speed)*3.6)).padStart(2,'0'));set('papers',String(state.papers));set('score',String(state.score));set('credits',String(state.credits));$('health').style.width=Math.min(100,state.health/stats(state).maxHealth*100)+'%';set('trace-status',state.trace>.1?'LOCAL COMMOTION '+Math.round(state.trace*100)+'%':'V0.9 / LIVING STORIES');$('toast').classList.toggle('visible',state.toastT>0);set('toast',state.toast);flash=state.toast;
 const node=nearestNode(state,world);let hint=state.mode==='foot'?'WASD walk · F enter a nearby ride':state.mode==='car'?'WASD pedal · Space brake · F dismount':'WASD ride · Q / C throw · F dismount';
 if(node)hint=state.scan>0?((state.relay&&node.type==='relay')?'Waterwheel restored. The bridge passage is open.':'Stop and hold H: '+node.name):'X: inspect '+node.name;
 if(distance(state,world.depot)<8)hint='Leonardo’s workshop · hold H to report / replenish';if(distance(state,world.shop)<7)hint='MARKET STALL · Stop, then F or B to trade';if(distance(state,world.bandit)<14&&!state.defeated)hint=state.mode==='foot'?'J: STAFF STRIKE · Hold K: BRACE · F: remount':'GUARD AHEAD · Stop and press F to dismount';if(distance(state,world.newsroom)<8&&state.defeated&&!state.folio)hint='H: Recover Leonardo’s stolen folio';if(preferences.touch){hint=state.mode==='foot'?'Joystick walks / Drag to look / Ride to mount':'Joystick steers / Boost to pedal / Brake to stop';if(node)hint='Stop nearby / hold Inspect to operate';if(distance(state,world.shop)<7)hint='ARTISANS / Stop, then tap Inspect to trade';if(distance(state,world.bandit)<14&&!state.defeated)hint=state.mode==='foot'?'STAFF to strike / Hold BRACE during the windup':'Guard ahead / Stop and tap Ride to dismount';if(distance(state,world.depot)<8)hint='LEONARDO / Hold Inspect to report or replenish';}set('context',hint);$('duel').hidden=state.defeated||distance(state,world.bandit)>16;$('duel-health').value=state.banditHP;$('duel-warning').textContent=state.banditPhase==='windup'?'Guard winding up — hold K to brace':'J strikes · K braces · You may retreat';$('hack').style.display=state.hackProgress>0?'block':'none';$('hack').querySelector('i').style.transform=`scaleX(${state.hackProgress})`;drawMap($('minimap'));if($('map-dialog').open)drawMap($('city-map'),true);lifeUI?.update();streetUI?.update();cityUI?.update();doorsUI?.update();consoleUI?.update();
}
function frame(now){requestAnimationFrame(frame);const dt=last?Math.min(.1,(now-last)/1000):0;last=now;pad?.poll(now,dt);const input=controls(dt);
 if(playing&&!paused&&!document.hidden){accumulator=Math.min(.18,accumulator+dt*consoleUI.timeScale());while(accumulator>=1/60){step(state,world,input,1/60);input.jump=false;jump=false;accumulator-=1/60;}if(now-lastUI>80){updateUI();lastUI=now;}save();}
 else {accumulator=0;consoleUI.update();}
 view.update(playing&&!paused?dt*consoleUI.timeScale():0,state,{consoleCamera:input.consoleCamera,steer:input.steer,look:playing&&!paused?input.look:0,lookY:playing&&!paused?input.lookY:0});look=0;
 audio.update(state,dt,{playing,paused,hidden:document.hidden,cameraYaw:view.heading()});
}
try{
 const quality=preferences.quality;view=createScene($('world'),world,state,quality);view.setDistance(preferences.distance);window.addEventListener('resize',()=>view.resize());$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('failure-detail').textContent='The graphics context was interrupted. Reload to restore the scene; completed mission progress is kept.';$('failure').hidden=false;});
 $('start').disabled=false;$('start').textContent=saved?'Continue your commission →':'Begin the first commission →';if(saved)$('resume-info').textContent='Your saved deliveries and story progress are ready.';if(!storage)$('resume-info').textContent='Storage is blocked. Play is available, but progress will not be saved.';
 Object.defineProperty(window,'LeonardoGuild',{value:Object.freeze({version:VERSION,inspect:()=>({version:VERSION,running:playing&&!paused,paused,mode:state.mode,x:state.x,z:state.z,yaw:state.yaw,speed:state.speed,lift:state.lift,steps:state.steps,mission:state.mission,relay:state.relay,completed:state.completed,deliveries:[...state.deliveries],papers:state.papers,credits:state.credits,score:state.score,health:state.health,scan:state.scan,trace:state.trace,events:state.events.map(e=>({...e})),vehicles:JSON.parse(JSON.stringify(state.vehicle)),target:{...activeTarget(state,world)},folio:state.folio,defeated:state.defeated,banditHP:state.banditHP,upgraded:state.upgraded,guarding:state.guarding,saveKey:SAVE_KEY,controller:pad.inspect(),audio:audio.inspect(),console:consoleUI.inspect(),resonance:JSON.parse(JSON.stringify(state.resonance)),doors:JSON.parse(JSON.stringify(state.doors)),cycle:JSON.parse(JSON.stringify(state.cycle)),life:JSON.parse(JSON.stringify(state.life)),city:JSON.parse(JSON.stringify(state.city)),street:JSON.parse(JSON.stringify(state.street)),attributes:stats(state),townSize:{...world.limits},input:thumb.inspect(),touchEnabled:preferences.touch,render:view.inspect()})})});
 updateUI();requestAnimationFrame(frame);
}catch(e){console.error(e);$('failure-detail').textContent=String(e.message||e);$('failure').hidden=false;$('start').textContent='Graphics unavailable';}
