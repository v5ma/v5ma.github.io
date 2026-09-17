"""Scoped integration before acceptance; remove transport helper before merge."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'source drift',old[:90],s.count(old));p.write_text(s.replace(old,new))
patch('world-aperture.mjs',"PORTAL_BUILD='ranger-portal-20260917.1'","PORTAL_BUILD='rainward-freefield-20260917.1'")
patch('diorama-core.mjs',"['first-person','diorama-vr','diorama-ar']", "['first-person','first-person-ar','diorama-vr','diorama-ar']")
patch('diorama-core.mjs',"view==='diorama-ar'?'immersive-ar'", "view.endsWith('-ar')?'immersive-ar'")
patch('quest-xr.mjs',"import {createDioramaView} from './diorama-view.mjs';", "import {createWorldPortal} from './portal-view.mjs';\nimport {createDirectXRInput} from './direct-xr-input.mjs';\nimport {createXRWeapons} from './xr-weapons.mjs';\nimport {previewBlink} from './blink.mjs';")
patch('quest-xr.mjs','const diorama=createDioramaView();','const diorama=createWorldPortal();')
patch('quest-xr.mjs',"const isDiorama=()=>viewMode!=='first-person';", "const isDiorama=()=>viewMode.startsWith('diorama');")
patch('quest-xr.mjs','let scene=null,renderer=null,session=null,', 'let renderContext=null,scene=null,renderer=null,session=null,')
patch('quest-xr.mjs',"turn=0,slow=true,handFire=false,", "turn=0,slow=E.freefield?.freeStride===false,handBlink=false,handFire=false,")
patch('quest-xr.mjs',"const input=createXRInput(),rays={};let sample=emptyXR();", "const oldInput=createXRInput(),directInput=createDirectXRInput(),currentInput=()=>E.freefield?.xrLayout==='legacy'?oldInput:directInput;const input={reset(){oldInput.reset();directInput.reset();},sample:(...args)=>currentInput().sample(...args),isArmed:()=>currentInput().isArmed()},rays={};let sample=emptyXR();")
patch('quest-xr.mjs',"if(!['first-person','diorama-vr','diorama-ar'].includes(next))", "if(!['first-person','first-person-ar','diorama-vr','diorama-ar'].includes(next))")
patch('quest-xr.mjs',"if(viewMode!=='diorama-ar')list.push", "if(!viewMode.endsWith('-ar'))list.push")
patch('quest-xr.mjs',"action(preferences.follow?'CONTENT FOLLOW: ON':'CONTENT FOLLOW: OFF','display-follow',()=>remember({follow:!preferences.follow})),", "action('CHARACTER-CENTERED WORLD / AUTOMATIC','display-follow',()=>remember({follow:true})),")
patch('quest-xr.mjs',"const panel=createXRPanel({mode:E.mode,extraActions:presentationActions,", """const panel=createXRPanel({mode:E.mode,shortcutActions:()=>E.mode()==='pause'&&!E.freefield?.pinnedXR?[
   action('SATCHEL / CRAFT','pack',()=>{E.back();E.act('pack');}),action('MAP / NEXT GOAL','map',()=>{E.back();E.act('map');}),
   action(handFire?'HAND FIRE: ON':'HAND FIRE: OFF','hand-fire',()=>{handFire=!handFire;handBlink=false;E.back();}),
   action(handBlink?'HAND BLINK: ON':'HAND BLINK: OFF','hand-blink',()=>{handBlink=!handBlink;handFire=false;E.back();}),
   action(handSprint?'HAND RUN: ON':'HAND RUN: OFF','hand-sprint',()=>{handSprint=!handSprint;E.back();}),
   action('DIVE / SURFACE / CROUCH','crouch',()=>{E.back();E.act('crouch');}),
   action('JUMP / SURFACE','traverse',()=>{E.back();E.act('traverse');}),
   action('RELOAD','reload',()=>{E.back();E.act('reload');})]:[],extraActions:presentationActions,""")
patch('quest-xr.mjs',"const visuals={};for(const side", "const weapons=createXRWeapons();const blinkMarker=new T.Mesh(new T.RingGeometry(.25,.36,32),new T.MeshBasicMaterial({color:0x94d4b7,side:T.DoubleSide}));blinkMarker.rotation.x=-Math.PI/2;blinkMarker.visible=false;\n const visuals={};for(const side")
patch('quest-xr.mjs',"body.rotation.x=-.3;grip.add(body);rig.add(grip);", "body.rotation.x=-.3;if(side==='right')grip.add(weapons.root);else body.visible=false;rig.add(grip);")
patch('quest-xr.mjs',"function bind(next){scene=next.scene;renderer=next.renderer;scene.add(rig);", "function bind(next){renderContext=next;scene=next.scene;renderer=next.renderer;scene.add(rig,blinkMarker);")
patch('quest-xr.mjs',"function detach(){rig.removeFromParent();scene=null;}", "function detach(){rig.removeFromParent();blinkMarker.removeFromParent();scene=null;}")
patch('quest-xr.mjs',"rig.visible=false;safe=false;input.reset();", "rig.visible=false;blinkMarker.visible=false;safe=false;input.reset();")
patch('quest-xr.mjs',"viewMode==='diorama-ar'&&candidate.environmentBlendMode", "viewMode.endsWith('-ar')&&candidate.environmentBlendMode")
patch('quest-xr.mjs',"handFire=false;handListen=false;handSprint=false;reset();", "handFire=false;handBlink=false;handListen=false;handSprint=false;reset();")
patch('quest-xr.mjs',"instructions:()=>instructions,reset,", "instructions:()=>E.freefield?.xrLayout==='legacy'?instructions:'A or right grip interacts. B reloads. Right trigger fires; left trigger aims. X crouches (hold for prone) or dives/surfaces in water. Y jumps on land; hold Y to swim faster. Left stick moves; click toggles run. Left grip previews blink; release commits. Right stick snap-turns; click pauses. Gameplay buttons may be remapped in settings; menu A/B and pause remain reserved. Raise an open left palm to open menus. Hands: left pinch moves; right pinch uses the selected USE, FIRE or BLINK mode. Open menus only when needed. The wrist display appears when you look at it.',reset,")
patch('quest-xr.mjs',"0,8*(isDiorama()?1/preferences.scale:1)","0,8")
patch('quest-xr.mjs',"hit.distance/(4*(isDiorama()?1/preferences.scale:1))", "hit.distance/4")
patch('quest-xr.mjs',"view.yaw=Math.atan2(-hd.x,-hd.z);view.pitch=", "view.yaw=Math.atan2(-hd.x,-hd.z)-(isDiorama()?diorama.heading():0);view.pitch=")
patch('quest-xr.mjs',"const hits=caster.intersectObjects([panel.mesh,badge],false);", "const hits=caster.intersectObjects([panel.mesh,badge].filter(o=>o.visible),false);")
patch('quest-xr.mjs',"key:E.mode()+':'+layout,handFire}", "key:E.mode()+':'+layout,handFire,handBlink,water:state.player.waterMode==='swim',mapping:E.buttonRemaps?.xr}")
patch('quest-xr.mjs',"if(safe){currentRay=rays.right||{origin:camera.getWorldPosition(V()),direction:hd};}else sample.fire=false;", "if(safe){const raw=rays.right||{origin:camera.getWorldPosition(V()),direction:hd};const mapped=isDiorama()?diorama.gameRay(raw):raw;if(mapped)currentRay=mapped;else{sample.fire=false;sample.actions=sample.actions.filter(a=>a!=='blink');}}else sample.fire=false;\n  blinkMarker.visible=!!sample.blinkHeld&&E.mode()==='play'&&E.freefield?.blink!==false;if(blinkMarker.visible){const target=previewBlink(state,currentRay.direction);blinkMarker.position.set(target.point.x,target.point.y+.035,target.point.z);blinkMarker.material.color.setHex(target.valid?0x94d4b7:0xc88376);}")
patch('quest-xr.mjs',"function update(state,view,dt){if(active){align(state,dt);if(stamp!==layout){stamp=layout;placePanels();}panel.collect();}}", "function update(state,view,dt){if(active){align(state,dt);if(stamp!==layout){stamp=layout;placePanels();}updatePresentation(state);if(panel.mesh.visible)panel.collect();}}")
patch('quest-xr.mjs',"render(){if(isDiorama())diorama.render(renderer,scene,camera,rig);else renderer.render(scene,camera);}", "render(){if(isDiorama())diorama.render(renderer,scene,camera,rig);else if(viewMode==='first-person-ar')renderContext.renderAR(camera,E.state());else renderer.render(scene,camera);}")
patch('quest-xr.mjs',"mode:isDiorama()?viewMode:'immersive-first-person',", "mode:isDiorama()||viewMode==='first-person-ar'?viewMode:'immersive-first-person',menuVisible:panel.mesh.visible,wristVisible:badge.visible,weapon:weapons.stats(),handBlink,")
patch('quest-xr.mjs',"panel.dispose();diorama.dispose();rig.removeFromParent();", "panel.dispose();weapons.dispose();blinkMarker.removeFromParent();blinkMarker.geometry.dispose();blinkMarker.material.dispose();diorama.dispose();rig.removeFromParent();")
patch('quest-xr.mjs'," function poll(state,view,dt,frame){", """ function updatePresentation(state){
  const playing=E.mode()==='play',pinned=!!E.freefield?.pinnedXR;
  panel.mesh.visible=!playing||pinned;badge.visible=!playing||pinned;
  if(playing&&!pinned&&headPose){const left=visuals.left.grip.visible?visuals.left.grip:visuals.left.group;
   badge.scale.setScalar(.20);badge.position.copy(left.position).add(new T.Vector3(0,.09,0));
   const toHead=new T.Vector3().copy(headPose.position).sub(badge.position);badge.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),toHead.clone().normalize());
   const look=new T.Vector3(0,0,-1).applyQuaternion(headPose.orientation),toWrist=toHead.clone().negate().normalize();badge.visible=look.dot(toWrist)>.93;
  }else badge.scale.setScalar(1);
  for(const visual of Object.values(visuals)){visual.laser.visible=!playing||pinned;visual.cursor.visible=visual.cursor.visible&&panel.mesh.visible;}
  weapons.update(state.player,{visible:playing&&safe});
 }
 function poll(state,view,dt,frame){""")
patch('quest-xr.mjs',"stamp=layout;placePanels();}panel.collect();", "stamp=layout;placePanels();}updatePresentation(state);if(panel.mesh.visible)panel.collect();")
patch('quest-xr.mjs',"visual.group.position.copy(rayPose.transform.position);", "if(src.hand){visual.grip.position.copy(rayPose.transform.position);visual.grip.quaternion.copy(rayPose.transform.orientation);visual.grip.visible=side==='right';}\n   visual.group.position.copy(rayPose.transform.position);")
patch('quest-xr.mjs',"if(cycle%8===0)drawBadge();return sample;", "updatePresentation(state);if(cycle%8===0)drawBadge();return sample;")
patch('xr-panel.mjs',"all.push(...(E.extraActions?.()||[])", "all.unshift(...(E.shortcutActions?.()||[]).map(a=>action(a.label,a.id,a.run)));\n  all.push(...(E.extraActions?.()||[])")
patch('scene.mjs',"import {createFreightCutArt}", "import {renderWaistAR} from './waist-ar.mjs';\nimport {createFreightCutArt}")
patch('scene.mjs',"const itemMeshes=new Map();", "const arEnvironment=new Set(scene.children.filter(o=>!o.isCamera&&!o.isLight));\n const itemMeshes=new Map();")
patch('scene.mjs',"scans.cull(stereoCamera,false);staticCulling.update(stereoCamera,false);xr.render();", "if(xr.isDiorama?.()){scans.restoreInstances();staticCulling.restore();}else{scans.cull(stereoCamera,false);staticCulling.update(stereoCamera,false);}xr.render();")
patch('scene.mjs',"return {bindXR(adapter){xr=adapter;}","return {renderAR(xrCamera,state){renderWaistAR(renderer,scene,xrCamera,arEnvironment,heightAt(state.player.x,state.player.z)-(state.player.swimDepth||0)+.92);},bindXR(adapter){xr=adapter;}")
patch('app.mjs',"[['first-person','FIRST PERSON / VR'],['diorama-vr'", "[['first-person','FIRST PERSON / VR'],['first-person-ar','FIRST PERSON / AR CUTAWAY'],['diorama-vr'")
legacy="localStorage.setItem('svgn.rainward.v1.freefield',JSON.stringify({freeStride:false,xrLayout:'legacy',pinnedXR:true,footsteps:100,waterVolume:100,score:'legacy'}));"
for p in (R/'tests').iterdir():
 if p.suffix not in ['.py','.js'] or p.name.startswith('freefield'):continue
 s=p.read_text();needle="localStorage.setItem('svgn.rainward.v1.settings'"
 if needle in s and "svgn.rainward.v1.freefield" not in s:p.write_text(s.replace(needle,legacy+needle))
patch('freefield-ui.mjs',"const summary=document.createElement('summary');summary.textContent=", "const summary=document.createElement('summary');summary.id='freefield-settings-toggle';summary.textContent=")
patch('tests/quest-device-mock.js',"device.use('controllers');","device.use('controllers');device.pulses=[];device.pulse=(side,index)=>device.pulses.push([side,index]);")
patch('tests/quest-device-mock.js','device.frames++;cb(t,frame(this));','device.frames++;const taps=device.pulses.splice(0);for(const [side,index]of taps)device.button(side,index,true);cb(t,frame(this));for(const [side,index]of taps)device.button(side,index,false);')
