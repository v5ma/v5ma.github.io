"""Main URL native menus, maps and reversible settings through tracked inputs."""
import asyncio,json,os,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('MAIN_BASE','http://127.0.0.1:8765/svgn-planet/')
OUT=Path(os.getenv('MAIN_NAV_OUT','main-nav-results'));OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / main menu acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'checks':[],'errors':[],'consoleErrors':[],'physicalDevicesTested':False,'inputOnly':True}
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':600});page.set_default_timeout(120000)
  await page.add_init_script(PAD);await page.add_init_script(Path(__file__).with_name('lantern').joinpath('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def wait(q):await page.wait_for_function(q,timeout=120000)
  async def frames(n=4):
   start=await page.evaluate('NeighborhoodMissions.inspect().xr.frames');await wait('NeighborhoodMissions.inspect().xr.frames>='+str(start+n))
  async def press(i):
   await page.evaluate('(i)=>{window.__poll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__poll+2');await frames(3)
   await page.evaluate('(i)=>{window.__poll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__poll+2');await frames(4)
  async def click(row,u=.5):
   await page.evaluate("""async ([r,u])=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel(),target=new T.Vector3(((r.x+r.w*u)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,0).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",[row,u]);await frames(3)
   hands=await page.evaluate('!!__xrFixture.session.inputSources[0].hand')
   await page.evaluate('__xrFixture.pinch=.012' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(3)
   await page.evaluate('__xrFixture.pinch=.06' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(4)
  async def choose(name,u=.5):
   await wait('NeighborhoodMissions.inspect().xr.console.progress>=.99')
   await wait('NeighborhoodMissions.inspect().xr.actionPanelVisible');await frames(4)
   for _ in range(32):
    rows=await page.evaluate('NeighborhoodMissions.panel().rows');r=next((r for r in rows if r.get('id')==name or r['label']==name),None)
    if r:await click(r,u);return
    n=next((r for r in rows if r['label'].startswith('Next ')),None)
    assert n,'No native page for '+name
    await click(n)
   raise AssertionError('Missing native control '+name)
  def ok(t):report['checks'].append(t);print('PASS',t,flush=True)
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.bring_to_front()
   await page.click('#xr-diorama-third-ar-launch');await wait('NeighborhoodMissions.inspect().xr.active');await frames(6);await choose('resume');await wait('!NeighborhoodMissions.inspect().paused');before=await page.evaluate('SVGNPlanet.inspect()');ok('Main-city AR launches from the first screen and native Resume hides menus')
   await press(8);await choose('main-show-map');assert await page.locator('#main-map-view').evaluate('(d)=>d.open');assert len(await page.evaluate('NeighborhoodMissions.panel().rows'))==3;await page.screenshot(path=str(OUT/'native-city-map.png'));await choose('Back / resume');assert await page.locator('#map-dialog').evaluate('(d)=>d.open');ok('Actual city map is visible in-headset and returns to its destination controls')
   await choose('district-select',.2);assert await page.locator('#district-select').input_value()=='lantern';assert 'Enter Lantern Ward' in await page.locator('#set-waypoint').inner_text();await choose('set-waypoint');await wait('NeighborhoodMissions.inspect().district==="lantern"');assert await page.evaluate('NeighborhoodMissions.inspect().xr.active');ok('Native map selector enters Lantern Ward without inventing a planet waypoint or ending AR')
   # The desktop toast is intentionally CSS-hidden in XR; nativeMenuDescription reads textContent.
   await press(9);await choose('ward-restore');assert await page.locator('#ward-confirm').is_hidden();assert 'No backup' in (await page.locator('#toast').text_content() or '');ok('Missing district backup is reported without presenting a destructive confirmation')
   await choose('ward-save');await choose('ward-save');assert await page.evaluate('!!localStorage.getItem("svgn.lantern-ward.v1.backup")');await choose('ward-restore');await frames();rows=await page.evaluate('NeighborhoodMissions.panel().rows');assert rows[0]['id']=='ward-keep';assert {r.get('id') for r in rows if r.get('id')}=={'ward-keep','ward-replace'};saved=await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")');await choose('ward-keep');assert await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")')==saved;ok('Two real saves create a backup; restore isolates cancel-first choices and keeping progress changes no saved bytes')
   await choose('ward-controls');await choose('xr-dominant');await choose('xr-swap');await choose('xr-motion');prefs=await page.evaluate('NeighborhoodMissions.inspect().xr.controls');assert prefs['dominant']=='left' and prefs['swapSticks'] and not prefs['motionPunch'];await choose('xr-dominant');await choose('xr-swap');await choose('xr-motion');await choose('xr-controls-back');ok('Handedness, stick swapping and motion alternatives are adjustable and reversible natively')
   await page.evaluate('__pad.buttons[7]={pressed:false,value:.4}');await choose('ward-resume');await wait('!NeighborhoodMissions.inspect().paused');await press(9);await wait('NeighborhoodMissions.inspect().paused');await page.evaluate('__pad.buttons[7]={pressed:false,value:0}');ok('Menu remains accessible while a held analog trigger blocks gameplay rearm')
   await choose('ward-city');await wait('NeighborhoodMissions.inspect().district==="city"');after=await page.evaluate('SVGNPlanet.inspect()');assert before['n']==after['n'];assert before['deliveries']==after['deliveries'];ok('Menu travel preserves the original stopped city position and deliveries exactly')
   await press(9);await choose('reset');await frames();rows=await page.evaluate('NeighborhoodMissions.panel().rows');assert rows[0]['id']=='cancel-reset';assert {r.get('id') for r in rows if r.get('id')}=={'cancel-reset','accept-reset'};await choose('cancel-reset');assert before['deliveries']==await page.evaluate('SVGNPlanet.inspect().deliveries');ok('Original-city reset confirmation exposes only explicit keep/replace actions')
   await choose('resume');await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await frames();await choose('visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');await press(9);await choose('ward-map-button');await page.screenshot(path=str(OUT/'hand-ward-map.png'));await choose('Back / resume');await choose('ward-resume');assert not await page.evaluate('NeighborhoodMissions.inspect().xr.actionPanelVisible');ok('Hand-pinch district travel, mission map and resume remain native and hidden during play')
   await page.evaluate('__xrFixture.session.end()');await wait('!NeighborhoodMissions.inspect().xr.active');assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True
  except Exception as e:
   report.update(success=False,failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await page.evaluate('NeighborhoodMissions.inspect()');report['controller']=await page.evaluate('NeighborhoodController.inspect()');await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
