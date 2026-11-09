"""Read-only browser regression suite for the generated publication artifact."""
from pathlib import Path
import functools, http.server, threading, json, os, shutil, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
ARTIFACT=Path(os.environ.get('CONNECTIONS_ARTIFACT',ROOT/'.pages-connectivity'))
OUT=ROOT/'connectivity-qa';OUT.mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ARTIFACT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=os.environ.get('CONNECTIONS_BASE',f'http://127.0.0.1:{server.server_port}').rstrip('/')
GRAPH=json.loads((ROOT/'theology-wiki/connections/data.json').read_text())
EXPECTED_PAGES=len(GRAPH['pages'])
checks=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'))
        page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        for width in [1440,390]:
            page.set_viewport_size({'width':width,'height':900})
            page.goto(BASE+'/theology-wiki/rppa-power-20261109/rppa-battles-economic-power-and-gaza.html')
            panel=page.locator('.wiki-connections');panel.wait_for();assert panel.count()==1
            assert panel.locator('.connection-list').first.locator('li').count()<=12
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if panel.locator('details').count():
                panel.locator('summary').first.click();assert panel.locator('details').first.get_attribute('open') is not None
            panel.scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'static-{width}.png'))
            checks.append(f'{width}px static study and progressive disclosure')
            page.goto(BASE+'/theology-wiki/san-reader.html?page=apocalyptic-repair-theology')
            page.locator('#wiki-connections #wc-page-filter').wait_for(timeout=60000)
            assert page.locator('#wiki-connections').count()==1
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.locator('#wc-page-filter').fill('zz-not-a-real-topic-zz');assert page.locator('#wiki-connections .connection-list li').count()==0
            page.locator('#wc-page-filter').fill('');assert page.locator('#wiki-connections .connection-list li').count()>0
            page.locator('#wiki-connections').scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'reader-{width}.png'))
            checks.append(f'{width}px real reader panel, filter, clear, no overflow')
        page.set_viewport_size({'width':1440,'height':1000})
        page.goto(BASE+'/theology-wiki/connections/index.html');page.locator('#wc-search').fill('Gaza')
        assert page.locator('#wc-directory-list li:visible').count()>0
        page.locator('#wc-search').fill('zz-not-a-real-topic-zz');assert page.locator('#wc-directory-list li:visible').count()==0
        page.locator('#wc-search').fill('');assert page.locator('#wc-directory-list li:visible').count()==EXPECTED_PAGES
        checks.append('Unified directory search, empty results and clear')
        page.goto(BASE+'/theology-wiki/san-reader.html?page=gaza-coin-proposal')
        page.locator('#wiki-connections #wc-page-filter').wait_for(timeout=60000)
        page.locator('[data-research="load-source"]').click()
        page.locator('#turn-list .chat-turn').first.wait_for(timeout=60000)
        original=page.locator('#source-transcript').inner_text()
        assert original.strip()
        page.locator('#wc-page-filter').fill('zz-not-a-real-topic-zz')
        assert page.locator('#wiki-connections .connection-list li').count()==0
        assert page.locator('#source-transcript').inner_text()==original
        page.locator('#wc-page-filter').fill('')
        more=page.locator('#wiki-connections .connection-list details').first
        assert more.is_visible()
        more.locator(':scope > summary').click()
        assert more.get_attribute('open') is not None
        assert page.locator('#source-transcript').inner_text()==original
        # Other reader extensions rebuild their source card on a page event.
        # Reload actual turns after those events, rather than comparing a placeholder.
        for _ in range(3):page.evaluate("dispatchEvent(new CustomEvent('theology:page',{detail:TheologyReader.current()}))")
        page.wait_for_function("!document.querySelector('#turn-list .chat-turn')")
        page.locator('[data-research="load-source"]').click()
        page.locator('#turn-list .chat-turn').first.wait_for(timeout=60000)
        assert page.locator('#wiki-connections').count()==1
        assert page.locator('#source-transcript').inner_text()==original
        assert page.locator('#source-transcript #wiki-connections').count()==0
        page.locator('#wiki-connections .connection-list a').first.click();page.wait_for_load_state('domcontentloaded');page.go_back();page.locator('#wiki-connections #wc-page-filter').wait_for(timeout=60000)
        checks.append('Loaded archive preserved through filtering, expansion, repeated events and browser Back')
        # A fresh context prevents an already-resolved graph promise from masking races.
        race_context=browser.new_context(service_workers='block');race=race_context.new_page()
        race.on('pageerror',lambda e:errors.append(str(e)))
        held=[]
        race.route('**/connections/data.json',lambda route:held.append(route))
        race.goto(BASE+'/theology-wiki/san-reader.html?page=apocalyptic-repair-theology',wait_until='domcontentloaded')
        race.locator('#wiki-connections .wc-status').wait_for(timeout=60000)
        deadline=time.monotonic()+60
        while not held and time.monotonic()<deadline:race.wait_for_timeout(10)
        assert len(held)==1,'The initial graph request must be held pending'
        race.evaluate("TheologyReader.navigate('gaza-coin-proposal');TheologyReader.navigate('cognitive-gnosticism')")
        race.wait_for_function("TheologyReader.current()?.slug==='cognitive-gnosticism' && document.querySelector('#wiki-connections .wc-status')?.textContent.startsWith('Loading')")
        assert race.locator('#wc-page-filter').count()==0
        assert len(held)==1,'Navigation must reuse the pending graph request'
        held[0].continue_()
        race.locator('#wiki-connections #wc-page-filter').wait_for(timeout=60000)
        assert race.locator('#wiki-connections').count()==1
        final=next(p for p in GRAPH['pages'] if p['id']=='reader:cognitive-gnosticism')
        by_id={p['id']:p for p in GRAPH['pages']}
        targets=[GRAPH['pages'][link[0]] if GRAPH.get('encoding')=='tables-v1' else by_id[link['to']] for link in final['links']]
        expected=[p['url'] if p['url'].startswith('/') else '/theology-wiki/'+p['url'] for p in targets]
        actual=race.locator('#wiki-connections .connection-list > li > a').evaluate_all('(links)=>links.map(a=>a.pathname+a.search+a.hash)')
        assert actual==expected,'Pending graph response rendered stale or incorrect targets'
        race_context.close()
        checks.append('Pending graph request renders exactly the final reader page targets')
        page.locator('#page-search').fill('RPPA');assert page.locator('#wc-unified-search').get_attribute('href').endswith('q=RPPA')
        checks.append('Reader search exposes unified study directory')
        nojs=browser.new_context(java_script_enabled=False);plain=nojs.new_page()
        plain.goto(BASE+'/theology-wiki/rppa-power-20261109/rppa-battles-economic-power-and-gaza.html');assert plain.locator('.wiki-connections .connection-list li').count()>12
        plain.locator('.wiki-connections summary').click();assert plain.locator('.wiki-connections details').get_attribute('open') is not None
        plain.goto(BASE+'/theology-wiki/connections/index.html');assert plain.locator('#wc-directory-list li').count()==EXPECTED_PAGES
        checks.append('Static study and directory usable without JavaScript');nojs.close()
        broken=browser.new_context();failure=broken.new_page();failure.route('**/connections/data.json',lambda route:route.abort())
        failure.goto(BASE+'/theology-wiki/san-reader.html?page=cognitive-gnosticism');failure.locator('#wiki-connections .wc-error').wait_for(timeout=60000)
        assert failure.locator('#wiki-connections a').get_attribute('href').endswith('/connections/index.html')
        checks.append('Data failure retains a usable directory fallback');broken.close()
        assert not errors,errors
        browser.close()
    (OUT/'browser-report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors},indent=2)+'\n')
    print(json.dumps({'passed':len(checks),'errors':errors}))
finally:server.shutdown()
