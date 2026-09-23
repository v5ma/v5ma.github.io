"""Actual main-entry Currentworks render checks; synthetic XR, not physical devices.
No actor/mission/save state is assigned. Native resume uses the existing ray path.
"""
import asyncio,base64,json,os,time,traceback
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.getenv('MAIN_BASE','http://127.0.0.1:8765/svgn-planet/')
OUT=Path(os.getenv('ENVIRONMENT_OUT','published-results/environment' if BASE.startswith('https:') else 'environment-results'))
OUT.mkdir(parents=True,exist_ok=True)
MODES=['first-person-vr','third-person-vr','diorama-first-vr','diorama-third-vr','first-person-ar','third-person-ar','diorama-first-ar','diorama-third-ar']
async def main():
 report={'base':BASE,'source':os.getenv('GITHUB_SHA'),'checks':[],'errors':[],'consoleErrors':[],'physicalDevicesTested':False,'actorStateAssigned':False};start=time.monotonic()
 def checkpoint():(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 def ok(text):report['checks'].append(text);checkpoint();print('PASS',text,flush=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':640});page.set_default_timeout(180000)
  await page.add_init_script((ROOT/'lantern/xr-fixture.js').read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def wait(q):await page.wait_for_function(q)
  async def snapshot():return await page.evaluate('NeighborhoodMissions.inspect()')
  async def frames(n=6):
   f=(await snapshot())['frames'];await page.wait_for_function('(f)=>NeighborhoodMissions.inspect().frames>=f',arg=f+n)
  async def menu():
   if not (await snapshot())['paused']:await page.click('#pause')
   await wait('document.querySelector("#ward-menu").open')
  async def resumeXR():
   await wait('NeighborhoodMissions.inspect().xr.console.progress>=.99');await frames(3)
   for _ in range(30):
    rows=await page.evaluate('NeighborhoodMissions.panel().rows');row=next((r for r in rows if r.get('id')=='ward-resume'),None)
    if row:break
    row=next((r for r in rows if r['label'].startswith('Next ')),None)
    if not row:raise AssertionError('Cannot find native Resume')
    await rayclick(row)
   else:raise AssertionError('No native Resume page')
   await rayclick(row);await wait('!NeighborhoodMissions.inspect().paused')
  async def rayclick(row):
   await page.evaluate("""async r=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel(),v=new T.Vector3(((r.x+r.w/2)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,.03).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),v.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q);__xrFixture.right.targetRaySpace.pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};}""",row)
   await frames(4);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(3);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await frames(4)
  async def capture(name):
   await page.evaluate("""()=>{window.__environmentCapture=null;const s=__xrFixture.session;if(!s.environmentCapture){s.environmentCapture=true;const old=s.requestAnimationFrame.bind(s);s.requestAnimationFrame=cb=>old((time,frame)=>{cb(time,frame);if(window.__environmentCapture===null){const gl=document.querySelector('#world').getContext('webgl2'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);let raw='';for(let i=0;i<px.length;i+=32768)raw+=String.fromCharCode(...px.subarray(i,i+32768));window.__environmentCapture={w,h,bytes:btoa(raw)};}});}}""")
   await wait('window.__environmentCapture!==null');data=await page.evaluate('__environmentCapture');image=Image.frombytes('RGBA',(data['w'],data['h']),base64.b64decode(data['bytes'])).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   assert len(image.getcolors(image.width*image.height) or [])>12,'No useful rendered geometry';image.save(OUT/(name+'.png'))
   return {'width':data['w'],'height':data['h'],'transparentPixels':sum(1 for a in image.getchannel('A').getdata() if a==0)}
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled')
   button=await page.locator('#play-highline').bounding_box();assert button and button['y']>=0 and button['y']+button['height']<=640,button
   await page.screenshot(path=str(OUT/'01-welcome.png'));ok('Highline launch is on the first welcome screen without scrolling')
   await page.click('#play-highline');await wait('NeighborhoodMissions.inspect().district==="lantern"&&!NeighborhoodMissions.inspect().paused');await frames(10)
   q=await snapshot();env=q['environment'];assert env['hostThree']=='177' and env['prepared'];assert env['trees']['trees']==6 and env['clouds']['clouds']==3;assert env['water']['version']=='0.1.0' and env['trees']['version']=='0.1.3';assert q['ward']['campaign']['progress']['highline']==0
   await page.screenshot(path=str(OUT/'02-canal-and-towers.png'));ok('Actual main district prepares and renders pinned modules with the existing r177 renderer')
   await menu();before=(await snapshot())['environment']['water']['time'];await frames(12);assert (await snapshot())['environment']['water']['time']==before
   await page.check('#ward-art-quiet');await page.uncheck('#ward-art-scenery');await page.select_option('#ward-art-quality','light');await page.click('#ward-resume');await frames()
   q=await snapshot();assert q['environment']['water']['quiet'];assert not q['environment']['trees']['visible'] and not q['environment']['clouds']['visible'];assert q['environment']['water']['visible'];ok('Pause freezes the effect clock; real detail, quiet and scenery controls apply without changing progress')
   await menu();await page.uncheck('#ward-art-quiet');await page.check('#ward-art-scenery');await page.select_option('#ward-art-quality','balanced');await page.click('#ward-resume');await frames()
   for mode in MODES:
    await menu();await page.click('#ward-xr');await page.click('#xr-'+mode);await wait('NeighborhoodMissions.inspect().xr.active');await resumeXR();await frames(8)
    q=await snapshot();env=q['environment'];assert q['xr']['eyes']==2;assert env['frame']['xr'] and env['frame']['ar']==mode.endswith('-ar');assert env['water']['quality']=='light';assert env['trees']['visible'] and env['clouds']['visible'];assert not q['xr']['actionPanelVisible'];assert q['spatial']['centerError']<1e-5
    result=await capture(mode);report.setdefault('renders',{})[mode]=result
    if mode.endswith('-ar'):assert result['transparentPixels']>0,mode+' has no passthrough pixels'
    ok(mode+' uses composed Currentworks shaders, shared LOD and native ray Resume')
    await page.evaluate('__xrFixture.session.end()');await wait('!NeighborhoodMissions.inspect().xr.active');await frames(5)
   q=await snapshot();assert q['ward']['campaign']['progress']['highline']==0 and q['ward']['campaign']['credits']==0
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=q
  except Exception as e:
   report.update(success=False,failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await snapshot();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:report['wallSeconds']=round(time.monotonic()-start,2);checkpoint();await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
