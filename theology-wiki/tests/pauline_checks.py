"""Actual reader companion, input changes, URLs, failures and responsive layouts."""
def run_pauline_checks(page, ctx, open_page, check, OUT, BASE):
    slug='james-and-contested-succession'
    def ready(extra=''):
        open_page(page,slug,extra)
        try:page.wait_for_selector('#pauline-lab[data-ready="true"]')
        except Exception:
            page.screenshot(path=str(OUT/'pauline-not-ready.png'))
            (OUT/'pauline-not-ready.html').write_text(page.content())
            raise
    def result():return page.locator('#pc-results').inner_text()
    page.set_viewport_size({'width':1440,'height':1000})
    ready()
    check('Pauline lab renders the archived earlier-founder illustration','124 years' in result() and '40 CE' in result() and '51 CE' in result())
    check('Persecution duration is not fabricated','Persecution duration: not specified' in result())
    page.locator('#pc-origin').select_option('visit')
    check('Changing the fourteen-year origin changes the later visit','54 CE' in result())
    page.locator('#pc-count').select_option('inclusive')
    check('Inclusive illustration keeps the origin selection and both changed intervals','39 CE' in result() and '52 CE' in result())
    address=page.locator('#pc-share').get_attribute('href')
    page.goto(address,wait_until='domcontentloaded');page.wait_for_selector('#pauline-lab[data-ready="true"]')
    check('Opening a shared address restores all chronology choices','52 CE' in result() and page.locator('#pc-count').input_value()=='inclusive' and page.locator('#pc-origin').input_value()=='visit')
    page.reload(wait_until='domcontentloaded');page.wait_for_selector('#pauline-lab[data-ready="true"]')
    check('A genuine reload retains the comparison','52 CE' in result())
    page.locator('#pc-recent').click()
    check('Recent-founder example gives a gap without equating it to persecution','7 years' in result() and 'not specified' in result())
    valid_url=page.url;page.locator('#pc-transition').fill('0')
    check('Historical year zero gives a visible error and clears stale results',page.locator('#pc-error').is_visible() and result()=='' and page.url==valid_url)
    check('Invalid result cannot be shared as a valid calculation',page.locator('#pc-share').get_attribute('href') is None)
    page.locator('#pc-earlier').click()
    check('Preset restores valid results after invalid input','124 years' in result() and not page.locator('#pc-error').is_visible())
    page.evaluate('TheologyPauline.enhance(TheologyReader.current())')
    check('Same-page enhancement does not duplicate the lab',page.locator('#pauline-lab').count()==1)
    page.locator('#pc-founder').focus();page.keyboard.press('Tab')
    check('Chronology controls have a usable keyboard order',page.locator('#pc-founderEra').evaluate('(e)=>e===document.activeElement'))
    for width,height,label in [(1440,1000,'desktop'),(390,844,'mobile')]:
        page.set_viewport_size({'width':width,'height':height})
        page.locator('#pauline-lab').evaluate('(e)=>e.scrollIntoView({block:"start"})')
        check('Chronology lab fits '+label,page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        check('Chronology controls retain 44px targets on '+label,page.locator('#pauline-lab input,#pauline-lab select,#pauline-lab button').evaluate_all('(nodes)=>nodes.every(n=>n.getBoundingClientRect().height>=44)'))
        page.screenshot(path=str(OUT/('pauline-lab-'+label+'.png')))
    ready('&pc_transition=%3Cimg%3E')
    check('Malformed URL restores a coherent example without injecting markup','Invalid comparison inputs' in page.locator('#pc-url-note').inner_text() and '124 years' in result() and page.locator('#pauline-lab img').count()==0)
    page.locator('#pc-earlier').click()
    check('A valid new choice clears the earlier invalid-address notice',page.locator('#pc-url-note').inner_text()=='')
    # Explicit transport failures: either missing optional script preserves reading.
    for asset in ['pauline-tools.js','pauline-core.js']:
        isolated=ctx.browser.new_context();p=isolated.new_page();failures=[]
        p.on('pageerror',lambda error:failures.append(str(error)))
        try:
            p.route('**/'+asset+'*',lambda route:route.abort())
            p.goto(BASE+'?page='+slug,wait_until='domcontentloaded')
            p.wait_for_function('document.querySelector("#article-body")?.textContent.includes("Three different clocks")')
            p.locator('a[href*="listen='+slug+'"]').wait_for()
            check('Missing optional script preserves full text and listening: '+asset,p.locator('#pauline-lab').count()==0 and '137 years' in p.locator('#article-body').inner_text() and not failures)
        finally:isolated.close()
    # Explicit browser-policy failure: useful results and a link remain available.
    ready()
    page.evaluate('()=>{window.__savedReplace=history.replaceState;history.replaceState=()=>{throw new Error("blocked history fixture")};return true;}')
    try:
        page.locator('#pc-origin').select_option('visit')
        check('History-write denial preserves calculation and share link','54 CE' in result() and 'pc_origin=visit' in page.locator('#pc-share').get_attribute('href') and 'did not update' in page.locator('#pc-url-note').inner_text())
    finally:page.evaluate('history.replaceState=window.__savedReplace;delete window.__savedReplace;')
    open_page(page,'thomas-sayings-and-transmission')
    check('Thomas continuation is live with the meal and inner-formation comparison','The received Christ and the Christ formed within' in page.locator('#article-body').inner_text() and page.locator('#pauline-lab').count()==0)
    page.set_viewport_size({'width':1440,'height':1000})
