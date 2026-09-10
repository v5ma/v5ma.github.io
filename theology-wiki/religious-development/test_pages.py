"""Read-only static, browser, and public-origin checks for the supplement."""
from __future__ import annotations
import argparse
from functools import partial
from hashlib import sha256
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import threading
import time
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
OUT = Path.cwd() / 'theology-bridge-test-output'
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

def require(condition, message):
    if not condition:
        raise ValueError(message)

def normalized(value):
    return re.sub(r'\s+', ' ', value).strip()

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.stack, self.active = [], [], [], []
        self.text, self.h1, self.title = [], [], []
        self.h1_count, self.lang, self.viewport = 0, None, False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in VOID:
            self.stack.append(tag)
        if tag == 'html': self.lang = a.get('lang')
        if tag == 'h1': self.h1_count += 1
        if tag == 'meta' and a.get('name') == 'viewport': self.viewport = True
        if 'id' in a: self.ids.append(a['id'])
        if 'href' in a: self.links.append(a['href'])
        if tag in {'script','iframe','object','embed','form','base'} or any(k.startswith('on') for k in a):
            self.active.append(tag)
    def handle_endtag(self, tag):
        require(self.stack and self.stack[-1] == tag, 'Unbalanced HTML tag: ' + tag)
        self.stack.pop()
    def handle_data(self, data):
        self.text.append(data)
        if 'h1' in self.stack: self.h1.append(data)
        if 'title' in self.stack: self.title.append(data)

def static_checks():
    manifests = [json.loads((ROOT / name).read_text(encoding='utf-8'))
                 for name in ('sources.json','bridge-sources.json')]
    rows = [row for manifest in manifests for row in manifest['pages']]
    names = [row['path'] for row in rows]
    require(len(names) == len(set(names)) == 15, 'Expected fifteen unique pages')
    require(set(names) == {p.name for p in ROOT.glob('*.html')}, 'Unindexed or missing HTML')
    sources = [s for m in manifests for s in m['sources'].values()]
    source_urls = {s['url'] for s in sources}
    require(len(sources) == len(source_urls), 'Duplicate source URL')
    for source in sources:
        u = urlsplit(source['url'])
        require(u.scheme == 'https' and u.netloc and not u.username and not u.password,
                'Unsafe source URL')
        require(source.get('title') and source.get('scope'), 'Missing source scope')
    parsed = {}
    for row in rows:
        page = Page()
        page.feed((ROOT / row['path']).read_text(encoding='utf-8'))
        page.close()
        require(not page.stack, 'Unclosed tags: ' + row['path'])
        require(page.lang == 'en' and page.viewport and page.title, 'Missing page metadata')
        require(page.h1_count == 1 and normalized(''.join(page.h1)) == row['title'],
                'Title mismatch: ' + row['path'])
        require(len(page.ids) == len(set(page.ids)), 'Duplicate IDs: ' + row['path'])
        require({'main','sources'} <= set(page.ids), 'Missing main/source target')
        require(not page.active, 'Unexpected active content')
        parsed[row['path']] = page
    main_index = ROOT.parent / 'data' / 'page-index.json'
    known_slugs = None
    if main_index.exists():
        known_slugs = {p['slug'] for p in json.loads(main_index.read_text(encoding='utf-8-sig'))}
    links_checked = 0
    for name, page in parsed.items():
        for href in page.links:
            u = urlsplit(href)
            if u.scheme or u.netloc:
                canonical = 'https://v5ma.github.io/theology-wiki/religious-development/'
                require(u.scheme == 'https' and not u.username and not u.password, href)
                require(href in source_urls or (href.startswith(canonical) and u.path.split('/')[-1] in parsed),
                        'Unregistered external source: ' + href)
            elif u.path == '../san-reader.html':
                query = parse_qs(u.query)
                require(set(query) <= {'page'}, 'Unexpected reader query')
                if query.get('page') and known_slugs is not None:
                    require(query['page'][0] in known_slugs, 'Missing main reader destination: ' + href)
            else:
                require(not u.query, 'Unexpected local query: ' + href)
                target = (ROOT / (u.path or name)).resolve()
                require(target.parent == ROOT and target.is_file(), 'Missing or unsafe local target: ' + href)
                if u.fragment:
                    require(target.name in parsed and u.fragment in parsed[target.name].ids,
                            'Missing local fragment: ' + href)
            links_checked += 1
        require('index.html' in page.links, 'Missing series return: ' + name)
    hub_links = {urlsplit(h).path for h in parsed['index.html'].links}
    require(set(names) <= hub_links, 'Entrance does not reach every page')
    evidence = normalized(' '.join(parsed['bridge-evidence.html'].text))
    for position in manifests[1]['author_positions']:
        require(normalized(position['quote']) in evidence, 'Author statement changed: ' + position['id'])
    passages = {'genesis','exodus','leviticus','numbers','deuteronomy','joshua','judges',
                'samuel','kings','jeremiah','ezekiel','song','ruth','lamentations'}
    require(passages <= set(parsed['ancient-mysticism-and-textual-evidence.html'].ids),
            'Incomplete fourteen-book passage review')
    entrance = ROOT.parent / 'index.html'
    if entrance.exists():
        require('./religious-development/index.html' in entrance.read_text(encoding='utf-8'),
                'Parent entrance link missing')
    report = {'result':'passed','html_pages':len(names),'source_records':len(sources),
              'links_checked':links_checked,'selected_biblical_units':len(passages),
              'author_statements':len(manifests[1]['author_positions']),
              'principal_reader_destinations_checked':known_slugs is not None,'active_content':0}
    return rows, report

