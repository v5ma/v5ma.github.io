"""Source checks and real-HTTP browser checks for the neutral technology study."""
import hashlib, json, os, re, subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
PAGE = ROOT / 'theology-wiki/technology-signs.html'
OUT = ROOT / 'theology-signs-test-output'
OUT.mkdir(exist_ok=True)
checks = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)
    print('PASS', name, flush=True)

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []; self.links = []; self.cases = []; self.scripts = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag == 'a': self.links.append(a)
        if tag == 'article' and 'case' in a.get('class', '').split(): self.cases.append(a)
        if tag == 'script': self.scripts.append(a)

text = PAGE.read_text()
doc = Document(); doc.feed(text)
check('unique element identities', len(doc.ids) == len(set(doc.ids)))
check('fifteen individually addressable cases', len(doc.cases) == 15)
check('sixteen external source records', len([i for i in doc.ids if i.startswith('src-')]) == 16)
check('case classification is explicit', all(c['data-kind'] in {'Text','Record','Hypothesis'} for c in doc.cases))
check('all local anchors resolve', all(a['href'][1:] in doc.ids for a in doc.links if a.get('href','').startswith('#')))
check('external citations use public HTTPS', all(urlparse(a['href']).scheme == 'https' and not urlparse(a['href']).username for a in doc.links if '://' in a.get('href','')))
check('external links isolate their opener', all('noopener' in a.get('rel','') for a in doc.links if a.get('target') == '_blank'))
check('no external scripts or embedded political media', all(not a.get('src') for a in doc.scripts) and '<iframe' not in text and '<img' not in text)
check('no numeric politician assessments are generated', not re.search(r'personId|fitTotal|evidenceCoverage|function\s+rank|\bscore\s*:', text))
check('unverified enhancement stays a hypothesis', any(c['id']=='enhancement' and c['data-kind']=='Hypothesis' for c in doc.cases))
check('survival and audience response have separate records', {'wound','audience'} <= set(doc.ids))
check('all five named launch records exist', {'new-shepard','falcon','new-glenn','long-march','zhuque'} <= set(doc.ids))
check('unknown dates remain unassigned', all(not c['data-date'] for c in doc.cases if c['data-kind'] != 'Record'))
script = re.search(r'<script>(.*?)</script>', text, re.S).group(1)
check('no storage or runtime network writes', not re.search(r'localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon', script))
inline = OUT / 'inline-syntax.js'; inline.write_text(script)
subprocess.run(['node','--check',str(inline)], check=True)
check('inline script syntax', True)
nav = (ROOT/'theology-wiki/assets/js/depth-tools.js').read_text()
check('single additive link in existing reader shell', nav.count('id="technology-signs-link"') == 1 and 'href="./technology-signs.html"' in nav)

