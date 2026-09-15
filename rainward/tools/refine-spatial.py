"""Temporary scoped hardening and production metadata; remove before merge."""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
def rep(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'source diverged',s.count(old));p.write_text(s.replace(old,new))
rep('app.mjs','$(host).insertBefore(label,$(host).querySelector(\'button[id^="xr-"]\'));','const entry=$(host).querySelector(\'button[id^="xr-"]\');entry.parentNode.insertBefore(label,entry);')
rep('app.mjs','const updateXRAvailability=async()=>{const supported=await quest.supported();','const updateXRAvailability=async()=>{const requested=quest.preferences().view,supported=await quest.supported(requested);if(quest.preferences().view!==requested)return;')
rep('diorama-view.mjs','floor=ground-4;','floor=ground-8;')
rep('diorama-view.mjs','const edges=[];','walls.top.visible=false;walls.front.visible=false;\n const edges=[];')
rep('quest-xr.mjs','isActive:()=>active,isDiorama,changeView,','isActive:()=>active,isDiorama,changeView,containsWorldPoint:point=>diorama.contains(point),')
p=R/'scene.mjs';s=p.read_text();a=s.index(' function aimDirection(');b=s.index(' function project(',a)
f=''' function aimDirection(state){
  const p=state.player,origin=new T.Vector3(p.x,heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,p.z),miniature=xr.isActive()&&xr.isDiorama?.();
  const center=new T.Vector3(0,0,.5).unproject(camera),xrRay=xr.isActive()?xr.ray():null,rayOrigin=xrRay?.origin||camera.position,dir=xrRay?.direction||center.sub(camera.position).normalize();
  raycaster.set(rayOrigin,dir);raycaster.far=miniature?200:60;
  const targets=state.enemies.filter(e=>e.hp>0).map(e=>enemies.get(e.id)?.root).filter(Boolean);
  const hits=raycaster.intersectObjects([...blockMeshes.filter(m=>!m.userData.obstacle.disabled),...targets],true).filter(hit=>!miniature||xr.containsWorldPoint(hit.point));
  let target=hits.length?hits[0].point:rayOrigin.clone().addScaledVector(dir,60);
  if(!hits.length&&miniature){const distance=(origin.y-rayOrigin.y)/dir.y,candidate=rayOrigin.clone().addScaledVector(dir,distance);
   target=Number.isFinite(distance)&&distance>0&&distance<200&&xr.containsWorldPoint(candidate)?candidate:origin.clone().add(new T.Vector3(-Math.sin(p.yaw),0,-Math.cos(p.yaw)).multiplyScalar(30));
  }
  const d=target.sub(origin).normalize();return {x:d.x,y:d.y,z:d.z};
 }
'''
p.write_text(s[:a]+f+s[b:])
rep('tests/terminus.py',"go(page,0,-62.6);page.keyboard.press('KeyE')","go(page,0,-64);check(page.evaluate('Math.hypot(Rainward.state.player.x,Rainward.state.player.z+65)<2.4'),'The no-kill route enters the physical tram interaction range before pressing E');page.keyboard.press('KeyE')")
rep('tests/diorama-browser.py',"check(p.locator('#xr-view-title option').count()==3","check(p.evaluate('Rainward.mode')=='title','The native title initializes without a fatal UI construction error');check(p.locator('#xr-view-title option').count()==3")
p=R/'tests/diorama.test.mjs';s=p.read_text()
if 'existing deep pool space' not in s:p.write_text(s+"\ntest('The stage includes existing deep pool space rather than clipping the diver below its base',()=>{const stage=createDioramaView(),rig=new T.Group();stage.update(rig,{position:{x:0,y:1.65,z:0},orientation:new T.Quaternion()},{x:0,z:0,waterMode:'swim'},0,0,.016,{view:'diorama-vr'});assert.ok(stage.contains({x:0,y:-6.5,z:0}));stage.dispose();});\n")
p=R/'release.json';r=json.loads(p.read_text());assert r['version']=='0.14.0';r.update(build='rainward-open-diorama-20260915',xr='experimental-first-person-and-stereo-vr-ar-diorama',changes=['Retain playable first-person Quest VR with tracked controllers and hand tracking','Add third-person AR and VR dioramas of the actual world, not a flat theatre or separate game','Enforce three valid top/front shell states, with bounded zoom, recentering and optional content follow','Keep spectator head motion separate from character locomotion and preserve native gameplay rules','Replace the Floodgate clinic-market seam with a continuous raised route, new clinic opening and saved inside-unlocked return shutter','Preserve all seven expedition slots, old checkpoint formats, objectives, finite resources, Xbox layouts, original art/audio and licenses','Adopt an experience-spine and graybox-first level-design contract; remaining chapter replacements and physical-device approval stay open']);p.write_text(json.dumps(r,indent=2)+'\n')
p=R/'production-plan.json';plan=json.loads(p.read_text());plan.update(edition='Open Diorama',updated='2026-09-15');plan['nextRelease']=['RW-009','RW-012','RW-028','RW-035','RW-036','RW-063']
for title,url in [('Open Diorama modes and evidence boundaries','DIORAMA.md'),('Authored replacement methodology and chapter briefs','LEVEL-DESIGN.md')]:
 if not any(ref['url']==url for ref in plan['references']):plan['references'].insert(0,{'title':title,'url':url})
