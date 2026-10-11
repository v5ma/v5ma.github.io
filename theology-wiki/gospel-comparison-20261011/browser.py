"""Read-only desktop/mobile verification of the actual Gospel article and reader."""
import hashlib,json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'theology-test-output'
ORIGIN=os.environ.get('SITE_ORIGIN','http://127.0.0.1:4174').rstrip('/')
SLUG='living-jesus-thomas-john-and-synoptics'

def main():
    OUT.mkdir(exist_ok=True)
    report={'origin':ORIGIN,'article':SLUG,'checks':[],'passed':False}
    def check(name,condition):
        assert condition,name
        report['checks'].append(name)
    with sync_playwright() as tool:
        options={'headless':True}
        if os.environ.get('CHROMIUM'):options['executable_path']=os.environ['CHROMIUM']
        browser=tool.chromium.launch(**options)
        try:
            context=browser.new_context(viewport={'width':1440,'height':1000})
            page=context.new_page();page.set_default_timeout(20000)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            def navigate(slug):
                page.evaluate('(s)=>TheologyReader.navigate(s,true)',slug)
                page.wait_for_function('(s)=>TheologyReader.current()?.slug===s && document.querySelector("#article-body")?.dataset.foundationReady===s',arg=slug)
            canonical=(ROOT/f'theology-wiki/editorial/authorial-articles/{SLUG}.md').read_text()
            targets=set(re.findall(r'\[\[([^\]|#]+)',canonical))
            for suffix in ['content/developed/'+SLUG+'.md','public-corpus/pages/'+SLUG+'.md','data/listening/'+SLUG+'.json','products/transcripts/'+SLUG+'.txt']:
                name='theology-wiki/'+suffix;response=context.request.get(ORIGIN+'/'+name)
                check('Exact served bytes: '+suffix,response.ok and response.body()==(ROOT/name).read_bytes())
            page.goto(ORIGIN+'/theology-wiki/san-reader.html?page='+SLUG,wait_until='domcontentloaded')
            page.wait_for_function('(s)=>window.TheologyReader?.current()?.slug===s && document.querySelector("#article-body")?.dataset.foundationReady===s',arg=SLUG)
            check('Full argument rendered',len(page.locator('#article-body').inner_text().split())>2000)
            links=set(page.locator('#article-body a[data-page]').evaluate_all('(a)=>a.map(x=>x.dataset.page)'))
            check('All canonical wiki links rendered',targets<=links)
            check('Exact source history visible',page.locator('#publication-record a',has_text='Exact source version').is_visible())
            page.screenshot(path=str(OUT/'gospel-desktop.png'),full_page=True)
            navigate('home');check('Homepage discovery',page.locator(f'#article-body a[data-page="{SLUG}"]').count()>0)
            navigate('topic-jesus');check('Subject discovery',page.locator(f'#article-body a[data-page="{SLUG}"]').count()>0)
            page.locator('#theology-kind').select_option('all');page.locator('#page-search').fill('biological death')
            page.wait_for_function('(s)=>!!document.querySelector("#page-list a[data-page="+s+"]")',arg=SLUG)
            check('Actual full-text search finds argument',True)
            navigate('listening-room');check('Listening selection includes article',page.locator(f'#listen-article option[value="{SLUG}"]').count()==1)
            navigate(SLUG);page.set_viewport_size({'width':390,'height':844})
            check('Mobile has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
            page.screenshot(path=str(OUT/'gospel-mobile.png'),full_page=True)
            navigate('home');page.go_back();page.wait_for_function('(s)=>TheologyReader.current()?.slug===s',arg=SLUG)
            check('Back restores the Gospel route',True)
            page.evaluate('(s)=>{TheologyReader.navigate("home",true);TheologyReader.navigate(s,true)}',SLUG)
            page.wait_for_function('(s)=>TheologyReader.current()?.slug===s && document.querySelector("#publication-record a")?.href.includes(s)',arg=SLUG)
            check('Rapid route changes retain the correct source record',True)
            check('No uncaught browser errors',not errors)
            report['passed']=True
        finally:
            (OUT/'gospel-browser.json').write_text(json.dumps(report,indent=2)+'\n')
            browser.close()
    print('PASS Gospel article: bytes, full argument, wiki links, discovery, search, listening, history and mobile')

if __name__=='__main__':main()
