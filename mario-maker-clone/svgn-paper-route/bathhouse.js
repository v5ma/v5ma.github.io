/* A playable destination in the existing campaign and a controller-safe portal atlas. */
import {BUILD,ID,RAIL,STORE,SPEC,VALVE,DRAIN_TICKS,make,fresh,operate,canOperate,observe,sanitize,settle,status} from './bathhouse-core.mjs';
import * as Art from './bathhouse-art.js';
const prior=GroundCampaign,catalog=DeliveryCampaign,index=catalog.routes.length,groundIndex=prior.specs.length;
const build=(i,T)=>i===index?make(T):catalog.build(i,T),makeGround=(n,T)=>n===groundIndex?make(T):prior.make(n,T);
const data=make(__gameRefs.T),{cells,ct,...info}=data;
SkyRoutes.specs.push({...info});SkyRoutes.build=build;
window.DeliveryCampaign=Object.freeze({...catalog,build,routes:[...catalog.routes,info]});
// Ground navigation holds this array by reference. Append, never renumber old routes.
if(!prior.order.includes(index))prior.order.push(index);
window.GroundCampaign=Object.freeze({...prior,make:makeGround,build,specs:[...prior.specs,SPEC]});
const here=()=>mode==='play'&&!!window.__ground?.meta?.bathhouse;
const active=()=>here()&&!won&&!__delivery.paused&&!__delivery.state.menu&&!document.hidden;
const authored=()=>here()&&__delivery.state.route===index&&__delivery.state.code===levelCode();
let run=null,record=sanitize(null),saveOK=true,allRails=null,lastHeld=false,travelPending=false;
try{record=sanitize(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{saveOK=false;}
const hook=(name,wrap)=>{const old=window[name];if(typeof old==='function')window[name]=wrap(old);};
function syncRails(){if(!here()||!allRails)return;tracks=run?.drain===DRAIN_TICKS?allRails:allRails.filter(t=>t.sky?.id!==RAIL);}
hook('loadCode',old=>function(...args){const ok=old.apply(this,args);if(ok){run=null;allRails=null;}return ok;});
hook('startPlay',old=>function(...args){const result=old.apply(this,args);run=here()?fresh():null;if(!here())allRails=null;else if(!allRails)allRails=tracks.slice();syncRails();lastHeld=true;return result;});
hook('spawnWorld',old=>function(...args){const keep=routeKeep,previous=run,result=old.apply(this,args);if(here()){run=keep&&previous?previous:fresh();allRails=tracks.slice();syncRails();lastHeld=true;}return result;});
hook('respawn',old=>function(...args){if(run&&!run.finished){run.incidents++;run.lastS=null;}return old.apply(this,args);});
function useNearby(){
 if(active()&&canOperate(run,player)){operate(run,player);return;}
 if(mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu&&__delivery.state.route===4&&Math.abs(player.x-250)<145){showAtlas();}
}
window.addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&!document.querySelector('dialog[open]')){useNearby();}},true);
hook('stepPlayer',old=>function(...args){const before=run,result=old.apply(this,args);
 const held=!!keys.ArrowDown;if(held&&!lastHeld&&!document.querySelector('dialog[open]'))useNearby();lastHeld=held;
 if(run===before&&active()){const opening=run.drain<DRAIN_TICKS;observe(run,{x:player.x,dead:player.dead>0,rail:player.track?.sky?.id,s:player.trackS});if(opening&&run.drain===DRAIN_TICKS)syncRails();}
 return result;
});
hook('win',old=>function(...args){const was=won,result=old.apply(this,args);if(!was&&won&&run&&authored()){
 const reward=settle(record,run,true);if(reward.banked){record=reward.record;try{localStorage.setItem(STORE,JSON.stringify(record));saveOK=true;}catch{saveOK=false;}
 const area=document.querySelector('#delivery-results .delivery-result-actions');if(area){const p=document.createElement('p');p.className='sc-earned';p.textContent=(reward.fresh?'BATHHOUSE KEEPER: New seal earned. ':'Tideglass Baths complete. ')+(saveOK?'Visit saved on this device.':'Saving unavailable; session only.');area.prepend(p);}}
 }return result;
});
// New art only replaces GroundArt for this document; other routes keep their art.
const oldArt=GroundArt.populate;GroundArt.populate=function(args){if(args.course.gp?.bathhouse)return Art.populate(args);oldArt(args);
 if(args.course.id==='first-neighborhood'||args.course.gp?.sunrise){const gy=-args.course.ground*36;args.metal.torus(250,gy+87,-75,55,'#85e0cd');args.sign('TIDEGLASS PORTAL\nE / D-PAD DOWN',250,gy+207,-75,224,54);}
};
const oldNetworkArt=SkyNetworkArt.populate;window.SkyNetworkArt=Object.freeze({...SkyNetworkArt,populate(args){if(!args.course.gp?.bathhouse)oldNetworkArt(args);}});
const sceneBuild=SkyVisual.build;SkyVisual.build=function(m){const root=sceneBuild(m);if(here()){
 m.scene.fog=new m.THREE.Fog('#344d54',1600,4200);m.renderer.setClearColor('#142c35',1);
 for(const o of root.children){if(o.renderOrder===-100||o.count===80)o.visible=false;if(o.isDirectionalLight)o.intensity*=.57;if(o.isAmbientLight)o.intensity=.65;}
 }return root;
};
const sceneUpdate=SkyVisual.update;SkyVisual.update=function(...args){const r=sceneUpdate.apply(this,args);if(here()){Art.update(run,__ground.state.steps,!matchMedia('(prefers-reduced-motion: reduce)').matches&&window.Prismatic?.settings.motion!==false);const b=__cloudview.root.children.find(o=>o.children?.some(c=>c.material?.map)&&o.position.z===-700);if(b)b.visible=false;}return r;};
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./bathhouse.css',import.meta.url);document.head.append(style);
const atlas=document.createElement('dialog');atlas.id='bathhouse-atlas';atlas.setAttribute('aria-labelledby','bathhouse-atlas-title');atlas.innerHTML='<header><div><small>SKY CYCLE / PORTAL DESTINATIONS</small><h2 id="bathhouse-atlas-title">Tideglass Baths</h2></div><button id="bathhouse-close" class="delivery-btn">Back</button></header><div class="bathhouse-poster" aria-hidden="true"><span>TIDEGLASS</span><i>THE WATER DESTINATION</i></div><p>Ride the dry promenade through a vaulted, tiled bathhouse. Open the brass sluice wheel to lower Mirror Pool and reveal an optional waterline rail.</p><p id="bathhouse-record" role="status"></p><p id="bathhouse-departure">Entering starts a new route run. Banked medals, discoveries and saved Workshop drafts stay intact. Unfinished route progress is not banked by traveling.</p><div class="bathhouse-actions"><button id="bathhouse-enter" class="delivery-btn">Enter Tideglass Baths</button><button id="bathhouse-return" class="delivery-btn">Start Sunrise Borough</button></div><p>E or D-pad Down operates the nearby sluice. Space or A jumps. The dry road always reaches the exit portal. B closes this window.</p>';
document.body.append(atlas);let resumeOwned=false,focusReturn=null;
function showAtlas(){if(atlas.open)return;focusReturn=document.activeElement;resumeOwned=mode==='play'&&!won&&!__delivery.paused&&!__delivery.state.menu;if(resumeOwned)__delivery.act('pause');
 const dirty=!!window.RouteWorkshop?.state.dirty;document.getElementById('bathhouse-enter').disabled=dirty;document.getElementById('bathhouse-return').disabled=dirty;
 document.getElementById('bathhouse-departure').textContent=dirty?'Save or export the unsaved Workshop draft before traveling.':'Entering starts a new route run. Banked medals, discoveries and saved drafts stay intact. Unfinished route progress is not banked by traveling.';
 document.getElementById('bathhouse-record').textContent=(record.visits?record.visits+' completed visits. ':'Your first visit awaits. ')+(record.keeper?'Bathhouse Keeper seal earned. ':'Open the sluice, ride the waterline, then finish to earn the optional Keeper seal.')+(saveOK?'':' Saving is unavailable; session only.');atlas.showModal();document.getElementById('bathhouse-close').focus();}
