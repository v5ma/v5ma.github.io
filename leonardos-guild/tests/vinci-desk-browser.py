"""Full main adventure, actual framebuffers, native scene-desk ray selections.
Only synthetic controller/hand poses and buttons are supplied to ordinary source.
"""
from pathlib import Path
import os,json,base64,math,importlib.util
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];KIND=os.environ.get('XR_ATTACHMENT','framebuffer')
OUT=ROOT/('desk-'+KIND+'-output');OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];captures={};pixels={}
def report():
 (OUT/'report.json').write_text(json.dumps({'base':BASE,'attachment':KIND,'checks':checks,'errors':errors,'captures':captures,'pixels':pixels,'evidence':'Actual WebGL eye attachments with native DOMPointReadOnly; synthetic hardware only. Full game enters normally; no game/source state writes.'},indent=2))
def check(ok,text):
 assert ok,text
 checks.append(text);report();print('PASS:',text,flush=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  for mode in ['first-person','first-person-ar','diorama-vr','diorama-ar']:
   ctx=browser.new_context(viewport={'width':1024,'height':720},service_workers='block')
   ctx.add_init_script(script='window.__XR_ATTACHMENT='+json.dumps(KIND)+';\n'+(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text())
   page=ctx.new_page();page.set_default_timeout(65000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
   page.wait_for_function("LeonardoGuild.inspect().xr.entry.vr!=='checking'&&LeonardoGuild.inspect().xr.entry.ar!=='checking'")
   read=lambda:page.evaluate('LeonardoGuild.inspect()')
   check(not read()['quarter']['active'] and read()['mode']=='bike',mode+': normal entry is the original full Vinci bicycle adventure')
   initial=read();page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click();page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.presenting')
   def frames(n=4):
    t=read()['xr']['frames']+n;page.wait_for_function('(t)=>LeonardoGuild.inspect().xr.frames>=t',arg=t)
   def press(hand,b):
    page.evaluate('v=>__xr.sources[v[0]].gamepad.buttons[v[1]]={pressed:true,value:1}',[hand,b]);frames(3)
    page.evaluate('v=>__xr.sources[v[0]].gamepad.buttons[v[1]]={pressed:false,value:0}',[hand,b]);frames(3)
   def capture(name):
    name=mode+'-'+name;page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
    path=OUT/(name+'.png');path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]));captures[name]=read();im=Image.open(path).convert('RGBA');counts=[]
    for eye in range(2):counts.append(len({v[:3] for v in im.crop((eye*640+60,80,eye*640+580,650)).resize((100,100)).getdata() if v[3]>150}))
    pixels[name]=counts;report();return min(counts)
   frames(10);check(page.evaluate('__xr.compositor.complete&&__xr.compositor.nonDefault'),mode+': renderer uses independent headset attachments')
   check(capture('entry')>30,mode+': both actual eye targets display game content')
   check(not read()['xr']['hud']['panelVisible'] and read()['xr']['hud']['panel']['statusVisible'],mode+': only compact status is visible during play')
   page.evaluate('__xr.replace(1,true)');frames(4)
   spec=importlib.util.spec_from_file_location('hands',ROOT/'tests/porter-xr-pointer.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
   _,panel,dom,_=module.hand_ui(page)
   panel('vehicle');frames(5);check(read()['mode']=='foot',mode+': hand UI dismounts the existing bicycle without replacing the game')
   check(not read()['xr']['hud']['panelVisible'],mode+': quick action dismisses the desk rather than leaving a large panel')
   page.evaluate('__xr.replace(1,false)');frames(4)
   for i in range(2):
    press(1,5);page.wait_for_function('LeonardoGuild.inspect().paused');shown=read();capture('B-menu-'+str(i))
    check(shown['xr']['hud']['panelVisible'] and shown['xr']['hud']['panel']['reference']=='stationary-floor-desk',mode+': B opens an explicit scene desk')
    matrix=shown['xr']['hud']['panel']['matrix'];page.evaluate('__xr.yaw=.4;__xr.pitch=-.2;__xr.roll=.3');frames(8)
    check(read()['xr']['hud']['panel']['matrix']==matrix and read()['xr']['frames']>shown['xr']['frames'],mode+': reading desk stays fixed and compositor keeps running')
    press(1,5);page.wait_for_function('LeonardoGuild.inspect().running');frames(4)
    check(not read()['xr']['hud']['panelVisible'],mode+': B returns directly to playable movement')
   page.evaluate('__xr.yaw=0;__xr.pitch=0;__xr.roll=0');frames(4)
   if mode.startswith('diorama'):
    before=read()['xr']['spatial']['boxPosition'];page.evaluate('__xr.sources[1].gamepad.axes=[0,0,.6,.8]');frames(10);page.evaluate('__xr.sources[1].gamepad.axes=[0,0,0,0]');frames(4)
    check(read()['xr']['spatial']['worldUp']==[0,1,0] and read()['xr']['spatial']['cameraPitch']==0,mode+': right stick cannot tip world-up')
    check(read()['xr']['spatial']['boxPosition']==before,mode+': right stick cannot move the accepted box')
   # Deliberately summon the pause desk, then select its real 3D transform controls.
   page.evaluate('__xr.replace(1,true)');frames(4);panel('pause');page.wait_for_selector('#pause-dialog[open]');frames(3)
   def desk(id):
    page.evaluate('''async id=>{const T=await import('/leonardos-guild/vendor/three.module.js'),s=__xr.sources[1],c=LeonardoGuild.inspect().xr.hud.panel.controls.find(c=>c.id===id),p=new T.Vector3().setFromMatrixPosition(new T.Matrix4().fromArray(c.matrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),p.sub(new T.Vector3().copy(s.position)).normalize());s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',id)
    page.evaluate('__xr.sources[1].pinch=.06');frames(3);page.evaluate('__xr.sources[1].pinch=.014');frames(3);page.evaluate('__xr.sources[1].pinch=.06');frames(4)
   h=read()['xr']['hud']['panel']['preferences']['height'];desk('raise');check(read()['xr']['hud']['panel']['preferences']['height']>h,mode+': actual hand ray activates the raised 3D height control')
   sc=read()['xr']['hud']['panel']['preferences']['scale'];desk('larger');check(read()['xr']['hud']['panel']['preferences']['scale']>sc,mode+': actual hand ray resizes the scene panel')
   desk('status');check(read()['xr']['hud']['panel']['preferences']['status']=='floor',mode+': status can move from wrist to floor')
   dom('#desk-map');page.wait_for_selector('#map-dialog[open]');frames(3);capture('map');panel('back');frames(3)
   check(read()['paused'] and page.locator('#pause-dialog').get_attribute('open') is not None,mode+': nested map returns to its existing pause parent')
   for selector,child in [('#desk-missions','#doors-dialog'),('#desk-inventory','#life-dialog')]:
    snapshot=read();dom(selector);page.wait_for_selector(child+'[open]');frames(3)
    check(read()['paused'] and page.locator('#pause-dialog').get_attribute('open') is not None,mode+': '+selector+' opens its child while the parent and simulation stay paused')
    check((read()['x'],read()['z'],read()['credits'])==(snapshot['x'],snapshot['z'],snapshot['credits']),mode+': notebook opening cannot move the player or pay a reward')
    capture(selector[1:]);panel('back');frames(3)
    check(page.locator(child).get_attribute('open') is None and read()['paused'] and page.locator('#pause-dialog').get_attribute('open') is not None,mode+': notebook Back returns to the pause parent')
   dom('#resume');page.wait_for_function('LeonardoGuild.inspect().running');frames(5)
   start=read();page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]');frames(15);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(35)
   check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.1,mode+': real movement resumes after nested menus and resizing')
   check(read()['credits']==initial['credits'] and read()['deliveries']==initial['deliveries'],mode+': UI changes grant no items or rewards')
   capture('resumed');panel('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');check(read()['paused'],mode+': in-scene Exit ends the actual session')
   saved=page.evaluate("JSON.parse(localStorage.getItem('svgn.leonardos-guild.field-desk.v1'))")
   check(saved['height']>h and saved['scale']>sc and 'x' not in saved,mode+': preferences persist without room coordinates')
   ctx.close()
  check(not errors,'No captured JavaScript, console or shader errors')
 finally:report();browser.close()
