"""Scoped candidate assembly. Remove with the temporary prepare workflow before merging."""
import json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def put(name,text):(R/name).write_text(text)
def edit(name,old,new):
 p=R/name;s=p.read_text()
 if old in s:p.write_text(s.replace(old,new))
 else:assert new in s,(name,'unexpected source; inspect before changing')
EXTRA='''  # Clear Water: this remains the isolated, defeated-enemy fixture, not the living mission.
  check(p.locator('#oxygen-meter').get_attribute('aria-label')=='Oxygen remaining: 100 percent','The real oxygen meter exposes its remaining percentage to accessibility tools')
  press(9,'Rainward.mode==="pause"');nav('controlPreset');press(15);check(p.evaluate('Rainward.snapshot().controlPreset')=='classic','The water journey can switch to Classic through controller settings');press(1,'Rainward.mode==="play"')
  wait('document.querySelector("#water-control").textContent==="B DIVE / GEAR STOWED"');press(1,'Rainward.state.player.submerged');press(0,'!Rainward.state.player.submerged');check(True,'Classic B dives and A surfaces with matching live HUD prompts')
  press(9,'Rainward.mode==="pause"');nav('controlPreset');press(14);press(1,'Rainward.mode==="play"');wait('document.querySelector("#water-control").textContent==="HOLD B DIVE / GEAR STOWED"');check(True,'Switching back immediately restores the Survival hold-B prompt')
  p.evaluate('pad.connected=false');wait('Rainward.mode==="pause"');p.keyboard.press('Escape');wait('Rainward.mode==="play"');wait('document.querySelector("#water-control").textContent==="Z DIVE / GEAR STOWED"');p.keyboard.press('KeyZ');wait('Rainward.state.player.submerged');wait('document.querySelector("#water-control").textContent==="SPACE SURFACE / GEAR STOWED"');p.keyboard.press('Space');wait('!Rainward.state.player.submerged');check(True,'Disconnection pauses safely and keyboard-only dive/surface prompts remain usable')
  p.evaluate('pad.buttons[1]={pressed:true,value:1};pad.connected=true');frames(5);check(not p.evaluate('Rainward.state.player.submerged'),'A reconnect with B held cannot issue a dive before neutral input');p.evaluate('pad.buttons[1]={pressed:false,value:0}');frames(5)
  hold(1,'Rainward.state.player.submerged');p.wait_for_function('Rainward.state.player.oxygen<24',timeout=90000);wait('document.querySelector("#aquatic-hud").classList.contains("low-air")');check('Press A' in p.locator('#water-warning').inner_text(),'At low air, a persistent textual warning identifies A as the recovery control')
  p.set_viewport_size({'width':390,'height':844});frames(3);check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The expanded low-air message fits a phone-width viewport');p.screenshot(path=str(OUT/'low-air-phone.png'));p.set_viewport_size({'width':1180,'height':780})
  p.wait_for_function('Rainward.state.player.oxygen===0&&Rainward.state.player.hp<99',timeout=45000);check(True,'Natural oxygen exhaustion causes real drowning damage without changing the clock or health')
  press(0,'!Rainward.state.player.submerged');p.wait_for_function('Rainward.state.player.oxygen>99');hp=p.evaluate('Rainward.state.player.hp');frames(5);check(p.evaluate('Rainward.state.player.hp')==hp and not p.locator('#water-warning').inner_text(),'Surfacing stops oxygen damage and clears the low-air announcement')
  hold(1,'Rainward.state.player.submerged');p.wait_for_function('Rainward.mode==="dead"',timeout=120000);check(True,'Remaining underwater naturally reaches the native death interface');nav('result-retry');press(0,'Rainward.mode==="play"');check(p.evaluate('Rainward.state.player.hp===100&&Rainward.state.player.oxygen===100&&Rainward.state.player.waterMode!=="swim"&&Rainward.state.checkpoint==="natatorium-deck"'),'Xbox retry restores the real dry shelter checkpoint without persisting exhausted air')
'''
p=R/'tests/aquatic.py';s=p.read_text()
if '# Clear Water:' not in s:
 needle="  check(not errors and not dialogs,'No uncaught errors or native blocking dialogs occur during the water journey')"
 assert needle in s;s=s.replace(needle,EXTRA+needle);p.write_text(s)
