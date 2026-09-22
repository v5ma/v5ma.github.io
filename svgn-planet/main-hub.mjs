import {vehicleControlCaption} from './vehicle-trigger.mjs';
import {focusMissionList} from './native-menu-focus.mjs';
import {missionCards,wardFieldStatus} from './mission-presentation.mjs';
import {mountConsoleSettings} from './console-settings.mjs';
import {controlContext} from './controller-context.mjs';
/* Main game district integration. Same document, renderer, XR session and inputs;
 * original sphere and authored metre-space district keep their own honest save ledgers. */
import * as T from './vendor/three.module.js';
import {MODES,modeInfo,modeLabel} from './spatial-modes.mjs';
import {spatialView} from './spatial-view.mjs';
import {createUnifiedXR} from './unified-xr.mjs';
import {createDistrictView} from './lantern/district-view.mjs';
import {load,save,serialize,parse,tick,action,SAVE_KEY} from './lantern/core.mjs';
import {missionOptions,drawMap,navigation} from './lantern/navigation.mjs';
import {missionGoal,trackStory,cityState} from './lantern/city.mjs';
import {watchRuntime,watchState,watchInspect} from './lantern/watch.mjs';
import {campaignState,campaignCanGlide,campaignInspect} from './lantern/campaign.mjs';
import {padState} from './controller.mjs';
import {xrInput} from './xr-input.mjs';
const VERSION='0.17.0',HUB_KEY='svgn.neighborhood-hub.v1';
export function createMainHub(hooks){
 const $=id=>document.getElementById(id),cityView=hooks.view,renderer=cityView.renderer,citySpatial=spatialView(cityView,'city');
 let ward=null,wardView=null,wardSpatial=null,wardActive=false,blocked=false,yaw=0,last=0,saveTime=0,frames=0,transfers=0,error='',pending=null,stopped=false,noticeRevision=0;
 let store;try{store=localStorage;}catch{store={getItem(){throw Error('Storage unavailable');},setItem(){throw Error('Storage unavailable');}};}
 function message(text){noticeRevision++;if(wardActive&&ward){ward.message=text;ward.messageTime=9;}else{hooks.state().toast=text;hooks.state().toastT=9;}$('toast').textContent=text;$('toast').classList.add('visible');}
 function persistWard(){if(!ward)return true;if(blocked){message('District save needs recovery. Export your run before changing district.');return false;}const r=save(ward,store);if(!r.ok){blocked=true;message(r.error);}return r.ok;}
 function close(){for(const d of document.querySelectorAll('dialog[open]'))d.close();pending=null;$('ward-confirm').hidden=true;hooks.setPaused(false);xr.clear();}
 function open(id){hooks.setPaused(true);hooks.clear();for(const d of document.querySelectorAll('dialog[open]'))d.close();const d=$(id);d.showModal();(d.querySelector('[data-pad-default]')||d.querySelector('button'))?.focus();}
 function focusMissions(){focusMissionList($('ward-missions'),$('ward-resume'));}
 function wardMenu(initial='resume'){if(!wardActive)return;$('ward-resume').setAttribute('data-pad-default','');refreshMissions();open('ward-menu');if(initial==='missions')focusMissions();}
 function openMap(){if(wardActive){drawMap($('ward-map'),ward,false);open('ward-map-dialog');}else hooks.openMap();}
 function refreshMissions(){
  if(!ward)return;const list=$('ward-missions');list.replaceChildren();for(const m of missionCards(ward)){const b=document.createElement('button');b.dataset.mission=m.id;b.dataset.missionActive=String(!!m.active);b.id='hub-mission-'+m.id.replace(':','-');b.textContent=m.title;b.title=m.detail;b.dataset.xrDetail=m.detail;b.disabled=!!m.disabled;b.onclick=()=>{message(trackStory(ward,m.id));persistWard();close();};list.append(b);}
  $('ward-status').textContent=missionGoal(ward);$('ward-ledgers').textContent=ward.credits+' chapter / '+cityState(ward).credits+' resident / '+watchState(ward).credits+' Watch / '+campaignState(ward).credits+' campaign credits';
 }
 function ensureWard(){if(ward)return;const r=load(store);ward=r.state;blocked=r.blocked;wardView=createDistrictView(hooks.canvas,renderer);wardSpatial=spatialView(wardView,'ward');}
 function switchDistrict(next,mission){
  if(next!=='city'&&next!=='lantern')throw Error('Unknown district');if(wardActive&&next==='lantern'){if(mission){message(trackStory(ward,mission));persistWard();}close();return true;}
  if(wardActive){if(!persistWard())return false;wardSpatial.end();}
  else{if(hooks.persistCity()===false){message('Original city save could not be retained. Resolve save recovery before travelling.');return false;}citySpatial.end();}
  hooks.ensureStarted();hooks.setPaused(true);hooks.clear();
  try{if(next==='lantern'){ensureWard();wardActive=true;controlContext.ward=true;if(mission)message(trackStory(ward,mission));}else{wardActive=false;controlContext.ward=controlContext.combat=controlContext.canGlide=false;}
   document.body.classList.toggle('in-lantern',wardActive);$('ward-map-shortcut').hidden=!wardActive;$('district-name').textContent=wardActive?'LANTERN WARD':'MAIN NEIGHBORHOODS';transfers++;last=0;saveTime=0;
   try{store.setItem(HUB_KEY,JSON.stringify({v:1,district:next}));}catch{}
   xr.retarget();if(xr.active)renderer.shadowMap.enabled=false;close();message(wardActive&&mission?missionGoal(ward):wardActive?'Lantern Ward. Resident stories, Night Watch and the original delivery loop are on your Missions board.':'Returned to your original city position and progress.');hooks.changed();return true;
  }catch(e){error=String(e.message||e);message('District travel could not finish: '+error);hooks.pause();return false;}
 }
 function field(name,ray){if(!wardActive)return hooks.command(name);if(!ray&&['strike','pulse','tool'].includes(name))ray={origin:{x:ward.x,y:ward.y+1.3,z:ward.z},direction:{x:-Math.sin(yaw),y:0,z:-Math.cos(yaw)}};action(ward,name,ray);persistWard();}
 function command(code,ray){const map={KeyE:'interact',KeyQ:'throw',KeyF:'ride',Space:'hop',KeyG:'bell',KeyV:'camera',KeyM:'map',KeyJ:'jobs',KeyH:'help',KeyC:'recenter',KeyL:'scan',KeyZ:'strike',KeyT:'tool-cycle',KeyU:'campaign-route',KeyR:'grapple'};const name=map[code]||code;
  if(['map','jobs','help','pause'].includes(name)){if(name==='map')openMap();else wardMenu(name==='jobs'?'missions':'resume');return;}
  if(name==='camera'){yaw=0;return;}if(name==='recenter'){yaw=0;xr.recenter();return;}
  field(name,ray);
 }
 function download(payload,name){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([payload],{type:'application/json'}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);message('Export requested. The browser controls download completion.');}
 function confirm(text,fn){pending=fn;$('ward-confirm-text').textContent=text;$('ward-confirm').hidden=false;$('ward-keep').focus();xr.clear();}
 const style=document.createElement('style');style.textContent=`body.in-lantern #hud,body.in-lantern #energy{display:none}#ward-map-shortcut{position:fixed;right:20px;top:84px}#ward-mini{width:165px;height:145px}.xr-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.xr-grid button{font-size:14px;padding:10px;min-height:44px}.hub-districts{margin:14px 0}#ward-missions{display:grid;gap:8px}dialog canvas{width:100%;height:auto}#ward-ledgers{font-size:14px}.in-xr #hud,.in-xr header,.in-xr footer,.in-xr #objective,.in-xr #ward-map-shortcut,.in-xr #touch{visibility:hidden}#welcome{max-height:88vh;overflow:auto}#ward-menu{max-height:88vh;overflow:auto}`;document.head.append(style);
 const panel=document.createElement('div');panel.innerHTML=`
 <aside id="ward-map-shortcut" hidden><button id="ward-map-open">Mission map</button><canvas id="ward-mini" width="220" height="190"></canvas></aside>
 <dialog id="ward-menu"><h2>Neighborhood Missions / Lantern Ward</h2><p id="ward-status"></p><button id="ward-resume" data-pad-default data-pad-back>Resume</button><button id="ward-map-button">Large mission map</button><button id="ward-mission-list">Choose a mission</button><button id="ward-xr">AR / VR views</button><button id="ward-controls">XR controls</button><button id="ward-city">Travel to main neighborhoods</button><p id="ward-ledgers"></p><div id="ward-missions"></div><h3>Field tools</h3><div id="ward-tools"></div><button id="ward-save">Save progress</button><button id="ward-export">Export district save</button><button id="ward-restore">Restore district backup...</button><div id="ward-confirm" hidden><p id="ward-confirm-text"></p><button id="ward-keep" data-cancel>Keep current progress</button><button id="ward-replace">Confirm replacement</button></div></dialog>
 <dialog id="ward-map-dialog" data-xr-map="1"><h2>Lantern Ward / Your next objective</h2><button id="ward-map-back" data-pad-default data-pad-back>Back to Missions</button><canvas id="ward-map" width="760" height="540"></canvas></dialog>
 <dialog id="main-map-view" data-xr-map="1"><h2>Main neighborhoods / City map</h2><p>Original city districts retain their compass and transit routes. Lantern Ward is a connected district reached through the map destination controls.</p><button id="main-map-back" data-pad-default data-pad-back>Back to destinations</button><canvas id="main-map-canvas" width="760" height="400"></canvas></dialog>
 <dialog id="xr-mode-dialog"><h2>Neighborhood Missions / AR and VR</h2><p>Every option renders the actual game in both districts. There is no theater screen. AR needs a passthrough-capable headset browser.</p><button id="xr-mode-back" data-pad-default data-pad-back>Back / resume</button><div id="xr-mode-options" class="xr-grid"></div><button id="xr-exit">Exit XR</button><button id="xr-controls">Controller settings</button><label>Opening</label><select id="xr-opening"><option value="both">Front and top open</option><option value="top">Top open</option><option value="front">Front open</option></select><label>Portal size</label><input type="range" id="xr-size" min="0.024" max="0.075" step="0.004" value="0.04"><label>Portal height</label><input type="range" id="xr-height" min="-1.2" max="-0.1" step="0.1" value="-0.9"><label>Portal distance</label><input type="range" id="xr-distance" min="1.2" max="2.8" step="0.1" value="1.55"><button id="xr-recenter">Recenter view</button></dialog>
 <dialog id="xr-controls-dialog"><h2>Direct XR controls</h2><button id="xr-controls-back" data-pad-default data-pad-back>Back / resume</button><p>Action: left stick moves, held stick click sprints. Right grip interacts; right trigger strikes or uses the aimed tool. Left trigger aims; left grip guards or brakes. A hops, B mounts, X scans, Y opens menus. Turning-stick click cycles tools. Hands: low pinch moves, ordinary pinch interacts, raised held pinch opens Menu. Release to stop.</p><label for="xr-profile">Profile</label><select id="xr-profile"><option value="action">Action</option><option value="courier">Courier</option></select><label for="xr-dominant">Dominant hand</label><select id="xr-dominant"><option value="right">Right</option><option value="left">Left</option></select><label><input type="checkbox" id="xr-swap">Swap sticks</label><label for="xr-snap">Snap turn</label><select id="xr-snap"><option value="30">30 degrees</option><option value="45">45 degrees</option></select><label><input type="checkbox" id="xr-motion">Motion strikes</label></dialog>`;
 document.body.append(panel);
 const xr=createUnifiedXR({renderer,storage:store,clear:hooks.clear,playing:hooks.playing,pause:()=>wardActive?wardMenu():hooks.pause(),resume:()=>wardActive?close():hooks.resume(),message,changed:hooks.changed,
  spatial:()=>wardActive?wardSpatial:citySpatial,state:()=>wardActive?ward:hooks.state(),yaw:()=>yaw,turn:d=>wardActive?yaw+=d:cityView.orbitBy(d),
  action:(name,ray)=>name==='pause'?(wardActive?wardMenu():hooks.pause()):field(name,ray),
  feedback:()=>wardActive?{revision:noticeRevision,scope:'lantern',text:ward.message,remaining:ward.messageTime}:{revision:noticeRevision,scope:'city',text:hooks.state().toast,remaining:hooks.state().toastT},
  hud:()=>{
   const riding=wardActive?ward.ride!=='foot':!!hooks.state().ride,controls=vehicleControlCaption(xr.consolePreferences,xr.preferences.profile,xr.preferences.dominant,riding),menu=xr.preferences.dominant==='right'?'Y':'B';
   if(wardActive){drawMap($('ward-map'),ward,false);return {title:'LANTERN WARD',...wardFieldStatus(ward,yaw),map:$('ward-map'),controls,menu};}
   return {title:'MAIN NEIGHBORHOODS',goal:$('objective-title').textContent,detail:$('objective-text').textContent,equipment:$('ride-name').textContent,map:hooks.cityMap?.(),controls,menu};
  },
  combat:()=>wardActive&&(watchState(ward).tracking||!!campaignState(ward).active),embodied:()=>wardActive&&(!!campaignState(ward).active||watchState(ward).stage===4),canGlide:()=>wardActive&&campaignCanGlide(ward),goal:()=>wardActive?missionGoal(ward):$('objective-title').textContent+' / '+$('objective-text').textContent});
 mountConsoleSettings({xr,open,back:()=>wardActive?wardMenu():hooks.resume()});
 // Pass world-space target rays through the common input path, without writing actor state.
 // field() already translates per-district commands.
 const buttons=[];function modeButtons(parent,suffix){for(const mode of MODES){const b=document.createElement('button');b.id='xr-'+mode+suffix;b.dataset.xrMode=mode;b.textContent=modeLabel(mode);b.onclick=()=>{hooks.ensureStarted();xr.enter(mode);};parent.append(b);buttons.push(b);}}
 modeButtons($('xr-mode-options'),'');const launch=document.createElement('section');launch.className='hub-districts';launch.innerHTML='<p>One game: the original city, Lantern Ward, resident stories and Night Watch.</p><button id="enter-ward">Enter Lantern Ward district</button><div id="xr-launch-options" class="xr-grid"></div>'; $('welcome').append(launch);modeButtons($('xr-launch-options'),'-launch');
 $('enter-ward').onclick=()=>switchDistrict('lantern');
 const highline=document.createElement('button');highline.id='play-highline';highline.textContent='Play Highline / taller rooftop adventure';highline.onclick=()=>switchDistrict('lantern','campaign:highline');$('enter-ward').before(highline);
 const highlinePause=highline.cloneNode(true);highlinePause.id='visit-highline';highlinePause.onclick=highline.onclick;$('pause-dialog').prepend(highlinePause);
 const cityButtons=document.createElement('div');cityButtons.innerHTML='<button id="visit-ward">Lantern Ward / resident missions</button><button id="visit-watch">Night Watch investigation</button><button id="main-xr-modes">AR / VR views</button>'; $('pause-dialog').prepend(cityButtons);
 $('visit-ward').onclick=()=>switchDistrict('lantern');$('visit-watch').onclick=()=>switchDistrict('lantern','watch');$('main-xr-modes').onclick=()=>open('xr-mode-dialog');
 const headerButton=document.createElement('button');headerButton.id='main-xr';headerButton.textContent='AR / VR';headerButton.onclick=()=>open('xr-mode-dialog');document.querySelector('header nav').append(headerButton);
 const district=document.createElement('option');district.value='lantern';district.textContent='Lantern Ward / resident stories and Night Watch';$('district-select').append(district);
 const transit=$('transit').onclick;$('transit').onclick=e=>{$('district-select').value==='lantern'?switchDistrict('lantern'):transit?.(e);};
 // Lantern Ward has a separate honest coordinate system, not a phantom planet waypoint.
 const setWaypoint=$('set-waypoint').onclick,chooseDistrict=$('district-select').onchange,waypointLabel=$('set-waypoint').textContent;
 $('set-waypoint').onclick=e=>$('district-select').value==='lantern'?switchDistrict('lantern'):setWaypoint?.(e);
 $('district-select').onchange=e=>{chooseDistrict?.(e);const isWard=e.target.value==='lantern';$('set-waypoint').textContent=isWard?'Enter Lantern Ward district':waypointLabel;if(isWard)$('district-detail').textContent='Lantern Ward: resident stories and Night Watch. Enter in the same game and XR session; your original city position and progress stay here.';};
 const mapViewButton=document.createElement('button');mapViewButton.id='main-show-map';mapViewButton.textContent='View city map';$('map-close').after(mapViewButton);
 mapViewButton.onclick=()=>{const source=$('map'),dest=$('main-map-canvas');dest.width=source.width;dest.height=source.height;dest.getContext('2d').drawImage(source,0,0);open('main-map-view');};$('main-map-back').onclick=()=>open('map-dialog');

 $('ward-mission-list').onclick=focusMissions;
 $('ward-city').onclick=()=>switchDistrict('city');$('ward-resume').onclick=close;$('ward-map-open').onclick=$('ward-map-button').onclick=openMap;$('ward-map-back').onclick=wardMenu;
 $('ward-xr').onclick=()=>open('xr-mode-dialog');$('ward-controls').onclick=$('xr-controls').onclick=()=>open('xr-controls-dialog');
 $('xr-mode-back').onclick=$('xr-controls-back').onclick=()=>wardActive?wardMenu():hooks.resume();$('xr-exit').onclick=()=>xr.exit();$('xr-recenter').onclick=()=>xr.recenter();
 $('xr-opening').onchange=e=>{citySpatial.setOpening(e.target.value);wardSpatial?.setOpening(e.target.value);};
 for(const [id,key]of [['xr-size','scale'],['xr-height','height'],['xr-distance','distance']])$(id).oninput=e=>{xr.settings[key]=Number(e.target.value);};
 for(const [id,key]of [['xr-profile','profile'],['xr-dominant','dominant'],['xr-swap','swapSticks'],['xr-snap','snap'],['xr-motion','motionPunch']]){const el=$(id);if(el.type==='checkbox')el.checked=xr.preferences[key];else el.value=xr.preferences[key];el.onchange=()=>xr.preference(key,el.type==='checkbox'?el.checked:key==='snap'?Number(el.value):el.value);}
 for(const [label,name]of [['Scan','scan'],['Grapple','grapple'],['Pulse','pulse'],['Smoke','smoke'],['Cape rig','holster-cape'],['Change Watch approach','watch-route'],['Change campaign approach','campaign-route'],['Recover after setback','watch-recover']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{close();field(name);};$('ward-tools').append(b);}
 $('ward-save').onclick=()=>{if(persistWard())message('District progress saved.');};$('ward-export').onclick=()=>download(JSON.stringify(serialize(ward)),'Neighborhood-Missions-Lantern-Ward.json');
 $('ward-restore').onclick=()=>{try{const text=store.getItem(SAVE_KEY+'.backup');if(!text)throw Error('No backup available');const restored=parse(text);confirm('Replace only Lantern Ward progress with the verified backup? Original city progress is not changed.',()=>{ward=restored;blocked=false;persistWard();close();});}catch(e){message(e.message);}};
 $('ward-keep').onclick=()=>{pending=null;$('ward-confirm').hidden=true;$('ward-resume').focus();};$('ward-replace').onclick=()=>{const fn=pending;pending=null;fn?.();};
 for(const id of ['ward-menu','ward-map-dialog','main-map-view','xr-mode-dialog','xr-controls-dialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();if(pending)$('ward-keep').click();else wardActive?close():hooks.resume();});
 for(const b of buttons)b.disabled=true;
 cityView.artReady.then(()=>{for(const b of buttons)b.disabled=false;});
 // A controller action is dispatched by the original poller. This hook only adds
 // domain-specific actions; existing A/X/Y/trigger mappings remain intact.
 function tickWard(now,frame){
  const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;frames++;xr.update(now,frame);if(!wardActive){last=0;return;}wardSpatial.restore();
  if(hooks.playing()){
   controlContext.combat=ward.ride==='foot'&&(watchState(ward).tracking||!!campaignState(ward).active);controlContext.canGlide=campaignCanGlide(ward);
   const k=hooks.keys(),stick=hooks.stick(),x=padState.x+xrInput.x+stick[0]+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),f=padState.y+xrInput.y+stick[1]+Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown'));
   if(padState.lookX&&!xr.active)yaw-=padState.lookX*dt*2;
   let forward=f,boost=padState.boost||xrInput.boost||hooks.boost()||k.has('ShiftLeft')||k.has('ShiftRight');if(boost&&Math.hypot(x,forward)<.01)forward=1;
   const input={x:x*Math.cos(yaw)-forward*Math.sin(yaw),z:-x*Math.sin(yaw)-forward*Math.cos(yaw),boost,brake:padState.brake||xrInput.brake||hooks.braking(),guard:!!xrInput.guard||padState.guard||k.has('KeyX'),glide:!!xrInput.glide||padState.glide||k.has('KeyK')};
   for(let t=dt;t>1e-7;t-=1/60)tick(ward,input,Math.min(t,1/60));if(ward.time-saveTime>5){persistWard();saveTime=ward.time;}
  }
  wardView.update(ward,dt,{mode:'third',yaw,started:true});if(xr.active)xr.present();else renderer.render(wardView.scene,wardView.camera);
  if(frames%6===0){$('district-name').textContent='LANTERN WARD';$('objective-title').textContent=missionGoal(ward);const n=navigation(ward,yaw);$('objective-text').textContent=Math.ceil(n.distance)+' m / '+n.level+' / Map shows your selected objective';$('waypoint-arrow').style.transform='rotate('+n.angle+'rad)';$('toast').textContent=ward.messageTime>0?ward.message:'';$('context').textContent='X interact | A hop | Y mount | D-pad down missions';drawMap($('ward-mini'),ward,true);}
 }
 Object.defineProperty(window,'NeighborhoodMissions',{value:Object.freeze({inspect:()=>({version:VERSION,district:wardActive?'lantern':'city',transfers,frames,rendererCount:1,sessionPreservedAcrossDistricts:true,ward:ward?JSON.parse(JSON.stringify(ward)):null,watch:ward?watchInspect(ward):null,campaign:ward?campaignInspect(ward):null,blocked,failed:!!error,error,paused:!hooks.playing(),xr:xr.inspect(),modes:[...MODES],spatial:(wardActive?wardSpatial:citySpatial).inspect()}),panel:()=>xr.panelPose()})});
 return {xr,get wardActive(){return wardActive;},persist:persistWard,command,switchDistrict,wardMenu,frameWard:tickWard,openMap,
  prepareCity(){citySpatial.restore();}};
}
