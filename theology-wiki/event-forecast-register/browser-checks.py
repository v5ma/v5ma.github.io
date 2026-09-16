"""Check this additive reader over HTTP using Python Playwright and Chromium."""
import argparse
import functools
import http.server
import json
import threading
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', help='Full hosted index.html URL; otherwise start a local server.')
parser.add_argument('--report', default='browser-report.json')
parser.add_argument('--screenshot')
parser.add_argument('--chromium', help='Optional system Chromium executable.')
args = parser.parse_args()
root = Path(__file__).resolve().parent
server = None
if args.url:
    url = args.url
else:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *unused):
            pass
    handler = functools.partial(QuietHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/index.html'
checks = []
errors = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chromium or shutil.which('chromium') or None)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(url)
        page.wait_for_function("document.querySelector('#event-cards').children.length===22")
        assert page.locator('#statement-cards article').count() == 4
        assert page.locator('#scenario-cards article').count() == 6
        checks.append('All 22 events, four supplied statements and six scenarios render.')
        page.select_option('#year', '2016')
        assert page.locator('#event-cards article').count() == 1
        checks.append('The year filter returns the expected event.')
        page.select_option('#year', '2026')
        page.select_option('#passage', 'access')
        assert page.locator('#event-cards article').count() == 2
        checks.append('Combined year and passage filters preserve both scoped fuel records.')
        page.fill('#query', 'no-such-register-entry-xyz')
        assert page.locator('#event-cards article').count() == 0
        assert 'No events match' in page.locator('#event-cards').inner_text()
        checks.append('An empty search displays an explicit result.')
        page.click('#reset')
        assert page.locator('#event-cards article').count() == 22
        checks.append('Reset restores the whole chronology.')
        originals = json.loads((root / 'forecasts.json').read_text())['author_statements']
        for r in originals:
            assert page.locator('#'+r['id']+' .quotation').text_content() == r['verbatim_text']
        checks.append('Displayed author statements match the exact canonical text.')
        page.goto(url.split('#')[0]+'#w-scarcity-access')
        page.wait_for_function("document.querySelector('#w-scarcity-access') !== null")
        assert page.locator('#w-scarcity-access').is_visible()
        checks.append('A cold direct link resolves to the prospective record.')
        page.set_viewport_size({'width': 390, 'height': 844})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        if args.screenshot:
            page.goto(url)
            page.wait_for_function("document.querySelector('#event-cards').children.length===22")
            page.screenshot(path=args.screenshot)
        checks.append('The 390-pixel layout has no horizontal overflow.')
        nojs = browser.new_context(java_script_enabled=False)
        fallback = nojs.new_page()
        fallback.goto(url)
        assert fallback.locator('noscript').is_visible()
        assert fallback.locator('a[href="events.json"]').count() == 1
        checks.append('The no-JavaScript version links complete source files.')
        failed = browser.new_page()
        failed.route('**/events.json', lambda route: route.abort())
        failed.goto(url)
        failed.wait_for_function("document.querySelector('#status').textContent.includes('could not be loaded')")
        assert failed.locator('a[href="forecasts.json"]').count() == 1
        checks.append('Data failure leaves a visible message and readable file links.')
        assert not errors, errors
        checks.append('No page errors occurred during the normal interaction tests.')
        browser.close()
    report = {'status': 'passed', 'checks': checks, 'check_count': len(checks),
              'tested_url': url, 'browser': 'Playwright Chromium',
              'scope': 'Additive event-forecast reader only; no claim about legacy wiki, physical devices or theological validity.'}
    Path(args.report).write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))
finally:
    if server:
        server.shutdown()
