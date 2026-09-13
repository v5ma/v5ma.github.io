"""Idempotent, anchor-checked integration. No sibling game or homepage edits."""
from pathlib import Path
import re,json
P=Path(__file__).resolve().parents[1]
marker=P/'tidewater-integration.json'
if marker.exists():
 print('Tidewater integration already present.');raise SystemExit(0)
def patch(n,a,b):
 p=P/n;s=p.read_text();assert a in s,(n,a[:100]);p.write_text(s.replace(a,b))
patch('city-data.mjs','/* Deterministic',"import {tidalReserve} from './tidewater-layout.mjs';\n/* Deterministic")
patch('city-data.mjs','const original=n=>n[1]>.94', 'const original=n=>tidalReserve(n,radius)||n[1]>.94')
patch('world.mjs',"import {buildCity}","import {tidalReserve} from './tidewater-layout.mjs';\nimport {buildCity}")
patch('world.mjs','export const WORLD=world();','export const WORLD=world();\nWORLD.trees=WORLD.trees.filter(t=>!tidalReserve(t.n));')
patch('model.mjs',"import {driveSpeed}","import {readTide,tideSave,stepWatercraft,tickWater} from './tidewater-core.mjs';\nimport {waterBlocksRider,TIDEWATER} from './tidewater-layout.mjs';\nimport {driveSpeed}")
patch('model.mjs',"VERSION='0.9.0'","VERSION='0.10.0'")
patch('model.mjs','homecoming:readHomecoming(s.homecoming)}','homecoming:readHomecoming(s.homecoming),tide:readTide(s.tide)}')
patch('model.mjs','homecoming:readHomecoming(saved?.homecoming)}','homecoming:readHomecoming(saved?.homecoming),tide:readTide(saved?.tide)}')
patch('model.mjs','position:[...s.n],north:[...s.north],vehicle:', 'position:s.tide.boat?street(...TIDEWATER.dock):[...s.n],north:[...s.north],vehicle:')
patch('model.mjs','export function blocked(n){','export function blocked(n){\n if(waterBlocksRider(n))return true;')
patch('model.mjs',' let dir=input.direction;', ' if(s.tide.boat){stepWatercraft(s,input,dt);tickWater(s,previous,dt);return;}\n let dir=input.direction;')
patch('model.mjs',' tickJobs(s,previous,dt);',' if(!s.tide.active)tickJobs(s,previous,dt);tickWater(s,previous,dt);')
patch('model.mjs',"s.n=n;s.north=stop?", "s.tide.boat=false;s.n=n;s.north=stop?")
patch('app.mjs',"import {mountAtmosphereUI}","import {mountWaterDOM,createWaterUI} from './tidewater-ui.mjs';\nimport {waterTarget} from './tidewater-core.mjs';\nimport {mountAtmosphereUI}")
patch('app.mjs','buildCoastalDOM();mountHomecomingDOM();','buildCoastalDOM();mountHomecomingDOM();mountWaterDOM();')
patch('app.mjs',"'production-dialog']","'production-dialog','water-dialog','water-pump-dialog','water-results-dialog']")
patch('app.mjs',"if(code==='KeyE'){if(!storyUI.interact()", "if(code==='KeyE'){if(!waterUI.interaction()&&!storyUI.interact()")
patch('app.mjs',"if(code==='KeyF'){switchRide(s);persist();}","if(code==='KeyF'){if(!waterUI.craft())switchRide(s);persist();}")
patch('app.mjs','const t=storyTarget(s)||jobTarget(s)||','const t=waterTarget(s)||storyTarget(s)||jobTarget(s)||')
patch('app.mjs','pulseUI.update();storyUI.update();','pulseUI.update();storyUI.update();waterUI.update();')
patch('app.mjs','const storyUI=createHomecomingUI',"const waterUI=createWaterUI({state:()=>s,view:()=>view,audio,open:openDialog,resume,persist,resetView(){clear();view?.recenter();view?.setCamera('street');mode=0;renderDirty=true;}});\nconst storyUI=createHomecomingUI")
patch('app.mjs','homecoming:storyUI.inspect(),','homecoming:storyUI.inspect(),tidewater:waterUI.inspect(),')
patch('scene.mjs',"import {createAtmosphere}","import {createTidewater} from './tidewater-scene.mjs';\nimport {createAtmosphere}")
patch('scene.mjs','art.ready.then(()=>atmosphere.refresh());',"art.ready.then(()=>atmosphere.refresh());const tidewater=createTidewater({root,courier,jewel,sun});")
patch('scene.mjs','jewel.restored();atmosphere.restored();','jewel.restored();atmosphere.restored();tidewater.restored();')
patch('scene.mjs',"});jewel.render(camera);", "});tidewater.update(dt,s,camera,{low:quality.low,quiet:jewel.quiet,overview:mode==='overview',rain:atmosphere.rainLevel,night:atmosphere.inspect().effective?.night||0});jewel.render(camera);")
patch('scene.mjs','atmosphere:atmosphere.inspect(),','atmosphere:atmosphere.inspect(),tidewater:tidewater.inspect(),')
patch('coastal-audio.mjs','wind,rainBed,playing','wind,rainBed,waterBed,playing')
patch('coastal-audio.mjs',"rainBed=sustained('noise',4600,'ambience');", "rainBed=sustained('noise',4600,'ambience');waterBed=sustained('noise',500,'ambience');")
patch('coastal-audio.mjs','ramp(rainBed.gain.gain,0);','ramp(rainBed.gain.gain,0);ramp(waterBed.gain.gain,0);')
patch('coastal-audio.mjs',"case 'chapter-complete':", "case 'water-complete':case 'chapter-complete':")
patch('coastal-audio.mjs',"case 'ui':tone", "case 'water-stage':tone(hz(74),.3,.06,'bell',now);break;\n   case 'water-skim':case 'water-splash':case 'water-board':case 'water-dock':hiss(.38,.16,640,now);hiss(.16,.08,2100,now+.08);break;\n   case 'water-pump':hiss(.6,.12,480,now);tone(120,.5,.055,'bass',now);break;\n   case 'water-valve':hiss(.055,.05,1300,now);tone(520,.05,.02,'pluck',now);break;\n   case 'water-bump':hiss(.12,.09,230,now);break;\n   case 'ui':tone")
patch('coastal-audio.mjs','energy=clamp(s.speed/30);',"const nearWater=s.n[1]>.94&&s.n[0]>.016&&s.n[0]<.16&&s.n[2]>.035&&s.n[2]<.18;ramp(waterBed.gain.gain,nearWater?(.024+(s.tide?.boat?.018:0))*(.85+.15*Math.sin(s.time*.8)):0,.25);\n  energy=clamp(s.speed/30);")
patch('coastal-audio.mjs',"s.ride&&vehicle!=='bicycle'?", "s.ride&&!s.tide?.boat&&vehicle!=='bicycle'?")
patch('coastal-audio.mjs','s.ride?.11*energy:0','s.ride&&!s.tide?.boat?.11*energy:0')
patch('coastal-audio.mjs','[motor,tire,wind,rainBed]','[motor,tire,wind,rainBed,waterBed]')
patch('tests/atmosphere.test.mjs',r'\[motor,tire,wind,rainBed\]',r'\[motor,tire,wind,rainBed,waterBed\]')
patch('tests/model.test.mjs','const {jobs,position,north,vehicle,homecoming,...original}', 'assert.deepEqual(recovered.tide,s.tide);const {jobs,position,north,vehicle,homecoming,tide,...original}')
p=P/'tidewater-ui.mjs';p.write_text(p.read_text().replace('toggleWatercraft(s=state())','toggleWatercraft(state())'))
p=P/'index.html';s=p.read_text().replace('0.9.0','0.10.0').replace('Coastal Atmosphere</title>','Tidewater Commons</title>').replace('COASTAL ATMOSPHERE v0.10.0','TIDEWATER COMMONS v0.10.0');m=re.search(r'(<script type="importmap">)(.*?)(</script>)',s);assert m;d=json.loads(m.group(2))
for f in P.glob('*.mjs'):d['imports']['./'+f.name]='./'+f.name+'?v=0.10.0'
s=s[:m.start(2)]+json.dumps(d,separators=(',',':'))+s[m.end(2):];p.write_text(s)
for name in ['tests/coastal_browser_release.py','tests/homecoming_browser.py','tests/atmosphere-browser.py']:
 p=P/name;s=p.read_text().replace("'0.9.0'","'0.10.0'").replace('v=0.9.0','v=0.10.0');p.write_text(s)
