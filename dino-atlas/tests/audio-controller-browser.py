"""Focused audio/UI controller acceptance checks.
A trusted pointer gesture is used only to satisfy browser WebAudio activation policy.
Every game/menu interaction after that uses the simulated standard Xbox layout.
"""
from pathlib import Path
import json,os,subprocess,time,traceback
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'frontier-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
server=None
if not os.getenv('TEST_BASE_URL'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
checks=[]
def check(v,label):assert v,label;checks.append(label);print('PASS:',label,flush=True)
PAD='''window.__padConnected=true;window.__pad={id:'CI Xbox standard layout',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>window.__padConnected?[window.__pad]:[],configurable:true});'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1280,'height':820});ctx.add_init_script(PAD);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def button(i,v):page.evaluate('([i,v])=>{__pad.buttons[i]={pressed:v>.35,touched:v>0,value:v};__pad.timestamp++;}',[i,v])
 def press(i):button(i,1);page.wait_for_timeout(170);button(i,0);page.wait_for_timeout(210)
 def wait(js,t=60000):page.wait_for_function(js,timeout=t)
 def focus(id,limit=80):
  for _ in range(limit):
   if page.evaluate('document.activeElement?.id')==id:return
   press(13)
  raise AssertionError('unable to focus '+id)
 try:
  page.goto(BASE+'/dino-atlas/?test=1',wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',90000)
  wait('document.querySelector("#music-volume")')
  check(page.locator('#music-volume').count()==1 and page.locator('#sfx-volume').count()==1 and page.locator('#ambience-volume').count()==1,'procedural audio mixer controls are injected into the pause menu')
  # Trusted gesture only unlocks WebAudio. It does not operate any game control.
  page.mouse.click(1260,800);page.wait_for_timeout(250)
  press(0);wait('__dinoRanger.state.started&&!__dinoRanger.state.paused')
  press(9);wait('document.querySelector("#menu-dialog").open')
  focus('music-volume');before=float(page.locator('#music-volume').input_value());press(15);after=float(page.locator('#music-volume').input_value())
  check(after>before,'D-pad right adjusts music volume without a mouse')
  stored=json.loads(page.evaluate("localStorage.getItem('dino-atlas.audio.v1')"))
  check(abs(stored['music']-after)<.001,'music-volume controller adjustment persists in its own audio save')
  focus('sfx-volume');sfx=float(page.locator('#sfx-volume').input_value());press(14);check(float(page.locator('#sfx-volume').input_value())<sfx,'D-pad left adjusts sound-effect volume')
  focus('ambience-volume');amb=float(page.locator('#ambience-volume').input_value());press(15);check(float(page.locator('#ambience-volume').input_value())>amb,'D-pad right adjusts ambience volume')
  focus('sound-button');label=page.locator('#sound-button').inner_text();press(0);check(page.locator('#sound-button').inner_text()!=label,'A toggles all procedural audio from the pause menu');press(0);check(page.locator('#sound-button').inner_text()==label,'A restores audio without leaving the controller')
  focus('reset-training');press(0);wait('document.querySelector("#confirm-dialog").open')
  check(not page.locator('#confirm-dialog').get_attribute('open') is None,'reset uses an in-game controller dialog, not native confirm')
  press(1);wait('document.querySelector("#menu-dialog").open');check(True,'B cancels the confirmation and returns to its parent menu')
  press(1);wait('!__dinoRanger.state.paused')
  # A disconnected pad should never strand a paused window that needs a mouse.
  page.evaluate('__padConnected=false');wait('document.querySelector("#menu-dialog").open')
  check(page.locator('#menu-dialog').is_visible(),'controller disconnect automatically pauses into the accessible menu')
  page.evaluate('__padConnected=true');page.wait_for_timeout(500);button(1,0);page.wait_for_timeout(300);press(1);wait('!__dinoRanger.state.paused')
  check(True,'reconnected controller closes the pause menu with B')
  check(not errors,'audio/controller pass has no uncaught JavaScript errors')
  page.screenshot(path=str(OUT/'10-audio-controller-menu.png'),timeout=45000)
  result={'passed':len(checks),'checks':checks,'uncaught_errors':errors,'note':'The single pointer gesture only unlocks WebAudio under browser autoplay policy; all tested game and menu actions use the simulated standard Xbox controller.'};(OUT/'audio-controller-report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
 except Exception as e:
  (OUT/'audio-controller-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'uncaught_errors':errors},indent=2));traceback.print_exc();raise
 finally:
  browser.close()
  if server:server.terminate()
