"""Verify the small archive correction in the real reader, locally or on Pages."""
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import threading
import time
import urllib.request
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SLUG = 'gmirkin-hellenistic-bible-theory'
EXPECTED = 'b63722ad06e4df6be3b663e5267e8f50ace76eafd646319fb3c5cd8996040509'
OUT = ROOT / 'browser-test-artifacts' / 'archive-context'
OUT.mkdir(parents=True, exist_ok=True)
base = os.environ.get('ARCHIVE_CONTEXT_BASE', '').rstrip('/')
server = None
if not base:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
else:
    # Wait for this exact script rather than treating an older successful deployment as verification.
    expected_script = (ROOT / 'theology-wiki/assets/js/research-tools.js').read_bytes()
    token = hashlib.sha256(expected_script).hexdigest()[:16]
    end = time.monotonic() + 600
    while True:
        try:
            url = base + '/theology-wiki/assets/js/research-tools.js?archive-context=' + token
            with urllib.request.urlopen(url, timeout=30) as response:
                assert response.read() == expected_script, 'The corrected script is not live yet'
            for entry in ['index.html', 'san-reader.html']:
                with urllib.request.urlopen(base + '/theology-wiki/' + entry + '?archive-context=' + token, timeout=30) as response:
                    assert ('research-tools.js?v=' + token) in response.read().decode()
            break
        except Exception:
            if time.monotonic() >= end:
                raise
            time.sleep(10)

results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_PATH'))
        for entry, width in [('san-reader.html', 1440), ('index.html', 1440), ('san-reader.html', 390)]:
            context = browser.new_context(viewport={'width': width, 'height': 900})
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            def visit(slug):
                page.goto(base + '/theology-wiki/' + entry + '?page=' + slug, wait_until='domcontentloaded')
                page.wait_for_function('(s) => window.TheologyReader?.current()?.slug === s', arg=slug)
                page.wait_for_function('document.querySelector("#theology-status")?.textContent.endsWith(" loaded.")')
            visit(SLUG)
            note = page.locator('#gmirkin-editorial-footnote')
            assert note.count() == 1 and note.is_visible()
            assert 'contested minority hypothesis' in note.inner_text()
            assert note.locator('a').count() == 3
            page.locator('[data-research="load-source"]').click()
            page.locator('#turn-list .chat-turn').first.wait_for()
            assert page.locator('#turn-list .chat-turn').count() == 4
            assert note.count() == 1 and note.is_visible()
            assert page.locator('#source-transcript .archive-link-context').count() == 0
            source_url = base + '/theology-sources/chats/gpt2026dragon1089_Gmirkin_Hellenistic_Bible_Theory.txt'
            original = context.request.get(source_url)
            assert original.ok and hashlib.sha256(original.body()).hexdigest() == EXPECTED
            assert page.locator('#research-backlinks a').count() == 3
            page.screenshot(path=str(OUT / f'{entry}-{width}.png'), full_page=True)
            # Existing incoming topic/cluster links are contextualized, not multiplied.
            for slug in ['topic-origins', 'theology-theology-gnostic-gnosticism-jesus-god-cluster']:
                visit(slug)
                links = page.locator('#article-body a[data-page="' + SLUG + '"]')
                assert links.count() >= 1, slug
                for link in links.all():
                    assert link.locator('.archive-link-context').count() == 1, slug
            # Actual all-page search and navigation still lead to the archive.
            page.select_option('#theology-kind', 'all')
            page.locator('#page-search').fill('Gmirkin')
            result = page.locator('#page-list a.page-link[data-page="' + SLUG + '"]')
            result.wait_for()
            page.wait_for_function('document.querySelector("#search-scope")?.textContent.includes("complete source conversations")')
            result.click()
            note.wait_for()
            assert note.count() == 1
            page.evaluate("window.TheologyReader.navigate('topic-origins');window.TheologyReader.navigate('" + SLUG + "')")
            page.wait_for_function('(s) => window.TheologyReader.current().slug === s && document.querySelectorAll("#gmirkin-editorial-footnote").length === 1', arg=SLUG)
            page.wait_for_timeout(300)
            assert note.count() == 1
            if width == 390:
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Mobile overflow'
            assert not errors, errors
            results.append({'entry': entry, 'width': width, 'original_sha256': EXPECTED, 'result': 'passed'})
            context.close()
        browser.close()
    (OUT / 'results.json').write_text(json.dumps({'base': base, 'checks': results}, indent=2) + '\n')
    print(json.dumps({'base': base, 'checks': results}))
finally:
    if server:
        server.shutdown()
