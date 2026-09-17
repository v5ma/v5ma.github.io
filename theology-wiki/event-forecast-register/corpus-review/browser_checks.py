"""Real HTTP checks for the corpus desk. No fetch stubs on the normal path."""
from __future__ import annotations
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--url', help='Hosted corpus-review/index.html URL; otherwise serve the repo locally.')
parser.add_argument('--report', default='/tmp/theology-corpus-browser.json')
parser.add_argument('--screenshot', default='/tmp/theology-corpus-mobile.png')
parser.add_argument('--chromium', help='Optional system Chromium executable.')
args = parser.parse_args()
server = None
if args.url:
    url = args.url
else:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *unused):
            pass
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/theology-wiki/event-forecast-register/corpus-review/index.html'
checks, errors, requests = [], [], []
report = {'scope': 'Real HTTP corpus desk only, not all other wiki readers or evidence of theological truth.', 'tested_url': url}
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chromium or None)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: requests.append(r.url))
        page.goto(url, wait_until='networkidle', timeout=60000)
        page.wait_for_function("document.querySelector('#status').textContent.includes('50 of 50')")
        assert page.locator('#cards article').count() == 20
        assert '92,883' in page.locator('#coverage').inner_text()
        checks.append('The real HTTP reader loads 50 contextual records, 20 per page, and the actual 92,883-record receipt.')
        assert not any('/index-twitter-historical.json' in r or '/index-truth-cnn.json' in r for r in requests)
        checks.append('Neither large metadata index is loaded before an explicit button press.')
        page.click('#next')
        assert 'Page 2 of 3' in page.locator('#page-label').inner_text()
        page.click('#previous')
        assert 'Page 1 of 3' in page.locator('#page-label').inner_text()
        checks.append('Contextual pagination advances and returns.')
        page.select_option('#year', '2016')
        assert page.locator('#cards article').count() == 1
        page.select_option('#platform', 'Twitter')
        assert page.locator('#cards article').count() == 0
        assert 'No contextual records' in page.locator('#cards').inner_text()
        checks.append('Combined filters and the empty-result state work.')
        page.click('#reset')
        page.select_option('#queue', 'attribution-and-media-review')
        assert page.locator('#cards article').count() == 3
        checks.append('Documentary-task filtering isolates attribution and media follow-ups.')
        page.goto(url+'#r-20190821-root')
        page.wait_for_selector('#r-20190821-root')
        assert 'Wayne Allyn Root' in page.locator('#r-20190821-root').inner_text()
        expected = next(r for r in json.loads((HERE/'reviewed.json').read_text())['records'] if r['id']=='r-20190821-root')
        assert page.locator('#r-20190821-root blockquote').text_content() == expected['quote']
        checks.append('A cold deep link resolves to the correct page and preserves quoted-speaker attribution and exact excerpt.')
        page.locator('#r-20190821-root summary').click()
        assert page.locator('#r-20190821-root details').get_attribute('open') is not None
        checks.append('Expanded source and date notes remain accessible.')
        page.click('#reset')
        page.select_option('#order', 'oldest')
        assert page.locator('#cards article').first.get_attribute('id') == 'r-20160721-rescuer'
        checks.append('Chronological sorting places the 2016 record first.')
        page.click('#load-truth')
        page.wait_for_function("document.querySelector('#bulk-status').textContent.includes('36313 of 36313')", timeout=90000)
        assert page.locator('#bulk-cards article').count() == 20
        page.select_option('#bulk-topic', '__no_text')
        page.wait_for_function("document.querySelector('#bulk-status').textContent.startsWith('7246 of')")
        checks.append('The real 36,313-record Truth Social index loads on demand and retains all 7,246 empty-text records.')
        page.select_option('#bulk-topic', '__no_match')
        assert page.locator('#bulk-status').inner_text().startswith('30773 of')
        page.fill('#bulk-query', 'no-such-post-xyz')
        assert page.locator('#bulk-cards article').count() == 0
        checks.append('Metadata nonmatches and the empty search result are preserved.')
        page.click('#load-twitter')
        page.wait_for_function("document.querySelector('#bulk-status').textContent.includes('56570 of 56570')", timeout=90000)
        page.select_option('#bulk-attribution', 'repost')
        assert page.locator('#bulk-status').inner_text().startswith('9876 of')
        checks.append('The real 56,570-record Twitter index loads separately and exposes its 9,876 repost flags.')
        page.click('#bulk-next')
        assert 'Page 2 of' in page.locator('#bulk-page-label').inner_text()
        checks.append('Metadata results are paginated rather than inserted as an unbounded DOM.')
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        page.evaluate('window.scrollTo(0,0)')
        Path(args.screenshot).parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=args.screenshot)
        checks.append('The 390-pixel mobile viewport has no horizontal overflow; screenshot retained.')
        nojs = browser.new_context(java_script_enabled=False)
        fallback = nojs.new_page()
        fallback.goto(url)
        assert fallback.locator('noscript').is_visible()
        assert fallback.locator('a[href="reviewed.json"]').count() >= 1
        checks.append('No-JavaScript readers retain source-file links.')
        failed = browser.new_page()
        failed.route('**/reviewed.json', lambda route: route.abort())
        failed.goto(url)
        failed.wait_for_function("document.querySelector('#status').textContent.includes('could not be loaded')")
        assert failed.locator('a[href="reviewed.json"]').count() >= 1
        checks.append('An intentionally blocked data request leaves readable fallback links and a clear error.')
        assert not errors, errors
        checks.append('The normal HTTP interaction sequence raised no page JavaScript errors.')
        browser.close()
    report.update(status='passed',check_count=len(checks),checks=checks)
except Exception as exc:
    report.update(status='failed',check_count=len(checks),checks=checks,error=type(exc).__name__+': '+str(exc))
    raise
finally:
    Path(args.report).parent.mkdir(parents=True,exist_ok=True)
    Path(args.report).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    if server: server.shutdown()
