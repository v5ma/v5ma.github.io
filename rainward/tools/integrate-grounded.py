"""Temporary, idempotent candidate integration from verified Clear Water.
Only enumerated Rainward files may be written. Remove this and the preparatory
workflow before merging. Never replay an old integration against a later release.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
def edit(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 if old in s:
  assert s.count(old)==1,(name,'ambiguous source; inspect first')
  p.write_text(s.replace(old,new))
 else:assert new in s,(name,'source diverged; inspect first')
def write(name,text):(R/name).write_text(text)
edit('actors.mjs',"import * as T from './vendor/three.module.js';","import * as T from './vendor/three.module.js';\nimport {fitProportions,proportionPoint} from './character-proportions.mjs';\nimport {applyGroundedMotion} from './grounded-motion.mjs';")
edit('actors.mjs','return {geometry,bind,parent,names};','fitProportions(geometry);return {geometry,bind:bind.map(v=>proportionPoint(...v)),parent,names};')
edit('actors.mjs','export function pose(a,p,time,enemy=false){','export function pose(a,p,time,enemy=false,heightAt=()=>0){')
edit('actors.mjs','a.root.position.set(p.x,prone?.13:0,p.z);','a.root.position.set(p.x,(prone?.13:0)+heightAt(p.x,p.z)-(p.swimDepth||0),p.z);')
edit('actors.mjs',' a.root.updateMatrixWorld(true);a.skin.skeleton.update();',' applyGroundedMotion(a,p,time,dt,heightAt);\n a.root.updateMatrixWorld(true);a.skin.skeleton.update();')
edit('rainworn-humans.mjs',"import * as T from './vendor/three.module.js';","import * as T from './vendor/three.module.js';\nimport {fitProportions} from './character-proportions.mjs';")
edit('rainworn-humans.mjs','const parts=validateHumanSource(gltf);sources.set(gender,{gltf,parts});','const parts=validateHumanSource(gltf);for(const part of parts)fitProportions(part.geometry);sources.set(gender,{gltf,parts});')
p=R/'scene.mjs';s=p.read_text()
if "import {motionStats}" not in s:p.write_text("import {motionStats} from './grounded-motion.mjs';\n"+s)
edit('scene.mjs','lastState=state;lastEvent=0;cameraSet=false;','lastState=state;lastEvent=0;cameraSet=false;hero.motion=null;for(const a of enemies.values())a.motion=null;')
edit('scene.mjs','pose(hero,state.player,t);hero.root.position.y+=heightAt(state.player.x,state.player.z)-(state.player.swimDepth||0);','pose(hero,state.player,t,false,heightAt);')
edit('scene.mjs',"pose(model,{...e,aim:e.state==='chase'&&(e.aimTime||0)>.1},t,true);model.root.position.y+=heightAt(e.x,e.z);","pose(model,{...e,aim:e.state==='chase'&&(e.aimTime||0)>.1},t,true,heightAt);")
edit('scene.mjs','rainworn:{humans:humans.stats()','grounded:motionStats(hero),rainworn:{humans:humans.stats()')
p=R/'tests/rainworn.test.mjs';s=p.read_text()
if 'import {fitProportions}' not in s:p.write_text(s.replace('const root=new URL',"import {fitProportions} from '../character-proportions.mjs';\nconst root=new URL").replace('geometry.setIndex(attribute(p.indices));const mesh=', 'geometry.setIndex(attribute(p.indices));fitProportions(geometry);const mesh='))
release=json.loads((R/'release.json').read_text());assert release['version'] in ['0.13.1','0.14.0']
release.update(version='0.14.0',build='rainward-grounded-20260914',changes=['Add world-space planted feet, bounded two-bone leg IK, slope alignment and safe contact release for hero and humanoid patrols','Tie visual stride to actual root displacement; blend land poses and author separate swim, underwater stroke and surface-tread motion','Refine shoulder width, lower-leg balance and boot bulk with one coherent map for original clothing, imported detail and skeletal bind points','Preserve all seven expeditions, saves, physical movement, combat rules, finite inventory, controller presets and licensed source assets','Retain exact-source before/after WebGL motion evidence and the complete living-enemy and controller regression matrix'])
write('release.json',json.dumps(release,indent=2)+'\n')
for f in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
 p=R/f;p.write_text(p.read_text().replace("'0.13.1'","'0.14.0'").replace('v0.13.1','v0.14.0'))
p=R/'tests/handoff.test.mjs';p.write_text(p.read_text().replace("t.status==='Implemented').length,22","t.status==='Implemented').length,24"))
plan=json.loads((R/'production-plan.json').read_text());plan.update(release='0.14.0',edition='Grounded',updated='2026-09-14')
for task in plan['items']:
 if task['id']=='RW-035':task.update(status='Implemented',evidence='GROUNDED.md',resumeNote='Grounded adds actual-distance stride, visual land-pose blending and distinct original swim/tread/stroke motion to the fitted seventeen-bone humans. These are procedural authored curves, not imported motion-capture clips or a learned animation model.',nextAction='Review transitions at game speed and expand authored action/stagger clips; preserve all gameplay action clocks and cancellation rules.')
 if task['id']=='RW-036':task.update(status='Implemented',evidence='GROUNDED.md',resumeNote='World-space foot contacts, bounded two-bone leg solving, terrain normals and safe release are implemented. Weapon-hand, ledge and arbitrary-stair contacts remain unimplemented; no collision authority is delegated to IK.',nextAction='Add weapon support-hand and authored traversal contacts, review step boundaries and test real hardware; keep motion failure and seam evidence.')
 if task['id']=='RW-014':task.update(evidence='tests/grounded.py',resumeNote='Camera-matched baseline/current humanoid captures and measured foot-contact fixtures are available through the Grounded workflow. They are not a named art review or full flagship lighting approval.')
 if task['id']=='RW-034':task['resumeNote']+=' Grounded applies a coherent in-memory rest-space proportion map to details, garments and bind landmarks; original GLB files and licenses stay unchanged.' if 'Grounded applies' not in task.get('resumeNote','') else ''
c=plan['continuation'];c.update(recordId='rainward-grounded-20260914',recordedAgainstMaster='b87aeacb71d00b73992945daaba2fccdc66ab409',scope='Grounded v0.14.0 implements the bounded motion/proportion portion of H-02. GROUNDED.md and its release evidence identify exact acceptance. The older verifiedGameplay object remains immutable Undertow history, not the current release.')
for item in c['openChecks']:
 if item['id']=='H-02':item.update(status='Implemented',evidence='GROUNDED.md',result='Foot contacts, slope IK, land-pose blending, swim/tread/stroke curves and coherent proportion fitting implemented. Native motion review, full regression and publication are required release gates. Weapon-hand contacts and named human approval remain open.')
c['notImplemented']=[s.replace('Imported authored animation library and contact IK','Imported authored animation library, weapon-hand IK and arbitrary stair/ledge contacts') for s in c['notImplemented']]
if not any(r['url']=='GROUNDED.md' for r in plan['references']):plan['references'].insert(0,{'title':'Grounded motion, proportions and research scope','url':'GROUNDED.md'})
write('production-plan.json',json.dumps(plan,indent=2)+'\n')
write('GROUNDED.md','''# Rainward v0.14.0 / Grounded

This implements the owner's inverse-kinematics reference as a bounded upgrade to Rainward, not a replacement demo. Linked roadmap: H-02, RW-035, RW-036 and partial RW-014 evidence.

## Motion

The hero and five humanoid patrol roles now use distance-driven visual stride, world-space planted-foot targets, independent two-bone leg solving, soft reach limits and terrain-aligned feet. Contacts release for swing, overreach, sharp turning, unsupported ground, vaulting, prone, swimming, death, chapter replacement and shelter restores. Position/velocity-aware cubic offsets soften target handoffs; source-pose interpolation runs before IK so it does not drag a planted foot. No animation writes player position, posture, health, action duration, hit points or save data.

Land poses blend instead of snapping all joint rotations immediately. Swimming no longer relies solely on the crawl pose: original arm-pull/flutter curves, surface treading, sculling and submerged posture are distinct. These are newly authored procedural curves, not imported motion capture, a neural controller or a physics-based ragdoll. Weapon-hand and arbitrary ledge/stair contacts are not claimed.

## Proportions

The calibrated outfit is less broad at the shoulders, the knee landmark is raised by 0.012 game meters to rebalance thigh/lower-leg lengths, and boot bulk is slightly reduced. Overall standing height and head dimensions remain. The same continuous rest-space map modifies every original garment, decoded imported detail and skeletal bind landmark. Normals are transformed consistently, skin weights remain normalized, all seventeen bones remain, and licensed GLB bytes are unchanged. These are conservative art choices, not universal human proportions or an anthropometric certification.

## Preservation

All seven authored expeditions, both Xbox presets, full native menus, settings, keyboard/touch routes, finite supplies, combat/oxygen rules, checkpoint formats and save keys remain. Feet sample the actual authored terrain height; there is no new collision system. Reduced Graphics and detailed-human fallback remain supported. No new controller bindings, render target, network provider or runtime account are required. The existing original music and source licenses remain intact.

## Validation boundaries

The model suite includes analytic degeneracies, frame-rate-independent plant checks at 30/60/120 Hz, slopes, blocked movement, backward/lateral travel, turns, restore reset, swim/land release, source immutability and proportion mapping. The dedicated WebGL fixture compares fixed-camera original/current poses for the hero and five humanoid roles, and measures actual rendered-skeleton contact positions. It is a synthetic motion/terrain fixture, not a living-enemy playthrough, physical Xbox/Bluetooth check or target-hardware frame-rate result.

The existing living-enemy Natatorium journeys and full controller/save/material/audio/cinematic regression remain separate release gates. The local model suite runs here; local browser navigation is blocked with net::ERR_BLOCKED_BY_ADMINISTRATOR, so native evidence is collected by GitHub Actions without bypassing that local policy. Failed evidence must be retained. Final source/merge hashes and actual public-byte verification belong in the release PR and evidence/grounded-v0.14.0/ before publication is claimed. Named artistic, real-device audio and physical-controller approval remain open.

## Research and next work

Daniel Holden's Inverse Kinematics and Foot Locking (2026-07-30) explains separating a leg-chain solve from a contact target that stays fixed in world space, with soft reach and inertial transitions. Rainward independently implements those mathematical ideas for its existing rig; no code, character assets or motion clips were copied from the article.

https://theorangeduck.com/page/inverse-kinematics-foot-locking
https://theorangeduck.com/page/creating-looping-animations-motion-capture

The linked publications also include Learned Motion Matching and HUMOS: Human Motion Model Conditioned on Body Shape. These are useful future directions for a properly licensed motion database and body-dependent motion. They are not integrated or reproduced by this release.

https://theorangeduck.com/page/publications
https://theorangeduck.com/page/learned-motion-matching
https://arxiv.org/abs/2409.03944

Continue by reviewing captured motion, adding support-hand grips and authored action/stagger transitions, then more complete step/ledge contact handling and physical-device review. Do not mark H-02 or RW-036 fully approved merely because their foot-contact foundation is implemented.
''')
for name,prefix in [('README.md','''# Rainward v0.14.0 / Grounded

Current upgrade: [GROUNDED.md](GROUNDED.md). The existing hero and humanoid patrols gain planted feet, terrain-aware leg IK, motion blending, separate swim/tread motion and coherent proportion refinements. All seven chapters, saves and Xbox controls remain. Physical-device and artistic approval remain open. Read the current handoff and release evidence before continuing.

The following sections retain earlier release history.

'''),('DEVELOPMENT-HANDOFF.md','''# Current continuation / Grounded v0.14.0

Read GROUNDED.md, current release.json, production-plan.json and CONTROLLER.md. Resume from current master, not an old preparation branch. The bounded H-02 motion/proportion upgrade implements foot plants, terrain leg solving, land-pose interpolation, separate swim/tread/stroke curves and coherent rest-space fitting for original/imported surfaces. Gameplay, seven chapters, saves and input bindings remain authoritative and unchanged.

The synthetic before/after benchmark is tests/grounded.py; it must not replace the living-enemy Natatorium or complete controller regression suites. Release evidence and the PR must identify exact candidate/merge source and public file hashes. Keep source/model checks, native fixture checks, physical-device evidence and named artistic review distinct. Do not mark full hand contacts, arbitrary stairs, mocap, learned motion matching or HUMOS as implemented.

Next: review the captured motion, improve authored action/stagger transitions and supporting weapon-hand contacts, then ledge/step contacts and actual wired/Bluetooth Xbox/performance review. H-02 and RW-035/RW-036 remain Implemented, not Approved. No store migration or new controller gesture is required.

The text below is retained history for Clear Water and Undertow, not an instruction to resurrect or republish those builds.

''')]:
 p=R/name;s=p.read_text()
 if not s.startswith(prefix.splitlines()[0]):p.write_text(prefix+s)
p=R/'CONTROLLER.md';s=p.read_text().replace('# Rainward v0.13.1 /','# Rainward v0.14.0 /')
if 'Grounded adds no control binding' not in s:s+='\n## Grounded motion\n\nGrounded adds no control binding or remapping. Foot contacts and swim/tread motion are visual responses to normal movement and state. Survival and Classic retain their existing dive, surface, reload, melee and menu actions. Animation interpolation does not prolong held actions or change save/collision authority. Physical Xbox/Bluetooth approval remains open.\n'
p.write_text(s)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
