"""Scoped public CSS/readiness/open-close test. No synthetic mission completion."""
from pathlib import Path
import hashlib,json,os,time,urllib.request
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'visibility-evidence';OUT.mkdir(exist_ok=True)
BASE='https://v5ma.github.io/dino-atlas/'
commit=os.getenv('GITHUB_SHA','manual');matched={};reports=[]
for name in ['classic-xr.css','tidegate.css']:
 want=hashlib.sha256((ROOT/'dino-atlas'/name).read_bytes()).hexdigest()
 for attempt in range(30):
  try:
   req=urllib.request.Request(BASE+name+'?visibility='+commit+'&try='+str(attempt),headers={'Cache-Control':'no-cache'})
   actual=hashlib.sha256(urllib.request.urlopen(req,timeout=30).read()).hexdigest()
   if actual==want:matched[name]=actual;break
  except Exception:pass
  time.sleep(15)
 assert name in matched,'Public stylesheet mismatch: '+name
(OUT/'public-css.json').write_text(json.dumps({'source':commit,'files':matched,'allMatched':True},indent=2))
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for scene,route,key in [('classic','index.html','__dinoRanger'),('tidegate','tidegate.html','__tidegate')]:
  page=browser.new_page(viewport={'width':1100,'height':820});errors=[];checks=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def probe():return page.evaluate("()=>{const d=document.getElementById('spatial-console-settings');return {open:d.open,display:getComputedStyle(d).display,rects:d.getClientRects().length}}")
  try:
   page.goto(BASE+route+'?test=1&visibility='+commit,wait_until='domcontentloaded',timeout=90000)
   page.wait_for_function('window.'+key+'?.state.ready',timeout=120000)
   assert probe()=={'open':False,'display':'none','rects':0};checks.append('Closed workspace absent at public game startup')
   page.locator('#start-button').click();page.wait_for_function(key+'.state.started',timeout=30000)
   for _ in range(5):
    if not page.locator('dialog[open]').count():break
    page.keyboard.press('Escape');page.wait_for_timeout(350)
   page.wait_for_function('!'+key+'.state.paused',timeout=30000)
   page.locator('#menu-button').click();page.wait_for_function('document.getElementById("menu-dialog").open')
   page.locator('#spatial-workspace-button').click();page.wait_for_function('document.getElementById("spatial-console-settings").open')
   v=probe();assert v['open'] and v['display']!='none' and v['rects']>0;checks.append('Ordinary menu opens visible usable workspace settings')
   page.locator('#spatial-console-settings').get_by_role('button',name='Resume game',exact=True).click()
   page.wait_for_function('!'+key+'.state.paused',timeout=30000)
   assert probe()=={'open':False,'display':'none','rects':0};checks.append('Resume removes workspace layout and restores play')
   assert not errors,errors;checks.append('No uncaught game errors in scoped public path')
   page.screenshot(path=str(OUT/(scene+'-resumed.png')),timeout=45000)
   reports.append({'scene':scene,'build':page.evaluate(key+'.xr.console.snapshot().build'),'checks':checks,'errors':errors})
  except Exception as e:
   try:page.screenshot(path=str(OUT/(scene+'-failure.png')),timeout=30000)
   except:pass
   (OUT/(scene+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));raise
  finally:page.close()
 browser.close()
(OUT/'report.json').write_text(json.dumps({'source':commit,'publicCss':matched,'scenes':reports,'physicalHardwareVerified':False,'limitations':'Actual public browser startup and screen-mode buttons. Not XR, controller/hand tracking, all mission routes or human acceptance.'},indent=2))
print(json.dumps(reports),flush=True)
