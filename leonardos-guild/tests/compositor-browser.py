"""Actual compositor attachment readbacks; hardware poses are synthetic.
No gameplay, objective, reward, save or source-response assignments.
"""
from pathlib import Path
import os,json,base64,importlib.util
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
KIND=os.environ.get('XR_ATTACHMENT','framebuffer')
OUT=ROOT/('compositor-'+KIND+'-output');OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];captures={};pixels={}
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
def report():
 (OUT/'report.json').write_text(json.dumps({'attachment':KIND,'base':BASE,'checks':checks,'errors':errors,'captures':captures,'pixels':pixels,'evidence':'Real independent GL attachments; synthetic WebXR poses and controls. Not physical-device approval.'},indent=2))
with sync_playwright() as p:
 options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options)
 try:
  for mode in ['first-person','first-person-ar','diorama-vr','diorama-ar']:
   ctx=browser.new_context(viewport={'width':1024,'height':720},service_workers='block')
   ctx.add_init_script(script='window.__XR_ATTACHMENT='+json.dumps(KIND)+';\n'+(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text())
   page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(BASE+'/leonardos-guild/?district=quarter&quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
   page.wait_for_function("LeonardoGuild.inspect().xr.entry.vr!=='checking'&&LeonardoGuild.inspect().xr.entry.ar!=='checking'")
   read=lambda:page.evaluate('LeonardoGuild.inspect()')
   def frames(n=4):
    target=read()['xr']['frames']+n;page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n',arg=target)
   def press(hand,button):
    page.evaluate('v=>__xr.sources[v[0]].gamepad.buttons[v[1]]={pressed:true,value:1}',[hand,button]);frames(3)
    page.evaluate('v=>__xr.sources[v[0]].gamepad.buttons[v[1]]={pressed:false,value:0}',[hand,button]);frames(3)
   def capture(name):
    page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
    path=OUT/(name+'.png');path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]));captures[name]=read()
    im=Image.open(path).convert('RGBA');counts=[]
    for eye in range(2):
     crop=im.crop((eye*640+90,100,eye*640+550,620)).resize((100,100))
     counts.append(len({v[:3] for v in crop.getdata() if v[3]>150}))
    pixels[name]=counts;report();return min(counts)
   page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click();page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.presenting');frames(8)
   check(page.evaluate('__xr.compositor.nonDefault&&__xr.compositor.complete'),mode+': distinct complete compositor attachment')
   check(capture(mode+'-world')>30,mode+': both attachment eye regions contain varied game geometry')
   for cycle in range(2):
    press(1,5);page.wait_for_function('LeonardoGuild.inspect().paused');frames(6);before=read()
    check(capture(mode+'-menu-'+str(cycle))>30,mode+': menu and world rendered in headset attachment')
    frames(6);check(read()['xr']['frames']>before['xr']['frames'],mode+': paused menus do not halt compositor frame loop')
    press(1,5);page.wait_for_function('LeonardoGuild.inspect().running');frames(4)
   check(capture(mode+'-resumed')>30,mode+': scene returns after repeated B menus')
   page.evaluate('__xr.session.end()');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');check(read()['paused'],mode+': session exit restores paused screen game');report();ctx.close()
  check(not errors,'No captured console, JavaScript or shader errors')
 finally:report();browser.close()
