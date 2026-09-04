"""Native HTTP Chromium integration tests. No injected renderer or mock storage.
Start a static server at SITE_ORIGIN (default http://127.0.0.1:4174) first.
"""
import json
import os
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'theology-test-output'
OUT.mkdir(exist_ok=True)
ORIGIN = os.environ.get('SITE_ORIGIN', 'http://127.0.0.1:4174').rstrip('/')
BASE = ORIGIN + '/theology-wiki/san-reader.html'
CHECKS, ERRORS = [], []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    CHECKS.append(name)
    print('PASS', name, flush=True)

def open_page(page, slug='home', extra=''):
    page.goto(BASE + '?page=' + quote(slug) + extra, wait_until='domcontentloaded')
    page.wait_for_function('(slug)=>window.TheologyReader?.current()?.slug===slug', arg=slug)
    page.locator('#research-actions').wait_for()
    page.wait_for_timeout(150)

def navigate(page, slug):
    page.evaluate('(slug)=>window.TheologyReader.navigate(slug, true)', slug)
    page.wait_for_function('(slug)=>window.TheologyReader?.current()?.slug===slug && !!document.querySelector("#research-actions")', arg=slug)
    page.wait_for_timeout(100)

def screenshot(page, name):
    page.screenshot(path=str(OUT/name), full_page=True)

