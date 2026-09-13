"""Scoped, idempotent integration into the existing Neighborhood Missions game.
Exact anchors fail loudly instead of overwriting unrelated or newer work.
"""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1]
MARK=P/'tideglass-integration.json'
if MARK.exists():
 print('Tideglass is already integrated.');raise SystemExit(0)
def patch(n,a,b):
 p=P/n;s=p.read_text();assert a in s,(n,a[:110]);p.write_text(s.replace(a,b))
patch('model.mjs',"import {readHomecoming}","import {readAquatics,createAquatics} from './aquatics-core.mjs';\nimport {readHomecoming}")
patch('model.mjs',"VERSION='0.9.0'","VERSION='0.10.0'")
patch('model.mjs','homecoming:readHomecoming(s.homecoming)','homecoming:readHomecoming(s.homecoming),aquatics:readAquatics(s.aquatics)')
patch('model.mjs','homecoming:readHomecoming(saved?.homecoming)','homecoming:readHomecoming(saved?.homecoming),aquatics:createAquatics(saved?.aquatics)')
patch('model.mjs','if(CITY.blocked(n))return true;',"if(CITY.blocked(n)||distance(n,street(-37,10))<3.2)return true;")
patch('app.mjs',"import {mountAtmosphereUI}","import {mountAquaticDOM,createAquaticUI,poolPreferences} from './aquatics-ui.mjs';\nimport {stepPool,poolLook,returnToDeck} from './aquatics-core.mjs';\nimport {mountAtmosphereUI}")
patch('app.mjs','buildCoastalDOM();mountHomecomingDOM();','buildCoastalDOM();mountHomecomingDOM();mountAquaticDOM();')
patch('app.mjs',"'health-dialog','production-dialog'];","'health-dialog','production-dialog','pool-board','pool-valve','pool-result'];")
patch('app.mjs','function clear(){metrics.gap();',"function clear(){if(typeof poolUI!=='undefined')poolUI.resetTouch();metrics.gap();")
patch('app.mjs',"if(code==='KeyE'){if(!storyUI.interact()", "if(code==='KeyE'){if(!poolUI.interact()&&!storyUI.interact()")
patch('app.mjs'," if(!started||paused||failed||graphicsLost)return;\n if(code==='KeyE')", """ if(!started||paused||failed||graphicsLost)return;
 if(s.aquatics.inside){
  if(code==='KeyE')poolUI.interact();
  else if(code==='KeyF'){returnToDeck(s);clear();persist();}
  else if(code==='KeyJ'||code==='KeyM')poolUI.board();
  else if(code==='KeyV'){s.aquatics.view=s.aquatics.view==='chase'?'first':'chase';renderDirty=true;}
  else if(code==='KeyC'){s.aquatics.yaw=0;s.aquatics.pitch=0;renderDirty=true;}
  else if(code==='KeyH')openHelp();
  else if(code==='KeyK')audio.toggleMute();
  return;
 }
 if(code==='KeyE')""")
