"""Final scoped source assembly, never a test-time game-state modification."""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,old[:70],s.count(old));p.write_text(s.replace(old,new))
patch('direct-xr-input.mjs',"if(button==='rightsecondary'){if(release(button)&&!menuSent&&action!=='none')out.actions.push(action);continue;}","""if(button==='rightsecondary'){
    if(['aim','fire','listen','sprint'].includes(action)&&!menuSent){out[action]||=!!data[button];if(action==='sprint'&&edge(button))out.sprintToggle=true;}
    else if(action==='blink'&&!menuSent){out.blinkHeld||=!!data[button];if(release(button))out.actions.push('blink');}
    else if(release(button)&&!menuSent&&action!=='none')out.actions.push(action);
    continue;
   }""")
patch('quest-xr.mjs','let lastReading=null;',"let lastReading=null,entryHelp=true,observedHint='';")
patch('quest-xr.mjs','sight.reset();notice.clear();lastReading=null;','sight.reset();notice.clear();entryHelp=true;observedHint=E.state().hint;lastReading=null;')
patch('quest-xr.mjs','notice.update(playing);',"notice.update(playing);if(playing&&headPose&&state.hintTime>0&&state.hint&&state.hint!==observedHint){observedHint=state.hint;lastReading={title:'Field message',text:state.hint};notice.show(state.hint,headPose);}")
patch('quest-xr.mjs','if(!item)return;lastReading=item;','if(!item)return;observedHint=E.state().hint;lastReading=item;')
patch('quest-xr.mjs','safe=input.isArmed();',"safe=input.isArmed();if(safe&&entryHelp&&E.mode()==='play'){entryHelp=false;notice.show('Hold B or press R3 for the menu. Tap B reloads. A / right grip interacts. Raise your open left palm for hand menus.',headPose);}if(panel.document()&&(sample.confirm||sample.back)){panel.clearDocument();E.back();reset();return emptyXR();}")
patch('quest-xr.mjs','  ray:()=>currentRay,','  ray:()=>{if(active&&!isDiorama()&&headPose){align(E.state(),0);currentRay=weapons.ray();}return currentRay;},')
patch('quest-xr.mjs','if(panel.mesh.visible)panel.collect();}}','if(panel.mesh.visible)panel.collect();if(!isDiorama())currentRay=weapons.ray();}}')
patch('app.mjs',"freefield.autoRun&&freefield.freeStride&&state.player.stance==='stand'", "freefield.autoRun&&freefield.freeStride&&state.player.stance==='stand'&&state.player.waterMode!=='swim'")
patch('xr-reading.mjs',"import {LEVELS} from './world.mjs';","import {LEVELS} from './world.mjs';\nimport {FLOODGATE_NOTES} from './floodgate-content.mjs';")
patch('xr-reading.mjs',"return {title:target?.label||'Field message',text:clue?LEVELS[state.level].puzzle.clue.text:text,\n  persistent:!!clue||accepted&&['field-note','note'].includes(target?.kind),chapter:state.level};", "const note=accepted&&target?.kind==='field-note'&&state.fieldNotes?.includes(target.id)?FLOODGATE_NOTES.find(n=>n.id===target.id):null;\n return {title:note?.title||target?.label||'Field message',text:clue?LEVELS[state.level].puzzle.clue.text:note?note.author+'\\n\\n'+note.text:text,\n  persistent:!!clue||!!note,chapter:state.level};")
patch('tests/xr-repair-device.js',"if(space===src?.gripSpace&&src.tracked)","if(src&&space===src.gripSpace&&src.tracked)")
patch('tests/xr-repair-browser.py','def scope():','def scope(label):')
patch('tests/xr-repair-browser.py',"r=p.evaluate('Rainward.snapshot().xr.sight');p.evaluate", "r=p.evaluate('Rainward.snapshot().xr.sight');capture(label);p.evaluate")
patch('tests/xr-repair-browser.py',"scope();capture('02-sight-first-chapter')", "scope('02-sight-first-chapter')")
patch('tests/xr-repair-browser.py','second=scope();',"second=scope('04-sight-next-chapter');")
patch('tests/xr-repair.test.mjs',"Object.assign(p,{x:12,z:-24});assert.equal(authorizedMuzzle(s,{x:14.7,y:1.4,z:-24}),null);", "Object.assign(p,{x:13.35,z:-24});assert.equal(authorizedMuzzle(s,{x:14.65,y:1.4,z:-24}),null);")
p=R/'tests/xr-repair.test.mjs';s=p.read_text()
if 'Saved continuous-action remaps' not in s:s+="\ntest('Saved continuous-action remaps on B still work without removing reserved menu recovery',()=>{const r=source(),input=createDirectXRInput(),options={mapping:{rightsecondary:'fire'}},step=()=>input.sample([r],.1,options);step();step();r.buttons[5].pressed=true;assert.ok(step().fire);let paused=false;for(let i=0;i<8;i++)paused||=step().actions.includes('pause');assert.ok(paused);});\n"
if 'Recorded field notes show' not in s:s+="\nimport {FLOODGATE_NOTES} from '../floodgate-content.mjs';\ntest('Recorded field notes show their actual author and complete body, never an unread note',()=>{const s=M.createGame(),note=FLOODGATE_NOTES[0],target={kind:'field-note',id:note.id};s.hint='Recorded: '+note.title;assert.equal(interactionReading(s,target,true).text,s.hint);s.fieldNotes=[note.id];const reading=interactionReading(s,target,true);assert.equal(reading.text,note.author+'\\n\\n'+note.text);assert.equal(reading.title,note.title);assert.ok(reading.persistent);});\n"
p.write_text(s)
for name in ['world.mjs','index.html','tests/handoff.test.mjs','tests/aquatic.test.mjs','tests/reclaimed.test.mjs']:
 p=R/name;p.write_text(p.read_text().replace('0.16.0','0.16.1'))
