"""Real-browser passage comparison, exports, deep links, failures and mobile layout."""
import json

def run_evidence_checks(page, ctx, open_page, check, OUT, BASE):
    def ready(extra=''):
        open_page(page,'evidence-workbench',extra)
        page.wait_for_selector('#evidence-workspace[data-ready="true"]')
    page.set_viewport_size({'width':1440,'height':1000})
    ready('&claim=jt-knowledge&compare=jt-thomas-james')
    check('Evidence workspace exposes thirty claim choices',page.locator('#evidence-first option').count()==30)
    check('Deep link selects the actual James and Thomas comparison',page.locator('.evidence-card').count()==2 and page.locator('.evidence-card').nth(1).get_attribute('data-claim')=='jt-thomas-james')
    page.locator('#evidence-second').select_option('jt-priestly-portrait')
    check('Shared surviving channel is visible in the comparison','not automatically independent' in page.locator('#evidence-relation').inner_text())
    page.locator('#evidence-search').fill('unmatched-search-zzzz')
    check('No-results state does not discard the selected evidence',page.locator('#evidence-list button').count()==0 and page.locator('.evidence-card').count()==2 and 'No claims match' in page.locator('#evidence-list').inner_text())
    page.locator('#evidence-clear').click()
    page.locator('#evidence-topic').select_option('James and succession')
    page.locator('#evidence-status').select_option('Mediated ancient report')
    check('Evidence topic and type filters compose',page.locator('#evidence-list button').count()==3)
    page.locator('#evidence-search').fill('James transmitted')
    check('Every search word must match the same claim',page.locator('#evidence-list button').count()==1)
    with page.expect_download() as download:page.locator('#evidence-export-pair').click()
    p=download.value.path();pair=json.loads(p.read_text() if hasattr(p,'read_text') else open(p).read())
    check('Comparison export keeps exact claims and one shared source',len(pair['claims'])==2 and len(pair['references'])==1 and len(pair['inputs'])==2)
    with page.expect_download() as download:page.locator('#evidence-export-all').click()
    p=download.value.path();full=json.loads(p.read_text() if hasattr(p,'read_text') else open(p).read())
    check('Full export retains all thirty records and three source questions',len(full['claims'])==30 and len(full['authorPassages'])==3)
    page.locator('#evidence-swap').click()
    check('Swap updates the selected cards and shareable address',page.locator('#evidence-first').input_value()=='jt-priestly-portrait' and 'claim=jt-priestly-portrait' in page.url)
    page.reload(wait_until='domcontentloaded');page.wait_for_selector('#evidence-workspace[data-ready="true"]')
    check('Comparison and filters survive a genuine address reload',page.locator('#evidence-first').input_value()=='jt-priestly-portrait' and page.locator('#evidence-search').input_value()=='James transmitted')
    page.locator('#evidence-clear').click()
    page.locator('.evidence-card details').first.locator('summary').click()
    check('Source details retain actual quotation mediation','quoted through Eusebius' in page.locator('.evidence-card').first.inner_text())
    page.locator('.evidence-fallback summary').click()
    check('Complete reading fallback remains accessible',len(page.locator('.evidence-fallback').inner_text())>10000)
    page.locator('.evidence-fallback summary').click()
    page.locator('#evidence-search').focus();page.keyboard.press('Tab')
    check('Keyboard traversal reaches the next labeled filter',page.locator('#evidence-topic').evaluate('(el)=>el===document.activeElement'))
    for selector in ['#evidence-workspace h2','.evidence-card p','.evidence-card a','.evidence-kicker','#evidence-search']:
        ratio=page.locator(selector).first.evaluate(r'''(el)=>{
          const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
          const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
          const fg=rgb(getComputedStyle(el).color);let node=el,bg=[255,255,255];
          while(node){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}node=node.parentElement;}
          const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }''')
        check('Comparison text contrast is at least 4.5:1: '+selector,ratio>=4.5)
    page.locator('#evidence-workspace h2').evaluate('(el)=>el.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/'evidence-desktop.png'))
    page.locator('#evidence-cards').evaluate('(el)=>el.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/'evidence-comparison-desktop.png'))
    page.set_viewport_size({'width':390,'height':844})
    check('Evidence comparison fits a real 390px layout',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    page.screenshot(path=str(OUT/'evidence-mobile.png'))
    ready('&claim=not-a-real-claim&compare=%3Cimg%3E')
    check('Unknown claims give a safe visible explanation','unknown claim' in page.locator('#evidence-request-note').inner_text() and page.locator('#evidence-first').input_value()=='jt-knowledge')
    page.locator('#evidence-search').fill('<img src=x onerror=alert(1)>')
    check('Evidence search does not inject HTML',page.locator('#evidence-workspace img').count()==0)
    page.set_viewport_size({'width':1440,'height':1000})
    for slug in ['james-and-contested-succession','thomas-sayings-and-transmission']:
        open_page(page,slug)
        check('New authorial argument renders in full: '+slug,len(page.locator('#article-body').inner_text().split())>1800 and page.locator('#article-body a[data-page="evidence-workbench"]').count()>0)
        page.locator('#article-title').scroll_into_view_if_needed();page.screenshot(path=str(OUT/(slug+'-desktop.png')))
    open_page(page,'museum-trails');page.wait_for_function('document.querySelectorAll(".atlas-trail").length===10')
    for title in ['James: authority, family and knowledge','Thomas: reading, formation and carriers']:
        trail=page.locator('.atlas-trail').filter(has_text=title)
        check('New museum trail retains five full-argument stops: '+title,trail.count()==1 and trail.locator('.atlas-stop').count()==5)
    # Focused transport-failure fixture: no claim text or generated result is substituted.
    isolated=ctx.browser.new_context();p=isolated.new_page()
    try:
        p.route('**/data/evidence-workbench.json',lambda route:route.abort())
        p.goto(BASE+'?page=evidence-workbench',wait_until='domcontentloaded')
        p.wait_for_selector('#evidence-workspace[data-error="true"]')
        check('Failed evidence fetch preserves the complete static reading edition','James receives and transmits knowledge' in p.locator('#article-body').inner_text() and p.locator('#evidence-workspace [role="alert"]').count()==1)
    finally:isolated.close()
