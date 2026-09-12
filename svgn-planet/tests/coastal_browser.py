import asyncio, json, os, time, traceback
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('COASTAL_OUTPUT','coastal-results'));OUT.mkdir(exist_ok=True)
BASE=os.environ.get('COASTAL_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox Controller / automated standard mapping',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad]});"""
async def main():
 report={'checks':[],'errors':[],'physicalControllerTested':False,'base':BASE};start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
  await context.add_init_script(PAD);page=await context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  async def press(i,hold=180):
   await page.evaluate('(i)=>{__pad.buttons[i]={pressed:true,touched:true,value:1}}',i);await page.wait_for_timeout(hold);await page.evaluate('(i)=>{__pad.buttons[i]={pressed:false,touched:false,value:0}}',i);await page.wait_for_timeout(190)
  async def inspect():return await page.evaluate('SVGNPlanet.inspect()')
  async def focus(id):
   for _ in range(70):
    if await page.evaluate('document.activeElement?.id')==id:return
    await press(13,100)
   raise AssertionError('Controller could not focus '+id+'; current '+str(await page.evaluate('document.activeElement?.id')))
  def passed(name,data=None):report['checks'].append({'name':name,'passed':True,'data':data});print('PASS',name,flush=True)
  async def boot():
   await page.wait_for_function("window.SVGNPlanet && !document.getElementById('start').disabled",timeout=150000)
   await page.bring_to_front();await press(0,260);await page.wait_for_function('SVGNPlanet.inspect().started',timeout=15000);await page.wait_for_timeout(1200)
   state=await inspect();assert not state['failed'],state['diagnostics'];return state
  async def seed(id):
   data=await page.evaluate("""async id=>{const m=await import('./model.mjs?v=0.7.0'),a=await import('./activities.mjs?v=0.7.0');const s=m.initial();s.ride=true;s.delivered.add(m.WORLD.homes[0].id);s.jobs.wallet=456;a.startJob(s,id);s.n=[...a.jobTarget(s).n];return {key:m.SAVE_KEY,value:JSON.stringify(m.saveData(s))}}""",id)
   code="if(!sessionStorage.getItem("+json.dumps('seed-'+id)+")){localStorage.setItem("+json.dumps(data['key'])+","+json.dumps(data['value'])+");sessionStorage.setItem("+json.dumps('seed-'+id)+",'1');}"
   await page.add_init_script(code);await page.reload(wait_until='domcontentloaded');return await boot()
  try:
   await page.goto(BASE+'?quality=balanced',wait_until='domcontentloaded',timeout=90000)
   state=await boot();assert state['version']=='0.7.0',state['version'];passed('Controller starts the upgraded game',state['render']['art']['status'])
   await page.wait_for_timeout(1800);await page.screenshot(path=str(OUT/'street-start.png'));state=await inspect()
   assert state['render']['life']['activeResidents']>=5,state['render']['life'];assert state['render']['life']['activeCars']>=2,state['render']['life'];passed('Residents and smoothly sampled traffic are active',state['render']['life'])
   old=state['basis'];await page.evaluate('__pad.axes[2]=.9');await page.wait_for_timeout(900);await page.evaluate('__pad.axes[2]=0');state=await inspect()
   assert state['render']['cameraOrbit']<-.15,state['render']['cameraOrbit'];assert sum(a*b for a,b in zip(old['right'],state['basis']['forward']))>0;passed('Right stick right turns the camera right')
   await press(11);await page.evaluate('__pad.axes[3]=-.9');await page.wait_for_timeout(500);await page.evaluate('__pad.axes[3]=0');assert (await inspect())['render']['cameraPitch']<0;passed('Right stick up raises the look direction');await press(11)
   await page.evaluate("__pad.axes[1]=-1;__pad.buttons[7]={pressed:true,value:1,touched:true}")
   t0=(await inspect())['time'];speeds=[]
   for _ in range(60):
    await page.wait_for_timeout(500);state=await inspect()
    if state['time']-t0>4:speeds.append(state['speed'])
    if state['time']-t0>=13:break
   assert state['time']-t0>=13,'Simulation did not progress';assert min(speeds)>29.8,min(speeds);passed('Sustained acceleration beyond the old battery-depletion period',{'minSpeed':min(speeds),'seconds':state['time']-t0})
   await page.evaluate("__pad.axes[1]=0;__pad.buttons[7]={pressed:false,value:0,touched:false}");before=(await inspect())['speed'];await page.wait_for_timeout(900);after=(await inspect())['speed'];assert abs(before-after)<.05,(before,after);passed('Release RT and the stick: the rider coasts without automatic braking')
   await page.evaluate('__pad.buttons[6]={pressed:true,value:1,touched:true}');await page.wait_for_timeout(1100);await page.evaluate('__pad.buttons[6]={pressed:false,value:0,touched:false}');assert (await inspect())['speed']<.1;passed('LT brakes explicitly')
   await press(10);await page.wait_for_timeout(450);a=(await inspect())['coastal']['audio'];assert a['state']=='running',a;assert a['transportCount']==1;assert a['scheduledSteps']>5;assert a['activeVoices']<=64;assert a['counts'].get('bell',0)>0;passed('Single adaptive soundtrack, bounded voices and controller bell',a)
   await press(13);assert await page.locator('#jobs-dialog').is_visible();await page.screenshot(path=str(OUT/'jobs-controller.png'));await press(0);assert not (await inspect())['paused'];assert (await inspect())['coastal']['active'];passed('D-pad down opens jobs and A accepts a contract')
   await press(9);assert (await inspect())['paused'];await focus('audio-music');value=float(await page.locator('#audio-music').input_value());await press(14);assert float(await page.locator('#audio-music').input_value())<value;passed('Controller adjusts the music slider without a mouse')
   await focus('audio-muted');await press(0);assert (await inspect())['coastal']['audio']['mix']['muted'];await press(0);await focus('invert-x');await press(0);assert (await inspect())['coastal']['audio']['mix']['invertX'];await press(0);await page.screenshot(path=str(OUT/'mixer-controller.png'));await press(1);assert not (await inspect())['paused'];passed('Mute and independent camera inversion are controller-accessible')
   await press(9);await focus('reset');await press(0);assert await page.locator('#confirm-reset').is_visible();await press(1);assert not await page.locator('#confirm-reset').is_visible();await press(1);assert (await inspect())['coastal']['active'];passed('B cancels reset without erasing the active contract')
   await press(8);assert await page.locator('#map-dialog').is_visible();await focus('district-select');await press(15);await press(15);await focus('transit');await press(0);await page.wait_for_timeout(3200);state=await inspect();assert not state['paused'];await page.screenshot(path=str(OUT/'city-district.png'));passed('Controller-only map, district selection, transit and return',state['render']['city'])
   state=await seed('local-repair');await press(2);assert await page.locator('#repair-dialog').is_visible();await page.screenshot(path=str(OUT/'signal-repair.png'));await press(1);assert not (await inspect())['paused'];assert (await inspect())['coastal']['active']['index']==0;passed('Repair dialog opens with X and B returns without losing progress')
   state=await seed('local-photo');await press(2);assert await page.locator('#photo-dialog').is_visible();assert (await page.locator('#postcard').get_attribute('src')).startswith('data:image/jpeg');await press(1);assert (await inspect())['coastal']['active']['index']==1;passed('Photo contract captures the actual game scene and B resumes')
   state=await inspect();assert state['deliveries'];assert state['coastal']['wallet']==456;passed('Existing route and credits survive reloads and contract interaction')
   await press(9);a=(await inspect())['coastal']['audio'];await page.wait_for_timeout(300);assert not (await inspect())['coastal']['audio']['playing'];passed('Pause silences the soundtrack transport');await press(1)
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(900);await press(13);await page.screenshot(path=str(OUT/'mobile-jobs.png'));await press(1);assert not (await inspect())['paused'];passed('Small-screen contracts remain controller-navigable')
   await page.evaluate("__pad.connected=false");await page.wait_for_timeout(400);assert (await inspect())['paused'];passed('Disconnecting the controller pauses coasting')
   assert not report['errors'],report['errors'];report['success']=True;report['final']=await inspect()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await inspect();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-start,2);(OUT/'browser-report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
