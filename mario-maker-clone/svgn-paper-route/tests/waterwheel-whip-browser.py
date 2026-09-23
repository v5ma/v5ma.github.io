"""Real preview, input and physics. Only controller samples and test observations
are assigned; never rider, velocity, collision, score, inventory or win state.
XR cases ride to the transfer in 2D, perform the actual link in stereo with a
tracked right grip, then complete through the supported 2D view. Not hardware approval.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3];GAME=ROOT/'mario-maker-clone/svgn-paper-route'
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/mill-bell'));OUT.mkdir(parents=True,exist_ok=True)
CASE=os.getenv('LINK_CASE','standard');GRIP=os.getenv('LINK_GRIP','forgiving');VIEW=os.getenv('LINK_VIEW','screen')
assert CASE in ('standard','early','late') and GRIP in ('forgiving','precision') and VIEW in ('screen','ar','vr')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/');BASE=origin+'/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;failure=None;result={}
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
DRIVER=r'''([scenario,presentation])=>{
 const d=window.bellDriver={scenario,presentation,input:'pad',ticks:0,visits:[],hook:null,released:null,received:null,returned:null,trace:[],xrReady:false,xrDone:false};
 const original=window.pollGamepad;
 const apply=(axis,jump,whip,pause,throwPaper)=>{
  if(d.input==='xr'){
   xrEmulator.axis(axis);xrEmulator.button('right',4,jump);xrEmulator.button('right',1,whip);xrEmulator.button('right',5,pause);xrEmulator.button('right',0,throwPaper);
  }else {testPad.axes[0]=axis;for(const [i,v]of[[0,jump],[4,whip],[9,pause],[1,throwPaper]])testPad.buttons[i]={pressed:v,value:v?1:0};}
 };
 window.pollGamepad=function(...args){
  if(RouteWorkshop.testing&&!__delivery.paused&&!__delivery.state.menu&&!won){
   d.ticks++;let axis=1,jump=false,whip=false,pause=false,paper=false;const p=player,id=p.track?.sky?.id;
   if(id&&!d.visits.includes(id))d.visits.push(id);
   if(!d.visits.length&&p.x>=3080&&p.onGround&&!p.track)d.jumping=true;
   if(d.jumping){jump=true;if(id==='ww-runway'){d.jumping=false;jump=false;}}
   if(presentation!=='screen'&&!d.xrReady&&p.x>=4900&&d.visits.includes('ww-crescent')){d.readyForXR=true;axis=0;pause=true;}
   else {
    if(!d.released&&p.x>=5000&&d.visits.includes('ww-crescent'))whip=true;
    if(p.peg?.id==='peg-143-39'){
     if(!d.hook){d.hook={tick:d.ticks,x:p.x,y:p.y,r:p.peg.r};if(d.input==='xr')window.bellHookImage=xrEmulator.image();}
     const angle=((p.peg.th%(2*Math.PI))+2*Math.PI)%(2*Math.PI),goal=scenario==='late'?1.3:.7;
     const release=scenario==='early'?d.ticks-d.hook.tick>=2:angle>=goal&&angle<goal+.24&&p.vx>0&&p.vy<0;
     if(release){d.released={tick:d.ticks,x:p.x,y:p.y,vx:p.vx,vy:p.vy,angle};whip=false;}
    }
    if(d.released&&id==='ww-gallery'&&!d.received){d.received={tick:d.ticks,x:p.x,y:p.y,face:p._railFace};if(d.input==='xr')window.bellReceiverImage=xrEmulator.image();}
    if(d.received&&d.input==='xr'&&!d.xrDone){d.readyForExit=true;axis=0;whip=false;pause=true;}
    if(d.hook&&!p.peg&&!p.track&&p.onGround&&!d.returned)d.returned={x:p.x,y:p.y,tick:d.ticks};
    if(scenario==='early'&&d.returned&&!deliveries){
     const distance=157*36+18-(p.x+p.w/2);
     if(!d.throwTick&&p.onGround&&distance<=135&&distance>=35)d.throwTick=d.ticks;
     if(d.throwTick){const age=d.ticks-d.throwTick;axis=0;paper=age>=4&&age<6;}
    }
   }
   apply(axis,jump,whip,pause,paper);
   if(d.ticks%12===0)d.trace.push({tick:d.ticks,x:p.x,y:p.y,rail:id||null,peg:p.peg?.id||null});
  }
  return original.apply(this,args);
 };
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block')
 if VIEW!='screen':ctx.add_init_script((GAME/'tests/xr-emulator.js').read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("window.testPad={id:'Mill Bell sampled Xbox',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>testPad.connected?[testPad]:[];localStorage.setItem('sprocket_muted','1');localStorage.setItem('sprocket_credits','777');localStorage.setItem('bell-save-sentinel','keep');localStorage.setItem('sprocket_padmap',JSON.stringify({whip:4}));")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=5):page.evaluate('(n)=>new Promise(resolve=>{function f(){if(--n<=0)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);})',n)
 def neutral():page.evaluate("()=>{testPad.axes.fill(0);testPad.buttons.forEach(b=>{b.pressed=false;b.value=0;});}");frames()
 def select(label):
  for _ in range(45):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.includes(s))',label):break
   page.evaluate("xrEmulator.point(' - Next')");frames();page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames();page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleWaterwheel&&window.SkyCycleFlightDeck&&window.__gpuReady&&PaperDeliveryCampaign.status==="ready"')
  saved=page.evaluate('Object.fromEntries(["sprocket_credits","sprocket_padmap","bell-save-sentinel","svgn_delivery_records_v1","svgn.skycycle.mastery.v1"].map(k=>[k,localStorage.getItem(k)]))')
  official=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-curve').click();page.wait_for_function('RouteWorkshop.testing&&player.onGround&&__cloudview?.root?.userData.waterwheelWhip')
  check(page.evaluate('__grapple.pegs().filter(p=>p.id==="peg-143-39").length===1'),'The ordinary curved preview exposes exactly the authored physical Mill Bell anchor')
  check(page.evaluate('__sky.state.data.requiredGrapples===0&&__sky.state.data.quota===0'),'The whip remains optional and the preview remains non-awarding')
  blueprint=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
  page.screenshot(path=str(OUT/'preview-entry.png'))
  page.locator('#rail-mode').select_option(GRIP)
  check(page.evaluate('RailGripCore.mode')==GRIP,'The requested existing grip mode is active')
  page.locator('#delivery-header [data-delivery="view"]').click();page.wait_for_function('__delivery.state.view==="2d"');page.locator('#cv').focus();page.evaluate(DRIVER,[CASE,VIEW])
  if VIEW!='screen':
   page.wait_for_function('bellDriver.readyForXR&&__delivery.paused',timeout=240000);neutral()
   page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter-ar' if VIEW=='ar' else '#sky-xr-enter').click()
   page.wait_for_function('SkyCycleXR.presenting&&SkyCycleXR.diagnostics.frames>6')
   page.evaluate("()=>{testPad.connected=false;bellDriver.input='xr';bellDriver.xrReady=true;}");frames();select('Resume play')
   page.wait_for_function('bellDriver.readyForExit&&__delivery.paused',timeout=240000)
   for key in ('bellHookImage','bellReceiverImage'):
    data=page.evaluate('(k)=>window[k]',key);(OUT/(VIEW+'-'+key+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
   check(page.evaluate('xrEmulator.request.type')=='immersive-'+VIEW,'The actual transfer used the requested stereo session')
   check(page.evaluate('bellDriver.hook&&bellDriver.received&&SkyCycleXR.diagnostics.eyes===2'),'Tracked right-grip cast and release reached the real gallery during stereo play')
   select('Exit XR');page.wait_for_function('!SkyCycleXR.presenting&&!__merged.scene.parent')
   page.evaluate("()=>{bellDriver.xrDone=true;bellDriver.input='pad';testPad.connected=true;}");neutral()
   page.locator('#delivery-header [data-delivery="view"]').click();page.wait_for_function('__delivery.state.view==="2d"')
   page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus()
  page.wait_for_function('won',timeout=240000);neutral()
  result=page.evaluate('({driver:bellDriver,events:__grapple.state.events,won,tries,deliveries,route:__delivery.state.route,required:__sky.state.data.requiredGrapples})')
  check(result['driver']['hook'] is not None and result['driver']['released'] is not None,'The journey includes an actual sampled whip cast and release, not a positioned rider')
  check(any(e['type']=='hook' and e.get('peg')=='peg-143-39' for e in result['events']),'The existing grapple owner recorded the genuine Mill Bell attachment')
  check(any(e['type']=='release' and e.get('id')=='peg-143-39' for e in result['events']),'The existing grapple owner recorded the genuine momentum release')
  if CASE=='early':
   check(result['driver']['returned']['x']<157*36-145,'Premature release recovers to the road before the useful terrace delivery')
   check(result['deliveries']==1 and page.evaluate('[...__delivery.state.delivered].some(s=>Number(s.split(",")[0])===157)'),'Recovery supports an actual paper delivery rather than merely delaying failure')
  else:check(result['driver']['received'] is not None,'The whip connection reaches the existing high postal gallery')
  check(result['won'] and result['tries']==1,'The continuous journey finishes at the real depot without a retry')
  page.screenshot(path=str(OUT/'depot-finish.png'))
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==official,'All eight official campaign builders remain unchanged')
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active&&!RouteWorkshop.testing')
  check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==blueprint,'Returning preserves the same editable curved relay document')
  check(page.evaluate('Object.fromEntries(["sprocket_credits","sprocket_padmap","bell-save-sentinel","svgn_delivery_records_v1","svgn.skycycle.mastery.v1"].map(k=>[k,localStorage.getItem(k)]))')==saved,'Preview rewards, legacy progress and controller remaps remain unchanged after return')
  check(not errors,'No uncaught errors during the relay, recovery and editor-return journey')
  check(not [x for x in logs if any(y in x.lower() for y in ['shader error','tsl:','gl_invalid','validation error'])],'No detected shader or GPU validation errors');passed=True
 except Exception as exc:
  failure=str(exc)
  try:result['failure_state']=page.evaluate('({x:player.x,y:player.y,rail:player.track?.sky.id,peg:player.peg,paused:__delivery.paused,driver:window.bellDriver})');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'case':CASE,'grip':GRIP,'view':VIEW,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'result':result,'coverage':'Actual game input, collision, whip, finish and save owners. Observed-state sampled Xbox; XR cases use tracked right grip in the transfer, 2D approach and completion. No gameplay-state assignments. No physical Quest/Xbox or full-XR chapter approval.'},indent=2));ctx.close();browser.close();server.shutdown()
