"""Materialize the locally verified acceptance refinements once.
Only Neighborhood Missions and its homepage card are changed.
"""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[2]
MARK=ROOT/'svgn-planet/coastal-refinement.json'
if MARK.exists():
 print('Coastal acceptance refinements already integrated.');raise SystemExit(0)
def edit(n,f):
 p=ROOT/n;s=p.read_text();v=f(s);assert s!=v,n;p.write_text(v)
def rep(s,a,b):
 assert a in s,a[:100];return s.replace(a,b)
def scene(s):
 s=rep(s,'antialias:!touch','antialias:!quality.low')
 s=rep(s,"neighbors.forEach(a=>{a.unicycle.visible=a.bicycle.visible=false;});","neighbors.forEach(a=>{a.g.visible=false;a.unicycle.visible=a.bicycle.visible=false;});")
 s=rep(s,"item.g.visible=mode!=='overview'&&distance(n,q.n)<180;", "item.g.visible=false; // Superseded by the pooled continuously sampled cars.\n")
 return s
edit('svgn-planet/scene.mjs',scene)
edit('svgn-planet/controller.mjs',lambda s:rep(rep(rep(s,"let active=null,previous=[]", "let polls=0;let active=null,previous=[]"),'requestAnimationFrame(frame);let pads=[];','requestAnimationFrame(frame);polls++;let pads=[];'),'inspect:()=>({...padState,scope:', 'inspect:()=>({...padState,polls,scope:'))
edit('svgn-planet/tests/v04.test.mjs',lambda s:s.replace('WORLD.bonusStops.length,10','WORLD.bonusStops.filter(s=>!s.city).length,10').replace('WORLD.stuntGates.length,3','WORLD.stuntGates.filter(s=>!s.city).length,3').replace('assert.ok(fast.energy<normal.energy);','assert.equal(fast.energy,1);assert.equal(normal.energy,1);').replace('for(const b of WORLD.bonusStops){','for(const b of WORLD.bonusStops.filter(s=>!s.city)){'))
edit('svgn-planet/tests/model.test.mjs',lambda s:rep(s,"assert.deepEqual(readSave(JSON.stringify(saveData(s))),{delivered:","const recovered=readSave(JSON.stringify(saveData(s)));assert.deepEqual(recovered.jobs,s.jobs);assert.ok(recovered.position.every((v,i)=>Math.abs(v-s.n[i])<1e-12));assert.equal(recovered.vehicle,'unicycle');const {jobs,position,north,vehicle,...original}=recovered;assert.deepEqual(original,{delivered:"))
(ROOT/'svgn-planet/tests/homepage.test.mjs').write_text("""import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
test('Homepage preserves playable routes, requested names and the archived prototype source',()=>{const h=readFileSync(new URL('../../index.html',import.meta.url),'utf8');for(const route of ['vesperfall/index.html','leonardos-guild/index.html','svgn-planet/index.html','rainward/index.html','aether-reach/index.html','mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html'])assert.ok(h.includes('href=\"./'+route),route);assert.ok(h.includes('Play Neighborhood Missions'));assert.ok(h.includes('Sky Cycle'));assert.ok(!h.includes('class=\"project little-planet\"'));assert.ok(existsSync(new URL('../../little-planet/index.html',import.meta.url)));});
""")
edit('index.html',lambda s:re.sub(r'<article class="project planet">.*?</article>',lambda m:m[0].replace('0.6.0','0.7.0').replace('WHOLE-PLANET CITY + XBOX CONTROLS','COASTAL PULSE / MUSIC + CITY CONTRACTS').replace('Ride a bicycle or electric unicycle through 24 sunlit districts on a much larger planet. Explore palm-lined streets, shops and towers, deliver neighborhood news, find postmarks and sprint gates, or take transit across the city. Xbox controls cover both riding and menus.','Meet the neighbors, deliver cafe baskets, restore signals, capture postcards and race through 24 districts. Explore 102 replayable contracts, a cycle workshop, continuous traffic and an original adaptive soundtrack. Accelerate freely, coast without an energy limit, and control the whole game with Xbox.'),s,flags=re.S))
def browser(s):
 s=rep(s,"browser=await p.chromium.launch(headless=True,args=", "browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=")
 s=s.replace("viewport={'width':1280,'height':800}","viewport={'width':960,'height':600}")
 a=s.index('  async def press(');b=s.index('  async def inspect',a)
 s=s[:a]+'''  async def press(i,hold=180):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,touched:true,value:1}}',i)
   await page.wait_for_function('NeighborhoodController.inspect().polls>__before',timeout=45000)
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,touched:false,value:0}}',i)
   await page.wait_for_function('NeighborhoodController.inspect().polls>__before',timeout=45000)
  async def capture(name):
   active=await page.evaluate('SVGNPlanet.inspect().started&&!SVGNPlanet.inspect().paused');style=None
   if active:
    await press(9);style=await page.add_style_tag(content='dialog[open]{visibility:hidden!important}dialog::backdrop{background:transparent!important;backdrop-filter:none!important}')
   await page.screenshot(path=str(OUT/name),timeout=60000)
   if style:await style.evaluate('(el)=>el.remove()')
   if active:await press(1)
''' + s[b:]
 s=s.replace("await page.wait_for_function(\"window.SVGNPlanet && !document.getElementById('start').disabled\",timeout=150000)","await page.wait_for_function(\"(window.SVGNPlanet && !document.getElementById('start').disabled)||!document.getElementById('failure').hidden\",timeout=150000)\n   assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text()")
 s=s.replace("BASE+'?quality=balanced'","BASE+'?quality=low'")
 s=re.sub(r"await page.screenshot\(path=str\(OUT/'([^']+)'\)\)",r"await capture('\1')",s)
 s=s.replace('for _ in range(60):','for _ in range(100):')
 return s