plan['continuation']['scope']='Open Diorama extends the unfinished Quest candidate with first-person VR and third-person AR/VR views. The clinic-market seam is the first playable graybox replacement, not all seven completed redesigns. See DIORAMA.md, LEVEL-DESIGN.md and exact release evidence.'
plan['continuation']['spatialAcceptance']={'status':'Implemented','views':['first-person','diorama-vr','diorama-ar'],'shells':['both-open','top-open','front-open'],'physicalQuest3':'Not tested','referencePlacement':'Recenterable reference-space display; no plane hit test, persistent room anchor or depth occlusion','sourceBrief':'Pasted text(20260915-173014).txt','sourceSHA256':'b7b3d4870d5e88471d396a7a13382b5ab5572aa7110d331af17ace4ae5468c17','firstReplacement':'Floodgate clinic-market seam / playable graybox','otherChapterReplacements':'Planned; six existing chapters remain playable and unchanged','acceptance':'Require exact-source model, real browser fixture and living-enemy regression, physical device review and unfamiliar-player pacing review separately.'}
plan['continuation']['xr']['implementation']='DIORAMA.md';plan['continuation']['xr']['deferred']='Physical Quest 3 acceptance, native packaging, multiplayer, automatic tabletop detection and unfinished character-contact animation remain open.'
for t in plan['items']:
 if t['id'] in ['RW-009','RW-011','RW-013']:
  t['evidence']='LEVEL-DESIGN.md';t['resumeNote']='The clinic-market seam now has a playable graybox route replacement, real elevation and an inside-unlocked recovery gate. This is not the entire approved flagship slice.';t['nextAction']='Record an unfamiliar-player stealth-to-combat-to-recovery study before final art; complete the remaining Floodgate sequence without filler.'
 if t['id']=='RW-028':t.update(evidence='LEVEL-DESIGN.md',resumeNote='The owner selected an experience-spine, wide-linear, reconnecting and graybox-first replacement approach. Only the first Floodgate seam is implemented.',nextAction='Apply the seven chapter briefs incrementally, preserving stable objectives and shelters; verify route choice, observation, retreat, pacing and spatial reveals with players.')
 if t['id']=='RW-030':t['resumeNote']='The recut adds ordinary continuous ramps in the existing heightfield, not arbitrary windows, ledges, ladders or overlapping floors.'
 if t['id']=='RW-063':t.update(evidence='DIORAMA.md',resumeNote='First-person VR, third-person VR Diorama and third-person AR Diorama share the existing game and controller/hand adapters. Physical Quest 3 review is still absent.',nextAction='Test all three views with real Quest controllers and hands, including placement, body-scale clarity, targeting, saves, tracking loss, comfort and measured device performance.')
p.write_text(json.dumps(plan,indent=2)+'\n');subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
prefix='''# Current release / Open Diorama v0.14.0

Read DIORAMA.md for first-person VR, third-person VR Diorama and third-person AR Diorama, controller/hand entry and the three valid shell states. Read LEVEL-DESIGN.md for the new experience-spine/graybox-first replacement contract. The first implemented replacement is the Floodgate clinic-market seam, with a 2.4-metre terrace, new north opening and saved inside-unlocked yard shutter. The other six chapter redesigns remain planned, not completed. All original chapter slots, objectives, shelters and checkpoint formats remain.

The earlier Quest Fieldwork text below describes the first-person component. Its statement excluding AR is superseded by DIORAMA.md. Physical Quest 3/Xbox, hand reliability, comfort, final art/audio and unfamiliar-player pacing gates remain unapproved. The release PR and evidence summary, not this document alone, establish publication.

'''
for name in ['README.md','CONTROLLER.md','DEVELOPMENT-HANDOFF.md']:
 p=R/name;s=p.read_text()
 if not s.startswith('# Current release / Open Diorama'):p.write_text(prefix+s)
p=R/'AGENTS.md';s=p.read_text()
if 'The owner authorized authored layout replacements' not in s:p.write_text(s+'\nThe owner authorized authored layout replacements on 2026-09-15. Apply LEVEL-DESIGN.md: experience spine, meaningful alternatives, observation, loops, retreat, contrast and graybox playtesting before final art. Preserve seven chapter identities, stable progression and compatible shelters, not every prototype wall. The initial clinic-market seam is only the first replacement. DIORAMA.md adds first-person VR and third-person AR/VR of the same game; never allow both top and front closed. Do not claim room-surface detection, persistent anchors, physical-device review, final level quality or unfinished IK as shipped.\n')
rep('index.html','XR supports immersive first-person play with tracked controllers or hands. Physical Quest testing remains open.','XR supports first-person VR and third-person AR/VR dioramas with controllers or hands. Physical Quest testing remains open.')