# Update the existing maintained production record without dropping older gates.
p=P/'production/roadmap.json';d=json.loads(p.read_text());d['version']='0.10.0';d['reviewed']='2026-09-13'
new=[('WATER-01','Three playable waterfront excursions','Pool service requires proximity, braking, three skims and a valve-routing puzzle. Canal courier uses a controllable skiff, ordered buoys, collection, docking and shore handoff. Boardwalk relay has ten swept checkpoints. Rewards and times persist without replacing the old city job.','Run full model and controller acceptance; retain exact results.'),('WATER-02','Refractive Seaglass Pool and Lantern Canal','Two bounded PBR water surfaces show analytical tiled-basin refraction, depth tint, animated caustic-style light and boat/skim ripple impulses. Existing environment reflections are not live-scene mirrors. No swimming is implemented.','Review actual shader captures in daylight, rain and blue hour; physical GPU/art approval stays open.'),('WATER-03','Controller-first dock, recovery and water menus','X works and Y explicitly boards/docks at low speed. Every water dialog supports B. Saves made in the skiff resume safely at the pier. Original riding speed and controls remain.','Test entry, all activities, safe exit, reload, context recovery and physical Xbox input.')]
ids={i['id'] for i in d['items']}
for id,title,acceptance,next in new:
 if id not in ids:d['items'].append(dict(id=id,milestone='M2',priority='P1',status='implemented',title=title,acceptance=acceptance,next=next,dependencies=['SAVE-01','INPUT-01'],evidence=['../tests/tidewater.test.mjs'],owner='Design / engineering / QA',lastReviewed='2026-09-13'))
