"""Native HTTP checks for the source concordance. No simulated data on the normal path."""
import argparse, functools, http.server, json, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--report',default='/tmp/concordance-browser.json');p.add_argument('--screenshot',default='/tmp/concordance-mobile.png');args=p.parse_args()
server=None
if args.url:url=args.url
else:
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(HERE.parent.parent)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    url=f'http://127.0.0.1:{server.server_port}/theology-wiki/scripture-concordance/index.html'
checks=[];errors=[];report={'url':url,'scope':'Actual concordance HTTP page, plus integrated main article when served from this repository. No evaluation of theological validity.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page(viewport={'width':1280,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='networkidle');assert page.locator('article.passage').count()==148;assert page.locator('article.dossier').count()==13;checks.append('All 148 static passage rows and 13 documentary dossiers load over HTTP.')
  page.select_option('#corpus','Wider corpus');assert page.locator('article.passage:visible').count()==20;checks.append('Wider-corpus filter displays the twenty independently numbered sections.')
  page.select_option('#book','Didache');assert page.locator('article.passage:visible').count()==6;checks.append('Work and corpus filters compose.')
  page.fill('#query','not-a-real-passage-zz');assert page.locator('#empty').is_visible();checks.append('Empty results are explicit.')
  page.click('#reset');assert page.locator('article.passage:visible').count()==148;checks.append('Reset restores every passage.')
  page.goto(url+'#rev-13-03');assert page.locator('#rev-13-03').is_visible();page.locator('#rev-13-03 a[href="#d-butler"]').click();assert page.url.endswith('#d-butler');checks.append('Passage and documentary-dossier anchors resolve.')
  page.locator('#rev-13-03 summary').click();assert page.locator('#rev-13-03 details').get_attribute('open') is not None;checks.append('Source and comparison limits expand.')
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');page.evaluate('scrollTo(0,0)');Path(args.screenshot).parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=args.screenshot);checks.append('Mobile layout has no horizontal overflow; screenshot retained.')
  context=browser.new_context(java_script_enabled=False);fallback=context.new_page();fallback.goto(url);assert fallback.locator('article.passage:visible').count()==148;assert fallback.locator('noscript').is_visible();checks.append('All records remain readable with JavaScript disabled.')
  main=url.split('/scripture-concordance/')[0]+'/san-reader.html?page=trump-first-beast-of-revelation';page.goto(main,wait_until='networkidle');page.wait_for_function("document.body.textContent.includes('Scripture concordance: persons, representations and institutions')");assert page.locator('a[href*="scripture-concordance/index.html"]').count()>0;checks.append('The actual main First Beast route renders the integrated supplement and concordance link.')
  page.goto(main.replace('trump-first-beast-of-revelation','antichrist-as-a-pattern-of-conduct'),wait_until='networkidle');page.wait_for_function("document.body.textContent.includes('Recurring types and a proposed final instance')");checks.append('The main conduct route renders the typology and historical-context supplement.')
  assert not errors,errors;checks.append('No JavaScript page errors occurred.');browser.close()
 report.update(status='passed',checks=checks,check_count=len(checks))
except Exception as e:report.update(status='failed',checks=checks,check_count=len(checks),error=str(e));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server:server.shutdown()
