"""Real reader checks for the two October 24 political studies."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('THEOLOGY_READER_URL','http://127.0.0.1:4182/theology-wiki/san-reader.html')
OUT=Path(os.environ.get('POLITICAL_TEST_OUTPUT',str(Path(__file__).resolve().parents[2]/'political-test-output')))
OUT.mkdir(parents=True,exist_ok=True)
SLUGS=['trump-signs-timeline-brother-paul','public-executions-religious-justification-and-john-16']
checks=[]
def check(name,value):
    assert value,name
    checks.append(name)
    print('PASS',name,flush=True)
def ready(page,slug,extra=''):
    page.goto(BASE+'?page='+slug+extra,wait_until='domcontentloaded')
    page.wait_for_function('(s)=>window.TheologyReader?.current()?.slug===s && document.querySelector("#article-body")?.dataset.foundationReady===s && !!document.querySelector("#publication-record")',arg=slug)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    ready(page,'home')
    check('Both new pages are discoverable in the developed-article home index',all(page.locator('.depth-article-index a[data-page="'+s+'"]').count()==1 for s in SLUGS))
    for slug in SLUGS:
        ready(page,slug)
        body=page.locator('#article-body').inner_text()
        check(slug+': complete rendered prose and resolved crosslinks','[[' not in body and len(body)>9000)
        check(slug+': separate canonical and exact-version history',page.locator('#publication-record a',has_text='Canonical writing history').count()==1 and page.locator('#publication-record a',has_text='Exact source version').count()==1)
        page.locator('#publication-record summary').click()
        page.locator('#publication-record button').click()
        page.wait_for_function('document.querySelector(".publication-status")?.textContent.startsWith("Verified:")')
        check(slug+': served source matches archived hash',True)
        check(slug+': related First Beast link resolves',page.locator('#article-body a[data-page="trump-first-beast-of-revelation"]').count()>0)
        if slug==SLUGS[0]:
            check('Timeline keeps fifteen themes, original-video uncertainty and future mint date',page.locator('#article-body ol').first.locator('li').count()==15 and 'original YouTube URL and upload date remain unverified' in body and 'not a completed mint sale' in body)
        else:
            check('Execution page keeps cancellation, reversal and conditional warning','not be livestreamed' in body and 'I support President Trump' in body and 'not an established result' in body)
        page.set_viewport_size({'width':390,'height':844})
        check(slug+': mobile article has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
        page.screenshot(path=str(OUT/(slug+'-mobile.png')),full_page=True)
        page.set_viewport_size({'width':1440,'height':1000})
    ready(page,'trump-first-beast-of-revelation')
    check('Existing First Beast article has incoming links to both additions',all(page.locator('#research-backlinks a[data-page="'+s+'"]').count()>0 for s in SLUGS))
    page.locator('#theology-kind').select_option('all')
    page.locator('#page-search').fill('spectatorship')
    page.wait_for_function('(s)=>[...document.querySelectorAll("#page-list a[data-page]")].some(a=>a.dataset.page===s)',arg=SLUGS[1])
    check('Full-body search finds the new execution study',True)
    for slug in SLUGS:
        ready(page,'listening-room','&listen='+slug)
        page.wait_for_function('(s)=>document.querySelector("#product-workspace")?.dataset.articleReady===s',arg=slug)
        check(slug+': full listening text verifies against source','hashes match' in page.locator('#listen-version').inner_text())
        check(slug+': all 41 reading texts remain selectable',page.locator('#listen-article option').count()==41)
    check('No uncaught reader errors',not errors)
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2),encoding='utf-8')
    browser.close()
