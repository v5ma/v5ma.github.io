"""Behavioral acceptance with emulated Xbox input, not physical-device approval."""
import asyncio,json,os,time,traceback
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('HOMECOMING_OUTPUT','homecoming-results'));OUT.mkdir(exist_ok=True)
BASE=os.environ.get('HOMECOMING_BASE','http://127.0.0.1:8765/svgn-planet/')
PAD="""window.__pad={id:'Xbox / Homecoming acceptance',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'version':'0.9.0','checks':[],'errors':[],'physicalHardwareTested':False,'performanceCertification':False,'base':BASE};start=time.time()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':960,'height':640});await context.add_init_script(PAD);page=await context.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  async def wait(expr):await page.wait_for_function(expr,timeout=90000)
  async def state():return await page.evaluate('SVGNPlanet.inspect()')
  async def press(i):
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:true,touched:true,value:1}}',i);await wait('NeighborhoodController.inspect().polls>__before')
   await page.evaluate('(i)=>{window.__before=NeighborhoodController.inspect().polls;__pad.buttons[i]={pressed:false,touched:false,value:0}}',i);await wait('NeighborhoodController.inspect().polls>__before')
  async def focus(id):
   for _ in range(60):
    if await page.evaluate('document.activeElement.id')==id:return
    await press(13)
   raise AssertionError('Could not reach '+id)
  def ok(name,data=None):report['checks'].append({'name':name,'passed':True,'data':data});print('PASS',name,flush=True)
  async def boot():
   await wait("(window.SVGNPlanet&&!document.getElementById('start').disabled)||!document.getElementById('failure').hidden")
   assert await page.locator('#failure').is_hidden(),await page.locator('#failure-message').inner_text();await page.bring_to_front();await press(0);await wait('SVGNPlanet.inspect().started');await wait('SVGNPlanet.inspect().homecoming.performance.samples>2');assert not (await state())['failed']
  async def seed(complete=False):
   await page.evaluate("""async complete=>{const m=await import('./model.mjs?v=0.9.0'),h=await import('./homecoming.mjs?v=0.9.0');const s=m.initial();s.ride=true;s.n=m.street(-8,1.5);s.jobs.wallet=77;s.homecoming.project='workshop';s.homecoming.accepted=complete;if(complete)s.jobs.completed=h.CHAPTER.map(c=>c.job);window.__seed=JSON.stringify(m.saveData(s));localStorage.setItem(m.SAVE_KEY,__seed);} """,complete)
   fixture=await page.evaluate('__seed');token=str(time.time());await page.add_init_script('if(!sessionStorage.getItem('+json.dumps(token)+')){localStorage.setItem("svgn.paper-delivery-3d.v1",'+json.dumps(fixture)+');sessionStorage.setItem('+json.dumps(token)+',"1");}');await page.reload(wait_until='domcontentloaded');await boot()
  try:
   await page.goto(BASE+'?quality=low',wait_until='domcontentloaded');await boot();ok('Controller starts v0.8 without errors')
   await seed();await press(2);await wait("document.getElementById('homecoming-dialog').open");assert 'Maya' in await page.locator('#hc-speaker').inner_text();await page.screenshot(path=str(OUT/'journal.png'));ok('X opens Maya conversation in the actual plaza')
   await focus('hc-project');await press(15);assert (await state())['homecoming']['chapter']['project']=='garden';await focus('hc-follow');await press(0);assert (await state())['coastal']['active']['id']=='local-courier';ok('Project choice and chapter contract acceptance work with Xbox navigation')
   await press(9);await focus('open-homecoming');await press(0);await wait("document.getElementById('homecoming-dialog').open");await press(1);assert not (await state())['paused'];ok('Story journal opens from Menu and B returns')
   await press(9);await focus('open-production');await press(0);await wait("document.querySelectorAll('#production-items article').length>30");await page.screenshot(path=str(OUT/'checklist.png'));await focus('production-filter');await press(15);assert await page.locator('#production-filter').input_value()=='remaining';await press(1);assert not (await state())['paused'];ok('Versioned checklist, filter and controller back action work')
   await press(9);await focus('open-health');await press(0);assert 'frames' in await page.locator('#health-summary').inner_text();await focus('health-copy');await press(0);assert await page.locator('#health-text').is_visible();await page.screenshot(path=str(OUT/'frame-report.png'));await press(1);ok('Frame report and copy fallback work without a mouse')
   await seed(True);s=await state();assert s['homecoming']['chapter']['ready'];assert s['render']['homecoming']['flags']['clean'];assert s['render']['homecoming']['flags']['signals'];assert s['render']['homecoming']['flags']['photos'];ok('Saved completed projects update actual plaza props',s['render']['homecoming'])
   await press(2);await wait("document.getElementById('homecoming-dialog').open");await press(0);assert (await state())['coastal']['wallet']==577;assert (await state())['homecoming']['chapter']['complete'];await press(2);await press(0);assert (await state())['coastal']['wallet']==577;ok('Return-to-Maya finale awards exactly once')
   await page.evaluate('__pad.axes[2]=.9');await wait('SVGNPlanet.inspect().render.cameraOrbit<-2.20');await page.evaluate('__pad.axes[2]=0');await press(9);await page.select_option('#quality','balanced');await page.add_style_tag(content='dialog[open]{opacity:0!important}dialog::backdrop{background:transparent!important;backdrop-filter:none!important}');await page.screenshot(path=str(OUT/'plaza.png'));await page.reload(wait_until='domcontentloaded');await boot();assert (await state())['homecoming']['chapter']['complete'];assert (await state())['coastal']['wallet']==577;ok('Chapter and reward survive normal reload')
   await page.keyboard.press('Enter');await wait("SVGNPlanet.inspect().coastal.audio.state==='running'");await wait('SVGNPlanet.inspect().coastal.audio.scheduledSteps>1');a=(await state())['coastal']['audio'];assert a['transportCount']==1 and a['activeVoices']<=64;ok('Sound transport remains single and bounded',a['state'])
   await page.set_viewport_size({'width':390,'height':844});await press(9);await focus('open-homecoming');await press(0);await page.screenshot(path=str(OUT/'mobile-journal.png'));await press(1);assert not (await state())['paused'];ok('Small-screen journal remains controller-navigable')
   await page.evaluate('__pad.connected=false');await wait('SVGNPlanet.inspect().paused');ok('Controller disconnect pauses the new chapter safely')
   report['final']=await state();assert not report['errors'],report['errors'];report['success']=True
   await page.goto(BASE+'roadmap.html');await wait("document.querySelectorAll('#records article').length>30");await page.screenshot(path=str(OUT/'roadmap-page.png'));report['standaloneChecklist']=True
  except Exception as e:
   report['success']=False;report['error']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:
   report['wallSeconds']=round(time.time()-start,2);(OUT/'homecoming-browser.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
