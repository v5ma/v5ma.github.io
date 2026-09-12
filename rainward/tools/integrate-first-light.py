"""Integrate reviewed First Light changes into Rainward only. Exact anchors
must match once; all writes remain on the feature branch pending acceptance.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
if json.loads((R/'release.json').read_text())['version']=='0.11.0':
    print('First Light already integrated.');raise SystemExit(0)
updates={}
def change(file,before,after):
 p=R/file;s=updates.get(file,p.read_text());assert s.count(before)==1,(file,before[:80],s.count(before));updates[file]=s.replace(before,after)
change('world.mjs',"import {MERIDIAN", "import {FLOODGATE_COVER} from './floodgate-content.mjs';\nimport {MERIDIAN")
change('world.mjs',"export const VERSION='0.10.0'","export const VERSION='0.11.0'")
change('world.mjs','export const OBSTACLES=[','export const OBSTACLES=[\n ...FLOODGATE_COVER.map(o=>({...o})),')
change('state.mjs',"import {arsenal}","import {validFieldNotes} from './floodgate-content.mjs';\nimport {arsenal}")
change('state.mjs','return {level,completedTasks:',"return {level,fieldNotes:[],guideRoute:level==='district'?'garden':null,completedTasks:")
change('state.mjs','JSON.stringify({version:4,arsenal:','JSON.stringify({version:4,fieldNotes:s.fieldNotes||[],guideRoute:s.guideRoute||null,arsenal:')
change('state.mjs','const s=createGame(level,activate);s.completedTasks=',"if(!validFieldNotes(level,d.fieldNotes||[],d.guideRoute||null))return null;\n  const s=createGame(level,activate);s.fieldNotes=[...(d.fieldNotes||[])];s.guideRoute=d.guideRoute||null;s.completedTasks=")
change('supplies.mjs',"import {weapon,", "import {noteTarget,readFieldNote} from './first-light.mjs';\nimport {weapon,")
change('supplies.mjs'," const enemy=s.enemies.find", " const note=noteTarget(s);if(note)return {kind:'field-note',id:note.id,label:'Record / '+note.title};\n const enemy=s.enemies.find")
change('supplies.mjs'," if(target.kind==='task'){", " if(target.kind==='field-note')return readFieldNote(s,target.id);\n if(target.kind==='task'){")
change('scene.mjs',"import {createListenArt}","import {createFirstLightArt} from './first-light-art.mjs';\nimport {createListenArt}")
change('scene.mjs','const taskArt=createTaskArt(scene,A);','const taskArt=createTaskArt(scene,A),firstLight=createFirstLightArt(scene,A,chapter);')
change('scene.mjs','taskArt.update(state);for(const e','taskArt.update(state);firstLight.update(state);for(const e')
change('scene.mjs','visualStatus:()=>({characters:','visualStatus:()=>({firstLight:firstLight.stats(),characters:')
change('app.mjs',"import {createCheckpointStore}","import {createFirstLightUI} from './first-light-ui.mjs';\nimport {createCheckpointStore}")
change('app.mjs','...AUDIO_DEFAULTS,controlPreset:','...AUDIO_DEFAULTS,fieldGuidance:true,controlPreset:')
change('app.mjs',"settings.controlPreset=d.controlPreset", "settings.fieldGuidance=d.fieldGuidance!==false;settings.controlPreset=d.controlPreset")
change('app.mjs','const fieldReady=createFieldReadyUI','const firstLightUI=createFirstLightUI({settings,get state(){return state;},get mode(){return mode;},get scene(){return scene;},get pad(){return pad;},persist(){write(SETTINGS,JSON.stringify(settings));}});\nconst fieldReady=createFieldReadyUI')
change('app.mjs','fieldReady.update();','fieldReady.update();firstLightUI.update();')
change('app.mjs','snapshot:()=>({saves:','snapshot:()=>({fieldNotes:[...state.fieldNotes],guideRoute:state.guideRoute,saves:')
change('index.html','./survival.css\">','./survival.css\"><link rel="stylesheet" href="./first-light.css">')
change('index.html','<span>v0.10.0</span>','<span>v0.11.0</span>')
change('audio.mjs',"else if(type==='pickup'||type==='loot'||type==='clue')", "else if(type==='field-note'||type==='pickup'||type==='loot'||type==='clue')")
for name in ['tests/reclaimed.test.mjs','tests/controller-menus.py']:
 change(name,"'0.10.0'","'0.11.0'")
release=json.loads((R/'release.json').read_text());release.update(version='0.11.0',build='rainward-first-light-20260912',changes=[
'Add six optional original field records to the Floodgate, saved independently from resources and required tasks',
'Introduce Garden and Freight approach selection, collision-aware route markers and optional first-expedition guidance',
'Build actual garden low-cover walls, a weathered pergola, wayfinding signs and readable field-record props',
'Keep both controller presets, full map-journal navigation, all six chapters and earlier shelter saves compatible',
'Advance the 64-task production checklist with scoped Floodgate slice work and retain unapproved human acceptance gates'])
updates['release.json']=json.dumps(release,indent=2)+'\n'
p=R/'production-plan.json';d=json.loads(p.read_text());d.update(release='0.11.0',edition='First Light',updated='2026-09-12',baseline='2381005b666a0db029f3714f07ef0a1f4208c83b')
for t in d['items']:
 if t['id'] in ['RW-009','RW-010','RW-011','RW-013']:
  t['status']='Implemented';t['evidence']='FIRST-LIGHT.md'
d['nextRelease']=['RW-014','RW-034','RW-035','RW-015'];updates['production-plan.json']=json.dumps(d,indent=2)+'\n'
updates['README.md']='# Rainward v0.11.0 / First Light\n\nCurrent release: [FIRST-LIGHT.md](FIRST-LIGHT.md). The Floodgate now has optional field records, two readable approach plans, contextual guidance and an improved rain garden.\n\n'+(R/'README.md').read_text()
change('roadmap.mjs',"'FIELD READY / v'+data.release","(data.edition||'PRODUCTION').toUpperCase()+' / v'+data.release")
change('tools/build-production-plan.py',"+' / Field Ready.'","+' / '+plan.get('edition','Production')+'.'")
for file,text in updates.items():
 (R/file).write_text(text);print('Integrated',file)
subprocess.run(['python',str(R/'tools/build-production-plan.py')],check=True)
