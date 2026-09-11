"""Read-only deployment verification in a fresh browser context."""
from pathlib import Path
import json,os,time,urllib.request
from playwright.sync_api import sync_playwright
OUT=Path('frontier-evidence');OUT.mkdir(exist_ok=True)
BASE='https://v5ma.github.io/dino-atlas/'
for attempt in range(24):
 try:
  text=urllib.request.urlopen(BASE+'frontier-data.js?release='+str(time.time()),timeout=30).read().decode()
  if "ranger-operations-20260911.1" in text:break
 except Exception:pass
 time.sleep(5)
else:raise RuntimeError('The new deployment marker did not appear on GitHub Pages.')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':960});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'?release='+str(time.time()),wait_until='domcontentloaded');page.wait_for_function('window.__dinoRanger?.state.ready',timeout=90000)
 assert page.evaluate('__dinoRanger.state.build')=='ranger-operations-20260911.1'
 assert len(page.evaluate('__dinoRanger.state.animals'))==40
 page.locator('#start-button').click();page.wait_for_function('__dinoRanger.state.started')
 pos=page.evaluate('__dinoRanger.state.position.z');page.keyboard.down('KeyW')
 try:page.wait_for_function('(z)=>__dinoRanger.state.position.z<z-2',arg=pos,timeout=45000)
 finally:page.keyboard.up('KeyW')
 page.keyboard.press('Escape');page.wait_for_selector('#menu-dialog[open]');page.keyboard.press('Escape');page.wait_for_function('!__dinoRanger.state.paused')
 page.screenshot(path=str(OUT/'published-gameplay.png'),timeout=45000)
 assert not errors,errors
 result={'url':BASE,'build':'ranger-operations-20260911.1','checks':['new deployed release marker','40 residents in live scene','actual WebGL rendering','keyboard driving on published site','Escape opens and closes the menu','no uncaught JavaScript errors'],'uncaught_errors':errors}
 (OUT/'published-report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result));b.close()
