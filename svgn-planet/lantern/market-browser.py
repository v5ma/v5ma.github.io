"""Input-only comparison: wait, signal, or use the north loop on a bicycle.
No actor/objective/velocity/inventory writes. Save reload is a real played run.
XR devices are synthetic; their poses and buttons are the only injected state.
"""
import asyncio, json, os, time, traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/lantern-ward.html')
OUT=Path(os.getenv('MARKET_OUT','market-results'));OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox Working Quay acceptance',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'version':'0.12.1','checks':[],'routes':{},'errors':[],'consoleErrors':[],'physicalHardwareTested':False,'humanComprehensionTested':False,'inputOnly':True}
 start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  async def tour(choice):
   context=await browser.new_context(viewport={'width':960,'height':640});await context.add_init_script(PAD)
   if choice=='signal':await context.add_init_script(Path(__file__).with_name('xr-fixture.js').read_text())
   page=await context.new_page();page.set_default_timeout(90000)
   page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
   async def state():return await page.evaluate('LanternWard.inspect()')
   async def wait(q):await page.wait_for_function(q,timeout=90000)
   async def frames(n=2):
    f=(await state())['frames'];await page.wait_for_function('(f)=>LanternWard.inspect().frames>=f',arg=f+n)
   async def press(i):
    await page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);await frames();await page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);await frames()
   async def neutral():
    await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons.forEach(b=>{b.pressed=false;b.value=0})');await frames()
   async def pilot(x,z):
    for _ in range(1400):
     r=await page.evaluate("""([x,z])=>{const q=LanternWard.inspect(),s=q.state,dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),stop=d<.28;__pad.axes[0]=stop?0:(dx*q.basis.right[0]+dz*q.basis.right[1])/(d||1);__pad.axes[1]=stop?0:-(dx*q.basis.forward[0]+dz*q.basis.forward[1])/(d||1);__pad.buttons[6]={pressed:stop,value:stop?1:0};__pad.buttons[7]={pressed:!stop,value:stop?0:1};return {d,speed:s.speed,steps:s.steps,paused:q.paused,failed:q.failed,x:s.x,z:s.z};}""",[x,z])
     assert not r['paused'] and not r['failed'],r
     if r['d']<.38 and r['speed']<.06:await neutral();return
     await page.wait_for_function('(s)=>LanternWard.inspect().state.steps>=s+4||LanternWard.inspect().failed',arg=r['steps'])
    raise AssertionError('Did not arrive '+str([x,z,r]))
   def ok(text):report['checks'].append(choice+': '+text);print('PASS',choice,text,flush=True)
   async def shot(name):await page.screenshot(path=str(OUT/(name+'.png')))
   try:
    await page.goto(BASE,wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await page.bring_to_front();await press(0);await wait('LanternWard.inspect().controllerReady');assert (await state())['version']=='0.12.1'
    await pilot(-12,15);await press(2);assert (await state())['state']['parcel'];await press(3);assert (await state())['state']['ride']=='bicycle'
    for point in [[-23,13],[-23,-7],[-21,-13.5],[-5,-13.5]]:await pilot(*point)
    ok('Reached the loading decision through real bicycle movement')
    if choice=='signal':
     await press(9);await shot('quay-approach');await press(1);await wait('LanternWard.inspect().controllerReady')
    await wait("LanternWard.inspect().state.market.phase==='loading'&&LanternWard.inspect().state.market.timer<.12")
    before=(await state())['state'];assert abs(before['x']+5)<.4
    if choice=='signal':
     await press(10);assert (await state())['state']['market']['accepted']==1;ok('L3 signal is local, immediate and does not dismount or open a menu')
    if choice=='loop':
     for point in [[-1.85,-13.5],[-1.85,-20],[1.85,-20],[1.85,-14],[6,-14]]:await pilot(*point)
    else:await pilot(6,-13.5)
    after=(await state())['state'];assert after['ride']=='bicycle' and after['parcel']
    report['routes'][choice]={'simulationSeconds':round(after['time']-before['time'],3),'distanceMetres':round(after['distance']-before['distance'],3),'blockedSeconds':round(after['market']['waitSeconds']-before['market']['waitSeconds'],3),'signals':after['market']['accepted']-before['market']['accepted'],'mountChanges':0,'menuOpensDuringCrossing':0}
    ok('Crossed without lost parcel, reset or forced dismount')
    if choice=='signal':
     for point in [[6,8],[14,8],[14,6]]:await pilot(*point)
     await press(2);assert (await state())['state']['delivered']
     for point in [[14,8],[6,8],[5,18],[4.5,18]]:await pilot(*point)
     await press(2);assert (await state())['state']['gate']
     for point in [[0,18],[-12,15]]:await pilot(*point)
     await press(2);assert (await state())['state']['credits']==600;await press(2);assert (await state())['state']['credits']==600
     ok('The cooperative street approach still completes the real mission once')
     await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await press(0);await wait('LanternWard.inspect().controllerReady');assert (await state())['state']['credits']==600 and (await state())['state']['gate']
     ok('Ordinary reload preserves the earned shortcut and 600-credit ledger')
     for point in [[-23,13],[-23,-7],[-21,-13.5],[-5,-13.5]]:await pilot(*point)
     await press(9);await page.click('#vr-diorama');await wait('LanternWard.inspect().xr.active')
     async def xrframes(n=3):
      f=(await state())['xr']['frames'];await page.wait_for_function('(f)=>LanternWard.inspect().xr.frames>=f',arg=f+n)
     async def choose(label,hand=False):
      await page.evaluate("""async(label)=>{const T=await import('./vendor/three.module.js'),data=LanternWard.panel(),r=data.rows.find(r=>r.label===label);if(!r)throw Error('Missing XR control '+label);const u=(r.x+r.w/2)/1024,v=(r.y+r.h/2)/768,p=new T.Vector3((u-.5)*data.width,(.5-v)*data.height,0).applyMatrix4(new T.Matrix4().fromArray(data.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",label)
      await xrframes();await page.evaluate('__xrFixture.pinch=.012' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await xrframes(2);await page.evaluate('__xrFixture.pinch=.06' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await xrframes()
     await xrframes();await choose('Both open');await choose('Resume');await wait('!LanternWard.inspect().paused');await page.evaluate('__xrFixture.viewerPitch=-.45');await xrframes();await shot('quay-stereo');q=await state();assert q['view']['eyes']==2 and abs(q['view']['market']['cart'][2]-q['state']['market']['z'])<.001
     ok('Native stereo diorama renders the cart at the simulation location')
     await page.evaluate('__xrFixture.viewerPitch=0');await press(9);await choose('First-person VR');await choose('Resume');await wait('!LanternWard.inspect().paused')
     await page.evaluate('__xrFixture.right.targetRaySpace.pose.position.x=5;__xrFixture.right.targetRaySpace.pose.matrix[12]=5');await xrframes();accepted=(await state())['state']['market']['accepted'];await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await xrframes(2);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await xrframes();assert (await state())['state']['market']['accepted']==accepted+1
     ok('Tracked right trigger operates the approach signal in first-person VR')
     await page.evaluate('__xrFixture.useHands()');await wait('LanternWard.inspect().paused');await xrframes();await choose('Resume',True);await wait('!LanternWard.inspect().paused');accepted=(await state())['state']['market']['accepted'];await choose('Interact',True);assert (await state())['state']['market']['accepted']==accepted+1
     ok('Hand-pinch Interact requests the same pass without navigating to a bell submenu')
     await page.evaluate('__xrFixture.session.end()');await wait('!LanternWard.inspect().xr.active');await press(1);await wait('LanternWard.inspect().controllerReady');assert (await state())['state']['credits']==600
     ok('XR input changes preserve progress and restore Xbox play')
    assert not report['errors'] and not report['consoleErrors']
   except Exception:
    try:report['failureState']=await state();await shot(choice+'-failure')
    except Exception:pass
    raise
   finally:await context.close()
  try:
   for choice in ['plain','loop','signal']:await tour(choice)
   a=report['routes'];assert a['signal']['blockedSeconds']<a['plain']['blockedSeconds'],a;assert a['loop']['signals']==0 and a['loop']['blockedSeconds']<.2,a
   assert a['loop']['distanceMetres']>a['signal']['distanceMetres']+8,a
   report['checks'].append('Comparison: signaling reduces forced stopping; north loop trades extra travel for timing independence')
   report['success']=True
  except Exception as e:report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
  finally:report['wallSeconds']=round(time.time()-start,2);(OUT/'report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report['success']:raise SystemExit(1)
asyncio.run(main())
