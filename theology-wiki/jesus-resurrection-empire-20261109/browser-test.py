#!/usr/bin/env python3
"""Run local static-section QA. Requires playwright and a Chromium executable.
Usage: python browser-test.py [--chromium /usr/bin/chromium] [--artifacts DIR]
No deployment or external network calls are performed.
"""
import argparse, functools, http.server, json, threading
from pathlib import Path
from urllib.parse import urlsplit, unquote
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright

class Links(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.ids=set(); self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.add(attrs['id'])
        if tag=='a' and 'href' in attrs: self.links.append(attrs['href'])

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--chromium',default='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None); ap.add_argument('--artifacts',type=Path); args=ap.parse_args()
    section=Path(__file__).resolve().parent; root=section.parent
    artifacts=args.artifacts or root.parent/'browser-test-artifacts'/'inquiries-20261109'; artifacts.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((section/'manifest.json').read_text()); pages=['index.html']+[p['slug']+'.html' for p in manifest['pages']]
    checks=[]
    for name in pages:
        source=section/name; parsed=Links(source.read_text())
        for href in parsed.links:
            u=urlsplit(href)
            if u.scheme or u.netloc: continue
            target=(source.parent/unquote(u.path)).resolve() if u.path else source
            assert target.is_relative_to(root), (name,href,'outside wiki')
            assert target.exists(), (name,href,'missing local endpoint')
            if u.fragment and target.suffix=='.html':
                assert unquote(u.fragment) in Links(target.read_text()).ids, (name,href,'missing fragment')
    checks.append('All local links and HTML fragment targets exist; reader route runtime intentionally excluded')
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/{section.name}/'
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
            errors=[]
            ctx=browser.new_context(viewport={'width':1440,'height':1000}); page=ctx.new_page(); page.on('pageerror',lambda e: errors.append(str(e)))
            for size in [{'width':1440,'height':1000},{'width':390,'height':844}]:
                page.set_viewport_size(size)
                for name in pages:
                    assert page.goto(base+name).ok
                    assert page.locator('h1').count()==1
                    assert page.locator('main').is_visible()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (name,size,'horizontal overflow')
                    if name!='index.html':
                        assert page.locator('article.prose h2').count()>0
                        assert page.locator('.contents a').count()>0
                page.goto(base)
                assert page.locator('.cards .card').count()==4
                page.screenshot(path=str(artifacts/f'overview-{size["width"]}.png'),full_page=True)
            checks.append('Five pages: headings/content and no overflow at 1440px and 390px; overview has four cards')
            page.set_viewport_size({'width':1440,'height':1000}); page.goto(base)
            for term in ['Pilate','angels','orthodox']:
                page.locator('#query').fill(term)
                assert page.locator('#search-results .result').count()>0, term
                assert 'matching section' in page.locator('#search-status').inner_text()
                assert 'q='+term in page.url
            page.locator('#query').fill('Pilate')
            scope='imperial-pressure-and-pilate'; page.locator('#scope').select_option(scope)
            assert page.locator('.result').count()>0
            assert all(scope in h for h in page.locator('.result a').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))'))
            restored=page.url; page.reload(); assert page.locator('#query').input_value()=='Pilate'; assert page.locator('#scope').input_value()==scope
            page.locator('.result a').first.click(); page.go_back(); assert page.locator('#query').input_value()=='Pilate'; assert page.locator('#scope').input_value()==scope; assert page.locator('.result').count()>0
            page.locator('#query').press('Escape'); assert page.locator('#query').input_value()==''; assert page.locator('.result').count()==0
            page.locator('#query').fill('zzzznonexistenttermzzzz'); assert 'No matching sections' in page.locator('#search-status').inner_text()
            page.locator('#reset').click(); assert page.locator('#query').input_value()==''; assert page.locator('#scope').input_value()==''; assert '?' not in page.url; assert page.locator('#query').evaluate('(e)=>e===document.activeElement')
            # Exercise popstate explicitly: current URL state is replaced, not pushed, while typing.
            page.goto(base+'?q=angels'); page.evaluate("history.pushState(null,'','?q=Pilate'); dispatchEvent(new PopStateEvent('popstate'))")
            assert page.locator('#query').input_value()=='Pilate'; page.go_back(); assert page.locator('#query').input_value()=='angels'
            checks.append('Search terms, scoped filter, reload URL restore, result navigation/back, popstate, Escape, no-results, Clear and focus pass')
            nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844}); np=nojs.new_page(); np.goto(base)
            assert np.locator('.card a').count()==4
            for name in pages[1:]:
                np.goto(base+name); assert len(np.locator('article.prose').inner_text())>500; assert np.locator('.contents a').count()>0
            checks.append('No-JavaScript overview links and four complete readable chapters pass')
            assert not errors, errors
            browser.close()
        result={'status':'PASS','checks':checks,'screenshots':[str(p) for p in artifacts.glob('overview-*.png')]}
        (artifacts/'browser-test-results.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result,indent=2))
    finally: server.shutdown(); server.server_close()
if __name__=='__main__': main()
