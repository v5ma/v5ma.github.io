"""Apply the 2026-09-13 documentation handoff without changing gameplay.
Read canonical data, preserve all task IDs/statuses/dependencies, regenerate the
checklist, and expose continuation notes on the existing production board.
"""
from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[1]
plan=json.loads((R/'production-plan.json').read_text())
assert plan['release']=='0.13.0','Reconcile with the newer game release before applying this historical handoff'
if plan.get('continuation',{}).get('recordId')=='rainward-handoff-20260913':
 print('Handoff already integrated.');raise SystemExit(0)
expected={'production-plan.json':'6e25a752f06350e6966c8364cd56e0ed07c97a02','README.md':'c06557ba151c4ded16faed4d78e2b1472a4675b1','roadmap.html':'deab87ba13f8daee143658171d368ab548d3703e','roadmap.mjs':'103a41cd7b083b5b35ff3bf89764b3a0dc6cb8a1','tools/build-production-plan.py':'986857187f51df2f373622eef6f484910924ebbd'}
for name,sha in expected.items():
 data=(R/name).read_bytes();actual=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 assert actual==sha,('Concurrent change: reconcile before writing',name,actual)
updates={}
def edit(name,before,after):
 text=updates.get(name,(R/name).read_text());assert text.count(before)==1,(name,before[:70]);updates[name]=text.replace(before,after)
