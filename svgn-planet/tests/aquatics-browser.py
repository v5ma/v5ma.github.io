"""End-to-end water missions driven with synthetic Xbox controls, no position
teleports or direct gameplay mutations. Context loss uses the browser extension.
This is not physical-controller/GPU certification or a measured AAA claim."""
import asyncio,json,os,time,traceback,math
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('TIDEGLASS_OUTPUT','tideglass-results'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TIDEGLASS_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox / Tideglass acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'version':'0.10.0','checks':[],'errors':[],'shaderErrors':[],'physicalControllerTested':False,'hardwareFPSCertified':False,'missionPositionTeleports':0};start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  ctx=await browser.new_context(viewport={'width':1100,'height':740});await ctx.add_init_script(PAD);page=await ctx.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['shaderErrors'].append(m.text) if m.type=='error' and any(t in m.text for t in ['Shader','shader','WebGL','GL_INVALID','THREE']) else None)
  async def wait(expr):await page.wait_for_function(expr,timeout=90000)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  async def press(i):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,touched:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__before')
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,touched:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__before')
  async def focus(id):
   for _ in range(100):
    if await page.evaluate('document.activeElement.id')==id:return
    await press(13)
   raise AssertionError('Cannot reach '+id+' from '+str(await page.evaluate('document.activeElement.id')))
  async def neutral():await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons.forEach(b=>{b.value=0;b.pressed=false;b.touched=false})')
  async def drive(target,tolerance=.65):
   deadline=time.time()+120
   while time.time()<deadline:
    s=await state();assert not s['failed'],s['diagnostics'];q=s['aquatics']
    if s['paused']:break
    x,y,z=q['position'];dx,dy,dz=target[0]-x,target[1]-y,target[2]-z
    if math.sqrt(dx*dx+dy*dy+dz*dz)<tolerance:break
    yaw=q['yaw'];dist=math.hypot(dx,dz);scale=min(1,dist/1.1)
    ax=(math.cos(yaw)*dx+math.sin(yaw)*dz)/max(.001,dist)*scale
    forward=(math.sin(yaw)*dx-math.cos(yaw)*dz)/max(.001,dist)*scale
    await page.evaluate('([x,z,up,down,fast])=>{__pad.axes[0]=x;__pad.axes[1]=-z;for(const [i,v]of [[0,up],[1,down],[7,fast]])__pad.buttons[i]={pressed:v,touched:v,value:v?1:0}}',[ax,forward,dy>.23 and q['swimming'],dy<-.23 and q['swimming'],dist>3])
    await page.wait_for_timeout(100)
   else:raise AssertionError('Controller swim timed out: '+str(target)+' / '+str((await state())['aquatics']))
   await neutral();await page.wait_for_timeout(100)
  async def choose(id):
   await press(8);await wait("document.getElementById('pool-board').open");await focus('pool-mission')
   for _ in range(4):
    if await page.locator('#pool-mission').input_value()==id:break
    await press(15)
   await focus('pool-start');await press(0);await wait('!SVGNPlanet.inspect().paused')
  async def capture(name):
   active=not (await state())['paused'];style=None
   if active:
    await press(9);style=await page.add_style_tag(content='dialog[open]{opacity:0!important}dialog::backdrop{background:transparent!important;backdrop-filter:none!important}')
   await page.screenshot(path=str(OUT/name),timeout=90000)
   if style:await style.evaluate('el=>el.remove()')
   if active:await press(1)
  def ok(name,data=None):report['checks'].append({'name':name,'passed':True,'data':data});print('PASS',name,flush=True)
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await wait("window.SVGNPlanet&&(!document.getElementById('start').disabled||!document.getElementById('failure').hidden)");assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text();await page.bring_to_front();await press(0);await wait('SVGNPlanet.inspect().started');assert (await state())['version']=='0.10.0';ok('Existing neighborhood boots and starts by controller')
   await press(13);await wait("document.getElementById('jobs-dialog').open");await press(0);await wait('!!SVGNPlanet.inspect().coastal.active')
   await press(9);await focus('visit-pool');await press(0);await wait('SVGNPlanet.inspect().aquatics.inside&&SVGNPlanet.inspect().render.aquatics.active');await wait('SVGNPlanet.inspect().aquatics.clock>.1');s=await state();assert s['render']['aquatics']['renderTargets']==0;city=s['coastal']['active'];ok('Controller transit enters a real pool room; Low uses zero extra water passes')
   await capture('tideglass-low.png')
   await choose('glass-circuit');await capture('tideglass-circuit.png')
   for i in range(7):
    s=await state();assert s['aquatics']['active']['index']==i
    await drive(s['aquatics']['target']['p']);await page.wait_for_timeout(200)
   await wait("document.getElementById('pool-result').open");s=await state();assert s['aquatics']['records']['glass-circuit']['count']==1;assert s['coastal']['wallet']==300;await page.screenshot(path=str(OUT/'tideglass-results.png'));ok('All seven surface and submerged rings completed using real swim controls',s['aquatics']['last']);await press(1)
   await choose('lost-and-found')
   for i in range(4):
    await drive((await state())['aquatics']['target']['p']);await press(2)
   s=await state();assert s['aquatics']['active']['index']==4;assert s['coastal']['wallet']==300;ok('Four submerged keepsakes need a handoff before any reward')
   await press(3);await wait('!SVGNPlanet.inspect().aquatics.swimming');await drive([9.8,.35,13]);await press(2);await wait("document.getElementById('pool-result').open");assert (await state())['coastal']['wallet']==660;ok('Y deck recovery and locker delivery finish salvage without losing finds');await press(1)
   await choose('clear-current')
   for i,setting in enumerate([2,3,1]):
    await drive((await state())['aquatics']['target']['p']);await press(2);await wait("document.getElementById('pool-valve').open")
    if i==0:
     await press(0);assert (await state())['aquatics']['active']['index']==0;assert await page.locator('#pool-valve').is_visible();ok('Incorrect valve settings do not award progress')
    await focus('pool-dial')
    for _ in range(setting):await press(15)
    await focus('pool-valve-apply');await page.screenshot(path=str(OUT/('tideglass-valve.png' if i==0 else 'tideglass-valve-last.png')));await press(0)
   await wait("document.getElementById('pool-result').open");s=await state();assert s['coastal']['wallet']==1040;assert len(s['aquatics']['records'])==3;assert s['coastal']['active']==city;ok('Three submerged valves completed through controller-operated dials; city job untouched');await press(1)
   await page.keyboard.press('Enter');await wait("SVGNPlanet.inspect().coastal.audio.state==='running'");await wait('SVGNPlanet.inspect().coastal.audio.poolAmbience>.01');a=(await state())['coastal']['audio'];assert a['transportCount']==1;assert a['activeVoices']<=64;ok('Water ambience and cues share the original bounded soundtrack transport')
   await press(3);await press(9);await focus('quality')
   for _ in range(6):
    if await page.locator('#quality').input_value()=='balanced':break
    await press(15)
   assert await page.locator('#quality').input_value()=='balanced'
   await press(1);await wait('SVGNPlanet.inspect().render.aquatics.renderTargets===2');await capture('tideglass-reflections.png');r=(await state())['render']['aquatics'];assert r['reflectionSize']==[384,384];assert r['refractionSize'][0]<=768 and r['refractionSize'][1]<=512;ok('Advanced mode compiles and renders bounded local reflection/refraction captures',r)
   await drive([0,-2.8,-5]);await press(5);await wait('SVGNPlanet.inspect().render.aquatics.underwater');await capture('tideglass-underwater.png');await wait('SVGNPlanet.inspect().coastal.audio.underwaterCutoff<3500');ok('Dive, first-person underwater view, depth fog and muffled audio work')
   before=(await state())['render']['textures'];await page.wait_for_timeout(800);after=(await state())['render']['textures'];assert after<=before+1;ok('Steady pool frames do not grow texture allocation',{'before':before,'after':after})
   await press(9);await focus('quiet-effects');await press(0);await wait('SVGNPlanet.inspect().render.aquatics.shaderTime===0');await press(1);await capture('tideglass-reduced-motion.png');ok('Reduce motion freezes procedural water and tile caustics')
   await press(9);await focus('simple-pool-water');await press(0);await press(1);await wait('SVGNPlanet.inspect().render.aquatics.renderTargets===0');ok('Lightweight water releases both render targets')
   await press(3);await press(9);await focus('pause-pool-exit');await press(0);await wait('!SVGNPlanet.inspect().aquatics.inside');assert (await state())['render']['aquatics']['renderTargets']==0;assert (await state())['coastal']['wallet']==1040;ok('Exit returns to the same city save and releases the water captures')
   await press(2);await wait('SVGNPlanet.inspect().aquatics.inside');ok('The visible city doorway re-enters the pool with X')
   await page.reload(wait_until='domcontentloaded');await wait("window.SVGNPlanet&&!document.getElementById('start').disabled");await press(0);s=await state();assert not s['aquatics']['inside'];assert len(s['aquatics']['records'])==3;assert s['coastal']['wallet']==1040;ok('Reload preserves all completed water missions and spawns safely outside')
   await press(2);await wait('SVGNPlanet.inspect().aquatics.inside');await press(8);await wait("document.getElementById('pool-board').open");await page.set_viewport_size({'width':390,'height':844});await page.screenshot(path=str(OUT/'tideglass-mobile.png'));await press(1);assert not (await state())['paused'];ok('Small-screen water missions remain controller-navigable')
   await page.evaluate("window.__gl=document.getElementById('world').getContext('webgl2').getExtension('WEBGL_lose_context');__gl.loseContext()");await wait('SVGNPlanet.inspect().graphicsLost');await page.wait_for_timeout(300);await page.evaluate('__gl.restoreContext()');await wait('!SVGNPlanet.inspect().graphicsLost&&!SVGNPlanet.inspect().failed');await wait('SVGNPlanet.inspect().render.aquatics.active');assert (await state())['coastal']['wallet']==1040;ok('Graphics context recovery retains the pool and earned records')
   await page.evaluate('__pad.connected=false');await wait('SVGNPlanet.inspect().paused');ok('Controller disconnect pauses swimming instead of leaving held input active')
   assert not report['errors'],report['errors'];assert not report['shaderErrors'],report['shaderErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'tideglass-failure.png'))
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-start,2);(OUT/'tideglass-browser.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
