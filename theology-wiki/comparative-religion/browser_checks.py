"""Native HTTP and public-origin browser checks; no substituted response bodies."""
from pathlib import Path
from urllib.parse import urljoin
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--report',default='/tmp/comparative-browser.json');p.add_argument('--screenshot',default='/tmp/comparative-mobile.png');args=p.parse_args()
server=None
if args.url:
 assert args.url=='https://v5ma.github.io/theology-wiki/comparative-religion/index.html'
 url=args.url
else:
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(HERE.parent.parent)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{server.server_port}/theology-wiki/comparative-religion/index.html'
checks=[];renders=[];errors=[];report={'url':url,'scope':'Actual thirteen-page comparative series and integrated main repair article. Rendering is not historical or theological validation.'}
build=json.loads((HERE/'build-report.json').read_text());names=[x['path'] for x in build['files'] if x['path'].endswith('.html')]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for width,height in [(1366,900),(390,844)]:
   page.set_viewport_size({'width':width,'height':height})
   for name in names:
    response=page.goto(urljoin(url,name),wait_until='networkidle',timeout=45000);assert response and response.status==200,name
    assert page.locator('h1').count()==1 and page.locator('main').is_visible(),name
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),name
    renders.append({'page':name,'width':width,'status':'passed'})
  checks.append('All thirteen pages render over real HTTP at desktop and 390-pixel mobile widths without overflow.')
  page.goto(url,wait_until='networkidle');assert page.locator('.filter-record:visible').count()==9
  page.fill('#query','Maimonides');assert page.locator('.filter-record:visible').count()==1
  page.fill('#query','no-such-comparative-entry-xyz');assert page.locator('#empty').is_visible()
  page.click('#reset');assert page.locator('.filter-record:visible').count()==9
  checks.append('Study search, empty results and reset operate on the actual nine-study index.')
  page.locator('main a[href="sovereignty-and-adversaries.html"]').first.click();assert page.url.endswith('sovereignty-and-adversaries.html')
  assert 'Jubilees' in page.locator('main').inner_text()
  page.locator('main a[href="sources.html#jubilees"]').first.click();assert page.url.endswith('sources.html#jubilees');assert page.locator('#jubilees').is_visible()
  checks.append('A developed study links to its actual identified source-scope record.')
  page.goto(urljoin(url,'directory.html'),wait_until='networkidle');assert page.locator('.filter-record:visible').count()==36
  page.select_option('#kind','Eastern Christian traditions');assert page.locator('.filter-record:visible').count()==6
  page.fill('#query','Coptic');assert page.locator('.filter-record:visible').count()==1
  page.click('#reset');assert page.locator('.filter-record:visible').count()==36
  checks.append('Directory family and text filters compose without losing the 36-entry baseline.')
  page.goto(urljoin(url,'directory.html#mandaean'));assert page.locator('#mandaean').is_visible()
  page.locator('#mandaean a[href="mandaean-comparisons.html"]').click();assert page.url.endswith('mandaean-comparisons.html')
  checks.append('A tradition entry deep-links to its developed comparative study.')
  page.goto(urljoin(url,'claim-audit.html'),wait_until='networkidle');assert page.locator('.filter-record:visible').count()==26
  page.select_option('#kind','Unverified attribution');assert page.locator('.filter-record:visible').count()==6
  assert all('Unverified supplied attribution' in t for t in page.locator('.unverified').all_text_contents())
  page.goto(urljoin(url,'claim-audit.html#c-miriai'));assert page.locator('#c-miriai').is_visible()
  checks.append('Six unverified quotation claims remain labeled and separate from twenty claim reviews.')
  page.goto(url,wait_until='networkidle');page.keyboard.press('Tab');assert page.locator('.skip').evaluate('(e)=>e===document.activeElement')
  checks.append('Keyboard navigation exposes the skip-to-content link.')
  plain=browser.new_context(java_script_enabled=False).new_page()
  for name,count in [('index.html',9),('directory.html',36),('claim-audit.html',26)]:
   plain.goto(urljoin(url,name));assert plain.locator('.filter-record:visible').count()==count
  checks.append('All index, directory and audit records remain readable with JavaScript disabled.')
  main=url.split('/comparative-religion/')[0]+'/san-reader.html?page=apocalyptic-repair-theology'
  page.goto(main,wait_until='networkidle');page.wait_for_function("document.body.textContent.includes('Adversarial powers do not require an equal rival to God')")
  assert 'Repair does not require pretending the danger is imaginary' in page.locator('body').inner_text()
  assert page.locator('a[href*="comparative-religion/sovereignty-and-adversaries.html"]').count()>0
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
  checks.append('The established main-reader route renders both the preserved original and the new linked repair-theology supplement at 390 pixels.')
  page.goto(url,wait_until='networkidle');Path(args.screenshot).parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=args.screenshot)
  page.goto(urljoin(url,'sovereignty-and-adversaries.html'),wait_until='networkidle');page.screenshot(path=str(Path(args.screenshot).with_name(Path(args.screenshot).stem+'-study.png')))
  checks.append('Mobile index and developed-study screenshots are retained for visual inspection.')
  assert not errors,errors;checks.append('No page JavaScript errors occurred during normal interactions.');browser.close()
 report.update(status='passed',check_count=len(checks),checks=checks,render_checks=renders)
except Exception as exc:
 report.update(status='failed',check_count=len(checks),checks=checks,render_checks=renders,error=type(exc).__name__+': '+str(exc));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server:server.shutdown()
