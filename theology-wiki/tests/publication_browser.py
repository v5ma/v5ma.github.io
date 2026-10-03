"""Native browser checks of the real reader; no injected renderer or mocked source data."""
import json,os
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('PUBLICATION_TEST_OUTPUT',str(ROOT/'publication-test-output')))
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('THEOLOGY_READER_URL','http://127.0.0.1:4174/theology-wiki/san-reader.html')
CHECKS=[]
def check(name,value):
    if not value: raise AssertionError(name)
    CHECKS.append(name);print('PASS',name,flush=True)
def open_page(page,slug):
    page.goto(BASE+'?page='+quote(slug),wait_until='domcontentloaded')
    page.wait_for_function('(s)=>window.TheologyReader?.current()?.slug===s && !!document.querySelector("#publication-record")',arg=slug)
def navigate(page,slug):
    page.evaluate('(s)=>TheologyReader.navigate(s,true)',slug)
    page.wait_for_function('(s)=>window.TheologyReader?.current()?.slug===s && !!document.querySelector("#publication-record")',arg=slug)
with sync_playwright() as tool:
    options={'headless':True}
    if os.environ.get('CHROMIUM'): options['executable_path']=os.environ['CHROMIUM']
    browser=tool.chromium.launch(**options)
    ctx=browser.new_context(viewport={'width':1440,'height':1000})
    page=ctx.new_page();page.set_default_timeout(20000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        open_page(page,'home')
        check('Reader has 438 indexed pages',page.evaluate('TheologyReader.pages().length')==438)
        check('Every indexed page exposes a committed source version',page.evaluate('TheologyReader.pages().every(p=>p.publication && /[a-f0-9]{40}/.test(p.publication.revision))'))
        check('Homepage links to the new bridge and public backup',page.locator('#publication-home a').count()==3)
        page.locator('#publication-home a[data-page="computational-god-capabilities-bridge"]').click()
        page.wait_for_function('TheologyReader.current().slug==="computational-god-capabilities-bridge" && !!document.querySelector("#publication-record")')
        check('Bridge shows the actual full argument', 'Divine will and finite agency' in page.locator('#article-body').inner_text())
        check('No broken wikilinks remain in the bridge', '[[' not in page.locator('#article-body').inner_text())
        check('History and exact-version links are visible without opening More tools',page.locator('#publication-record a',has_text='Publication history').is_visible() and page.locator('#publication-record a',has_text='Exact source version').is_visible())
        page.locator('#publication-record summary').click();page.locator('#publication-record button').click()
        page.wait_for_function('document.querySelector(".publication-status")?.textContent.startsWith("Verified:")')
        check('Served Markdown matches its archived hash',True)
        page.screenshot(path=str(OUT/'bridge-desktop.png'),full_page=True)
        old_storage=page.evaluate("localStorage.getItem('theology:reading:v2')")
        navigate(page,'computational-divine-immanence')
        check('Existing essay has incoming bridge link and provenance',page.locator('#research-backlinks a[data-page="computational-god-capabilities-bridge"]').count()>0)
        check('Existing essay links to its canonical writing history',page.locator('#publication-record a',has_text='Canonical writing history').count()==1)
        for slug in ['computational-god-consciousness-and-theodicy','cosmic-thought-and-transcendence','publication-history']:
            navigate(page,slug);check('Integrated route opens: '+slug,page.locator('#article-body').inner_text().strip()!='')
        check('Version tools do not change reader storage',page.evaluate("localStorage.getItem('theology:reading:v2')")==old_storage)
        page.locator('#theology-kind').select_option('all');page.locator('#page-search').fill('unpleasant evolutionary implementation')
        page.wait_for_function('document.querySelector("#page-list a[data-page=computational-god-capabilities-bridge]")')
        check('Global full-text search finds new body prose',True)
        navigate(page,'listening-room')
        check('Listening library includes 37 complete reading texts',page.locator('#listen-article option').count()==37)
        check('Bridge is available for device reading',page.locator('#listen-article option[value="computational-god-capabilities-bridge"]').count()==1)
        # One preserved original conversation, using its real transcript metadata.
        chat=page.evaluate('TheologyReader.pages().find(p=>p.sourceFile).slug')
        navigate(page,chat)
        check('Conversation provenance links to its exact original transcript',page.locator('#publication-record a',has_text='Exact original conversation').count()==1)
        page.set_viewport_size({'width':390,'height':844})
        open_page(page,'computational-god-capabilities-bridge')
        check('Mobile page has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
        check('Mobile source-history link remains accessible',page.locator('#publication-record a',has_text='Publication history').is_visible())
        page.screenshot(path=str(OUT/'bridge-mobile.png'),full_page=True)
        page.locator('#publication-record a',has_text='Exact source version').focus()
        check('Version links are keyboard focusable',page.evaluate('document.activeElement.textContent')=='Exact source version')
        # Rapid route changes must leave provenance for the current page only.
        page.evaluate('TheologyReader.navigate("computational-divine-immanence",true);TheologyReader.navigate("computational-god-consciousness-and-theodicy",true)')
        page.wait_for_function('document.querySelector("#publication-record a")?.href.includes("computational-god-consciousness-and-theodicy")')
        check('Rapid navigation cannot show a stale source link',True)
        check('No uncaught browser errors',not errors)
    finally:
        (OUT/'report.json').write_text(json.dumps({'reader':BASE,'checks':CHECKS,'uncaughtErrors':errors},indent=2)+'\n')
        browser.close()
