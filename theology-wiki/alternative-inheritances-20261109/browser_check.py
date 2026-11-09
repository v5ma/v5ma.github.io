"""Local static rendering and reader-extension regression tests; no external writes."""
from pathlib import Path
import functools, http.server, json, threading, shutil, os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = os.environ.get('INHERITANCE_BASE', f'http://127.0.0.1:{server.server_port}').rstrip('/')
cfg = json.loads((HERE / 'manifest.json').read_text())
bundle = (HERE / 'reader-links.js').read_text()
out = HERE / 'qa'
out.mkdir(exist_ok=True)
checks = []
try:
 with sync_playwright() as p:
  browser = p.chromium.launch(headless=True, executable_path=shutil.which("chromium"))
  page = browser.new_page(viewport={'width':1440,'height':1000})
  errors=[]
  page.on('pageerror', lambda error: errors.append(str(error)))
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':900})
   page.goto(base+'/theology-wiki/alternative-inheritances-20261109/alternative-inheritances.html')
   assert page.locator('h1').inner_text() == cfg['title']
   assert page.locator('table tbody tr').count() == 6
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflow'
   assert page.locator('a[href="#ref-4"]').count() >= 1
   page.locator('table').scroll_into_view_if_needed()
   page.screenshot(path=str(out/f'matrix-{width}.png'))
   checks.append(f'{width}px static guide, matrix and document width')
  # A complete checkout or explicit public base can exercise the real reader too.
  if os.environ.get('INHERITANCE_BASE') or (ROOT/'theology-wiki/assets/js/reader.js').exists() or (ROOT/'theology-wiki/public-corpus').exists():
   for slug in ['samaritan-texts-and-sacred-authority','jesus-and-dead-sea-scrolls','sacred-inheritance-and-rival-continuations','qumran-text-history']:
    page.goto(base+'/theology-wiki/san-reader.html?page='+slug)
    page.locator('#inheritance-context').wait_for(timeout=45000)
    assert page.locator('#inheritance-context').count()==1
    assert page.locator('#inheritance-matrix').count()==1
    assert page.locator('#source-transcript [data-inheritance-bridge]').count()==0
    page.locator('#inheritance-matrix summary').click()
    assert page.locator('#inheritance-matrix li').count()==6
    checks.append('Real reader: '+slug)
   page.locator('#inheritance-context a').last.click()
   page.wait_for_url('**/alternative-inheritances.html*')
   assert page.locator('h1').inner_text()==cfg['title']
   page.go_back()
   page.locator('#inheritance-context').wait_for(timeout=45000)
   assert page.locator('#inheritance-context').count()==1
   checks.append('Real reader: outbound guide and browser Back')
  for c in cfg['connections']:
   # Fixture includes immutable speaker text to catch accidental archival insertion.
   heading = c['heading'] or 'Original discussion'
   page.goto(base+'/theology-wiki/alternative-inheritances-20261109/alternative-inheritances.html')
   page.set_content('<html><body><label>Search<input id="page-search"></label><article id="article-body"><h2>'+heading+'</h2><p id="old-prose">Original editorial prose.</p><h2>Next section</h2><section class="source-record"><div id="source-transcript"><article data-turn="1"><p>Exact original speaker text.</p></article></div></section></article></body></html>')
   original=page.locator('#source-transcript').inner_html()
   page.evaluate('(slug)=>{window.TheologyReader={current:()=>({slug})}}',c['slug'])
   page.add_script_tag(content=bundle)
   assert page.locator('#inheritance-context').count() == 1
   assert page.locator('#inheritance-matrix').count() == 1
   assert page.locator('#source-transcript').inner_html() == original
   assert page.locator('#old-prose').inner_text() == 'Original editorial prose.'
   if c['heading']:
    assert page.locator('#inheritance-context + h2').inner_text() == 'Next section'
   for _ in range(3):
    page.evaluate('(slug)=>dispatchEvent(new CustomEvent("theology:page",{detail:{slug}}))',c['slug'])
   assert page.locator('#inheritance-context').count() == 1
   assert page.locator('#inheritance-matrix').count() == 1
   page.locator('#inheritance-matrix summary').click()
   assert page.locator('#inheritance-matrix li').count() == 6
   page.locator('#page-search').fill('Dayfani')
   assert page.locator('#inheritance-search-results a').count() >= 1
   page.locator('#page-search').fill('')
   assert page.locator('#inheritance-search-results').count() == 0
   page.evaluate('dispatchEvent(new CustomEvent("theology:loading"))')
   assert page.locator('[data-inheritance-bridge]').count() == 0
   page.evaluate('dispatchEvent(new CustomEvent("theology:page",{detail:{slug:"home"}}))')
   assert page.locator('[data-inheritance-bridge]').count() == 0
   page.evaluate('(slug)=>dispatchEvent(new CustomEvent("theology:page",{detail:{slug}}))',c['slug'])
   assert page.locator('#inheritance-context').count() == 1
   assert page.locator('#source-transcript').inner_html() == original
   page.evaluate('''() => { document.getElementById('article-body').innerHTML='<section class="source-record"><div id="source-transcript"><p>Late asynchronous source card.</p></div></section>'; }''')
   page.locator('#inheritance-context').wait_for()
   assert page.locator('#inheritance-context').count() == 1
   assert page.locator('#source-transcript').inner_text() == 'Late asynchronous source card.'
   checks.append(c['slug']+': placement, archive integrity, repeat, navigation, return, search')
  assert not errors, errors
  browser.close()
 (out/'browser-report.json').write_text(json.dumps({'scope':'Guide, deterministic fixtures, and real reader where complete checkout or public base is available','base':base,'passed':checks,'pageErrors':errors},indent=2)+'\n')
 print(json.dumps({'passed':len(checks),'pageErrors':errors}))
finally:
 server.shutdown()