plan['updated']='2026-09-13'
plan['continuation']={
 'schema':1,'recordId':'rainward-handoff-20260913','startHere':'DEVELOPMENT-HANDOFF.md','controls':'CONTROLLER.md',
 'recordedAgainstMaster':'a43d01ddd75ac7c07280e660f7dcba2282214c8f',
 'verifiedGameplay':{'version':'0.13.0','edition':'Undertow','pullRequest':137,'mergeCommit':'531a4a8e8c1a2be32437a44b81208572ad36ad04','acceptedHead':'d673fa6acb4262fc8f6a9b25cff7f4acb0aceb8b','evidence':'evidence/undertow-v0.13.0/summary.json','publicationRun':34738570590,'historicalPublicFiles':128},
 'scope':'Documentation continuation record; no gameplay bump, new feature completion or human acceptance is implied.',
 'ownerRequirements':['Continue the existing Rainward game; preserve all seven chapters and saves.','Complete gameplay AND UI with an Xbox controller, including reload and dialog cancellation.','Commit, merge, publish and verify each completed upgrade. Retry transient GitHub failures without overriding access or concurrent work.','Prioritize believable human/environment detail, meaningful enemies/tasks, original sound and music, and integrated water missions/shaders.','Self-host appropriately licensed free assets; no paid runtime provider, API key or account requirement.'],
 'queueIsProposal':True,
 'openChecks':[
  {'id':'H-01','tasks':['RW-032','RW-031','RW-028'],'status':'Open','action':'Record a living-enemy Natatorium browser mission from normal start to extraction. Preserve oxygen, enemy, task, puzzle and resource rules.','acceptance':'Both components, puzzle and required tasks complete using ordinary inputs; no safe fixture or model teleport substitutes for this run.'},
  {'id':'H-02','tasks':['RW-035','RW-036','RW-014'],'status':'Open','action':'Author swimming and land-action blends, then hand/foot contacts for the fitted seventeen-bone humans.','acceptance':'Before/after motion review, no collar/cuff gaps, no animation authority over collision, and no broken reload/craft/heal or dive/surface transitions.'},
  {'id':'H-03','tasks':['RW-044','RW-045','RW-046','RW-048'],'status':'Open','action':'Review and improve water/combat Foley, room acoustics, score transitions and dramatic silence.','acceptance':'Measured output and recorded real-device listening review; non-silent synthesis alone is insufficient.'},
  {'id':'H-04','tasks':['RW-006','RW-049','RW-050','RW-052','RW-054'],'status':'Open','action':'Run real wired/Bluetooth Xbox and named hardware checks; retain complete controller navigation.','acceptance':'Both presets, menus, held actions, reconnect, water entry, oxygen and browser audio activation are documented on actual devices.'},
  {'id':'H-05','tasks':['RW-031','RW-050'],'status':'Open','action':'Make water prompts explicit about the Survival hold-B gesture rather than the generic B DIVE label.','acceptance':'Preset-aware prompts match actual dive/surface behavior on controller and keyboard; text changes do not alter the input mapping.'}
 ],
 'notImplemented':['Human-shield grab (RW-022)','Separate deployable trap (RW-023)','Arbitrary window/ledge/gap traversal (RW-030)','Imported authored animation library and contact IK','Free vertical swimming, underwater firearms/enemies, current physics and drowning cinematics','Full VR gameplay, multiplayer and native packaging'],
 'keepHistoricalFailures':True
}
refs=[{'title':'Resume development in another chat','url':'DEVELOPMENT-HANDOFF.md'},{'title':'Current Survival, Classic and water controls','url':'CONTROLLER.md'},{'title':'Undertow gameplay release evidence','url':'evidence/undertow-v0.13.0/summary.json'}]
plan['references']=refs+[r for r in plan['references'] if r['url'] not in {x['url'] for x in refs}]
plan['nextRelease']=['RW-032','RW-014','RW-035','RW-036','RW-044']
notes={
 'RW-003':('Satchel equipment buttons and full menu navigation are implemented. CONTROLLER.md now distinguishes Survival, Classic and water overrides.','Record the physical controller journey without using a mouse to close any in-game panel.'),
 'RW-005':('Historical Undertow evidence: 271 model/source tests and 18 native suites passed at d673fa6. Evidence is archived, not a certification of a later candidate.','Keep the full regression matrix and record exact candidate/merge hashes and any failed attempt.'),
 'RW-006':('Physical wired/Bluetooth Xbox, speaker/headphone and device-signoff evidence is still absent. Browser-standard simulated input is a separate scope.','Test both presets, reload, menus, held crafting/healing, water controls, focus loss and reconnect on physical hardware.'),
 'RW-008':('The cross-chat handoff, current controller contract and durable Undertow receipt are now linked beside the canonical plan.','Update continuation metadata and regenerate the Markdown checklist after each release; never edit generated status alone.'),
 'RW-025':('Natatorium is the seventh chapter; the previous six still exist. This corrects an outdated six-chapter label, not a new gameplay addition.','Retain all seven IDs and avoid fixed chapter counts in navigation, saves and tests.'),
 'RW-028':('The route/pacing audit now includes Northlight Natatorium. The exposed-quay no-kill failures remain useful evidence for the older Floodgate route.','Review risk/reward and recovery routes without silently nerfing encounters merely to make tests pass.'),
 'RW-031':('Undertow is published. Camera basin depth, pool-edge clipping, slab/lane/caustic layering, dry interactions and cancellation/refunds are covered. Swimming uses the horizontal crawl rig and toggle depth, not free vertical motion.','Close the living-enemy water playthrough and physical-controller gaps, then improve swim animation and preset-aware dive prompts.'),
 'RW-032':('All 18 browser suites passed, but the aquatic browser fixture defeats enemies at a real shelter. Model interactions cover the complete water mission separately.','Record the Natatorium from a normal start through submerged fuse, dry spindle, puzzle, required tasks and extraction with living enemies.'),
 'RW-034':('Imported CC0 Quaternius Standard face/hands/hair are fitted to the existing seventeen-bone rig and original clothing. The paid Source edition was not used; this is not a fully original final hero sculpt.','Keep license/hash provenance, collars/cuffs, independent skeletons, attachment fit, fallback and distance-detail tests during character upgrades.'),
 'RW-035':('The original procedural animation still drives the imported detail. The free animation library was inspected but its clips were not integrated; swimming currently reuses the horizontal crawl pose.','Prototype authored swim/tread/dive/surface and land-action transitions with before/after motion capture and preserved gameplay timing.'),
 'RW-036':('Hand/foot contact IK is not implemented or approved. The collar/wrist seam fixes are geometry compatibility, not contact animation.','After action blending, validate slopes/stairs, weapon grips and authored traversal contacts without changing collision authority.'),
 'RW-039':('Rain-film and pool/caustic shaders are implemented; the pool additions add no new fullscreen target. The existing cinematic pipeline still has its own render targets.','Review daylight, interior, wet/dry and submerged transitions on both quality tiers, preserving shader composition and fallbacks.'),
 'RW-040':('Source rights are in assets/humans/manifest.json and original notices. Historical source downloads/tests may expire as Actions artifacts.','Retain reproducible author downloads and exact hashes; never rely on signed temporary URLs or claim paid Source assets were used.'),
 'RW-041':('Seven chapter arrangements now include Tiles Below the Surface. This corrects the old six-chapter score label without claiming a final subjective mix.','Preserve existing music preferences and composition provenance while reviewing transitions and repetition.'),
 'RW-044':('The owner explicitly prioritizes in-game sound effects and music. Rendered samples and live analyser checks establish output, not a good mix.','Review Foley timing, material variation and water/combat cues on headphones and speakers, then record what was improved.'),
 'RW-048':('Final human/device listening approval remains open despite passing synthesis, stereo and sample-rate tests.','Record actual listening judgments separately from numerical levels and simulated input.'),
 'RW-050':('Water HUD currently says B DIVE, while the documented Survival gesture is hold B. The desired wording fix is not included in this documentation change.','Make prompts preset-aware, test readability while oxygen is low, and keep color-independent cues.'),
 'RW-054':('Desktop 1080p/60 fps and reduced-tier 30 fps remain proposed targets, not measurements. Slow software-rendered CI is not a real GPU benchmark.','Name hardware and measure frame-time percentiles, memory and representative water/urban routes before approval.'),
 'RW-058':('Original Undertow source manifest and public-hash receipt are archived under evidence/undertow-v0.13.0. 128 is a historical file count, not a fixed future gate.','Save exact test/publication evidence for each new commit and keep failed evidence and fixture limits.'),
 'RW-060':('No two-hour, seven-chapter save-migration/long-session acceptance is claimed. Six-slot banks and v1-v4 checkpoints must remain compatible.','Test repeated deaths, retries, swaps, field-record persistence and storage failure without clearing player storage.'),
 'RW-062':('The Undertow Pages deploy job was cancelled, but a public fetch/hash verifier confirmed delivery. Concurrent sibling deployments can supersede jobs.','Rehearse a scoped rollback and verify actual live bytes instead of inferring success from a scheduled or cancelled build.')
}
for t in plan['items']:
 if t['id'] in notes:t['resumeNote'],t['nextAction']=notes[t['id']]
 if t['id']=='RW-025':
  t['title']='Seven authored expedition foundations';t['acceptance']='Floodgate, Conservatory, Terminus, Meridian, Breakwater, Whiteout and Natatorium retain distinct footprints, objectives and physical puzzle gates.'
 if t['id']=='RW-028':t['acceptance']=t['acceptance'].replace('all six chapters','all seven chapters')
 if t['id']=='RW-041':
  t['title']='Original seven-chapter adaptive score';t['acceptance']=t['acceptance'].replace('Six distinct arrangements','Seven distinct arrangements')