def public_checks(base, rows):
    require(base == 'https://v5ma.github.io/theology-wiki/religious-development/',
            'Public check is restricted to the actual project origin')
    files = sorted({r['path'] for r in rows} | {'series.css','sources.json','bridge-sources.json'})
    expected = {name:sha256((ROOT / name).read_bytes()).hexdigest() for name in files}
    last = []
    for attempt in range(1, 61):
        last = []
        for name in files:
            url = urljoin(base, name) + '?bridge=' + expected[name][:16]
            try:
                request = Request(url, headers={'Cache-Control':'no-cache','User-Agent':'TheologyBridgeVerifier/2'})
                with urlopen(request, timeout=20) as response:
                    body = response.read()
                    require(response.status == 200, 'HTTP status ' + str(response.status))
                digest = sha256(body).hexdigest()
                if digest != expected[name]: last.append({'file':name,'actual_sha256':digest})
            except Exception as error:
                last.append({'file':name,'error':str(error)})
        if not last:
            return {'result':'passed','base':base,'attempt':attempt,'matched_files':len(files),'sha256':expected}
        print(json.dumps({'public_attempt':attempt,'pending':last}), flush=True)
        if attempt < 60: time.sleep(10)
    raise RuntimeError('Public files did not match committed source: ' + json.dumps(last))

def browser_checks(base, rows, label):
    from playwright.sync_api import sync_playwright
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for width, height in ((1366,900),(390,844)):
                context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=1)
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                for row in rows:
                    response = page.goto(urljoin(base,row['path']), wait_until='networkidle', timeout=45000)
                    require(response and response.status == 200, 'Browser request failed: ' + row['path'])
                    require(page.locator('h1').inner_text() == row['title'], 'Browser title mismatch')
                    require(page.locator('main').is_visible(), 'Main content hidden')
                    require(page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
                            'Horizontal overflow: ' + row['path'])
                    require(not errors, 'Browser errors: ' + repr(errors))
                    page.screenshot(path=str(OUT / (label+'-'+str(width)+'-'+row['path']+'.png')), full_page=True)
                    results.append({'page':row['path'],'width':width,'result':'passed'})
                page.goto(urljoin(base,'index.html'), wait_until='networkidle')
                page.locator('a[href="natural-causation-and-prayer.html"]').click()
                require(page.url.endswith('/natural-causation-and-prayer.html'), 'Entrance navigation failed')
                page.locator('a[href="index.html"]').first.click()
                require(page.url.endswith('/index.html'), 'Return navigation failed')
                context.close()
        finally:
            browser.close()
    return {'result':'passed','origin':base,'render_checks':results,'navigation_checks':4}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('--public-base')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'scope':'Static supplement; no full upstream build or scholarly certification claimed'}
    try:
        rows, report['static'] = static_checks()
        if args.browser:
            class QuietHandler(SimpleHTTPRequestHandler):
                def log_message(self, *args): pass
            server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                base = 'http://127.0.0.1:' + str(server.server_address[1]) + '/'
                report['local_browser'] = browser_checks(base,rows,'local')
            finally:
                server.shutdown()
                server.server_close()
                thread.join()
        if args.public_base:
            report['public'] = public_checks(args.public_base,rows)
            if args.browser:
                report['public_browser'] = browser_checks(args.public_base,rows,'public')
        report['result'] = 'passed'
    except Exception as error:
        report['result'] = 'failed'
        report['error'] = str(error)
        raise
    finally:
        (OUT / 'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(report,indent=2),flush=True)

if __name__ == '__main__':
    main()
