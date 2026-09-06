"""Browser-standard controller integration using an emulated Gamepad device.
This is not USB/Bluetooth hardware testing; no game state is assigned.
"""
import json,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-controller');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1080,'height':720},service_workers='block')
 c.add_init_script('''localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,sensitivity:85}));window.pad={connected:true,mapping:'standard',index:0,id:'Test Standard Device',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.pad]});''')
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(60000)
 def press(index,condition):
  page.evaluate('(i)=>{pad.buttons[i]={pressed:true,touched:true,value:1}}',index);page.wait_for_function(condition);page.evaluate('(i)=>{pad.buttons[i]={pressed:false,touched:false,value:0}}',index);page.wait_for_timeout(150)
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.Rainward&&document.getElementById("device").textContent.includes("STANDARD")');page.wait_for_timeout(200)
  press(0,'Rainward.mode==="play"');check(True,'The standard controller starts the game from the title')
  press(1,'Rainward.state.player.stance==="crouch"');press(11,'Rainward.state.player.stance==="prone"');check(True,'Controller crouch and prone reach the shared posture system')
  press(11,'Rainward.state.player.stance==="stand"');z=page.evaluate('Rainward.state.player.z');page.evaluate('pad.axes[1]=-.65');page.wait_for_function('(z)=>Rainward.state.player.z<z-.6',arg=z);page.evaluate('pad.axes[1]=0');check(True,'Analog left-stick input moves the actual collision-controlled player')
  yaw=page.evaluate('Rainward.view.yaw');page.evaluate('pad.axes[2]=.6');page.wait_for_function('(y)=>Math.abs(Rainward.view.yaw-y)>.25',arg=yaw);page.evaluate('pad.axes[2]=0');check(True,'The right stick rotates the third-person camera')
  page.evaluate('pad.buttons[6]={pressed:true,value:1}');page.wait_for_function('Rainward.state.player.aim');press(7,'Rainward.state.player.mag<6');page.evaluate('pad.buttons[6]={pressed:false,value:0}');press(2,'Rainward.state.player.reload>0');page.wait_for_function('Rainward.state.player.mag===6&&Rainward.state.player.reload===0');check(True,'Triggers aim/fire and X reloads finite ammunition')
  press(8,'Rainward.mode==="map"');t=page.evaluate('Rainward.state.t');page.wait_for_timeout(300);check(page.evaluate('Rainward.state.t')==t,'Controller View opens a paused field map');press(1,'Rainward.mode==="play"')
  page.evaluate('pad.connected=false');page.wait_for_function('Rainward.mode==="pause"');check(True,'Disconnecting the active pad pauses rather than leaving a held action running')
  page.evaluate('pad.connected=true;pad.buttons[7]={pressed:true,value:1}');mag=page.evaluate('Rainward.state.player.mag');page.wait_for_timeout(250);check(page.evaluate('Rainward.state.player.mag')==mag,'Held fire is not armed by reconnecting a controller')
  page.evaluate('pad.buttons[7]={pressed:false,value:0}');page.wait_for_timeout(200);press(0,'Rainward.mode==="play"');check(True,'A neutral controller can resume the paused game')
  check(not errors,'No uncaught errors in emulated controller integration');page.screenshot(path=str(OUT/'controller-view.png'))
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Emulated standard-mapped navigator.getGamepads in native WebGL; no physical Xbox or Bluetooth certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:c.close();b.close()