for f in ['tests/aquatic.py','tests/first-light.py','tests/controller-menus.py']:
 p=R/f;s=p.read_text().replace("=='0.13.0'","==json.loads(Path('rainward/release.json').read_text())['version']").replace('loads Undertow v0.13.0','loads the declared gameplay release').replace('inside Undertow v0.13.0','inside the declared gameplay release');p.write_text(s)
for f in ['tests/aquatic.test.mjs','tests/reclaimed.test.mjs']:
 p=R/f;p.write_text(p.read_text().replace("assert.equal(W.VERSION,'0.13.0');","assert.equal(W.VERSION,'0.13.1');"))
edit('world.mjs',"export const VERSION='0.13.0';","export const VERSION='0.13.1';")
edit('index.html','v0.13.0','v0.13.1')
release=json.loads((R/'release.json').read_text());assert release['version'] in ['0.13.0','0.13.1']
release.update(version='0.13.1',build='rainward-clear-water-20260913',changes=['Show Survival HOLD B DIVE, Classic B DIVE and keyboard Z DIVE with the correct surface control','Add a textual low-air warning, bounded accessible oxygen meter and a non-flashing low-air border','Add normal-start living-enemy Xbox-standard Natatorium journeys with finite-ammo combat, reload, physical puzzle and extraction','Extend isolated water acceptance for preset changes, keyboard fallback, reconnect, natural exhaustion, recovery and shelter retry','Preserve all seven chapters, save keys and formats, water physics, enemy difficulty, finite inventory, art and soundtrack'])
put('release.json',json.dumps(release,indent=2)+'\n')
plan=json.loads((R/'production-plan.json').read_text());plan.update(release='0.13.1',edition='Clear Water',updated='2026-09-13')
c=plan['continuation'];c['scope']='Clear Water v0.13.1 adds water guidance and executable acceptance. The verifiedGameplay object retains the immutable Undertow baseline; CLEAR-WATER.md and the release PR record this upgrade and exact validation.';c['recordId']='rainward-clear-water-20260913';c['recordedAgainstMaster']='25f0a46bc5a082d4d99089a3e708441dd0039b14'
for x in c['openChecks']:
 if x['id']=='H-01':x.update(status='Automated',evidence='CLEAR-WATER.md',result='Normal-start Survival extraction passed at 9c651ffd47b2cfa1ade59945a7bf56d40c87a5ad in run 34789910532. Both-preset combat journeys and exact-release regression are additional release gates. No human or hardware sign-off.')
 if x['id']=='H-05':x.update(status='Implemented',evidence='tests/aquatic-prompts.test.mjs',result='Preset-aware live HUD and low-air warning are implemented. The native aquatic suite is the release gate for keyboard fallback, preset switching and recovery.')
for t in plan['items']:
 if t['id']=='RW-032':t.update(status='Implemented',evidence='CLEAR-WATER.md',resumeNote='The historical aquatic browser fixture isolated water with enemies defeated. A new normal-start living-enemy Survival mission has reached extraction; both presets now have an executable combat/reload journey. All-seven chapter, independent-player and hardware approval remain open.',nextAction='Retain exact-source normal-start mission results and add the remaining per-chapter, optional-station and independent-player reviews.')
 if t['id']=='RW-031':t.update(resumeNote='Clear Water adds preset-aware dive/surface instructions, accessible oxygen labels and a textual low-air warning without changing water physics or save state.',nextAction='Review optional stations, all pool-edge approaches, authored swim motion and water audio on real devices.')
