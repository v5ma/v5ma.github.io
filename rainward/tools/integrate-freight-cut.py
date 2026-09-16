"""Temporary exact-baseline integration; remove before merge."""
from pathlib import Path
import hashlib,json,subprocess
R=Path(__file__).resolve().parents[1]
PATCHES={'world.mjs': [('import {applyFloodgateRecut,recutHeight}', "import {applyFreightCut} from './freight-cut.mjs';\nimport {applyFloodgateRecut,recutHeight}"), ('applyFloodgateRecut(DISTRICT);', 'applyFloodgateRecut(DISTRICT);applyFreightCut(DISTRICT);')], 'supplies.mjs': [("hint(s,'Field task complete: '+target.label)", "hint(s,CURRENT.tasks?.find(t=>t.id===target.id)?.completionHint||'Field task complete: '+target.label)")], 'scene.mjs': [('import {createFloodgateRecutArt}', "import {createFreightCutArt} from './freight-cut-art.mjs';\nimport {createFloodgateRecutArt}"), ('recut=createFloodgateRecutArt(scene,A,chapter);', 'recut=createFloodgateRecutArt(scene,A,chapter),freightCut=createFreightCutArt(scene,A,chapter);'), ('recut.update(state);', 'recut.update(state);freightCut.update(state);'), ('visualStatus:()=>({recut:', 'visualStatus:()=>({freightCut:freightCut.stats(),recut:')], 'floodgate-content.mjs': [('When you have both components, follow the floodgate signs.', 'The south receiver also feeds the west loading shutter. The clinic battery can bring that circuit back. An open shutter offers a retreat into the market, but lookouts can see and follow through it. The north door stays open whether you repair the receiver or not. When you have both components, follow the floodgate signs.')]}
BASE_HASHES={'world.mjs': '1d3d3b400c6ffdb73321c0625bc1c9fc155e27080a613df8bc75e72d64ce3155', 'supplies.mjs': '30ac6d25f8473e0fab0fcdc9bf82a152c607c30f64b03142898acad180a0f1db', 'scene.mjs': '9ae08c90bc6ce98846aa5877d0f5030af74b0d257f5f62a8513798c521448e11', 'floodgate-content.mjs': '47969e60d5d98cce651899550be5c135fac3f6661a7b1d67d911800a38644562'}
marker=R/'FREIGHT-INTEGRATED.json'
if not marker.exists():
 for name,replacements in PATCHES.items():
  path=R/name;data=path.read_text()
  assert hashlib.sha256(data.encode()).hexdigest()==BASE_HASHES[name],(name,'baseline changed; review before applying')
  for old,new in replacements:
   assert data.count(old)==1,(name,old)
   data=data.replace(old,new)
  path.write_text(data)
 for name in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
  path=R/name;data=path.read_text();assert '0.14.1' in data,name;path.write_text(data.replace('0.14.1','0.15.0'))
 p=R/'release.json';release=json.loads(p.read_text());assert release['version']=='0.14.1';release.update(version='0.15.0',build='rainward-freight-cut-20260915',changes=['Give the existing optional freight receiver repair a real west loading passage into the market','Add a sorting baffle for a readable, flankable recovery landing; retain both original entrances','Connect clinic observation, receiver repair, spindle recovery, market retreat and original extraction','Preserve all seven chapters, existing task rewards, saves, Xbox presets and first-person/AR/VR views']);p.write_text(json.dumps(release,indent=2)+'\n')
 p=R/'production-plan.json';plan=json.loads(p.read_text());plan.update(release='0.15.0',edition='Freight Cut',updated='2026-09-15')
 plan['references'].insert(0,{'title':'Freight Cut experience, hypothesis and evidence boundaries','url':'FREIGHT-CUT.md'})
 for t in plan['items']:
  if t['id'] in ['RW-009','RW-011','RW-013','RW-028']:
   t['resumeNote']='Freight Cut links the established clinic/market seam to Freight Hall: the original optional receiver repair now opens a real, flankable loading passage. See FREIGHT-CUT.md; the complete flagship and human review remain unapproved.'
   t['nextAction']='Observe unfamiliar-player recovery and route-choice reasoning, then refine the quay observation/commitment beat. Preserve powered/unpowered completion and current legacy saves.'
 plan['continuation']['freightCut']={'status':'Implemented','tasks':['RW-009','RW-011','RW-013','RW-028'],'evidence':'FREIGHT-CUT.md','baseline':'107c631a11d773ffdedbf39f5662618189bb7cc8','sharedReference':'../level-design-library/STUDIO-LEVEL-DESIGN-MANUAL.md','hypothesis':'An optional receiver repair that changes collision, sightlines and pursuit routes makes learned geography useful for recovery.','physicalDevices':'Not tested','unfamiliarPlayers':'Not reviewed'}
 p.write_text(json.dumps(plan,indent=2)+'\n')
 prefix='# Current release / Freight Cut v0.15.0\n\nRead FREIGHT-CUT.md. The existing ward-radio repair now releases a west loading passage; its sorting landing connects the spindle aisle back to market concealment and the established clinic terrace. Both original freight entrances and unpowered extraction remain valid. Wayfinder and Open Diorama are already merged; do not rebuild their features. No new save fields, task IDs, rewards or controller mappings are introduced. Follow the current shared library and exact release receipt; human and physical-device gates stay open.\n\n'
 for name in ['README.md','DEVELOPMENT-HANDOFF.md','CONTROLLER.md']:
  p=R/name;p.write_text(prefix+p.read_text())
 subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
 p=R/'tests/diorama-browser.py';data=p.read_text()
 for old,new in [("KIND=os.getenv('QUEST_KIND'", "CHAPTER=os.getenv('TEST_CHAPTER','natatorium')\nKIND=os.getenv('QUEST_KIND'"),("BASE+'/rainward/?chapter=natatorium'", "BASE+'/rainward/?chapter='+CHAPTER"),("Rainward.state.enemies.length===6&&Rainward.state.enemies.every(e=>e.hp>0)","Rainward.state.enemies.length==='+str(5 if CHAPTER=='district' else 6)+'&&Rainward.state.enemies.every(e=>e.hp>0)"),('normal mission with six living enemies','normal selected mission with all its living enemies')]:
  assert data.count(old)==1,(p.name,old);data=data.replace(old,new)
 p.write_text(data)
 library=R.parent/'level-design-library'/'GAME-RECOMMENDATIONS.md';text=library.read_text();needle='Recommended benchmark influences: The Last of Us Part II for authored density and recovery spaces, Dishonored for stealth-route choice, Half-Life for understandable environmental state changes, and immersive sims for dependable interaction rules.'
 assert text.count(needle)==1,'Reconcile current Rainward library note'
 text=text.replace(needle,needle+'\n\nSource-reconciled Rainward iteration: Freight Cut 0.15.0 gives the already-existing optional ward-radio repair a real west loading passage, shared by body collision, shots, sight and NPC navigation. It reuses the clinic terrace and return loop rather than rebuilding them. Read ../rainward/FREIGHT-CUT.md and its publication receipt before assigning evidence status. No new checkpoint field, reward, task or mandatory objective is added; unpowered extraction remains valid. Human first/replay understanding and physical-device approval remain open.')
 library.write_text(text)
 marker.write_text(json.dumps({'baseline':'107c631a11d773ffdedbf39f5662618189bb7cc8','release':'0.15.0','scope':'Rainward and one Rainward-only shared-library paragraph'},indent=2)+'\n')
