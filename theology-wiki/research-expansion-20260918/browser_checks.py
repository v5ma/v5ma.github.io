"""Real HTTP checks for the notebook and all three integrated main article routes."""
from pathlib import Path
import argparse, functools, http.server, json, threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--url');parser.add_argument('--report',default='/tmp/identity-agency-browser.json');parser.add_argument('--screenshot',default='/tmp/identity-agency-mobile.png');args=parser.parse_args()
server=None
if args.url:url=args.url
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(HERE.parent.parent)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{server.server_port}/theology-wiki/research-expansion-20260918/index.html'
checks=[];errors=[];report={'url':url,'scope':'Actual HTTP notebook and integrated main article routes. Not an assessment of theological or historical truth.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page(viewport={'width':1280,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='networkidle');assert page.locator('article.record').count()==14;assert page.locator('article.scenario').count()==6;checks.append('Fourteen evidence records and six conditional scenarios render from actual HTML.')
  page.select_option('#kind','Author hypothesis');assert page.locator('article.record:visible').count()==1;checks.append('The record-type filter distinguishes the identity hypothesis.')
  page.fill('#query','nonexistent-source-zz');assert page.locator('#empty').is_visible();checks.append('Combined filters show a useful empty state.')
  page.click('#reset');assert page.locator('article.record:visible').count()==14;checks.append('Reset restores all evidence records without hiding future scenarios.')
  page.goto(url+'#s-energy');page.locator('#s-energy a[href="#f-eia"]').click();assert page.url.endswith('#f-eia');checks.append('Scenario anchors link directly to the corresponding forecast evidence.')
  page.locator('#f-eia summary').click();assert page.locator('#f-eia details').get_attribute('open') is not None;checks.append('Source links expand in the actual evidence card.')
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.evaluate('scrollTo(0,0)');Path(args.screenshot).parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=args.screenshot);checks.append('The notebook fits a 390-pixel viewport; screenshot retained.')
  context=browser.new_context(java_script_enabled=False);plain=context.new_page();plain.goto(url);assert plain.locator('article.record:visible').count()==14;assert plain.locator('article.scenario:visible').count()==6;assert plain.locator('noscript').is_visible();checks.append('All evidence and scenarios remain readable without JavaScript.')
  prefix=url.split('/research-expansion-20260918/')[0]
  targets=[('jesus-teacher-of-righteousness-hypothesis','The Earlier-Founder Jesus-Teacher Identity Hypothesis','An earlier founder and a surviving community'),('divine-will-and-self-authorizing-power','Messiah, divine identity and the discipline of a distinct will','Desire is present, but it is not the final authority'),('ukraine-russia-forecast-record','AI, scarcity and the proposed transition from representation to enforcement','A warning with more than one layer')]
  for slug,new,old in targets:
   page.goto(prefix+'/san-reader.html?page='+slug,wait_until='networkidle');page.wait_for_function('(title)=>document.body.textContent.includes(title)',arg=new);assert old in page.locator('body').inner_text();assert page.locator('a[href*="research-expansion-20260918/index.html"]').count()>0;assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');checks.append('The actual main reader preserves the original body and renders the linked extension at 390px: '+slug)
  import importlib.util
  spec=importlib.util.spec_from_file_location('board_peace_checks',HERE/'board-peace-followup/browser_checks.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
  mod.check_followup(browser,page,url,checks)
  assert not errors,errors;checks.append('The tested notebook and main routes produced no page JavaScript errors.');browser.close()
 report.update(status='passed',check_count=len(checks),checks=checks)
except Exception as e:
 report.update(status='failed',check_count=len(checks),checks=checks,error=type(e).__name__+': '+str(e));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server:server.shutdown()
