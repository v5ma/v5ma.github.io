"""Read-only source checks plus actual-origin Chromium acceptance for reception history."""
import argparse, hashlib, json, os, re, subprocess
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'theology-reception-proof'
OUT.mkdir(exist_ok=True)
DATA = ROOT / 'theology-wiki/reception/study.json'
PAGE = ROOT / 'theology-wiki/reception-history.html'
checks = []
def check(name, ok):
    if not ok: raise AssertionError(name)
    checks.append(name)
    print('PASS', name, flush=True)
class Tags(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.scripts=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='script' and 'src' in a: self.scripts.append(a['src'])
def source_checks():
    d=json.loads(DATA.read_text()); h=PAGE.read_text(); t=Tags(); t.feed(h)
    check('selected edition and scope are explicit', d['version']=='2026-09-08-reception-1' and 'unchanged' in d['scope'])
    check('thirteen evidence records and twelve source records', len(d['records'])==13 and len(d['sources'])==12)
    for key in ['records','sources','tasks']:
        ids=[r['id'] for r in d[key]]
        check(key+' identities are unique and safe', len(ids)==len(set(ids)) and all(re.fullmatch('[a-zA-Z0-9-]+',i) for i in ids))
    sources={s['id']:s for s in d['sources']}
    check('all evidence citations resolve',all(r['sourceIds'] and all(i in sources for i in r['sourceIds']) for r in d['records']))
    check('every record retains contribution and countercase',all(r['observation'] and r['contribution'] and r['countercase'] and r['next'] for r in d['records']))
    check('sources retain access and https addresses',all(s['access'] and s['family'] and urlparse(s['url']).scheme=='https' and not urlparse(s['url']).username for s in d['sources']))
    check('dependent poll reports retain one source family',sources['ipsos-pdf']['family']==sources['ipsos-release']['family'])
    diary=next(r for r in d['records'] if r['id']=='reagan-prayer')
    check('composite diary does not manufacture a writing date', diary['dateEnd']=='1981-04-11' and sources['reagan-diary']['date'] is None)
    p=d['survey']
    check('percentages retain correct survey denominators',p['sample']==1202 and p['republicanSample']==361 and [(i['overall'],i['republican']) for i in p['items']]==[(78,91),(33,66)])
    check('separate polls not falsely treated as one cohort','Different dates' in next(r for r in d['records'] if r['id']=='poll-accountability')['countercase'])
    check('full argument and source guide survive without scripts','The relation, not just the resemblance' in h and 'Reagan diary transcription' in h and len(h)>10000)
    check('static IDs unique and script same-origin',len(t.ids)==len(set(t.ids)) and all(u.startswith('./reception/') for u in t.scripts))
    js=(ROOT/'theology-wiki/reception/study.js').read_text()
    check('no account or storage writes in new runtime',not re.search(r'localStorage|sessionStorage|\beval\(|https://.*fetch',js))
    subprocess.run(['node','--check',str(ROOT/'theology-wiki/reception/study.js')],check=True)
    check('JavaScript syntax passes',True)
    check('workbook links to the new dossier','reception-history.html' in (ROOT/'theology-wiki/role-workbook.html').read_text())
    check('reader navigation exposes reception history','id="reception-history-link"' in (ROOT/'theology-wiki/assets/js/depth-tools.js').read_text())
    (OUT/'source-checks.json').write_text(json.dumps(checks,indent=2))
def browser_checks():
    from playwright.sync_api import sync_playwright, expect
    origin=os.environ.get('SITE_ORIGIN','http://127.0.0.1:4174').rstrip('/')
    url=origin+'/theology-wiki/reception-history.html'; errors=[]
    with sync_playwright() as pw:
        args={'headless':True}
        if os.environ.get('CHROMIUM'):args['executable_path']=os.environ['CHROMIUM']
        b=pw.chromium.launch(**args);c=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);p=c.new_page();p.set_default_timeout(20000)
        p.on('pageerror',lambda e:errors.append(str(e)))
        def ready(extra=''):
            p.goto(url+extra,wait_until='domcontentloaded');p.wait_for_selector('body[data-reception-ready=true]')
        try:
            ready();check('native page loads thirteen cards',p.locator('.rx-card').count()==13)
            check('twelve access notes are visible',p.locator('.rx-source').count()==12)
            check('denominators displayed with survey values','N=1202' in p.locator('#rx-survey-body').inner_text() and '66%' in p.locator('#rx-survey-body').inner_text())
            check('eight questions are compared without invented steps',p.locator('.rx-compare tbody tr').count()==8 and 'Not established' in p.locator('#rx-comparison-body').inner_text())
            p.screenshot(path=str(OUT/'desktop.png'),full_page=True)
            p.locator('#rx-person').select_option('trump');check('case filter displays eight Trump records',p.locator('.rx-card').count()==8)
            p.locator('#rx-stage').select_option('providence');check('two providence records compose with case filter',p.locator('.rx-card').count()==2)
            p.locator('#rx-query').fill('66%');check('search composes with filters',p.locator('.rx-card').count()==1)
            with p.expect_download() as dl:p.locator('#rx-export').click()
            dl.value.save_as(OUT/'export.json');export=json.loads((OUT/'export.json').read_text())
            check('actual export retains selected evidence and survey method',len(export['records'])==1 and len(export['sources'])==1 and export['survey']['sample']==1202)
            check('filter selection is shareable in URL','rx-person=trump' in p.url and 'rx-stage=providence' in p.url)
            p.reload();p.wait_for_selector('body[data-reception-ready=true]');check('reload restores composed query',p.locator('.rx-card').count()==1 and p.locator('#rx-query').input_value()=='66%')
            p.locator('#rx-query').fill('<img src=x onerror=alert(1)>');check('untrusted search is never rendered as HTML',p.locator('img[src=x]').count()==0 and 'No records match' in p.locator('#rx-records').inner_text())
            p.locator('#rx-reset').click();check('reset restores all records',p.locator('.rx-card').count()==13)
            ready('?rx-person=reagan#rx-inaugural-mission');check('deep link reveals a record excluded by starting filter',p.locator('#rx-inaugural-mission details').evaluate('(d)=>d.open') and p.locator('#rx-person').input_value()=='all')
            check('deep-linked record receives focus',p.evaluate('document.activeElement.id')=='rx-inaugural-mission')
            ready('?rx-person=invalid&rx-stage=wrong#%E0%A4%A');check('malformed hash and unknown filters remain usable',p.locator('.rx-card').count()==13)
            p.locator('#rx-person').select_option('reagan');check('Reagan case retains three records',p.locator('.rx-card').count()==3)
            first=p.locator('.rx-card details').first;first.evaluate('(x)=>x.open=true');before=p.locator('#rx-records').inner_html();selected_url=p.url
            p.evaluate("dispatchEvent(new Event('beforeprint'))");check('print prepares all records with source notes',p.locator('.rx-card').count()==13 and p.locator('.rx-card details[open]').count()==13)
            p.evaluate("dispatchEvent(new Event('afterprint'))");check('print restoration preserves filters and open notes',p.locator('#rx-records').inner_html()==before and p.url==selected_url)
            p.locator('#rx-stage').select_option('mission');check('missing case-stage is explicit not invented','No records match' in p.locator('#rx-records').inner_text())
            p.locator('#rx-reset').click();p.set_viewport_size({'width':390,'height':844});check('mobile overflow is contained within table scrollers',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            p.screenshot(path=str(OUT/'mobile.png'),full_page=True)
            check('bounded next research remains marked open',p.locator('#rx-tasks details').count()==6 and 'Open' in p.locator('#rx-tasks').inner_text())
            for entry in ['san-reader.html','index.html']:
                p.goto(origin+'/theology-wiki/'+entry,wait_until='domcontentloaded');p.locator('#reception-history-link').wait_for(state='attached')
                link=p.locator('#reception-history-link');p.locator('.depth-site-menu summary').click();link.click();p.wait_for_selector('body[data-reception-ready=true]')
                check(entry+' opens the actual reception page','reception-history.html' in p.url)
            p.goto(origin+'/theology-wiki/role-workbook.html',wait_until='domcontentloaded');p.locator('#ranked-reception-link').click();p.wait_for_selector('body[data-reception-ready=true]');check('ranked workbook opens the study without changing scores','reception-history.html' in p.url)
            static=b.new_context(java_script_enabled=False);q=static.new_page();q.goto(url);check('no-JavaScript argument and source guide remain readable',q.locator('#argument').is_visible() and q.locator('#rx-sources a').count()>=10);static.close()
            failed=b.new_context();failed.route('**/reception/study.json',lambda r:r.abort());q=failed.new_page();q.goto(url);expect(q.locator('#rx-status')).to_contain_text('could not load');check('data failure preserves argument and disabled export',q.locator('#argument').is_visible() and q.locator('#rx-export').is_disabled());failed.close()
            denied=b.new_context();denied.add_init_script("Storage.prototype.getItem=function(){throw Error('denied')}; Storage.prototype.setItem=function(){throw Error('denied')};history.replaceState=function(){throw Error('denied')}");q=denied.new_page();q.goto(url);q.wait_for_selector('body[data-reception-ready=true]');q.locator('#rx-person').select_option('reagan');check('storage and history denial do not stop reading',q.locator('.rx-card').count()==3);denied.close()
            check('no uncaught runtime errors',not errors)
        finally:
            (OUT/'browser-checks.json').write_text(json.dumps({'origin':origin,'count':len(checks),'checks':checks,'errors':errors},indent=2));b.close()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--browser',action='store_true');a=parser.parse_args()
    if a.browser:browser_checks()
    else:source_checks()
