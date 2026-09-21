"""Actual WebGL field-desk journey; only input devices are synthetic, no game state setters."""
import asyncio,json,os,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('FIELD_BASE','http://127.0.0.1:8765/svgn-planet/')
MODE=os.getenv('FIELD_MODE','diorama-third-ar')
OUT=Path(os.getenv('FIELD_OUT','field-results'))/MODE;OUT.mkdir(parents=True,exist_ok=True)
async def main():
 report={'mode':MODE,'base':BASE,'checks':[],'errors':[],'consoleErrors':[],'physicalDevicesTested':False,'success':False};start=time.monotonic()
 def save():
  report['wallSeconds']=round(time.monotonic()-start,2);temp=OUT/'report.tmp';temp.write_text(json.dumps(report,indent=2));temp.replace(OUT/'report.json')
 def ok(text):report['checks'].append(text);print('PASS',text,flush=True);save()
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':600});page.set_default_timeout(90000)
  fixture=Path(__file__).with_name('lantern').joinpath('xr-fixture.js').read_text()
  floor=Path(__file__).with_name('tests').joinpath('field-desk-fixture.js').read_text()
  await page.add_init_script(fixture+'\n'+floor)
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def wait(q):await page.wait_for_function(q,timeout=90000)
  async def state():return await page.evaluate('NeighborhoodMissions.inspect()')
  async def frames(n=3):
   t=(await state())['xr']['frames'];await wait('NeighborhoodMissions.inspect().xr.frames>='+str(t+n))
  async def trigger(hand,index,down):
   await page.evaluate('([h,i,d])=>__xrFixture[h].gamepad.buttons[i]={pressed:d,value:d?1:0}',[hand,index,down]);await frames(3)
  async def menu():
   await trigger('left',5,True);await wait('NeighborhoodMissions.inspect().paused');await trigger('left',5,False);await wait('NeighborhoodMissions.inspect().xr.fieldDesk.progress===1')
  async def hit(row,u=.5):
   await page.evaluate("""async ([r,u])=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel(),target=new T.Vector3(((r.x+r.w*u)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,0).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",[row,u])
   await frames(3);hands=await page.evaluate('!!__xrFixture.session.inputSources[0].hand')
   await page.evaluate('__xrFixture.pinch=.012' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(3)
   await page.evaluate('__xrFixture.pinch=.06' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(5)
  async def choose(id,u=.5):
   await wait('NeighborhoodMissions.inspect().xr.fieldDesk.progress===1')
   for _ in range(30):
    rows=await page.evaluate('NeighborhoodMissions.panel().rows');r=next((r for r in rows if r.get('id')==id or r['label']==id),None)
    if r:await hit(r,u);return
    nxt=next((r for r in rows if r['label'].startswith('Next ')),None);assert nxt,'Missing native row '+id;await hit(nxt)
   raise AssertionError('Cannot reach '+id)
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.bring_to_front();assert (await state())['version']=='0.16.1'
   await page.click('#xr-'+MODE+'-launch');await wait('NeighborhoodMissions.inspect().xr.active');await wait('NeighborhoodMissions.inspect().xr.fieldDesk.progress===1');await frames(4)
   q=await state();assert q['xr']['kind']==MODE and q['xr']['eyes']==2 and not q['xr']['renderTargetScreen'];assert q['xr']['fieldDesk']['floorKnown'];ok('Main city starts the exact requested spatial mode with a floor-anchored field desk')
   before=q['xr']['panelMatrix'];await page.evaluate('__xrFixture.viewerRoll=.3;__xrFixture.viewerPitch=-.2;__xrFixture.viewerX=.1');await frames(6);assert (await state())['xr']['panelMatrix']==before;await page.screenshot(path=str(OUT/'desk.png'));await page.evaluate('__xrFixture.viewerRoll=0;__xrFixture.viewerPitch=0;__xrFixture.viewerX=0');ok('Settled desk remains world-fixed through head tilt and translation')
   await choose('resume');await wait('!NeighborhoodMissions.inspect().paused');await frames(5);q=await state();assert not q['xr']['actionPanelVisible'] and q['xr']['visibleRays']==0 and q['xr']['fieldDesk']['hudVisible'];await page.screenshot(path=str(OUT/'wrist-map.png'));ok('Resume hides the entire desk and rays while the wrist mission map remains')
   await trigger('left',0,True);await wait('SVGNPlanet.inspect().speed>0.2');assert (await state())['xr']['input']['boost'];await trigger('left',0,False);await wait('SVGNPlanet.inspect().speed===0');assert not (await state())['xr']['input']['boost'];ok('Left trigger actually drives the original city vehicle and release stops it')
   await menu();await choose('visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');await frames(5);q=await state();assert q['xr']['active'] and q['xr']['kind']==MODE;assert q['ward']['ride']=='foot';ok('District travel preserves the active XR session and new UI')
   await menu();await choose('hub-mission-watch');await wait('!NeighborhoodMissions.inspect().paused');q=await state();assert q['ward']['watch']['tracking'] and q['ward']['watch']['stage']==0;await frames(5);assert q['xr']['fieldDesk']['hudVisible'];ok('Mission selection tracks the real next objective without granting progress')
   await menu();await choose('ward-controls');await choose('desk-vehicle-speed');await choose('desk-height',.75);prefs=json.loads(await page.evaluate('localStorage.getItem("svgn.neighborhood-field-desk.v1")'));assert prefs['vehicleSpeed']=='right-trigger' and prefs['height']>1.1;await choose('xr-controls-back');await choose('ward-resume');ok('Native settings change and save trigger choice and desk height independently of game saves')
   await trigger('right',0,True);assert not (await state())['xr']['input']['boost'];await trigger('right',0,False);assert (await state())['ward']['watch']['stage']==0;ok('On-foot trigger retains interaction/tool behavior and never becomes vehicle acceleration')
   await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await choose('ward-resume');await frames(5);assert (await state())['xr']['fieldDesk']['hudVisible'];assert not (await state())['xr']['actionPanelVisible'];ok('Hand-joint pinch resumes the same menu and supplies compact wrist feedback')
   # Reopen with the actual raised-pinch gesture, not a game pause setter.
   await page.evaluate('__xrFixture.hand.gripSpace.pose.position.y=-.02;__xrFixture.hand.gripSpace.pose.position.z=-.35;__xrFixture.pinch=.012');await wait('NeighborhoodMissions.inspect().paused');await page.evaluate('__xrFixture.pinch=.06;__xrFixture.hand.gripSpace.pose.position.y=-.3;__xrFixture.hand.gripSpace.pose.position.z=-.6');await frames(5);await choose('ward-xr');await choose('xr-exit');await wait('!NeighborhoodMissions.inspect().xr.active');assert await page.evaluate('__xrFixture.session.ended');ok('Hand menu gesture and native Exit XR end the session without closing the browser')
   await page.reload(wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');q=await state();assert q['xr']['fieldDesk']['settings']['vehicleSpeed']=='right-trigger';assert q['xr']['fieldDesk']['settings']['height']==prefs['height'];assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];ok('Reload retains the explicit UI/control preference and records no browser errors');report['success']=True
  except Exception as e:
   report.update(failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:save();await browser.close()
 if not report['success']:raise SystemExit(1)
asyncio.run(main())