patch('app.mjs','view?.orbitBy((e.clientX-orbitDrag.x)*.005);',"s.aquatics.inside?poolLook(s,-(e.clientX-orbitDrag.x)*.005,0):view?.orbitBy((e.clientX-orbitDrag.x)*.005);")
patch('app.mjs','function changeView(){if(!view)return;',"function changeView(){if(s.aquatics.inside){s.aquatics.view=s.aquatics.view==='chase'?'first':'chase';renderDirty=true;return;}if(!view)return;")
patch('app.mjs','function openMap(){if(!started||paused)return;',"function openMap(){if(!started||paused)return;if(s.aquatics.inside){poolUI.board();return;}")
patch('app.mjs','function transit(id){if(!travelTo(s,id))return false;',"function transit(id){if(!travelTo(s,id))return false;if(s.aquatics.inside){s.aquatics.inside=false;view.aquatic.release();}")
patch('app.mjs','pulseUI.update();storyUI.update();','pulseUI.update();storyUI.update();poolUI.update();')
patch('app.mjs',"const storyUI=createHomecomingUI", "const poolUI=createAquaticUI({state:()=>s,view:()=>view,audio,open:openDialog,resume,persist,changed:()=>{renderDirty=true;clear();}});\nconst storyUI=createHomecomingUI")
patch('app.mjs','homecoming:storyUI.inspect(),','homecoming:storyUI.inspect(),aquatics:poolUI.inspect(),')
patch('app.mjs','view.lookBy(padState.lookX*dt*2*preferences.sensitivity*(preferences.invertX?-1:1),padState.lookY*dt*1.2*preferences.sensitivity*(preferences.invertY?-1:1));',"if(s.aquatics.inside)poolLook(s,padState.lookX*dt*2*preferences.sensitivity*(preferences.invertX?-1:1),padState.lookY*dt*1.2*preferences.sensitivity*(preferences.invertY?-1:1));else view.lookBy(padState.lookX*dt*2*preferences.sensitivity*(preferences.invertX?-1:1),padState.lookY*dt*1.2*preferences.sensitivity*(preferences.invertY?-1:1));")
patch('app.mjs','step(s,input(),1/60);','if(s.aquatics.inside)stepPool(s,poolInput(),1/60);else step(s,input(),1/60);')
patch('app.mjs','renderPose(previousPose,s,acc*60),{vehicle}',"{...renderPose(previousPose,s,acc*60),poolAlpha:acc*60},{vehicle,poolSimple:poolPreferences.simple}")
patch('app.mjs','function drawMap(){',"""function poolInput(){return {
 x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick[0]+padState.x,
 z:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))+stick[1]+padState.y,
 ascend:padState.ascend||poolUI.touch.ascend||keys.has('Space'),dive:padState.dive||poolUI.touch.dive||keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyB'),
 boost:padState.boost||boost||keys.has('ShiftLeft')||keys.has('ShiftRight'),brake:padState.poolBrake||touchBraking};}
function drawMap(){""")
patch('app.mjs','rain:view.atmosphere?.rainLevel||0','rain:s.aquatics.inside?0:view.atmosphere?.rainLevel||0,pool:s.aquatics')
patch('controller.mjs',"boost:false,brake:false,id:''", "boost:false,brake:false,ascend:false,dive:false,poolBrake:false,id:''")
patch('controller.mjs','padState.boost=padState.brake=false;','padState.boost=padState.brake=padState.ascend=padState.dive=padState.poolBrake=false;')
patch('controller.mjs','padState.brake=(pad.buttons[6]?.value||0)>.2||buttons[1];','padState.brake=(pad.buttons[6]?.value||0)>.2||buttons[1];padState.ascend=buttons[0];padState.dive=buttons[1];padState.poolBrake=(pad.buttons[6]?.value||0)>.2;')
patch('scene.mjs',"import {createAtmosphere}","import {createAquaticScene,createAquaticEntrance} from './aquatics-scene.mjs';\nimport {createAtmosphere}")
patch('scene.mjs',"let mode='street',", "let aquaticRoom=null,poolWasActive=false;const aquaticEntry=createAquaticEntrance(root);const aquatic={release:()=>aquaticRoom?.release(),inspect:()=>aquaticRoom?.inspect()||{active:false,renderTargets:0}};\n let mode='street',")
patch('scene.mjs',"vehicle='unicycle'}={}){", "vehicle='unicycle',poolSimple=false}={}){")
patch('scene.mjs','  const speedLook=speedPresentation',"  aquaticEntry.update(s.n);if(s.aquatics.inside){aquaticRoom??=createAquaticScene(renderer);aquaticRoom.render(dt,s,{low:quality.low,quiet:jewel.quiet,simple:poolSimple});poolWasActive=true;return;}if(poolWasActive){aquaticRoom?.release();poolWasActive=false;ready=false;}\n  const speedLook=speedPresentation")
patch('scene.mjs','function restoreAppearance(){jewel.restored();atmosphere.restored();}','function restoreAppearance(){jewel.restored();atmosphere.restored();aquaticRoom?.restored();}')
patch('scene.mjs','renderer,scene,camera,life,atmosphere,','renderer,scene,camera,life,atmosphere,aquatic,')
patch('scene.mjs','atmosphere:atmosphere.inspect(),','atmosphere:atmosphere.inspect(),aquatics:aquatic.inspect(),')
patch('coastal-audio.mjs','wind,rainBed,playing=', 'wind,rainBed,poolBed,muffle,playing=')
patch('coastal-audio.mjs','master.connect(compressor);',"muffle=ctx.createBiquadFilter();muffle.type='lowpass';muffle.frequency.value=20000;master.connect(muffle);muffle.connect(compressor);")
patch('coastal-audio.mjs',"rainBed=sustained('noise',4600,'ambience');", "rainBed=sustained('noise',4600,'ambience');poolBed=sustained('noise',550,'ambience');")
patch('coastal-audio.mjs','ramp(rainBed.gain.gain,0);','ramp(rainBed.gain.gain,0);ramp(poolBed.gain.gain,0);')
patch('coastal-audio.mjs',"case 'throw':", "case 'pool-splash':hiss(.6,.16,1450,now);tone(92,.25,.04,'bass',now);break;\n   case 'pool-stage':case 'pool-pickup':case 'pool-valve':tone(hz(76),.32,.07,'bell',now);hiss(.16,.025,750,now);break;\n   case 'pool-enter':case 'pool-job':tone(hz(62),.8,.045,'keys',now);tone(hz(69),.8,.045,'keys',now+.1);break;\n   case 'throw':")
patch('coastal-audio.mjs',"case 'chapter-complete':", "case 'pool-complete':case 'chapter-complete':")
patch('coastal-audio.mjs','traffic=null,rain=0}={}){','traffic=null,rain=0,pool=null}={}){')
patch('coastal-audio.mjs','  if(!playing)return;','  if(!playing)return;\n  ramp(muffle.frequency,pool?.inside&&pool.swimming&&pool.p[1]<-1?1800:20000,.16);ramp(poolBed.gain.gain,pool?.inside?.075:0,.2);\n  if(pool?.inside){energy=.15;ramp(motor.gain.gain,0);ramp(tire.gain.gain,0);ramp(wind.gain.gain,0);ramp(rainBed.gain.gain,0);ramp(poolBed.filter.frequency,380+pool.speed*80,.15);return;}')
patch('coastal-audio.mjs','[motor,tire,wind,rainBed]','[motor,tire,wind,rainBed,poolBed]')
patch('coastal-audio.mjs','rainAmbience:rainBed?.gain.gain.value||0,','poolAmbience:poolBed?.gain.gain.value||0,underwaterCutoff:muffle?.frequency.value||20000,rainAmbience:rainBed?.gain.gain.value||0,')
patch('tests/model.test.mjs','homecoming,...original','homecoming,aquatics,...original')
patch('tests/atmosphere.test.mjs',r'\[motor,tire,wind,rainBed\]',r'\[motor,tire,wind,rainBed,poolBed\]')
p=P/'index.html';s=p.read_text().replace('0.9.0','0.10.0').replace('COASTAL ATMOSPHERE v0.10.0','TIDEGLASS v0.10.0').replace('Neighborhood Missions | Coastal Atmosphere','Neighborhood Missions | Tideglass');m=re.search(r'(<script type="importmap">)(.*?)(</script>)',s);d=json.loads(m.group(2))
for f in P.glob('*.mjs'):d['imports']['./'+f.name]='./'+f.name+'?v=0.10.0'
s=s[:m.start(2)]+json.dumps(d,separators=(',',':'))+s[m.end(2):];s=s.replace('Clear all deliveries, contracts, credits, finishes, sprint gates and postmarks?','Clear all deliveries, water missions, city contracts, credits, finishes, sprint gates and postmarks?');p.write_text(s)
for n in ['tests/homecoming_browser.py','tests/coastal_browser_release.py','tests/atmosphere-browser.py']:
 p=P/n;s=p.read_text().replace('0.9.0','0.10.0').replace('0.8.0','0.10.0');p.write_text(s)
