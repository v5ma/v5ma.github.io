"""Read and navigate the complete report and all three principal Wiki pages over real HTTP."""
from pathlib import Path
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--origin');p.add_argument('--report',default='/tmp/hyksos-browser.json');p.add_argument('--screenshots',default='/tmp/hyksos-screenshots');a=p.parse_args();server=None
if a.origin:origin=a.origin.rstrip('/')
else:
 class H(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
url=origin+'/theology-wiki/research-reports/hyksos-avaris-20260922/index.html';checks=[];errors=[];result={'origin':origin}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for width in [1280,390]:
   page.set_viewport_size({'width':width,'height':844});r=page.goto(url,wait_until='networkidle');assert r.status==200;assert page.locator('#report table').count()==9;assert page.locator('.bibliography>li').count()==26;assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');checks.append(f'Complete report, nine tables and 26 source records render without page overflow at {width}px.')
  page.locator('#report a[href="#source-2"]').first.click();assert page.url.endswith('#source-2');assert 'strontium' in page.locator('#source-2').inner_text();checks.append('A restored report citation navigates to the original source record.')
  page.goto(url+'#the-royal-women');assert page.locator('#the-royal-women').is_visible();checks.append('The royal-women section can be linked directly.')
  Path(a.screenshots).mkdir(parents=True,exist_ok=True);page.goto(url);page.screenshot(path=str(Path(a.screenshots)/'report-mobile.png'))
  page.goto(url+'#prosopography-who-actually-fits');page.screenshot(path=str(Path(a.screenshots)/'report-table-mobile.png'))
  for entry in json.loads((HERE/'integration-receipt.json').read_text())['articles']:
   slug=entry['slug'];page.goto(origin+'/theology-wiki/san-reader.html?page='+slug,wait_until='networkidle');link=page.locator('a[href*="research-reports/hyksos-avaris-20260922/index.html"]').first;link.wait_for(state='visible',timeout=20000);link.click();assert '/research-reports/hyksos-avaris-20260922/index.html' in page.url;assert page.locator('#report table').count()==9
   page.locator('nav a[href="../../san-reader.html?page='+slug+'"]').click();page.wait_for_function("document.body.textContent.includes('Hyksos and Avaris: the completed deep-research report')");checks.append('The actual principal article links to the report and the report returns to it: '+slug)
  plain=browser.new_context(java_script_enabled=False).new_page();plain.goto(url);assert plain.locator('#report table').count()==9;assert plain.locator('.bibliography>li').count()==26;checks.append('The complete report, chronology and citations work without JavaScript.')
  assert not errors,errors;checks.append('No page JavaScript errors occurred in the actual navigation sequence.');browser.close()
 result.update(status='passed',checks=checks,check_count=len(checks))
except Exception as exc:result.update(status='failed',checks=checks,check_count=len(checks),error=type(exc).__name__+': '+str(exc));raise
finally:
 Path(a.report).parent.mkdir(parents=True,exist_ok=True);Path(a.report).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
 if server:server.shutdown()
