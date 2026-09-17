"""Input-only journeys and native XR menu matrix; synthetic devices, no player state setters."""
import asyncio,json,os,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/lantern-ward.html')
SUITE=os.getenv('WATCH_SUITE','watch-roof');OUT=Path(os.getenv('WATCH_OUT','watch-results'))/SUITE;OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / Night Watch',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'suite':SUITE,'checks':[],'errors':[],'consoleErrors':[],'physicalHardwareTested':False,'inputOnly':True}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':1100,'height':800},accept_downloads=True);await context.add_init_script(PAD);await context.add_init_script(Path(__file__).with_name('xr-fixture.js').read_text());page=await context.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def state():return await page.evaluate('LanternWard.inspect()')
  async def wait(q):await page.wait_for_function(q,timeout=90000)
  async def frames(n=3):
   before=(await state())['frames'];await wait('LanternWard.inspect().frames>='+str(before+n))
  async def press(i):
   await page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);await frames(2);await page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);await frames(3)
  async def neutral():await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons.forEach(b=>{b.pressed=false;b.value=0})');await frames(4)
  async def focus(id):
   for _ in range(150):
    if await page.evaluate('document.activeElement.id')==id:return
    await press(13)
   raise AssertionError('Cannot focus '+id)
  async def pilot(x,z):
   for _ in range(3000):
    q=await page.evaluate("""([x,z])=>{const q=LanternWard.inspect(),s=q.state,dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),stop=d<.25;__pad.axes[0]=stop?0:(dx*q.basis.right[0]+dz*q.basis.right[1])/(d||1);__pad.axes[1]=stop?0:-(dx*q.basis.forward[0]+dz*q.basis.forward[1])/(d||1);__pad.buttons[6]={pressed:stop,value:stop?1:0};return {d,speed:s.speed,failed:q.failed,knocked:q.watch.knockedOut,paused:q.paused};}""",[x,z])
    assert not q['failed'] and not q['knocked'] and not q['paused'],q
    if q['d']<.29 and q['speed']<.05:await neutral();return
    await frames(2)
   raise AssertionError('Route cannot reach '+str((x,z))+' '+str(q))
  async def route(points):
   for x,z in points:await pilot(x,z)
  def ok(name):print('PASS',name,flush=True);report['checks'].append(name)
  async def shot(name):await page.screenshot(path=str(OUT/(name+'.png')))
  async def aimRow(label):
   for _ in range(24):
    labels=await page.evaluate('LanternWard.panel().rows.map(r=>r.label)')
    if label in labels:break
    await selectRow(next(x for x in labels if x.startswith('Next ')))
   else:raise AssertionError('Native menu label missing: '+label+' / '+str(labels))
   await page.evaluate("""async(label)=>{const T=await import('./vendor/three.module.js'),p=LanternWard.panel(),r=p.rows.find(r=>r.label===label);const target=new T.Vector3(((r.x+r.w/2)/1024-.5)*p.width,(.5-(r.y+r.h/2)/768)*p.height,0).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix));const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.normalize());const m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",label);await frames(5)
  async def selectRow(label):
   await aimRow(label);hands=await page.evaluate('!!__xrFixture.session.inputSources[0].hand')
   await page.evaluate('__xrFixture.pinch=.012' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(2);await page.evaluate('__xrFixture.pinch=.06' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(5)
  async def beginCase():
   await press(13);await wait('LanternWard.inspect().paused');await page.locator('[data-mission="watch"]').click();await wait('!LanternWard.inspect().paused');await wait('LanternWard.inspect().controllerReady');await pilot(-10,14);await press(2);assert (await state())['state']['watch']['stage']==1;ok('Accept a real Watch case at Mara, with no progress granted by mission selection')
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await page.bring_to_front();await press(0);await wait('LanternWard.inspect().controllerReady');assert (await state())['version']=='0.14.0';ok('Current release boots the real renderer')
   if SUITE.startswith('watch-'):
    await beginCase()
    if SUITE=='watch-roof':
     await route([[-12.5,8.2],[-12.5,6],[-9.6,6],[-9.6,2.3]]);await press(14);assert (await state())['state']['watch']['stage']==2;await shot('scan-print-receiver');ok('Scanner discovers the relay relationship at a physically reached clue')
     await press(4);await wait('LanternWard.inspect().watch.travel!==null');await wait('LanternWard.inspect().watch.travel===null');q=await state();assert q['state']['y']>4.3 and q['watch']['grapples']==1;await shot('grapple-perch');ok('Grapple follows a collision-checked arc to a real terrace landing')
     await route([[-6,-3.5],[6,-3.5],[12,-3.5],[12,-2.2]]);await press(2);assert (await state())['state']['watch']['stage']==3;assert (await state())['watch']['strikes']==0;ok('Rooftop override resolves the same mission without combat')
     await route([[19.5,1.5],[19.5,10.5],[16,10.5],[14,8],[6,8]])
    else:
     await route([[-23,13],[-23,-7],[-21,-13.5],[5,-13.5]]);await press(14);assert (await state())['state']['watch']['stage']==2;await press(11);assert (await state())['watch']['tool']=='pulse';ok('Ground approach reveals the same clue and selects the pulse tool directly')
     for attempt in range(160):
      q=await state();alive=[e for e in q['watch']['sentries'] if e['hp']>0]
      if not alive:break
      assert not q['watch']['knockedOut'],q['watch']
      # Aim by the actual look stick, not by assigning player or camera state.
      await page.evaluate("""()=>{const q=LanternWard.inspect(),s=q.state,e=q.watch.sentries.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0],dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz),target=Math.atan2(-dx,-dz),error=Math.atan2(Math.sin(target-q.yaw),Math.cos(target-q.yaw));__pad.axes[2]=Math.abs(error)>.08?-Math.sign(error)*Math.min(1,Math.abs(error)*3):0;__pad.axes[0]=d>1.7?(dx*q.basis.right[0]+dz*q.basis.right[1])/(d||1):0;__pad.axes[1]=d>1.7?-(dx*q.basis.forward[0]+dz*q.basis.forward[1])/(d||1):0;__pad.buttons[6]={pressed:d<=1.7,value:d<=1.7?1:0};}""")
      await frames(8);await press(4);await press(15)
     else:raise AssertionError('Combat did not resolve through input')
     await neutral();assert all(e['hp']==0 for e in (await state())['watch']['sentries']);ok('Two sentry roles respond to pulse, guard and strikes without civilian targets')
     await pilot(6.5,-9.8);await press(2);assert (await state())['state']['watch']['stage']==3;await shot('relay-restored');await pilot(6,8)
    await route([[4.5,18]]);await press(2);await route([[0,18],[-10,14]]);await press(2);q=await state();assert q['state']['watch']['credits']==180 and q['state']['watch']['stage']==4;assert q['state']['credits']==0;assert q['state']['city']['credits']==0;ok('Earned return records 180 Watch credits without duplicating other ledgers')
    await press(2);assert (await state())['state']['watch']['credits']==180;await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');assert (await state())['state']['watch']['credits']==180;ok('Reload retains the completed case and exactly-once reward')
   else:
    for mode,entry in [('diorama-vr','vr-diorama'),('first-person-vr','vr-first'),('diorama-ar','ar-diorama'),('first-person-ar','ar-first')]:
     q=await state()
     if not q['paused']:await press(9)
     await page.click('#'+entry);await wait('LanternWard.inspect().xr.frames>5&&LanternWard.inspect().xr.active');await frames(6);assert (await state())['xr']['kind']==mode
     await selectRow('Resume');await wait('!LanternWard.inspect().paused');await frames(5);q=await state();assert not q['xr']['actionPanelVisible'] and q['xr']['visibleRays']==0;ok(mode+': no menu or long rays during controller gameplay')
     await page.evaluate('__xrFixture.left.gamepad.buttons[5]={pressed:true,value:1}');await wait('LanternWard.inspect().paused');await page.evaluate('__xrFixture.left.gamepad.buttons[5]={pressed:false,value:0}');await frames(5)
     await selectRow('Save / recovery');await selectRow('Save progress');old=await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")');await selectRow('Restore backup');await frames();assert (await state())['confirmation'];assert (await page.evaluate('LanternWard.panel().rows[0].label'))=='Keep current progress';await selectRow('Keep current progress');assert await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")')==old;ok(mode+': backup confirmation defaults to keeping current progress')
     await selectRow('Restart chapter');await press(1);assert not (await state())['confirmation'] and (await state())['paused'];assert await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")')==old;ok(mode+': Xbox Back cancels destructive action without leaving gameplay active')
     async with page.expect_download() as dl:await selectRow('Export current progress')
     download=await dl.value;await download.save_as(str(OUT/(mode+'-export.json')));assert json.loads((OUT/(mode+'-export.json')).read_text())['chapter']=='lantern-ward-01';ok(mode+': native export produces a valid chapter file')
     await selectRow('Back to Menu');await selectRow('Controls');await selectRow('Dominant: right');await selectRow('Swap sticks: off');q=await state();assert q['xr']['controls']['dominant']=='left' and q['xr']['controls']['swapSticks'];await selectRow('Motion strikes: on');assert not (await state())['xr']['controls']['motionPunch'];await selectRow('Dominant: left');await selectRow('Swap sticks: on');await selectRow('Motion strikes: off');await selectRow('Back to Menu');ok(mode+': dominant hand, stick swap and seated strike settings are native and reversible')
     await selectRow('Missions / map');await selectRow('Night Watch: Signal Hijack');await wait('!LanternWard.inspect().paused');assert (await state())['state']['watch']['tracking'];assert (await state())['state']['watch']['stage']==0
     count=(await state())['xr']['motionStrikes'];await page.evaluate('__xrFixture.right.gamepad.buttons[1]={pressed:true,value:1};__xrFixture.viewerZ=.12;__xrFixture.viewerRoll=.35');await frames(6);assert (await state())['xr']['motionStrikes']==count;await page.evaluate('__xrFixture.right.gamepad.buttons[1]={pressed:false,value:0};__xrFixture.viewerZ=0;__xrFixture.viewerRoll=0');await frames(5);ok(mode+': head movement alone never becomes a punch')
     await page.evaluate('__xrFixture.useHands()');await wait('LanternWard.inspect().paused');await frames();await selectRow('Resume');await wait('!LanternWard.inspect().paused');assert not (await state())['xr']['actionPanelVisible'];await page.evaluate('__xrFixture.hand.gripSpace.pose.position.y=-.02;__xrFixture.hand.gripSpace.pose.position.z=-.35;__xrFixture.pinch=.012');await wait('LanternWard.inspect().paused');await page.evaluate('__xrFixture.pinch=.06;__xrFixture.hand.gripSpace.pose.position.y=-.3;__xrFixture.hand.gripSpace.pose.position.z=-.6');await frames(6);ok(mode+': hidden hand menus reopen through a deliberate raised-pinch gesture')
     matrix=(await state())['xr']['panelMatrix'];await page.evaluate('__xrFixture.viewerRoll=.45;__xrFixture.viewerPitch=-.2');await frames(6);assert (await state())['xr']['panelMatrix']==matrix;await shot(mode+'-stable-menu');await page.evaluate('__xrFixture.viewerRoll=0;__xrFixture.viewerPitch=0');await frames(4);await selectRow('Resume');await wait('!LanternWard.inspect().paused')
     await page.evaluate('__xrFixture.hand.gripSpace.pose.position.y=-.65;__xrFixture.pinch=.012');before=(await state())['state']['distance'];await wait('LanternWard.inspect().state.distance>'+str(before+.15));await page.evaluate('__xrFixture.pinch=.06;__xrFixture.hand.gripSpace.pose.position.y=-.3;__xrFixture.hand.gripSpace.pose.position.z=-.6');await wait('LanternWard.inspect().state.speed<.05');assert not (await state())['xr']['actionPanelVisible'];ok(mode+': low-pinch movement releases and stops with no action board')
     await page.evaluate('__xrFixture.tracking=false');await wait('LanternWard.inspect().paused');assert (await state())['xr']['input'].get('y',0)==0;await page.evaluate('__xrFixture.tracking=true');await frames(6);await selectRow('Exit XR');await wait('!LanternWard.inspect().xr.active');ok(mode+': tracking-loss pause and explicit exit retain desktop recovery')
    await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');assert (await state())['xr']['controls']['profile']=='action';ok('XR preferences survive reload without rewriting mission progress')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await shot('failure')
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
