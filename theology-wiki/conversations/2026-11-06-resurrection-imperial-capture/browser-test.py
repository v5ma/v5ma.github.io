"""Read-only local or live transcript checks, at desktop and phone sizes."""
# Validate only the exact current publication enhancements before source comparison.
import sys
from pathlib import Path
sys.path.insert(0, str(next(p for p in Path(__file__).resolve().parents
    if (p / 'scripts/theology_publication_bytes.py').is_file()) / 'scripts'))
from theology_publication_bytes import source_bytes

import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ROUTE = 'conversations/2026-11-06-resurrection-imperial-capture/index.html'
OUT = Path(os.environ.get('BROWSER_TEST_ARTIFACTS', ROOT / 'browser-test-artifacts'))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def run():
    server = None
    base = os.environ.get('THEOLOGY_BASE_URL')
    if not base:
        server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        base = f'http://127.0.0.1:{server.server_port}/theology-wiki/'
    base = base.rstrip('/') + '/'
    checks = []
    def check(value, label):
        assert value,label
        checks.append(label)
    OUT.mkdir(parents=True,exist_ok=True)
    try:
        with sync_playwright() as p:
            options = {'executable_path':os.environ['BROWSER_EXECUTABLE']} if os.environ.get('BROWSER_EXECUTABLE') else {}
            browser = p.chromium.launch(**options)
            for width, js in [(1440,True),(390,True),(390,False)]:
                context = browser.new_context(viewport={'width':width,'height':900},java_script_enabled=js)
                page = context.new_page()
                errors = []
                page.on('pageerror',lambda e: errors.append(str(e)))
                response = page.goto(base+'latest/index.html')
                check(response.status==200,'Latest HTTP 200')
                check(page.locator('#release-2026-11-06').count()==1,'Earlier release retained')
                page.locator('section[aria-labelledby="release-2026-11-07"] h3 a').click()
                check(page.url==base+ROUTE,'Latest opens the conversation')
                check(page.locator('.turn').count()==17,'All 17 messages rendered')
                check(page.locator('.turn.user').count()==6,'All six user messages rendered')
                check(page.locator('.attachment').count()==2,'Both attachments rendered')
                check(len(page.locator('.transcript').inner_text())>37000,'Complete dialogue is visible')
                check(not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'),'No horizontal overflow')
                for anchor in page.locator('a[href^="#"]').evaluate_all('(aa)=>aa.map(a=>a.hash.slice(1))'):
                    check(page.locator('[id="'+anchor+'"]').count()==1,'Unique anchor '+anchor)
                page.get_by_role('link',name='Imperial pressure within the four Gospels',exact=True).click()
                check(page.url.endswith('#turn-15'),'Clarification permalink works')
                check('Mathew, Mark, Luke, and John.' in page.locator('#turn-15').inner_text(),'Clarification wording preserved')
                page.locator('aside.related').get_by_role('link',name='Early resurrection accounts and source criticism',exact=True).click()
                check(page.url.endswith('/early-resurrection-accounts-and-source-criticism.html'),'Related chapter opens')
                page.go_back()
                check(page.url.endswith('#turn-15'),'Back restores transcript anchor')
                page.go_forward()
                check(page.url.endswith('/early-resurrection-accounts-and-source-criticism.html'),'Forward restores related chapter')
                page.go_back()
                page.get_by_role('link',name='Latest',exact=True).click()
                check(page.url.endswith('/latest/index.html'),'Return to Latest works')
                page.goto(base+ROUTE)
                for name in ['index.html','transcript.json','transcript.md','source-integrity.json','conversation.css']:
                    result = context.request.get(base+ROUTE.replace('index.html',name))
                    check(result.status==200,name+' HTTP 200')
                    check(hashlib.sha256(source_bytes(result.body(),"theology-wiki/"+ROUTE.replace("index.html",name)) if server is None else result.body()).digest()==hashlib.sha256((HERE/name).read_bytes()).digest(),name+' bytes match local release')
                check(not errors,'No JavaScript errors')
                page.screenshot(path=str(OUT/f'conversation-{width}-js-{js}.png'))
                context.close()
            browser.close()
    finally:
        if server:
            server.shutdown()
        (OUT/'conversation-results.json').write_text(json.dumps({'base':base,'passed_checks':checks},indent=2))
    print(f'{len(checks)} transcript browser checks passed: {base}')

if __name__=='__main__':
    run()

