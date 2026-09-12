"""Real HTTP/WebGL character and shader journey, operated through normal inputs."""
import json,math,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];shader_errors=[];native=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'))
 c.add_init_script(path=str(ROOT/'aether-reach/tests/bellwether-input.js'))
 # Seed a rendering preference only on HTTP pages. Opaque about:blank has no storage origin.
 c.add_init_script("if(location.protocol==='http:'||location.protocol==='https:')localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'balanced'}))")
 p=c.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('console',lambda m:shader_errors.append(m.text) if 'Shader Error' in m.text or 'VALIDATE_STATUS' in m.text or 'WebGLProgram' in m.text and m.type=='error' else None)
 def popup(d):native.append(d.type);d.dismiss()
 p.on('dialog',popup)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=4):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f);}requestAnimationFrame(f);})',n)
 def tap(i):p.evaluate('(i)=>BlackoutDriver.tap(i)',i)
 def walk(x,z):p.evaluate('([x,z])=>BlackoutDriver.walk(x,z)',[x,z])
 def look(yaw,pitch=0):
  p.evaluate('''async ([yaw,pitch])=>{const end=performance.now()+120000;while(performance.now()<end){const p=AetherReach.snapshot().position,dy=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw)),dp=pitch-p.pitch;const axis=v=>Math.abs(v)<.025?0:Math.sign(v)*(.18+.82*Math.pow(Math.min(1,Math.abs(v)*1.1),1/1.35));if(Math.abs(dy)<.04&&Math.abs(dp)<.04){await BlackoutDriver.neutral();return;}TestPad.axes([0,0,axis(dy),-axis(dp)]);await new Promise(r=>requestAnimationFrame(r));}throw Error('Aim did not converge');}''',[yaw,pitch])
 def go(sel):
  for _ in range(110):
   v=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return[a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',sel)
   assert v[1]>=0,'Missing controller control '+sel
   if v[0]==v[1]:return
   tap(13 if v[0]<v[1] else 12)
  raise AssertionError('Focus failed '+sel)
 def choose(sel):go(sel);tap(0)
 try:
  base=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
  p.goto(base+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  p.wait_for_function('Object.values(AetherReach.snapshot().renderer.cast.status).every(v=>v==="ready")')
  p.evaluate('TestPad.connect()');frames();tap(0);frames(8)
  check(p.evaluate('AetherReach.version')=='0.10.0','The actual application boots Skyglass Cast')
  check(snap()['renderer']['cast']['errors']==[],'All three locally served CC0 skinned models load')
  tavi=lambda:next(a for a in snap()['renderer']['cast']['actors'] if a['id']=='tavi')
  check(tavi()['model']=='courier','Tavi is the licensed female adventurer rather than the primitive fallback')
  old=tavi()['animationTime'];frames(12);check(tavi()['animationTime']!=old,'Actual animation playback advances independently of the gameplay save')
  look(-2.2,-.12);p.screenshot(path=str(OUT/'skyglass-tavi.png'))
  tap(9);choose('#pause-settings');go('#visual-characters');tap(0);tap(1);tap(1);frames(5)
  check(snap()['renderer']['cast']['active']==0 and snap()['renderer']['foundry']['companionVisible'],'Controller toggle restores the visible fallback, never an invisible companion')
  tap(9);choose('#pause-settings');go('#visual-characters');tap(0);go('#visual-skyglass');tap(0);tap(1);tap(1);frames(5)
  check(snap()['renderer']['skyglass']['strength']==0,'Controller can disable the additional cloud-light shader')
  tap(9);choose('#pause-settings');go('#visual-skyglass');tap(0);go('#reduced');tap(0);tap(1);tap(1);frames(8)
  check(snap()['renderer']['skyglass']['clock']==0,'Reduced motion freezes decorative cloud movement')
  tap(9);choose('#pause-settings');go('#reduced');tap(0);tap(1);tap(1)
  walk(3,20);walk(8,26);look(.97,-.05);frames(12)
  check(snap()['renderer']['skyglass']['strength']>0 and snap()['renderer']['skyglass']['decks']==12,'Balanced quality shades the twelve physical island decks')
  p.screenshot(path=str(OUT/'skyglass-rifts.png'))
  check(snap()['interactionId']=='arena-customs-yard','The combat console remains reachable after the presentation upgrade')
  tap(2);frames(50);look(.97)
  check(any(a['id'].startswith('arena-') and a['model'] in ['guard','officer'] for a in snap()['renderer']['cast']['actors']),'Actual arena enemies receive animated human models without replacing gameplay actors')
  p.screenshot(path=str(OUT/'skyglass-guard-combat.png'))
  tap(9);choose('#pause-settings');go('#visual-quality');tap(15);tap(1);tap(1);frames(6)
  check(snap()['renderer']['cast']['limit']==6 and snap()['renderer']['skyglass']['strength']==0,'Light mode uses the smaller animated cast and no cloud shading')
  tap(9);choose('#pause-journal');check(snap()['devices']['menu']=='expedition-dialog','Adventure journal remains fully controller accessible');tap(1);tap(1)
  check(not errors and not shader_errors,'No application exceptions or WebGL shader compilation errors in real rendering')
  check(not native,'No native alert or confirm interrupts the controller journey')
  # Independent failed-asset boot must remain playable with procedural characters.
  p.goto('about:blank');p.route('**/art/characters/*.glb',lambda r:r.abort())
  p.goto(base+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  p.wait_for_function('Object.values(AetherReach.snapshot().renderer.cast.status).every(v=>v==="failed")')
  p.evaluate('TestPad.connect()');frames();tap(0);frames(8)
  check(snap()['playing'] and snap()['renderer']['cast']['active']==0 and snap()['renderer']['foundry']['companionVisible'],'Missing model requests leave the real game playable with visible fallback characters')
  check(not errors and not shader_errors,'Failure recovery does not produce an uncaught runtime or shader error')
  (OUT/'skyglass-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader_errors,'nativeDialogs':native,'scope':'Actual HTTP Chromium software WebGL and emulated Gamepad API. Balanced and Light rendering, 1280x800 CSS at half pixel density. Normal gameplay and menu actions; read-only snapshots. Includes blocked character-request fallback boot. Not physical Xbox/Quest, subjective visual approval or frame-rate certification.'},indent=2))
 except Exception as e:
  try:s=snap()
  except:s=None
  (OUT/'skyglass-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader_errors,'state':s},indent=2))
  try:p.screenshot(path=str(OUT/'skyglass-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
