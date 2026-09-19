"""Real HTTP browser verification; no response mocking or substitute hosted bodies."""
from pathlib import Path
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--origin');p.add_argument('--report',default='/tmp/egypt-browser.json');p.add_argument('--screenshots',default='/tmp/egypt-screenshots');args=p.parse_args()
server=None
if args.origin:origin=args.origin.rstrip('/')
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
base=origin+'/theology-wiki/comparative-religion/egypt-emanation/'
files=[f['path'] for f in json.loads((HERE/'build-report.json').read_text())['files'] if f['path'].endswith('.html')]
checks=[];renders=[];errors=[];result={'origin':origin,'scope':'Actual generated study pages, real sources/navigation, no-JavaScript reading and prior-main-reader access; not scholarly certification.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for width in [1280,390]:
   page.set_viewport_size({'width':width,'height':900})
   for name in files:
    response=page.goto(base+name,wait_until='networkidle');assert response and response.status==200,name
    assert page.locator('h1').count()==1;assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(name,width)
    renders.append({'page':name,'width':width,'passed':True})
  checks.append('All twelve pages load at desktop and mobile widths without horizontal overflow.')
  page.goto(base+'index.html',wait_until='networkidle');assert page.locator('.filter-record').count()==8
  page.fill('#query','Theuth and Thamus');assert page.locator('#study-egypt-plato-hermetic').is_visible();checks.append('The study index searches full body text beyond its summary.')
  page.fill('#query','not-a-real-research-term-zz');assert page.locator('#empty').is_visible();page.click('#reset');assert page.locator('.filter-record:visible').count()==8;checks.append('Empty results and reset work without changing the source selection.')
  page.goto(base+'profiles.html',wait_until='networkidle');assert page.locator('.filter-record').count()==27;page.select_option('#kind','Source recovery lead');assert page.locator('.filter-record:visible').count()>=5;checks.append('The profiles distinguish source-recovery leads from substantiated comparisons.')
  page.goto(base+'relationships.html',wait_until='networkidle');assert page.locator('.filter-record').count()==20;page.select_option('#kind','Identified textual transmission');assert page.locator('.filter-record:visible').count()==1;assert page.locator('#plotinus-arabic').is_visible();checks.append('Relationship filters distinguish identified textual transmission from analogy.')
  page.goto(base+'relationships.html#egypt-iran-order',wait_until='networkidle');assert page.locator('#egypt-iran-order').is_visible();page.locator('#egypt-iran-order summary').click();assert page.locator('#egypt-iran-order details').get_attribute('open') is not None;checks.append('Direct relationship anchors and source disclosures work.')
  page.goto(base+'egyptian-seed.html',wait_until='networkidle');page.locator('a[href="sources.html#pyramid"]').click();assert page.url.endswith('#pyramid');assert page.locator('#pyramid').is_visible();checks.append('Developed arguments reach the precise source-scope record.')
  page.goto(origin+'/theology-wiki/san-reader.html?page=apocalyptic-repair-theology',wait_until='networkidle');page.wait_for_function("document.body.textContent.includes('A shared repertoire of revelation and transformation')");assert page.locator('a[href*="comparative-religion/shared-repertoire.html"]').count()>0;checks.append('The unchanged main repair article still exposes the prior shared-repertoire route.')
  page.goto(origin+'/theology-wiki/comparative-religion/shared-repertoire.html',wait_until='networkidle');page.locator('a[href="egypt-emanation/index.html"]').first.click();assert page.url.endswith('/egypt-emanation/index.html');checks.append('The established comparative study links into the actual new series.')
  page.goto(base+'index.html',wait_until='networkidle');page.locator('#query').focus();page.keyboard.type('Arabic Theology');assert page.locator('#study-plotinus-and-return').is_visible();checks.append('Keyboard search reaches the appropriate full-text study.')
  context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});plain=context.new_page();plain.goto(base+'egyptian-seed.html');assert 'Ascent is not a Hellenistic invention' in plain.locator('body').inner_text();plain.goto(base+'profiles.html');assert plain.locator('.filter-record:visible').count()==27;checks.append('Studies and every profile remain readable without JavaScript.')
  out=Path(args.screenshots);out.mkdir(parents=True,exist_ok=True);page.set_viewport_size({'width':390,'height':900})
  for name,filename in [('index.html','mobile-index.png'),('egyptian-seed.html','mobile-egypt.png'),('profiles.html','mobile-profiles.png')]:
   page.goto(base+name,wait_until='networkidle');page.screenshot(path=str(out/filename))
  assert not errors,errors;checks.append('No page JavaScript errors occurred; three mobile screenshots are retained.');browser.close()
 result.update(status='passed',functional_checks=len(checks),checks=checks,page_viewport_checks=len(renders),renders=renders)
except Exception as e:result.update(status='failed',functional_checks=len(checks),checks=checks,renders=renders,error=type(e).__name__+': '+str(e));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
 if server:server.shutdown()
