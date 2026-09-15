"""Real WebGL and synthetic Xbox; input-driven pool tour and a canal shore save fixture."""
import asyncio,json,os,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('TIDEWATER_OUTPUT','tidewater-results'));OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TIDEWATER_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox / water acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'version':'0.11.0','checks':[],'errors':[],'shaderErrors':[],'physicalControllerTested':False,'hardwareFPSCertified':False};started=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':960,'height':640});await context.add_init_script(PAD);page=await context.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['shaderErrors'].append(m.text) if m.type=='error' and any(w in m.text for w in ['Shader Error','VALIDATE_STATUS','gl.getProgramInfoLog','ERROR: 0:']) else None)
  async def wait(expr):await page.wait_for_function(expr,timeout=90000)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  async def neutral():
   await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons.forEach(b=>{b.pressed=false;b.value=0});window.__before=NeighborhoodController.inspect().polls');await wait('NeighborhoodController.inspect().polls>__before')
  async def press(i):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,value:1,touched:true}}',i);await wait('NeighborhoodController.inspect().polls>__before')
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,value:0,touched:false}}',i);await wait('NeighborhoodController.inspect().polls>__before')
  async def focus(id):
   for _ in range(80):
    if await page.evaluate('document.activeElement?.id')==id:return
    await press(13)
   raise AssertionError('Cannot focus '+id)
  def ok(name,data=None):report['checks'].append({'name':name,'passed':True,'data':data});print('PASS',name,flush=True)
  async def boot():
   await wait("window.SVGNPlanet&&(!document.querySelector('#start').disabled||!document.querySelector('#failure').hidden)")
   assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text();await page.bring_to_front()
  async def screenshot(name,world=False):
   style=None
   if world:
    if not (await state())['paused']:await neutral();await press(9)
    style=await page.add_style_tag(content='dialog[open]{opacity:0!important}dialog::backdrop{background:transparent!important;backdrop-filter:none!important}')
   await page.screenshot(path=str(OUT/name),timeout=90000)
   if style:await style.evaluate('(el)=>el.remove()');await press(1)
  async def pilot(t,x):
   # Writes only emulated controller state, never the game's private simulation.
   for i in range(850):
    r=await page.evaluate("""([t,x])=>{const s=SVGNPlanet.inspect(),a=t/880,b=x/880,n=[Math.sin(b),Math.cos(b)*Math.cos(a),-Math.cos(b)*Math.sin(a)];const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),d=Math.acos(Math.max(-1,Math.min(1,dot(s.n,n))))*880;const v=n.map((a,i)=>a-s.n[i]),L=Math.hypot(...v),dir=v.map(a=>a/(L||1));const brake=d<2.15;__pad.axes[0]=brake?0:dot(dir,s.basis.right);__pad.axes[1]=brake?0:-dot(dir,s.basis.forward);__pad.buttons[6]={pressed:brake,value:brake?1:0};__pad.buttons[7]={pressed:false,value:0};return {d,speed:s.speed,paused:s.paused,failed:s.failed,boat:s.tidewater.boat,steps:s.steps};}""",[t,x])
    if r['failed']:raise AssertionError('Renderer failed while navigating')
    if r['paused']:await neutral();return
    if r['d']<2.3 and r['speed']<.10:await neutral();return
    # Wait for real simulation progress, not repeated reads of one slow WebGL frame.
    # This changes only the test driver: no teleport, speed or simulation writes.
    await page.wait_for_function("(steps)=>SVGNPlanet.inspect().steps>=steps+6||SVGNPlanet.inspect().paused||SVGNPlanet.inspect().failed",arg=r['steps'],timeout=90000)
   raise AssertionError('Controller could not reach '+str((t,x))+': '+str(r))
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await boot();await focus('start-water');await press(0);await wait("document.querySelector('#water-dialog').open");ok('Title-screen water button starts the real game and visits Tidewater')
   await screenshot('water-missions.png');await press(0);await wait("!SVGNPlanet.inspect().paused&&SVGNPlanet.inspect().tidewater.active?.id==='pool-opening'")
   s=await state();assert s['version']=='0.11.0';assert s['render']['tidewater']['basins']==2;ok('Two water basins render and the first excursion is playable',s['render']['tidewater'])
   await press(3);assert not (await state())['ride'];await pilot(-48,65);await press(2);assert (await state())['tidewater']['active']['index']==1;ok('Walk to the service kit and collect it using normal controller input')
   await pilot(-48,39);await pilot(-57,41);await press(2);assert (await state())['tidewater']['active']['index']==2
   await pilot(-69,41);await press(2);assert (await state())['tidewater']['active']['index']==3;ok('West-side skimming locations are physically reachable around the water collision')
   await pilot(-79,40);await pilot(-79,62);await pilot(-64,61);await press(2);assert (await state())['tidewater']['active']['index']==4;ok('East-side leaves require a real route around the pool')
   await pilot(-79,62);await pilot(-79,56);await press(2);await wait("document.querySelector('#water-pump-dialog').open")
   await press(1);assert not (await state())['paused'];await press(2);await wait("document.querySelector('#water-pump-dialog').open")
   for i in range(3):
    await focus('water-valve-'+str(i))
    for _ in range(i+1):await press(15)
   assert (await state())['tidewater']['valves']==[1,2,3];await screenshot('filter-valves.png');await focus('water-pump-test');await press(0);await wait('!SVGNPlanet.inspect().paused');assert (await state())['tidewater']['poolClean'];ok('Controller-only valve puzzle, cancel/resume and clear-water state')
   await page.evaluate('__pad.axes[2]=.85');await wait('SVGNPlanet.inspect().render.cameraOrbit<-2.9');await neutral();await press(9);await page.select_option('#quality','balanced');await screenshot('seaglass-pool.png',world=True);await press(11)
   await pilot(-79,64);await pilot(-48,65);await press(2);await wait("document.querySelector('#water-results-dialog').open");await screenshot('water-results.png');s=await state();assert 'pool-opening' in s['tidewater']['completed'] and s['coastal']['wallet']==360;await press(1);ok('Entire pool mission completed by controller traversal with a saved 360-credit reward')
   await page.reload(wait_until='domcontentloaded');await boot();await press(0);await wait('SVGNPlanet.inspect().started');assert (await state())['tidewater']['poolClean'];assert (await state())['coastal']['wallet']==360;ok('Pool state and reward survive normal reload')
   # Explicit fixture at the shore start, not an assertion of a full-city tour.
   await page.evaluate("""async()=>{const m=await import('./model.mjs?v=0.11.0'),w=await import('./tidewater-core.mjs?v=0.11.0');const s=m.initial(m.readSave(localStorage.getItem(m.SAVE_KEY)));w.startWaterJob(s,'canal-courier');s.n=m.street(-91,46);s.ride=false;window.__fixture=JSON.stringify(m.saveData(s));}""")
   fixture=await page.evaluate('__fixture');await page.add_init_script('if(!sessionStorage.getItem("tidewater-canal-fixture")){localStorage.setItem("svgn.paper-delivery-3d.v1",'+json.dumps(fixture)+');sessionStorage.setItem("tidewater-canal-fixture","1");}')
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await boot();await press(0);await wait('SVGNPlanet.inspect().started');await press(2);assert (await state())['tidewater']['active']['index']==1;await pilot(-97,49);await press(3);assert (await state())['tidewater']['boat'];assert (await state())['tidewater']['active']['index']==2;ok('Canal shore fixture: collect parcel and board using Y at the real pier')
   await pilot(-114,69);assert (await state())['tidewater']['active']['index']==3;await pilot(-125,100);await press(2);assert (await state())['tidewater']['active']['index']==4;ok('Skiff traverses open water, passes its buoy and recovers the floating dispatch')
   await press(9);await page.select_option('#quality','balanced');await screenshot('lantern-canal.png',world=True);await press(9);await page.select_option('#quality','low');await press(1)
   await pilot(-103,102);await pilot(-102,55);await press(3);assert not (await state())['tidewater']['boat'];assert (await state())['tidewater']['active']['index']==6;await pilot(-91,46);await press(2);await wait("document.querySelector('#water-results-dialog').open");assert (await state())['coastal']['wallet']==880;await press(1);ok('Return buoy, physical docking and final shore handoff award 520 credits once')
   await press(9);await focus('open-water');await press(0);await focus('water-job-select');await press(15);await press(15);assert await page.locator('#water-job-select').input_value()=='boardwalk-relay';await focus('water-start-job');await press(0);await wait('!SVGNPlanet.inspect().paused');await pilot(-82,25);assert (await state())['tidewater']['active']['index']>=2;ok('Boardwalk relay starts, is rideable and detects swept checkpoints')
   await press(9);await page.select_option('#quality','balanced');await page.select_option('#atmosphere-preset','after-rain');await screenshot('water-after-rain.png',world=True)
   await press(9);await page.select_option('#atmosphere-preset','blue-hour');await screenshot('water-blue-hour.png',world=True);ok('New water shaders remain compatible with rainy sunset and blue-hour lighting')
   await press(9);await focus('quiet-effects');await press(0);assert (await state())['render']['jewel']['quiet'];await press(1);ok('Reduced motion remains controller accessible')
   await page.keyboard.press('Enter');await wait("SVGNPlanet.inspect().coastal.audio.state==='running'");a=(await state())['coastal']['audio'];assert a['transportCount']==1 and a['activeVoices']<=64;ok('Water audio shares the existing bounded soundtrack and mixer')
   await page.evaluate("window.__loss=document.querySelector('#world').getContext('webgl2').getExtension('WEBGL_lose_context');__loss.loseContext()");await wait('SVGNPlanet.inspect().graphicsLost');await page.wait_for_timeout(300);await page.evaluate('__loss.restoreContext()');await wait('!SVGNPlanet.inspect().graphicsLost');assert not (await state())['failed'];ok('Graphics loss recovers while retaining water progress')
   await page.set_viewport_size({'width':390,'height':844});await press(9);await focus('open-water');await press(0);await screenshot('water-mobile.png');await press(1);await wait('!SVGNPlanet.inspect().paused');ok('Water mission UI is readable and dismissible at phone width')
   await page.evaluate('__pad.connected=false');await wait('SVGNPlanet.inspect().paused');ok('Controller disconnect pauses waterfront movement safely')
   s=await state();assert not report['errors'],report['errors'];assert not report['shaderErrors'],report['shaderErrors'];report['success']=True;report['final']=s
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'water-failure.png'))
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-started,2);(OUT/'tidewater-browser.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
