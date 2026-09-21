"""Exact-preimage source refinement. No game state, saves or sibling files are edited."""
from pathlib import Path
import subprocess,json

def edit(name,before,after,replacements,append=''):
 p=Path('svgn-planet')/name
 actual=subprocess.check_output(['git','hash-object',str(p)],text=True).strip()
 if actual==after:return
 assert actual==before,'Unexpected source: '+name
 text=p.read_text()
 for old,new in replacements:
  assert text.count(old)==1,(name,old)
  text=text.replace(old,new)
 p.write_text(text+append)
 assert subprocess.check_output(['git','hash-object',str(p)],text=True).strip()==after,'Postimage mismatch: '+name

edit('spatial-console.mjs','3e7be72ff169d515d0be5575c3e28e5730b02aab','65e6a4cc295f8c556529fac24e300581b2e23736',[
 ("signature='',hostHand=null;","signature='',hostHand=null,controllerDocked=false;"),
 ("  if(open&&prefs.mount==='controller'&&host){","  controllerDocked=!!(open&&prefs.mount==='controller'&&host&&sources.length>1);\n  if(controllerDocked){"),
 ("base.visible=prefs.mount==='floor'&&(open||lookingDown)","base.visible=!controllerDocked&&(open||lookingDown)"),
 ("mount:prefs.mount,preferences:","mount:prefs.mount,controllerDocked,preferences:"),
 ("anchor=null;opened=false;amount=0;rows=[];","anchor=null;opened=false;amount=0;controllerDocked=false;rows=[];")
])
edit('spatial-console.test.mjs','a108672bb2bb9e4ed761b4ed5ec9c5bb129e8ebf','53939af61966bb77affcbc9a86a368bd87733ff5',[
 ("let now=0;","let now=0;const sources=[source,{handedness:'right'}];"),
 ("sources:[source],dominant:","sources,dominant:"),
 ("return {ui,panel,consoleUI,source,viewer,step,data,","return {ui,panel,consoleUI,source,sources,viewer,step,data,"),
 ("test('Closing, controller loss and end leave no stale interactive surfaces',()=>{const h=fixture();h.step();","test('Closing, controller loss and end leave no stale interactive surfaces',()=>{const h=fixture();h.consoleUI.configure('mount','controller');h.step();"),
 ("assert.equal(q.anchor,null);","assert.equal(q.anchor,null);assert.equal(q.controllerDocked,false);")
],"\ntest('A single tracked hand or controller can always use the floor fallback instead of pointing at its own wrist',()=>{const h=fixture();h.consoleUI.configure('mount','controller');h.step();assert.equal(h.consoleUI.inspect().controllerDocked,true);h.sources.pop();h.step();assert.equal(h.consoleUI.inspect().controllerDocked,false);assert.equal(h.consoleUI.inspect().mount,'controller');assert.ok(h.consoleUI.ready);assert.ok(h.consoleUI.inspect().panelMatrix.every(Number.isFinite));});\n")
edit('console-browser.py','68b199a4f14f486a5755087f6eeff183fa2cc0c2','298b768f5aa1a8b1f2059804bfa996649d80cd87',[
 ("'inputOnly':True};start=time.time()","'inputOnly':True,'renderQuality':'low (normal game option; no physics changes)'};start=time.time()"),
 ("await page.goto(BASE,wait_until='domcontentloaded')","await page.goto(BASE+('&' if '?' in BASE else '?')+'quality=low',wait_until='domcontentloaded')"),
 ("   await choose('ward-resume');await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await frames(12);await choose('ward-map-button');","   await choose('ward-menu-spatial-ui');await choose('console-mount');await choose('console-back');await choose('ward-resume');await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await frames(12);assert not await page.evaluate('NeighborhoodMissions.inspect().xr.console.controllerDocked');await choose('ward-map-button');")
])
p=Path('svgn-planet/release.json');r=json.loads(p.read_text());assert r['version']=='0.16.1';r['validation'].update(localModelTestsPassed=334,newPresentationTests=19);p.write_text(json.dumps(r,indent=2)+'\n')
p=Path('svgn-planet/SPATIAL-CONSOLE.md');text=p.read_text();note='\nA single tracked hand/controller falls back to the floor console even when controller mounting is preferred. The preference is retained for two-handed use. This adds a nineteenth presentation regression (334 total local model/input tests). The browser matrix explicitly tests this recovery and uses the normal low-graphics option for software WebGL; it is not a hardware-performance certification.\n'
if note not in text:p.write_text(text+note)
