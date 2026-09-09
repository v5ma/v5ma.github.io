import {createFrameClock} from './frame-clock.mjs';
import {CURRENT,LEVELS,VERSION,OBSTACLES,GRASS,ITEMS,SHELTERS,EXIT,BOUNDS,HEIGHT,dist,coverAt} from './world.mjs';
import {createGame,update,stance,interactable,interact,craft,heal,smoke,reload,bottle,fire,dodgeOrVault,checkpoint,restore,forward,RECIPES} from './model.mjs';
import {createScene} from './scene.mjs';
import {GamepadInput} from './input.mjs';
import {createHUD} from './hud.mjs';
import {bindControls} from './controls.mjs';
import {createStealthUI} from './stealth-ui.mjs';
import {createAudio} from './audio.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),SAVE='svgn.rainward.v1.checkpoint',SETTINGS='svgn.rainward.v1.settings';
const frameClock=createFrameClock();
let state=createGame(),scene=null,mode='title',keys=new Set(),controls=null,last=0,eventSeq=0,frame=0,gamepad=new GamepadInput(),pad={};
const view={yaw:0,pitch:-.09,aim:false,snap:true,shoulder:1},touch={x:0,z:0,aim:false,fire:false,listen:false};let settings={mute:false,low:false,sensitivity:85,scanned:true,cinematic:true,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches};
const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};const write=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
try{const d=JSON.parse(read(SETTINGS)||'null');if(d){settings.mute=!!d.mute;settings.low=!!d.low;settings.scanned=d.scanned!==false;settings.cinematic=d.cinematic!==false;settings.motion=d.motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;settings.sensitivity=Math.max(30,Math.min(170,Number(d.sensitivity)||85));}}catch{}
const audio=createAudio(settings,()=>mode),audioStart=()=>audio.start(),sound=e=>audio.event(e);
function clearInput(){keys.clear();Object.assign(touch,{x:0,z:0,aim:false,fire:false,listen:false});controls?.clear();gamepad.reset();}
function setMode(next){frameClock.reset();mode=next;clearInput();for(const id of['title','pause','map-panel','pack','result','fatal'])$(id).hidden=true;
 const panel=next==='map'?'map-panel':next==='dead'||next==='won'?'result':next; if($(panel))$(panel).hidden=false;
 $('hud').hidden=!['play','pack'].includes(next);$('touch').hidden=next!=='play'||!(matchMedia('(pointer:coarse)').matches||innerWidth<760);
 if(next!=='play'&&document.pointerLockElement)document.exitPointerLock();if(next==='map'){ui.drawMap();ui.hud();}if(next==='pause')setTimeout(()=>$('resume').focus(),0);if(next==='play')canvas.focus({preventScroll:true});audioStart();
}
function makeScene(){return createScene(canvas,{onXRStart:()=>setMode('xr'),onXREnd:error=>{setMode('pause');if(error)$('xr-status').textContent='VR could not start: '+error.message;}});}
function configureScene(){scene.setQuality(settings.low);scene.setScanned(settings.scanned);scene.setCinematic(settings.cinematic);scene.setMotion(settings.motion);scene.renderer.setAnimationLoop(tick);last=0;frameClock.reset();}
function start(fresh=false){const old=restore(read(SAVE),false);const chapter=$('chapter-select').value;if(fresh&&old&&mode==='title'&&!confirm('Start a new expedition? Your current Rainward checkpoint will be replaced.'))return;state=!fresh&&old?restore(read(SAVE)):createGame(chapter);scene?.dispose();scene=makeScene();configureScene();resize();eventSeq=0;view.yaw=0;view.pitch=-.09;view.snap=true;view.shoulder=1;if(fresh)write(SAVE,checkpoint(state));setMode('play');}
function save(){if(!write(SAVE,checkpoint(state))){state.hint='Storage is unavailable. Keep this tab open to retain progress.';state.hintTime=5;}syncTitle();}
function syncTitle(){$('continue').hidden=!restore(read(SAVE),false);}
function closePanel(){if(['pause','map','pack'].includes(mode))setMode('play');}
function act(action){if(action==='pause'){if(mode==='play'||mode==='pack')setMode('pause');else closePanel();return;}if(action==='map'||action==='pack'){if(mode==='play')setMode(action);else if(mode===action)setMode('play');return;}
 if(mode!=='play')return;const p=state.player;
 if(action==='crouch')stance(state,p.stance==='crouch'?'stand':'crouch');if(action==='prone')stance(state,p.stance==='prone'?'stand':'prone');
 if(action==='interact'){const target=interactable(state);if(interact(state)&&target?.kind==='shelter')save();}
 if(action==='shoulder'){view.shoulder*=-1;state.hint='Camera: '+(view.shoulder<0?'left':'right')+' shoulder';state.hintTime=2;}
 if(action==='reload')reload(state);if(action==='bottle')bottle(state,view.yaw);if(action==='heal')heal(state);if(action==='smoke')smoke(state);
 if(action==='dodge'){const v=motion();dodgeOrVault(state,v.x,v.z);}
}
function motion(){let x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touch.x+(pad.move?.[0]||0),y=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-touch.z-(pad.move?.[1]||0),l=Math.max(1,Math.hypot(x,y));x/=l;y/=l;const f=forward(view.yaw);return {x:Math.cos(view.yaw)*x+f.x*y,z:-Math.sin(view.yaw)*x+f.z*y};}
const stealth=createStealthUI($('hud'));
const ui=createHUD({get state(){return state},get mode(){return mode},get pad(){return pad},get scene(){return scene},view,setMode,closePanel});
controls=bindControls({get mode(){return mode},keys,view,touch,canvas,act,setMode,settings,clearInput});
$('chapter-cycle').onclick=()=>{const select=$('chapter-select');select.selectedIndex=(select.selectedIndex+1)%select.options.length;$('chapter-cycle').textContent='CHAPTER '+(select.selectedIndex+1)+' SELECTED · NEXT →';};
$('start').onclick=()=>start(true);$('continue').onclick=()=>start(false);$('resume').onclick=()=>setMode('play');$('retry').onclick=()=>start(false);$('to-title').onclick=()=>{setMode('title');syncTitle();};$('result-retry').onclick=()=>start(false);$('result-new').onclick=()=>start(true);$('result-next').onclick=()=>{const names=Object.keys(LEVELS),i=names.indexOf(state.level);if(i>=0&&i+1<names.length){$('chapter-select').value=names[i+1];start(true);}};$('map-button').onclick=()=>act('map');$('pack-button').onclick=()=>act('pack');$('map-close').onclick=closePanel;$('pack-close').onclick=closePanel;$('help-button').onclick=()=>{if(mode==='title'){$('title').hidden=true;mode='pause';$('pause').hidden=false;}else act('pause');};
$('craft-med').onclick=()=>{craft(state,'medkit');ui.hud();};$('craft-smoke').onclick=()=>{craft(state,'smoke');ui.hud();};
$('xr-start').onclick=()=>void scene?.enterXR();
for(const id of ['muted','low','sensitivity','scanned','cinematic','motion']){const el=$(id);if(id==='sensitivity')el.value=settings.sensitivity;else el.checked=settings[id==='muted'?'mute':id];el.oninput=()=>{settings[id==='muted'?'mute':id]=id==='sensitivity'?Number(el.value):el.checked;write(SETTINGS,JSON.stringify(settings));scene?.setQuality(settings.low);scene?.setScanned(settings.scanned);scene?.setCinematic(settings.cinematic);scene?.setMotion(settings.motion);resize();audioStart();};}
function tick(now){if(!scene)return;const elapsed=Math.max(0,(now-(last||now))/1000),dt=Math.min(.25,elapsed);last=now;
 pad=gamepad.sample(navigator.getGamepads?.());$('device').textContent=pad.connected?'STANDARD GAMEPAD':'KEYBOARD + MOUSE';if(pad.disconnected&&(mode==='play'||mode==='pack'))setMode('pause');
 if(mode==='play'){for(const action of pad.actions)act(action);view.yaw-=(pad.look?.[0]||0)*dt*2.3;view.pitch=Math.max(-.7,Math.min(.6,view.pitch-(pad.look?.[1]||0)*dt*1.7));view.yaw+=((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.6;view.pitch=Math.max(-.7,Math.min(.6,view.pitch+((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt));}else if(mode!=='xr')ui.menuPad(dt);
 view.aim=mode==='play'&&(keys.has('Aim')||touch.aim||pad.aim);const moving=motion();const input=mode==='play'?{...moving,aim:view.aim,yaw:view.yaw,listen:keys.has('KeyQ')||pad.listen||touch.listen,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||pad.sprint}:{x:0,z:0};
 if(mode==='play'||mode==='pack'){frameClock.advance(elapsed,step=>{update(state,input,step);if(mode==='play'&&(keys.has('Fire')||keys.has('KeyF')||pad.fire||touch.fire))fire(state,scene.aimDirection(state));return state.status==='playing';});if(state.status!=='playing')ui.endScreen();}else frameClock.reset();
 scene.render(state,view,dt);view.snap=false;for(const event of state.events)if(event.seq>eventSeq){eventSeq=event.seq;sound(event);}if(++frame%3===0){ui.hud();stealth.update(state,view,mode);$('asset-status').textContent=scene.assetStatus().message;}
}
function resize(){scene?.resize(innerWidth,innerHeight);$('touch').hidden=mode!=='play'||!(matchMedia('(pointer:coarse)').matches||innerWidth<760);}
try{scene=makeScene();configureScene();resize();syncTitle();$('loading').textContent='';$('start').focus();window.Rainward={get state(){return state},get mode(){return mode},get view(){return {...view}},get renderer(){return scene.renderer},get chapter(){return CURRENT.id},project:(x,y,z)=>scene.project(x,y,z),snapshot:()=>({version:VERSION,level:state.level,puzzle:state.puzzle,drops:state.drops,mode,player:{...state.player},objectives:{...state.objectives},stats:{...state.stats},taken:[...state.taken],enemies:state.enemies.map(e=>({id:e.id,x:e.x,z:e.z,state:e.state,hp:e.hp,awareness:e.awareness,target:e.target})),events:state.events.map(e=>({...e})),camera:scene.cameraState(),assets:scene.assetStatus(),visuals:scene.visualStatus(),xr:scene.xrStatus(),clock:frameClock.stats(),renderer:scene.stats()})};scene.xrSupported().then(supported=>{$('xr-start').disabled=!supported;$('xr-status').textContent=supported?'Experimental stationary overlook. Mission pauses; trigger cycles views, grip exits.':'WebXR immersive VR is not available in this browser. Desktop play remains available.';});window.addEventListener('resize',resize);}catch(error){$('fatal-message').textContent=String(error.message||error);setMode('fatal');console.error(error);}