plan['nextRelease']=['RW-035','RW-036','RW-014','RW-044']
if not any(r['url']=='CLEAR-WATER.md' for r in plan['references']):plan['references'].insert(0,{'title':'Clear Water upgrade and acceptance scope','url':'CLEAR-WATER.md'})
put('production-plan.json',json.dumps(plan,indent=2)+'\n')
p=R/'tests/handoff.test.mjs';s=p.read_text().replace("assert.equal(plan.release,'0.13.0');","assert.equal(plan.release,'0.13.1');").replace("assert.equal(plan.items.filter(t=>t.status==='Implemented').length,21);","assert.equal(plan.items.filter(t=>t.status==='Implemented').length,22);").replace("assert.equal(c.status,'Open');","assert.ok(['Open','Implemented','Automated'].includes(c.status));if(c.status!=='Open')assert.ok(c.evidence&&fs.existsSync(path.join(root,c.evidence))); ").replace('Continuation identifies the already published game without inventing a new gameplay release','Continuation identifies the current release while retaining immutable baseline evidence');put('tests/handoff.test.mjs',s)
p=R/'tools/build-production-plan.py';s=p.read_text().replace('Historical gameplay evidence: [Undertow receipt](evidence/undertow-v0.13.0/summary.json). This handoff is not a new gameplay release.','Historical baseline: [Undertow receipt](evidence/undertow-v0.13.0/summary.json). Current upgrade: [Clear Water](CLEAR-WATER.md).').replace("item['id']+' / '+', '.join(item['tasks'])","item['id']+' / '+item['status']+' / '+', '.join(item['tasks'])");put('tools/build-production-plan.py',s)
edit('CONTROLLER.md','# Rainward v0.13.0 /','# Rainward v0.13.1 /')
edit('CONTROLLER.md',"The HUD's generic B DIVE label is shorter than the Survival hold gesture; a clearer preset-aware water prompt is recorded as an open polish item, not claimed fixed by this documentation update.",'The water HUD now says HOLD B DIVE in Survival, B DIVE in Classic, and A SURFACE while submerged. Keyboard-only play shows Z DIVE and SPACE SURFACE. At 25 percent air or less while submerged, a textual low-air warning identifies the surface control. Its live region changes only on warning transitions, not on every frame. No automatic surfacing or oxygen-rule change is introduced.')
put('CLEAR-WATER.md','''# Rainward v0.13.1 / Clear Water

This continuation closes the first normal-start Natatorium browser-playthrough gap and implements the pending water-control prompt polish. It is a bounded interface and acceptance upgrade, not another chapter or a new physics system.

## Player-facing changes

The surface HUD now shows HOLD B DIVE for Survival, B DIVE for Classic, or Z DIVE without a controller. Submerged guidance shows A SURFACE or SPACE SURFACE. Air at or below 25 percent produces a textual recovery warning and a non-flashing double border. The progress meter has an accessible percentage label; the warning live region updates only when its text changes. Entry hints no longer give misleading controller-only commands to keyboard players.

## Preservation boundary

All seven expeditions, four pool volumes, patrol stats, weapons, puzzles, field tasks, sounds, art and resource limits are retained. No save migration is needed: the legacy checkpoint key, seven-slot chapter bank, backup key and checkpoint formats are unchanged. Deep water still stows weapons and blocks dry-only actions. The patch does not grant oxygen, change drowning damage, auto-surface the player or weaken enemies.

## Acceptance and retained failures

The new tests/natatorium-journey.py starts normally, with no installed checkpoint, all six authored enemies alive and only authored supplies. It uses virtual standard Xbox sticks/buttons with read-only route and screen-projection guidance. Actual movement, hit tests, enemy attacks, ammunition, reload, oxygen, puzzle controls, task interaction and extraction remain authoritative. The script targets both Survival and Classic. Video, snapshots, source manifest and failures are uploaded by the release workflow. An initial Survival extraction passed 11 checks on 9c651ffd47b2cfa1ade59945a7bf56d40c87a5ad in run 34789910532; the paired Classic attempt died to the pump sentinel. That failed route is retained, not relabeled as success. The next route adds real finite-ammo sentinel combat and reload rather than nerfing the encounter.

The existing tests/aquatic.py remains explicitly separate: its authored dry-shelter fixture has defeated enemies to isolate shaders, control changes, keyboard fallback, reconnect, low-air layout, natural oxygen exhaustion, recovery and death/retry. It is not evidence for a living-enemy mission. All six optional/required station interaction points retain model tests in water-hardening.test.mjs; a complete native optional-station tour and every pool-edge approach are still additional coverage, not claimed by the required-objective journey.

Local model/source checks passed. Local browser acceptance was blocked by the environment with net::ERR_BLOCKED_BY_ADMINISTRATOR; native validation therefore runs on GitHub Actions, not through a browser-policy workaround. The exact final candidate, full regression results, merge and public-byte receipt must be recorded in the release PR and evidence directory before declaring publication.

These are automated browser-standard input checks, not physical wired/Bluetooth Xbox certification, frame-rate certification, artistic approval or real-device listening review. Full regression and published-file hash matching remain release gates.

## Resume next

Keep the new mission and recovery suites in the matrix. The next feature work is H-02: authored swim/land blends and hand/foot contact review for the existing fitted humans. H-03 water/combat audio review and H-04 physical-controller/hardware acceptance remain open. RW-032 is only Implemented because its full criterion covers every chapter and review, not merely one automated Natatorium route.
''')
p=R/'DEVELOPMENT-HANDOFF.md';s=p.read_text()
if not s.startswith('# Current continuation / Clear Water'):p.write_text('''# Current continuation / Clear Water v0.13.1

Read CLEAR-WATER.md first, then this retained handoff and CONTROLLER.md. The active runtime is now the Clear Water patch candidate/release, not a request to rebuild Undertow. Its release PR and evidence directory are authoritative for final candidate, merge and publication verification. The historical verifiedGameplay record in production-plan.json deliberately retains the immutable Undertow receipt.

H-01 now has a normal-start living-enemy Survival extraction at source 9c651ffd47b2cfa1ade59945a7bf56d40c87a5ad (run 34789910532). Both-preset journeys additionally exercise finite-ammo sentinel combat and reload. H-05 is implemented by aquatic-prompts.mjs and aquatic-ui.mjs; the expanded native aquatic suite gates keyboard/preset/reconnect and oxygen recovery. Keep the Classic death from the first attempt as failed evidence, and require current-source green checks before publication. The current 64-item canonical board and regenerated checklist retain unapproved human gates.

Do not re-open completed prompt work merely because the historical section below calls it open. Continue H-02 motion and contact authoring next; water audio, optional-station/pool-edge browser coverage and physical Xbox/hardware review remain unfinished. Saves, patrols, geometry, water physics, weapons and content are not changed by this patch.

The following handoff is preserved as historical context. Its v0.13.0 build, counts, priorities and test-gap statements describe that baseline, not the latest patch.

'''+s)
p=R/'README.md';s=p.read_text()
if not s.startswith('# Rainward v0.13.1'):p.write_text('''# Rainward v0.13.1 / Clear Water

Current upgrade: [CLEAR-WATER.md](CLEAR-WATER.md). Survival/Classic/keyboard water instructions are now preset-aware, with an accessible low-air recovery warning. The normal-start Natatorium controller journey and isolated exhaustion/retry checks are retained beside the existing test matrix. All seven chapters and existing saves remain supported.

Continue with [DEVELOPMENT-HANDOFF.md](DEVELOPMENT-HANDOFF.md), [CONTROLLER.md](CONTROLLER.md), and the [canonical production plan](production-plan.json). The next feature work is authored swim/land animation and contact review. Physical Xbox/Bluetooth, audio-device and hardware approval remain open. The release PR and exact-source publication receipt distinguish candidate checks from the live build.

The sections below are retained historical release notes.

'''+s)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
