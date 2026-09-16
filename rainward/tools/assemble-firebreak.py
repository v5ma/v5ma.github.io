"""One-time Rainward-only assembly; deletes itself before exact-source acceptance."""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
def rep(file,old,new):
 p=R/file;s=p.read_text();assert s.count(old)==1,(file,'source diverged',s.count(old));p.write_text(s.replace(old,new))
rep('world.mjs',"import {applyFloodgateRecut,recutHeight}","import {applyFreightFirebreak} from './freight-firebreak.mjs';\nimport {applyFloodgateRecut,recutHeight}")
rep('world.mjs','applyFloodgateRecut(DISTRICT);','applyFloodgateRecut(DISTRICT);applyFreightFirebreak(DISTRICT);')
rep('world.mjs',"if(o.openOnTask){const disabled=completed.includes(o.openOnTask);","if(o.openOnTask||o.closeOnTask){const disabled=o.closeOnTask?!completed.includes(o.closeOnTask):completed.includes(o.openOnTask);")
rep('world.mjs','export const HEIGHT=',"export function routeTransitionBlocked(s,id){return OBSTACLES.some(o=>o.closeOnTask===id&&o.disabled&&[s.player,...s.enemies.filter(e=>e.hp>0)].some(p=>inside(p,o,.4)));}\nexport const HEIGHT=")
rep('field-tasks.mjs','heightAt,syncRouteGates}', 'heightAt,syncRouteGates,routeTransitionBlocked}')
rep('field-tasks.mjs','export function taskReady(s,t){return (t.requires||[])','export function taskReady(s,t){return !routeTransitionBlocked(s,t.id)&&(t.requires||[])')
rep('field-tasks.mjs',"export function taskBlockReason(s,t){return (t.requires", "export function taskBlockReason(s,t){if(routeTransitionBlocked(s,t.id))return 'clear the marked partition floor; someone is beneath it';return (t.requires")
rep('supplies.mjs',"emit(s,'task-complete',{id:target.id});hint(s,'Field task complete: '+target.label);", "const task=CURRENT.tasks.find(t=>t.id===target.id);emit(s,'task-complete',{id:target.id});if(task?.noiseRadius){noise(s,task.x,task.z,task.noiseRadius,'mechanism');emit(s,'wheel',{x:task.x,z:task.z});}hint(s,task?.completeMessage||'Field task complete: '+target.label);")
rep('district.mjs','if(o.openOnTask)continue;','if(o.openOnTask||o.closeOnTask)continue;')
rep('scene.mjs','import {createFloodgateRecutArt}',"import {createFirebreakArt} from './firebreak-art.mjs';\nimport {createFloodgateRecutArt}")
rep('scene.mjs','recut=createFloodgateRecutArt(scene,A,chapter);','recut=createFloodgateRecutArt(scene,A,chapter),firebreak=createFirebreakArt(scene,A,chapter);')
rep('scene.mjs','recut.update(state);','recut.update(state);firebreak.update(state);')
rep('scene.mjs','visualStatus:()=>({recut:', 'visualStatus:()=>({firebreak:firebreak.stats(),recut:')
rep('floodgate-content.mjs','Save your strength for the open quay. The fastest route and the safest route are not always the same.', 'The marked lever lowers the centre firebreak and opens the east yard door. It is noisy; plan a corner before pulling. The north loading door reconnects that yard to the spindle. Save your strength for the open quay. The fastest route and the safest route are not always the same.')
rep('tests/reclaimed.test.mjs','thirty-one authored tasks','thirty-two authored tasks')
rep('tests/reclaimed.test.mjs','n+d.tasks.length,0),31','n+d.tasks.length,0),32')
rep('tests/reclaimed.test.mjs',"id==='district'?3:2","id==='district'?4:2")
r=json.loads((R/'release.json').read_text());r.update(version='0.15.0',build='rainward-freight-firebreak-20260915',changes=['Add a noisy linked firebreak to the existing Freight Hall: lower the centre sightline partition and open the east yard recovery loop','Retain the untouched-mechanism north approach and both original required objectives','Share gate state across collision, AI sight/pathfinding, original mechanical sound, presentation and version-4 shelter saves','Prevent the partition from lowering onto a player or live enemy','Preserve seven chapters, resources, Xbox presets and first-person / AR / VR controller and hand modes']);(R/'release.json').write_text(json.dumps(r,indent=2)+'\n')
for name in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
 p=R/name;p.write_text(p.read_text().replace('0.14.1','0.15.0'))
p=R/'production-plan.json';d=json.loads(p.read_text());d.update(release='0.15.0',edition='Freight Firebreak');d['references'].insert(0,{'title':'Freight Hall recovery loop / shared-library application','url':'FREIGHT-FIREBREAK.md'});d['continuation']['firebreak']={'status':'Implemented','baseline':'78dad9840163bbacb7308118cde44a1bb4f525f6','scope':'Linked Freight Hall partition and east exit; no new chapter or mandatory objective.','evidence':'FREIGHT-FIREBREAK.md','physicalHardware':'Not tested','unfamiliarPlayer':'Not reviewed','nextQuestion':'Does a first-time player predict the linked change and use it to recover?'}
for t in d['items']:
 if t['id']=='RW-012':t.update(status='Implemented',evidence='FREIGHT-FIREBREAK.md',resumeNote='A noisy paired sightline/route state provides a Freight Hall recovery loop; exact-source native evidence gates release, while unfamiliar-player pacing remains unapproved.',nextAction='Observe a new player interpreting and using the linked mechanism after detection, then improve the loading-door/quay finale.')
 if t['id'] in ['RW-009','RW-011','RW-028']:t['resumeNote']+=' Freight Firebreak extends the same chapter with a threat-aware linked partition/yard return; see FREIGHT-FIREBREAK.md. Full flagship/human approval remains open.'
p.write_text(json.dumps(d,indent=2)+'\n');subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
p=R/'tests/handoff.test.mjs';p.write_text(p.read_text().replace("t.status==='Implemented').length,23","t.status==='Implemented').length,24"))
prefix='# Current release / Freight Firebreak v0.15.0\n\nRead FREIGHT-FIREBREAK.md and the shared level-design library. The new work is a linked Freight Hall partition and east-yard recovery loop, not another chapter or a redo of Wayfinder. Follow the exact release PR/evidence for publication and tested status. The former 64-item roadmap remains canonical; RW-012 has a bounded implementation, not human pacing approval. Continue with unfamiliar-player interpretation and the loading-door/quay finale. Saves, Xbox presets and all XR views remain; physical device and unfinished body-contact work stay open.\n\n'
for name in ['DEVELOPMENT-HANDOFF.md','README.md']:p=R/name;p.write_text(prefix+p.read_text())
p=R/'CONTROLLER.md';p.write_text('# Freight Firebreak / unchanged control bindings\n\nThe nearby Freight Hall lever uses E, Xbox Y, Quest right grip, or the existing hand-use pinch. Its paired change is noisy, and a live actor under the marked partition blocks operation until clear. No remote activation or new button chord is introduced. Read FREIGHT-FIREBREAK.md for scope and evidence.\n\n'+p.read_text())
(R.parent/'.github/workflows/rainward-firebreak-assemble.yml').unlink()
Path(__file__).unlink()
