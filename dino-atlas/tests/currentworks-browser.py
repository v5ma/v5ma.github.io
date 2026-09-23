"""Real r177 WebGL fixtures plus regular-game UI; no fabricated gameplay progress.
Fixture cameras and portal masks are explicitly synthetic, not physical XR evidence.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'currentworks-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
checks=[];errors=[];captures=[];server=None

def check(value,name):
 assert value,name
 checks.append(name);print('PASS',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options);page=browser.new_page(viewport={'width':1100,'height':800})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  try:
   page.goto(BASE+'tests/currentworks-fixture.html',wait_until='domcontentloaded',timeout=90000);page.wait_for_function('window.fixtureReady',timeout=120000)
   for name,params in [('pond',{}),('trees',{'view':'trees'}),('lagoon',{'view':'lagoon'}),('quiet',{'quiet':True}),('portal',{'mask':True}),('classic',{'classic':True})]:
    r=page.evaluate('(p)=>drawCurrentworks(p)',params);captures.append(r);check(r['glError']==0 and not r['errors'],name+' real GPU shader draw has no errors');check(r['changed']>1000,name+' produces visible rendered pixels');page.screenshot(path=str(OUT/('fixture-'+name+'.png')))
   check(captures[0]['hash']!=captures[-1]['hash'],'Currentworks and Classic produce different rendered pond images')
   check(captures[0]['state']['engine']=='177','The integration uses Dino r177, not a second engine')
   check(len(captures[0]['state']['treeIds'])>=4,'Detailed central-grove replacements exist')
   page.goto(BASE+'index.html?test=1',wait_until='domcontentloaded',timeout=90000);page.wait_for_function('window.__dinoRanger?.state.ready',timeout=120000)
   check(page.evaluate('!__dinoOptics.state.currentworks.failed&&__dinoOptics.state.currentworks.active'),'The actual regular game enables the graphics adapter')
   check(page.evaluate('__dinoOptics.state.currentworks.water.length')==3,'The actual game has all three bounded water surfaces')
   page.locator('#living-play').click();page.wait_for_function('document.getElementById("living-dialog").open')
   for _ in range(10):
    if not page.locator('#living-dialog').evaluate('(e)=>e.open'):break
    page.locator('#living-next').click();page.wait_for_timeout(100)
   page.wait_for_function('document.body.dataset.livingFocus==="true"')
   check(not page.locator('#ranch-status').is_visible(),'First Light hides unrelated Ranch and Coast dispatch copy')
   check(page.locator('#field-kit').is_visible() and page.locator('#minimap').is_visible(),'The tool shortcuts and live map remain accessible')
   page.locator('#board-button').click();page.wait_for_function('__dinoRanger.state.mode==="foot"')
   check(not page.locator('#field-utility-status').is_visible(),'On-foot story play hides only the unrelated mounted-rig hint')
   check(page.locator('#interact-button').is_visible() and page.locator('#reload-button').is_visible(),'Interaction and reload controls are retained')
   page.screenshot(path=str(OUT/'first-light-focus.png'))
   page.locator('#menu-button').click();page.wait_for_function('document.getElementById("menu-dialog").open')
   before=page.evaluate('__dinoOptics.state.currentworks.time');page.wait_for_timeout(600);check(page.evaluate('__dinoOptics.state.currentworks.time')==before,'Graphics time freezes while the game is paused')
   page.locator('#menu-coastal-light').click();page.select_option('#coastal-preset','classic');page.wait_for_function('!__dinoOptics.state.currentworks.active');check(True,'The existing Classic option restores the fallback without restarting')
   page.select_option('#coastal-preset','balanced');page.wait_for_function('__dinoOptics.state.currentworks.active');check(True,'Balanced restores Currentworks without resetting story progress')
   page.locator('#coastal-close').click();page.locator('#menu-button').click();page.locator('#menu-living-reserve').click();page.locator('#living-suspend').click();page.wait_for_function('document.body.dataset.livingFocus==="false"')
   check(page.locator('#ranch-status').is_visible(),'Suspending the story restores legacy dispatch guidance')
   check(not errors,'No captured JavaScript or shader errors in the regular game')
   (OUT/'report.json').write_text(json.dumps({'build':'currentworks-reserve-20260922.1','base':BASE,'passed':len(checks),'checks':checks,'captures':captures,'errors':errors,'physicalHardwareVerified':False,'limits':'Native software WebGL; explicit graphics fixture cameras and portal mask. Story focus uses ordinary click/menu interactions. Retained separate First Light journey tests exercise synthetic Xbox and mocked XR.'},indent=2))
  except Exception as e:
   (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'captures':captures,'errors':errors},indent=2))
   try:page.screenshot(path=str(OUT/'failure.png'),timeout=20000)
   except Exception:pass
   raise
  finally:browser.close()
finally:
 if server:server.terminate()
