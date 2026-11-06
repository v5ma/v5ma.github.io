"""Focused release QA. Run from any directory after installing Playwright Chromium."""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ.get('BROWSER_TEST_ARTIFACTS', ROOT / 'browser-test-artifacts'))
SECTIONS = [('jesus-ethics-20261105', 'mercy', ['new', 'companion']),
            ('prophecy-patterns-20261105', 'pattern', ['chapter', 'research'])]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def run():
    OUT.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/theology-wiki/'
    checks, failures = [], []
    page = None
    label = 'startup'

    def require(condition, message):
        assert condition, message
        checks.append(message)

    def load(url):
        response = page.goto(url)
        require(response is not None and response.status == 200, f'HTTP 200: {url}')

    def anchors():
        ids = page.locator('a[href^="#"]').evaluate_all('(aa)=>aa.map(a=>a.hash.slice(1))')
        for anchor in ids:
            require(page.evaluate('(id)=>!!document.getElementById(id)', unquote(anchor)), f'Anchor exists: {anchor}')
            link = page.locator('a[href="#' + anchor + '"]').first
            link.focus()  # Reveal keyboard-only skip links before clicking.
            link.click()
            require(unquote(urlsplit(page.url).fragment) == unquote(anchor), f'Anchor navigates: {anchor}')

    def overflow():
        require(not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), f'No horizontal overflow: {page.url}')

    pw = None
    browser = None
    try:
        pw = sync_playwright().start()
        if pw:
            browser = pw.chromium.launch()
            for width in [1440, 390]:
                context = browser.new_context(viewport={'width': width, 'height': 900})
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                for entry in ['index.html', 'san-reader.html?page=home']:
                    label = f'{width}-entry-{entry.split(".")[0]}'
                    load(base + entry)
                    page.get_by_role('link', name='Latest', exact=True).first.click()
                    require(urlsplit(page.url).path.endswith('/latest/index.html'), 'Main reader Latest navigation')
                label = f'{width}-latest'
                load(base + 'latest/index.html')
                anchors()
                links = page.locator('section[aria-labelledby="release-2026-11-06"] h3 a')
                require(links.count() == 6, 'Six November release links')
                hrefs = links.evaluate_all('(aa)=>aa.map(a=>a.href)')
                overflow()
                for i, href in enumerate(hrefs):
                    label = f'{width}-chapter-{i}'
                    load(base + 'latest/index.html')
                    page.locator('section[aria-labelledby="release-2026-11-06"] h3 a').nth(i).click()
                    require(page.url == href, f'Latest chapter link {i} navigates')
                    require(page.locator('article.prose').inner_text().__len__() > 3000, f'Complete chapter {i}')
                    anchors()
                    overflow()
                    page.get_by_role('link', name='Latest', exact=True).first.click()
                    require(urlsplit(page.url).path.endswith('/latest/index.html'), 'Chapter returns to Latest')
                for section, word, scopes in SECTIONS:
                    label = f'{width}-{section}-search'
                    url = base + section + '/index.html'
                    load(url)
                    anchors()
                    overflow()
                    page.locator('#query').fill(word)
                    require(page.locator('.result').count() > 0, 'Normal search results')
                    for scope in scopes:
                        page.locator('#scope').select_option(scope)
                        count = page.locator('.result').count()
                        data_name = 'ETHICS_SEARCH' if section.startswith('jesus') else 'PROPHECY_SEARCH'
                        expected = page.evaluate('([name,word,scope])=>window[name].filter(r=>r.kind===scope && (r.title+" "+r.heading+" "+r.text).toLowerCase().includes(word)).length', [data_name,word,scope])
                        require(count == expected and count > 0, f'Filtered results: {scope}')
                        page.reload()
                        require(page.locator('#query').input_value() == word and page.locator('#scope').input_value() == scope and page.locator('.result').count() == count, 'Reload retains query, filter, results')
                    overflow()
                    page.locator('.result a').first.click()
                    require(not urlsplit(page.url).path.endswith('index.html'), 'Search result navigates to article')
                    page.go_back()
                    require(page.locator('#query').input_value() == word and page.locator('#scope').input_value() == scopes[-1], 'Back restores search')
                    page.go_forward()
                    require(not urlsplit(page.url).path.endswith('index.html'), 'Forward restores article')
                    page.go_back()
                    page.locator('#query').fill('zzqnonexistent983')
                    require(page.locator('.result').count() == 0 and 'No matching' in page.locator('#search-status').inner_text(), 'No-result message')
                    page.locator('#reset').click()
                    require(page.locator('#query').input_value() == '' and page.locator('#scope').input_value() == '' and not urlsplit(page.url).query, 'Reset clears query/filter/URL')
                    page.locator('#query').fill('<img src=x onerror="window.__xss=1"> [.*]')
                    require(page.evaluate('window.__xss === undefined') and page.locator('#search-results img, #search-results script').count() == 0, 'XSS and regex input stays literal')
                    page.reload()
                    require(page.evaluate('window.__xss === undefined'), 'Reloaded XSS query stays literal')
                    page.locator('#reset').click()
                require(not errors, f'No JavaScript errors at width {width}: {errors}')
                context.close()
            context = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':900})
            page = context.new_page()
            paths = ['latest/index.html'] + [str(f.relative_to(ROOT/'theology-wiki')) for section,_,_ in SECTIONS for f in sorted((ROOT/'theology-wiki'/section).glob('*.html'))]
            for i,path in enumerate(paths):
                label = f'no-js-{i}'
                load(base + path)
                require(len(page.locator('main').inner_text()) > 1000, f'No-JS readable: {path}')
                anchors()
                overflow()
                if path.endswith('/index.html') and not path.startswith('latest/'):
                    require('Search needs JavaScript' in page.locator('noscript').inner_text(), 'No-JS search explanation')
            browser.close()
    except Exception as error:
        failures.append(f'{label}: {type(error).__name__}: {error}')
        if page is not None:
            try:
                page.screenshot(path=str(OUT / f'{label}.png'), full_page=True)
                (OUT / f'{label}.html').write_text(page.content())
            except Exception as evidence_error:
                failures.append(f'Evidence capture failed: {evidence_error}')
        raise
    finally:
        if browser is not None:
            browser.close()
        if pw is not None:
            pw.stop()
        server.shutdown()
        (OUT / 'results.json').write_text(json.dumps({'passed_checks': checks, 'failures': failures}, indent=2))
        print(f'{len(checks)} checks passed; {len(failures)} failures. Evidence: {OUT}')

if __name__ == '__main__':
    run()
