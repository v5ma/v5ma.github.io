"""Full Vinci with real WebGL context loss/restoration during XR compatibility.
Only XR hardware/timing is simulated. No actor/progression or runtime rewriting.
"""
from pathlib import Path
import os,json,base64,math
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
KIND=os.environ.get('XR_ATTACHMENT','framebuffer')
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=ROOT/('startup-'+KIND+'-output');OUT.mkdir(exist_ok=True)
checks=[];errors=[];captures={}
def report():
 (OUT/'report.json').write_text(json.dumps({'base':BASE,'attachment':KIND,'checks':checks,'errors':errors,'captures':captures,'evidence':'Actual WEBGL_lose_context and recovered stereo framebuffers; synthetic WebXR hardware and delayed reference-space promise. Not physical Quest.'},indent=2))
def check(ok,text):
 assert ok,text
 checks.append(text);report();print('PASS:',text,flush=True)
# Compatibility switching can legitimately lose a graphics context. Exercise
# that path with the actual extension, not dispatch-only synthetic GL events.
compat=r'''
(()=>{
 const original=navigator.xr.requestSession;
 __xr.blockReference=false;__xr.compatibilitySwitches=0;
 navigator.xr.requestSession=async(...args)=>{
  const s=await original(...args),reference=s.requestReferenceSpace.bind(s);
  s.requestReferenceSpace=type=>__xr.blockReference?new Promise(()=>{}):reference(type);
  return s;
 };
 WebGL2RenderingContext.prototype.makeXRCompatible=function(){
  const gl=this,extension=gl.getExtension('WEBGL_lose_context');
  if(!extension)return Promise.reject(Error('Context-loss test extension unavailable'));
  __xr.compatibilitySwitches++;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Test graphics restoration timed out')),8000);
   gl.canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timer);resolve();},{once:true});
   gl.canvas.addEventListener('webglcontextlost',()=>setTimeout(()=>extension.restoreContext(),150),{once:true});
   extension.loseContext();
  });
 };
})();'''
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  for mode in ['first-person','diorama-vr']:
   ctx=browser.new_context(viewport={'width':1024,'height':720},service_workers='block')
   ctx.add_init_script(script='window.__XR_ATTACHMENT='+json.dumps(KIND)+';\n'+(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text()+'\n'+compat)
   page=ctx.new_page();page.set_default_timeout(60000)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded')
   page.wait_for_function("window.LeonardoGuild&&LeonardoGuild.inspect().xr.entry.vr===true")
   read=lambda:page.evaluate('LeonardoGuild.inspect()')
   initial=read();check(initial['mode']=='bike' and not initial['quarter']['active'],mode+': normal full Vinci entry retained')
   # One explicit failed session, followed by a new trusted click. No automatic
   # permission retry or hidden substitution of another requested view.
   if mode=='first-person':
    page.evaluate('__xr.blockReference=true')
    page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click()
    page.wait_for_function("LeonardoGuild.inspect().xr.entry.phase==='failed'&&__xr.session===null",timeout=20000)
    check('reference-space' in read()['xr']['entry']['error'],'Stalled reference-space initialization ends its session with a named error')
    check(not page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').is_disabled(),'The failed startup leaves the launcher usable for an explicit retry')
    page.evaluate('__xr.blockReference=false')
   for repeat in range(2):
    captures[mode+'-before-entry-'+str(repeat)]=read();report()
    selector=('#xr-pause-launcher' if repeat else '#xr-launcher')+' [data-xr-entry="'+mode+'"]'
    page.locator(selector).click()
    page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.frames>4')
    value=read();check(value['graphics']['restorations']==repeat+1,mode+': real graphics restoration completed on entry '+str(repeat+1))
    check(page.locator('#failure').get_attribute('hidden') is not None,mode+': recovered graphics release the blocking error screen')
    check(not value['graphics']['lost'] and value['xr']['presenting'],mode+': requested VR session remains active after recovery')
    start=value;page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]')
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>n+20',arg=value['xr']['frames'])
    page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]')
    check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.1,mode+': ordinary tracked-stick movement works after graphics recovery')
    # Pause through an actual input. Only the stable game-scene update may
    # sleep; headset poses, controller input and stereo rendering must continue.
    page.keyboard.press('p');page.wait_for_function('LeonardoGuild.inspect().paused')
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n+6',arg=read()['xr']['frames'])
    paused=read();page.evaluate('__xr.yaw=.2;__xr.pitch=-.06;__xr.roll=.12')
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n+12',arg=paused['xr']['frames'])
    moving_head=read();captures[mode+'-paused-work-'+str(repeat)]={'before':paused,'after':moving_head}
    check(moving_head['render']['frameWork']['skipped']>paused['render']['frameWork']['skipped'],mode+': an unchanged paused world avoids redundant scene updates')
    check(moving_head['xr']['spatial']['geometryDraws']>paused['xr']['spatial']['geometryDraws'] and moving_head['xr']['frames']>=paused['xr']['frames']+12,mode+': stereo rendering and tracking continue while paused scene work is cached')
    check((moving_head['x'],moving_head['z'],moving_head['credits'])==(paused['x'],paused['z'],paused['credits']) and moving_head['xr']['hud']['panel']['matrix']==paused['xr']['hud']['panel']['matrix'],mode+': head movement neither drags the desk nor moves the paused player')
    # Right B operates the existing Back action; the test cannot set paused.
    page.evaluate('__xr.sources[1].gamepad.buttons[5]={pressed:true,value:1}')
    page.wait_for_function('LeonardoGuild.inspect().running')
    page.evaluate('__xr.sources[1].gamepad.buttons[5]={pressed:false,value:0};__xr.yaw=0;__xr.pitch=0;__xr.roll=0')
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n+4',arg=read()['xr']['frames'])
    resumed=read();page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]')
    page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n+12',arg=resumed['xr']['frames'])
    page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]')
    check(math.hypot(read()['x']-resumed['x'],read()['z']-resumed['z'])>.1,mode+': B resumes normal tracked-stick gameplay after the cached pause')
    page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
    path=OUT/(mode+'-'+str(repeat)+'.png');path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
    im=Image.open(path).convert('RGBA');counts=[]
    for eye in range(2):counts.append(len({v[:3] for v in im.crop((eye*640+90,100,eye*640+550,620)).resize((100,100)).getdata() if v[3]>150}))
    captures[path.name]={'state':read(),'eye_colors':counts};check(min(counts)>30,mode+': recovered compositor draws nonblank game geometry in both eyes')
    page.evaluate('__xr.session.end()');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
    check(read()['paused'],mode+': actual session end returns to the paused game')
    check(read()['credits']==initial['credits'] and read()['deliveries']==initial['deliveries'],mode+': initialization and recovery do not grant or erase progress')
   ctx.close()
  check(not errors,'No captured application or shader errors during startup recovery')
 except Exception as error:
  captures['failure_message']=str(error)
  try:
   captures['failure_state']=read()
   captures['failure_dom']=page.evaluate("({hidden:document.hidden,focus:document.activeElement?.id,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,modal:d.matches(':modal')})),failureHidden:document.getElementById('failure').hidden,failureText:document.getElementById('failure-detail').textContent,hardwareSession:__xr.session?{ended:__xr.session.ended,visibility:__xr.session.visibilityState,pending:__xr.session.pending.size}:null})")
  except Exception as diagnostic_error:captures['diagnostic_error']=str(diagnostic_error)
  raise
 finally:report();browser.close()