with sync_playwright() as tool:
    options = {'headless': True}
    if os.environ.get('CHROMIUM'):
        options['executable_path'] = os.environ['CHROMIUM']
    browser = tool.chromium.launch(**options)
    ctx = browser.new_context(viewport={'width':1440, 'height':1000}, accept_downloads=True)
    page = ctx.new_page()
    page.set_default_timeout(20000)
    page.on('pageerror', lambda e: ERRORS.append(str(e)))
    try:
        open_page(page)
        check('Native HTTP reader loads 390 indexed pages', page.evaluate('TheologyReader.pages().length') == 390)
        check('Home promotes eight developed arguments', page.locator('.research-card').count() == 8)
        check('Homepage describes 354 original source conversations', '354' in page.locator('.research-counts').inner_text())
        check('Eight subject collections are accessible in the sidebar', page.locator('.research-topic-link').count() == 8)
        screenshot(page,'home-desktop.png')
        page.locator('#theology-kind').select_option('chat')
        check('Source-only navigation is paginated', page.locator('#page-list .page-link').count() == 40)
        page.locator('[data-research="more-nav"]').click()
        check('Navigation can expand without dropping previous results', page.locator('#page-list .page-link').count() == 80)
        page.locator('#theology-topic').select_option('machines')
        check('Source and subject filters compose', page.evaluate('Array.from(document.querySelectorAll("#page-list .page-link")).every(a=>TheologyReader.pages().find(p=>p.slug===a.dataset.page).category==="machines")'))
        page.locator('#theology-sort').select_option('date')
        check('Conversation date sort is descending', page.evaluate('(()=>{const dates=Array.from(document.querySelectorAll("#page-list .page-link")).map(a=>TheologyReader.pages().find(p=>p.slug===a.dataset.page).date);return dates.every((d,i)=>!i||dates[i-1]>=d)})()'))
        page.locator('[data-research="reset"]').click()
        page.locator('#page-search').fill('gradient descent')
        page.wait_for_function('document.querySelector("#search-scope")?.textContent.includes("complete source")')
        page.wait_for_function('!!document.querySelector("#page-list a[data-page=\"cognitive-gnosticism-jesus-vs-gnostic-jesus\"]")')
        check('Search includes full source text beyond titles and previews', True)
        page.locator('#page-search').fill('coherence qqqzzzzz')
        page.wait_for_timeout(400)
        check('All search terms must match', page.locator('#page-list .page-link').count() == 0)
        page.locator('#page-search').fill('<img src=x onerror=alert(1)>')
        page.wait_for_timeout(400)
        check('Search text cannot inject image elements', page.locator('#page-list img[src=x]').count() == 0)
        page.locator('[data-research="reset"]').click()
        navigate(page,'apocalyptic-repair-theology')
        page.wait_for_function('Array.from(document.querySelectorAll(".research-figure img")).some(i=>i.naturalWidth>0)')
        check('An article renders a locally bundled museum picture', True)
        check('Article keeps the author correction rather than only the AI summary', 'correction' in page.locator('#article-body').inner_text().lower())
        check('Article has source-linked discussion references', page.locator('#article-body a[data-page="early-vs-later-gnosticism"]').count() > 0)
        check('Source grounded articles have incoming backlinks', page.locator('#research-backlinks a').count() > 0)
        check('Reading outline updates to article headings', page.locator('#article-outline-list a').count() >= 4)
        screenshot(page,'article-desktop.png')
        articles=page.evaluate('TheologyReader.pages().filter(p=>p.kind==="Developed article").map(p=>p.slug)')
        for slug in articles:
            navigate(page,slug)
            assert page.locator('#article-body .wiki-unavailable').count()==0, slug
            assert page.locator('#article-body').inner_text().count('Source')>0, slug
        check('Every developed article renders without unresolved reader links',True)
        navigate(page,'sources-index')
        page.locator('#catalogue-count').wait_for()
        check('Conversation catalogue exposes all 354 chats', page.locator('#catalogue-count').inner_text().startswith('354 conversations'))
        check('Catalogue paginates at 30 records', page.locator('#catalogue-results .research-card').count()==30)
        page.locator('[data-research="more-catalogue"]').click()
        check('Catalogue expands to 60 records', page.locator('#catalogue-results .research-card').count()==60)
        page.locator('#catalogue-search').fill('gradient descent')
        page.wait_for_timeout(400)
        check('Catalogue searches complete discussions', page.locator('#catalogue-results a[data-page="cognitive-gnosticism-jesus-vs-gnostic-jesus"]').count()==1)
        navigate(page,'agi-religious-framework')
        check('Source card shows the actual opening question', 'Only Self Aware Conscious Metal Robots' in page.locator('.source-excerpt').inner_text())
        page.locator('[data-research="load-source"]').click()
        page.locator('.chat-owner').first.wait_for()
        check('Full original conversation retains both speakers', page.locator('.chat-owner').count()>0 and page.locator('.chat-assistant').count()>0)
        check('Source links connect to developed articles', page.locator('#article-body a[data-page="religion-for-conscious-robots"]').count()>0)
        page.locator('#turn-speaker').select_option('Micah Blumberg')
        page.locator('#turn-search').fill('not two things')
        check('Within-chat search combines text and speaker filtering', page.locator('.chat-turn').count()==1 and page.locator('.chat-owner').count()==1)
        check('Original user correction survives intact', 'These are not two things' in page.locator('.chat-text').inner_text())
        screenshot(page,'source-conversation.png')
        open_page(page,'early-vs-later-gnosticism','&turn=44#source-transcript')
        page.locator('#turn-44').wait_for()
        check('Direct conversation-turn URLs load beyond first pagination window', page.locator('#turn-44').count()==1)
        check('Deep-linked user correction remains attributed to its original speaker', 'Micah Blumberg' in page.locator('#turn-44 header').inner_text())
        long_buttons=page.locator('#turn-list button:not([data-research])')
        if long_buttons.count():
            button=long_buttons.first
            container_id=button.locator('..').get_attribute('id')
            before=button.locator('..').locator('.chat-text').inner_text()
            button.click()
            check('Long turns expand instead of silently truncating source material', len(before)==5000 and len(page.locator('#'+container_id+' .chat-text').inner_text())>5000)
        open_page(page,'connections','&focus=apocalyptic-repair-theology')
        page.locator('#research-graph').wait_for()
        check('Focused network draws keyboard-addressable neighbors', page.locator('.research-graph-svg a[tabindex="0"]').count()>0)
        check('Network retains direction in a complete text alternative', page.locator('.graph-text section').count()==2)
        page.locator('#graph-page').select_option('cognitive-gnosticism')
        check('Graph focus updates its shareable URL', 'focus=cognitive-gnosticism' in page.url)
        screenshot(page,'connections-desktop.png')
        navigate(page,'image-collection')
        page.locator('.research-gallery').wait_for()
        for image in page.locator('.research-gallery img').all():
            image.scroll_into_view_if_needed()
        page.wait_for_function('Array.from(document.querySelectorAll(".research-gallery img")).length===3 && Array.from(document.querySelectorAll(".research-gallery img")).every(i=>i.naturalWidth>0)')
        check('All three bundled museum pictures actually render over HTTP',True)
        check('Every picture has alt text and museum provenance',page.locator('.research-gallery img[alt]').count()==3 and page.locator('.research-gallery a').count()==3)
        screenshot(page,'gallery-desktop.png')
        navigate(page,'cognitive-gnosticism')
        page.evaluate('localStorage.setItem("unrelated-project-fixture","preserve")')
        page.locator('[data-research="save"]').click()
        check('Bookmark sets accessible pressed state',page.locator('[data-research="save"]').get_attribute('aria-pressed')=='true')
        page.reload(wait_until='domcontentloaded')
        page.locator('#research-actions').wait_for()
        check('Bookmark survives a real-origin page reload',page.locator('[data-research="save"]').get_attribute('aria-pressed')=='true')
        page.locator('#theology-kind').select_option('saved')
        check('Saved-page filter returns the stored reading list',page.locator('#page-list .page-link').count()==1)
        with page.expect_download() as downloaded:
            page.locator('[data-research="export"]').click()
        backup=json.loads(Path(downloaded.value.path()).read_text())
        check('Reading-list export contains actual saved state',backup=={'version':1,'saved':['cognitive-gnosticism']})
        page.locator('#reading-restore').set_input_files({'name':'restore.json','mimeType':'application/json','buffer':json.dumps({'version':1,'saved':['apocalyptic-repair-theology','not-a-page']}).encode()})
        page.wait_for_timeout(250)
        check('Restore merges known IDs and preserves existing selections',page.locator('#page-list .page-link').count()==2)
        check('Other applications storage is untouched',page.evaluate('localStorage.getItem("unrelated-project-fixture")')=='preserve')
        page.locator('#reading-restore').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'not json'})
        page.wait_for_timeout(150)
        check('Malformed backup gives a visible error',page.locator('#research-actions .wiki-error').count()==1)
        open_page(page,'reading-paths')
        check('Three reading routes are available',page.locator('#article-body h2, #article-body h3').count()>=3)
        page.goto(BASE+'?page=not-a-real-page',wait_until='domcontentloaded')
        page.wait_for_timeout(500)
        check('Unknown routes do not silently pretend to be home', page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower())
        # Delay one fetch while navigating elsewhere: only the newest article may render.
        open_page(page)
        page.route('**/content/developed/apocalyptic-repair-theology.md',lambda route: (page.wait_for_timeout(600),route.continue_()))
        page.evaluate('TheologyReader.navigate("apocalyptic-repair-theology",true);setTimeout(()=>TheologyReader.navigate("religion-for-conscious-robots",true),30)')
        page.wait_for_function('TheologyReader.current()?.slug==="religion-for-conscious-robots" && document.querySelector("#article-body")?.textContent.includes("humanity")')
        page.wait_for_timeout(800)
        check('Slow prior requests cannot overwrite a newer article',page.locator('#article-title').inner_text()==page.evaluate('TheologyReader.current().title') and 'robots' in page.locator('#article-title').inner_text().lower())
        page.unroute('**/content/developed/apocalyptic-repair-theology.md')
        # Alternative historic entry point stays compatible.
        page.goto(ORIGIN+'/theology-wiki/index.html?page=cognitive-gnosticism',wait_until='domcontentloaded')
        page.wait_for_function('window.TheologyReader?.current()?.slug==="cognitive-gnosticism"')
        page.locator('#research-actions').wait_for()
        check('Original reader route remains functional',page.locator('#article-body').inner_text().find('Cognitive')>=0)
        page.set_viewport_size({'width':390,'height':844})
        open_page(page)
        page.locator('#mobile-nav-toggle').click()
        check('Mobile page browser opens with dialog semantics',page.locator('.navigation-panel').get_attribute('aria-modal')=='true')
        check('Topic and sorting controls remain usable in the mobile drawer',page.locator('#theology-topic').is_visible() and page.locator('#theology-sort').is_visible())
        page.keyboard.press('Escape')
        check('Escape closes the drawer and returns focus',page.locator('#mobile-nav-toggle').get_attribute('aria-expanded')=='false' and page.evaluate('document.activeElement.id')=='mobile-nav-toggle')
        for slug in ['home','cognitive-gnosticism','agi-religious-framework','sources-index','connections','reading-paths','image-collection']:
            open_page(page,slug)
            page.wait_for_timeout(200)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Mobile horizontal overflow: '+slug
        check('Seven key views fit a 390-pixel viewport',True)
        open_page(page,'apocalyptic-repair-theology')
        screenshot(page,'article-mobile.png')
        open_page(page)
        screenshot(page,'home-mobile.png')
        # Explicit storage-denial fixture, separate from the real-origin persistence checks.
        blocked=ctx.new_page()
        blocked.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw Error('blocked by test')}})")
        open_page(blocked,'cognitive-gnosticism')
        blocked.locator('[data-research="save"]').click()
        check('Storage-denied readers get session-only saving with an explanation','session' in blocked.locator('#research-actions').inner_text().lower())
        blocked.close()
        check('No uncaught browser errors in the test suite',not ERRORS)
    except Exception:
        screenshot(page,'failure.png')
        (OUT/'failure.html').write_text(page.content())
        raise
    finally:
        (OUT/'browser-report.json').write_text(json.dumps({'passed':len(CHECKS),'checks':CHECKS,'errors':ERRORS,'origin':ORIGIN,'scope':'Native Chromium HTTP scripts, actual source fetching and SHA verification, actual local images, and real-origin storage. One separate storage-denial fixture is explicitly injected.'},indent=2))
        browser.close()
