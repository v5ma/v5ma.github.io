"""Actual HTTP reader checks, with no response mocks on any tested route."""
from pathlib import Path
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
PREFIX='/theology-wiki/comparative-religion/egypt-emanation/moses-jesus-mammon/'
p=argparse.ArgumentParser();p.add_argument('--origin');p.add_argument('--report',default='/tmp/moses-mammon-browser.json');p.add_argument('--screenshots',default='/tmp/moses-mammon-images');args=p.parse_args()
server=None
if args.origin:origin=args.origin.rstrip('/')
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
base=origin+PREFIX
checks=[];renders=[];errors=[];report={'origin':origin,'scope':'Actual HTTP content and navigation. No evaluation of historical or theological truth.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  files=[f['path'] for f in json.loads((HERE/'build-report.json').read_text())['files'] if f['path'].endswith('.html')]
  assert len(files)==6
  for width in (1280,390):
   page.set_viewport_size({'width':width,'height':900 if width==1280 else 844})
   for file in files:
    response=page.goto(base+file,wait_until='networkidle');assert response.status==200,(file,response.status);assert page.locator('h1').count()==1;assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(file,width);renders.append({'page':file,'width':width,'status':'passed'})
  checks.append('All six pages render over HTTP at desktop and 390px widths without overflow.')
  page.goto(base+'index.html',wait_until='networkidle');page.fill('#query','walled cities');assert page.locator('.filter-record:visible').count()==1;assert 'Moses' in page.locator('.filter-record:visible').inner_text();checks.append('Study search covers body text beyond titles and descriptions.')
  page.fill('#query','unmatched-zz-999');assert page.locator('#empty').is_visible();page.click('#reset');assert page.locator('.filter-record:visible').count()==3;checks.append('Empty search and reset work without removing the underlying text.')
  page.goto(base+'comparisons.html',wait_until='networkidle');page.select_option('#kind','Explicit textual appeal');assert page.locator('.filter-record:visible').count()==3;checks.append('Three explicit textual appeals remain distinct from hypotheses and applications.')
  page.goto(base+'comparisons.html#egypt-ethical-future');page.locator('#egypt-ethical-future summary').click();page.locator('#egypt-ethical-future a[href="sources.html#iti"]').click();assert page.url.endswith('sources.html#iti');assert 'Victoria' in page.locator('#iti').inner_text();checks.append('An Egyptian comparison links to the correct source and its scope.')
  context=browser.new_context(java_script_enabled=False);plain=context.new_page();plain.goto(base+'moses-jesus-and-shared-life.html');assert 'Moses and the prophets' in plain.locator('main').inner_text();assert plain.locator('h2').count()>=6;checks.append('Developed arguments and source links remain readable with JavaScript disabled.')
  page.goto(origin+'/theology-wiki/comparative-religion/egypt-emanation/egyptian-seed.html',wait_until='networkidle');page.locator('nav a[href="moses-jesus-mammon/index.html"]').click();assert page.url==base+'index.html';checks.append('The existing Egyptian Seed reader links directly to the new extension.')
  page.locator('nav a[href="../../../san-reader.html?page=apocalyptic-repair-theology"]').click();page.wait_for_function("document.body.textContent.includes('Adversarial powers do not require an equal rival to God')");checks.append('The new series returns to the actual preserved principal repair article.')
  page.goto(base+'calf-name-and-afterlife.html',wait_until='networkidle');page.locator('nav a[href="../../../san-reader.html?page=kenite-hypothesis-and-yahweh-origins"]').click();page.wait_for_function("document.body.textContent.includes('The transmission question')");checks.append('The Kenite link resolves to the existing principal article, not an invented route.')
  page.goto(base+'index.html',wait_until='networkidle');page.focus('#query');page.keyboard.type('necropolis');assert page.locator('.filter-record:visible').count()==1;page.keyboard.press('Control+A');page.keyboard.press('Backspace');assert page.locator('.filter-record:visible').count()==3;checks.append('Full-text search can be used from the keyboard.')
  Path(args.screenshots).mkdir(parents=True,exist_ok=True)
  for file,name in [('index.html','mobile-index.png'),('moses-jesus-and-shared-life.html','mobile-moses-jesus.png'),('wealth-mortality-and-responsibility.html','mobile-egypt-wealth.png')]:
   page.goto(base+file,wait_until='networkidle');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(Path(args.screenshots)/name))
  checks.append('Three 390px screenshots are retained for separate visual inspection.')
  assert not errors,errors;checks.append('No tested page raised a JavaScript error.');browser.close()
 report.update(status='passed',checks=checks,check_count=len(checks),renders=renders,render_count=len(renders))
except Exception as exc:
 report.update(status='failed',checks=checks,check_count=len(checks),renders=renders,render_count=len(renders),error=type(exc).__name__+': '+str(exc));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server:server.shutdown()
