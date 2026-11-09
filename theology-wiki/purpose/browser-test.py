"""Static entrance and reader integration QA, locally or against THEOLOGY_BASE_URL."""
import functools, http.server, json, os, threading
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from playwright.sync_api import sync_playwright, expect

HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
ARTIFACTS=ROOT.parent/'browser-test-artifacts'/'purpose'
ARTIFACTS.mkdir(parents=True,exist_ok=True)
server=None
base=os.environ.get('THEOLOGY_BASE_URL')
if not base:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
checks=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
        ctx=browser.new_context(viewport={'width':1440,'height':1000})
        page=ctx.new_page(); errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
        for width in [1440,768,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.goto(base+'purpose/index.html').ok
            assert page.locator('h1').inner_text()=='Why this wiki exists'
            assert page.locator('.letter p').all_text_contents()==(HERE/'letter.txt').read_text().strip().split('\n\n')
            assert page.locator('.map-card').count()==8
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),width
            page.screenshot(path=str(ARTIFACTS/f'purpose-{width}.png'),full_page=True)
        checks.append('Full exact nine-paragraph letter, eight topic cards, and no overflow at 1440, 768, 390 and 320px')
        page.set_viewport_size({'width':1440,'height':1000})
        page.goto(base+'purpose/index.html')
        page.keyboard.press('Tab'); expect(page.locator('.skip')).to_be_focused()
        page.keyboard.press('Enter'); assert urlsplit(page.url).fragment=='main'
        page.locator('.contents a[href="#reading-map"]').click()
        assert urlsplit(page.url).fragment=='reading-map'
        links=page.locator('a').evaluate_all('(nodes)=>nodes.map(n=>n.href)')
        targets=sorted(set(href.split('#')[0].split('?')[0] for href in links if href.startswith(base)))
        for url in targets:
            response=ctx.request.get(url);assert response.ok,(url,response.status)
        checks.append('Keyboard skip link, in-page navigation and every distinct local link endpoint pass')
        for route in ['topic-traditions','apocalyptic-repair-theology','connected-arguments']:
            page.goto(base+'purpose/index.html')
            page.locator(f'a[href="../san-reader.html?page={route}"]').first.click()
            expect(page.locator('#article-body')).not_to_be_empty(timeout=30000)
            expect(page.locator('#article-title')).not_to_have_text('Loading wiki',timeout=30000)
            assert 'page='+route in page.url
            page.go_back();expect(page.locator('h1')).to_have_text('Why this wiki exists')
            page.go_forward();expect(page.locator('#article-body')).not_to_be_empty(timeout=30000)
        checks.append('Three actual reader routes load and browser Back/Forward preserves destinations')
        for reader in ['index.html','san-reader.html']:
            page.goto(base+reader)
            expect(page.locator('#article-body')).not_to_be_empty(timeout=30000)
            expect(page.locator('.wiki-family-strip').first.get_by_role('link',name='Start here',exact=True)).to_be_visible(timeout=30000)
            expect(page.locator('.purpose-entry-quote')).to_be_visible()
            page.locator('.purpose-entry-link').click();expect(page.locator('h1')).to_have_text('Why this wiki exists')
            page.go_back();expect(page.locator('.purpose-entry-link')).to_be_visible()
            page.locator('.purpose-entry-link').click();expect(page.locator('.letter p')).to_have_count(9)
        checks.append('Both existing reader entrances retain Start here after enhancement and support repeated entrance navigation')
        nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
        np=nojs.new_page();np.goto(base+'purpose/index.html')
        assert np.locator('.letter p').count()==9;assert np.locator('.map-card').count()==8
        np.locator('.contents a[href="#method"]').click();assert urlsplit(np.url).fragment=='method'
        for reader in ['index.html','san-reader.html']:
            np.goto(base+reader);np.locator('.purpose-entry-link').click();assert np.locator('.letter p').count()==9
        checks.append('Complete letter, map, anchors and both entrances remain readable with JavaScript disabled')
        assert not errors,errors
        browser.close()
    result={'status':'PASS','base':base,'checks':checks}
    (ARTIFACTS/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
finally:
    if server:server.shutdown();server.server_close()
