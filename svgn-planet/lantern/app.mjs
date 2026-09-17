import {missionGoal,storyTarget,trackStory,residents,cityState} from './city.mjs';
import {drawMap,missionOptions,navigation} from './navigation.mjs';
import {VERSION,SAVE_KEY,fresh,parse,save,load,serialize,action,tick,nearby,goal,say,complete,actors,clamp} from './core.mjs';
import {marketCue,marketStatus} from './market.mjs';
import {createView} from './view.mjs';
import {createXR} from './xr.mjs';
import {gameplayInputIsNeutral} from '../controller-neutral.mjs';
const $=id=>document.getElementById(id),keys=new Set(),held=new Set();
let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('Browser storage is unavailable');},setItem(){throw Error('Browser storage is unavailable');}};}
const restored=load(storage);let state=restored.state,blocked=restored.blocked,started=false,paused=true,yaw=0,viewMode='third',last=0,saveAt=0,frameCount=0,failed=false,controllerReady=false,padWas=null,previous=[],menuWas=null,repeatAt=0,repeat='',messageVersion='';
let view,xr,confirmation=null,pendingAction=null;const uiTouches={x:0,y:0,boost:false,brake:false};
function clear(){keys.clear();held.clear();uiTouches.x=uiTouches.y=0;uiTouches.boost=uiTouches.brake=false;controllerReady=false;}
function tell(text){say(state,text);$('notice').textContent=text;}
function persist(){if(!started||blocked)return false;const r=save(state,storage);if(!r.ok){blocked=true;tell('Save blocked: '+r.error+'. Existing progress is retained; export this run from Menu.');}return r.ok;}
function pause(value=true){paused=value;clear();if(value)missionBoard();if(value&&started){if(!$('menu').open)$('menu').showModal();$('resume').focus();}else if($('menu').open)$('menu').close();}
function command(name){if(!started||paused||failed)return;if(name==='pause'||name==='map'||name==='jobs'){pause(true);if(name!=='pause'){$('route-map').hidden=false;missionBoard();if(xr?.active)xr.openMissions();else $('mission-list').querySelector('.active:not(:disabled),button:not(:disabled)')?.focus();}return;}if(name==='camera'){if(xr?.active){xr.setMode(xr.mode==='first'?'diorama':'first');return;}viewMode=viewMode==='third'?'first':'third';$('view-mode').value=viewMode;clear();return;}if(name==='recenter'){yaw=0;return;}action(state,name);persist();}
function start(){started=true;document.body.classList.add('playing');$('welcome').hidden=true;pause(false);persist();tell(blocked?'Storage needs attention. Your original save is untouched; use Menu to export or restore.':'The workshop is beyond the blue door. Pick up your parcel, then choose your route.');}
function confirm(text,fn){pendingAction=fn;$('confirm-text').textContent=text;$('confirm').hidden=false;$('keep').focus();controllerReady=false;}
$('start').onclick=start;$('resume').onclick=()=>pause(false);$('menu-button').onclick=()=>pause(true);$('map-button').onclick=()=>command('jobs');
$('keep').onclick=()=>{pendingAction=null;$('confirm').hidden=true;$('resume').focus();};$('replace').onclick=()=>{const fn=pendingAction;pendingAction=null;$('confirm').hidden=true;fn?.();};
$('menu').addEventListener('cancel',e=>{e.preventDefault();if(pendingAction)$('keep').click();else pause(false);});
$('view-mode').onchange=e=>{viewMode=e.target.value;clear();};$('opening').onchange=e=>view.setOpening(e.target.value);
$('save').onclick=()=>tell(persist()?'Chapter saved. The original neighborhood save has not been changed.':'Save unavailable. Export a copy of your current progress.');
function exportText(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export').onclick=()=>exportText(JSON.stringify(serialize(state),null,2),'lantern-ward-save.json');
$('export-original').onclick=()=>{try{exportText(storage.getItem(SAVE_KEY)||'null','lantern-ward-original.json');}catch(e){tell(e.message);}};
$('restore').onclick=()=>confirm('Restore the chapter backup? Your current chapter data will be retained separately. Original neighborhood saves are never touched.',()=>{
 try{const raw=storage.getItem(SAVE_KEY+'.backup');if(!raw)throw Error('No chapter backup exists.');const next=parse(raw),old=storage.getItem(SAVE_KEY);if(old)storage.setItem(SAVE_KEY+'.before-restore',old);storage.setItem(SAVE_KEY,raw);state=next;blocked=false;tell('Chapter backup restored.');}catch(e){tell(e.message);}
});
$('restart').onclick=()=>confirm('Start Lantern Ward again? Its current data will be archived. Original delivery routes, credits and saves remain separate and unchanged.',()=>{
 try{const raw=storage.getItem(SAVE_KEY);if(raw)storage.setItem(SAVE_KEY+'.before-reset',raw);storage.removeItem(SAVE_KEY);state=fresh();blocked=false;persist();tell('A fresh chapter is ready. The earlier chapter is retained in its before-reset copy.');}catch(e){tell(e.message);}
});
$('map-toggle').onclick=()=>{$('route-map').hidden=!$('route-map').hidden;missionBoard();};
function root(){return $('menu').open?$('menu'):!$('welcome').hidden?$('welcome'):null;}
function elements(el){return [...el.querySelectorAll('button,select,input,a[href]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length);}
function adjust(e,dir){if(e.tagName==='SELECT'){e.selectedIndex=(e.selectedIndex+dir+e.options.length)%e.options.length;e.dispatchEvent(new Event('change'));return true;}if(e.type==='range'){e.value=clamp(Number(e.value)+Number(e.step||1)*dir,Number(e.min),Number(e.max));e.dispatchEvent(new Event('input'));return true;}return false;}
function menuInput(pad,b,edge,now){
 const el=root(),items=elements(el),focus=document.activeElement;
 if(!items.includes(focus))items[0]?.focus();
 const d=b[12]||pad.axes[1]<-.65?'up':b[13]||pad.axes[1]>.65?'down':b[14]||pad.axes[0]<-.65?'left':b[15]||pad.axes[0]>.65?'right':'';
 if(d&&(d!==repeat||now>repeatAt)){const delta=d==='up'||d==='left'?-1:1;if(!(['left','right'].includes(d)&&adjust(focus,delta)))items[(Math.max(0,items.indexOf(focus))+delta+items.length)%items.length]?.focus();document.activeElement?.scrollIntoView({block:'nearest'});repeatAt=now+(d===repeat?150:380);}repeat=d;
 if(edge(0)){if(!adjust(document.activeElement,1))document.activeElement?.click();}
 if(edge(1)||edge(9)){if(pendingAction)$('keep').click();else if(started)pause(false);}
 if(Math.abs(pad.axes[3]||0)>.25)el.scrollTop+=(pad.axes[3]||0)*15;
}
function poll(now,dt){
 let pads=[];try{pads=[...(navigator.getGamepads?.()||[])].filter(p=>p?.connected&&p.mapping==='standard');}catch{}
 const pad=pads.find(p=>p.buttons.some(b=>b.pressed)||p.axes.some(v=>Math.abs(v)>.3))||pads.find(p=>p.index===padWas?.index)||pads[0];
 if(!pad){if(padWas&&started)pause(true);padWas=null;return {x:0,y:0,boost:false,brake:false};}
 if(padWas?.index!==pad.index){controllerReady=false;previous=[];}padWas=pad;
 const b=pad.buttons.map(v=>v.pressed||v.value>.55),edge=i=>b[i]&&!previous[i],r=root();
 if(r!==menuWas){menuWas=r;repeat='';controllerReady=false;}
 if(xr.active&&paused){if(!controllerReady){if(gameplayInputIsNeutral(pad))controllerReady=true;previous=b;return {x:0,y:0};}let d=edge(12)?-2:edge(13)?2:edge(14)?-1:edge(15)?1:0;xr.navigate(d,edge(0),edge(1)||edge(9));previous=b;return {x:0,y:0};}
 if(r){menuInput(pad,b,edge,now);previous=b;return {x:0,y:0};}
 if(!controllerReady){if(!gameplayInputIsNeutral(pad)){previous=b;return {x:0,y:0};}controllerReady=true;}
 if(xr.active){const snap=Math.abs(pad.axes[2]||0)>.65;if(snap&&!poll.snap)yaw-=Math.sign(pad.axes[2])*Math.PI/6;poll.snap=snap;}else if(Math.abs(pad.axes[2]||0)>.16)yaw-=(pad.axes[2]||0)*dt*2.1;
 for(const [i,name]of Object.entries({0:'hop',2:'interact',3:'ride',4:'throw',5:'camera',8:'map',9:'pause',10:'bell',11:'recenter',12:'map',13:'jobs'}))if(edge(i))command(name);
 previous=b;const dead=v=>Math.abs(v||0)<=.16?0:v;
 return {x:dead(pad.axes[0]),y:-dead(pad.axes[1]),boost:(pad.buttons[7]?.value||0)>.2,brake:(pad.buttons[6]?.value||0)>.2||b[1]};
}
addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)&&root())return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(pendingAction)$('keep').click();else if(started)pause(!paused);return;}
 if(e.repeat)return;keys.add(e.code);
 if(e.code==='Enter'&&!started){start();return;}
 const names={Space:'hop',KeyE:'interact',KeyF:'ride',KeyQ:'throw',KeyC:'camera',KeyM:'map',KeyJ:'jobs',KeyL:'bell',KeyR:'recenter'};if(names[e.code])command(names[e.code]);
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{if(started&&!xr?.active)pause(true);else clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();pause(true);}});addEventListener('pagehide',persist);
let dragging=false,previousX=0;
$('world').addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){dragging=true;previousX=e.clientX;$('world').setPointerCapture(e.pointerId);}});
$('world').addEventListener('pointermove',e=>{if(dragging&&!paused&&!xr?.active){yaw-=(e.clientX-previousX)*.006;previousX=e.clientX;}});$('world').addEventListener('pointerup',()=>dragging=false);
for(const b of document.querySelectorAll('[data-hold]')){
 const release=()=>held.delete(b.dataset.hold);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.hold);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=release;
}
for(const b of document.querySelectorAll('[data-action]'))b.onclick=()=>command(b.dataset.action);
let boardSignature='';
function track(id){tell(trackStory(state,id));persist();boardSignature='';missionBoard();}
function missionBoard(){const board=$('mission-list');if(!board)return;const options=missionOptions(state),signature=JSON.stringify(options);if(signature===boardSignature)return;boardSignature=signature;board.replaceChildren();
 for(const m of options){const button=document.createElement('button');button.className='mission-card'+(m.active?' active':'');button.disabled=!!m.disabled;button.dataset.mission=m.id;const title=document.createElement('strong');title.textContent=(m.active?'TRACKING: ':'')+m.title;const detail=document.createElement('small');detail.textContent=m.detail;button.append(title,detail);button.onclick=()=>{track(m.id);pause(false);};board.append(button);}
}
function map(){drawMap($('map-canvas'),state);}