edit('svgn-planet/tests/coastal_browser.py',browser)
p=ROOT/'svgn-planet/README.md';old=p.read_text();p.write_text('''# Neighborhood Missions: Coastal Pulse (v0.7.0)

Coastal Pulse adds 102 replayable contracts across the original neighborhood and 24 city districts. The six activity types are cafe courier runs, cleanup rounds, signal-cabinet timing repairs, viewpoint postcards, checkpoint circuits, and hop-through stunt rings. Contracts earn credits for five cosmetic vehicle finishes. These are variations on six activity systems, not 102 separate story campaigns.

The original delivery route, city deliveries, postmarks, transit, save slot and game URL are retained. Contract state, credits, best times and owned finishes extend the existing version-1 save rather than replacing it. Returning to the depot keeps progress; clearing progress requires an explicit confirmation.

RT or Shift accelerates to the existing 30 meters/second top speed (108 km/h). Boost no longer drains or cycles. Releasing acceleration coasts at the attained speed; LT, B or Ctrl brakes. A real collision, walking/dismounting, or explicitly taking transit can still stop the rider. Fixed-step collision simulation now has interpolated visual poses, and traffic follows continuous arc-length paths instead of jumping between road vertices.

The right stick uses standard look direction, with independently saved horizontal/vertical inversion and sensitivity in Menu. Left-stick click rings the bell. D-pad down or J opens City jobs. View or M opens the map, Menu pauses, and B returns from every new dialog. D-pad up/down selects controls, left/right adjusts sliders and choices, and A activates them. Repair dialogs offer a slower timing assist. All new interfaces retain keyboard and touch alternatives.

The original Coastal Pulse score uses one adaptive 92-BPM transport with electric-key, plucked, bass and percussion parts. The sound system adds delivery chimes, paper swishes, tires, electric drive, bicycle chain and bell, footsteps, jump/landing, braking, pass-bys, birds, wordless neighbor chatter, camera shutter, signal feedback and contract rewards. Music, effects and ambience have independent levels under a master control. Voice counts and cue rates are bounded; pause, backgrounding, mute and the quiet preset reduce sound. No microphone or remote audio service is used.

Browser autoplay policy can require a real click or Enter once before audio will play; a polled gamepad press is not guaranteed to unlock audio. The Enable sound button and audio status explain this without stopping gameplay. After audio is unlocked, its mixer is controller-operable.

The city now has a pooled population of walking neighbors, joggers, cyclists and cars, with bell reactions and contextual conversation. Population density is adjustable. These residents and cars are scenic and do not secretly brake or damage the rider. Original houses are widened by 60 percent with more two-story variants. City homes are larger two-story forms, with textured surfaces, porches, balconies, storefront signs, warmer lighting and bounded, spatially culled detail streaming. Existing licensed art remains available. This is a stylized browser-game upgrade, not a claim of commercial AAA production fidelity.

Release acceptance includes model/regression tests, sustained-speed and traffic-continuity checks, every contract target's collision clearance, save migration, currency, and simulated standard-mapping Xbox UI tests in Chromium. Physical Xbox hardware and the user's own GPU still require real-device testing.

## Original city edition notes

'''+old.replace('# Neighborhood Missions','### Neighborhood Missions',1))
MARK.write_text(json.dumps({'version':'0.7.0','refinement':1,'purpose':'Verified cruise and contract regression fixes; bounded duplicate population; frame-synchronized browser acceptance'},indent=2)+'\n')
print('Verified acceptance refinements integrated.')
