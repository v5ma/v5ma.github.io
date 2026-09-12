import asyncio, json, os, time, traceback
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('COASTAL_OUTPUT','coastal-results'));OUT.mkdir(exist_ok=True)
BASE=os.environ.get('COASTAL_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox Controller / release acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});"""
async def main():
 report={'checks':[],'errors':[],'physicalControllerTested':False};start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':960,'height':600});await context.add_init_script(PAD)
  page=await context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  async def wait_poll(before):await page.wait_for_function('(b)=>NeighborhoodController.inspect().polls>b',arg=before,timeout=45000)
  async def press(i):
   before=await page.evaluate('NeighborhoodController.inspect().polls');await page.evaluate('(i)=>{__pad.buttons[i]={pressed:true,touched:true,value:1}}',i);await wait_poll(before)
   before=await page.evaluate('NeighborhoodController.inspect().polls');await page.evaluate('(i)=>{__pad.buttons[i]={pressed:false,touched:false,value:0}}',i);await wait_poll(before)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  def ok(name,data=None):report['checks'].append({'name':name,'data':data});print('PASS',name,flush=True)
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded',timeout=90000)
   await page.wait_for_function("(window.SVGNPlanet&&!document.getElementById('start').disabled)||!document.getElementById('failure').hidden",timeout=150000)
   assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text()
   await page.bring_to_front();await press(0);await page.wait_for_function('SVGNPlanet.inspect().started',timeout=15000);await page.wait_for_timeout(1200)
   s=await state();assert s['version']=='0.7.0' and not s['failed'];ok('Controller starts Coastal Pulse')
   assert s['render']['life']['activeResidents']>=5 and s['render']['life']['activeCars']>=2;s0=s['render']['life'];ok('Lively street population and continuous traffic',s0)
   old=s['basis'];await page.evaluate('__pad.axes[2]=.9');await page.wait_for_timeout(1000);await page.evaluate('__pad.axes[2]=0');s=await state();turn=sum(a*b for a,b in zip(old['right'],s['basis']['forward']));assert s['render']['cameraOrbit']<-.10 and turn>0,(s['render']['cameraOrbit'],turn);ok('Right stick right turns camera right',{'orbit':s['render']['cameraOrbit'],'rightComponent':turn})
   await press(11);await page.evaluate("__pad.axes[1]=-1;__pad.buttons[7]={pressed:true,touched:true,value:1}");t0=(await state())['time'];samples=[]
   for _ in range(80):
    await page.wait_for_timeout(400);s=await state()
    if s['time']-t0>4:samples.append(s['speed'])
    if s['time']-t0>=13:break
   assert samples and min(samples)>29.75,(min(samples) if samples else None,s['time']-t0);ok('High speed remains steady beyond old depletion cycle',{'min':min(samples),'seconds':s['time']-t0})
   await page.evaluate("__pad.axes[1]=0;__pad.buttons[7]={pressed:false,touched:false,value:0}");before=(await state())['speed'];await page.wait_for_timeout(800);after=(await state())['speed'];assert abs(before-after)<.08,(before,after);ok('Releasing accelerator coasts without automatic braking')
   await page.evaluate("__pad.buttons[6]={pressed:true,touched:true,value:1}");await page.wait_for_timeout(1200);await page.evaluate("__pad.buttons[6]={pressed:false,touched:false,value:0}");assert (await state())['speed']<.1;ok('LT braking is explicit and effective')
   await press(13);assert await page.locator('#jobs-dialog').is_visible();await page.screenshot(path=str(OUT/'release-jobs.png'),timeout=60000);await press(0);s=await state();assert not s['paused'] and s['coastal']['active'];ok('D-pad jobs board and A contract acceptance work without mouse')
   await page.mouse.click(20,20);await page.keyboard.press('Enter');await page.wait_for_timeout(500);a=(await state())['coastal']['audio'];assert a['transportCount']<=1 and a['activeVoices']<=64,a;ok('Audio uses one bounded adaptive transport',a)
   await press(9);assert (await state())['paused'];await page.screenshot(path=str(OUT/'release-menu.png'),timeout=60000);await press(1);assert not (await state())['paused'];ok('Menu returns with controller B')
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(500);await press(13);assert await page.locator('#jobs-dialog').is_visible();await page.screenshot(path=str(OUT/'release-mobile-jobs.png'),timeout=60000);await press(1);ok('Small-screen job UI remains controller navigable')
   await page.evaluate('__pad.connected=false');await page.wait_for_timeout(500);assert (await state())['paused'];ok('Controller disconnect pauses the game')
   assert not report['errors'],report['errors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:await page.screenshot(path=str(OUT/'release-failure.png'),timeout=60000);report['final']=await state()
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-start,2);(OUT/'browser-release-report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
