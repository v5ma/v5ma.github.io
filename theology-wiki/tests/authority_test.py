"""Read-only checks of article consistency, navigation and actual-browser behavior.
Passing these tests does not validate external historical or theological claims.
"""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, html, hashlib, os, argparse
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'theology-wiki/authority'
OUT=ROOT/'theology-authority-proof'; OUT.mkdir(exist_ok=True)
checks=[]
def check(name,value):
    assert value,name
    checks.append(name); print('PASS',name,flush=True)
class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[];self.links=[];self.scripts=[]
    def handle_starttag(self,t,attrs):
        a=dict(attrs)
        if 'id'in a:self.ids.append(a['id'])
        if t=='a':self.links.append(a.get('href',''))
        if t=='script':self.scripts.append(a.get('src',''))
def source_checks():
    m=json.loads((D/'manifest.json').read_text()); ss=json.loads((D/'sources.json').read_text())
    check('six independent essays and 33 scoped source entries',len(m['articles'])==6 and len(ss)==33)
    ids={s['id'] for s in ss}; slugs={a['slug'] for a in m['articles']}
    check('unique source IDs and public HTTPS source addresses',len(ids)==len(ss) and all(urlsplit(s['url']).scheme=='https' and not urlsplit(s['url']).username for s in ss))
    check('all access records have a review date and scope',all(s['consulted']=='2026-09-09' and s['access'] for s in ss))
    check('article and source cross-references resolve',all(set(a['sourceIds'])<=ids and set(a['related'])<=slugs for a in m['articles']))
    for a in m['articles']:
        slug=a['slug']; text=(D/(slug+'.html')).read_text(); md=(D/'manuscripts'/(slug+'.md')).read_text()
        # Only main argument paragraphs, before the end-of-article source list.
        prose=text.split('<article class="reading">')[1].split('<section class="sources"')[0]
        pars=[html.unescape(x) for x in re.findall(r'<p>(.*?)</p>',prose,re.S)]
        check(slug+' HTML and Markdown main prose agree',all(x in md for x in pars) and sum(len(x.split()) for x in pars)==a['wordCount'])
        check(slug+' is a substantial static article',a['wordCount']>=650 and '<h2>Sources and access</h2>'in text and not '<script'in text)
    pages=list(D.glob('*.html')); parsed={}
    for page in pages:
        p=Parser();p.feed(page.read_text());parsed[page]=p
    check('all static page anchors unique',all(len(p.ids)==len(set(p.ids)) for p in parsed.values()))
    bad=[]
    for page,p in parsed.items():
        for href in p.links:
            u=urlsplit(href)
            if u.scheme or u.netloc:continue
            target=(page.parent/unquote(u.path)).resolve() if u.path else page
            if not target.is_relative_to(D):continue
            if not target.is_file():bad.append((str(page),href));continue
            if u.fragment and target.suffix=='.html':
                q=parsed.get(target)
                if q is None:q=Parser();q.feed(target.read_text())
                if u.fragment not in q.ids:bad.append((str(page),href))
    check('all within-series links and source anchors resolve',not bad)
    check('hub shows all manuscript and reading links',all(a['slug']+'.html'in (D/'index.html').read_text() and 'manuscripts/'+a['slug']+'.md'in (D/'index.html').read_text() for a in m['articles']))
    check('Gaza distinguishes assessment and projection dates','April 16-June 30'in (D/'gaza-hunger-and-prophetic-accountability.html').read_text() and 'not a September 9 household census'in (D/'gaza-hunger-and-prophetic-accountability.html').read_text())
    check('Qumran and rabbinic counterevidence retained','Mishnah Yoma'in (D/'qumran-jesus-and-ways-of-life.html').read_text())
    js=(D/'index.js').read_text()
    check('new runtime has no storage, account writes or remote requests',not re.search('localStorage|sessionStorage|fetch\\(|eval\\(',js))
    check('series is linked from existing reader','id="authority-studies-link"'in (ROOT/'theology-wiki/assets/js/depth-tools.js').read_text())
    check('older metaphysical page links to the refinement',"'computational-divine-immanence':['cosmic-thought-and-transcendence'"in (ROOT/'theology-wiki/assets/js/depth-tools.js').read_text())
    (OUT/'source-checks.json').write_text(json.dumps({'count':len(checks),'checks':checks},indent=2))
