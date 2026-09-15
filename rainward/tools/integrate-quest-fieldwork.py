"""Scoped patch for the inspected Clear Water baseline. Never run on divergent code."""
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1]
marker=R/'QUEST-INTEGRATION.json'
if marker.exists():
 assert json.loads((R/'release.json').read_text())['version']=='0.14.0'
 sys.exit(0)
def replace(name,old,new):
 p=R/name;s=p.read_text()
 if old in s:
  assert s.count(old)==1,(name,'ambiguous match');p.write_text(s.replace(old,new))
 else:assert new in s,(name,'baseline diverged')
replace('app.mjs',"import {createAquaticUI}","import {createQuestXR} from './quest-xr.mjs';\nimport {createAquaticUI}")
replace('app.mjs',"scene=null,mode='title'","scene=null,quest=null,mode='title'")
replace('app.mjs','function clearInput(){sprintLatched=false;','function clearInput(){quest?.reset();sprintLatched=false;')
replace('app.mjs',"function makeScene(){return createScene(canvas,{onXRStart:()=>setMode('xr'),onXREnd:error=>{setMode('pause');if(error)$('xr-status').textContent='VR could not start: '+error.message;}});}","function makeScene(sharedRenderer=null){return createScene(canvas,{sharedRenderer});}")
replace('app.mjs','function configureScene(){scene.setRainworn','function configureScene(){quest?.bind(scene);scene.setRainworn')
replace('app.mjs','scene?.dispose();scene=makeScene();configureScene();','const retainedRenderer=scene?.renderer;quest?.detach();scene?.dispose(true);scene=makeScene(retainedRenderer);configureScene();')
replace('app.mjs',"if(action==='reload')reload(state);","if(action==='swapGun')selectEquipment(state,p.gun==='rifle'?'pistol':'rifle');if(action==='reload')reload(state);")
replace('app.mjs',"if(action==='melee')melee(state);","if(action==='melee'){if(quest?.isActive())p.yaw=quest.aimYaw();melee(state);}")
replace('app.mjs',"$('xr-start').onclick=()=>void scene?.enterXR();","$('xr-start').onclick=()=>void quest?.enter('controllers');")
replace('app.mjs','function tick(now){','function tick(now,xrFrame){')
replace('app.mjs','pad=gamepad.sample(navigator.getGamepads?.(),settings.deadzone/100,settings.controlPreset);$(\'device\')',"const immersive=quest?.isActive();pad=immersive?quest.poll(state,view,dt,xrFrame):gamepad.sample(navigator.getGamepads?.(),settings.deadzone/100,settings.controlPreset);$('device')")
replace('app.mjs',"break;}view.yaw-=(pad.look", "break;}if(!immersive){view.yaw-=(pad.look")
replace('app.mjs',"(keys.has('ArrowDown')?1:0))*dt));}else if(mode!=='xr')", "(keys.has('ArrowDown')?1:0))*dt));}}else if(mode!=='xr')")
replace('app.mjs','aim:view.aim,yaw:view.yaw,listen:','aim:view.aim,yaw:immersive&&view.aim?quest.aimYaw():view.yaw,listen:')
replace('app.mjs','(settings.toggleSprint?sprintLatched:pad.sprint)}:', '(pad.sprintDirect?pad.sprint:settings.toggleSprint?sprintLatched:pad.sprint)}:')
replace('app.mjs','try{scene=makeScene();configureScene();resize();','''try{scene=makeScene();quest=createQuestXR({state:()=>state,view:()=>view,mode:()=>mode,act,back:closePanel,audio:audioStart,
 pause(){if(mode==='play'||mode==='pack')setMode('pause');},
 start(){clearInput();scene.setQuality(settings.low);},
 end(error){clearInput();if(started)setMode('pause');else setMode('title');scene?.setQuality(settings.low);resize();if(error)$('xr-status').textContent='XR could not start: '+error.message;},
 isHeld:el=>settings.controlPreset==='survival'&&['craft-med','craft-smoke'].includes(el.id),
 hold(el,on){touch.craftHeld=on;if(on&&el)beginCrafting(state,el.id==='craft-med'?'medkit':'smoke');}
 });configureScene();resize();''')