try{
 view=createView($('world'));xr=createXR(view,{clear,pause,paused:()=>paused,action:command,save:persist,goal:()=>state.messageTime>0?state.message:missionGoal(state),missions:()=>missionOptions(state).filter(m=>!m.disabled),map:canvas=>drawMap(canvas,state),track,message:tell,yaw:()=>yaw,turn:a=>{yaw+=a;clear();}});
 for(const [id,mode]of[['vr-first','first-person-vr'],['vr-diorama','diorama-vr'],['ar-diorama','diorama-ar'],['ar-first','first-person-ar']])$(id).onclick=()=>{if(!started)start();xr.enter(mode);};
 for(const id of ['vr-first','vr-diorama','ar-diorama','ar-first'])$(id).disabled=true;
 if(navigator.xr&&isSecureContext)for(const [kind,ids]of[['immersive-vr',['vr-first','vr-diorama']],['immersive-ar',['ar-diorama','ar-first']]])navigator.xr.isSessionSupported(kind).then(ok=>ids.forEach(id=>$(id).disabled=!ok)).catch(()=>{});
 $('xr-help').textContent=navigator.xr?'Choose a supported session explicitly. Physical Quest 3 comfort and performance still need testing.':'XR requires a compatible headset browser over HTTPS. Desktop and Xbox play are available here.';
 $('stand-scale').oninput=e=>{xr.settings.scale=Number(e.target.value);clear();};$('stand-height').oninput=e=>{xr.settings.height=Number(e.target.value);clear();};$('stand-distance').oninput=e=>{xr.settings.distance=Number(e.target.value);clear();};
 if(blocked)tell(restored.error);try{if(storage.getItem('svgn.paper-delivery-3d.v1')){$('legacy-status').textContent='Your original neighborhood save is available unchanged.';}}catch{}
 $('start').disabled=false;$('loading').hidden=true;
 const snapshot=()=>({version:VERSION,state:JSON.parse(JSON.stringify(state)),started,paused,failed,blockedSave:blocked,controllerReady,gamepadConnected:!!padWas,yaw,mode:xr.active?xr.mode:viewMode,frames:frameCount,view:view.inspect(),xr:xr.inspect(),quay:marketStatus(state),basis:{right:[Math.cos(yaw),-Math.sin(yaw)],forward:[-Math.sin(yaw),-Math.cos(yaw)]},nearby:nearby(state)?.id||null,goal:missionGoal(state),navigation:navigation(state,yaw),missions:missionOptions(state)});
 Object.defineProperty(window,'LanternWard',{value:Object.freeze({inspect:snapshot,panel:()=>xr.panelPose()})});
 rendererStart();
 function rendererStart(){view.renderer.setAnimationLoop((now,frame)=>{
  if(failed)return;try{
   const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;frameCount++;
   let p=poll(now,dt),xi=xr.update(now,frame,state);
   if(xr.active&&(!padWas||(Math.hypot(p.x||0,p.y||0)<.01&&!p.boost&&!p.brake)))p=xi;
   if(started&&!paused){
    let x=clamp((p.x||0)+(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+(held.has('right')?1:0)-(held.has('left')?1:0),-1,1),y=clamp((p.y||0)+(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+(held.has('forward')?1:0)-(held.has('back')?1:0),-1,1);
    if(keys.has('ArrowLeft'))yaw+=dt*1.6;if(keys.has('ArrowRight'))yaw-=dt*1.6;
    const boosting=p.boost||keys.has('ShiftLeft')||keys.has('ShiftRight')||held.has('boost');if(boosting&&Math.hypot(x,y)<.01)y=1;
    const movementYaw=xr.active?xr.movementYaw:yaw,input={x:x*Math.cos(movementYaw)-y*Math.sin(movementYaw),z:-x*Math.sin(movementYaw)-y*Math.cos(movementYaw),boost:boosting,brake:p.brake||held.has('brake')};
    if(xr.active&&view.curtain.visible){input.x=input.z=0;input.brake=true;}
    for(let remaining=dt;remaining>1e-6;remaining-=1/60)tick(state,input,Math.min(remaining,1/60));
    if(state.time-saveAt>5){persist();saveAt=state.time;}
   }
   view.update(state,dt,{mode:xr.active?xr.mode:viewMode,yaw,started});
   // update() sets the actor pose; XR transforms are reapplied without advancing simulation.
   if(xr.active){xr.present(state);const a=xr.inspect();if(a.kind.endsWith('-ar'))view.scene.background=null;}
   view.renderer.render(view.scene,view.camera);
   if(frameCount%6===0){$('goal').textContent=missionGoal(state);const nav=navigation(state,yaw);$('nav-distance').textContent=nav.target?Math.ceil(nav.distance)+' m / '+nav.level:'Choose a resident story';$('nav-arrow').style.transform='rotate('+nav.angle+'rad)';drawMap($('mini-map'),state,true);const f=nearby(state),t=storyTarget(state),r=residents.find(r=>Math.hypot(state.x-r.x,state.z-r.z,state.y-r.y)<1.9);$('context').textContent=t&&Math.hypot(state.x-t.x,state.y-t.y,state.z-t.z)<1.9?'X / '+t.label:r?'X / Meet '+r.name:f?f.id.startsWith('dock')?'Y / '+f.label:'X / '+f.label:marketCue(state)||'X interact   A hop   Y mount   LB throw';$('place').textContent=state.y>2?'UPPER DELIVERY ROUTE':state.y<-.3?'LANTERN CANAL':state.x>3?'WORKSHOP QUARTER':'DEPOT & MARKET';$('credits').textContent=state.credits+' chapter + '+cityState(state).credits+' resident credits';$('notice').textContent=state.messageTime>0?state.message:'';if(!$('route-map').hidden)map();}
  }catch(e){failed=true;pause(true);$('error').hidden=false;$('error').textContent='Chapter paused after an error. Your saved progress has not been cleared. '+e.message;console.error(e);}
 });}
 $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();persist();pause(true);tell('Graphics interrupted. Progress retained. Reload to resume the chapter.');});
}catch(e){$('error').hidden=false;$('error').textContent='Could not start the 3D chapter: '+e.message+'. Original neighborhood remains available below.';$('loading').hidden=true;console.error(e);}
