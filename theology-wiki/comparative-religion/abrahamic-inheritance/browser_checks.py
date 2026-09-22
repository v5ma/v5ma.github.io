"""Real HTTP checks for the atlas and representative group pages."""
from pathlib import Path
import argparse,functools,http.server,json,threading
from playwright.sync_api import sync_playwright
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument('--origin');p.add_argument('--report',default='/tmp/abrahamic-atlas-browser.json');p.add_argument('--screenshots',default='/tmp/abrahamic-atlas-images');args=p.parse_args()
server=None
if args.origin: origin=args.origin.rstrip('/')
else:
 class H(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*unused): pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start();origin=f'http://127.0.0.1:{server.server_port}'
base=origin+'/theology-wiki/comparative-religion/abrahamic-inheritance/'
checks=[];errors=[];renders=[];report={'origin':origin,'scope':'Actual HTTP atlas and selected dedicated pages. Not an evaluation of which inheritance claim is true.'}
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch();page=browser.new_page();page.on('pageerror',lambda e: errors.append(str(e)))
  for width in (1280,390):
   page.set_viewport_size({'width':width,'height':844})
   for f in ['index.html','groups/samaritan.html','groups/christianity-general.html','groups/islam-general.html','groups/lds.html','groups/black-hebrew-israelites.html','groups/baha.html','groups/mandaean.html']:
    r=page.goto(base+f,wait_until='networkidle');assert r.status==200,(f,r.status);assert page.locator('h1').count()==1;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(f,width);renders.append({'page':f,'width':width,'status':'passed'})
  checks.append('Index and seven representative dedicated pages render at desktop and 390px without overflow.')
  page.goto(base+'index.html',wait_until='networkidle');assert page.locator('.atlas-card').count()==60
  page.fill('#query','Samaritan');assert page.locator('.atlas-card:visible').count()==1;checks.append('Full-text index search isolates Samaritan entry.')
  page.click('#reset');page.select_option('#kind','Islamic Abrahamic restoration');assert page.locator('.atlas-card:visible').count()>=3;checks.append('Claim-type filter works without assigning a truth ranking.')
  page.select_option('#family','Muslim traditions');assert page.locator('.atlas-card:visible').count()>=3;checks.append('Family and claim filters compose.')
  page.click('#reset');page.locator('a[href="groups/samaritan.html"]').click();assert page.url.endswith('/groups/samaritan.html');assert 'Original Israel continuity claim' in page.locator('main').inner_text();checks.append('Index entry opens its dedicated Wiki page.')
  page.locator('a[href="../../encyclopedia-method.html"]').first.click();assert page.url.endswith('/comparative-religion/encyclopedia-method.html');checks.append('Dedicated page returns to its existing developed Wiki context.')
  page.goto(origin+'/theology-wiki/comparative-religion/directory.html',wait_until='networkidle');assert page.locator('a[href="abrahamic-inheritance/index.html"]').count()>=1;checks.append('Existing comparative directory links durably to the atlas.')
  ctx=browser.new_context(java_script_enabled=False);plain=ctx.new_page();plain.goto(base+'index.html');assert plain.locator('.atlas-card:visible').count()==60;assert plain.locator('noscript').is_visible();checks.append('All sixty index links remain visible without JavaScript.')
  Path(args.screenshots).mkdir(parents=True,exist_ok=True);page.set_viewport_size({'width':390,'height':844})
  for f,n in [('index.html','mobile-index.png'),('groups/samaritan.html','mobile-samaritan.png'),('groups/christianity-general.html','mobile-christianity.png')]:
   page.goto(base+f,wait_until='networkidle');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(Path(args.screenshots)/n))
  checks.append('Three mobile screenshots retained for visual review.')
  assert not errors,errors;checks.append('No tested page raised JavaScript errors.');browser.close()
 report.update(status='passed',checks=checks,check_count=len(checks),renders=renders,render_count=len(renders))
except Exception as exc:
 report.update(status='failed',checks=checks,check_count=len(checks),renders=renders,render_count=len(renders),error=type(exc).__name__+': '+str(exc));raise
finally:
 Path(args.report).parent.mkdir(parents=True,exist_ok=True);Path(args.report).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
 if server: server.shutdown()