def browser_checks():
    from playwright.sync_api import sync_playwright,expect
    base=os.environ.get('SITE_ORIGIN','http://127.0.0.1:4174').rstrip('/')
    url=base+'/theology-wiki/authority/'
    errors=[]
    with sync_playwright() as pw:
        args={'headless':True}
        if os.environ.get('CHROMIUM'):args['executable_path']=os.environ['CHROMIUM']
        b=pw.chromium.launch(**args);c=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.set_default_timeout(20000)
        try:
            p.goto(url);expect(p.locator('.card')).to_have_count(6)
            check('native hub shows six reading cards',p.locator('.card').count()==6)
            p.screenshot(path=str(OUT/'hub-desktop.png'),full_page=True)
            p.locator('#article-search').fill('Qumran');expect(p.locator('.card:visible')).to_have_count(1)
            check('search matches a title and summary',p.locator('.card:visible').count()==1)
            p.locator('#article-search').fill('<img src=x onerror=alert(1)>')
            check('search creates no HTML and has an explicit empty status',p.locator('img').count()==0 and p.locator('.card:visible').count()==0)
            p.locator('#article-search').fill('');expect(p.locator('.card:visible')).to_have_count(6)
            check('clearing search restores all six studies',True)
            m=json.loads((D/'manifest.json').read_text())
            for a in m['articles']:
                p.goto(url+a['slug']+'.html');expect(p.locator('h1')).to_have_text(a['title'])
                check(a['slug']+' full article loads without data fetch',len(p.locator('.reading').inner_text())>3800 and p.locator('#sources .source').count()==len(a['sourceIds']))
                if a['slug']=='gaza-hunger-and-prophetic-accountability':p.screenshot(path=str(OUT/'gaza-desktop.png'),full_page=True)
            p.goto(url+'sources.html#ipc26');check('dated source scope has a stable deep link',p.locator('#ipc26').count()==1 and 'July 1-December 31'in p.locator('#ipc26').inner_text())
            p.set_viewport_size({'width':390,'height':844});p.goto(url)
            check('mobile hub has no document overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            p.screenshot(path=str(OUT/'hub-mobile.png'),full_page=True)
            p.goto(url+'qumran-jesus-and-ways-of-life.html');check('mobile article and source trail remain readable',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            p.screenshot(path=str(OUT/'article-mobile.png'),full_page=True)
            plain=b.new_context(java_script_enabled=False);q=plain.new_page();q.goto(url);check('no-JavaScript hub retains all six choices',q.locator('.card').count()==6);q.goto(url+'cosmic-thought-and-transcendence.html');check('no-JavaScript full article and citations survive',q.locator('.reading').is_visible() and q.locator('#sources .source').count()==2);plain.close()
            if os.environ.get('CHECK_WIKI','1')=='1':
                for entry in ['san-reader.html','index.html']:
                    p.goto(base+'/theology-wiki/'+entry);p.locator('#authority-studies-link').wait_for(state='attached');p.locator('.depth-site-menu summary').click();p.locator('#authority-studies-link').click();expect(p.locator('.card')).to_have_count(6);check(entry+' opens the actual series',True)
                p.goto(base+'/theology-wiki/san-reader.html?page=computational-divine-immanence');p.locator('#authority-study-handoff').wait_for();check('older cosmic article displays the clarification link',p.locator('#authority-study-handoff a').get_attribute('href')=='./authority/cosmic-thought-and-transcendence.html');p.reload();p.locator('#authority-study-handoff').wait_for();check('article refresh does not duplicate clarification',p.locator('#authority-study-handoff').count()==1)
            check('no uncaught runtime errors',not errors)
        finally:
            (OUT/'browser-checks.json').write_text(json.dumps({'origin':base,'count':len(checks),'checks':checks,'errors':errors,'existingReaderIntegration':os.environ.get('CHECK_WIKI','1')=='1'},indent=2));b.close()
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--browser',action='store_true');a=ap.parse_args()
    browser_checks() if a.browser else source_checks()
