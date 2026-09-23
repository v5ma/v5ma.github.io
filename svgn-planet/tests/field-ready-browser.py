"""Actual main-entry control repairs. Never assigns actor state or saved progress.
Synthetic Xbox is not physical controller acceptance. No XR fixture is required;
the retained eight-mode environment journey runs separately after this script.
"""
import asyncio,json,os,traceback,time
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('MAIN_BASE','http://127.0.0.1:8765/svgn-planet/')
OUT=Path(os.getenv('FIELD_READY_OUT','published-results/field-ready' if BASE.startswith('https:') else 'field-ready-results'))
OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__readyPad={id:'Xbox / Field Ready fixture',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__readyPad]});"""
async def main():
 report={'source':os.getenv('GITHUB_SHA'),'base':BASE,'checks':[],'errors':[],'consoleErrors':[],'physicalDevicesTested':False,'inputOnly':True};start=time.monotonic()
 def checkpoint():(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
 def ok(text):report['checks'].append(text);checkpoint();print('PASS',text,flush=True)
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':640});page.set_default_timeout(120000);await page.add_init_script(PAD)
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def snap():return await page.evaluate('NeighborhoodMissions.inspect()')
  async def wait(q):await page.wait_for_function(q)
  async def frames(n=8):
   f=await page.evaluate('NeighborhoodController.inspect().polls');await page.wait_for_function('(f)=>NeighborhoodController.inspect().polls>=f',arg=f+n)
  async def press(i):
   await page.evaluate('(i)=>__readyPad.buttons[i]={pressed:true,value:1}',i);await frames(4);await page.evaluate('(i)=>__readyPad.buttons[i]={pressed:false,value:0}',i);await frames(8)
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.bring_to_front()
   assert not await page.locator('#play-highline').is_disabled();assert 'Sal' in await page.locator('#highline-next-step').inner_text();beforeCity=await page.evaluate('SVGNPlanet.inspect().n');await page.click('#play-highline');await wait('NeighborhoodMissions.inspect().district==="lantern"&&!NeighborhoodMissions.inspect().paused');await frames()
   saved=json.loads(await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")'));assert saved['campaign']['active']=='highline' and saved['campaign']['progress']['highline']==0
   ok('Explicit Highline entry saves its selected mission immediately without granting progress')
   await wait('document.querySelector("#objective-text").textContent.includes("Via ")');assert 'Map shows your selected objective' not in await page.locator('#objective-text').inner_text();assert 'L3 run' in await page.locator('#context').inner_text();assert 'Lantern Ward' in await page.locator('#save-status').inner_text()
   ok('Desktop HUD shows the supported way-in cue, current control mapping and the correct save ledger')
   await page.click('#atlas');assert await page.locator('#ward-map-dialog').evaluate('(d)=>d.open');assert not await page.locator('#map-dialog').evaluate('(d)=>d.open');await page.click('#ward-map-back');await page.click('#ward-resume');await frames()
   ok('Header Map opens the selected ward mission map, not the original planet map')
   await press(8);assert await page.locator('#ward-map-dialog').evaluate('(d)=>d.open');await press(1);await press(1);await wait('!NeighborhoodMissions.inspect().paused');await frames()
   ok('Xbox View opens the same map and B returns through Missions to play')
   await page.click('#help');assert await page.locator('#ward-menu').evaluate('(d)=>d.open');assert not await page.locator('#help-dialog').evaluate('(d)=>d.open');await page.click('#ward-resume');await frames()
   startWard=(await snap())['ward'];await page.mouse.move(500,315);await page.mouse.down();await page.mouse.move(680,315,steps=12);await page.mouse.up();await page.keyboard.down('KeyW');await frames(26);await page.keyboard.up('KeyW');await frames(30);after=(await snap())['ward'];assert after['x']-startWard['x']>.18,(startWard,after)
   assert beforeCity==await page.evaluate('SVGNPlanet.inspect().n');await page.click('#view');await frames(10);at=(await snap())['ward'];await page.keyboard.down('KeyW');await frames(24);await page.keyboard.up('KeyW');await frames(30);end=(await snap())['ward'];assert abs(end['x']-at['x'])<.12 and end['z']<at['z']-.18,(at,end)
   ok('Dragging rotates ward movement; Recenter restores forward travel without moving the original city')
   assert end['campaign']['progress']['highline']==0 and end['campaign']['credits']==0
   await page.click('#pause');await page.click('#ward-save');saved=json.loads(await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")'));await page.reload(wait_until='domcontentloaded');await wait('window.NeighborhoodMissions&&!document.querySelector("#start").disabled');await page.click('#play-highline');await wait('NeighborhoodMissions.inspect().district==="lantern"&&!NeighborhoodMissions.inspect().paused');await frames()
   restored=(await snap())['ward'];assert abs(restored['x']-saved['x'])<.01 and abs(restored['z']-saved['z'])<.01;assert restored['campaign']==saved['campaign'];ok('Reload and the same launch button restore the actual saved position and selected task')
   await page.screenshot(path=str(OUT/'field-ready-desktop.png'))
   a=await page.locator('#objective').bounding_box();b=await page.locator('#context').bounding_box();assert a['y']+a['height']<=b['y'],(a,b)
   await page.set_viewport_size({'width':390,'height':844});await frames(12);await page.screenshot(path=str(OUT/'field-ready-phone.png'));a=await page.locator('#objective').bounding_box();b=await page.locator('#context').bounding_box();assert a['x']>=0 and a['x']+a['width']<=391;assert a['y']+a['height']<=b['y'],(a,b);ok('Objective and control hints occupy separate readable areas on desktop and narrow screens')
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await snap()
  except Exception as e:
   report.update(success=False,failure=str(e),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await snap();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:report['wallSeconds']=round(time.monotonic()-start,2);checkpoint();await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
