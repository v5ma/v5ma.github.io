"""Real preview, ordinary inputs and native collision. No gameplay-state writes.
The test-only driver samples the existing Gamepad API; it never moves the rider.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/waterwheel-fork'));OUT.mkdir(parents=True,exist_ok=True)
CASE=os.getenv('FORK_CASE','lower');GRIP=os.getenv('FORK_GRIP','forgiving')
assert CASE in ('high','lower','early','coast') and GRIP in ('forgiving','precision')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/');BASE=origin+'/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;failure=None;result={}
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
DRIVER=r"""([scenario,grip])=>{
 const d=window.forkDriver={scenario,grip,phase:'approach',ticks:0,hold:0,visits:[],contacts:[],trace:[],inspection:false,returned:null,throwStarted:false};
 const b=(i,v)=>{testPad.buttons[i]={pressed:v,value:v?1:0};};
 // Sample before each real fixed simulation step, not each rendered frame.
 const previous=window.pollGamepad;
 window.pollGamepad=function(...args){
  const active=RouteWorkshop.testing&&!__delivery.paused&&!won&&!__delivery.state.menu;
  if(active){
   d.ticks++;testPad.axes[0]=1;b(0,false);b(1,false);b(9,false);
   if(d.resumeNeutral>0){testPad.axes[0]=0;d.resumeNeutral--;return previous.apply(this,args);}
   const id=player.track?.sky?.id;
   if(d.phase==='approach'&&player.x>=3080&&player.onGround&&!player.track)d.phase='jump';
   if(d.phase==='jump'){b(0,true);if(id==='ww-runway'){b(0,false);d.phase='runway';}}
   if(d.phase==='runway'&&id==='ww-runway'){
    const remaining=player.track.len-player.trackS;
    const threshold=scenario==='early'?240:scenario==='coast'?320:200;
    if(scenario!=='high'&&remaining<=threshold){d.phase='hold';d.brake={x:player.x,y:player.y,remaining,speed:player.speed};}
   }
   if(d.phase==='hold'){
    if(d.hold<(scenario==='early'?24:scenario==='coast'?70:18)){testPad.axes[0]=scenario==='coast'?0:-1;d.hold++;}
    else {d.phase='flight';testPad.axes[0]=1;}
   }
   if(d.visits.includes('ww-runway')&&!player.track&&player.onGround&&!d.returned){
    d.returned={x:player.x,y:player.y,vx:player.vx,tick:d.ticks};d.phase=scenario==='lower'?'delivery':'finish';
   }
   if(scenario==='lower'&&id==='ww-collector'&&!d.inspection){d.inspection=true;d.resumeNeutral=2;b(9,true);}
   if(d.phase==='delivery'){
    const distance=157*36+18-(player.x+player.w/2);
    if(!d.throwStarted&&player.onGround&&distance<=135&&distance>=35){d.throwStarted=true;d.throwTick=d.ticks;d.throw={distance,vx:player.vx,nearest:nearestMailbox(player,250)};}
    if(d.throwStarted){const since=d.ticks-d.throwTick;testPad.axes[0]=0;b(1,since>=4&&since<6);if(deliveries>=1){d.phase='finish';testPad.axes[0]=1;b(1,false);}}
   }
  }
  const value=previous.apply(this,args);
  if(active){
   const id=player.track?.sky?.id||null;if(id&&!d.visits.includes(id))d.visits.push(id);if(id!==d.lastRail){d.contacts.push({id,tick:d.ticks,x:player.x,y:player.y});d.lastRail=id;}
   if(!d.trace.length||Math.abs(player.x-d.trace.at(-1).x)>55||id!==d.trace.at(-1).rail)d.trace.push({tick:d.ticks,x:player.x,y:player.y,vx:player.vx,rail:id,onGround:player.onGround,phase:d.phase});
  }
  return value;
 };
 return true;
}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script("window.testPad={id:'Standard Xbox fork test',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad];")
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');localStorage.setItem('sprocket_credits','777');localStorage.setItem('fork-old-save','preserve');localStorage.setItem('svgn.skycycle.sensory.v1',JSON.stringify({notices:'essential',transients:'gentle',ambience:0}));localStorage.setItem('sprocket_padmap',JSON.stringify({whip:4}));")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):page.evaluate('(n)=>new Promise(r=>{function step(){if(--n<=0)r();else requestAnimationFrame(step);}requestAnimationFrame(step);})',n)
 def capture(name):page.screenshot(path=str(OUT/(name+'.png')))
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleWaterwheel && window.SkyCycleFlightDeck && window.__gpuReady && PaperDeliveryCampaign.status==="ready"')
  page.locator('#rail-mode').select_option(GRIP)
  before=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  saved=page.evaluate('Object.fromEntries(["fork-old-save","sprocket_credits","sprocket_padmap","svgn_delivery_records_v1","svgn.skycycle.mastery.v1"].map(k=>[k,localStorage.getItem(k)]))')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-ride').click();page.wait_for_function('RouteWorkshop.testing && player.onGround && __cloudview?.root?.userData.waterwheelFork')
  check(page.evaluate('RailGripCore.mode')==GRIP,'The native route uses the selected '+GRIP+' grip mode')
  check(page.evaluate('__sky.state.data.gp.waterwheel.fork.lower==="ww-collector" && __sky.state.data.quota===0'),'The real preview declares the optional canal choice without changing finish requirements')
  check(page.evaluate('__cloudview.root.userData.waterwheelFork.marks>=4'),'Physical runway stripe cues render in the existing 3D scene')
  check(page.evaluate('muted && SkyCycleSensory.settings.notices==="essential"'),'The movement choice is exercised with sound muted and optional notices suppressed')
  # Ordinary road approach. Pause through the real UI for composition review, not a state assignment.
  page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('player.x>=2740&&player.onGround');page.keyboard.up('KeyD');page.locator('#delivery-header [data-delivery="pause"]').click();page.wait_for_function('__delivery.paused')
  page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#flow-study-toggle').click();frames(6)
  result['cue_view']=page.evaluate("async()=>{const T=await import('./vendor/three.webgpu.js');let o;__cloudview.root.traverse(n=>{if(n.name==='Waterwheel wayfinding: CHOOSE YOUR LINE')o=n;});if(!o)return null;const v=o.getWorldPosition(new T.Vector3()).project(__merged.camera);return {x:v.x,y:v.y,z:v.z,playerX:player.x,visible:o.visible};}")
  cue=result['cue_view'];check(cue and cue['visible'] and -1<cue['x']<1 and -1<cue['y']<1 and -1<cue['z']<1 and cue['playerX']<3080,'Advance route-choice sign is in the actual 3D camera before the runway jump')
  capture('choice-approach-3d');page.set_viewport_size({'width':390,'height':844});frames(6)
  result['mobile_sign_corners']=page.evaluate("async()=>{const T=await import('./vendor/three.webgpu.js');let o;__cloudview.root.traverse(n=>{if(n.name==='Waterwheel wayfinding: CHOOSE YOUR LINE')o=n;});if(!o)return [];const w=o.geometry.parameters.width/2,h=o.geometry.parameters.height/2,r=__merged.renderer.domElement.getBoundingClientRect();return [[-w,-h],[w,-h],[-w,h],[w,h]].map(([x,y])=>{const v=o.localToWorld(new T.Vector3(x,y,0)).project(__merged.camera);return {x:v.x,y:v.y,z:v.z,px:r.left+(v.x+1)*r.width/2,py:r.top+(1-v.y)*r.height/2};});}")
  check(len(result['mobile_sign_corners'])==4 and all(-1<v['x']<1 and -1<v['y']<1 and -1<v['z']<1 for v in result['mobile_sign_corners']),'The entire advance-choice board fits the portrait camera before commitment')
  result['mobile_sign_blockers']=page.evaluate("()=>[...document.querySelectorAll('#whip-status,#whip-control,#delivery-pause .delivery-pause-card,#cloud-hud .cloud-left,#cloud-hud .cloud-right')].filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))")
  corners=result['mobile_sign_corners'];left=min(c['px'] for c in corners);right=max(c['px'] for c in corners);top=min(c['py'] for c in corners);bottom=max(c['py'] for c in corners)
  check(all(right+5<b['left'] or left-5>b['right'] or bottom+5<b['top'] or top-5>b['bottom'] for b in result['mobile_sign_blockers']),'The portrait choice board clears the real whip controls, riding instruments and inspection card')
  capture('choice-approach-mobile');page.set_viewport_size({'width':1100,'height':800})
  # Observe actual Canvas2D drawing calls, without changing game or render values.
  page.evaluate("""()=>{const g=document.getElementById('delivery-canvas').getContext('2d'),rect=g.fillRect,text=g.fillText;window.choice2DObserved={box:null,lines:{}};
   g.fillRect=function(x,y,w,h){if((w===230||w===190)&&h===102){const t=this.getTransform();choice2DObserved.box=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>({x:t.a*a+t.c*b+t.e,y:t.b*a+t.d*b+t.f}));}return rect.apply(this,arguments);};
   g.fillText=function(label,x,y){if(['CHOOSE YOUR LINE','SPEED: HIGH GALLERY','BRAKE, RELEASE: CANAL MAIL'].includes(label))choice2DObserved.lines[label]=true;return text.apply(this,arguments);};}""")
  def verify_2d(label):
   frames(6)
   observed=page.evaluate("""()=>{const c=document.getElementById('delivery-canvas'),r=c.getBoundingClientRect(),o=choice2DObserved;return {corners:o.box?.map(p=>({x:r.left+p.x*r.width/c.width,y:r.top+p.y*r.height/c.height})),lines:Object.keys(o.lines),canvas:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},blockers:[...document.querySelectorAll('#delivery-hud .route-widget,#delivery-timer,#whip-status,#whip-control,#delivery-pause .delivery-pause-card')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const b=e.getBoundingClientRect();return {id:e.id||e.className,left:b.left,right:b.right,top:b.top,bottom:b.bottom};})};}""")
   result[label+'_2d_board']=observed;c=observed['corners'];r=observed['canvas']
   check(c and len(c)==4 and len(observed['lines'])==3 and all(r['left']+2<=p['x']<=r['right']-2 and r['top']+2<=p['y']<=r['bottom']-2 for p in c),'All three route-purpose lines and the whole board render inside the '+label+' 2D view')
   l=min(p['x'] for p in c);right=max(p['x'] for p in c);top=min(p['y'] for p in c);bottom=max(p['y'] for p in c)
   check(all(right+5<b['left'] or l-5>b['right'] or bottom+5<b['top'] or top-5>b['bottom'] for b in observed['blockers']),'The '+label+' 2D choice board clears the actual HUD and controls')
  page.locator('#delivery-header [data-delivery="view"]').click();verify_2d('desktop');capture('choice-approach-2d')
  page.set_viewport_size({'width':390,'height':844});verify_2d('portrait');capture('choice-approach-mobile-2d')
  page.set_viewport_size({'width':1100,'height':800});frames(4)
  page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus();frames(4);page.evaluate(DRIVER,[CASE,GRIP])
  if CASE=='lower':
   page.wait_for_function('forkDriver.inspection && __delivery.paused',timeout=240000)
   page.evaluate('(()=>{testPad.axes[0]=0;for(const b of testPad.buttons){b.pressed=false;b.value=0;}})()');frames(4)
   page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#flow-study-toggle').click();frames(6);capture('canal-receiver-3d')
   check(page.evaluate('player.track?.sky?.id==="ww-collector" && __delivery.paused'),'The actual lower receiver can be inspected in 3D from a controller-paused native contact')
   page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus()
  page.wait_for_function('forkDriver.returned!==null',timeout=240000)
  observed=page.evaluate('forkDriver');check(observed['visits'][0]=='ww-runway','The choice begins with a native road jump and continuous runway contact')
  if CASE=='high':check(observed['visits']==['ww-runway','ww-crescent','ww-gallery','ww-finish'],'Holding speed retains all four connected express sections')
  elif CASE in ('lower','early'):
   check(observed['visits']==['ww-runway','ww-collector'],'Deliberate '+CASE+' braking takes the broadened collector rather than the high express')
   check(4980<observed['returned']['x']<157*36-145,'The lower route returns before the useful Millworkers delivery approach')
  else:check(observed['returned']['x']<9036,'Releasing all directional input temporarily still permits a useful road return')
  if CASE=='lower':
   page.wait_for_function('deliveries===1',timeout=120000)
   check(page.evaluate('[...__delivery.state.delivered].some(s=>Number(s.split(",")[0])===157)'),'A direct Xbox B throw serves Millworkers terrace after the lower-line return')
   capture('canal-delivery-2d')
  page.wait_for_function('won',timeout=240000)
  page.evaluate('(()=>{testPad.axes[0]=0;for(const b of testPad.buttons){b.pressed=false;b.value=0;}})()');frames()
  result.update(page.evaluate('({won,tries,deliveries,credits,driver:forkDriver,grip:RailGripCore.mode})'))
  check(result['tries']==1 and result['won'],'The '+CASE+' journey reaches the real depot on its first attempt')
  capture('choice-finish')
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==before,'The eight original campaign builders remain byte-identical')
  check(page.evaluate('!Object.hasOwn(SkyCycleFlightDeck.records,"canal-choices-r2")'),'The preview creates no campaign layout award')
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing')
  check(page.evaluate('credits===777'),'Returning to Workshop restores the original credits')
  check(page.evaluate('Object.fromEntries(["fork-old-save","sprocket_credits","sprocket_padmap","svgn_delivery_records_v1","svgn.skycycle.mastery.v1"].map(k=>[k,localStorage.getItem(k)]))')==saved,'Existing progress, remaps and storage fixtures remain unchanged')
  check(not errors,'No uncaught exceptions during the native fork journey')
  check(not [m for m in logs if any(s in m.lower() for s in ['shader error','tsl:','gl_invalid','validation error'])],'No detected shader or GPU validation errors')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:result['failure_state']=page.evaluate('({x:player?.x,y:player?.y,vx:player?.vx,rail:player?.track?.sky?.id,won,tries,deliveries,paused:__delivery.paused,driver:window.forkDriver})');capture('failure')
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'case':CASE,'grip':GRIP,'passed':passed,'failure':failure,'checks':checks,'errors':errors,'console':logs,'result':result,'coverage':'Real UI/collision/enemies/throw/finish/save owners, observed-state synthetic Gamepad input driver sampled at the native fixed-step poll. Lower case uses the real Start pause and Inspect scene UI for its receiver capture. No actor, velocity, delivery, score, win or record assignments. 3D approach review then supported 2D CPU journey. Not physical hardware, unfamiliar-player understanding or full XR completion.'},indent=2));ctx.close();browser.close();server.shutdown()
