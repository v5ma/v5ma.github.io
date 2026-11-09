"""Read-only local fixtures and optional exact live reader checks."""
from pathlib import Path
import functools,http.server,json,threading,shutil,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=os.environ.get('CLOUDS_BASE',f'http://127.0.0.1:{server.server_port}').rstrip('/')
cfg=json.loads((HERE/'manifest.json').read_text());bundle=(HERE/'reader-links.js').read_text();out=HERE/os.environ.get('CLOUDS_REPORT_DIR','qa/local');out.mkdir(parents=True,exist_ok=True);checks=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'));page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':900});page.goto(base+'/theology-wiki/clouds-and-millennium-20261109/clouds-and-millennium.html');assert page.locator('h1').inner_text()==cfg['title'];assert page.locator('.prose h2').count()==12;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(out/f'comparison-{width}.png'));page.locator('#chapter-search').fill('first resurrection');assert page.locator('#chapter-search-results a').count()>0;page.locator('#chapter-search').fill('zznotfoundzz');assert page.locator('#chapter-search-status').inner_text()=='0 matching sections.';page.locator('#chapter-search').fill('');checks.append(f'{width}px article, no overflow, search, no results and clear')
  if os.environ.get('CLOUDS_BASE') or (ROOT/'theology-wiki/assets/js/theology-reader.js').exists():
   for c in cfg['connections']:
    page.goto(base+'/theology-wiki/san-reader.html?page='+c['slug']);page.locator('#clouds-millennium-context').wait_for(timeout=60000);assert page.locator('#clouds-millennium-context').count()==1;assert page.locator('#source-transcript [data-clouds-bridge]').count()==0;checks.append('Live reader '+c['slug'])
   page.locator('#clouds-millennium-context a').click();page.wait_for_url('**/clouds-and-millennium.html*');page.go_back();page.locator('#clouds-millennium-context').wait_for(timeout=60000);checks.append('Live reader outbound and browser Back')
   page.locator('#page-search').fill('millennium');page.locator('#clouds-search-results a').first.wait_for();checks.append('Live global search')
  for c in cfg['connections']:
   page.goto(base+'/theology-wiki/clouds-and-millennium-20261109/clouds-and-millennium.html');page.set_content('<html><body><label>Search<input id="page-search"></label><article id="article-body"><p id="old-prose">Original prose.</p><section id="source-transcript"><p>Original speaker.</p></section></article></body></html>');original=page.locator('#source-transcript').inner_html();page.evaluate('(slug)=>{window.TheologyReader={current:()=>({slug})}}',c['slug']);page.add_script_tag(content=bundle);assert page.locator('#clouds-millennium-context').count()==1
   for _ in range(3):page.evaluate('(slug)=>dispatchEvent(new CustomEvent("theology:page",{detail:{slug}}))',c['slug'])
   assert page.locator('#clouds-millennium-context').count()==1;assert page.locator('#source-transcript').inner_html()==original;assert page.locator('#source-transcript [data-clouds-bridge]').count()==0;page.locator('#page-search').fill('clouds');assert page.locator('#clouds-search-results a').count()>0;page.locator('#page-search').fill('');assert page.locator('#clouds-search-results').count()==0;page.evaluate('dispatchEvent(new CustomEvent("theology:loading"))');assert page.locator('[data-clouds-bridge]').count()==0;page.evaluate('dispatchEvent(new CustomEvent("theology:page",{detail:{slug:"home"}}))');assert page.locator('[data-clouds-bridge]').count()==0;page.evaluate('(slug)=>dispatchEvent(new CustomEvent("theology:page",{detail:{slug}}))',c['slug']);page.evaluate('document.getElementById("article-body").innerHTML="<section id=source-transcript>Late source.</section>"');page.locator('#clouds-millennium-context').wait_for();assert page.locator('#source-transcript').inner_text()=='Late source.';checks.append(c['slug']+': archive unchanged, repeated events, navigation, late rendering and search')
  assert not errors,errors;browser.close()
 (out/'browser-report.json').write_text(json.dumps({'base':base,'checks':checks,'pageErrors':errors},indent=2)+'\n');print(json.dumps({'passed':len(checks),'errors':errors}))
finally:server.shutdown()
