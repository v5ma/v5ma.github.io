"""Input-driven native console test on main URL; no gameplay state injection.
Each mode has its own context. Evidence is flushed after every successful check.
"""
import asyncio,json,os,traceback,time,base64,io
from PIL import Image
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('CONSOLE_BASE','http://127.0.0.1:8765/svgn-planet/')
MODE=os.getenv('CONSOLE_MODE','diorama-third-ar')
OUT=Path(os.getenv('CONSOLE_OUT','console-results'))/MODE;OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / spatial console acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'mode':MODE,'base':BASE,'checks':[],'errors':[],'consoleErrors':[],'success':False,'physicalDevicesTested':False,'inputOnly':True,'renderQuality':'low (normal game option; no physics changes)'};start=time.time()
 def checkpoint(): (OUT/'report.json').write_text(json.dumps(report,indent=2))
 def ok(name):report['checks'].append(name);checkpoint();print('PASS',name,flush=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':600});page.set_default_timeout(60000);await page.add_init_script(PAD);await page.add_init_script(Path(__file__).with_name('lantern').joinpath('xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def wait(q):await page.wait_for_function(q,timeout=60000)
  async def frames(n=4):
   f=await page.evaluate('NeighborhoodMissions.inspect().xr.frames');await wait('NeighborhoodMissions.inspect().xr.frames>='+str(f+n))
  async def capture(name):
   # Read pixels immediately after an actual renderer frame, not the HTML mirror.
   await page.evaluate("""()=>{window.__consoleCapture=null;window.__wantConsoleCapture=true;if(!__xrFixture.captureHook){__xrFixture.captureHook=true;const s=__xrFixture.session,old=s.requestAnimationFrame.bind(s);s.requestAnimationFrame=cb=>old((time,frame)=>{cb(time,frame);const feedback=window.NeighborhoodMissions?.inspect().xr.console.floor;const automatic=window.__captureNextFeedback&&feedback?.messageVisible;if(automatic)window.__captureNextFeedback=false;if(window.__wantConsoleCapture||automatic){window.__wantConsoleCapture=false;const gl=document.querySelector('#world').getContext('webgl2'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let b='';for(let i=0;i<p.length;i+=32768)b+=String.fromCharCode(...p.subarray(i,i+32768));window.__consoleCapture={w,h,bytes:btoa(b)};if(automatic)window.__floorCapture={...window.__consoleCapture,feedback,time};}});}}""")
   await wait('window.__consoleCapture!==null');data=await page.evaluate('__consoleCapture');image=Image.frombytes('RGBA',(data['w'],data['h']),base64.b64decode(data['bytes'])).transpose(Image.Transpose.FLIP_TOP_BOTTOM);assert len(image.getcolors(image.width*image.height) or [])>8,'Rendered frame has no useful variation';image.save(OUT/(name+'.png'))
  async def aim(point):
   await page.evaluate("""async p=>{const T=await import('./vendor/three.module.js'),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(...p).normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q),pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};__xrFixture.right.targetRaySpace.pose=__xrFixture.hand.targetRaySpace.pose=pose;}""",point);await frames(3)
  async def trigger(expect_exit=False):
   hands=await page.evaluate('!!__xrFixture.session.inputSources[0].hand')
   await page.evaluate('__xrFixture.pinch=.012' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}')
   try:
    if expect_exit:await wait('!NeighborhoodMissions.inspect().xr.active')
    else:await frames(3)
   finally:await page.evaluate('__xrFixture.pinch=.06' if hands else '__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}')
   if not expect_exit:await frames(4)
  async def click(row,u=.5):
   point=await page.evaluate("""async([r,u])=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel();return new T.Vector3(((r.x+r.w*u)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,.03).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)).toArray();}""",[row,u]);await aim(point);await trigger(row.get('id')=='xr-exit')
  async def choose(label,u=.5):
   await wait('NeighborhoodMissions.inspect().xr.console.progress>=.99');await frames(3)
   for _ in range(30):
    rows=await page.evaluate('NeighborhoodMissions.panel().rows');r=next((r for r in rows if r.get('id')==label or r['label']==label),None)
    if r:
     if r.get('id')=='hub-mission-watch' and 'missionPreview' not in report:
      assert r.get('detail','').startswith('Next: Meet Mara'),r
      before=await page.evaluate('NeighborhoodMissions.inspect().ward.watch')
      assert before['stage']==0 and before['credits']==0,before
      report['missionPreview']={'title':r['label'],'nextStep':r['detail']}
      await capture('mission-next-step')
      ok('Mission button states the actual next meeting point before selection, with no progress granted')
     await click(r,u);return
    nxt=next((r for r in rows if r['label'].startswith('Next ')),None)
    assert nxt,'Missing native row '+label+' '+str(rows)
    await click(nxt)
   raise AssertionError('Missing control '+label)
  async def xbox(i):
   await page.evaluate('(i)=>{window.__focusPoll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,value:1}}',i)
   await wait('NeighborhoodController.inspect().polls>__focusPoll+2')
   await page.evaluate('(i)=>{window.__focusPoll=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,value:0}}',i)
   await wait('NeighborhoodController.inspect().polls>__focusPoll+2');await frames(6)
  async def visibleFocus():
   await wait('NeighborhoodMissions.panel().rows.some(r=>r.id===document.activeElement.id&&r.focused)')
   return await page.evaluate('document.activeElement.id')
  async def menu():
   await page.evaluate('__xrFixture.left.gamepad.buttons[5]={pressed:true,value:1}');await frames(3);await page.evaluate('__xrFixture.left.gamepad.buttons[5]={pressed:false,value:0}');await wait('NeighborhoodMissions.inspect().paused');await frames(12)
  try:
   await page.goto(BASE+('&' if '?' in BASE else '?')+'quality=low',wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.bring_to_front();assert await page.evaluate('NeighborhoodMissions.inspect().version')=='0.16.1'
   await page.click('#xr-'+MODE+'-launch');await wait('NeighborhoodMissions.inspect().xr.console.progress>=.99');await frames(4)
   q=await page.evaluate('NeighborhoodMissions.inspect()');assert q['xr']['eyes']==2 and q['xr']['console']['buttonMeshes']>0 and not q['xr']['headLockedPanels'];ok('Native raised button meshes render in '+MODE)
   before=q['xr']['console']['panelMatrix'];await page.evaluate('__xrFixture.viewerRoll=.4;__xrFixture.viewerPitch=-.25;__xrFixture.viewerX=.08');await frames(6);assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.panelMatrix')==before;await capture('floor-console');await page.evaluate('__xrFixture.viewerRoll=0;__xrFixture.viewerPitch=0;__xrFixture.viewerX=0');ok('Head tilt and lean leave the open floor console fixed')
   await choose('pause-dialog-spatial-ui')
   current=await page.evaluate('NeighborhoodMissions.inspect()');assert current['xr']['presentation']['boxHeight']==3
   menu_size=current['xr']['console']['preferences']['size'];await choose('console-size',.75);assert abs(await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.size')-menu_size-.05)<1e-6;await choose('console-size',.2)
   await choose('console-box-height',.75);assert await page.evaluate('NeighborhoodMissions.inspect().xr.presentation.boxHeight')==3.25;await choose('console-box-height',.2)
   scale=await page.evaluate('NeighborhoodMissions.inspect().xr.presentation.scale');await choose('console-view-scale',.75);assert abs(await page.evaluate('NeighborhoodMissions.inspect().xr.presentation.scale')-scale-.002)<1e-6;await choose('console-view-scale',.2)
   if MODE.startswith('diorama'):assert abs(await page.evaluate('NeighborhoodMissions.inspect().spatial.portalBounds[1]')-2.04)<1e-5
   ok('Menu size, overall diorama size and triple-height portal adjust independently through native controls')
   height=await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.height');await choose('console-height',.75);assert abs(await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.height')-height-.05)<1e-6;await choose('console-height',.2)
   await choose('console-mount');assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.mount')=='controller';await frames(5);before=await page.evaluate('NeighborhoodMissions.inspect().xr.console.panelMatrix');await page.evaluate('__xrFixture.left.gripSpace.pose.position.x-=.1');await frames(5);assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.panelMatrix')!=before;await capture('controller-console');await page.evaluate('__xrFixture.left.gripSpace.pose.position.x+=.1');await frames(4);await choose('console-mount');ok('Native height and controller docking controls transform the console and save settings')
   await choose('console-back');await wait('!NeighborhoodMissions.inspect().paused');await frames(8);q=await page.evaluate('NeighborhoodMissions.inspect()');assert not q['xr']['actionPanelVisible'] and q['xr']['console']['buttonMeshes']==0;ok('Resume removes all menu meshes from normal gameplay')
   # A lower/raised tracked grip controls the glance card, not the headset.
   await page.evaluate('__xrFixture.left.gripSpace.pose.position.y=-.9');await frames(6);assert not await page.evaluate('NeighborhoodMissions.inspect().xr.console.hudVisible');await page.evaluate('__xrFixture.left.gripSpace.pose.position.y=-.3');await frames(6);assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.hudVisible');before=await page.evaluate('NeighborhoodMissions.inspect().xr.console.hudMatrix');await page.evaluate('__xrFixture.viewerRoll=.3');await frames(5);assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.hudMatrix')==before;await page.evaluate('__xrFixture.viewerRoll=0');await capture('objective-card');ok('Compact objective card follows the free controller and disappears when lowered')
   await page.evaluate('__xrFixture.left.gripSpace.pose.position.y=-.9;__xrFixture.viewerPitch=-1.08;__xrFixture.viewerYaw=.4');await frames(5)
   floor=await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor');assert floor['mapVisible'] and floor['mapReady'];assert not await page.evaluate('NeighborhoodMissions.inspect().xr.console.hudVisible')
   matrix=floor['mapMatrix'];await capture('persistent-floor-map');await frames(6);assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor.mapDraws')>floor['mapDraws'];assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor.mapMatrix')==matrix
   ok('Live floor map keeps refreshing with lowered hands and no head-attached card')
   # Capture the first rendered frame of an actual mount/dismount response. The
   # test never assigns a message, player state, game clock or progress.
   await page.evaluate('__xrFixture.viewerPitch=-.78;__xrFixture.viewerYaw=0;window.__floorCapture=null;window.__captureNextFeedback=true;__xrFixture.right.gamepad.buttons[5]={pressed:true,value:1}')
   try:await wait('window.__floorCapture!==null')
   finally:await page.evaluate('__xrFixture.right.gamepad.buttons[5]={pressed:false,value:0}')
   captured=await page.evaluate('__floorCapture');assert 'On foot' in captured['feedback']['messageText'],captured['feedback']
   Image.frombytes('RGBA',(captured['w'],captured['h']),base64.b64decode(captured['bytes'])).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(OUT/'floor-interaction.png')
   report['floorMessage']={'text':captured['feedback']['messageText'],'visibleOpacity':captured['feedback']['messageOpacity'],'durationMS':captured['feedback']['durationMS']}
   await wait('!NeighborhoodMissions.inspect().xr.console.floor.messageVisible');assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor.messageOpacity')==0
   await frames(5);assert not await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor.messageVisible')
   # Return to riding through the same real button, then continue inherited tests.
   await page.evaluate('__xrFixture.right.gamepad.buttons[5]={pressed:true,value:1}');await frames(3);await page.evaluate('__xrFixture.right.gamepad.buttons[5]={pressed:false,value:0};__xrFixture.viewerPitch=0;__xrFixture.left.gripSpace.pose.position.y=-.3');await frames(5);assert await page.evaluate('SVGNPlanet.inspect().ride')
   ok('Actual interaction text renders on the floor and fades completely without replaying its old timer')
   await aim([4,0,-2]);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await wait('SVGNPlanet.inspect().speed>.15');await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await wait('SVGNPlanet.inspect().speed===0');ok('Explicit vehicle-trigger profile accelerates on hold and stops on release')
   # Summon through the actual floor target after looking down. This changes only input.
   await page.evaluate('__xrFixture.viewerPitch=-.95');await frames(5);a=await page.evaluate('NeighborhoodMissions.inspect().xr.console.anchor');distance=await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.distance');import math
   await aim([a['x']-math.sin(a['yaw'])*distance,a['y']+.05,a['z']-math.cos(a['yaw'])*distance]);await trigger();await wait('NeighborhoodMissions.inspect().paused');await page.evaluate('__xrFixture.viewerPitch=0');await frames(12);ok('Pointing and selecting the floor disc summons a usable menu without a gameplay action')
   # Recovered physical trigger option: actual native settings and riding input.
   # Deliberately restore the existing profile before continuing inherited checks.
   await choose('pause-dialog-spatial-ui');await choose('console-driveHand');await choose('console-back');await wait('!NeighborhoodMissions.inspect().paused');await frames(6)
   assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.driveHand')=='left'
   await aim([4,0,-2]);await page.evaluate('__xrFixture.left.gamepad.buttons[0]={pressed:true,value:1}');await wait('SVGNPlanet.inspect().speed>.15')
   await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await wait('NeighborhoodMissions.inspect().xr.input.brake');await wait('SVGNPlanet.inspect().speed===0')
   await page.evaluate('__xrFixture.left.gamepad.buttons[0]={pressed:false,value:0};__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(6)
   await menu();await choose('pause-dialog-spatial-ui');await choose('console-driveHand');await choose('console-back');await wait('!NeighborhoodMissions.inspect().paused');await frames(6)
   assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.driveHand')=='right'
   await aim([4,0,-2]);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await wait('SVGNPlanet.inspect().speed>.15')
   await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await wait('SVGNPlanet.inspect().speed===0')
   await menu();await choose('pause-dialog-spatial-ui');await choose('console-driveHand');assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.preferences.driveHand')=='primary'
   await choose('console-back');await menu();ok('Recovered left/right trigger selection drives and brakes through actual inputs, then restores the existing profile')
   await choose('visit-ward');await wait('NeighborhoodMissions.inspect().district==="lantern"');await frames(6)
   # D-pad Jobs must lead to actual mission focus, even after the next controller
   # scope poll; it must not silently select a mission or award anything.
   await xbox(13);await wait('NeighborhoodMissions.inspect().paused');await wait('NeighborhoodMissions.inspect().xr.console.progress>=.99')
   first=await visibleFocus();assert first.startswith('hub-mission-'),first
   for _ in range(7):await xbox(13);await visibleFocus()
   q=await page.evaluate('NeighborhoodMissions.inspect()');assert q['ward']['watch']['stage']==0 and q['ward']['watch']['credits']==0
   await capture('visible-gamepad-focus');ok('Xbox Jobs and D-pad navigation keep the focused control visible across native pages')
   await choose('ward-resume');await wait('!NeighborhoodMissions.inspect().paused');await menu();assert await visibleFocus()=='ward-resume'
   await choose('ward-mission-list');assert (await visibleFocus()).startswith('hub-mission-');ok('Pause still defaults to Resume while Choose a mission jumps directly to the existing list')
   await choose('hub-mission-radio');await wait('!NeighborhoodMissions.inspect().paused');await frames(5)
   route=await page.evaluate("""async()=>{const {navigation}=await import('./lantern/navigation.mjs'),s=NeighborhoodMissions.inspect().ward;return navigation(s).guide;}""")
   assert route['cue'] and len(route['path'])>2 and route['target']['y']>4
   assert any('stair' in p['label'] for p in route['path']),route
   q=await page.evaluate('NeighborhoodMissions.inspect()');assert q['ward']['city']['progress'].get('radio') is None and q['ward']['city']['credits']==0
   await menu();await choose('ward-map-button');await capture('way-in-map');await choose('Back / resume')
   ok('Selecting the upstairs radio story draws a supported way-in route without accepting it or awarding credits')
   await choose('hub-mission-watch');await wait('!NeighborhoodMissions.inspect().paused');await frames(5);q=await page.evaluate('NeighborhoodMissions.inspect()');assert q['ward']['watch']['tracking'] and q['ward']['watch']['stage']==0;ok('Native mission selection updates the integrated district without awarding progress')
   await wait('NeighborhoodMissions.inspect().xr.console.floor.mapGoal.includes("Mara")');assert await page.evaluate('NeighborhoodMissions.inspect().xr.console.floor.mapReady');ok('Lantern Ward live floor map changes immediately to the selected real mission')
   await menu();await choose('ward-map-button');await frames(5);assert await page.locator('#ward-map-dialog').evaluate('(e)=>e.open');await capture('mission-map');await choose('Back / resume');await choose('ward-save');await choose('ward-restore');await frames(5);rows=await page.evaluate('NeighborhoodMissions.panel().rows');assert rows[0]['id']=='ward-keep';saved=await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")');await choose('ward-keep');assert saved==await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")');ok('Map and cancel-first restore work on the same console without changing saved progress')
   await choose('ward-menu-spatial-ui');await choose('console-mount');await choose('console-back');await choose('ward-resume');await page.evaluate('__xrFixture.useHands()');await wait('NeighborhoodMissions.inspect().paused');await frames(12);assert not await page.evaluate('NeighborhoodMissions.inspect().xr.console.controllerDocked');await choose('ward-map-button');await choose('Back / resume');await choose('ward-resume');await wait('!NeighborhoodMissions.inspect().paused');ok('Hand pinch operates map, back and resume without a permanent action board')
   await page.evaluate('__xrFixture.tracking=false');await wait('NeighborhoodMissions.inspect().paused');assert not await page.evaluate('NeighborhoodMissions.inspect().xr.input.y');await page.evaluate('__xrFixture.tracking=true');await frames(12);await choose('ward-xr');await choose('xr-exit');await wait('!NeighborhoodMissions.inspect().xr.active');q=await page.evaluate('NeighborhoodMissions.inspect()');assert q['xr']['visibleRays']==0 and not q['xr']['actionPanelVisible'];assert await page.evaluate('__xrFixture.session.ended');await page.click('#ward-resume');await wait('!NeighborhoodMissions.inspect().paused');assert not await page.evaluate('document.body.classList.contains("in-xr")');ok('Tracking loss clears movement; native Exit XR restores usable desktop access with no stale rays')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await page.evaluate('NeighborhoodMissions.inspect()')
  except Exception as e:
   report.update(failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await page.evaluate('NeighborhoodMissions.inspect()');await capture('failure')
   except Exception:pass
  finally:report['wallSeconds']=round(time.time()-start,2);checkpoint();await browser.close()
 if not report['success']:raise SystemExit(1)
asyncio.run(main())
