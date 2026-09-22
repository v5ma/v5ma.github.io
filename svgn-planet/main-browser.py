"""Unified main app: real WebGL and actual input paths. Synthetic devices, not hardware."""
import asyncio,json,os,traceback
from pathlib import Path
EXPECTED_VERSION=json.loads(Path(__file__).with_name('release.json').read_text())['version']
from playwright.async_api import async_playwright
BASE=os.environ.get('MAIN_BASE','http://127.0.0.1:8765/svgn-planet/')
OUT=Path(os.environ.get('MAIN_OUT','main-results'));OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / unified acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'checks':[],'errors':[],'consoleErrors':[],'physicalDevicesTested':False,'base':BASE}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':600});page.set_default_timeout(120000);await page.add_init_script(PAD);await page.add_init_script(Path(__file__).with_name('lantern').joinpath('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def wait(q):await page.wait_for_function(q,timeout=120000)
  async def state():return await page.evaluate('NeighborhoodMissions.inspect()')
  async def frames(n=4):
   q=await state();start=q['xr']['frames'] if q['xr']['active'] else await page.evaluate('NeighborhoodController.inspect().polls');expression='NeighborhoodMissions.inspect().xr.frames' if q['xr']['active'] else 'NeighborhoodController.inspect().polls';await wait(expression+'>='+str(start+n))
  async def press(i):
   await page.evaluate('(i)=>{window.__poll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__poll+2');await frames(3);await page.evaluate('(i)=>{window.__poll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__poll+2');await frames(4)
  async def select(label):
   await wait('NeighborhoodMissions.inspect().xr.actionPanelVisible&&NeighborhoodMissions.inspect().xr.console.progress>=.99');await frames(4)
   for _ in range(30):
    rows=await page.evaluate('NeighborhoodMissions.panel().rows');row=next((r for r in rows if r['label']==label or r.get('id')==label),None)
    if row:break
    nxt=next((r for r in rows if r['label'].startswith('Next ')),None)
    if not nxt:raise AssertionError('No next page for '+label+' / '+str(rows))
    await click(nxt)
   else:raise AssertionError('Cannot find '+label)
   await click(row)
  async def click(row):
   await page.evaluate("""async r=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel(),target=new T.Vector3(((r.x+r.w/2)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,0).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",row)
   await frames(4);hands=await page.evaluate('!!__xrFixture.session.inputSources[0].hand');await page.evaluate('__xrFixture.pinch=.012' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(3);await page.evaluate('__xrFixture.pinch=.06' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(4)
  def ok(name):report['checks'].append(name);print('PASS',name,flush=True)
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.bring_to_front();q=await state();assert q['district']=='city' and q['version']==EXPECTED_VERSION;assert await page.locator('#xr-launch-options button').count()==8;ok('Main URL boots the original full city and exposes eight native XR entries, not a chapter redirect')
   await press(0);await wait('SVGNPlanet.inspect().started');await frames();await page.evaluate('__pad.axes[1]=-1');await wait('SVGNPlanet.inspect().distance>.2');await page.evaluate('__pad.axes[1]=0');await wait('SVGNPlanet.inspect().speed===0');await frames(6);city=await page.evaluate('SVGNPlanet.inspect()');report['departureCity']=city;ok('Original main-world movement and stopping work through the retained Xbox path')
   await press(9);await page.click('#visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');await frames();assert not (await state())['paused'];await page.screenshot(path=str(OUT/'main-lantern-district.png'));ok('Main-game district travel opens the recovered mission neighborhood in the same document')
   await press(13);await wait('document.querySelector("#ward-menu").open');assert await page.locator('#ward-missions [data-mission]').count()>=10;await page.click('[data-mission="watch"]');await frames();q=await state();assert q['ward']['watch']['tracking'] and q['ward']['watch']['stage']==0;ok('Main-game mission board exposes resident stories and Night Watch; tracking grants no progress')
   for _ in range(300):
    r=await page.evaluate("""async()=>{const {approachAxes}=await import('./tests/unified-driver.mjs'),s=NeighborhoodMissions.inspect().ward,a=approachAxes(-10-s.x,14-s.z);__pad.axes=a.axes;__pad.buttons[6]={pressed:a.brake,value:a.brake?1:0};return {d:a.distance,speed:s.speed,x:s.x,z:s.z}}""")
    if r['d']<.3 and r['speed']<.05:break
    await frames(2)
   else:raise AssertionError('Mara could not be reached through integrated movement: '+str(r))
   await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons[6]={pressed:false,value:0}');await frames(5);await press(2);assert (await state())['ward']['watch']['stage']==1;ok('Mara actually briefs the Watch mission through the integrated main-game interaction')
   for ar in ['vr','ar']:
    for prefix in ['first-person','third-person','diorama-first','diorama-third']:
     mode=prefix+'-'+ar
     if not (await state())['paused']:await press(9)
     await page.click('#ward-xr');await page.click('#xr-'+mode);await wait('NeighborhoodMissions.inspect().xr.active');await frames(6);q=await state();assert q['xr']['kind']==mode and q['xr']['eyes']==2 and not q['xr']['renderTargetScreen']
     await page.evaluate("""()=>{const s=__xrFixture.session,old=s.requestAnimationFrame.bind(s);s.requestAnimationFrame=cb=>old((time,frame)=>{cb(time,frame);const gl=document.querySelector('#world').getContext('webgl2'),b=new Uint8Array(4);gl.readPixels(12,gl.drawingBufferHeight-12,1,1,gl.RGBA,gl.UNSIGNED_BYTE,b);window.__renderedAlpha=b[3];});}""")
     await select('ward-resume');await wait('!NeighborhoodMissions.inspect().paused');await frames();q=await state();assert not q['xr']['actionPanelVisible'] and q['xr']['visibleRays']==0;assert q['spatial']['centerError']<1e-5
     await page.evaluate('__xrFixture.viewerPitch=-.25;__xrFixture.viewerRoll=.28');await frames(5);assert not (await state())['xr']['actionPanelVisible'];await page.screenshot(path=str(OUT/(mode+'.png')));await page.evaluate('__xrFixture.viewerPitch=0;__xrFixture.viewerRoll=0');ok(mode+' renders actual per-eye district geometry without gameplay menu boards')
     await press(9);await select('ward-city');await wait('NeighborhoodMissions.inspect().district==="city"');await frames();q=await state();assert q['xr']['active'] and q['xr']['kind']==mode;assert await page.evaluate('__xrFixture.session.ended') is False;ok(mode+' retains the same immersive session when travelling into the original world')
     if ar=='ar':
      await page.evaluate('__xrFixture.viewerPitch=.8');await frames(5);alpha=await page.evaluate('__renderedAlpha');report.setdefault('arAlphaSamples',[]).append({'mode':mode,'district':'city','alpha':alpha});assert alpha==0,{'mode':mode,'opaqueSkyAlpha':alpha};await page.evaluate('__xrFixture.viewerPitch=0');await frames(3)
     assert await page.evaluate("['water-minimap','pulse-summary','toast','context'].every(id=>getComputedStyle(document.getElementById(id)).visibility==='hidden')")
     after=await page.evaluate('SVGNPlanet.inspect()');assert after['deliveries']==city['deliveries'];assert after['n']==city['n'],json.dumps({'departure':city['n'],'returned':after['n'],'speed':after['speed'],'mode':mode});await page.screenshot(path=str(OUT/(mode+'-main-city.png')))
     await press(9);await select('visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');await frames();assert (await state())['ward']['watch']['stage']==1
     await page.evaluate('__xrFixture.session.end()');await wait('!NeighborhoodMissions.inspect().xr.active');await frames()
   ok('All eight modes preserve original city position and Watch progress during two-way travel')
   await page.click('#ward-xr');await page.click('#xr-diorama-third-ar');await wait('NeighborhoodMissions.inspect().xr.active');await frames();await select('ward-resume');await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await frames();await select('ward-map-button');await frames();assert await page.locator('#ward-map-dialog').evaluate('(d)=>d.open');await page.screenshot(path=str(OUT/'hand-mission-map.png'));await select('Back / resume');ok('Joint-pinch opens and returns from the native mission map')
   await page.evaluate('__xrFixture.session.end()');await wait('!NeighborhoodMissions.inspect().xr.active');await page.click('#ward-city');await wait('NeighborhoodMissions.inspect().district==="city"');await page.reload(wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await press(0);await press(9);await page.click('#visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');assert (await state())['ward']['watch']['stage']==1;ok('Real saved Watch progress survives page reload and re-entry from the main city')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report.update(success=False,failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await state();report['city']=await page.evaluate('SVGNPlanet.inspect()');report['controller']=await page.evaluate('NeighborhoodController.inspect()');await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
