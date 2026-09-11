from pathlib import Path
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.6)
errors=[]
PAD="""window.__pad={id:'CI Xbox standard layout',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});"""
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':1100,'height':720})
  context.add_init_script(PAD)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def press(i):
   page.evaluate('i=>{__pad.buttons[i]={pressed:true,touched:true,value:1};__pad.timestamp++;}',i)
   page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   page.evaluate('i=>{__pad.buttons[i]={pressed:false,touched:false,value:0};__pad.timestamp++;}',i)
   page.wait_for_timeout(180)
  page.goto('http://127.0.0.1:4173/dino-atlas/?test=1',wait_until='domcontentloaded',timeout=90000)
  page.wait_for_function('window.__dinoRanger?.state.ready',timeout=120000)
  state=page.evaluate('__dinoRanger.state')
  assert len(state['animals'])==64, f"expected 64 animals, got {len(state['animals'])}"
  assert page.evaluate("document.querySelectorAll('#journal-list .entry').length") in (0,30)
  assert page.evaluate('__dinoSpectacle.sonicGates')==4
  assert page.evaluate('__dinoSpectacle.gravityNodes')==3
  assert page.evaluate('__dinoSpectacle.rivals.length')==3
  assert page.evaluate('__dinoEconomy.state.capacity')==32
  page.click('#start-button');page.wait_for_timeout(250)
  page.evaluate('__dinoEconomy.open()');page.wait_for_timeout(250)
  assert page.evaluate("document.getElementById('market-dialog').open")
  assert page.evaluate("document.querySelectorAll('#market-list .market-row').length")==12
  before=page.evaluate('__dinoEconomy.state.credits')
  page.evaluate("document.querySelector('#market-list button[data-buy]:not(:disabled)').focus()")
  press(0)
  after=page.evaluate('__dinoEconomy.state.credits')
  assert after < before, f'Xbox A did not buy cargo: {before} -> {after}'
  press(1)
  page.wait_for_timeout(200)
  assert not page.evaluate("document.getElementById('market-dialog').open"), 'Xbox B did not close market'
  page.evaluate("window.dispatchEvent(new CustomEvent('dino-spectacle',{detail:{type:'sonic'}}))")
  page.wait_for_timeout(60)
  assert page.evaluate("document.getElementById('spectacle-flash').classList.contains('go')")
  assert not errors, 'page errors: '+repr(errors)
  browser.close()
 print('PASS: 64 animals, 30-species expansion, spectacle globals, 12-good market, Xbox A trade, Xbox B close, sonic flash')
finally:
 server.terminate()
 try: server.wait(timeout=3)
 except: server.kill()
