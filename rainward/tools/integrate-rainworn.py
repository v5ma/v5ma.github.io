"""Integrate Rainward-only changes with exact, unique source anchors.
All edits are checked in memory before any source file is written.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
if json.loads((R/'release.json').read_text())['version']=='0.12.0':
 print('Rainworn already integrated.');raise SystemExit(0)
updates={}
def replace(file,old,new):
 p=R/file;s=updates.get(file,p.read_text());assert s.count(old)==1,(file,old[:80],s.count(old));updates[file]=s.replace(old,new)
replace('artkit.mjs','const material=new T.MeshStandardMaterial({color,',"const wetSurface=['stone','brick','road','rock','ground','paving'].includes(type),Material=wetSurface?T.MeshPhysicalMaterial:T.MeshStandardMaterial;\n const material=new Material({color,...(wetSurface?{clearcoat:.42,clearcoatRoughness:.18}:{}),")
replace('scene.mjs',"import {createFirstLightArt}","import {createDetailedHumans} from './rainworn-humans.mjs';\nimport {createRainwornMaterials} from './rainworn-materials.mjs';\nimport {createFirstLightArt}")
replace('scene.mjs','const hero=actor(scene,mesh,0x886055),enemies=new Map();','const hero=actor(scene,mesh,0x886055),enemies=new Map(),humans=createDetailedHumans(scene,hero,enemies),rainFilm=createRainwornMaterials(A,chapter);let humanEnabled=true,filmEnabled=true;')
replace('scene.mjs','listenArt.update(state);graphics.update();','humans.update(state);rainFilm.update();listenArt.update(state);graphics.update();')
replace('scene.mjs','dead=true;listenArt.dispose();','dead=true;listenArt.dispose();humans.dispose();')
replace('scene.mjs','visualStatus:()=>({firstLight:','setRainworn(human,film){humanEnabled=!!human;filmEnabled=!!film;humans.set(humanEnabled,requestedLow);rainFilm.set(filmEnabled,requestedLow);},retryHumans:()=>humans.retry(),visualStatus:()=>({rainworn:{humans:humans.stats(),film:rainFilm.stats()},firstLight:')
replace('scene.mjs','setQuality(low){requestedLow=!!low;','setQuality(low){requestedLow=!!low;humans.set(humanEnabled,low);rainFilm.set(filmEnabled,low);')
replace('app.mjs',"import {createFirstLightUI}","import {createRainwornUI} from './rainworn-ui.mjs';\nimport {createFirstLightUI}")
replace('app.mjs','...AUDIO_DEFAULTS,fieldGuidance:true,','...AUDIO_DEFAULTS,detailedHumans:true,rainFilm:true,fieldGuidance:true,')
replace('app.mjs','settings.fieldGuidance=d.fieldGuidance!==false;','settings.detailedHumans=d.detailedHumans!==false;settings.rainFilm=d.rainFilm!==false;settings.fieldGuidance=d.fieldGuidance!==false;')
replace('app.mjs','function clearInput(){',"const rainwornUI=createRainwornUI({settings,persist(){write(SETTINGS,JSON.stringify(settings));},apply(){scene?.setRainworn(settings.detailedHumans,settings.rainFilm);},retry(){scene?.retryHumans();}});\nfunction clearInput(){")
replace('app.mjs','function configureScene(){scene.setQuality(settings.low);','function configureScene(){scene.setRainworn(settings.detailedHumans,settings.rainFilm);scene.setQuality(settings.low);')
replace('app.mjs','firstLightUI.update();','firstLightUI.update();rainwornUI.update(scene.visualStatus().rainworn);')
replace('index.html','href="./first-light.css">','href="./first-light.css"><link rel="stylesheet" href="./rainworn.css">')
replace('index.html','<span>v0.11.0</span>','<span>v0.12.0</span>')
replace('world.mjs',"VERSION='0.11.0'","VERSION='0.12.0'")
for file in ['tests/first-light.py','tests/controller-menus.py','tests/reclaimed.test.mjs']:
 updates[file]=(R/file).read_text().replace('0.11.0','0.12.0')
replace('listen-art.mjs','if(!o.isMesh||o.userData.listenEcho)return;','if(!o.isMesh||o.userData.listenEcho||o.userData.replacedBody)return;')
replace('listen-art.mjs','return {group,parts,material,ripple};','return {group,parts,material,ripple,revision:model.visualRevision||0};')
replace('listen-art.mjs','let echo=echoes.get(e.id);if(!echo',"let echo=echoes.get(e.id);if(echo&&echo.revision!==(model.visualRevision||0)){scene.remove(echo.group);echo.material.dispose();echo.ripple.geometry.dispose();echoes.delete(e.id);echo=null;}if(!echo")
d=json.loads((R/'release.json').read_text());d.update(version='0.12.0',build='rainward-rainworn-20260912',changes=['Add locally hosted Quaternius CC0 female and male human meshes, fitted to the existing gameplay rig and fully clothed for Rainward','Retain all crouch, crawl, aim, reload, melee, healing, crafting and death poses with the real existing weapons and unchanged collision','Add composed wet-surface film, patchy roughness and a clear-coat rain response, plus fabric sheen on adapted clothing','Provide controller-operable detailed-human and rain-film switches, recoverable asset-loading fallback and bounded distance detail','Preserve six expeditions, both controller layouts, chapter saves, field records, required objectives and original licensed assets']);updates['release.json']=json.dumps(d,indent=2)+'\n'
d=json.loads((R/'production-plan.json').read_text());d.update(release='0.12.0',edition='Rainworn',baseline='ffe0b6b83fadb0ded6a9964156a4fd2d8c97719f')
for task in d['items']:
 if task['id']=='RW-034':task['status']='Implemented';task['evidence']='RAINWORN.md'
 if task['id']=='RW-039':task['status']='Implemented';task['evidence']='rainworn-materials.mjs'
 if task['id']=='RW-040':task['evidence']='assets/humans/manifest.json'
d['nextRelease']=['RW-014','RW-035','RW-036','RW-044'];updates['production-plan.json']=json.dumps(d,indent=2)+'\n'
updates['README.md']='# Rainward v0.12.0 / Rainworn\n\nCurrent release: [RAINWORN.md](RAINWORN.md). Free human-model provenance: [assets/humans/manifest.json](assets/humans/manifest.json).\n\n'+(R/'README.md').read_text()
for file,text in updates.items():(R/file).write_text(text)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
print('Integrated',len(updates),'Rainward source files; other games unchanged.')
