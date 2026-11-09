#!/usr/bin/env python3
"""Native Chromium QA for the evidence edition; --live validates real public reader."""
import argparse, functools, http.server, json, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ap=argparse.ArgumentParser();ap.add_argument('--live',action='store_true');ap.add_argument('--artifacts',type=Path,default=Path('evidence-test-output'));ap.add_argument('--chromium');args=ap.parse_args()
section=Path(__file__).resolve().parent;root=section.parent.parent;cfg=json.loads((section/'manifest.json').read_text());args.artifacts.mkdir(parents=True,exist_ok=True)
server=None
if args.live: base='https://v5ma.github.io/theology-wiki/'
else:
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}/theology-wiki/'
checks=[]
try:
 with sync_playwright() as pw:
  binary=args.chromium or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
  browser=pw.chromium.launch(executable_path=binary,headless=True,args=['--no-sandbox']);ctx=browser.new_context();page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));url=base+'evidence-review-20261109/'
  for width in [1440,390]:
   page.set_viewport_size({'width':width,'height':900})
   for p in ['index']+[p['slug'] for p in cfg['pages']]:
    assert page.goto(url+p+'.html').ok
    assert page.locator('h1').count()==1
    assert page.locator('main').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(p,width,'overflow')
    if p!='index':assert len(page.locator('article.prose').inner_text())>1000
   page.goto(url);page.screenshot(path=str(args.artifacts/f'overview-{width}.png'),full_page=True)
  page.goto(url+'dead-sea-scrolls-dating.html');box=page.locator('details.counterargument');assert box.get_attribute('open') is not None;box.locator('summary').click();assert box.get_attribute('open') is None;box.locator('summary').click();assert box.get_attribute('open') is not None
  checks.append('All six pages readable without horizontal overflow at 1440px and 390px; comparison accordion closes and reopens')
  page.goto(url);assert page.locator('.card').count()==5
  for term in ['1QpHab','KH1','Ezekiel','radiocarbon','Pliny','Hebraisms']:
   page.locator('#query').fill(term);assert page.locator('.result').count()>0,term
  page.locator('#query').fill('Teacher');page.locator('#scope').select_option('dead-sea-scrolls-dating');assert page.locator('.result').count()>0
  assert all('dead-sea-scrolls-dating.html#' in x for x in page.locator('.result a').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))'))
  page.reload();assert page.locator('#query').input_value()=='Teacher';assert page.locator('#scope').input_value()=='dead-sea-scrolls-dating'
  page.locator('.result a').first.click();page.go_back();assert page.locator('#query').input_value()=='Teacher'
  page.locator('#query').press('Escape');assert page.locator('.result').count()==0
  page.locator('#query').fill('zzzznonexistent');assert 'No matching sections' in page.locator('#search-status').inner_text()
  page.locator('#reset').click();page.locator('#reset').click();assert page.locator('#scope').input_value()=='';assert page.locator('#query').evaluate('(e)=>e===document.activeElement')
  page.goto(url+'?q=Ezekiel');page.evaluate("history.pushState(null,'','?q=Pliny');dispatchEvent(new PopStateEvent('popstate'))");assert page.locator('#query').input_value()=='Pliny';page.go_back();assert page.locator('#query').input_value()=='Ezekiel'
  checks.append('Search, scoped filter, URL/reload, result/back, Escape, empty state, repeated reset and popstate pass')
  nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':900});np=nojs.new_page()
  for p in ['index']+[p['slug'] for p in cfg['pages']]:
   np.goto(url+p+'.html');assert np.locator('main').is_visible()
   if p!='index':assert len(np.locator('article.prose').inner_text())>1000
  nojs.close();checks.append('All complete pages readable with JavaScript disabled')
  # Standalone integration harness exercises repetition and absence of a current article.
  page.set_content('<main id="article-body"></main>');page.add_script_tag(path=str(section/'reader-guide.js'))
  page.evaluate("TheologyReview.enhance({slug:'home'});TheologyReview.enhance({slug:'home'})");assert page.locator('#evidence-edition-entry').count()==1
  out=page.evaluate("TheologyReview.sourceGuide({slug:'revelation-and-symbolic-language'})");assert 'Read the evidence-led study' in out
  page.evaluate("document.querySelector('#article-body').remove();TheologyReview.enhance({slug:'home'})");checks.append('Reader-guide harness: idempotent homepage, absent body and companion mapping pass')
  if args.live:
   for entry in ['index.html','san-reader.html']:
    page.goto(base+entry+'?page=home');page.locator('#evidence-edition-entry a').wait_for();assert page.locator('#evidence-edition-entry').count()==1
    for slug in ['revelation-and-symbolic-language','ai-re-dates-dead-sea-scrolls','jesus-and-dead-sea-scrolls','gmirkin-hellenistic-bible-theory']:
     page.goto(base+entry+'?page='+slug);page.locator('.evidence-source-guide').wait_for();assert page.locator('.evidence-companion').count()==1
     if slug=='gmirkin-hellenistic-bible-theory':assert 'minority' in page.locator('#article-body').inner_text().lower()
    page.goto(base+entry+'?page=revelation-and-symbolic-language&turn=1');page.locator('#turn-1').wait_for();assert 'Micah Blumberg' in page.locator('#turn-1').inner_text()
    page.goto(base+entry+'?page=revelation-and-symbolic-language');page.locator('[data-research="load-source"]').click();page.locator('#turn-1').wait_for();assert page.locator('#turn-list .chat-turn').count()>0
   checks.append('Live actual readers: home, four archives, preserved Gmirkin correction, direct turn and transcript loading pass')
  assert not errors,errors
  browser.close()
 result={'status':'PASS','proofLevel':'live public origin' if args.live else 'local native Chromium, supplemental pages and adapter harness','checks':checks};(args.artifacts/'report.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
finally:
 if server:server.shutdown()
