"""Temporary, scope-checked assembly of the inspected Quest candidate.
Remove this tool and its workflow before merge. Actual source is committed before QA.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
marker=R/'SPATIAL-INTEGRATION.json'
if not marker.exists():
 def rep(name,old,new):
  p=R/name;s=p.read_text()
  assert s.count(old)==1,(name,'Source diverged',s.count(old))
  p.write_text(s.replace(old,new))
 rep('quest-xr.mjs',"import {createXRPanel} from './xr-panel.mjs';","import {createXRPanel} from './xr-panel.mjs';\nimport {createDioramaView} from './diorama-view.mjs';\nimport {normalizeDiorama,readDioramaPreferences,writeDioramaPreferences,sessionType,setOpening,shellOpenings} from './diorama-core.mjs';")
 rep('quest-xr.mjs','const rig=new T.Group(),camera=',"const diorama=createDioramaView();let storage=null;try{storage=globalThis.localStorage;}catch{}let preferences=readDioramaPreferences(storage),viewMode=preferences.view;\n const isDiorama=()=>viewMode!=='first-person';\n const rig=new T.Group(),camera=")
 rep('quest-xr.mjs','const status=()=>{const p=E.state().player;return ',"const status=()=>{const p=E.state().player;return (isDiorama()?(viewMode==='diorama-ar'?'AR DIORAMA':'VR DIORAMA')+' | ':'FIRST PERSON | ')+")
 rep('quest-xr.mjs','const command=(label,id)=>action(label,id,()=>E.act(id));',"""const command=(label,id)=>action(label,id,()=>E.act(id));
 function remember(next){preferences=normalizeDiorama({...preferences,...next});writeDioramaPreferences(storage,preferences);E.preferences?.(preferences);}
 function changeView(next){
  if(!['first-person','diorama-vr','diorama-ar'].includes(next))return false;
  if(active&&sessionType(next)!==sessionType(viewMode))return false;
  viewMode=next;remember({view:next});diorama.reset();calibration=null;previousHead=null;eye=null;E.pause();reset();recenter();return true;
 }
 function presentationActions(){
  const opening=shellOpenings(preferences.shell),list=[];
  if(viewMode!=='diorama-ar')list.push(action(isDiorama()?'VIEW: SWITCH TO FIRST PERSON':'VIEW: SWITCH TO VR DIORAMA','view-toggle',()=>changeView(isDiorama()?'first-person':'diorama-vr')));
  if(isDiorama())list.push(
   action('DIORAMA: TOP + FRONT OPEN','shell-both',()=>remember({shell:'both-open'})),
   action('DIORAMA: TOP OPEN / FRONT CLOSED','shell-top',()=>remember({shell:'top-open'})),
   action('DIORAMA: FRONT OPEN / TOP CLOSED','shell-front',()=>remember({shell:'front-open'})),
   action('LARGER CHARACTERS / ZOOM IN','display-larger',()=>{remember({scale:preferences.scale+.01});}),
   action('SMALLER CHARACTERS / ZOOM OUT','display-smaller',()=>{remember({scale:preferences.scale-.01});}),
   action(preferences.follow?'CONTENT FOLLOW: ON':'CONTENT FOLLOW: OFF','display-follow',()=>remember({follow:!preferences.follow})),
   action('RECENTER DIORAMA ON SURVIVOR','display-recenter',()=>recenter()));
  return list;
 }