p=R/'release.json';data=json.loads(p.read_text());assert data['version'] in ['0.16.0','0.16.1'];data.update(version='0.16.1',build='rainward-xr-repair-20260918',changes=['Add reserved hold-B menu recovery and a brief entry reminder without restoring a pinned gameplay menu','Display acquired puzzle text and field-note bodies in a dismissible spatial reading panel; show action feedback in view','Align mechanical pistol/rifle silhouettes, tracked safe muzzle, shots and scope to the same pointing direction','Reset scope timing on chapter/retry changes and preserve compositor/camera state','Render first-person AR and world portals in a single compositor scene pass; preserve centered perspective depth','Make fast no-fatigue land running the default with separate saved walking and legacy alternatives','Preserve seven chapters, existing IDs, rewards, checkpoints, remaps, licenses and concurrent sibling work']);p.write_text(json.dumps(data,indent=2)+'\n')
p=R/'production-plan.json';data=json.loads(p.read_text());data.update(release='0.16.1',edition='XR Repair',updated='2026-09-18');data['references']=[r for r in data['references'] if r['url']!='XR-REPAIR.md'];data['references'].insert(0,{'title':'Quest feedback repair and compositor acceptance','url':'XR-REPAIR.md'})
for item in data['items']:
 if item['id'] in ['RW-020','RW-049','RW-050','RW-056','RW-063']:
  item['evidence']='XR-REPAIR.md';item['resumeNote']='Physical Quest feedback superseded the old mock-only assurance. The repair adds readable acquired text, discoverable menu recovery, aligned mechanical guns, per-scene scope refresh and external-layer rendering checks. Broader human/device criteria remain open.';item['nextAction']='Retest the four modes on the actual Quest with controllers and hands, including acquired clues, firing/aim alignment, chapter changes and preserved custom remaps.'
data['continuation']['xrRepair']={'baseline':'Freefield 0.16.0 / PR183','sourceBranch':'fix/rainward-xr-recovery-20260918','evidence':'XR-REPAIR.md','status':'Implemented; final acceptance and publication require actual receipts','hardware':'User reported failures; physical retest remains required','software':'Separate pointing/grip frames and real external base/projection framebuffer attachments','preserved':'Original stable IDs, save schemas, rewards, geometry, enemies and legacy alternatives'}
p.write_text(json.dumps(data,indent=2)+'\n');subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
prefix='''# Current repair / Rainward v0.16.1

Read XR-REPAIR.md and XR-REPAIR-HANDOFF.md. Hold B opens the default Quest menu; short B reloads on release, and R3 remains a recovery control. Acquired clues now appear as full readable spatial text. Mechanical weapon, safe muzzle and scope share the pointing axis; scopes reset between scenes. First-person AR and portals use one compositor draw. Fast land running is the default in Free Stride. Existing saved remaps, legacy choices and checkpoints are preserved. Physical Quest feedback remains distinct from synthetic device acceptance. The release PR and public-byte receipt establish delivery, not this header alone.

The earlier sections below are retained history, not current publication status.

'''
for name in ['README.md','CONTROLLER.md','DEVELOPMENT-HANDOFF.md','FREEFIELD-HANDOFF.md']:
 p=R/name;s=p.read_text()
 if not s.startswith('# Current repair / Rainward'):p.write_text(prefix+s)
patch('app.mjs',"Playable XR: first person VR or AR, and third person VR or AR world portals. Controllers and hands are supported", "Quest: hold B for menu, tap B to reload; A or right grip interacts. First-person VR/AR and third-person VR/AR portals support controllers and hands")