updates['production-plan.json']=json.dumps(plan,indent=2)+'\n'
intro='''## Continue development / 2026-09-13

Start with [DEVELOPMENT-HANDOFF.md](DEVELOPMENT-HANDOFF.md), the current [controller contract](CONTROLLER.md), and the canonical [production plan](production-plan.json). The [generated checklist](AAA_CHECKLIST.md) and [interactive board](roadmap.html) use the same task IDs. Historical Undertow release evidence is preserved in [evidence/undertow-v0.13.0/summary.json](evidence/undertow-v0.13.0/summary.json).

Undertow is already merged and publicly verified: PR 137, merge 531a4a8e8c1a2be32437a44b81208572ad36ad04. Seven chapters are available. Do not resume by rebuilding the interrupted candidate. The next recommended work closes the living-enemy Natatorium playthrough gap, improves character motion/contacts and continues audio polish with full controller operation.

The sections below are historical release notes, not current control or feature-limit specifications. In particular, earlier single-slot saves, no-swimming statements and X-only reload descriptions are superseded by the current handoff and controller contract. This documentation refresh does not change the gameplay version.

'''
edit('README.md','# Rainward v0.13.0 / Undertow\n\n','# Rainward v0.13.0 / Undertow\n\n'+intro)
# Correct the handoff's source map against the inspected runtime: pool shaders
# are functions in natatorium-art.mjs, not a separate pool-shader.mjs module.
edit('DEVELOPMENT-HANDOFF.md','pool-layout.mjs, pool-shader.mjs, camera-core.mjs','pool-layout.mjs, camera-core.mjs')
link='<p class="micro"><a id="resume-handoff" href="./DEVELOPMENT-HANDOFF.md">RESUME DEVELOPMENT / CROSS-CHAT HANDOFF</a> &nbsp; <a id="current-controls" href="./CONTROLLER.md">CURRENT CONTROLLER GUIDE</a></p>'
edit('roadmap.html','<section class="metrics"',link+'\n<section class="metrics"')
# Keep the supplied template aligned; old initialization is not a reset path.
if (R/'tools/roadmap.html.template').exists():
 text=(R/'tools/roadmap.html.template').read_text();assert text.count('<section class="metrics"')==1
 updates['tools/roadmap.html.template']=text.replace('<section class="metrics"',link+'\n<section class="metrics"')
edit('roadmap.mjs','[t.id,t.title,t.owner,t.acceptance,t.evidence]','[t.id,t.title,t.owner,t.acceptance,t.evidence,t.resumeNote||\'\',t.nextAction||\'\']')
edit('roadmap.mjs','   if(task.evidence&&safeLink(task.evidence))',"   if(task.resumeNote)body.append(element('p','Continuation: '+task.resumeNote,'meta'));if(task.nextAction)body.append(element('p','Next action: '+task.nextAction,'meta'));\n   if(task.evidence&&safeLink(task.evidence))")
edit('tools/build-production-plan.py','for phase in plan[\'phases\']:\n',"if plan.get('continuation'):\n lines += ['## Resume from another chat','','Start with [DEVELOPMENT-HANDOFF.md](DEVELOPMENT-HANDOFF.md) and [CONTROLLER.md](CONTROLLER.md).','Historical gameplay evidence: [Undertow receipt](evidence/undertow-v0.13.0/summary.json). This handoff is not a new gameplay release.','']\n for item in plan['continuation'].get('openChecks',[]):\n  lines += ['- [ ] '+item['id']+' / '+', '.join(item['tasks'])+' / '+item['action'],'  Acceptance: '+item['acceptance'],'']\nfor phase in plan['phases']:\n")
edit('tools/build-production-plan.py',"(ROOT/'AAA_CHECKLIST.md').write_text", "  if t.get('resumeNote'):lines += ['  Continuation: '+t['resumeNote']]\n  if t.get('nextAction'):lines += ['  Next action: '+t['nextAction'],'']\n(ROOT/'AAA_CHECKLIST.md').write_text")
for name,text in updates.items():
 (R/name).write_text(text);print('Updated',name)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
print('Preserved all 64 task IDs, statuses, reviewers and dependencies. No gameplay source changed.')