""")
 rep('quest-xr.mjs','const panel=createXRPanel({mode:E.mode,hint:','const panel=createXRPanel({mode:E.mode,extraActions:presentationActions,hint:')
 rep('quest-xr.mjs','function bind(next){scene=next.scene;renderer=next.renderer;scene.add(rig);next.bindXR(api);calibration=null;previousHead=null;eye=null;reset();}','function bind(next){scene=next.scene;renderer=next.renderer;scene.add(rig);next.bindXR(api);diorama.reset();calibration=null;previousHead=null;eye=null;reset();}')
 rep('quest-xr.mjs','function snap(angle){turn+=angle;previousHead=null;reset();recenter();}','function snap(angle){turn+=angle;previousHead=null;reset();recenter(false);}')
 rep('quest-xr.mjs','function recenter(){if(headPose)calibration=','function recenter(replaceTable=true){if(replaceTable)diorama.reset();if(headPose)calibration=')
 rep('quest-xr.mjs',"async function enter(kind='controllers'){","async function enter(kind='controllers',requestedView=preferences.view){")
 rep('quest-xr.mjs','pending=true;preference=kind;E.audio();let candidate;','pending=true;preference=kind;viewMode=normalizeDiorama({view:requestedView}).view;remember({view:viewMode});E.audio();let candidate;')
 rep('quest-xr.mjs',"navigator.xr.requestSession('immersive-vr',kind===",'navigator.xr.requestSession(sessionType(viewMode),kind===')
 rep('quest-xr.mjs','if(disposed){await candidate.end();return false;}session=candidate;',"if(disposed){await candidate.end();return false;}if(viewMode==='diorama-ar'&&candidate.environmentBlendMode==='opaque')throw Error('This browser did not provide transparent AR. Choose VR Diorama instead.');session=candidate;")
 rep('quest-xr.mjs','active=true;rig.visible=true;calibration=null;','active=true;rig.visible=true;diorama.reset();calibration=null;')
 rep('quest-xr.mjs','function align(state,dt){if(!headPose)return;const p=state.player,h=headPose.position;','function align(state,dt){if(!headPose)return;const p=state.player,h=headPose.position;\n  if(isDiorama()){diorama.update(rig,headPose,p,turn,heightAt(p.x,p.z),dt,{...preferences,view:viewMode});return;}rig.scale.setScalar(1);')
 rep('quest-xr.mjs',"if(previousHead&&E.mode()==='play'){","if(!isDiorama()&&previousHead&&E.mode()==='play'){")
 rep('quest-xr.mjs','put(panel.mesh,playing?-.85:0,playing?-.56:-.06,playing?-1.55:-1.55);put(badge,0,playing?-.62:.89,playing?-1.80:-1.60);','put(panel.mesh,playing?(isDiorama()?-1.22:-.85):0,playing?(isDiorama()?-.25:-.56):-.06,playing?-1.55:-1.55);put(badge,0,playing?(isDiorama()?.10:-.62):.89,playing?-1.80:-1.60);')
 rep('quest-xr.mjs','caster=new T.Raycaster(origin,direction,0,8);','caster=new T.Raycaster(origin,direction,0,8*(isDiorama()?1/preferences.scale:1));')
 rep('quest-xr.mjs','visual.laser.scale.z=hit?hit.distance/4:1;','visual.laser.scale.z=hit?hit.distance/(4*(isDiorama()?1/preferences.scale:1)):1;')
 rep('quest-xr.mjs','view.yaw+=angle;recenter();sample.move=[0,0];','view.yaw+=angle;recenter(false);sample.move=[0,0];')
 rep('quest-xr.mjs','veil.material.opacity=Math.abs(localHeadY)>.65||solidAt(p.x,p.z,Math.max(.2,eye-heightAt(p.x,p.z)))?.92:0;','veil.material.opacity=!isDiorama()&&(Math.abs(localHeadY)>.65||solidAt(p.x,p.z,Math.max(.2,eye-heightAt(p.x,p.z))))?.92:0;')
 rep('quest-xr.mjs',"const api={camera,rig,bind,detach,poll,update,enter,exit,reset,recenter,isActive:()=>active,supported:async()=>{try{return !!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');}catch{return false;}},ray:()=>currentRay,aimYaw:()=>Math.atan2(-currentRay.direction.x,-currentRay.direction.z),","""const api={camera,rig,bind,detach,poll,update,enter,exit,reset,recenter,isActive:()=>active,isDiorama,changeView,
  preferences:()=>({...preferences}),setViewPreference(value){if(active)return changeView(value);viewMode=normalizeDiorama({view:value}).view;remember({view:viewMode});return true;},
  supported:async(view=preferences.view)=>{try{return !!navigator.xr&&await navigator.xr.isSessionSupported(sessionType(view));}catch{return false;}},
  render(){if(isDiorama())diorama.render(renderer,scene,camera,rig);else renderer.render(scene,camera);},
  ray:()=>currentRay,aimYaw:()=>{const d=isDiorama()&&E.aimDirection?E.aimDirection():currentRay.direction;return Math.atan2(-d.x,-d.z);},""")
 rep('quest-xr.mjs',"stats:()=>({active,pending,mode:'immersive-first-person',preference,","stats:()=>({active,pending,mode:isDiorama()?viewMode:'immersive-first-person',sessionMode:sessionType(viewMode),diorama:diorama.stats(),preference,")
 rep('quest-xr.mjs','dispose(){disposed=true;void exit();panel.dispose();','dispose(){disposed=true;void exit();panel.dispose();diorama.dispose();')
 rep('xr-panel.mjs','const focus=document.activeElement;','all.push(...(E.extraActions?.()||[]).map(a=>action(a.label,a.id,a.run)));\n  const focus=document.activeElement;')
 rep('scene.mjs','{canvas,antialias:true,alpha:false,','{canvas,antialias:true,alpha:true,')
 rep('scene.mjs','if(xr.isActive()){hero.root.visible=false;','if(xr.isActive()){hero.root.visible=!!xr.isDiorama?.();')
 rep('scene.mjs','staticCulling.update(stereoCamera,false);renderer.render(scene,xr.camera);','staticCulling.update(stereoCamera,false);xr.render();')
 rep('scene.mjs',"if(chapter.id==='natatorium'&&p.submerged){","if(chapter.id==='natatorium'&&p.submerged&&!xr.isDiorama?.()){")
 rep('scene.mjs','raycaster.far=60;const targetMeshes=state.enemies.filter(e=>e.hp>0).map(e=>enemies.get(e.id)?.root).filter(Boolean);const hits=raycaster.intersectObjects([...blockMeshes.filter(m=>!m.userData.obstacle.disabled),...targetMeshes],true);const target=hits.length?hits[0].point:rayOrigin.clone().addScaledVector(dir,60);',"""raycaster.far=xr.isActive()&&xr.isDiorama?.()?200:60;const targetMeshes=state.enemies.filter(e=>e.hp>0).map(e=>enemies.get(e.id)?.root).filter(Boolean);const hits=raycaster.intersectObjects([...blockMeshes.filter(m=>!m.userData.obstacle.disabled),...targetMeshes],true);let target=hits.length?hits[0].point:rayOrigin.clone().addScaledVector(dir,60);if(xr.isActive()&&xr.isDiorama?.()&&!hits.length){const y=heightAt(state.player.x,state.player.z)+1.1,t=(y-rayOrigin.y)/dir.y;if(Number.isFinite(t)&&t>0&&t<200)target=rayOrigin.clone().addScaledVector(dir,t);else target=new T.Vector3(state.player.x-Math.sin(state.player.yaw)*15,y,state.player.z-Math.cos(state.player.yaw)*15);}""")
 rep('app.mjs','mode:()=>mode,act,back:closePanel,audio:audioStart,',"mode:()=>mode,act,back:closePanel,audio:audioStart,aimDirection:()=>scene.aimDirection(state),preferences(value){for(const id of ['xr-view-title','xr-view-pause'])if($(id))$(id).value=value.view;},")
 rep('app.mjs',"scene.xrSupported().then(supported=>{for(const id of ['xr-start','xr-hands','xr-title','xr-title-hands'])$(id).disabled=!supported;$('xr-entry-status').textContent=$('xr-status').textContent=supported?'Immersive VR gameplay: tracked controllers or hands. Physical Quest 3 testing remains open.':'WebXR immersive VR is not available. Open in Meta Quest Browser over HTTPS; desktop play remains available.';});",'''const updateXRAvailability=async()=>{const supported=await quest.supported();for(const id of ['xr-start','xr-hands','xr-title','xr-title-hands'])$(id).disabled=!supported;$('xr-entry-status').textContent=$('xr-status').textContent=supported?'Playable XR: first person VR, third person VR diorama, or AR diorama. Controllers and hands are supported; physical Quest 3 testing remains open.':'The selected WebXR view is not available here. Choose another XR view or continue desktop play.';};
 for(const host of ['title','pause']){const label=document.createElement('label');label.textContent='XR VIEW ';const select=document.createElement('select');select.id='xr-view-'+host;for(const [value,text] of [['first-person','FIRST PERSON / VR'],['diorama-vr','THIRD PERSON / VR DIORAMA'],['diorama-ar','THIRD PERSON / AR DIORAMA']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=quest.preferences().view;select.onchange=()=>{quest.setViewPreference(select.value);void updateXRAvailability();};label.append(select);$(host).insertBefore(label,$(host).querySelector('button[id^="xr-"]'));}void updateXRAvailability();''')
 rep('world.mjs','import {NATATORIUM}',"import {applyFloodgateRecut,recutHeight} from './floodgate-recut.mjs';\nimport {NATATORIUM}")
 rep('world.mjs','export const LEVELS=Object.freeze({district:DISTRICT,','applyFloodgateRecut(DISTRICT);\nexport const LEVELS=Object.freeze({district:DISTRICT,')
 rep('world.mjs','export let CURRENT=DISTRICT;','OBSTACLES.splice(0,OBSTACLES.length,...DISTRICT.obstacles.map(o=>({...o})));GRASS.splice(0,GRASS.length,...DISTRICT.grass.map(g=>({...g})));\nexport let CURRENT=DISTRICT;')
 rep('world.mjs','export function levelHeight(id,x,z){',"export function levelHeight(id,x,z){if(id==='district')return recutHeight(x,z);")
 rep('world.mjs','export const HEIGHT={','export function syncRouteGates(completed=[]){let changed=false;for(const o of OBSTACLES)if(o.openOnTask){const disabled=completed.includes(o.openOnTask);if(o.disabled!==disabled){o.disabled=disabled;changed=true;}}if(changed)rebuildNav();return changed;}\nexport const HEIGHT={')
 rep('field-tasks.mjs','import {LEVELS,dist,obstruction,heightAt}','import {LEVELS,dist,obstruction,heightAt,syncRouteGates}')
 rep('field-tasks.mjs','s.completedTasks.push(id);','s.completedTasks.push(id);syncRouteGates(s.completedTasks);')
 rep('state.mjs','levelHeight,CURRENT,LEVELS,useLevel,syncGates,heightAt,','levelHeight,CURRENT,LEVELS,useLevel,syncGates,syncRouteGates,heightAt,')
 rep('state.mjs','s.checkpoint=c.id;s.taken=new Set(d.taken);','s.checkpoint=c.id;if(activate)syncRouteGates(s.completedTasks);s.taken=new Set(d.taken);')
 rep('district.mjs','for(const o of OBSTACLES){','for(const o of OBSTACLES){if(o.openOnTask)continue;')
 rep('scene.mjs','import {createDetailedHumans}',"import {createFloodgateRecutArt} from './floodgate-recut-art.mjs';\nimport {createDetailedHumans}")
 rep('scene.mjs','firstLight=createFirstLightArt(scene,A,chapter);','firstLight=createFirstLightArt(scene,A,chapter),recut=createFloodgateRecutArt(scene,A,chapter);')
 rep('scene.mjs','taskArt.update(state);firstLight.update(state);','taskArt.update(state);firstLight.update(state);recut.update(state);')
 rep('scene.mjs','visualStatus:()=>({aquatic:','visualStatus:()=>({recut:recut.stats(),aquatic:')
 rep('tests/reclaimed.test.mjs','Twenty-nine large-map enemies and thirty authored tasks','Twenty-nine large-map enemies and thirty-one authored tasks')
 rep('tests/reclaimed.test.mjs','n+d.tasks.length,0),30','n+d.tasks.length,0),31')
 rep('tests/reclaimed.test.mjs','assert.equal(W.CURRENT.tasks.length,2);',"assert.equal(W.CURRENT.tasks.length,id==='district'?3:2);")
 rep('tests/quest-device-mock.js','class Session extends EventTarget{constructor(){','class Session extends EventTarget{constructor(mode){')
 rep('tests/quest-device-mock.js',"this.environmentBlendMode='opaque';","this.environmentBlendMode=mode==='immersive-ar'?'alpha-blend':'opaque';")
 rep('tests/quest-device-mock.js',"mode=>mode==='immersive-vr'","mode=>mode==='immersive-vr'||mode==='immersive-ar'")
 rep('tests/quest-device-mock.js','new Session();','new Session(mode);')
 marker.write_text('{"baseline":"6947f5ff5a249cd1aaf96fd7bf951e31a2330f08","scope":"Rainward-only candidate; remove temporary assembly tooling before merge"}\n')
