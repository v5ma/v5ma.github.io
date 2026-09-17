"""Scoped candidate assembly, applied before (never during) acceptance.
Remove this transport helper before release. All gameplay code lives in modules.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,'review source drift',old[:80],s.count(old))
 p.write_text(s.replace(old,new))
patch('simulation.mjs',"import {updateAquatic}","import {locomotionPolicy} from './freefield.mjs';\nimport {updateAquatic}")
patch('simulation.mjs',"const dx=Number.isFinite(input.x)?input.x:0,dz=Number.isFinite(input.z)?input.z:0,l=Math.hypot(dx,dz),scale=Math.min(1,l),sprint=input.sprint&&p.stance==='stand'&&!p.exhausted&&p.stamina>5&&!input.aim&&!p.craft;", "const policy=locomotionPolicy(input,p),free=policy.free;const dx=Number.isFinite(input.x)?input.x:0,dz=Number.isFinite(input.z)?input.z:0,l=Math.hypot(dx,dz),scale=Math.min(1,l),sprint=policy.sprint;")
patch('simulation.mjs',"if(swimming)speed=sprint?3.65:2.45;else{if(sprint)speed=5.3;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(water)speed*=.66;}","if(swimming)speed=sprint||input.swimBoost?(free?7:3.65):2.45;else{if(sprint)speed=policy.speed;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(water&&!free)speed*=.66;}")
patch('simulation.mjs',"p.stamina=clamp(p.stamina+(sprint&&p.speed>.5?-16:18)*dt,0,100);", "p.stamina=clamp(p.stamina+(!free&&sprint&&p.speed>.5?-16:18)*dt,0,100);")
patch('audio.mjs',"import {CURRENT,waterAt", "import {quietScore} from './freefield.mjs';\nimport {CURRENT,waterAt")
patch('audio.mjs',"const seq=scoreStep(chapter||'district',step++);", "const seq=settings.score==='off'?{notes:[],seconds:1}:settings.score==='quiet'?quietScore(chapter||'district',step++):scoreStep(chapter||'district',step++);")
patch('audio.mjs',"mark(type,point);if(!active())return;const at=", "if(type==='footstep'&&settings.footsteps===0)return;if(type!=='swim-stroke')mark(type,point);if(!active())return;const waterGain=['water-enter','surface','submerge','swim-stroke'].includes(type)?(settings.waterVolume??100)/100:1;const at=")
patch('audio.mjs',"{when:now+delay,...opts});", "{when:now+delay,...opts,gain:(opts.gain??.6)*waterGain});")
patch('audio.mjs',"gain:ev.stance==='prone'?.16:ev.stance==='crouch'?.26:.52,pitch:","gain:(ev.stance==='prone'?.16:ev.stance==='crouch'?.26:.52)*(settings.footsteps??100)/100*(surface==='water'?(settings.waterVolume??100)/100:1),pitch:")
patch('app.mjs',"import {createQuestXR}","import {readFreefield} from './freefield.mjs';\nimport {loadRemaps,remapPads} from './freefield-remap.mjs';\nimport {createFreefieldUI} from './freefield-ui.mjs';\nimport {blink} from './blink.mjs';\nimport {createQuestXR}")
patch('app.mjs',"const saves=createCheckpointStore(read,write);", "let preferenceStore=null;try{preferenceStore=localStorage;}catch{}const freefield=readFreefield(preferenceStore),buttonRemaps=loadRemaps(preferenceStore);Object.assign(settings,freefield);\nconst saves=createCheckpointStore(read,write);")
patch('app.mjs',"function clearInput(){", "createFreefieldUI({options:freefield,remaps:buttonRemaps,storage:preferenceStore,changed(){Object.assign(settings,freefield);clearInput();}});\nfunction clearInput(){")
patch('app.mjs',"if(mode!=='play')return;const p=state.player;", "if(mode!=='play')return;if(action==='blink'){const d=quest?.isActive()?quest.ray()?.direction:forward(view.yaw);if(blink(state,d,freefield.blink)){view.snap=true;quest?.recenter(false);}return;}const p=state.player;")
patch('app.mjs',"gamepad.sample(navigator.getGamepads?.(),settings.deadzone/100,settings.controlPreset);$('device')", "gamepad.sample(remapPads(navigator.getGamepads?.(),buttonRemaps.xbox,mode==='play'),settings.deadzone/100,settings.controlPreset);$('device')")
patch('app.mjs',"{...moving,aim:view.aim,", "{...moving,freeStride:freefield.freeStride,runSpeed:freefield.runSpeed,swimBoost:!!pad.swimBoost,aim:view.aim,")
patch('app.mjs',"quest=createQuestXR({state:", "quest=createQuestXR({freefield,buttonRemaps,state:")
patch('app.mjs',"snapshot:()=>({fieldNotes:", "snapshot:()=>({freefield:{...freefield},buttonRemaps:JSON.parse(JSON.stringify(buttonRemaps)),fieldNotes:")
patch('controls.mjs',"const actionMap={", "const actionMap={KeyT:'blink',")
