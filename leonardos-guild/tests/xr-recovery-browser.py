"""Actual game/DOM/WebGL, native DOMPointReadOnly coordinates, synthetic XR input.
No actor, quest, clock, currency, focus or source-response writes.
"""
from pathlib import Path
import os,json,base64,importlib.util,math
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'quarter-recovery-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];captures={};pixel_checks={}
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  for mode in ['first-person','first-person-ar','diorama-vr','diorama-ar']:
   ctx=browser.new_context(viewport={'width':1024,'height':720},service_workers='block')
   ctx.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'))
   page=ctx.new_page();page.set_default_timeout(90000)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
   page.wait_for_function("LeonardoGuild.inspect().xr.entry.vr!=='checking'&&LeonardoGuild.inspect().xr.entry.ar!=='checking'")
   read=lambda:page.evaluate('LeonardoGuild.inspect()')
   original=read()
   def frames(n=4):
    target=read()['xr']['frames']+n
    page.wait_for_function('(target)=>LeonardoGuild.inspect().xr.frames>=target',arg=target)
   def press(hand,b):
    page.evaluate('([h,b])=>__xr.sources[h].gamepad.buttons[b]={pressed:true,value:1}',[hand,b]);frames(3)
    page.evaluate('([h,b])=>__xr.sources[h].gamepad.buttons[b]={pressed:false,value:0}',[hand,b]);frames(3)
   def capture(name):
    captures[name]=read();page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
    path=OUT/(name+'.png');path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]));return path
   page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click()
   page.wait_for_function("LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.phase==='running'");frames(6)
   check(page.evaluate("Object.keys(new DOMPointReadOnly(1,2,3)).length===0"),mode+': the native browser reproduces non-enumerable WebIDL pose fields')
   current=read();check(current['xr']['spatial']['viewFinite'] and current['xr']['spatial']['renderedEyes']==2,mode+': both eye views have finite production transforms')
   check(not current['xr']['spatial']['headBlocked'],mode+': entry does not incorrectly hide the world as a head collision')
   image=Image.open(capture(mode+'-world')).convert('RGBA');counts=[]
   for eye in range(2):
    w,h=image.size;x0=eye*w//2
    roi=image.crop((x0+w//10,h//8,x0+w//2-w//10,h*3//4)).resize((100,100))
    counts.append(len({tuple(v[:3]) for v in roi.getdata() if v[3]>200}))
   pixel_checks[mode]=counts
   check(min(counts)>40,mode+': both real framebuffer centers contain varied rendered content, not only a blank clear color')
   for cycle in range(3):
    # Look away from the title-room origin before asking for a menu.
    page.evaluate('v=>{__xr.yaw=v;__xr.pitch=-.25;}',.5+cycle*.2);frames(3);before=read();press(1,5)
    page.wait_for_selector('#quarter-dialog[open]');frames(4);shown=read()
    check(shown['paused'] and shown['xr']['hud']['panelVisible'],mode+': B opens a visible nearby dialog, cycle '+str(cycle+1))
    check(page.evaluate("document.querySelectorAll('dialog:modal').length===0"),mode+': immersive dialog avoids native 2D modal input capture')
    check(not shown['xr']['hud']['panel']['depthTest'],mode+': scenery cannot depth-hide the menu')
    check(page.evaluate('''async()=>{const T=await import('/leonardos-guild/vendor/three.module.js'),m=new T.Matrix4().fromArray(LeonardoGuild.inspect().xr.hud.panel.matrix),p=new T.Vector3().setFromMatrixPosition(m),q=new T.Quaternion().setFromEuler(new T.Euler(__xr.pitch,__xr.yaw,__xr.roll,'YXZ'));return p.sub(new T.Vector3(__xr.head.x,__xr.head.y,__xr.head.z)).normalize().dot(new T.Vector3(0,0,-1).applyQuaternion(q))>.999;}'''),mode+': dialog appears in the current gaze instead of the old room-side location')
    stable=shown['xr']['hud']['panel']['matrix'];page.evaluate('__xr.roll=.25');frames(8);paused=read()
    check(paused['xr']['spatial']['geometryDraws']>shown['xr']['spatial']['geometryDraws'] and paused['x']==before['x'] and paused['z']==before['z'],mode+': headset keeps rendering while simulation is intentionally paused')
    check(paused['xr']['hud']['panel']['matrix']==stable,mode+': head motion does not drag the open menu')
    if cycle==0:capture(mode+'-B-dialog')
    press(1,5);page.wait_for_function('LeonardoGuild.inspect().running');frames(4)
    check(not read()['xr']['hud']['panelVisible'],mode+': fresh B closes the dialog and hides the panel')
   page.evaluate('__xr.yaw=0;__xr.pitch=0;__xr.roll=0');frames(4)
   start=read();page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]');frames(12);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(30)
   check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.2,mode+': real stick movement resumes after repeated B use')
   press(0,5);page.wait_for_selector('#dispatch-dialog[open]')
   page.evaluate('__xr.replace(1,true)');frames(4)
   spec=importlib.util.spec_from_file_location('hands',ROOT/'tests/porter-xr-pointer.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
   handframes,panel,dom,handcapture=module.hand_ui(page)
   dom('[data-dispatch="map"]');page.wait_for_selector('#map-dialog[open]');frames(4);capture(mode+'-map');panel('back');page.wait_for_function('LeonardoGuild.inspect().running')
   check(read()['xr']['spatial']['viewFinite'],mode+': hand-selected map opens and closes through the original handlers')
   panel('pause');page.wait_for_selector('#pause-dialog[open]');dom('#guild-spatial-button');page.wait_for_selector('#guild-spatial-options[open]')
   panel('back');check(page.locator('#pause-dialog').get_attribute('open') is not None and read()['paused'],mode+': nested settings returns to its parent pause menu')
   panel('back');page.wait_for_function('LeonardoGuild.inspect().running');frames(4)
   check(read()['credits']==original['credits'] and read()['mission']==original['mission'] and read()['deliveries']==original['deliveries'],mode+': menu and tracking repairs do not manufacture progression')
   capture(mode+'-resumed');page.evaluate('__xr.session.end()');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');page.wait_for_selector('#pause-dialog[open]')
   check(page.evaluate("document.querySelector('#pause-dialog').matches(':modal')"),mode+': ordinary desktop modal behavior returns after XR exit')
   ctx.close()
  check(not errors,'No captured JavaScript, console or shader errors during native-pose four-mode recovery journeys')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'captures':captures,'pixel_checks':pixel_checks,'base':BASE,'evidence':'Real browser DOMPointReadOnly, DOM handlers and Three/WebGL. Headset poses/buttons are emulated. No physical Quest, comfort or performance approval.'},indent=2));browser.close()
