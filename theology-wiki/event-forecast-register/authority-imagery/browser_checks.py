"""Actual HTTP checks for the published source module; no mocked responses."""
from pathlib import Path
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];PREFIX='/theology-wiki/event-forecast-register/authority-imagery/'
p=argparse.ArgumentParser();p.add_argument('--origin');p.add_argument('--report',default='/tmp/authority-imagery-browser.json');p.add_argument('--screenshots',default='/tmp/authority-imagery-images');args=p.parse_args();server=None
if args.origin:origin=args.origin.rstrip('/')
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
base=origin+PREFIX;checks=[];renders=[];errors=[];report={'origin':origin,'scope':'Actual HTTP source reader, register navigation and preserved principal article. No proof of a theological or political conclusion.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  files=[x['path'] for x in json.loads((HERE/'build-report.json').read_text())['files'] if x['path'].endswith('.html')];assert len(files)==7
  for width in (1280,390):
   page.set_viewport_size({'width':width,'height':844})
   for f in files:
    r=page.goto(base+f,wait_until='networkidle');assert r.status==200;assert page.locator('h1').count()==1;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(f,width);renders.append({'page':f,'width':width,'status':'passed'})
  checks.append('Seven actual pages render at two viewport widths without horizontal overflow.')
  page.goto(base+'index.html');page.fill('#query','prepublication');assert page.locator('.filter-record:visible').count()==1;checks.append('Search reaches text beyond titles and summaries.')
  page.fill('#query','nonexistent-record-xyz');assert page.locator('#empty').is_visible();page.click('#reset');assert page.locator('.filter-record:visible').count()==3;checks.append('Empty results and reset preserve access to all studies.')
  page.goto(base+'timeline.html');page.select_option('#kind','Future administrative deadline');assert page.locator('.filter-record:visible').count()==3;checks.append('Future deadlines remain a distinct record type.')
  page.goto(base+'timeline.html#t-coxon');assert page.locator('#t-coxon').is_visible();page.locator('#t-coxon summary').click();page.locator('#t-coxon a[href="sources.html#cnn-coxon"]').click();assert page.url.endswith('sources.html#cnn-coxon');checks.append('A timeline record resolves to the correct source and access note.')
  plain=browser.new_context(java_script_enabled=False).new_page();plain.goto(base+'ai-policy-chronology.html');assert 'July 23, 2026' in plain.locator('main').inner_text();assert plain.locator('section').count()>=5;checks.append('Complete study text and references remain readable without JavaScript.')
  page.goto(origin+'/theology-wiki/event-forecast-register/index.html',wait_until='networkidle');page.wait_for_function("document.querySelector('#status').textContent.includes('22 dated events')");page.locator('a[href="authority-imagery/index.html"]').click();assert page.url==base+'index.html';checks.append('The preserved event reader loads its real records and links to the new module.')
  page.locator('nav a[href="../../san-reader.html?page=trump-first-beast-of-revelation"]').click();page.wait_for_function("document.body.textContent.includes('Scripture concordance: persons, representations and institutions')");checks.append('The return route resolves to the preserved principal First Beast article.')
  page.goto(base+'comparisons.html');page.focus('#query');page.keyboard.type('unverified');assert page.locator('.filter-record:visible').count()>=1;checks.append('Comparison filtering is keyboard accessible.')
  page.goto(base+'gold-apollo-and-fortresses.html#section-5',wait_until='networkidle');assert 'Aeschylus' in page.locator('#section-5').inner_text();checks.append('The existing article route renders the new ancient-wordplay section.')
  page.goto(base+'sources.html#apollo-mullins',wait_until='networkidle');assert page.locator('main article').count()==43;assert 'caption' in page.locator('#apollo-mullins').inner_text();checks.append('All forty-three source entries include the newly scoped Mullins caption.')
  page.goto(base+'comparisons.html',wait_until='networkidle');page.select_option('#kind','Ancient literary wordplay');assert page.locator('.filter-record:visible').count()==1;checks.append('The new ancient-wordplay comparison is individually filterable.')
  Path(args.screenshots).mkdir(parents=True,exist_ok=True)
  for f,n in [('index.html','mobile-index.png'),('timeline.html','mobile-timeline.png'),('gold-apollo-and-fortresses.html','mobile-gold.png')]:
   page.goto(base+f,wait_until='networkidle');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(Path(args.screenshots)/n))
  checks.append('Three mobile screenshots were retained for separate visual inspection.');assert not errors,errors;checks.append('No tested page raised JavaScript errors.');browser.close()
 report.update(status='passed',checks=checks,check_count=len(checks),renders=renders,render_count=len(renders))
except Exception as exc:report.update(status='failed',checks=checks,check_count=len(checks),renders=renders,error=str(exc));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server:server.shutdown()
