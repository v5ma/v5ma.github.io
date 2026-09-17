"""Candidate transport only. All changes are committed BEFORE browser acceptance.
Remove this script and its marker before the final PR merge.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
marker=R/'FREEFIELD-FINALIZED.json'
if marker.exists():raise SystemExit(0)
def patch(name,old,new):
 p=R/name;s=p.read_text()
 assert s.count(old)==1,(name,'review source drift',old[:70],s.count(old));p.write_text(s.replace(old,new))
patch('portal-view.mjs',"import * as T from './vendor/three.module.js';","import * as T from './vendor/three.module.js';\nimport {createPortalOcclusion,blocksPortalFocus} from './portal-occlusion.mjs';")
patch('portal-view.mjs','materials=new PortalMaterials();','materials=new PortalMaterials(),occlusion=createPortalOcclusion();')
patch('portal-view.mjs','function render(renderer,scene,camera,rig){','function render(renderer,scene,camera,rig,environmentRoots){')
patch('portal-view.mjs','materials.collect(world);','occlusion.collect(environmentRoots);occlusion.configure(anchor.clone().add(new T.Vector3(0,STAGE_METRES.height/2,0)),anchor.y+STAGE_METRES.height/2-.9*config.scale,config.scale);materials.collect(world);')
patch('portal-view.mjs','materials.active=true;world.updateMatrixWorld(true);','occlusion.active=true;materials.active=true;world.updateMatrixWorld(true);')
patch('portal-view.mjs','materials.active=false;renderer.autoClear=false;','occlusion.active=false;materials.active=false;renderer.autoClear=false;')
patch('portal-view.mjs','materials.active=false;world.remove(sky);','occlusion.active=false;materials.active=false;world.remove(sky);')
patch('portal-view.mjs','automaticEyeFacingTransparency:true,worldMatrix:','automaticEyeFacingTransparency:true,foregroundCutaway:true,worldMatrix:')
patch('portal-view.mjs','dispose(){materials.dispose();','dispose(){materials.dispose();occlusion.dispose();')
patch('portal-view.mjs','function contains(point){if(!anchor)return false;return seesFragment(eye,new T.Vector3(point.x,point.y,point.z).applyMatrix4(display),boxInverse(anchor,heading),STAGE_METRES);}',"function contains(point,environment=false){if(!anchor)return false;const shown=new T.Vector3(point.x,point.y,point.z).applyMatrix4(display);if(!seesFragment(eye,shown,boxInverse(anchor,heading),STAGE_METRES))return false;return !environment||!blocksPortalFocus(eye,shown,anchor.clone().add(new T.Vector3(0,STAGE_METRES.height/2,0)),anchor.y+STAGE_METRES.height/2-.75*config.scale,Math.max(.10,3.5*config.scale));}")
patch('scene.mjs','return {renderAR(','return {portalEnvironment:arEnvironment,renderAR(')
patch('scene.mjs','xr.containsWorldPoint(hit.point)','xr.containsWorldPoint(hit.point,!!hit.object.userData.obstacle)')
patch('quest-xr.mjs','diorama.render(renderer,scene,camera,rig);','diorama.render(renderer,scene,camera,rig,renderContext.portalEnvironment);')
patch('quest-xr.mjs','containsWorldPoint:point=>diorama.contains(point)','containsWorldPoint:(point,environment=false)=>diorama.contains(point,environment)')
# Keep old runtime recipes/input selectable while acknowledging the superseding view contract.
for name in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
 p=R/name;s=p.read_text();assert '0.15.0' in s,name;p.write_text(s.replace('0.15.0','0.16.0'))
p=R/'release.json';release=json.loads(p.read_text());assert release['version']=='0.15.0';release.update(version='0.16.0',build='rainward-freefield-20260917',xr='experimental-first-person-vr-ar-and-character-centered-world-portals',changes=['Replace cropped miniatures with character-centered perspective portals and add first-person AR waist cutaway','Hide the full XR field menu in ordinary play; offer direct Quest actions and separately saved Quest/Xbox remaps','Add optional clear-ground blink, faster continuous running, quieter player Foley and a sparse original score','Reshape Meridian around a sunken drain, raised clinic courtyard, reading ridge and distinct footprints','Retain authored body surfaces and face treatment; add bounded visual foot contacts and local licensed weapons','Preserve seven chapter identities, stable objectives, rewards, shelters, old checkpoints and optional legacy settings']);p.write_text(json.dumps(release,indent=2)+'\n')
p=R/'production-plan.json';plan=json.loads(p.read_text());plan.update(release='0.16.0',edition='Freefield',updated='2026-09-17');plan['nextRelease']=['RW-028','RW-035','RW-036','RW-044','RW-049','RW-063']
if not any(x['url']=='FREEFIELD.md' for x in plan['references']):plan['references'].insert(0,{'title':'Freefield changes, evidence and limitations','url':'FREEFIELD.md'})
plan['continuation']['freefield']={'status':'Implemented','evidence':'FREEFIELD.md','publicStatus':'Use the PR and served-file receipt; candidate tests alone are not delivery','physicalQuest3':'Not tested','scope':'Four XR views, centered portals, on-demand UI, direct/saved controls, Free Stride, blink, quiet audio, Meridian relief and partial foot contacts. Not all seven redesigned chapters or complete authored animation.'}
updates={
'RW-028':('Meridian relief, footprints, beacon orientation and valve recovery are implemented. Other chapter redesigns and unfamiliar-player review remain open.','Review learned transfers versus direct exposure, then continue the next chapter rather than adding acreage.'),
'RW-035':('Authored body surfaces and high-speed gait adjustments do not constitute a complete authored action-clip set.','Author and review land/water transitions with before/after captures.'),
'RW-036':('Bounded visual two-bone foot placement and planting are implemented. Hand contacts and full action coverage remain unfinished.','Review slopes, stops and turns on actual models, then add weapon grips without changing collision.'),
'RW-044':('Quiet player footsteps/water and sparse music are implemented; legacy mix remains. This is not a completed Foley-library replacement.','Listen on actual speakers/headphones for repetition, peaks and threat clarity.'),
'RW-049':('Saved gameplay remaps and reserved menu recovery controls are implemented. Exhaustive combinations and accessibility hold alternatives remain open.','Test non-default remaps in native journeys and refine per-action prompts.'),
'RW-063':('Four XR views share one game. Portals center the survivor, first-person AR cuts environment at the waist, and panels are on demand.','Run physical Quest controllers/hands, permissions, sight, low air, saves, comfort and performance.')}
for t in plan['items']:
 if t['id'] in updates:t.update(evidence='FREEFIELD.md',resumeNote=updates[t['id']][0],nextAction=updates[t['id']][1])
p.write_text(json.dumps(plan,indent=2)+'\n');subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
prefix='# Current candidate / Freefield v0.16.0\n\nRead FREEFIELD.md and FREEFIELD-HANDOFF.md first. The owner requested faster no-fatigue running, quiet player sounds, direct and saved Quest/Xbox remaps, blink, on-demand XR UI, real world portals, first-person AR, better bodies and different level geography. These supersede older mapping/crop descriptions below. Meridian is the first redesigned chapter in this pass; other chapter replacements and human/device approval remain open. A version string is not publication evidence; use the Freefield PR and served-file receipt.\n\nEarlier release records are historical context.\n\n'
for name in ['README.md','CONTROLLER.md','DEVELOPMENT-HANDOFF.md']:
 p=R/name;p.write_text(prefix+p.read_text())
p=R/'AGENTS.md';p.write_text(p.read_text()+'\nThe September 17 Freefield brief supersedes fatigue-limited default running, old Quest face buttons, pinned XR panels and six-plane cropping. Preserve selectable legacy controls/movement and old saves; do not restore superseded defaults to satisfy historical tests. FREEFIELD.md defines the four-view centered portal and on-demand UI. Software input/pixel tests do not certify physical Quest or human quality.\n')
patch('app.mjs','Playable XR: first person VR, third person VR diorama, or AR diorama.','Playable XR: first person VR or AR, and third person VR or AR world portals.')
p=R/'tests/diorama-browser.py';s=p.read_text().replace("option').count()==3","option').count()==4").replace('First-person VR, third-person VR and third-person AR are explicit native choices','First-person VR/AR and third-person VR/AR are explicit native choices')
s=s.replace("check(d['cutaway']['top']==top and d['cutaway']['front']==front,'World presentation cutaways match the selected shell openings')","check(d['portal'] and d['automaticEyeFacingTransparency'] and d['beyondBackVisible'],'The whole-world portal keeps eye-facing panels transparent and retains distant scenery')")
s=s.replace("select('display-follow');check(p.evaluate('Rainward.snapshot().xr.diorama.follow')==False,'Content follow can be disabled using a spatial control')","select('display-follow');check(p.evaluate('Rainward.snapshot().xr.diorama.follow')==True,'The requested portal always follows the centered survivor, including old stored preferences')")
a="scale=1/x.diorama.scale,matrix=new T.Matrix4().compose(new T.Vector3(x.rig.x,x.rig.y,x.rig.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),x.rig.yaw),new T.Vector3(scale,scale,scale)),target=new T.Vector3(p.x+2,1.2,p.z-6).applyMatrix4(matrix.invert())"
b="matrix=new T.Matrix4().fromArray(x.diorama.worldMatrix),target=new T.Vector3(p.x+2,1.2,p.z-6).applyMatrix4(matrix)"
assert a in s;s=s.replace(a,b);p.write_text(s)
p=R/'tests/freefield-portal.test.mjs';p.write_text(p.read_text()+'''\nimport {blocksPortalFocus} from '../portal-occlusion.mjs';
test('Foreground cutaway reveals the survivor without erasing ground or the farther world',()=>{const eye=new T.Vector3(0,1.65,0),focus=new T.Vector3(0,1.15,-1.5);assert.equal(blocksPortalFocus(eye,new T.Vector3(0,1.3,-1),focus,1.12,.2),true);assert.equal(blocksPortalFocus(eye,new T.Vector3(0,1,-1),focus,1.12,.2),false);assert.equal(blocksPortalFocus(eye,new T.Vector3(0,1.3,-4),focus,1.12,.2),false);assert.equal(blocksPortalFocus(eye,new T.Vector3(1,1.3,-1),focus,1.12,.2),false);});
''')
patch('tests/freefield-graphics.html',"import {renderWaistAR} from '../waist-ar.mjs';","import {renderWaistAR} from '../waist-ar.mjs';\nimport {createPortalOcclusion} from '../portal-occlusion.mjs';")
patch('tests/freefield-graphics.html','</script>','''window.runSightline=()=>{
 scene.clear();adapter.active=false;renderer.setClearColor(0,0);const camera=new T.PerspectiveCamera(60,2,.05,100),focus=new T.Vector3(0,1.15,-1.5);camera.position.set(0,1.65,0);camera.lookAt(focus);camera.updateMatrixWorld();
 const wall=new T.Mesh(new T.PlaneGeometry(1.8,1.6),new T.MeshBasicMaterial({color:0x0000ff}));wall.position.set(0,1.30,-1.05);scene.add(wall);
 const actor=new T.Mesh(new T.PlaneGeometry(.15,.25),new T.MeshBasicMaterial({color:0x00ff00}));actor.position.copy(focus);scene.add(actor);
 const pixel=()=>{const out=new Uint8Array(4);gl.readPixels(256,128,1,1,gl.RGBA,gl.UNSIGNED_BYTE,out);return [...out];};
 renderer.render(scene,camera);const before=pixel(),cut=createPortalOcclusion();cut.collect([wall]);cut.configure(focus,1.10,.04);cut.active=true;renderer.render(scene,camera);const after=pixel();cut.active=false;cut.dispose();return {before,after,actorStillPresent:actor.parent===scene,wallStillPresent:wall.parent===scene};
};
</script>''')
patch('tests/freefield-graphics.py','  assert not errors,errors',"  sightline=p.evaluate('runSightline()');p.screenshot(path=str(OUT/'sightline-pixels.png'));assert sightline['before'][2]>200 and sightline['after'][1]>200 and sightline['actorStillPresent'] and sightline['wallStillPresent'],sightline\n  assert not errors,errors")
patch('tests/freefield-graphics.py',"'errors':errors,'passed':2","'sightline':sightline,'errors':errors,'passed':3")
patch('tests/freefield-browser.py',"  page.screenshot(path=str(OUT/'01-gameplay.png'))", "  if VIEW.startswith('diorama'):page.evaluate('questDevice.headPitch=-.32');frames(5)\n  page.screenshot(path=str(OUT/'01-gameplay.png'))")
patch('tests/freefield-browser.py',"  page.screenshot(path=str(OUT/'02-settings.png'));select('exit');",'''  if KIND=='controllers' and VIEW=='first-person':
   select('resume');wait('Rainward.mode==="play"');away();frames(4)
   page.evaluate("questDevice.button('left',0,true)");wait('Rainward.snapshot().xr.sight.active&&Rainward.snapshot().xr.sight.draws>0');page.evaluate("questDevice.button('left',0,false)");frames(4)
   check(not page.evaluate('Rainward.snapshot().xr.sight.headsetFovChanged'),'The scoped sight draws without changing headset field of view')
   before=page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,mag:Rainward.state.player.mag,objectives:{...Rainward.state.objectives}})')
   page.evaluate("()=>{questDevice.sources[1].orientation={x:0,y:-Math.SQRT1_2,z:0,w:Math.SQRT1_2};questDevice.button('left',1,true);}");frames(5)
   check(page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})')=={'x':before['x'],'z':before['z']},'Holding blink previews without moving the survivor')
   page.evaluate("questDevice.button('left',1,false)");page.wait_for_function('(x)=>Rainward.state.player.x>x+1',arg=before['x']);frames(4)
   check(page.evaluate('Rainward.state.player.mag')==before['mag'] and page.evaluate('Rainward.state.objectives')==before['objectives'],'Blink release uses the real clear route without granting ammunition or objectives')
   pause()
  page.screenshot(path=str(OUT/'02-settings.png'));select('exit');''')
marker.write_text(json.dumps({'baseline':'0febf4cd2e647dd9d785e52033c52e3c693543d6','version':'0.16.0','status':'assembled candidate; require native acceptance and remove transport tools before merge'},indent=2)+'\n')