replace('app.mjs',"scene.xrSupported().then(supported=>{$('xr-start').disabled=!supported;$('xr-status').textContent=supported?'Experimental stationary overlook. Mission pauses; trigger cycles views, grip exits.':'WebXR immersive VR is not available in this browser. Desktop play remains available.';});", """for(const [id,kind,host,label]of [['xr-title','controllers','title','PLAY IN XR / CONTROLLERS'],['xr-title-hands','hands','title','PLAY IN XR / HAND TRACKING'],['xr-hands','hands','pause','ENTER XR / HAND TRACKING']]){const b=document.createElement('button');b.id=id;b.textContent=label;b.disabled=true;b.onclick=()=>void quest.enter(kind);$(host).append(b);}scene.xrSupported().then(supported=>{for(const id of ['xr-start','xr-hands','xr-title','xr-title-hands'])$(id).disabled=!supported;$('xr-status').textContent=supported?'Immersive VR gameplay: tracked controllers or hands. Physical Quest 3 testing remains open.':'WebXR immersive VR is unavailable. Open in Meta Quest Browser over HTTPS; desktop play remains available.';});""")
replace('scene.mjs',"import {createXRPreview} from './xr-preview.mjs';\n",'')
replace('scene.mjs','export function createScene(canvas,{onXRStart=()=>{},onXREnd=()=>{}}={}){','export function createScene(canvas,{sharedRenderer=null}={}){')
replace('scene.mjs','const renderer=new T.WebGLRenderer','const renderer=sharedRenderer||new T.WebGLRenderer')
replace('scene.mjs',"let requestedLow=false,cinemaEnabled=true,dead=false;const xr=createXRPreview(renderer,scene,chapter,{heightAt,onStart(){graphics.set(true);onXRStart();},onEnd(error){if(dead)return;graphics.set(requestedLow);onXREnd(error);}});scans.start();", "let requestedLow=false,cinemaEnabled=true,dead=false;let xr={isActive:()=>false,stats:()=>({active:false,mode:'immersive-first-person',hardwareVerified:false})};scans.start();")
replace('scene.mjs',"if(xr.isActive()){staticCulling.restore();scans.restoreInstances();renderer.render(scene,xr.camera);}","if(xr.isActive()){hero.root.visible=false;xr.update(state,view,dt);staticCulling.restore();scans.restoreInstances();renderer.render(scene,xr.camera);}")
replace('scene.mjs','const center=new T.Vector3(0,0,.5).unproject(camera),dir=center.sub(camera.position).normalize();raycaster.set(camera.position,dir);',"const center=new T.Vector3(0,0,.5).unproject(camera),xrRay=xr.isActive()?xr.ray():null,rayOrigin=xrRay?.origin||camera.position,dir=xrRay?.direction||center.sub(camera.position).normalize();raycaster.set(rayOrigin,dir);")
replace('scene.mjs','camera.position.clone().addScaledVector(dir,60)','rayOrigin.clone().addScaledVector(dir,60)')
replace('scene.mjs','function resize(w,h){renderer.setSize(w,h,false);','function resize(w,h){if(xr.isActive())return;renderer.setSize(w,h,false);')
replace('scene.mjs','function dispose(){dead=true;','function dispose(keepRenderer=false){dead=true;')
replace('scene.mjs','renderer.setAnimationLoop(null);xr.dispose();','renderer.setAnimationLoop(null);')
replace('scene.mjs','environment.dispose();renderer.dispose();','environment.dispose();if(!keepRenderer)renderer.dispose();')
replace('scene.mjs','return {xrSupported:()=>xr.supported(),','return {bindXR(adapter){xr=adapter;},xrSupported:()=>xr.supported(),')
replace('scene.mjs',"setQuality(low){requestedLow=!!low;humans.set(humanEnabled,low);rainFilm.set(filmEnabled,low);graphics.set(xr.isActive()?true:low);cinema.set(cinemaEnabled,low);}","setQuality(low){requestedLow=!!low;humans.set(humanEnabled,xr.isActive()?true:low);rainFilm.set(filmEnabled,xr.isActive()?true:low);graphics.set(xr.isActive()?true:low);cinema.set(cinemaEnabled,low);}")
replace('scene.mjs','renderer.info.autoReset=false;renderer.setPixelRatio(', 'renderer.info.autoReset=false;if(!renderer.xr.isPresenting)renderer.setPixelRatio(')
replace('graphics.mjs','renderer.setPixelRatio(reduced?', 'if(!renderer.xr?.isPresenting)renderer.setPixelRatio(reduced?')
replace('index.html','ENTER VR OVERLOOK · EXPERIMENTAL','ENTER XR / CONTROLLERS')
replace('index.html','VR overlook is a stationary preview, not VR combat or locomotion. Physical Quest testing remains open.','XR supports immersive first-person play with tracked controllers or hands. Physical Quest testing remains open.')
replace('quest-xr.mjs','sample=emptyXR();break;}','sample=emptyXR();return sample;}')
for f in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
 p=R/f;p.write_text(p.read_text().replace('0.13.1','0.14.0'))
