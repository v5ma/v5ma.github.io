"""Actual-input alternate approaches and learned returns. No gameplay assignments.
Fresh contexts start normally. Repeat visits reload saves earned by play.
Software WebGL and synthetic Xbox are not human or physical-device approval.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'service-loop-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
PAD="""window.__pad={id:'Service-loop synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});"""
server=None;checks=[];reports=[]
def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts)
  try:
   for approach in ([os.environ['SERVICE_APPROACH']] if os.getenv('SERVICE_APPROACH') in ('harbor','maintenance') else ['harbor','maintenance']):
    ctx=browser.new_context(viewport={'width':1100,'height':820});ctx.add_init_script(PAD);page=ctx.new_page();errors=[];legs=[];http_errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:http_errors.append({'url':r.url,'status':r.status}) if r.status>=400 and 'favicon' not in r.url else None)
    def wait(expr,t=90000):page.wait_for_function(expr,timeout=t)
    def state():return page.evaluate('__tidegate.state')
    def press(i):
     wait('!__tidegate.input.neutral',30000);page.evaluate('(i)=>{__pad.buttons[i]={value:1,pressed:true};}',i)
     try:page.wait_for_function('(i)=>__tidegate.input.previous[i]===true',arg=i,timeout=30000)
     finally:page.evaluate('(i)=>{__pad.buttons[i]={value:0,pressed:false};}',i)
     page.wait_for_function('(i)=>__tidegate.input.previous[i]===false&&!__tidegate.input.neutral',arg=i,timeout=30000)
    def choose(id):
     for _ in range(100):
      if page.evaluate('document.activeElement?.id')==id:press(0);return
      press(13)
     raise AssertionError('Xbox cannot reach '+id)
    def route(points):
     for x,z in points:
      print(approach,'WALK',x,z,flush=True)
      page.evaluate('''([x,z])=>{clearInterval(window.__walkTimer);const s=__tidegate.state;window.__leg={target:[x,z],start:s.simulationTime,lastTime:s.simulationTime,last:s.position,distance:0,arrived:false};window.__walkTimer=setInterval(()=>{const s=__tidegate.state,p=s.position,l=__leg;if(s.simulationTime===l.lastTime)return;l.distance+=Math.hypot(p.x-l.last.x,p.y-l.last.y,p.z-l.last.z);l.last=p;l.lastTime=s.simulationTime;const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.7){__pad.axes[0]=__pad.axes[1]=0;l.arrived=true;l.seconds=s.simulationTime-l.start;clearInterval(__walkTimer);return;}const c=Math.cos(s.yaw),q=Math.sin(s.yaw);__pad.axes[0]=(dx*c-dz*q)/d;__pad.axes[1]=(dx*q+dz*c)/d;},20);}''',[x,z])
      try:
       wait('__leg.arrived',120000);legs.append(page.evaluate('({target:__leg.target,seconds:__leg.seconds,distance:__leg.distance})'))
      finally:page.evaluate('clearInterval(__walkTimer);__pad.axes[0]=__pad.axes[1]=0;')
    def interact(id):wait('__tidegate.state.candidate==='+json.dumps(id),30000);press(0)
    def shot(name):page.screenshot(path=str(OUT/(approach+'-'+name+'.png')),timeout=45000)
    try:
     page.goto(BASE+'tidegate.html?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__tidegate?.state.ready',120000)
     check(state()['build']=='tidegate-20260915.2',approach+': exact refit build boots');press(0);wait('__tidegate.state.started')
     press(9);choose('quality');press(1);wait('!__tidegate.state.paused');started=state()['simulationTime']
     route([[-34,43],[-25,43]])
     if approach=='harbor':
      route([[-14,38],[-12,38]]);press(3);wait('__tidegate.state.mode==="boat"')
      # Only stick and trigger values are set; the boat moves through production physics.
      page.evaluate('''()=>{window.__boatDone=false;window.__boatTimer=setInterval(()=>{const g=__tidegate,p=g.state.position,h=g.fleet.actor.heading,error=Math.atan2(Math.sin(Math.PI/2-h),Math.cos(Math.PI/2-h));__pad.axes[0]=-Math.max(-1,Math.min(1,error*3));const throttle=Math.abs(error)<.12&&p.x<6.1?1:0;__pad.buttons[7]={value:throttle,pressed:!!throttle};if(p.x>=6.1&&g.fleet.actor.speed<.35){__boatDone=true;__pad.axes[0]=0;__pad.buttons[7]={value:0,pressed:false};clearInterval(__boatTimer);}},20);}''')
      try:wait('__boatDone',120000)
      finally:page.evaluate('clearInterval(__boatTimer);__pad.axes[0]=0;__pad.buttons[7]={value:0,pressed:false};')
      press(3);wait('__tidegate.state.mode==="foot"');check(state()['position']['x']>9,'Harbor: actual Y landing on far bank')
      route([[15,31],[15,20],[33,20],[33,10],[30,10],[30,8]])
     else:route([[-25,15],[-48,-12],[-35,-22],[-35,-26],[-35,-30],[-35,-38],[-12,-36],[12,-36],[17,-36],[17,-20],[15,-8],[32,-8],[32,-4],[32,0],[32,8],[30,8]])
     reach_time=state()['simulationTime']-started
     check(not state()['progress']['observed'] and not state()['progress']['feeder'],approach+': repair reached without observation or feeder triggers')
     interact('repair');check(state()['progress']['gearbox'],approach+': real A repairs from alternative approach')
     # Discover a connection from inside, replenish spent tools, and reopen a return.
     route([[32,8],[32,0],[32,-4],[32,-8],[32,-4.5],[36,-4.5]])
     before=state()['progress']['ammo'][0];press(7);check(state()['progress']['ammo'][0]<before,approach+': actual firing consumes ammunition')
     interact('resupply');check(state()['progress']['ammo'][0]==100 and not state()['paused'],approach+': A at cabinet restocks without a menu');shot('maintenance')
     route([[32,-8],[15,-8]]);interact('sluice');check(state()['progress']['drained'],approach+': sluice opens maintenance return')
     route([[0,-8],[-12,-8],[-25,-8],[-25,24],[-28,27],[-37,29]])
     check(not state()['progress']['bridge'],approach+': can retreat home before main bridge repair')
     press(8);wait('document.getElementById("map-dialog").open');shot('map');press(1)
     repeat_start=state()['simulationTime']
     route([[-28,27],[-25,24],[-25,-8],[-12,-8],[0,-8],[15,-8],[32,-8],[32,-4],[32,0],[32,8],[30,8]])
     repeat_time=state()['simulationTime']-repeat_start
     check(state()['progress']['gearbox'],approach+': learned return retains repair without repeating it')
     route([[33,10],[33,20],[15,20],[15,24],[18,26]])
     # Actual routine creates the opening. No animal positions, alerts or quest flags are set.
     wait('document.getElementById("crossing-readout").textContent.includes("READY")',90000)
     interact('bridge');check(state()['progress']['bridge'],approach+': natural herd clearance permits bridge without feeder')
     route([[14,24],[0,24],[-17,24],[-28,27],[-37,29]])
     interact('report');check(state()['progress']['reportCount']==1,approach+': real return files report once');shot('home')
     # Reload the save produced by gameplay, never inject a conveniently completed record.
     page.reload(wait_until='domcontentloaded');wait('window.__tidegate?.state.ready',120000)
     check(state()['progress']['bridge'] and state()['progress']['drained'] and state()['progress']['reportCount']==1,approach+': both learned returns and report survive reload')
     press(0);wait('__tidegate.state.started');interact('report');check(state()['progress']['reportCount']==1,approach+': replay cannot duplicate report')
     check(not errors and not http_errors,approach+': no uncaught JavaScript or game HTTP errors')
     reports.append({'approach':approach,'firstRepairSeconds':reach_time,'learnedLockReturnSeconds':repeat_time,'legs':legs,'errors':errors,'httpErrors':http_errors})
    except Exception as e:
     print('FAIL:',repr(e),flush=True)
     diagnostic={}
     try:diagnostic=state()
     except Exception:pass
     (OUT/'failure.json').write_text(json.dumps({'approach':approach,'error':str(e),'state':diagnostic,'legs':legs,'checks':checks,'errors':errors},indent=2))
     try:shot('failure')
     except Exception:pass
     raise
    finally:ctx.close()
   (OUT/'report.json').write_text(json.dumps({'build':'tidegate-20260915.2','base':BASE,'passed':len(checks),'checks':checks,'routes':reports,'physicalHardwareVerified':False,'limits':'Software WebGL and synthetic Xbox. Fixed waypoints measure these routes only, not unfamiliar-player comprehension or all paths. No gameplay state assignments. Existing XR mock/view suites remain separate.'},indent=2))
  finally:browser.close()
finally:
 if server:server.terminate()