function invalidate(){resumeOwned=false;}window.addEventListener('blur',invalidate);window.addEventListener('gamepaddisconnected',invalidate);document.addEventListener('visibilitychange',()=>{if(document.hidden)invalidate();});
atlas.addEventListener('cancel',e=>{e.preventDefault();atlas.close();});atlas.addEventListener('close',()=>{if(resumeOwned&&!travelPending&&!document.hidden&&mode==='play'&&!won&&!document.querySelector('dialog[open]'))__delivery.act('resume');resumeOwned=false;if(!travelPending&&focusReturn?.isConnected)focusReturn.focus({preventScroll:true});});
document.getElementById('bathhouse-close').onclick=()=>atlas.close();
function travel(i){if(window.RouteWorkshop?.state.dirty||PaperDeliveryCampaign.status!=='ready')return;travelPending=true;resumeOwned=false;for(const d of document.querySelectorAll('dialog[open]'))d.close();__delivery.startRoute(i);setTimeout(()=>{travelPending=false;cv.focus({preventScroll:true});},0);}
document.getElementById('bathhouse-enter').onclick=()=>travel(index);document.getElementById('bathhouse-return').onclick=()=>travel(4);
function button(selector,id){const host=document.querySelector(selector);if(!host||document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='Water portal';b.setAttribute('aria-haspopup','dialog');b.onclick=showAtlas;host.append(b);}
function mounts(){button('#delivery-header .actions','bathhouse-open');button('#flight-deck .fd-actions','bathhouse-deck');button('#delivery-pause .delivery-pause-card','bathhouse-pause');button('#delivery-menu .delivery-hero','bathhouse-menu');}
const prompt=document.createElement('button');prompt.id='bathhouse-use';prompt.className='delivery-btn';prompt.hidden=true;prompt.onclick=useNearby;document.getElementById('stagewrap').append(prompt);
const objective=document.createElement('p');objective.id='bathhouse-objective';objective.setAttribute('role','status');objective.hidden=true;document.getElementById('stagewrap').append(objective);
let lastPaint=0,lastText='';function ui(t){requestAnimationFrame(ui);if(t-lastPaint<160)return;lastPaint=t;mounts();const visible=mode==='play'&&!won&&!__delivery.state.menu&&!__delivery.paused&&!document.querySelector('dialog[open]');
 const valve=visible&&here()&&canOperate(run,player),entry=visible&&__delivery.state.route===4&&Math.abs(player.x-250)<145;
 prompt.hidden=!valve&&!entry;prompt.textContent=valve?'E / D-pad Down: Open sluice':'E / D-pad Down: Water portal';objective.hidden=!visible||!here();if(here()){const text=status(run);if(text!==lastText){lastText=text;objective.textContent=text;}}
}requestAnimationFrame(ui);
if(__delivery.state.menu)__delivery.showMenu();
window.SkyCycleBathhouse=Object.freeze({build:BUILD,id:ID,index,show:showAtlas,get state(){return run?{...run}:null;},get records(){return {...record};},get saveOK(){return saveOK;},get art(){return Art.stats();}});
// Direct playable destination link, resolved only after campaign and input are ready.
if(new URLSearchParams(location.search).get('destination')===ID){let n=0;const timer=setInterval(()=>{if(++n>1200){clearInterval(timer);return;}if(window.PaperDeliveryCampaign?.status==='ready'&&window.SkyCycleFlightDeck&&window.__gpuReady){clearInterval(timer);travel(index);}},50);}
window.Bathhouse2D={draw(g,cx,cy,w,h){Art.draw2D(g,cx,cy,w,h,run,matchMedia('(prefers-reduced-motion: reduce)').matches?0:__ground.state.steps);}};
// A slightly elevated scenic camera reveals the pools without changing the physics plane.
const oldCamera=CloudDepthCamera.forFrame;CloudDepthCamera.forFrame=function(o,v){const camera=oldCamera(o,v);if(here()&&camera.isPerspectiveCamera){const x=player.x+110,y=-player.y+90;camera.position.set(x+180,y+280,850);camera.lookAt(x,y,0);camera.fov=Math.atan(640/2/914)*360/Math.PI;camera.updateProjectionMatrix();camera.updateMatrixWorld();}return camera;};
