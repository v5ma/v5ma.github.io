"""Initialize the plan once; subsequently regenerate Markdown from canonical JSON.
Existing delivery statuses are never reset by rerunning this script.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
PHASES=[
('G0','Release foundation','Close regressions before adding more content.','All supported input paths start, save, reload and produce audio without uncaught errors.'),
('G1','Flagship vertical slice','Make one complete segment worth playing repeatedly.','A 15-20 minute Floodgate slice passes an art review and a recorded, independent player test.'),
('G2','Combat and stealth','Make each encounter readable, fair and expressive.','Melee, ranged, evasion, detection and resource economies hold up across repeat encounters.'),
('G3','Campaign and world','Expand authored variety rather than duplicating rooms.','Every chapter has a distinct route, pacing plan, task arc and verified beginning-to-end playthrough.'),
('G4','Art and animation','Bring characters and places to a consistent production standard.','Camera-matched art reviews approve the hero, enemies, animation, architecture, effects and lighting.'),
('G5','Sound and music','Make sound useful, emotional and dependable.','Every audible action has an appropriate cue; music transitions and mixes pass measured and listening reviews.'),
('G6','Accessibility and performance','Measure the actual target devices and input methods.','The agreed hardware matrix meets its frame-time, memory, readability and accessibility targets.'),
('G7','Release and production','Ship a supported game with repeatable evidence.','Release blockers are closed, rights are documented, saves migrate, and a rollback has been rehearsed.')]
# priority | title | status | owner role | acceptance | evidence | dependency IDs
ROWS='''P0|Audio context rate compatibility|Automated|Audio engineering|Audio graph renders at 24, 44.1, 48 and 96 kHz; live playback starts after a permitted user action.|tests/soundscape.py|
P0|Independent chapter shelter saves|Automated|Gameplay engineering|Six chapter checkpoints coexist; restarting one changes no other slot; current legacy saves migrate without loss.|tests/field-ready.test.mjs|
P0|Controller-reachable equipment|Implemented|UI engineering|Select each gun and tool in the satchel, then return using B; keyboard and touch have the same equipment access.|field-ready-ui.mjs|
P0|Finite inventory and save validation|Automated|Gameplay engineering|Reloading, switching, pickup, restore and cancellation cannot duplicate ammunition, supplies or completed tasks.|tests/survival-sound.test.mjs|
P0|Current native acceptance suite|Implemented|QA engineering|All native journeys run on the exact release source; failures remain visible and no required assertions are skipped.|tests/|
P0|Controller and audio device acceptance|Planned|Hardware QA|Record wired and Bluetooth Xbox playthroughs with menus, disconnect, audio activation, crafting and healing on real hardware.||RW-003,RW-005
P1|Save recovery and write-failure handling|Automated|Gameplay engineering|Corrupt primary data recovers a valid backup; storage failure never overwrites the last valid primary or legacy mirror.|tests/field-ready.test.mjs|RW-002
P1|Versioned production checklist|Implemented|Production|Each task has an owner role, priority, acceptance criterion, status, dependencies and evidence; every release updates the board.|production-plan.json|
P0|Vertical-slice design lock|Planned|Game direction|Approve one 15-20 minute Floodgate slice: approach, stealth, discovery, escalation, recovery and extraction, with no filler.||RW-005
P0|Readable first encounter|Planned|Encounter design|First-time players identify cover, patrol direction and their objective without needing an outside explanation.||RW-009
P1|Playable alternate approach|Planned|Level design|The slice supports at least two meaningfully different routes; both are collision-tested and have different risk/reward.||RW-009
P1|Stealth-to-combat-to-recovery pacing|Planned|Systems design|A recorded playthrough moves through all three states without unavoidable damage, empty downtime or an inventory dead end.||RW-010
P1|Environmental story beat|Planned|Narrative design|An original scene communicates who lived here and why the player should care, using space and interaction rather than a text dump.||RW-009
P0|Hero scene art benchmark|Planned|Art direction|Approve fixed-camera images and motion captures of the slice in daylight, rain and interior lighting.||RW-033
P0|Independent player study|Planned|User research|Record five unfamiliar players; proposed gate: at least four complete the slice and explain core controls without intervention.||RW-010,RW-011,RW-012
P0|Slice approval gate|Blocked|Game direction|Game owner approves the complete slice after playtest, art review and hardware/performance review; record rejected points too.||RW-006,RW-014,RW-015,RW-054
P1|Survival controller action mapping|Automated|Gameplay engineering|Tap/hold B, X melee, LB dodge, RB listen, LT+X reload and menu controls remain distinct and neutral-arm after mode changes.|tests/survival-sound.test.mjs|
P1|Telegraphed enemy attack windows|Implemented|Combat design|Windup, impact, recovery and counter windows are visually and audibly legible for every enemy role.|monsters.mjs|RW-017
P1|Melee hit reaction and tools|Implemented|Combat engineering|Contacts respect range, facing, walls, stamina and durability; animation and feedback must be reviewed at game speed.|survival.mjs|
P1|Ranged weapon handling polish|Planned|Combat design|Tune aim speed, recoil, spread, reticle and reload poses on controller; validate sidearm and rifle as distinct choices.||RW-006,RW-019
P1|Patrol communication and search variety|Planned|AI design|Enemies share only plausible information, search a remembered location, flank through navigable routes and eventually stand down.||RW-018
P1|Human-shield grab prototype|Planned|Combat engineering|Prototype the requested grab with animation, escape/release, enemy response, controller prompts and non-blocking state transitions.||RW-019,RW-035
P1|Deployable distraction/trap tool|Planned|Systems design|Add a finite, craftable deployable with clear placement preview, enemy interaction, counters, cleanup and checkpoint rules.||RW-004,RW-020
P1|Resource economy playtest|Planned|Systems design|Record stealth, mixed and combat-heavy runs; demonstrate recovery paths without infinite resource farming or mandatory grinding.||RW-020,RW-023
P1|Six authored expedition foundations|Implemented|Level design|Floodgate, Conservatory, Terminus, Meridian, Breakwater and Whiteout retain distinct footprints, objectives and physical puzzle gates.|world.mjs|
P1|Chapter task and dependency graph|Implemented|Mission design|Required work blocks extraction correctly; optional work remains optional; rewards and journal state survive checkpoints.|field-tasks.mjs|
P1|Campaign progression and chapter saves|Implemented|Gameplay engineering|Continue the chosen chapter or latest shelter without erasing other expeditions; distinguish unsaved progress clearly.|checkpoint-store.mjs|RW-002
P1|Chapter route and pacing audit|Planned|Level design|Review all six chapters for landmarks, shortcuts, sightlines, supply spacing, backtracking and encounter rhythm.||RW-016,RW-025
P1|New puzzle interaction families|Planned|Puzzle design|Build a prototype unlike the existing wheels or linked breakers, with in-world clues, reset safety and optional layered hints.||RW-028
P1|Collision-authored window and ledge traversal|Planned|Traversal engineering|Build supported windows, ledges and gaps with valid starts/landings, camera clearance and enemy navigation; do not promise arbitrary traversal.||RW-035
P2|Swimming and water encounter design|Planned|Traversal design|Prototype buoyancy, boundaries, exit points, camera, input and enemy interactions together before introducing swim-required routes.||RW-030
P1|Complete campaign playthrough evidence|Planned|QA|Record each chapter from start through all required work to extraction with ordinary inputs, preserving exact build and save evidence.||RW-024,RW-028,RW-029
P0|Original visual direction bible|Planned|Art direction|Approve proportions, silhouettes, architecture, materials, palette and visual hierarchy; use references for direction, not copied assets.||
P1|Production hero character|Planned|Character art|Build an original coherent hero mesh with clothing layers, facial detail, UVs and LODs; compare against the current procedural rig.|actors.mjs|RW-033
P1|Authored locomotion and action clips|Planned|Animation|Approve walk, run, crouch, crawl, turn, aim, reload, strike, stagger, vault, heal and craft transitions without visible snapping.||RW-034
P1|Foot placement and hand contacts|Planned|Technical animation|Feet follow slopes and stairs; hands align to weapons and traversal contacts; solve IK failures without destabilizing gameplay.||RW-035
P1|Enemy silhouettes and reactions|Planned|Character art|Every enemy role is recognizable in silhouette and motion, with distinct clothing/body treatment and readable damage states.||RW-033,RW-035
P1|Architecture and prop production kit|Planned|Environment art|Replace conspicuous repeated blocks with an original modular kit, trim details, usable interiors and authored wear at consistent scale.|ASSET-PIPELINE.md|RW-033
P1|Lighting and VFX scene continuity|Planned|Lighting art|Review interior/exterior transitions, shadows, rain, puddles, smoke, muzzle flashes and restrained effects on both graphics tiers.|VISUAL-UPGRADE.md|RW-038
P1|Asset optimization and provenance|Implemented|Technical art|Every imported asset retains source/license/hash records; final hero and environment assets also need LOD, memory and streaming review.|assets/|RW-034,RW-038
P1|Original six-chapter adaptive score|Implemented|Music|Six distinct arrangements respond to danger and listening; composition quality and emotional pacing still require listening review.|audio-design.mjs|RW-001
P1|Stereo direction and obstacle muffling|Automated|Audio engineering|Source distance and camera orientation affect output; walls muffle sounds; mono does not remove caption direction.|tests/field-ready.test.mjs|RW-001
P1|Layered Foley and action cues|Implemented|Sound design|Movement surfaces, shots, reload stages, impacts, cloth, crafting, healing, creatures, mechanisms and supplies have distinct cues.|audio.mjs|
P1|Authored Foley listening pass|Planned|Sound design|Review loudness, texture, timing, repetition and material realism for every cue on headphones and speakers; replace weak placeholders.||RW-043
P1|Room-aware reverb and sound portals|Planned|Audio engineering|Interiors, streets, tunnels and courtyards use coherent acoustic transitions without leaking high-cost node allocation.||RW-042
P1|Musical transitions and dramatic silence|Planned|Music|Author bar-aligned transitions, exploration variation, combat exit and silence so the score does not loop mechanically or mask cues.||RW-041
P1|Mixer accessibility and output budgets|Implemented|Audio engineering|Independent sliders, mono, night mix and captions remain controller reachable; voice and sample-cache budgets stay bounded.|audio-mixer.mjs|RW-001
P1|Final mix and device listening approval|Planned|Audio QA|Measure peaks and dynamic range, then record subjective approval on headphones, laptop speakers and a TV with real controller play.||RW-044,RW-045,RW-046,RW-047
P1|Full remapping and hold alternatives|Planned|Accessibility engineering|Offer remapping, conflict resolution, hold/toggle alternatives and readable per-device prompts; test every resulting action path.||RW-017
P1|Caption and interface readability|Planned|UI accessibility|Review text size, contrast, safe areas, caption direction, speaker identification and color-independent signals across target displays.||RW-047
P1|Reduced motion and adjustable HUD|Implemented|UI engineering|Players can reduce environmental motion and disable quiet-HUD fading without removing necessary gameplay information.|survival-ui.mjs|
P0|Target hardware matrix|Planned|Technical direction|Name the actual CPU/GPU/RAM, browser, display resolution, controller and audio device for each supported tier before claiming performance.||
P1|Repeatable performance capture|Planned|Performance engineering|Record p50/p95/p99 frame time, long frames, draw calls, memory and load time on a fixed route and exact build.||RW-052
P0|Frame-time acceptance|Blocked|Performance QA|Proposed targets, not current claims: desktop 1080p/60 fps and reduced tier 30 fps; agree hardware and pass sustained representative scenes.||RW-039,RW-053
P1|Memory, streaming and graphics recovery|Planned|Engine engineering|Bound assets and caches, test repeated chapter swaps, slow downloads and WebGL context loss; preserve checkpoint data on recovery.||RW-040,RW-053
P1|Browser and device regression matrix|Planned|Compatibility QA|Run agreed browser/OS/controller combinations, phones and focus-loss scenarios; scope VR separately from desktop certification.||RW-006,RW-052
P0|Staffing, budget and ownership plan|Planned|Production|Assign real owners and review capacity; estimate content and asset costs before setting a release date. Roles here are not staffing claims.||RW-016
P1|Deterministic builds and evidence|Implemented|Build engineering|Link every release to exact source, test reports, asset manifest and published file hashes; keep failed evidence.|tests/release.py|
P1|Asset rights and public-source boundary|Automated|Release engineering|Check licensed assets, vendored notices, local runtime imports and absence of confidential material or service credentials.|tests/public.test.mjs|
P1|Long-session and save migration QA|Planned|QA|Run proposed two-hour sessions with repeated deaths, restarts, chapter changes and old saves; log every regression and reproduction.||RW-032,RW-055
P1|Player-facing known issues and support|Planned|Production|Publish supported devices, known limitations, save recovery instructions and a clear issue-reporting path before release.||RW-056,RW-060
P1|Rollback rehearsal|Planned|Release engineering|Rehearse reverting a release without deleting saves or changing sibling games, then verify public hashes again.||RW-058
P2|Optional platform expansion decision|Planned|Game direction|Decide separately whether full VR, native packaging or multiplayer serves the game; each needs its own cost, input and QA plan.||RW-057
P0|Release candidate approval|Blocked|Game direction|Close critical defects and obtain player, art, audio, accessibility and hardware sign-off. A green checklist alone is not AAA quality.||RW-016,RW-032,RW-048,RW-054,RW-056,RW-060,RW-061,RW-062'''
file=ROOT/'production-plan.json'
if not file.exists():
 rows=[s.split('|') for s in ROWS.splitlines() if s.strip()]
 assert len(rows)==64 and all(len(r)==7 for r in rows)
 plan={'schema':1,'game':'Rainward','release':'0.10.0','edition':'Field Ready','baseline':'c942abeda531879a709ee606190ca0e4886f19e7','updated':'2026-09-12','purpose':'A proposed production path toward AAA-quality finish, not a claim of current AAA status, a funded schedule or platform certification.','policy':'Canonical delivery statuses change only in a reviewed source commit. Browser checkmarks are local review notes, not proof of implementation. Proposed targets require owner approval. Preserve all six chapters, saves, sibling applications and asset credits.','statusDefinitions':{'Planned':'Not implemented to the stated criterion.','Implemented':'A working foundation exists; the full criterion still needs review.','Automated':'The specifically scoped automated criterion has evidence; physical devices and player enjoyment are not certified.','Blocked':'The approval gate depends on unfinished work.','Approved':'The criterion has a named reviewer and recorded sign-off.'},'phases':[dict(id=a,name=b,goal=c,gate=d) for a,b,c,d in PHASES],'references':[{'title':'Existing roadmap baseline','url':'roadmap-legacy-v06.html'},{'title':'Web Audio API best practices','url':'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices'}],'nextRelease':['RW-009','RW-010','RW-014','RW-034','RW-035'],'items':[]}
 for i,(priority,title,status,owner,acceptance,evidence,depends) in enumerate(rows):
  plan['items'].append(dict(id=f'RW-{i+1:03}',phase=f'G{i//8}',priority=priority,title=title,status=status,owner=owner,acceptance=acceptance,evidence=evidence,depends=depends.split(',') if depends else [],estimate='Unestimated',reviewer='Unassigned'))
 file.write_text(json.dumps(plan,indent=2)+'\n')
plan=json.loads(file.read_text())
lines=['# Rainward: AAA-quality production checklist','','Release baseline: v'+plan['release']+' / Field Ready.','',plan['purpose'],'',plan['policy'],'','## Status legend','']
for k,v in plan['statusDefinitions'].items():lines.append(k+': '+v)
lines+=['','Canonical data: [production-plan.json](production-plan.json). Interactive board: [roadmap.html](roadmap.html).','Each checkbox remains open until human acceptance is recorded. Automated status is narrower than final approval.','']
for phase in plan['phases']:
 lines+=['## '+phase['id']+' / '+phase['name'],'',phase['goal'],'','Gate: '+phase['gate'],'']
 for t in plan['items']:
  if t['phase']!=phase['id']:continue
  lines += [f"- [{'x' if t['status']=='Approved' else ' '}] {t['id']} / {t['priority']} / {t['title']} / {t['status']}",f"  Owner role: {t['owner']}. Assigned reviewer: {t['reviewer']}. Effort: {t['estimate']}.",f"  Acceptance: {t['acceptance']}","  Dependencies: "+(', '.join(t['depends']) or 'None')+'.',"  Evidence: "+(t['evidence'] or 'Not recorded yet')+'.','']
(ROOT/'AAA_CHECKLIST.md').write_text('\n'.join(lines)+'\n')
print('Built',len(plan['items']),'production tasks and the Markdown checklist.')
