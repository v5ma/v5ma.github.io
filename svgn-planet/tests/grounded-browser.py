import asyncio,json,os,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.environ.get('GROUNDED_BASE','http://127.0.0.1:8765/svgn-planet/legacy.html')
OUT=Path(os.environ.get('GROUNDED_OUTPUT','grounded-results'));OUT.mkdir(exist_ok=True)
PAD="""window.__pad={id:'Xbox / grounded acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'checks':[],'errors':[],'shaderErrors':[],'physicalControllerTested':False,'physicalQuestTested':False,'xrEvidence':'Synthetic WebXR session with real Three r177 renderer and app input paths.'}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':600});await page.add_init_script(PAD);await page.add_init_script(Path(__file__).with_name('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['shaderErrors'].append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
  async def wait(q):await page.wait_for_function(q,timeout=90000)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  async def press(i):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__before')
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__before')
  async def focus(id):
   for _ in range(100):
    if await page.evaluate('document.activeElement.id')==id:return
    await press(13)
   raise AssertionError('Xbox cannot reach '+id)
  def ok(s):print('PASS',s,flush=True);report['checks'].append(s)
  async def xrframes(n=3):
   f=(await state())['xr']['frames'];await wait('SVGNPlanet.inspect().xr.frames>='+str(f+n))
  async def ray(u,v,menu=True):await page.evaluate('(a)=>__xrFixture.ray(...a)',[u/1024,v/1024,menu]);await xrframes()
  async def select(hand=False):
   await page.evaluate('__xrFixture.pinch=.012' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await xrframes(2)
   await page.evaluate('__xrFixture.pinch=.06' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await xrframes(3)
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await wait("window.SVGNPlanet&&!document.querySelector('#start').disabled");await page.bring_to_front();await press(0);await wait('SVGNPlanet.inspect().started');assert (await state())['version']=='0.11.0';ok('Version 0.11 boots with the retained Xbox start action')
   await press(3);await wait("SVGNPlanet.inspect().render.grounded.mode==='walk'");await page.screenshot(path=str(OUT/'courier-standing.png'));g=(await state())['render']['grounded'];assert g['headHeight']==.24;assert g['contacts']==[True,True];ok('Measured hero and idle ground contacts are active in the real scene')
   await page.evaluate('__pad.axes[1]=-1');await wait('SVGNPlanet.inspect().distance>2');await page.screenshot(path=str(OUT/'courier-running.png'));await page.evaluate('__pad.axes[1]=0');await wait('SVGNPlanet.inspect().speed<.02');ok('Distance-driven grounded locomotion renders during actual movement')
   for value in [.3,1]:
    await press(9);await page.evaluate('(value)=>__pad.buttons[7]={pressed:value>.55,value}',value);await press(1);await page.wait_for_timeout(400);assert not (await state())['controller']['boost'];assert not await page.evaluate('NeighborhoodController.inspect().gameplayReady');await page.evaluate('__pad.buttons[7]={pressed:false,value:0}');await wait('NeighborhoodController.inspect().gameplayReady')
   ok('Partial and full held acceleration cannot leak from a menu into gameplay')
   await press(9);await focus('open-save-recovery');await press(0);await wait("document.querySelector('#save-dialog').open");await focus('save-backup');await press(0);await wait("!document.querySelector('#save-confirm').hidden");await press(1);await wait('!SVGNPlanet.inspect().paused');ok('Backup recovery is controller reachable and B safely cancels replacement')
   await press(9);await focus('open-save-recovery');await press(0);await page.fill('#save-text','{"v":9}');await focus('save-import');await press(0);assert await page.locator('#save-confirm').is_hidden();assert 'Nothing was replaced' in await page.locator('#vault-status').inner_text();await press(1);ok('Invalid imports give a dismissible error without replacing progress')
   await press(9);await page.select_option('#vehicle-pause','bicycle');await press(1);await press(3);await wait("SVGNPlanet.inspect().render.grounded.mode==='bicycle'");await page.screenshot(path=str(OUT/'courier-bicycle.png'));ok('Bicycle contact pose and pedals render without losing vehicle selection')
   await press(9);await page.click('#pause-xr');await wait('SVGNPlanet.inspect().xr.active&&SVGNPlanet.inspect().xr.frames>5');assert 'hand-tracking' in await page.evaluate('__xrFixture.requested.options.optionalFeatures');await page.screenshot(path=str(OUT/'xr-controller-menu.png'));ok('WebXR session uses the real renderer, tracked sources and a native 3D menu')
   await ray(512,333);await select();await wait('!SVGNPlanet.inspect().paused');ok('Tracked right-controller ray selects Resume in XR')
   # Aim away from the UI before testing direct triggers and sticks.
   await page.evaluate('__xrFixture.right.targetRaySpace.pose.position.x=4');await page.evaluate('__xrFixture.right.targetRaySpace.pose.matrix[12]=4');await xrframes()
   before=(await state())['distance'];await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,0,-1]');await wait('SVGNPlanet.inspect().distance>'+str(before+.3));await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,0,0];__xrFixture.left.gamepad.buttons[1]={pressed:true,value:1}');await wait('SVGNPlanet.inspect().speed<.05');await page.evaluate('__xrFixture.left.gamepad.buttons[1]={pressed:false,value:0}');ok('Tracked left controller moves and brakes the retained game')
   await page.evaluate('__xrFixture.useHands()');await wait('SVGNPlanet.inspect().paused');await xrframes(4);await ray(512,333);await select(True);await wait('!SVGNPlanet.inspect().paused');ok('Hand tracking can resume through joint-distance pinch selection')
   await ray(269,509,False);before=(await state())['distance'];await page.evaluate('__xrFixture.pinch=.012');await wait('SVGNPlanet.inspect().distance>'+str(before+.2));await page.evaluate('__xrFixture.pinch=.06');await xrframes();assert (await state())['xr']['input']['y']==0;ok('Hand-only hold-to-move stops issuing movement when pinch releases')
   await page.evaluate('__xrFixture.tracking=false');await wait('SVGNPlanet.inspect().paused');assert (await state())['xr']['input']['y']==0;await page.evaluate('__xrFixture.tracking=true');await xrframes();ok('Tracking loss clears input and pauses instead of leaving movement held')
   await page.screenshot(path=str(OUT/'xr-hand-menu.png'));await page.evaluate('__xrFixture.session.end()');await wait('!SVGNPlanet.inspect().xr.active');await press(1);await wait('!SVGNPlanet.inspect().paused');ok('Leaving XR safely restores desktop rendering and Xbox interaction')
   await page.reload(wait_until='domcontentloaded');await wait("window.SVGNPlanet&&!document.querySelector('#start').disabled");assert (await state())['vehicle']=='bicycle';await press(0);ok('Saving and reload survive the desktop/controller/hand/XR session lifecycle')
   assert not report['errors'],report['errors'];assert not report['shaderErrors'],report['shaderErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'grounded-failure.png'))
   except Exception:pass
  finally:(OUT/'grounded-report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