if os.environ.get('SOURCE_ONLY') != '1':
    from playwright.sync_api import sync_playwright, expect
    origin = os.environ.get('SITE_ORIGIN','http://127.0.0.1:4174').rstrip('/')
    address = origin + '/theology-wiki/technology-signs.html'
    errors = []; requests = []
    with sync_playwright() as pw:
        args = {'headless':True}
        if os.environ.get('CHROMIUM'): args['executable_path'] = os.environ['CHROMIUM']
        browser = pw.chromium.launch(**args)
        ctx = browser.new_context(viewport={'width':1440,'height':1000}, accept_downloads=True)
        page = ctx.new_page(); page.set_default_timeout(15000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        try:
            page.goto(address,wait_until='domcontentloaded')
            page.wait_for_selector('body[data-ready="true"]')
            check('native page begins with complete cases', page.locator('.case:visible').count()==15)
            page.screenshot(path=str(OUT/'study-desktop.png'),full_page=True)
            page.locator('#topic').select_option('rockets')
            check('topic filter selects six rocket/text records', page.locator('.case:visible').count()==6)
            page.locator('#kind').select_option('Record')
            check('type and topic filters compose', page.locator('.case:visible').count()==5)
            page.locator('#query').fill('Zhuque')
            check('search composes with filters', page.locator('.case:visible').count()==1)
            page.reload(); page.wait_for_selector('body[data-ready="true"]')
            check('URL filters survive reload', page.locator('.case:visible').count()==1 and page.locator('#query').input_value()=='Zhuque')
            page.locator('#expand').click()
            check('source disclosure expands through the actual button', page.locator('#zhuque details').evaluate('(d)=>d.open'))
            with page.expect_download() as dl: page.locator('#export').click()
            exported = OUT/'subset.json'; dl.value.save_as(exported)
            value = json.loads(exported.read_text())
            check('real subset export contains the selected case', len(value['records'])==1 and value['records'][0]['id']=='zhuque')
            check('export retains all sixteen source scopes and author note', len(value['sources'])==16 and 'Micah Blumberg' in value['authorProposal'])
            before = page.locator('.case').evaluate_all('(xs)=>xs.map(x=>[x.id,x.hidden,x.querySelector("details").open])')
            page.evaluate('window.dispatchEvent(new Event("beforeprint"))')
            check('print preparation reveals every case and disclosure', page.locator('.case:visible').count()==15 and page.locator('.case details[open]').count()==15)
            page.evaluate('window.dispatchEvent(new Event("afterprint"))')
            after = page.locator('.case').evaluate_all('(xs)=>xs.map(x=>[x.id,x.hidden,x.querySelector("details").open])')
            check('print completion restores previous view', before==after)
            page.locator('#reset').click()
            page.locator('#query').fill('<img src=x onerror=alert(1)>')
            check('untrusted search remains text and produces empty state', page.locator('#empty').is_visible() and page.locator('img').count()==0)
            page.locator('#reset').click()
            with page.expect_download() as dl: page.locator('#export').click()
            exported = OUT/'technology-signs-evidence.json'; dl.value.save_as(exported)
            value = json.loads(exported.read_text())
            check('full export preserves all cases and unknown dates', len(value['records'])==15 and next(r for r in value['records'] if r['id']=='war')['eventDate'] is None)
            valid={s['id'] for s in value['sources']}|{'request'}
            check('exported source references resolve', all(set(r['sourceIds'])<=valid for r in value['records']))
            page.goto(address+'?topic=rockets#enhancement',wait_until='domcontentloaded')
            page.wait_for_selector('body[data-ready="true"]')
            check('record deep link reveals a filtered-out hypothesis', page.locator('#enhancement').is_visible() and page.locator('#enhancement details').evaluate('(d)=>d.open'))
            page.goto(address+'?topic=invalid&kind=invalid#%E0%A4%A',wait_until='domcontentloaded')
            page.wait_for_selector('body[data-ready="true"]')
            check('invalid filters and malformed hash do not break the study', page.locator('.case:visible').count()==15)
            page.set_viewport_size({'width':390,'height':844})
            check('mobile document stays inside viewport', page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            page.screenshot(path=str(OUT/'study-mobile.png'),full_page=True)
            check('study itself made no third-party requests', all(urlparse(u).netloc==urlparse(origin).netloc for u in requests))
            check('study interactions produced no script errors', not errors)
            # Full repository required for both reader integrations. Local partial fixture may omit this.
            if os.environ.get('CHECK_WIKI','1')=='1':
                for entry in ['san-reader.html','index.html']:
                    page.goto(origin+'/theology-wiki/'+entry,wait_until='domcontentloaded')
                    page.locator('#technology-signs-link').wait_for()
                    check(entry+' contains one actual study link',page.locator('#technology-signs-link').count()==1)
                    page.locator('#technology-signs-link').click()
                    page.wait_for_selector('body[data-ready="true"]')
                    check(entry+' opens the published study',page.locator('.case:visible').count()==15)
            nojs=browser.new_context(java_script_enabled=False)
            p=nojs.new_page();p.goto(address,wait_until='domcontentloaded')
            check('JavaScript-disabled browser retains all text and sources',p.locator('.case').count()==15 and p.locator('#source-register .source[id^="src-"]').count()==16)
            nojs.close()
            denied=browser.new_context();denied.add_init_script("history.replaceState=function(){throw Error('denied')}")
            p=denied.new_page();p.goto(address,wait_until='domcontentloaded');p.wait_for_selector('body[data-ready="true"]')
            p.locator('#topic').select_option('media')
            check('denied history writes retain usable filters',p.locator('.case:visible').count()==1)
            denied.close()
        finally:
            (OUT/'report.json').write_text(json.dumps({'origin':origin,'checks':checks,'count':len(checks),'runtimeErrors':errors,'integrationTested':os.environ.get('CHECK_WIKI','1')=='1'},indent=2))
            browser.close()
else:
    (OUT/'source-report.json').write_text(json.dumps({'checks':checks,'count':len(checks)},indent=2))
