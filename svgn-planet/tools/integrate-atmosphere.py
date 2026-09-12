"""Apply the scoped shader integration once; never overwrite sibling games.
Scene creation, shader compilation and actual publication are separately tested.
"""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1]
if (P/'atmosphere-integration.json').exists():
 print('Atmosphere integration already present.');raise SystemExit(0)
changes={}
def edit(n,a,b):
 s=changes.get(n,(P/n).read_text());assert a in s,(n,a[:90]);changes[n]=s.replace(a,b)
edit('scene.mjs',"import {createHomecomingPlaza}","import {createAtmosphere} from './atmosphere-scene.mjs';\nimport {createHomecomingPlaza}")
edit('scene.mjs','homecoming=createHomecomingPlaza(root,courier);',"homecoming=createHomecomingPlaza(root,courier);const atmosphere=createAtmosphere({renderer,scene,root,sun,sky,jewel});art.ready.then(()=>atmosphere.refresh());")
edit('scene.mjs','sun.shadow.map=null;}}','sun.shadow.map=null;}atmosphere.refresh();}')
edit('scene.mjs','function restoreAppearance(){jewel.restored();}','function restoreAppearance(){jewel.restored();atmosphere.restored();}')
edit('scene.mjs',"jewel.update(dt,s,camera,mode==='overview');jewel.render(camera);", "jewel.update(dt,s,camera,mode==='overview');atmosphere.update(s,camera,{low:quality.low,quiet:jewel.quiet,overview:mode==='overview'});jewel.render(camera);")
edit('scene.mjs','renderer,scene,camera,life,get fps()','renderer,scene,camera,life,atmosphere,get fps()')
edit('scene.mjs','jewel:jewel.inspect(),boostFov:', 'jewel:jewel.inspect(),atmosphere:atmosphere.inspect(),boostFov:')
edit('art.mjs','const m=new T.Mesh(geo,material);m.receiveShadow=true;',"if(['#5d6b6d','#5f6e70'].includes(color))material.userData.atmosphereRole='road';else if(['#d5ccba','#d2c8b3'].includes(color))material.userData.atmosphereRole='paving';const m=new T.Mesh(geo,material);m.receiveShadow=true;")
edit('street-art.mjs',"ribbonUV(asphalt.geometry,roadPoints,6.4,3);asphalt.material=road;","road.userData.atmosphereRole='road';paving.userData.atmosphereRole='paving';ribbonUV(asphalt.geometry,roadPoints,6.4,3);asphalt.material=road;")
edit('coastal-materials.mjs',"m.side=T.DoubleSide;m.bumpMap=null;", "m.side=T.DoubleSide;m.bumpMap=null;m.userData.atmosphereRole='road';")
edit('city-scene.mjs',"const woodMat=new T.MeshStandardMaterial({color:'#a97c52',roughness:.9});", "const woodMat=new T.MeshStandardMaterial({color:'#a97c52',roughness:.9});leafMat.userData.atmosphereRole='leaf';glassMat.userData.atmosphereRole='window';")
edit('app.mjs',"import {mountHomecomingDOM", "import {mountAtmosphereUI} from './atmosphere-ui.mjs';\nimport {mountHomecomingDOM")
edit('app.mjs',"boot();window.addEventListener('resize'", "boot();const atmosphereUI=mountAtmosphereUI({view:()=>view});window.addEventListener('nm-atmosphere-change',()=>{renderDirty=true;});window.addEventListener('resize'")
edit('app.mjs',"traffic:view.life?.traffic()","traffic:view.life?.traffic(),rain:view.atmosphere?.rainLevel||0")
edit('coastal-audio.mjs','motor,tire,wind,playing=false','motor,tire,wind,rainBed,playing=false')
edit('coastal-audio.mjs',"wind=sustained('noise',650,'ambience');ready=true;", "wind=sustained('noise',650,'ambience');rainBed=sustained('noise',4600,'ambience');ready=true;")
edit('coastal-audio.mjs','ramp(wind.gain.gain,0);','ramp(wind.gain.gain,0);ramp(rainBed.gain.gain,0);')
edit('coastal-audio.mjs','traffic=null}={})','traffic=null,rain=0}={})')
edit('coastal-audio.mjs','if(!playing)return;\n  energy=', 'if(!playing)return;\n  ramp(rainBed.gain.gain,.16*clamp(rain),.22);\n  energy=')
edit('coastal-audio.mjs','[motor,tire,wind]','[motor,tire,wind,rainBed]')
edit('coastal-audio.mjs',"transportCount:ctx?1:0,","rainAmbience:rainBed?.gain.gain.value||0,transportCount:ctx?1:0,")
edit('model.mjs',"VERSION='0.8.0'","VERSION='0.9.0'")
# Bump only this game's import graph and test expectations, not old evidence.
for name in ['index.html','homecoming-ui.mjs','roadmap.html','tests/homecoming_browser.py','tests/coastal_browser_release.py']:
 s=changes.get(name,(P/name).read_text());s=s.replace('0.8.0','0.9.0');changes[name]=s
