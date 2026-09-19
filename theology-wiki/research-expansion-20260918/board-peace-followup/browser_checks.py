"""Additional real HTTP checks called by the parent notebook's existing browser suite."""
def check_followup(browser, page, parent_url, checks):
    page.goto(parent_url, wait_until='networkidle')
    page.locator('a[href="board-peace-followup/index.html"]').click()
    page.wait_for_function("document.querySelector('#status').textContent.includes('9 claim records')")
    assert page.locator('#claim-cards article').count() == 9
    assert page.locator('#forecast-cards article').count() == 8
    assert page.locator('#research-cards article').count() == 4
    checks.append('Parent notebook links the actual follow-up with nine claims, eight forecast/scenarios and four research leads.')
    page.locator('#f-haiti summary').click()
    assert page.locator('#f-haiti details').get_attribute('open') is not None
    assert '253,725' in page.locator('#f-haiti').inner_text()
    assert 'acute malnutrition' in page.locator('#f-haiti').inner_text().lower()
    checks.append('Forecast source links, numbers and nutrition-scale qualifications render together.')
    assert page.locator('#board-governance a[href="https://boardofpeace.org/charter"]').count() == 1
    assert 'speculative' in page.locator('#freedom-cities').inner_text()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    checks.append('The follow-up preserves policy/source distinctions and fits a 390-pixel viewport.')
    url=page.url.split('#')[0]
    context=browser.new_context(java_script_enabled=False)
    plain=context.new_page();plain.goto(url)
    assert plain.locator('noscript').is_visible()
    assert plain.locator('a[href="register.json"]').count() >= 1
    context.close()
    failed=browser.new_page();failed.route('**/register.json',lambda route:route.abort());failed.goto(url)
    failed.wait_for_function("document.querySelector('#status').textContent.includes('could not load')")
    assert failed.locator('a[href="register.json"]').count() >= 1
    failed.close()
    checks.append('No-JavaScript and deliberately blocked-data states retain links to complete records.')