p.write_text(json.dumps(d,indent=2)+'\n')
p=P/'production/render-roadmap.py';p.write_text(p.read_text().replace('Coastal Atmosphere v0.9.0','Tidewater Commons v0.10.0').replace('Homecoming v0.8.0','Tidewater Commons v0.10.0'))
p=P/'release.json';d=json.loads(p.read_text());d.update(version='0.10.0',edition='Tidewater Commons',date='2026-09-13',acceptance='Awaiting final water acceptance',changes=['Add Seaglass Pool with playable skimming and filter routing','Add a boatable Lantern Canal, pedal skiff and harbor courier excursion','Add a connected ten-checkpoint boardwalk relay, local map and results screen','Add two bounded analytical-refraction water shaders, ripple impulses and water ambience','Retain existing saves, 102 city contracts, Homecoming, weather presets and unlimited riding cruise'])
for key in ['validation','testedCommit','acceptanceRun','evidence']:d.pop(key,None)
p.write_text(json.dumps(d,indent=2)+'\n')
p=P/'README.md';p.write_text('# Neighborhood Missions: Tidewater Commons (v0.10.0)\n\nChoose **Play the water missions now** on the title screen, or **Menu / Water missions / pool & marina** while playing. The authored waterfront is connected to Sunrise Boulevard near the original depot; optional transit gets you there immediately. See [TIDEWATER.md](TIDEWATER.md) for activities, controls, shader scope and save behavior.\n\n'+p.read_text())
marker.write_text(json.dumps({'version':'0.10.0','edition':'Tidewater Commons','scope':'svgn-planet only; no sibling games or homepage edits','surface':'Two bounded analytical-refraction basins, no live-scene reflection pass','activities':3,'save':'Original v1 key, additive tide field; saved boating resumes safely at dock','controls':'X work, Y board/dock, existing A hop/RT accelerate/LT or B brake preserved','limits':'No swimming, open-ocean navigation or live scene reflection claimed'},indent=2)+'\n')
print('Tidewater integrated.')