s=changes['index.html'];s=s.replace('Neighborhood Missions | Homecoming','Neighborhood Missions | Coastal Atmosphere').replace('HOMECOMING v0.9.0','COASTAL ATMOSPHERE v0.9.0')
m=re.search(r'(<script type="importmap">)(.*?)(</script>)',s);assert m;data=json.loads(m.group(2))
for f in P.glob('*.mjs'):data['imports']['./'+f.name]='./'+f.name+'?v=0.9.0'
changes['index.html']=s[:m.start(2)]+json.dumps(data,separators=(',',':'))+s[m.end(2):]
# The canonical roadmap may have newer human notes. Update only related records.
road=json.loads((P/'production/roadmap.json').read_text());road['version']='0.9.0';road['reviewed']='2026-09-12'
for item in road['items']:
 if item['id'] in ('ART-05','ART-06'):
  item['status']='partial';item['lastReviewed']='2026-09-12';item['evidence']=list(dict.fromkeys(item['evidence']+['../ATMOSPHERE.md']))
  item['next']='Coastal Atmosphere adds user-selected daylight, golden hour, rain, after-rain and blue-hour presets with wet-road ripples, leaf light/wind and facade glow. Validate actual shaders and real hardware; live scene reflections, dynamic day/night, interiors and art approval remain open.'
road['items'].append(dict(id='SHADER-01',milestone='M4',priority='P1',status='implemented',title='Coastal Atmosphere shader pack',acceptance='All five visual presets compile on pinned r177; controller settings persist; off/reduced-motion/low modes work; wet shaders are stable around the planet; no physics changes or unbounded rain allocation. Record actual browser and shader results, not a concept mockup.',next='Run shader, regression and WebGL acceptance; publish verified source and retain actual captures. Then obtain physical-device and art-quality approval.',dependencies=['MOVE-01','PERF-01','AUDIO-01'],owner='Rendering / QA',evidence=['../ATMOSPHERE.md'],lastReviewed='2026-09-12'))
changes['production/roadmap.json']=json.dumps(road,indent=2)+'\n'
release=json.loads((P/'release.json').read_text());release.update(version='0.9.0',edition='Coastal Atmosphere',date='2026-09-12',changes=['Add five adjustable coastal lighting/weather presets','Add world-space wet-road shading and rain ripples using existing environment reflections','Add foliage backlighting and subtle vertex breeze with matching shadow depth deformation','Add blue-hour facade glow and one bounded rain batch','Add rain ambience to the existing mixer without a second music transport','Retain Homecoming, all contracts, save identifiers and unlimited cruise physics'])
# Do not present the old edition's evidence as if it tested this release.
for k in ['testedCommit','acceptanceRun','validation','evidence']:release.pop(k,None)
release['acceptance']='Pending v0.9.0 shader and retained-game checks';changes['release.json']=json.dumps(release,indent=2)+'\n'
changes['README.md']='''# Neighborhood Missions: Coastal Atmosphere (v0.9.0)

Open Menu, scroll to Coastal Atmosphere, and choose daylight, golden hour, after-rain sunset, coastal rain or blue hour. D-pad moves focus; left/right selects a preset or adjusts strength; A toggles; B resumes. Each preference is saved separately from gameplay progress. Restore sunny defaults and Disable atmosphere are available without resetting your game.

[Shader implementation and limits](ATMOSPHERE.md). The pack adds wet-road shading and ripple normals, foliage backlighting and subtle wind with matching depth shadows, warm facade glazing, atmospheric sky/fog/light presets, and one bounded rain batch. Rain ambience uses the existing ambience slider and mute/pause handling. No automatic weather cycle, traction penalty, time limit or new acceleration gate was added.

[Production checklist](AAA_ROADMAP.md). Human art approval, foreground asset quality and physical GPU/controller testing remain open. Existing Homecoming progression, 102 contracts, old save slots and sibling games are preserved.

## Earlier Homecoming release notes

'''+(P/'README.md').read_text()
for name,text in changes.items():(P/name).write_text(text)
(P/'atmosphere-integration.json').write_text(json.dumps({'version':'0.9.0','edition':'Coastal Atmosphere','scope':'svgn-planet only; no sibling game changes','maxRainInstances':640,'extraScenePasses':0,'physics':'unchanged apart from the exported version string','save':'old keys retained; separate visual-preference slot'},indent=2)+'\n')
print('Integrated Coastal Atmosphere into',len(changes),'existing game files.')
