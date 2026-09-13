#!/usr/bin/env python3
"""One-time transparent source integration on the isolated Steady Steps branch.
Native acceptance checks its separately committed output, never this recipe.
All old and new whole-file hashes are checked. Keep later edits in runtime files.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib,json,subprocess
repo=Path(__file__).resolve().parents[2]
spec=json.loads((Path(__file__).parent/'steady-expected.json').read_text())
prefixes=json.loads((Path(__file__).parent/'steady-doc-prefixes.json').read_text())
sha=lambda data:hashlib.sha256(data).hexdigest()
# character-motion is supplied as a complete reviewed source file, not a patch.
for entry in spec:
 name=entry['path'];assert name.startswith('leonardos-guild/') and '..' not in Path(name).parts
 expected=entry['after'] if name.endswith('/character-motion.mjs') else entry['before']
 assert sha((repo/name).read_bytes())==expected,('Changed baseline',name)
with TemporaryDirectory() as folder:
 root=Path(folder)/'leonardos-guild'
 for entry in spec:
  p=Path(folder)/entry['path'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((repo/entry['path']).read_bytes())
 def replace(file,a,b):
  p=root/file;s=p.read_text();assert s.count(a)==1,(file,s.count(a),a[:70]);p.write_text(s.replace(a,b))
 p=root/'guild-art.mjs';s=p.read_text();start=s.index('export function person(');end=s.index('export function car(',start);s=s[:start]+"export function person(m,kind='apprentice'){return createPersonRig(m,kind);}\n"+s[end:];s="import {createPersonRig} from './character-rig.mjs';\n"+s
 s=s.replace('rider.root.add(staff);',"(rider.handSockets?.[1]||rider.root).add(staff);if(rider.handSockets)staff.position.set(0,0,.03);")
 s=s.replace("staff.visible=s.mode==='foot';", "staff.visible=s.mode==='foot'&&(s.resonance?.tool||'staff')==='staff';")
 s=s.replace("const stick=new Batch();stick.rod([.34,.4,.2],[.34,2.1,.2],.045,'#9f7b4e');stick.finish(guard.root,m.trim,'Guard practice staff');", "const stick=new Batch();stick.rod([0,-.6,.03],[0,1.1,.03],.045,'#9f7b4e');stick.finish(guard.handSockets[1],m.trim,'Guard practice staff');")
 s=s.replace("motion:s.banditPhase==='windup'?'guard':'idle'", "motion:s.defeated?'yield':s.banditPhase==='windup'?'guard':'idle'")
 p.write_text(s)
 p=root/'scene.mjs';s=p.read_text();s="import {createCameraSafety} from './camera-safety.mjs';\n"+s
 s=s.replace("import {animatePerson}", "import {animatePerson,inspectMotion}")
 s=s.replace("import {doorElevation}","import {doorElevation,doorLevel,doorLocation}")
 s=s.replace("const shouldDraw=createFrameGate();", "const cameraSafety=createCameraSafety(w,heightAt);\n const shouldDraw=createFrameGate();")
 start=s.index('  // Keep the third-person camera in front of solid houses')
 end=s.index('  const gaze=',start)
 s=s[:start]+"  const location=doorLocation(p,w),pivot={x:p.x,y:y+1.45+p.lift*.5,z:p.z};\n  const safeCamera=cameraSafety.update(pivot,carCam,{level:location.level,roomId:location.room,ground:y,garden:!!p.life.flags.garden,relay:p.relay,dt,snap:!initialized||input.snap});\n"+s[end:]
 a="if(!initialized||input.snap){camera.position.copy(carCam);initialized=true;}else camera.position.lerp(carCam,1-Math.exp(-dt*5));camera.lookAt(look);"
 s=s.replace(a,"camera.position.set(safeCamera.x,safeCamera.y,safeCamera.z);initialized=true;camera.lookAt(look);")
 a="if(p.mode==='bike'){for(let i=0;i<2;i++)rider.legs[i].rotation.x=Math.sin(p.distance*3+i*Math.PI)*.6;rider.root.position.z-=f.z*.12;rider.root.position.x-=f.x*.12;}else for(let i=0;i<2;i++)rider.legs[i].rotation.x=Math.sin(p.time*10+i*Math.PI)*Math.min(.5,Math.abs(p.speed)*.14);"
 s=s.replace(a,"if(p.mode==='bike'){rider.root.position.z-=f.z*.12;rider.root.position.x-=f.x*.12;}")
 s=s.replace("for(let j=0;j<2;j++)b.legs[j].rotation.x=Math.sin(a.phase+j*Math.PI)*.36;","")
 a="animatePerson(rider,p.time,{motion:p.mode==='bike'?'ride':p.guarding?'guard':p.attackT>0?'strike':'walk',speed:p.speed,phase:p.time*10});"
 b="animatePerson(rider,p.time,{motion:p.mode!=='foot'?'ride':p.lift>.08?'jump':p.doors.dodge>0?'dodge':p.resonance?.reload>0?'reload':p.resonance?.cover?'cover':p.guarding?'guard':p.attackT>0?'strike':p.resonance?.aim?'aim':'walk',speed:p.speed,level:doorLevel(p),action:Math.min(1,p.attackT/.3)});"
 assert a in s;s=s.replace(a,b)
 s=s.replace("quality:renderQuality,shadows:","quality:renderQuality,cameraSafety:cameraSafety.inspect(),character:inspectMotion(rider),shadows:")
 p.write_text(s)
 p=root/'doors-art.mjs';s=p.read_text();s=s.replace("import {animatePerson}","import {animatePerson,inspectMotion}")
 s=s.replace("weapon.rod([.3,.3,.15],[.3,2.1,.15],", "weapon.rod([0,-.65,.03],[0,1.15,.03],")
 s=s.replace("weapon.finish(model.root,m.trim,e.name+' staff')", "weapon.finish(model.handSockets[1],m.trim,e.name+' staff')")
 s=s.replace("motion:e.hp===0?'idle':e.phase==='windup'?'guard':e.phase==='chase'?'walk':'idle',speed:e.phase==='chase'?3:0", "motion:e.hp===0?'yield':e.phase==='windup'?'guard':e.phase==='recover'?'strike':e.phase==='stagger'?'dodge':'walk',speed:e.phase==='chase'?3:0,level:e.level,action:e.timer")
 s=s.replace("enemyModels:enemies.size,", "enemyModels:enemies.size,jointedRivals:[...enemies.values()].filter(e=>e.root.guildRig?.version===2).length,")
 p.write_text(s)
 replace('resonance-art.mjs',"rider.root.add(sling);","(rider.handSockets?.[0]||rider.root).add(sling);")
 replace('resonance-art.mjs',"sling.position.set(-.34,1.15,.32);", "if(rider.handSockets)sling.position.set(0,0,.08);else sling.position.set(-.34,1.15,.32);")

 # Version labels, additive release metadata and continuation notes.
 import json
 r=root
 p=r/'scene.mjs';s=p.read_text();s="import {createActorFade} from './character-rig.mjs';\n"+s;s=s.replace('const cameraSafety=createCameraSafety(w,heightAt);','const cameraSafety=createCameraSafety(w,heightAt),actorFade=createActorFade(rider);');s=s.replace('const roomFollow=currentRoom?Math.min(3.1,follow):follow;','const enclosed=currentRoom&&![3,-2].includes(doorLevel(p)),roomFollow=enclosed?Math.min(3.1,follow):follow;');s=s.replace('aiming?12:currentRoom?1.2:7','aiming?12:enclosed?1.2:7');s=s.replace('resonanceArt.update(p);renderer.render', 'resonanceArt.update(p);actorFade.update(cameraSafety.inspect().distance);renderer.render');s=s.replace('cameraSafety:cameraSafety.inspect(),','cameraSafety:cameraSafety.inspect(),playerFade:actorFade.inspect(),');p.write_text(s)
 p=r/'release.json';d=json.loads(p.read_text());d.update(title="Leo's Guild - Steady Steps",version='0.10.0',build='guild-steady-steps-20260912');d['steadySteps']={'roadmapItems':['C01','C02','C03'],'camera':'continuous expanded-bound boom collision with floor-aware constraints and post-smoothing recheck','characters':'original shared-buffer jointed rig with distance-driven blended poses','progressionChanges':False,'newAudioEvents':False,'limits':'Procedural character sample, not mocap or complete foot IK; proxy camera bounds, not every decorative triangle; physical hardware review remains open.'};p.write_text(json.dumps(d,indent=2)+'\n')
 for name in ['model.mjs','package.json','index.html']:
  p=r/name;s=p.read_text().replace('0.9.0','0.10.0')
  if name=='index.html':
   s=s.replace("Leo's Guild - Living Stories", "Leo's Guild - Steady Steps").replace('LIVING STORIES <b>','STEADY STEPS <b>')
   s=s.replace('Two new household stories offer', 'Smoother jointed character motion and a wall-aware camera improve the existing adventure. Quiet audio and all saved progress remain. Two household stories offer')
  p.write_text(s)
 replace('app.mjs','V0.9 / LIVING STORIES','V0.10 / STEADY STEPS')
 replace('doors-ui.mjs','LIVING STORIES / v0.9.0','STEADY STEPS / v0.10.0')
 replace('tests/stories-browser.py',"read()['version']=='0.9.0'", "read()['version']==json.loads((ROOT/'release.json').read_text())['version']")
 for name,prefix in prefixes.items():
  p=root/name.removeprefix('leonardos-guild/');p.write_text(prefix+p.read_text())
 p=r/'AAA-ROADMAP.md';s=p.read_text().replace('Updated September 11, 2026.','Updated September 12, 2026.');s=s.replace('## Phase 0 -', 'Steady Steps v0.10.0 advances parts of C01-C03: a shared original articulated character sample, displacement-driven poses, and continuous proxy-bound camera collision with floor-specific handling. These tasks remain open below because finished animation, foot planting and broad human camera review are not completed by this slice. See STEADY-STEPS.md and its release PR for exact acceptance. Quiet audio and every earlier adventure remain.\n\n## Phase 0 -',1);p.write_text(s)
 p=r/'.gitignore';p.write_text(p.read_text()+'\nsteady-output/\n')

 # Check every whole result before any tracked runtime file is overwritten.
 for entry in spec:
  assert sha((Path(folder)/entry['path']).read_bytes())==entry['after'],('Unexpected output',entry['path'])
 for entry in spec:(repo/entry['path']).write_bytes((Path(folder)/entry['path']).read_bytes())
receipt={'version':'0.10.0','preparationSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'files':spec,'method':'One-time explicit source edits in an isolated temporary copy. Native acceptance checks ordinary committed output without any rewrite.'}
(repo/'leonardos-guild/STEADY-STEPS-INTEGRATION.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Prepared',len(spec),'verified ordinary source files; commit before native acceptance.')
