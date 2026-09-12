"""Production board checks; no game or progress is modified by the board."""
from pathlib import Path
import json,os,hashlib,zipfile,io
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output'/'production';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(x,s):
 assert x,s
 checks.append(s);print('PASS:',s,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':1000},service_workers='block');page=ctx.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/vesperfall/roadmap.html',wait_until='domcontentloaded');page.wait_for_function('window.VesperProduction?.taskCount===76');check(page.locator('[data-task]').count()==76,'The real board renders all 76 canonical task IDs')
  check(page.locator('.milestone').count()==7,'All seven milestones expose explicit exit gates')
  page.locator('#next').click();focus=json.loads((ROOT/'vesperfall/roadmap.json').read_text())['nextRelease']['focus'];check(set(page.locator('[data-task]').evaluate_all('(els)=>els.map(el=>el.dataset.task)'))==set(focus),'Next-slice filter exactly matches the committed priority task IDs')
  page.locator('#clear').click();page.locator('#search').fill('V15');check(page.locator('[data-task="V15"]').is_visible(),'Search exposes the saved-expedition task with its acceptance gate')
  before=page.evaluate('({profile:localStorage.getItem("vesperfall-profile-v1"),save:localStorage.getItem("vesperfall-expedition-v1")})')
  page.locator('#task-V15').select_option('In progress');check(page.locator('#view').input_value()=='local','Editing a task explicitly switches to the local planning view')
  with page.expect_download() as download:page.locator('#export').click()
  target=OUT/'local-board.json';download.value.save_as(target);data=json.loads(target.read_text());t=next(t for t in data['tasks'] if t['id']=='V15');check(data['localPlanningExport'] and t['status']=='In progress' and t['committedStatus']=='Implemented','Export distinguishes local planning status from committed implementation')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.VesperProduction');check(page.locator('#view').input_value()=='committed','A reload defaults to committed evidence, not stale local status')
  check(page.evaluate('VesperProduction.committed.tasks.find(t=>t.id==="V15").status')=='Implemented','Local edits never modify the canonical loaded task data')
  page.locator('#reset').click();check(page.evaluate('({profile:localStorage.getItem("vesperfall-profile-v1"),save:localStorage.getItem("vesperfall-expedition-v1")})')==before,'Editing, exporting and resetting the board do not touch gameplay saves')
  page.locator('#next').click();page.screenshot(path=str(OUT/'production-atlas.png'),full_page=True)
  response=ctx.request.get(BASE+'/vesperfall/AAA-PRODUCTION.xlsx');check(response.ok,'The workbook is served beside the actual game files');raw=response.body();check(hashlib.sha256(raw).hexdigest()==hashlib.sha256((ROOT/'vesperfall/AAA-PRODUCTION.xlsx').read_bytes()).hexdigest(),'The served workbook exactly matches the committed six-sheet artifact');z=zipfile.ZipFile(io.BytesIO(raw));check(len([n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')])==6,'The downloadable workbook contains all six production worksheets')
  page.evaluate('localStorage.setItem("vesperfall-roadmap-v1","null")');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.VesperProduction');check(page.locator('[data-task]').count()==76,'Malformed older local edits cannot break the production board')
  page.evaluate("""()=>{const pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.PlanPad=pad;Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});}""");page.wait_for_function('document.activeElement.id==="play"');page.evaluate('PlanPad.buttons[13]={pressed:true,value:1}');page.wait_for_function('document.activeElement.id==="workbook"');page.evaluate('PlanPad.buttons[13]={pressed:false,value:0}');check(True,'Xbox D-pad navigation reaches the workbook link without a mouse')
  page.set_viewport_size({'width':390,'height':844});check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The production atlas fits a narrow mobile viewport');page.screenshot(path=str(OUT/'production-phone.png'))
  check(not errors,'No uncaught errors in the canonical/local planning workflow')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));raise
 finally:ctx.close();b.close()
