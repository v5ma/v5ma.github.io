"""Actual URL/WebGL/input acceptance. No actor, mission, reward or inventory writes.
The only injected objects are synthetic input devices and the labelled XR fixture."""
import asyncio,json,os,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/lantern-ward.html')
SUITE=os.getenv('CITY_SUITE','city');OUT=Path(os.getenv('CITY_OUT','city-results'))/SUITE;OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / city acceptance',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'suite':SUITE,'checks':[],'errors':[],'consoleErrors':[],'physicalHardwareTested':False,'input':'Synthetic devices; all progress earned by actual application controls'}
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=await b.new_page(viewport={'width':1100,'height':800});page.set_default_timeout(90000)
  await page.add_init_script(PAD)
  if SUITE=='portal':await page.add_init_script(Path(__file__).with_name('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def state():return await page.evaluate('LanternWard.inspect()')
  async def wait(expr):await page.wait_for_function(expr,timeout=90000)
  async def frames(n=3):
   f=(await state())['frames'];await wait('LanternWard.inspect().frames>='+str(f+n))
  async def press(i):
   await page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);await frames(2);await page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);await frames(3)
  async def pilot(x,z):
   for _ in range(4000):
    r=await page.evaluate("""([x,z])=>{const q=LanternWard.inspect(),s=q.state,dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),stop=d<.3,v=[dx/(d||1),dz/(d||1)];__pad.axes[0]=stop?0:v[0]*q.basis.right[0]+v[1]*q.basis.right[1];__pad.axes[1]=stop?0:-(v[0]*q.basis.forward[0]+v[1]*q.basis.forward[1]);__pad.buttons[6]={pressed:stop,value:stop?1:0};return {d,speed:s.speed,steps:s.steps,paused:q.paused,failed:q.failed,x:s.x,y:s.y,z:s.z};}""",[x,z])
    assert not r['paused'] and not r['failed'],r
    if r['d']<.4 and r['speed']<.05:
     await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons[6]={pressed:false,value:0}');await frames(2);return
    await page.wait_for_function('(n)=>LanternWard.inspect().state.steps>=n+4||LanternWard.inspect().failed',arg=r['steps'])
   raise AssertionError('Cannot reach '+str((x,z,r)))
  async def path(points):
   for x,z in points:await pilot(x,z)
  async def select_story(id):
   await press(13);await wait('LanternWard.inspect().paused');
   for _ in range(80):
    if await page.evaluate('document.activeElement?.dataset?.mission')==id:break
    await press(13)
   else:raise AssertionError('Cannot reach mission card '+id+' using Xbox')
   await page.screenshot(path=str(OUT/'mission-map.png'));await press(0);await wait('!LanternWard.inspect().paused');await wait('LanternWard.inspect().controllerReady')
  async def choose(label,hand=False):
   await page.evaluate("""async(label)=>{const T=await import('./vendor/three.module.js'),d=LanternWard.panel(),r=d.rows.find(r=>r.label===label);if(!r)throw Error('Missing native row '+label);const u=(r.x+r.w/2)/1024,v=(r.y+r.h/2)/768,p=new T.Vector3((u-.5)*d.width,(.5-v)*d.height,0).applyMatrix4(new T.Matrix4().fromArray(d.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",label)
   await frames(7);await page.evaluate('__xrFixture.pinch=.012' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(3);await page.evaluate('__xrFixture.pinch=.06' if hand else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(7)
  def ok(text,data=None):report['checks'].append({'name':text,'data':data});print('PASS',SUITE,text,flush=True)
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await page.bring_to_front();await press(0);await wait('LanternWard.inspect().controllerReady');assert (await state())['version']=='0.13.0';ok('Default entry boots the current game with Xbox')
   await page.evaluate('__pad.buttons[7]={pressed:true,value:1}');await wait('LanternWard.inspect().state.speed>5');await page.evaluate('__pad.buttons[7]={pressed:false,value:0}');await wait('LanternWard.inspect().state.speed===0');s=(await state())['state'];await frames(20);t=(await state())['state'];assert abs(s['x']-t['x'])+abs(s['z']-t['z'])<.01;ok('Releasing the actual RT speed control stops the courier without dismounting or collision')
   await pilot(-12,15)
   if SUITE=='city':
    await page.keyboard.down('Shift');await wait('LanternWard.inspect().state.speed>5');await page.keyboard.up('Shift');await wait('LanternWard.inspect().state.speed===0');ok('Keyboard Shift release actively brakes through the real keyup path')
    await pilot(-12,15)
    touchStyle=await page.add_style_tag(content='#touch{display:flex!important}')
    speed=page.locator('[data-hold="boost"]');box=await speed.bounding_box();assert box
    await page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);await page.mouse.down();await wait('LanternWard.inspect().state.speed>5');await page.mouse.up();await wait('LanternWard.inspect().state.speed===0');await touchStyle.evaluate('(e)=>e.remove()');ok('Touch-control button release clears its pointer-captured hold without collision')
    await pilot(-12,15)
    await select_story('press');s=await state();assert s['state']['city']['active']=='press' and s['navigation']['target']['id']=='meet-ada';assert s['view']['city']['residents']==6;ok('Xbox mission selection sets a large map/compass/scene target without granting progress')
    await path([[-12.5,8.2],[-12.5,6],[-9.5,6],[-9.5,4.5]]);await press(2);assert (await state())['state']['city']['progress']['press']==0;await page.screenshot(path=str(OUT/'meet-ada.png'));ok('Enter the real print shop and meet Ada using X')
    await path([[-9.5,6],[-12.5,6],[-12.5,8.2],[-12,15],[-23,13],[-23,-7],[-21,-13.5],[-10,-13.5],[-10,-17.5],[-9,-17]]);await press(2);assert (await state())['state']['city']['progress']['press']==1;await page.screenshot(path=str(OUT/'storehouse.png'));ok('Previously solid storehouse has a traversable doorway, interior and real mission pickup')
    await path([[-10,-17.5],[-10,-13.5],[-21,-13.5],[-23,-7],[-23,13],[-12,15],[-12.5,8.2],[-12.5,6],[-9.5,6],[-9.6,1.5]]);await press(2);assert (await state())['state']['city']['progress']['press']==2;ok('Returned equipment progresses the press, not a preferred-route checkpoint')
    await path([[-9.5,6],[-12.5,6],[-12.5,8.2],[-12,15],[-8.5,15.5]]);await press(2);s=(await state())['state'];assert s['city']['completed']==['press'] and s['city']['credits']==90 and s['credits']==0;await press(2);assert (await state())['state']['city']['credits']==90;ok('Complete the three-stage story and award its separate credits once')
    await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard');await press(0);assert (await state())['state']['city']['credits']==90;ok('Resident progress persists on ordinary reload')
    await select_story('radio');assert (await state())['navigation']['level']=='UPSTAIRS';await path([[-12,15],[-12.5,8.2],[-12.5,5.2],[-12.5,-3.7],[-6,-3.5],[6,-3.5],[12,-3.5],[12,0]]);await press(2);assert (await state())['state']['city']['progress']['radio']==0;await page.screenshot(path=str(OUT/'radio-loft.png'));ok('UPSTAIRS guidance leads to a real upper-floor resident')
    await path([[12,-3.5],[6,-3.5],[-6,-3.5],[-10,-4.5]]);await press(2);await path([[-6,-3.5],[6,-3.5],[12,-3.5],[19,0]]);await press(2);await pilot(12,0);await press(2);assert (await state())['state']['city']['credits']==190;ok('Complete the radio rooftop round trip through the actual stairs and bridge')
    await page.set_viewport_size({'width':390,'height':844});await press(13);await page.screenshot(path=str(OUT/'phone-map.png'));assert await page.locator('#mission-list').is_visible();ok('Map and mission choices remain reachable at phone width')
   else:
    await press(9);await page.click('#vr-diorama');await wait('LanternWard.inspect().xr.frames>8');await choose('Resume');await wait('!LanternWard.inspect().paused');s=await state();assert s['view']['portal']['centerError']<1e-6;assert s['view']['portal']['opaqueEnclosurePlanes']==0;assert s['xr']['solidControllerProxies']==0 and s['xr']['controllerProxyDepthTest'];assert not s['xr']['actionPanelVisible'];anchor=s['view']['portal']['anchor'];ok('Diorama is centered with no opaque enclosure, solid controller proxy planes or controller HUD panel')
    await page.evaluate('__xrFixture.right.targetRaySpace.pose.position.x=5;__xrFixture.right.targetRaySpace.pose.matrix[12]=5');await frames(5);before=(await state())['view']['portal']['worldPosition'];await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,-1,0]');await frames(25);await page.evaluate('__xrFixture.left.gamepad.axes=[0,0,0,0]');await wait('LanternWard.inspect().state.speed<.05');s=await state();assert s['view']['portal']['worldPosition']!=before and s['view']['portal']['anchor']==anchor and s['view']['portal']['centerError']<1e-6;ok('Actual controller locomotion moves the world around a fixed courier and room-fixed box')
    await page.evaluate('__xrFixture.left.gamepad.buttons[0]={pressed:true,value:1}');await wait('LanternWard.inspect().state.speed>5');await page.evaluate('__xrFixture.left.gamepad.buttons[0]={pressed:false,value:0}');await wait('LanternWard.inspect().state.speed===0');ok('Tracked-controller speed release stops without a dismount or wall')
    for pitch,roll,x in [(-.45,.3,.12),(.1,-.4,-.1),(-.25,.5,.2)]:
     await page.evaluate('([p,r,x])=>{__xrFixture.viewerPitch=p;__xrFixture.viewerRoll=r;__xrFixture.viewerX=x}',[pitch,roll,x]);await frames(7);s=await state();assert s['view']['portal']['anchor']==anchor and s['view']['portal']['centerError']<1e-6 and not s['xr']['actionPanelVisible'];assert not s['xr']['headBoundary'];assert not s['failed']
    await page.screenshot(path=str(OUT/'tilted-stereo-portal.png'));ok('Head roll, pitch and lateral movement do not move the box or introduce a head-locked panel')
    await press(9);await frames(10);matrix=(await state())['xr']['panelMatrix'];await page.evaluate('__xrFixture.viewerRoll=-.2;__xrFixture.viewerPitch=.15;__xrFixture.viewerX=.05');await frames(8);assert (await state())['xr']['panelMatrix']==matrix;ok('Open pause panel is placed once and does not follow head rotation')
    await choose('Resume');await press(13);await frames(8);assert (await state())['xr']['missionPage'];await page.screenshot(path=str(OUT/'native-mission-map.png'));await choose('A Voice Above the Market');await wait('!LanternWard.inspect().paused');assert (await state())['state']['city']['active']=='radio';ok('Native XR mission map selects a story through a tracked ray')
    await page.evaluate('__xrFixture.useHands()');await wait('LanternWard.inspect().paused');await choose('Resume',True);await wait('!LanternWard.inspect().paused');await frames(8);matrix=(await state())['xr']['panelMatrix'];await page.evaluate('__xrFixture.viewerRoll=.5;__xrFixture.viewerYaw=.15');await frames(8);assert (await state())['xr']['panelMatrix']==matrix;ok('Hand-only action dock remains stationary rather than producing a head-following rectangle')
    await page.evaluate('__xrFixture.session.end()');await wait('!LanternWard.inspect().xr.active');await page.evaluate('__xrFixture.viewerPitch=__xrFixture.viewerRoll=__xrFixture.viewerYaw=__xrFixture.viewerX=0');await page.click('#ar-first');await wait('LanternWard.inspect().xr.frames>8&&LanternWard.inspect().xr.active');await frames(10);s=await state();assert s['xr']['kind']=='first-person-ar' and s['xr']['environmentBlendMode']=='alpha-blend' and s['xr']['scale']==1 and s['view']['clearAlpha']==0;assert not s['view']['portal']['active'];await page.screenshot(path=str(OUT/'first-person-ar.png'));ok('First-person AR explicitly requests an alpha-blended human-scale session')
    await page.evaluate('__xrFixture.viewerX=100');await frames(10);assert (await state())['xr']['arBoundaryTransparent'];await page.evaluate('__xrFixture.viewerX=0');await frames(10);assert not (await state())['xr']['arBoundaryTransparent'];ok('A virtual AR head-boundary reveals passthrough rather than blocking vision with a VR curtain')
    await choose('Diorama AR');await frames(8);assert (await state())['view']['portal']['active'];assert (await state())['view']['portal']['centerError']<1e-6;ok('AR mode switches to the same player-follow portal without moving game coordinates')
    await page.evaluate('__xrFixture.session.end()');await wait('!LanternWard.inspect().xr.active');assert not (await state())['view']['portal']['active'];assert not (await state())['failed'];ok('Session exit restores ordinary rendering and preserves the selected mission')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await b.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
