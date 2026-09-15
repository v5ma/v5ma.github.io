"""Actual WebGL, real tick/collision, synthetic Xbox and native XR plumbing.
No mutation of gameplay coordinates, velocities, flags, or private state.
"""
import asyncio,json,os,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/lantern-ward.html')
ROUTE=os.getenv('WARD_ROUTE','street');OUT=Path(os.getenv('WARD_OUT','ward-results'))/ROUTE;OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox test fixture',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'route':ROUTE,'checks':[],'errors':[],'consoleErrors':[],'physicalHardwareTested':False,'input':'synthetic; gameplay state is never written by the tour'}
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await b.new_page(viewport={'width':960,'height':640});page.set_default_timeout(90000);await page.add_init_script(PAD)
  await page.add_init_script("window.__legacyExpected=JSON.stringify({v:1,delivered:['fixture-delivery'],jobs:{wallet:123}});if(!sessionStorage.getItem('ward-legacy-fixture')){localStorage.setItem('svgn.paper-delivery-3d.v1',__legacyExpected);sessionStorage.setItem('ward-legacy-fixture','1');}")
  if ROUTE=='xr':await page.add_init_script(Path(__file__).with_name('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def state():return await page.evaluate('LanternWard.inspect()')
  async def wait(e):await page.wait_for_function(e,timeout=90000)
  async def frames(n=2):
   f=(await state())['frames'];await wait('LanternWard.inspect().frames>='+str(f+n))
  async def press(i):
   await page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);await frames(2);await page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);await frames(2)
  async def pilot(x,z):
   for _ in range(4000):
    r=await page.evaluate("""([x,z])=>{const q=LanternWard.inspect(),s=q.state,dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),stop=d<.35,dir=[dx/(d||1),dz/(d||1)];__pad.axes[0]=stop?0:dir[0]*q.basis.right[0]+dir[1]*q.basis.right[1];__pad.axes[1]=stop?0:-(dir[0]*q.basis.forward[0]+dir[1]*q.basis.forward[1]);__pad.buttons[6]={pressed:stop,value:stop?1:0};return {d,speed:s.speed,steps:s.steps,paused:q.paused,failed:q.failed,x:s.x,y:s.y,z:s.z};}""",[x,z])
    if r['paused'] or r['failed']:raise AssertionError('Tour paused/failed: '+str(r))
    if r['d']<.45 and r['speed']<.06:
     await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons[6]={pressed:false,value:0}');await frames(2);return
    await page.wait_for_function('(s)=>LanternWard.inspect().state.steps>=s+4||LanternWard.inspect().failed',arg=r['steps'])
   raise AssertionError('Cannot reach '+str((x,z))+str(r))
  def ok(text):report['checks'].append(text);print('PASS',ROUTE,text,flush=True)
  async def shot(name):await page.screenshot(path=str(OUT/(name+'.png')))
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await page.bring_to_front();await shot('title');await press(0);await wait('LanternWard.inspect().started');await wait('LanternWard.inspect().controllerReady');assert (await state())['version']=='0.12.0';ok('Xbox starts the new authored chapter');
   if ROUTE!='xr':
    await pilot(-12,15);await press(2);assert (await state())['state']['parcel'];ok('Normal reach-based collection');
    if ROUTE=='street':path=[[-23,13],[-23,-7],[-21,-13.5],[6,-13.5],[6,8],[14,8],[14,6]]
    elif ROUTE=='roof':path=[[-12.5,8.2],[-12.5,5.2],[-12.5,-3.7],[-6,-3.5],[6,-3.5],[12,-3.5],[19.5,1.5],[19.5,10.5],[16,10.5],[14,8],[14,6]]
    else:
     await pilot(-4.4,13);await press(3);assert (await state())['state']['ride']=='boat';await pilot(-.5,-11.5);await shot('canal');await press(3);assert (await state())['state']['ride']=='foot';ok('Controller boards, traverses and docks a skiff');path=[[6,-13],[6,8],[14,8],[14,6]]
    for i,(x,z) in enumerate(path):
     await pilot(x,z)
     if ROUTE=='roof' and i==5:assert (await state())['state']['y']>4.3;await shot('roof-route');ok('Print stairs and roof bridge reach the actual upper floor')
    await press(2);assert (await state())['state']['delivered'];await shot('workshop');ok('Approach-independent delivery recognized')
    for x,z in [[14,8],[6,8],[5,18],[4.5,18]]:await pilot(x,z)
    await press(2);assert (await state())['state']['gate'];await shot('shortcut');ok('Far-side blue door opens a permanent return connection')
    for x,z in [[0,18],[-12,15]]:await pilot(x,z)
    await press(2);assert (await state())['state']['credits']==600;await press(2);assert (await state())['state']['credits']==600;ok('Returning through the shortcut awards credits exactly once')
    await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await press(0);s=(await state())['state'];assert s['gate'] and s['claimed'] and s['credits']==600;ok('Route outcome and shortcut persist on ordinary reload');assert await page.evaluate("localStorage.getItem('svgn.paper-delivery-3d.v1')===__legacyExpected");ok('Original neighborhood save remains byte-for-byte unchanged')
    if ROUTE=='canal':
     for x,z in [[0,18],[5,18],[6,-13],[5.8,-13]]:await pilot(x,z)
     await press(2);await wait("LanternWard.inspect().state.water==='low'");ok('Sluice visibly drains and changes playable traversal');await pilot(-.5,-14);await pilot(-.5,-8);assert (await state())['state']['y']< -1.9;await shot('maintenance');await pilot(-.5,16);ok('Former boat channel is walkable by its real steps')
    await press(9);await page.evaluate('__pad.buttons[7]={pressed:false,value:.3}');await press(1);await frames(8);assert not (await state())['controllerReady'];await page.evaluate('__pad.buttons[7]={pressed:false,value:0}');await wait('LanternWard.inspect().controllerReady');ok('Partial held trigger is blocked until real neutral')
    await page.evaluate('__pad.connected=false');await wait('LanternWard.inspect().paused');ok('Controller disconnect pauses');await page.set_viewport_size({'width':390,'height':844});await shot('phone-menu');assert await page.locator('#resume').is_visible();ok('Paused chapter menu remains readable at phone width')
   else:
    async def xrframes(n=4):
     f=(await state())['xr']['frames'];await wait('LanternWard.inspect().xr.frames>='+str(f+n))
    async def choose(label,hand=False):
     await page.evaluate("""async(label)=>{const T=await import('./vendor/three.module.js'),data=LanternWard.panel(),r=data.rows.find(r=>r.label===label);if(!r)throw Error('Missing XR row '+label);const u=(r.x+r.w/2)/1024,v=(r.y+r.h/2)/768,p=new T.Vector3((u-.5)*data.width,(.5-v)*data.height,0).applyMatrix4(new T.Matrix4().fromArray(data.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",label)
     await xrframes(3);await page.evaluate('__xrFixture.pinch=.012' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await xrframes(2);await page.evaluate('__xrFixture.pinch=.06' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await xrframes(3)
    await press(9);await page.click('#vr-diorama');await wait('LanternWard.inspect().xr.active');await xrframes();s=await state();assert s['view']['eyes']==2 and s['xr']['scale']<.1;ok('Native stereo diorama renders real scaled scene geometry');await shot('xr-diorama');
    for label in ['Top open','Front open','Both open']:
     await choose(label);s=await state();assert s['view']['topOpen'] or s['view']['frontOpen'];ok(label+' preserves an open aperture')
    await choose('Resume');await xrframes();await shot('xr-world');await press(9);await wait('LanternWard.inspect().paused');await press(0);await wait('!LanternWard.inspect().paused');await press(9);await wait('LanternWard.inspect().paused');ok('Xbox operates native XR panels without DOM navigation');
    await choose('First-person VR');await xrframes();s=await state();assert s['xr']['kind']=='first-person-vr' and s['xr']['scale']==1;ok('First-person mode uses human-scale geometry without changing chapter state');await shot('xr-first-person')
    await choose('Resume');await wait('!LanternWard.inspect().paused');await page.evaluate('__xrFixture.right.targetRaySpace.pose.position.x=5;__xrFixture.right.targetRaySpace.pose.matrix[12]=5');await xrframes();before=(await state())['state']['distance'];await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,0,-1]');await wait('LanternWard.inspect().state.distance>'+str(before+.2));await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,0,0]');ok('Tracked controller moves the actual courier')
    await page.evaluate('__xrFixture.useHands()');await wait('LanternWard.inspect().paused');await xrframes();await choose('Resume',True);await wait('!LanternWard.inspect().paused');ok('Joint-pinch UI resumes without a controller');before=(await state())['state']['distance'];await choose('Forward (hold)',True);assert (await state())['state']['distance']>before;assert (await state())['xr']['input']['y']==0;await wait('LanternWard.inspect().state.speed<.05');ok('Hand-only motion uses real input and brakes on pinch release')
    await page.evaluate('__xrFixture.tracking=false');await wait('LanternWard.inspect().paused');assert (await state())['xr']['input'].get('y',0)==0;await page.evaluate('__xrFixture.tracking=true');await xrframes();ok('Hand tracking loss clears held motion and pauses');await page.evaluate('__xrFixture.session.end()');await wait('!LanternWard.inspect().xr.active');await page.click('#ar-diorama');await wait('LanternWard.inspect().xr.active');await xrframes();assert (await state())['xr']['kind']=='diorama-ar';assert (await state())['xr']['environmentBlendMode']=='alpha-blend';assert (await state())['view']['clearAlpha']==0;ok('AR requests a separate alpha-blended session, not a VR fallback');await shot('xr-ar');await page.evaluate('__xrFixture.session.end()');await wait('!LanternWard.inspect().xr.active');ok('XR exit returns to desktop safely');await page.evaluate('__xrFixture.opaque=true');await page.click('#ar-diorama');await wait("!LanternWard.inspect().xr.pending&&!!LanternWard.inspect().xr.error");assert not (await state())['xr']['active'];assert not (await state())['failed'];ok('Opaque AR is rejected explicitly without silent VR substitution');assert await page.evaluate("localStorage.getItem('svgn.paper-delivery-3d.v1')===__legacyExpected");ok('All XR session transitions leave original saves untouched')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await shot('failure')
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await b.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
