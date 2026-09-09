"""Read-only structure and real-browser checks for the Unsealed inheritance studies.
Tests validate the implementation, not the truth of theological interpretations.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import argparse, hashlib, html, json, os, re, zipfile
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'theology-wiki/unsealed'
OUT=ROOT/'theology-unsealed-proof'
OUT.mkdir(exist_ok=True)
ESSAYS={'recovered-scrolls':'When the scrolls return','library-and-canon':'A library larger than any one canon','unsealing-the-reader':'Unsealing the reader'}
checks=[]
def check(name,condition):
    if not condition: raise AssertionError(name)
    checks.append(name);print('PASS',name,flush=True)
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.scripts=[];self.text=[];self.in_heading=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='a': self.links.append(a.get('href',''))
        if tag=='script': self.scripts.append(a.get('src',''))
        if tag in ['h1','h2','h3','p']:self.text.append('\n\n')
        if tag=='a' and a.get('href','').startswith('https:'):self.text.append('['+a['href']+'] ')
    def handle_data(self,data): self.text.append(data)
def parse(text):
    p=Page();p.feed(text);return p
def clean(text): return html.unescape(re.sub('<[^>]+>',' ',text))
def source_checks():
    files=list(DIR.glob('*.html'));parsed={p:parse(p.read_text()) for p in files}
    check('one hub and three full essays',len(files)==4 and all((DIR/(s+'.html')).is_file() for s in ESSAYS))
    stats={}
    for slug,title in ESSAYS.items():
        raw=(DIR/(slug+'.html')).read_text();p=parsed[DIR/(slug+'.html')]
        main=raw.split('<article id="argument" class="reading">')[1].split('</article>')[0]
        words=len(clean(main).split());stats[slug]=words
        check(slug+' contains substantial argument',words>=750)
        check(slug+' title and source boundary exist','<h1>'+title+'</h1>' in raw and 'id="sources"' in raw)
        check(slug+' remains readable without scripts',not p.scripts)
        # Plain-text derivatives retain sources, after the main writing.
        start=raw.index('<h1>');end=raw.index('</main>')
        manuscript=parse(raw[start:end]);text=re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+','\n\n',''.join(manuscript.text)).strip()
        (OUT/(slug+'.txt')).write_text(text+'\n')
    check('no duplicate page anchors',all(len(p.ids)==len(set(p.ids)) for p in parsed.values()))
    missing=[]
    for path,p in parsed.items():
        for link in p.links:
            u=urlsplit(link)
            if u.scheme:
                if u.scheme!='https':missing.append(link)
                continue
            target=(path.parent/unquote(u.path)).resolve() if u.path else path.resolve()
            if not target.is_relative_to(ROOT):missing.append(link);continue
            if not target.is_file():missing.append(str(target));continue
            if u.fragment and target.suffix=='.html' and target.is_relative_to(DIR):
                q=parsed.get(target) or parse(target.read_text())
                if u.fragment not in q.ids:missing.append(link)
    check('local article, reader and source links resolve',not missing)
    hub=(DIR/'index.html').read_text()
    check('eight separate passage notes retained',hub.count('class="passage"')==8)
    check('instruction not to seal remains explicit','not to seal this prophecy' in hub)
    check('Daniel and Revelation are not merged','Daniel 12:4,8-10' in hub and 'Revelation 22:10' in hub)
    check('authority categories not equated','not to a replacement covenant called a Jewish New Testament' in (DIR/'library-and-canon.html').read_text())
    check('no accidental author-name typo','HaberI' not in (DIR/'library-and-canon.html').read_text())
    js=(DIR/'study.js').read_text()
    check('new runtime has no storage or remote operations',not re.search(r'localStorage|sessionStorage|fetch\(|eval\(',js))
    nav=(ROOT/'theology-wiki/assets/js/depth-tools.js').read_text()
    check('shared reader exposes new hub','unsealed-studies-link' in nav and './unsealed/index.html' in nav)
    check('older inheritance article links to new work','sacred-inheritance-and-rival-continuations' in nav and 'unsealed-study-handoff' in nav)
    check('uploaded image is not embedded',all('<img' not in p.read_text() for p in files))
    (OUT/'source-checks.json').write_text(json.dumps({'count':len(checks),'checks':checks,'argumentWordCounts':stats},indent=2))
def browser_checks():
    from playwright.sync_api import sync_playwright,expect
    base=os.environ.get('SITE_ORIGIN','http://127.0.0.1:4174').rstrip('/')
    url=base+'/theology-wiki/unsealed/';errors=[]
    with sync_playwright() as pw:
        launch={'headless':True}
        if os.environ.get('CHROMIUM'):launch['executable_path']=os.environ['CHROMIUM']
        browser=pw.chromium.launch(**launch);ctx=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);page=ctx.new_page();page.set_default_timeout(20000);page.on('pageerror',lambda e:errors.append(str(e)))
        def ready(suffix=''):
            page.goto(url+suffix,wait_until='domcontentloaded');page.wait_for_selector('body[data-unsealed-ready=true]')
        try:
            ready();check('real-origin hub has three studies and eight notes',page.locator('[data-study]').count()==3 and page.locator('.passage').count()==8)
            page.screenshot(path=str(OUT/'hub-desktop.png'),full_page=True)
            page.locator('#study-query').fill('canon');expect(page.locator('[data-study]:visible')).to_have_count(1);check('title search selects the relevant essay',True)
            page.locator('#study-query').fill('<img src=x onerror=alert(1)>');expect(page.locator('[data-study]:visible')).to_have_count(0);check('query is not interpreted as HTML',page.locator('img').count()==0)
            page.locator('#study-query').fill('');expect(page.locator('[data-study]:visible')).to_have_count(3);check('cleared search restores choices',True)
            page.locator('#scene').select_option('sealed');expect(page.locator('.passage:visible')).to_have_count(3);check('sealed filter retains different concealment scenes',True)
            with page.expect_download() as dl:page.locator('#export').click()
            dl.value.save_as(OUT/'passage-export.json');export=json.loads((OUT/'passage-export.json').read_text())
            check('actual JSON export includes selection, boundaries and source links',export['selection']=='sealed' and len(export['records'])==3 and all(r['sources'] and r['comparison'] for r in export['records']))
            page.evaluate("location.hash='revelation22'");expect(page.locator('#scene')).to_have_value('all');check('record deep link reveals an excluded note',page.locator('#revelation22').is_visible())
            check('deep-link target receives focus',page.evaluate('document.activeElement.id')=='revelation22')
            ready('index.html#revelation10');check('direct record URL works on reload',page.evaluate('document.activeElement.id')=='revelation10')
            ready('index.html#%E0%A4%A');check('malformed fragment does not break reading',page.locator('.passage').count()==8)
            page.locator('#scene').select_option('judgment');expect(page.locator('.passage:visible')).to_have_count(1);check('judgment is a separate scene',True)
            page.emulate_media(media='print');check('printing includes filtered-out passage notes',page.locator('.passage:visible').count()==8)
            page.emulate_media(media='screen');check('return from print preserves selected filter',page.locator('.passage:visible').count()==1)
            page.locator('#reset').click();expect(page.locator('.passage:visible')).to_have_count(8);check('scene reset restores notes',True)
            for slug,title in ESSAYS.items():
                page.goto(url+slug+'.html');expect(page.locator('h1')).to_have_text(title);check(slug+' full argument and sources load',len(page.locator('#argument').inner_text().split())>=750 and page.locator('#sources a').count()>=6)
                if slug=='recovered-scrolls':page.screenshot(path=str(OUT/'article-desktop.png'),full_page=True)
            page.set_viewport_size({'width':390,'height':844});ready();check('mobile hub has no document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));page.screenshot(path=str(OUT/'hub-mobile.png'),full_page=True)
            page.goto(url+'recovered-scrolls.html');check('mobile long-form text has no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));page.screenshot(path=str(OUT/'article-mobile.png'),full_page=True)
            plain=browser.new_context(java_script_enabled=False);p=plain.new_page();p.goto(url);check('no-JavaScript hub preserves all content',p.locator('.passage').count()==8 and p.locator('[data-study]').count()==3);p.goto(url+'library-and-canon.html');check('no-JavaScript essay and end sources remain available',p.locator('#argument').is_visible() and p.locator('#sources').is_visible());plain.close()
            if os.environ.get('CHECK_WIKI','1')=='1':
                for entry in ['san-reader.html','index.html']:
                    page.goto(base+'/theology-wiki/'+entry);page.locator('#unsealed-studies-link').wait_for(state='attached');page.locator('.depth-site-menu summary').click();page.locator('#unsealed-studies-link').click();page.wait_for_selector('body[data-unsealed-ready=true]');check(entry+' opens new studies from existing navigation',True)
                page.goto(base+'/theology-wiki/san-reader.html?page=sacred-inheritance-and-rival-continuations');page.locator('#unsealed-study-handoff').wait_for();check('existing inheritance article exposes new continuation',page.locator('#unsealed-study-handoff a').get_attribute('href')=='./unsealed/library-and-canon.html');page.reload();page.locator('#unsealed-study-handoff').wait_for();check('reload creates no duplicate handoff',page.locator('#unsealed-study-handoff').count()==1)
            check('no uncaught JavaScript errors',not errors)
        finally:
            (OUT/'browser-checks.json').write_text(json.dumps({'origin':base,'count':len(checks),'checks':checks,'errors':errors,'readerIntegration':os.environ.get('CHECK_WIKI','1')=='1'},indent=2));browser.close()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--browser',action='store_true');args=parser.parse_args()
    browser_checks() if args.browser else source_checks()
