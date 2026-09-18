import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/freefield-graphics');OUT.mkdir(parents=True,exist_ok=True);errors=[]
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);p=b.new_page(viewport={'width':512,'height':256});p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 try:
  p.goto(BASE+'/rainward/tests/freefield-graphics.html',wait_until='domcontentloaded');p.wait_for_function('window.portalFixture');r=p.evaluate('portalFixture');p.screenshot(path=str(OUT/'portal-pixels.png'))
  assert r['samples']>1000 and r['visible']>100 and r['mismatches']==0 and r['foregroundLeaks']==0,r
  waist=p.evaluate('runWaist()');p.screenshot(path=str(OUT/'waist-pixels.png'));assert waist['compared']>100 and waist['wrong']==0 and waist['red']>0 and waist['blue']>waist['red'] and waist['originalVisibilityRestored'],waist
  sightline=p.evaluate('runSightline()');p.screenshot(path=str(OUT/'sightline-pixels.png'));assert sightline['before'][2]>200 and sightline['after'][1]>200 and sightline['actorStillPresent'] and sightline['wallStillPresent'],sightline
  assert not errors,errors
  (OUT/'report.json').write_text(json.dumps({'portal':r,'waist':waist,'sightline':sightline,'errors':errors,'passed':3,'scope':'Rendered GPU shader fixtures only; separate actual-game journeys and physical-headset approval required.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors},indent=2));raise
 finally:b.close()