# Update only the current canonical record, preserving every previous milestone.
p=P/'production/roadmap.json';d=json.loads(p.read_text());d['version']='0.10.0';d['reviewed']='2026-09-12'
new=[('WATER-01','Playable aquatic-center zone','Three controller-operable swimming missions with real depth, clear deck/city exits, additive save fields and no city-contract side effects.','Design / engineering'),('WATER-02','Bounded pool reflection and refraction','Local pool captures have fixed upper resolution; Low/lightweight uses no extra render targets. Reduce motion freezes procedural animation. Context recovery and repeated entry must not leak resources.','Rendering / QA'),('WATER-03','Aquatics acceptance and physical-device review','Complete all three missions through actual inputs; retain shader logs, game captures and save/reload results. A physical Xbox and real-GPU frame target require separate approval.','Engineering / QA')]
known={i['id'] for i in d['items']}
for ident,title,accept,owner in new:
 if ident not in known:d['items'].append(dict(id=ident,milestone='M2' if ident=='WATER-01' else 'M4' if ident=='WATER-02' else 'M5',priority='P1',status='implemented' if ident!='WATER-03' else 'needs-playtest',title=title,acceptance=accept,next='Run Tideglass automated acceptance and review actual pool captures; record physical-device results separately.',dependencies=['SAVE-01','INPUT-01'] if ident=='WATER-01' else ['PERF-01'] if ident=='WATER-02' else ['WATER-01','WATER-02'],evidence=['../aquatics-core.mjs' if ident=='WATER-01' else '../aquatics-scene.mjs' if ident=='WATER-02' else '../tests/aquatics-browser.py'],owner=owner,lastReviewed='2026-09-12'))
