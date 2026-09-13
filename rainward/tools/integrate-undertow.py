"""Integrate Rainward v0.13 Undertow using exact source anchors.
The script changes Rainward only and is idempotent after an accepted integration.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
if json.loads((R/'release.json').read_text())['version']=='0.13.0':
 print('Undertow already integrated.');raise SystemExit(0)
updates={}
def change(file,before,after):
 p=R/file;s=updates.get(file,p.read_text())
 assert s.count(before)==1,(file,before[:120],s.count(before))
 updates[file]=s.replace(before,after)
# Chapter registry and version.
change('world.mjs',"import {FLOODGATE_COVER} from './floodgate-content.mjs';","import {NATATORIUM} from './natatorium.mjs';\nimport {FLOODGATE_COVER} from './floodgate-content.mjs';")
change('world.mjs',"export const VERSION='0.12.0';","export const VERSION='0.13.0';")
change('world.mjs',"breakwater:BREAKWATER,whiteout:WHITEOUT});","breakwater:BREAKWATER,whiteout:WHITEOUT,natatorium:NATATORIUM});")
# Player aquatic state is transient; dry shelters remain the persistence boundary.
change('state.mjs',"noise:0,vx:0,vz:0,exhausted:false,", "noise:0,vx:0,vz:0,oxygen:100,waterMode:'dry',submerged:false,swimDepth:0,exhausted:false,")
# Movement and oxygen.
change('simulation.mjs',"import {weapon} from './armory.mjs';","import {updateAquatic} from './aquatic.mjs';\nimport {weapon} from './armory.mjs';")
change('simulation.mjs'," p.aim=!!input.aim;p.listen=!!input.listen;\n let speed=p.stance==='prone'?.85:p.stance==='crouch'?1.7:3.1;if(sprint)speed=5.3;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(waterAt(p))speed*=.66;if(p.craft||p.healing||p.melee)speed=0;",
" p.aim=!!input.aim;p.listen=!!input.listen;const water=waterAt(p),swimming=!!(water?.swimmable&&water.depth>=.8);if(swimming){p.stance='stand';p.aim=false;p.listen=false;}\n let speed=p.stance==='prone'?.85:p.stance==='crouch'?1.7:3.1;if(swimming)speed=sprint?3.65:2.45;else{if(sprint)speed=5.3;if(p.aim)speed*=.6;if(p.listen)speed*=.45;if(water)speed*=.66;}if(p.craft||p.healing||p.melee)speed=0;")
change('simulation.mjs'," p.stamina=clamp(p.stamina+(sprint&&p.speed>.5?-16:18)*dt,0,100);p.noise=p.speed*(p.stance==='prone'?.3:p.stance==='crouch'?.65:1);\n p.step=(p.step||0)+dt;if(p.step>(sprint?.32:p.stance==='prone'?.9:.56)&&p.speed>.2){p.step=0;emit(s,'footstep',{stance:p.stance,sprint:!!sprint});if(p.noise>1)noise(s,p.x,p.z,p.noise*1.65,'footstep');}",
" p.stamina=clamp(p.stamina+(sprint&&p.speed>.5?-16:18)*dt,0,100);p.noise=swimming?(p.submerged?p.speed*.12:p.speed*.72):p.speed*(p.stance==='prone'?.3:p.stance==='crouch'?.65:1);\n p.step=(p.step||0)+dt;if(p.step>(swimming?.58:sprint?.32:p.stance==='prone'?.9:.56)&&p.speed>.2){p.step=0;if(swimming){emit(s,'swim-stroke',{submerged:!!p.submerged});if(!p.submerged&&p.noise>.5)noise(s,p.x,p.z,p.noise*1.8,'splash');}else{emit(s,'footstep',{stance:p.stance,sprint:!!sprint});if(p.noise>1)noise(s,p.x,p.z,p.noise*1.65,'footstep');}}")
change('simulation.mjs'," for(const e of s.enemies){if(s.status!=='playing')break;if(isMonster(e))updateMonster(s,e,dt);else updatePatrol(s,e,dt);}updateSurvival(s,input,dt);syncDrops(s);p.y=heightAt(p.x,p.z);",
" updateAquatic(s,input,dt);for(const e of s.enemies){if(s.status!=='playing')break;if(isMonster(e))updateMonster(s,e,dt);else updatePatrol(s,e,dt);}updateSurvival(s,input,dt);syncDrops(s);p.y=heightAt(p.x,p.z)-(p.swimDepth||0);")
# Underwater visibility and interactions.
change('motion.mjs'," const d=dist(e,p);if(d<1.35)return !obstruction", " const d=dist(e,p);if(p.submerged&&d>=2)return false;if(d<1.35)return !obstruction")
change('supplies.mjs',"const item=ITEMS.find(i=>!s.taken.has(i.id)&&(!nearestShelter||dist(i,p)<dist(nearestShelter,p))&&dist(i,p)<1.8&&!obstruction({x:p.x,y:heightAt(p.x,p.z)+.4,z:p.z},{x:i.x,y:heightAt(i.x,i.z)+.4,z:i.z}));if(item)return {kind:'item',id:item.id,label:item.label};",
"const item=ITEMS.find(i=>!s.taken.has(i.id)&&(!nearestShelter||dist(i,p)<dist(nearestShelter,p))&&dist(i,p)<1.8&&!obstruction({x:p.x,y:heightAt(p.x,p.z)+.4-(p.swimDepth||0),z:p.z},{x:i.x,y:heightAt(i.x,i.z)+.4,z:i.z}));if(item){if(item.underwater&&!p.submerged)return {kind:'underwater',id:item.id,label:'Dive to reach '+item.label};return {kind:'item',id:item.id,label:item.label};}")
change('supplies.mjs'," if(target.kind==='field-note')return readFieldNote(s,target.id);", " if(target.kind==='underwater'){hint(s,target.label);return false;}\n if(target.kind==='field-note')return readFieldNote(s,target.id);")
for old,new in [
 ("if(s.status!=='playing'||!r||p.craft", "if(s.status!=='playing'||p.submerged||!r||p.craft"),
 ("if(s.status!=='playing'||!p.medkit", "if(s.status!=='playing'||p.submerged||!p.medkit"),
 ("if(s.status!=='playing'||!p.smoke", "if(s.status!=='playing'||p.submerged||!p.smoke"),
 ("if(s.status!=='playing'||p.reload)return false;", "if(s.status!=='playing'||p.submerged||p.reload)return false;")]:change('supplies.mjs',old,new)
# Combat/survival actions stay dry by design.
change('combat.mjs',"if(s.status!=='playing'||!p.bottles||", "if(s.status!=='playing'||p.submerged||!p.bottles||")
change('combat.mjs',"if(s.status!=='playing'||p.reload||p.shotCD", "if(s.status!=='playing'||p.submerged||p.reload||p.shotCD")
change('combat.mjs',"if(s.status!=='playing'||p.dodge>0||p.vault", "if(s.status!=='playing'||p.waterMode==='swim'||p.dodge>0||p.vault")
for before,after in [
 ("if(s.status!=='playing'||p.hp>=100", "if(s.status!=='playing'||p.submerged||p.hp>=100"),
 ("if(s.player.healing||s.player.melee||s.player.reload)", "if(s.player.submerged||s.player.healing||s.player.melee||s.player.reload)"),
 ("if(s.status!=='playing'||p.melee||p.reload", "if(s.status!=='playing'||p.waterMode==='swim'||p.melee||p.reload"),
 ("if(s.status!=='playing'||p.melee||p.reload||p.dodge>0", "if(s.status!=='playing'||p.waterMode==='swim'||p.melee||p.reload||p.dodge>0"),
 ("if(s.status!=='playing'||p.vault||p.dodge", "if(s.status!=='playing'||p.waterMode==='swim'||p.vault||p.dodge"),
 ("if(s.status!=='playing'||!p.smoke||", "if(s.status!=='playing'||p.submerged||!p.smoke||")]:change('survival.mjs',before,after)
# App turns existing posture/traversal controls into dive/surface while swimming.
change('app.mjs',"import {createRainwornUI} from './rainworn-ui.mjs';", "import {createAquaticUI} from './aquatic-ui.mjs';\nimport {toggleSubmerge,surfaceWater} from './aquatic.mjs';\nimport {createRainwornUI} from './rainworn-ui.mjs';")
change('app.mjs'," if(action==='crouch')stance(state,p.stance==='crouch'?'stand':'crouch');if(action==='prone')stance(state,p.stance==='prone'?'stand':'prone');",
" if(action==='crouch'){if(p.waterMode==='swim')toggleSubmerge(state);else stance(state,p.stance==='crouch'?'stand':'crouch');}if(action==='prone'){if(p.waterMode==='swim')toggleSubmerge(state);else stance(state,p.stance==='prone'?'stand':'prone');}")
change('app.mjs',"if(action==='evade'){const m=motion();dodge(state,m.x,m.z);}if(action==='traverse'){const m=motion();traverse(state,m.x,m.z);}",
"if(action==='evade'){if(p.waterMode==='swim')surfaceWater(state);else{const m=motion();dodge(state,m.x,m.z);}}if(action==='traverse'){if(p.waterMode==='swim')surfaceWater(state);else{const m=motion();traverse(state,m.x,m.z);}}")
change('app.mjs'," if(action==='dodge'){const v=motion();dodgeOrVault(state,v.x,v.z);}", " if(action==='dodge'){if(p.waterMode==='swim')surfaceWater(state);else{const v=motion();dodgeOrVault(state,v.x,v.z);}}")
change('app.mjs',"const firstLightUI=createFirstLightUI", "const aquaticUI=createAquaticUI({get state(){return state;},get mode(){return mode;},get pad(){return pad;}});\nconst firstLightUI=createFirstLightUI")
change('app.mjs',"survivalUI.update(state,pad,mode,audio.snapshot());fieldReady.update();firstLightUI.update();rainwornUI.update", "survivalUI.update(state,pad,mode,audio.snapshot());aquaticUI.update();fieldReady.update();firstLightUI.update();rainwornUI.update")
# Scene selection, object depth, camera and underwater atmosphere.
change('scene.mjs',"import {buildTerminus} from './terminus-art.mjs';", "import {buildNatatorium} from './natatorium-art.mjs';\nimport {buildTerminus} from './terminus-art.mjs';")
change('scene.mjs',"const scenery=['meridian','breakwater','whiteout'].includes(chapter.id)?buildReclaimed(scene,A):chapter.id==='terminus'?buildTerminus(scene,A):chapter.id==='conservatory'?buildConservatory(scene,A):null;",
"const scenery=chapter.id==='natatorium'?buildNatatorium(scene,A):['meridian','breakwater','whiteout'].includes(chapter.id)?buildReclaimed(scene,A):chapter.id==='terminus'?buildTerminus(scene,A):chapter.id==='conservatory'?buildConservatory(scene,A):null;")
change('scene.mjs',"scene.fog=new T.FogExp2(chapter.id==='terminus'?0x637985:0x9aadb3,chapter.id==='terminus'?.014:.007);",
"scene.fog=new T.FogExp2(chapter.id==='terminus'?0x637985:chapter.id==='natatorium'?0x71817f:0x9aadb3,chapter.id==='terminus'?.014:chapter.id==='natatorium'?.011:.007);const baseFogColor=scene.fog.color.clone(),baseFogDensity=scene.fog.density,baseExposure=renderer.toneMappingExposure;")
change('scene.mjs',"pose(hero,state.player,t);hero.root.position.y+=heightAt(state.player.x,state.player.z);", "pose(hero,state.player,t);hero.root.position.y+=heightAt(state.player.x,state.player.z)-(state.player.swimDepth||0);")
change('scene.mjs',"mesh.position.y=heightAt(item.x,item.z)+.42+Math.sin(t*1.4+item.x)*.035;",
"const iw=chapter.water?.find(w=>Math.abs(item.x-w.x)<w.w/2&&Math.abs(item.z-w.z)<w.d/2);mesh.position.y=item.underwater?heightAt(item.x,item.z)-(iw?.depth||1)+.38:heightAt(item.x,item.z)+.42+Math.sin(t*1.4+item.x)*.035;")
change('scene.mjs',"const p=state.player,aim=view.aim,lookY=heightAt(p.x,p.z)+(p.stance==='prone'?.38:p.stance==='crouch'?1.05:1.5)", "const p=state.player,aim=view.aim,lookY=heightAt(p.x,p.z)-(p.swimDepth||0)+(p.stance==='prone'?.38:p.stance==='crouch'?1.05:1.5)")
change('scene.mjs',"sun.target.position.set(p.x,heightAt(p.x,p.z)+1,p.z);", "if(chapter.id==='natatorium'&&p.submerged){scene.fog.color.setHex(0x24545b);scene.fog.density=.052;renderer.toneMappingExposure=.78;}else{scene.fog.color.copy(baseFogColor);scene.fog.density=baseFogDensity;renderer.toneMappingExposure=baseExposure;}sun.target.position.set(p.x,heightAt(p.x,p.z)+1,p.z);")
change('scene.mjs',"visualStatus:()=>({rainworn:", "visualStatus:()=>({aquatic:chapter.id==='natatorium'?scenery?.stats?.()||null:null,rainworn:")
# Audio cues reuse existing synthesized water sounds.
change('audio-design.mjs',"'complete':'A way through'", "'complete':'A way through','water-enter':'Entering water','water-exit':'Leaving water','submerge':'Diving underwater','surface':'Surface reached','swim-stroke':'Swimming'")
change('audio.mjs',"else if(type==='land'){at('step-'+surfaceAt(state.player),0,{duration:.4,gain:.65});}", "else if(type==='water-enter'||type==='surface'){at('step-water',0,{duration:.55,gain:.62});}else if(type==='submerge'){at('water',0,{duration:.8,gain:.48});}else if(type==='swim-stroke'){at('step-water',0,{duration:.42,gain:state?.player.submerged?.20:.44});}else if(type==='land'){at('step-'+surfaceAt(state.player),0,{duration:.4,gain:.65});}")
# UI and chapter picker.
change('index.html','href="./rainworn.css">','href="./rainworn.css"><link rel="stylesheet" href="./aquatic.css">')
change('index.html','<span>v0.12.0</span>','<span>v0.13.0</span>')
change('index.html','RECLAIMED CITY / SIX EXPEDITIONS','RECLAIMED CITY / SEVEN EXPEDITIONS')
change('index.html','Explore six expeditions from flooded streets to a storm-battered coast.','Explore seven expeditions from flooded streets and abandoned pools to a storm-battered coast.')
change('index.html','<option value="whiteout">06 / Whiteout Market - NEW</option></select>', '<option value="whiteout">06 / Whiteout Market</option><option value="natatorium">07 / Northlight Natatorium - WATER MISSION</option></select>')
# Existing test expectations become seven-expedition expectations; old-save cases remain six.
for file in ['tests/controller-menus.py','tests/terminus.py']:
 s=(R/file).read_text();s=s.replace("option').count()==6","option').count()==7").replace('all six chapter options','all seven chapter options').replace('All six existing expeditions remain selectable','All seven expeditions remain selectable').replace('Six separate authored chapters are present','Seven separate authored chapters are present').replace("'0.12.0'","'0.13.0'");updates[file]=s
s=(R/'tests/reclaimed.test.mjs').read_text().replace("['district','conservatory','terminus','meridian','breakwater','whiteout']","['district','conservatory','terminus','meridian','breakwater','whiteout','natatorium']").replace("W.VERSION,'0.12.0'","W.VERSION,'0.13.0'");updates['tests/reclaimed.test.mjs']=s
s=(R/'tests/field-ready.test.mjs').read_text().replace('occupied).length,6)','occupied).length,7)');updates['tests/field-ready.test.mjs']=s
s=(R/'tests/first-light.test.mjs').read_text().replace('occupied).length,6)','occupied).length,7)');updates['tests/first-light.test.mjs']=s
s=(R/'tests/field-ready.py').read_text().replace("chapters=['conservatory','terminus','meridian','breakwater','whiteout']","chapters=['conservatory','terminus','meridian','breakwater','whiteout','natatorium']").replace("==6,'All six slots remain available", "==7,'All seven slots remain available").replace("len(saved['slots'])==6", "len(saved['slots'])==7").replace('All six chapter save slots coexist','All seven chapter save slots coexist').replace('the other five slots','the other six slots').replace('Starting five other chapters','Starting six other chapters');updates['tests/field-ready.py']=s
# Release and production records.
release=json.loads((R/'release.json').read_text());release.update(version='0.13.0',build='rainward-undertow-20260912',changes=['Add Northlight Natatorium as a seventh expedition centered on shallow wading, deep swimming and diving','Add oxygen, dive/surface controls, underwater objective interaction, surface/submerged noise differences and dry-only combat actions','Add a procedural indoor-pool water shader with animated waves, Fresnel highlights, tiled basins, caustics, lane markings and underwater fog','Add six Natatorium field tasks, a circulation puzzle, dry shelters and a north service-lift extraction route','Preserve previous six-chapter save banks, all earlier expeditions, controller presets, finite resources, human models and original soundtrack']);updates['release.json']=json.dumps(release,indent=2)+'\n'
plan=json.loads((R/'production-plan.json').read_text());plan.update(release='0.13.0',edition='Undertow',baseline='ef91e3b057755b1564393430e8c5a6c64176e79c');plan['policy']=plan['policy'].replace('Preserve all six chapters','Preserve all seven chapters');
for task in plan['items']:
 if task['id']=='RW-002':task['acceptance']=task['acceptance'].replace('Six chapter','Seven chapter')
 if task['id']=='RW-031':task['status']='Implemented';task['evidence']='UNDERTOW.md'
plan['nextRelease']=['RW-014','RW-035','RW-036','RW-044'];updates['production-plan.json']=json.dumps(plan,indent=2)+'\n'
updates['README.md']='# Rainward v0.13.0 / Undertow\n\nCurrent release: [UNDERTOW.md](UNDERTOW.md). Northlight Natatorium adds the first deep-water expedition, oxygen and a procedural pool/caustic renderer.\n\n'+(R/'README.md').read_text()
for file,text in updates.items():(R/file).write_text(text);print('Integrated',file)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
