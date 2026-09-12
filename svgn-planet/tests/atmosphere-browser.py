"""Real WebGL shader compilation and synthetic Xbox acceptance.
Not a claim of physical-controller testing or target-device frame performance.
"""
import asyncio,json,os,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('ATMOSPHERE_OUTPUT','atmosphere-results'));OUT.mkdir(exist_ok=True)
BASE=os.environ.get('ATMOSPHERE_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox / Atmosphere acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'version':'0.9.0','checks':[],'errors':[],'shaderErrors':[],'physicalHardwareTested':False,'hardwareFPSCertified':False,'base':BASE};start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':960,'height':640});await context.add_init_script(PAD);page=await context.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['shaderErrors'].append(m.text) if m.type=='error' and any(v in m.text for v in ['Shader','WebGL','GL_INVALID','VALIDATE_STATUS']) else None)
  async def wait(expr):await page.wait_for_function(expr,timeout=150000)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  async def press(i):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,touched:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__before')
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,touched:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__before')
  async def focus(id):
   for _ in range(100):
    if await page.evaluate('document.activeElement.id')==id:return
    await press(13)
   raise AssertionError('Unreachable with controller: '+id)
  async def choose(id,value):
   await focus(id)
   for _ in range(10):
    if await page.locator('#'+id).input_value()==value:return
    await press(15)
   raise AssertionError('Cannot select '+value)
  async def scene_capture(name):
   style=await page.add_style_tag(content='dialog[open]{opacity:0!important}dialog::backdrop{background:transparent!important;backdrop-filter:none!important}')
   await page.screenshot(path=str(OUT/(name+'.png')),timeout=150000);await style.evaluate('(el)=>el.remove()')
  def ok(name,data=None):report['checks'].append({'name':name,'passed':True,'data':data});print('PASS',name,flush=True)
  async def boot():
   await wait("(window.SVGNPlanet&&!document.getElementById('start').disabled)||!document.getElementById('failure').hidden")
   assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text()
   await page.bring_to_front();await press(0);await wait('SVGNPlanet.inspect().started');await wait('SVGNPlanet.inspect().homecoming.performance.samples>2');assert not (await state())['failed']
  try:
   await page.goto(BASE+'?quality=balanced',wait_until='domcontentloaded');await boot();s=await state();assert s['version']=='0.9.0';ok('Starts the existing v0.9 game with real WebGL')
   a=s['render']['atmosphere'];assert a['registeredMaterials']['road']>=2 and a['registeredMaterials']['leaf']>=1;assert a['leafShadowMeshes']>5;ok('Wet-road, foliage and matching depth materials are attached',a)
   await press(9);await focus('atmosphere-strength')
   for _ in range(4):await press(15)
   await wait('SVGNPlanet.inspect().render.atmosphere.effective.amount===1')
   for preset in ['day','golden','after-rain','rain','blue-hour']:
    await choose('atmosphere-preset',preset);await wait('SVGNPlanet.inspect().render.atmosphere.prefs.preset==='+json.dumps(preset));await page.wait_for_timeout(150)
    s=await state();assert not s['failed'];a=s['render']['atmosphere'];assert a['extraScenePasses']==0
    await scene_capture(preset);(OUT/(preset+'-state.json')).write_text(json.dumps(s,indent=2));ok('Controller selects and renders '+preset,{'effective':a['effective'],'calls':s['render']['calls'],'textures':s['render']['textures']})
   assert not report['shaderErrors'],report['shaderErrors'];ok('All five profiles compile without WebGL shader errors')
   await page.screenshot(path=str(OUT/'controller-settings.png'));saved=await page.evaluate('localStorage.getItem("svgn.paper-delivery-3d.v1")')
   await choose('atmosphere-preset','rain');await wait('SVGNPlanet.inspect().render.atmosphere.rainInstances===640')
   await focus('atmosphere-rain');await press(0);await wait('SVGNPlanet.inspect().render.atmosphere.rainInstances===0');assert (await state())['render']['atmosphere']['effective']['wet']==1;await press(0);ok('Visible rain can be disabled separately from wet surfaces')
   await focus('quiet-effects');await press(0);await wait('SVGNPlanet.inspect().render.atmosphere.effective.ripples===0');a=(await state())['render']['atmosphere'];assert a['effective']['wind']==0 and a['rainInstances']==0;await press(0);ok('Reduced motion removes moving rain, wind and ripple animation')
   await choose('quality','low');await wait('SVGNPlanet.inspect().render.low');a=(await state())['render']['atmosphere'];assert a['rainInstances']<=160 and a['effective']['ripples']==0;ok('Low quality bounds rain and simplifies shader detail',a)
   await choose('quality','balanced');await wait('!SVGNPlanet.inspect().render.low');await focus('atmosphere-enabled');await press(0);await wait('SVGNPlanet.inspect().render.atmosphere.effective.amount===0');a=(await state())['render']['atmosphere'];assert a['rainInstances']==0 and a['effective']['night']==0;await scene_capture('disabled');await press(0);ok('Shader pack can be switched off without resetting the game')
   assert await page.evaluate('localStorage.getItem("svgn.paper-delivery-3d.v1")')==saved;ok('Visual controls leave the existing gameplay save unchanged while paused')
   # Warm all variants before checking repeat toggles for resource churn.
   for _ in range(2):
    for preset in ['day','rain','blue-hour']:await choose('atmosphere-preset',preset)
   before=(await state())['render']
   for _ in range(3):
    for preset in ['day','rain','blue-hour']:await choose('atmosphere-preset',preset)
   after=(await state())['render'];assert before['textures']==after['textures'];assert before['atmosphere']['depthMaterials']==after['atmosphere']['depthMaterials'];ok('Repeated preset switches do not allocate more textures or depth materials')
   await choose('atmosphere-preset','rain');await press(1);await wait('!SVGNPlanet.inspect().paused');await page.keyboard.press('Enter');await wait('SVGNPlanet.inspect().coastal.audio.rainAmbience>.01');a=(await state())['coastal']['audio'];assert a['transportCount']==1;ok('Rain ambience uses the existing mixer and a single music transport')
   await press(9);await wait('!SVGNPlanet.inspect().coastal.audio.playing');ok('Pause silences the soundtrack and rain ambience')
   await page.reload(wait_until='domcontentloaded');await boot();a=(await state())['render']['atmosphere'];assert a['prefs']['preset']=='rain' and a['prefs']['strength']==1;ok('Atmosphere preferences persist after a normal reload')
   # Exercise polar city surfaces via the existing transit interface, not a new world.
   for index in [1,5,9,13,17,21]:
    await press(8);await wait('document.getElementById("map-dialog").open');options=await page.locator('#district-select option').evaluate_all('(a)=>a.map(o=>o.value)');await page.select_option('#district-select',options[index]);await focus('transit');await press(0);await wait('!SVGNPlanet.inspect().paused');await page.wait_for_timeout(350);assert not (await state())['failed']
   assert not report['shaderErrors'],report['shaderErrors'];ok('Wet-city shaders render after transit to all six sphere faces')
   await page.evaluate('window.__restore=document.getElementById("world").getContext("webgl2").getExtension("WEBGL_lose_context");__restore.loseContext()');await wait('SVGNPlanet.inspect().graphicsLost');await page.wait_for_timeout(250);await press(0);await wait('!SVGNPlanet.inspect().graphicsLost&&!SVGNPlanet.inspect().failed');await wait('SVGNPlanet.inspect().render.atmosphere.rebuilds>0');ok('Context loss and controller recovery retain shader preferences')
   await press(9);await focus('atmosphere-reset');await press(0);await wait('SVGNPlanet.inspect().render.atmosphere.prefs.preset==="day"');ok('Restore sunny defaults works with the controller')
   await page.set_viewport_size({'width':390,'height':844});await focus('atmosphere-preset');await press(15);await page.screenshot(path=str(OUT/'mobile-settings.png'));await press(1);await wait('!SVGNPlanet.inspect().paused');ok('Small-screen shader controls remain navigable and dismissible')
   await page.evaluate('__pad.connected=false');await wait('SVGNPlanet.inspect().paused');ok('Controller disconnect still pauses riding')
   assert not report['errors'],report['errors'];assert not report['shaderErrors'],report['shaderErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'failure.png'),timeout=30000)
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-start,2);(OUT/'atmosphere-browser.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