p.write_text(json.dumps(d,indent=2)+'\n')
p=P/'release.json';d=json.loads(p.read_text());d.update(version='0.10.0',edition='Tideglass',date='2026-09-12',changes=['Add optional Tideglass Aquatic Center inside the existing game with three repeatable water missions','Add real swim depth, pool walls and floor, ladder/deck recovery and safe city return','Add local reflection/refraction, procedural tile caustics, water ripples and underwater fog','Use the existing soundtrack/mixer for pool ambience and underwater filtering','Preserve original saves, Homecoming, all city contracts and road cruise behavior'],validation={'status':'Awaiting Tideglass acceptance','physicalControllerTested':False,'hardwareFPSCertified':False}));d.pop('testedCommit',None);d.pop('acceptanceRun',None);p.write_text(json.dumps(d,indent=2)+'\n')
p=P/'README.md';p.write_text('''# Neighborhood Missions: Tideglass (v0.10.0)

Visit the new aquatic center from Menu / Visit Tideglass Aquatic Center, or ride to the civic entrance just behind the original depot. [TIDEGLASS.md](TIDEGLASS.md) explains its three water missions, swimming controls, shaders and limits. This is an indoor zone in the existing game, not a new project or save slot.

The original city route, all 102 city contracts, Homecoming, cosmetics and road cruising remain. Pool progress is additive. Reloading returns safely outside and retains the active water mission, best times and records. There is no oxygen or swim-stamina countdown. Low graphics or Lightweight pool water disables the two extra local reflection/refraction captures.

## Previous release notes

'''+p.read_text())
MARK.write_text(json.dumps({'version':'0.10.0','edition':'Tideglass','scope':'Existing svgn-planet game only; no sibling-game or homepage replacement','save':'Additive fields under original v1 key','missions':3,'hardwareApproval':False},indent=2)+'\n')
print('Integrated Tideglass; existing game, save key and production history preserved.')
