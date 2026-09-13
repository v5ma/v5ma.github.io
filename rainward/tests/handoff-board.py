"""Documentation UI acceptance only; no game-state fixture or gameplay edits."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-handoff');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1120,'height':800});page.set_default_timeout(30000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("window.pad={connected:true,mapping:'standard',index:0,id:'Handoff standard pad',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return[pad];}});")
 def check(ok,label):
  assert ok,label
  checks.append(label)
 def frames(n=2):
  before=page.evaluate('padPolls');page.wait_for_function('([b,n])=>padPolls>=b+n',arg=[before,n])
 def press(i):
  frames();page.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i);frames();page.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames()
 try:
  page.goto(BASE+'/rainward/roadmap.html',wait_until='domcontentloaded');page.wait_for_selector('details.task')
  check(page.locator('details.task').count()==64,'All 64 task rows remain available')
  check(page.locator('#resume-handoff').get_attribute('href')=='./DEVELOPMENT-HANDOFF.md','A direct resume link is visible on the board')
  check(page.locator('#approved-count').inner_text()=='0','No human approval was invented')
  page.locator('#search-filter').fill('living-enemy');check(page.locator('details.task').count()>0,'Continuation notes are searchable')
  page.locator('#search-filter').fill('');page.locator('#task-RW-032').click();check('aquatic browser fixture' in page.locator('#task-RW-032').locator('..').inner_text(),'The water mission test gap is visible in its task row')
  page.locator('#review-RW-032').check();check(page.locator('#approved-count').inner_text()=='0','A local review mark does not promote approval')
  press(9);check(page.evaluate('document.activeElement.id')=='phase-filter','Menu button still focuses the gate selector')
  press(15);check(page.locator('#phase-filter').input_value()=='G0','D-pad adjusts the filter without a native popup')
  page.set_viewport_size({'width':390,'height':844});check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Resume links and task filters fit a phone-width viewport');page.screenshot(path=str(OUT/'roadmap-phone.png'))
  response=page.request.get(BASE+'/rainward/DEVELOPMENT-HANDOFF.md');check(response.status==200 and '531a4a8e' in response.text(),'The handoff document is served by the actual static site')
  check(not errors,'No uncaught documentation UI errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Static documentation board, browser-standard simulated controller, native checkboxes/filters, phone-width layout. No new gameplay or hardware acceptance.'},indent=2))
 except Exception:
  page.screenshot(path=str(OUT/'failure.png'));raise
 finally:browser.close()