p=R/'release.json';release=json.loads(p.read_text());release.update(version='0.14.0',build='rainward-quest-fieldwork-20260915',xr='experimental-playable-first-person-controllers-and-hands',changes=['Add immersive first-person WebXR gameplay across the existing seven expeditions','Map Quest tracked-controller triggers, grips, sticks and all four face buttons without consuming system buttons','Add joint-rendered hand tracking, pinch locomotion, ray-selected field actions and native-menu mirroring','Preserve sessions across chapter/retry scene rebuilds, pause on tracking loss and require neutral input after transitions','Retain desktop/Xbox controls, finite combat and crafting, all saves and the existing art and sound library']);p.write_text(json.dumps(release,indent=2)+'\n')
p=R/'production-plan.json';plan=json.loads(p.read_text());plan.update(release='0.14.0',edition='Quest Fieldwork',updated='2026-09-15');plan['nextRelease']=['RW-063','RW-056','RW-035','RW-036'];plan['references']=[r for r in plan['references'] if r['url']!='QUEST-FIELDWORK.md'];plan['references'].insert(0,{'title':'Quest Fieldwork XR controls and acceptance','url':'QUEST-FIELDWORK.md'});plan['continuation']['xr']={'ownerRequest':'Quest 3 playable XR with tracked controllers, each button considered, and a hand-tracking version.','implementation':'QUEST-FIELDWORK.md','status':'Implemented','physicalHardware':'Not tested','deferred':'Native packaging and multiplayer remain separate; the unfinished motion upgrade is not claimed shipped.'};plan['continuation']['scope']='Quest Fieldwork adds playable immersive VR. Read QUEST-FIELDWORK.md and current release evidence; older Clear Water/Undertow records are retained historical baselines.'
for t in plan['items']:
 if t['id']=='RW-063':t.update(status='Implemented',evidence='QUEST-FIELDWORK.md',resumeNote='The owner explicitly selected full Quest 3 XR gameplay as the next upgrade. Tracked-controller and hand adapters, immersive menus and source/fixture acceptance are implemented; physical Quest review remains open.',nextAction='Run physical Quest 3 controller and hand journeys, including all chapters, save/retry, tracking loss, comfort and performance. Native packaging and multiplayer are not approved.')
p.write_text(json.dumps(plan,indent=2)+'\n')
p=R/'tests/handoff.test.mjs';p.write_text(p.read_text().replace("t.status==='Implemented').length,22","t.status==='Implemented').length,23"))
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
for name in ['README.md','CONTROLLER.md','DEVELOPMENT-HANDOFF.md']:
 p=R/name;s=p.read_text()
 prefix='# Current release / Quest Fieldwork v0.14.0\n\nThe owner selected playable Quest 3 XR as the next upgrade. Read [QUEST-FIELDWORK.md](QUEST-FIELDWORK.md) for entry, every tracked-controller button, hand pinch locomotion, immersive menus, and exact evidence boundaries. This replaces the paused overlook; it does not claim that unfinished character-motion work shipped. Existing desktop/Xbox play and all seven chapter saves are retained. Physical Quest 3 comfort, tracking and performance review remain open.\n\nThe following earlier notes are retained historical context; their stationary-XR scope does not describe this release.\n\n'
 if not s.startswith('# Current release / Quest Fieldwork'):p.write_text(prefix+s)
marker.write_text(json.dumps({'baseline':'9a55d133dc7737de04a2601c100c5f8ec263a5fd','release':'0.14.0','scope':'Rainward-only reviewed patch; remove temporary integration tooling before merge'},indent=2)+'\n')
