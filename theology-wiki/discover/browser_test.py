"""Run against served publication artifact with DISCOVERY_URL. Requires Playwright."""
import os
from playwright.sync_api import sync_playwright
url=os.environ.get('DISCOVERY_URL','http://127.0.0.1:8000/theology-wiki/discover/index.html')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH'))
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_selector('#results li');assert page.locator('#results li').count()==30
  page.locator('#query').fill('Pilate');page.wait_for_timeout(250);assert page.locator('#results').inner_text().find('Pilate from Roman prefect')>=0
  page.locator('#type').select_option('discussion');assert all(x=='Archived discussion' for x in page.locator('#results small').all_text_contents())
  page.locator('#query').fill('zzqqqqqqqq');page.wait_for_timeout(250);assert page.locator('#results li').count()==0
  page.locator('#clear').click();assert page.locator('#results li').count()==30;assert page.locator('#query').evaluate('(e)=>e===document.activeElement')
  page.locator('#more').click();assert page.locator('#results li').count()==60
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth');assert not errors;page.close()
 page=browser.new_page();page.goto(url+'?q=Pilate&type=study');page.wait_for_selector('#results li');assert page.locator('#query').input_value()=='Pilate';assert page.locator('#type').input_value()=='study'
 page.goto(url+'?q=Qumran');page.go_back();assert page.locator('#query').input_value()=='Pilate'
 plain=browser.new_context(java_script_enabled=False).new_page();plain.goto(url);assert plain.locator('#catalog li').count()>600;assert plain.locator('#routes a').count()>0
 browser.close()
print('Discovery browser checks passed')
