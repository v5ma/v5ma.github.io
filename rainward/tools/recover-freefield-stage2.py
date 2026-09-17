"""Scoped stage-2 assembly, committed before acceptance. Remove before merge."""
from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
marker=R/'FREEFIELD-STAGE2.json'
if not marker.exists():
 def patch(name,old,new):
  p=R/name;s=p.read_text()
  if new in s:return
  assert s.count(old)==1,(name,old[:70],s.count(old));p.write_text(s.replace(old,new))
 patch('world.mjs',"import {applyFreightCut}","import {applyMeridianRelief,meridianHeight} from './meridian-relief.mjs';\nimport {applyFreightCut}")
 patch('world.mjs','applyFreightCut(DISTRICT);','applyFreightCut(DISTRICT);applyMeridianRelief(MERIDIAN);')
 patch('world.mjs','export function levelHeight(id,x,z){',"export function levelHeight(id,x,z){if(id==='meridian')return meridianHeight(x,z);")
 patch('reclaimed-art.mjs',"import * as T from './vendor/three.module.js';", "import * as T from './vendor/three.module.js';\nimport {dressMeridian} from './meridian-relief-art.mjs';")
 patch('reclaimed-art.mjs','Math.ceil(w/3),Math.ceil(d/3)',"Math.ceil(w/(c.id==='meridian'?.8:3)),Math.ceil(d/(c.id==='meridian'?.8:3))")
 patch('reclaimed-art.mjs','const {x,z,w,d,h}=building;',"if(c.id==='meridian'){dressMeridian(scene,A,building);continue;}const {x,z,w,d,h}=building;")
 patch('reclaimed-art.mjs',"label('SIDE PASSAGE',x+side*(w/2+.55),2.6,z,4,.65,'#414f47','#d4d0b3',side*Math.PI/2);",'/* Architecture identifies entrances, not a generic side-passage sign. */')
 patch('reclaimed-art.mjs',"add('box',o.x,y,o.z,o.w+.08", "add('box',o.x,o.bottom+y,o.z,o.w+.08")
 patch('reclaimed-art.mjs',"add('box',o.x+.03,y+.14,o.z", "add('box',o.x+.03,o.bottom+y+.14,o.z")
 patch('reclaimed-art.mjs',"add('box',o.x,o.h+.018,o.z", "add('box',o.x,o.bottom+o.h+.018,o.z")
 p=R/'state.mjs';p.write_text("import {accessibleMeridianDrops} from './meridian-relief.mjs';\n"+p.read_text())
 patch('state.mjs','s.drops=drops.map(a=>({id:a.id,x:a.x,z:a.z,items:{...a.items}}));',"s.drops=drops.map(a=>({id:a.id,x:a.x,z:a.z,items:{...a.items}}));if(level==='meridian')s.drops=accessibleMeridianDrops(def,s.drops,s.puzzle);")
 patch('hud.mjs',"import {createClinicJournal", "import {drawGoal,goalText} from './goal-guide.mjs';\nimport {createClinicJournal")
 patch('hud.mjs',"function drawMap(){clinicJournal.update", "const nextGoalText=document.createElement('p');nextGoalText.id='next-goal';nextGoalText.setAttribute('role','status');$('map').before(nextGoalText);\nfunction drawMap(){nextGoalText.textContent=goalText(E.state);clinicJournal.update")
 patch('hud.mjs',"g.fillText('YOU',x(state.player.x),z(state.player.z)+17);", "g.fillText('YOU',x(state.player.x),z(state.player.z)+17);drawGoal(g,state,{x,z});")
 patch('quest-xr.mjs',"import {createXRInput", "import {goalText} from './goal-guide.mjs';\nimport {createXRInput")
 patch('quest-xr.mjs',"hint:()=>E.state().hint||'Right grip: interact / Point and select field controls'", "hint:()=>goalText(E.state())")
 patch('rainworn-humans.mjs',"if(['jacket','trousers','boots'].includes(part.material.name))continue;", "/* Retain authored clothing/body surfaces and the original face/skin. */")
 patch('rainworn-humans.mjs',"const gearGeometry=accessories(a.skin),garments=", "const gearGeometry=backpackOnly(a.skin),garments=")
 patch('rainworn-humans.mjs',"function coatColor(a)", """function backpackOnly(original){
 const full=accessories(original),p=full.attributes.position,selected=[],groups=[];
 for(const group of full.groups){const start=selected.length;for(let i=group.start;i<group.start+group.count;i+=3){let y=0,z=0;for(let j=0;j<3;j++){y+=p.getY(i+j)/3;z+=p.getZ(i+j)/3;}if(z>.15&&y>.9&&y<1.49)selected.push(i,i+1,i+2);}if(selected.length>start)groups.push({start,count:selected.length-start,materialIndex:group.materialIndex});}
 const g=new T.BufferGeometry();for(const [name,a]of Object.entries(full.attributes)){const values=new a.array.constructor(selected.length*a.itemSize);selected.forEach((index,i)=>{for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[index*a.itemSize+j];});g.setAttribute(name,new T.BufferAttribute(values,a.itemSize));}g.groups=groups;g.computeBoundingSphere();full.dispose();return g;
}
function coatColor(a)""")
 patch('rainworn-humans.mjs',"source:'Quaternius CC0 face, hands and hair / original Rainward outfit'", "source:'Quaternius CC0 authored body and outfit / retained Rainward face, skin and backpack'")
 patch('scene.mjs',"import {renderWaistAR}", "import {footContacts} from './foot-contact.mjs';\nimport {renderWaistAR}")
 patch('scene.mjs',"hero.root.position.y+=heightAt(state.player.x,state.player.z)-(state.player.swimDepth||0);", "hero.root.position.y+=heightAt(state.player.x,state.player.z)-(state.player.swimDepth||0);footContacts(hero,state.player,heightAt);")
 patch('scene.mjs',"model.root.position.y+=heightAt(e.x,e.z);", "model.root.position.y+=heightAt(e.x,e.z);footContacts(model,e,heightAt);")
 patch('actors.mjs',"a.gait+=moving*dt*(crouch?5.1:3.9);", "a.gait+=moving*dt*(crouch?5.1:moving>5?2.1:3.9);")
 patch('quest-xr.mjs',"import {createXRWeapons}", "import {createXRSight} from './xr-sight.mjs';\nimport {createXRWeapons}")
 patch('quest-xr.mjs','const weapons=createXRWeapons();', 'const weapons=createXRWeapons(),sight=createXRSight();weapons.root.add(sight.group);')
 patch('quest-xr.mjs',"render(){if(isDiorama())", "render(){const p=E.state().player;sight.render(renderer,scene,rig,renderContext.hero.root,new T.Vector3(p.x,heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,p.z),new T.Vector3(...Object.values(renderContext.aimDirection(E.state()))),E.state().t,E.freefield?.scope!==false&&safe&&E.mode()==='play'&&p.aim&&p.waterMode!=='swim'&&['pistol','rifle'].includes(p.equipped));if(isDiorama())")
 patch('quest-xr.mjs',"weapon:weapons.stats(),handBlink,", "weapon:weapons.stats(),sight:sight.stats(),handBlink,")
 patch('quest-xr.mjs',"panel.dispose();weapons.dispose();", "panel.dispose();sight.dispose();weapons.dispose();")
 patch('portal-view.mjs',"overlay.add(shell);shell.name=", "overlay.add(shell,new T.HemisphereLight(0xd8e6eb,0x394b42,1.6));shell.name=")
 patch('portal-view.mjs',"const children=[...scene.children].filter(o=>o!==rig),bg=", "const lamps=[];scene.traverse(o=>{if(o.isPointLight||o.isSpotLight)lamps.push({light:o,distance:o.distance,intensity:o.intensity});});\n  const children=[...scene.children].filter(o=>o!==rig),bg=")
 patch('portal-view.mjs',"scene.add(world);for(const child", "for(const item of lamps){if(item.distance>0)item.light.distance=item.distance*config.scale;item.light.intensity=item.intensity*Math.pow(config.scale,item.light.decay||2);}\n   scene.add(world);for(const child")
 patch('portal-view.mjs',"materials.active=false;world.remove(sky);", "for(const item of lamps){item.light.distance=item.distance;item.light.intensity=item.intensity;}\n   materials.active=false;world.remove(sky);")
 patch('freefield-ui.mjs',"['pinnedXR','Pinned field controls (legacy)','checkbox']", "['pinnedXR','Pinned field controls (legacy)','checkbox'],['scope','Magnified weapon sight','checkbox']")
 marker.write_text(json.dumps({'source':'7c241d2c2dd58ee282ef92386d25168626d1c97e','scope':'Meridian, visual bodies/contacts, goal guide and optional weapon sight; native validation remains required'},indent=2)+'\n')
