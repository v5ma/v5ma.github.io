"""One-time scoped integration of Homecoming into the existing game.
All edits use exact anchors and are committed on the candidate branch before tests.
"""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1]
if (P/'homecoming-integration.json').exists():
 print('Homecoming integration is already materialized.');raise SystemExit(0)
def patch(n,a,b):
 p=P/n;s=p.read_text();assert a in s,(n,a[:70]);p.write_text(s.replace(a,b))
patch('model.mjs',"import {driveSpeed}","import {readHomecoming} from './homecoming.mjs';\nimport {driveSpeed}")
patch('model.mjs',"VERSION='0.7.0'","VERSION='0.8.0'")
patch('model.mjs','jobs:readJobs(s.jobs)','jobs:readJobs(s.jobs),homecoming:readHomecoming(s.homecoming)')
patch('model.mjs','jobs:createJobs(saved?.jobs)','jobs:createJobs(saved?.jobs),homecoming:readHomecoming(saved?.homecoming)')
patch('model.mjs','jobs:writeJobs(s)}','jobs:writeJobs(s),homecoming:readHomecoming(s.homecoming)}')
patch('app.mjs',"buildCoastalDOM();","buildCoastalDOM();mountHomecomingDOM();")
patch('app.mjs',"import {padState,rumble}","import {mountHomecomingDOM,createHomecomingUI} from './homecoming-ui.mjs';\nimport {storyTarget} from './homecoming.mjs';\nimport {createFrameHealth} from './frame-health.mjs';\nimport {padState,rumble}")
patch('app.mjs',"'repair-dialog','photo-dialog']","'repair-dialog','photo-dialog','homecoming-dialog','health-dialog','production-dialog']")
patch('app.mjs',"audio=createCoastalAudio();","audio=createCoastalAudio(),metrics=createFrameHealth();")
patch('app.mjs','function clear(){touchBraking=false;','function clear(){metrics.gap();touchBraking=false;')
patch('app.mjs',"if(code==='KeyE'){if(!pulseUI.interact(!nearest(s)))","if(code==='KeyE'){if(!storyUI.interact()&&!pulseUI.interact(!nearest(s)))")
patch('app.mjs',"const t=jobTarget(s)||(waypoint?","const t=storyTarget(s)||jobTarget(s)||(waypoint?")
patch('app.mjs','pulseUI.update();','pulseUI.update();storyUI.update();')
patch('app.mjs',"const pulseUI=createCoastalInterface", "const storyUI=createHomecomingUI({state:()=>s,view:()=>view,metrics,open:openDialog,resume,persist});\nconst pulseUI=createCoastalInterface")
patch('app.mjs','coastal:pulseUI.inspect(),','coastal:pulseUI.inspect(),homecoming:storyUI.inspect(),')
patch('app.mjs','view.update(paused?0:', 'const workStart=performance.now();view.update(paused?0:')
patch('app.mjs','{vehicle});lastRender=now;','{vehicle});if(started&&!paused)metrics.frame(now,s.time,performance.now()-workStart);else metrics.gap();lastRender=now;')
patch('coastal-audio.mjs',"case 'job-complete':case 'complete':", "case 'chapter-complete':case 'job-complete':case 'complete':")
patch('scene.mjs',"import {createCoastalLife}","import {createHomecomingPlaza} from './homecoming-view.mjs';\nimport {speedPresentation} from './frame-health.mjs';\nimport {createCoastalLife}")
patch('scene.mjs',"const life=createCoastalLife(root);", "const life=createCoastalLife(root),homecoming=createHomecomingPlaza(root,courier);")
patch('scene.mjs',"city.update(s.n,mode==='overview',quality.low);", "const speedLook=speedPresentation(s.speed,jewel.quiet);city.update(s.n,mode==='overview',quality.low);")
patch('scene.mjs','boostFx.visible=s.boosting&&s.speed>11;', 'boostFx.visible=speedLook.streaks;')
patch('scene.mjs',"baseFov+(s.boosting&&mode==='street'?12:0)","baseFov+(mode==='street'?speedLook.fov:0)")
patch('scene.mjs',"-preset.distance-(s.boosting?1.2:0)","-preset.distance-speedLook.chase")
patch('scene.mjs',"art.update(s.n,mode==='overview');","art.update(s.n,mode==='overview');homecoming.update(dt,s,camera,mode==='overview');")
patch('scene.mjs','life:life.inspect(),', 'life:life.inspect(),homecoming:homecoming.inspect(),')
patch('city-scene.mjs',"c.g.traverse(m=>{if(m.isMesh)m.castShadow=!low&&!overview&&d<225&&!!m.userData.coastalShadow;});", "const shadows=!low&&!overview&&d<225;if(c.shadows!==shadows){c.shadows=shadows;c.g.traverse(m=>{if(m.isMesh)m.castShadow=shadows&&!!m.userData.coastalShadow;});}")
patch('tests/model.test.mjs','const {jobs,position,north,vehicle,...original}', 'assert.deepEqual(recovered.homecoming,s.homecoming);const {jobs,position,north,vehicle,homecoming,...original}')
p=P/'index.html';s=p.read_text().replace('0.7.0','0.8.0').replace('COASTAL PULSE v0.8.0','HOMECOMING v0.8.0').replace('Neighborhood Missions | Coastal Pulse','Neighborhood Missions | Homecoming');m=re.search(r'(<script type="importmap">)(.*?)(</script>)',s);data=json.loads(m.group(2))
for f in P.glob('*.mjs'):data['imports']['./'+f.name]='./'+f.name+'?v=0.8.0'
s=s[:m.start(2)]+json.dumps(data,separators=(',',':'))+s[m.end(2):];s=s.replace('Reduce animated glints and particles','Reduce motion, speed FOV, glints and particles');p.write_text(s)
p=P/'tests/coastal_browser_release.py';s=p.read_text().replace("'0.7.0'","'0.8.0'").replace('headless=True,args=',"executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=");p.write_text(s)
p=P/'README.md';p.write_text('''# Neighborhood Missions: Homecoming (v0.8.0)

Production roadmap: [AAA_ROADMAP.md](AAA_ROADMAP.md). The canonical editable records are in [production/roadmap.json](production/roadmap.json); the [browser checklist](roadmap.html) and the in-game Menu / AAA production checklist read the same source. Real hardware sign-off belongs in [production/hardware-matrix.md](production/hardware-matrix.md). No checklist percentage or feature counter is treated as AAA certification.

This round adds an optional connected Homecoming chapter. Meet Maya across from the original depot, or open Menu / Homecoming story journal. Five existing local contracts become a community story with named speakers and debriefs. Previously completed local projects count. Accepting a chapter never silently replaces an unrelated active contract. A garden/workshop choice changes the authored Common Ground plaza. Cleanup removes litter, repairs restore visible bulbs, and the photography stage displays decorative postcard panels. The final return to Maya awards 500 credits and a mint finish unlock exactly once. The plaza cafe and workshop furniture are scenery, not a fully simulated enterable business; the art and interior-production gates remain open.

Menu / Ride performance report displays the last 600 rendered frames with average fps, p95/p99 frame intervals, CPU submission time, hitch counts and simulation/wall ratio. It excludes pauses and sends nothing automatically. It is not GPU timer data or certification. Speed camera FOV and distance now follow actual velocity instead of throttle state; coasting should no longer visually contract the camera as though braking. Reduce motion disables the speed effects. The existing unlimited-cruise, explicit-brake controls, all 102 contracts, controller mixer, saves and game URL remain intact.

The Common Ground art is authored from existing original primitives and materials. Courier face and backpack details are an incremental polish pass, not a finished skinned hero model. Homecoming is a first vertical-slice step, not a claim that the game now looks like a commercial AAA production.

## Previous Coastal Pulse release notes

'''+p.read_text())
# Preserve every other game and update only this one homepage card.
p=P.parent/'index.html';s=p.read_text();pattern=r'<article class="project planet">.*?</article>';m=re.search(pattern,s,re.S);assert m
card=m.group().replace('v=0.7.0','v=0.8.0').replace('v0.7.0 / COASTAL PULSE / MUSIC + CITY CONTRACTS','v0.8.0 / HOMECOMING + PRODUCTION CHECKLIST')
card=card.replace('Meet the neighbors, deliver cafe baskets, restore signals, capture postcards and race through 24 districts. Explore 102 replayable contracts, a cycle workshop, continuous traffic and an original adaptive soundtrack. Accelerate freely, coast without an energy limit, and control the whole game with Xbox.','Meet Maya and help restore Common Ground in the Homecoming story. Choose a garden or cycle-workshop plaza, keep all 102 contracts, and explore 24 districts with continuous cruising and Xbox controls. The game now includes a measured frame report and a versioned AAA-quality production checklist.')
p.write_text(s[:m.start()]+card+s[m.end():])
(P/'homecoming-integration.json').write_text(json.dumps({'version':'0.8.0','chapter':'Homecoming','scope':'Existing svgn-planet game and its homepage card','save':'Additive v1 fields; original key retained','qualityClaim':'Vertical-slice upgrade; real-device and art approval gates remain open'},indent=2)+'\n')
print('Homecoming integrated without replacing the original game.')
