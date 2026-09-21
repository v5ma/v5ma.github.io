"""Actual game and compositor textures; only headset hardware is simulated.
No actor, progression, reward, clock, DOM focus or production-source writes.
"""
from pathlib import Path
import base64,json,os
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
KIND=os.environ.get('XR_ATTACHMENT','framebuffer')
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=ROOT/('compositor-'+KIND+'-output');OUT.mkdir(exist_ok=True)
checks=[];errors=[];captures={};failures=[]
def check(value,label):
 if not value:raise AssertionError(label)
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  for mode in ['first-person','first-person-ar','diorama-vr','diorama-ar']:
   ctx=browser.new_context(viewport={'width':1024,'height':720},service_workers='block')
   ctx.add_init_script((ROOT/'tests/xr-hardware-mock.js').read_text()+"\nwindow.__compositorKind="+json.dumps(KIND)+";\n"+(ROOT/'tests/xr-compositor-mock.js').read_text())
   page=ctx.new_page();page.set_default_timeout(45000)
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   read=lambda:page.evaluate('LeonardoGuild.inspect()')
   def frames(n=4):
    target=read()['xr']['frames']+n
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n',arg=target)
   def press(b):
    page.evaluate('b=>__xr.sources[1].gamepad.buttons[b]={pressed:true,value:1}',b);frames(3)
    page.evaluate('b=>__xr.sources[1].gamepad.buttons[b]={pressed:false,value:0}',b);frames(3)
   def capture(label):
    page.evaluate('__compositor.capture=null;__compositor.captureNext=true');page.wait_for_function('__compositor.capture')
    path=OUT/(mode+'-'+label+'.png');path.write_bytes(base64.b64decode(page.evaluate('__compositor.capture').split(',',1)[1]));captures[mode+'-'+label]=read()
    image=Image.open(path).convert('RGBA');counts=[]
    for x in [0,640]:
     sample=image.crop((x+100,100,x+540,630)).resize((100,100))
     counts.append(len({tuple(v[:3]) for v in sample.getdata() if v[3]>200}))
    print('COMPOSITOR PIXELS',mode,label,counts,flush=True);return counts
   try:
    page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function("window.LeonardoGuild&&LeonardoGuild.inspect().xr.entry.vr!=='checking'")
    original=read();page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click()
    page.wait_for_function("LeonardoGuild.inspect().xr.entry.phase==='running'&&LeonardoGuild.inspect().running");frames(5)
    check(page.evaluate('__compositor.nonDefault===true'),mode+': distinct compositor attachment allocated')
    check(min(capture('world'))>40,mode+': both compositor eye images contain game content')
    check(not read()['xr']['spatial']['headBlocked'],mode+': valid first-person origin does not hide the world')
    for cycle in range(2):
     page.evaluate('v=>{__xr.yaw=v;__xr.roll=.2;}',.5+cycle*.2);frames(2);press(5)
     page.wait_for_function('LeonardoGuild.inspect().paused&&LeonardoGuild.inspect().xr.hud.panelVisible')
     check(min(capture('menu-'+str(cycle)))>40,mode+': menu reaches both eye textures')
     before=read();frames(6);after=read()
     check(after['xr']['frames']>before['xr']['frames'] and after['x']==before['x'] and after['z']==before['z'],mode+': paused menu keeps XR rendering')
     press(5);page.wait_for_function('LeonardoGuild.inspect().running')
     check(not read()['xr']['hud']['panelVisible'],mode+': B returns to play')
    check(read()['credits']==original['credits'] and read()['mission']==original['mission'],mode+': menu cycles do not manufacture progress')
    # The legacy Enter/Exit control is a trusted ordinary button, not a session-state assignment.
    page.evaluate("document.getElementById('guild-xr-pause').click()")
    page.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
    check(read()['paused'],mode+': session exit restores a paused ordinary game')
    check(not page.evaluate('__compositor.errors.length'),mode+': compositor readback is free of GL errors')
   except Exception as e:
    failures.append({'mode':mode,'error':str(e)});print('FAIL:',mode,str(e),flush=True)
    try:captures[mode+'-failure']=read();capture('failure')
    except Exception:pass
   finally:ctx.close()
 finally:
  browser.close();(OUT/'report.json').write_text(json.dumps({'attachment':KIND,'base':BASE,'checks':checks,'errors':errors,'failures':failures,'captures':captures,'evidence':'Native GPU rendering to non-default WebGL FBO or projection textures; emulated hardware, not physical Quest.'},indent=2))
assert not failures and not errors,json.dumps({'failures':failures,'errors':errors})
