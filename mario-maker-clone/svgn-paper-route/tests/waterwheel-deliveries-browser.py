"""Purposeful Waterwheel delivery acceptance through the real game.
Rider motion and paper throws use ordinary inputs. The test never assigns player
position, velocity, deliveries, score, wins, records or Workshop documents.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/waterwheel-deliveries'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
BASE=origin+'/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;failure=None;result={};samples=[]
PAD="window.testPad={id:'Standard Xbox delivery sample',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad];"
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)

DRIVER=r"""()=>{
 const d=window.deliveryDriver={target:null,ticks:0,approach:null,nearest:null,throwSample:null,coastStart:null,failed:null};
 const previous=window.pollGamepad;
 window.pollGamepad=function(...args){
  const active=RouteWorkshop.testing&&!__delivery.paused&&!won&&!__delivery.state.menu;
  if(active){
   d.ticks++;testPad.axes[0]=d.finish?1:0;testPad.buttons[1]={pressed:false,value:0};
   if(d.target!==null&&!d.failed){
    const target=d.target*36+18,distance=target-(player.x+player.w/2),mb=nearestMailbox(player,250);
    if(mb?.x===d.target&&!d.nearest)d.nearest={...mb,tick:d.ticks};
    if(d.coastStart===null){
     testPad.axes[0]=1;
     if(player.onGround&&distance<=135&&distance>=35&&mb?.x===d.target){
      d.coastStart=d.ticks;d.approach={distance,vx:player.vx,x:player.x,y:player.y,onGround:player.onGround};testPad.axes[0]=0;
     }else if(distance<35)d.failed='The normal input recipe missed the declared approach window';
    }
    if(d.coastStart!==null){
     const since=d.ticks-d.coastStart;testPad.axes[0]=0;
     if(since===4)d.throwSample={distance,vx:player.vx,onGround:player.onGround,nearest:mb};
     const press=since>=4&&since<6;testPad.buttons[1]={pressed:press,value:press?1:0};
     if(since>600&&![...__delivery.state.delivered].some(s=>Number(s.split(',')[0])===d.target))d.failed='The real paper did not reach its target';
    }
   }
  }
  return previous.apply(this,args);
 };
 return true;
}"""

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script(PAD)
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');localStorage.setItem('sprocket_credits','777');if(!localStorage.getItem('ww-delivery-sentinel')){localStorage.setItem('ww-delivery-sentinel','preserve');localStorage.setItem('svgn_delivery_records_v1',JSON.stringify({'canal-choices':{medal:'silver',time:99,score:400}}));localStorage.setItem('svgn.skycycle.mastery.v1',JSON.stringify({'canal-choices':{badges:['finish'],finishes:2,best:90}}));}")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):page.evaluate('(n)=>new Promise(r=>{function step(){if(--n<=0)r();else requestAnimationFrame(step);}requestAnimationFrame(step);})',n)
 def tap(i):
  frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:true,value:1};}',i);frames(2);page.evaluate('(i)=>{testPad.buttons[i]={pressed:false,value:0};}',i);frames(3)
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('window.SkyCycleWaterwheel && window.RouteWorkshop && window.SkyCycleFlightDeck && window.PaperDeliveryCampaign?.status==="ready" && window.__gpuReady')
  campaign_before=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  ledger_before=page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')
  persistent_before=page.evaluate('Object.fromEntries(["sprocket_credits","sprocket_ledger_buf","sprocket_ghosts","sprocket_pack_beaten","svgn_delivery_records_v1","svgn.skycycle.mastery.v1","ww-delivery-sentinel"].map(k=>[k,localStorage.getItem(k)]))')
  credits_before=page.evaluate('credits')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-ride').click()
  page.wait_for_function('RouteWorkshop.testing && player.onGround && __sky.state.data.gp.waterwheel.preview && __cloudview?.root?.userData.waterwheelPreview')
  plan=page.evaluate('__sky.state.data.gp.waterwheel.deliveries.map(x=>({...x}))')
  check(len(plan)==12 and len({x['id'] for x in plan})==12,'The real preview exposes twelve unique authored delivery intentions')
  check([x['tx'] for x in plan]==sorted(x['tx'] for x in plan),'Delivery intentions appear in road order')
  check(page.evaluate('__sky.state.data.quota===0 && __delivery.state.route===-1'),'Delivery mastery remains optional inside the non-awarding Workshop preview')
  page.screenshot(path=str(OUT/'deliveries-3d-start.png'))
  page.locator('#delivery-header [data-delivery="view"]').click();check(page.evaluate('__delivery.state.view==="2d"'),'Full delivery qualification uses the supported native 2D route on CPU CI after real 3D inspection')
  page.wait_for_function('!document.body.classList.contains("cloudview-active")')
  check(not page.locator('#cloud-hud').is_visible() and page.locator('#delivery-hud').is_visible(),'Switching to 2D hides stale 3D instruments and exposes the live fallback HUD')
  clock=page.locator('#delivery-timer span').inner_text()
  page.wait_for_function('(clock)=>document.querySelector("#delivery-timer span").textContent!==clock',arg=clock,timeout=10000)
  check(True,'The visible 2D clock advances without a 3D render pass')
  page.locator('#delivery-header [data-delivery="pause"]').click();frames(4)
  clock=page.locator('#delivery-timer span').inner_text();page.wait_for_timeout(1200)
  check(page.locator('#delivery-timer span').inner_text()==clock,'Pause freezes the visible 2D clock without changing the run')
  page.locator('#delivery-pause [data-delivery="resume"]').click()
  page.locator('#cv').focus();frames(4);page.evaluate(DRIVER)
  for i,item in enumerate(plan,1):
   tx=item['tx'];before=page.evaluate('deliveries')
   # Change only the test driver's requested target. Native motion/packet/award owners remain untouched.
   page.evaluate('(tx)=>{Object.assign(deliveryDriver,{target:tx,approach:null,nearest:null,throwSample:null,coastStart:null,failed:null});}',tx)
   page.wait_for_function('deliveryDriver.nearest!==null || deliveryDriver.failed',timeout=120000)
   state=page.evaluate('deliveryDriver');check(state['nearest'] and state['nearest']['x']==tx,f"{item['id']} becomes the unambiguous nearby mailbox through ordinary riding")
   page.wait_for_function('deliveryDriver.throwSample!==null || deliveryDriver.failed',timeout=30000)
   state=page.evaluate('deliveryDriver');assert not state['failed'],state['failed']
   approach=state['throwSample'];check(approach['onGround'] and 35<=state['approach']['distance']<=135 and -10<=approach['distance']<=145,f"{item['id']} has a readable coasting throw window before the Xbox input")
   page.wait_for_function('(n)=>deliveries===n || deliveryDriver.failed',arg=before+1,timeout=30000)
   delivered=page.evaluate('(tx)=>[...__delivery.state.delivered].some(s=>Number(s.split(",")[0])===tx)',tx)
   check(delivered and page.evaluate('deliveries')==before+1,f"Xbox B delivers {item['id']} through the real packet simulation")
   page.evaluate('(()=>{deliveryDriver.target=null;testPad.axes[0]=0;testPad.buttons[1]={pressed:false,value:0};})()')
   samples.append(page.evaluate('([item,approach])=>({id:item.id,role:item.role,tx:item.tx,throwDistance:approach.distance,throwVx:approach.vx,x:player.x,y:player.y,vx:player.vx,deliveries,tries,onGround:player.onGround,track:player.track?.sky?.id||null})',[item,approach]))
   if i in (1,6,11,12):page.screenshot(path=str(OUT/f'delivery-{i:02d}-{item["role"]}.png'))
  page.evaluate('(()=>{deliveryDriver.finish=true;})()')
  check(page.evaluate('deliveries===12 && __delivery.state.delivered.size===12'),'All twelve authored Waterwheel targets are actually served in one continuous road journey')
  check(page.evaluate('Array.from(__delivery.state.delivered,s=>Number(s.split(",")[0])).sort((a,b)=>a-b).join(",")')==','.join(str(x['tx']) for x in plan),'The delivered tile set exactly matches the authored intent ledger')
  page.wait_for_function('won',timeout=240000);page.evaluate('(()=>{testPad.axes[0]=0;})()');frames()
  result=page.evaluate('({won,tries,deliveries,score,credits,x:player.x,route:__delivery.state.route,testing:RouteWorkshop.testing,records:SkyCycleFlightDeck.records})')
  check(result['won'] and result['tries']==1 and result['deliveries']==12,'A twelve-delivery road run reaches the depot on its first attempt')
  page.wait_for_function('document.getElementById("ww-preview-result-note")?.textContent.includes("playtest results only")')
  check(page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')==ledger_before and page.evaluate('!Object.hasOwn(SkyCycleFlightDeck.records,"canal-choices-r2")'),'Serving every preview mailbox still creates no campaign layout record')
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==campaign_before,'All eight campaign routes remain byte-identical after delivery mastery')
  check(page.evaluate('credits')>credits_before,'Delivery coins exist only as temporary Workshop-playtest feedback before return')
  page.screenshot(path=str(OUT/'deliveries-finish.png'))
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing')
  check(page.evaluate('credits')==credits_before,'Returning from the Workshop restores the pre-playtest credit balance')
  check(page.evaluate('Object.fromEntries(["sprocket_credits","sprocket_ledger_buf","sprocket_ghosts","sprocket_pack_beaten","svgn_delivery_records_v1","svgn.skycycle.mastery.v1","ww-delivery-sentinel"].map(k=>[k,localStorage.getItem(k)]))')==persistent_before,'All persistent campaign, credit and ledger fixtures are byte-identical after the delivery playtest')
  check(not errors,'No uncaught errors during the twelve-delivery native run')
  check(not [s for s in logs if any(x in s.lower() for x in ['shader error','tsl:','gl_invalid','validation error'])],'No detected shader or GPU validation errors during the delivery run')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:
   page.keyboard.up('KeyD');page.keyboard.up('KeyA');result=page.evaluate('({won,tries,deliveries,score,credits,x:player?.x,y:player?.y,vx:player?.vx,onGround:player?.onGround,nearest:typeof nearestMailbox==="function"?nearestMailbox(player,250):null,delivered:window.__delivery?[...__delivery.state.delivered]:[],packets:typeof packets!=="undefined"?packets.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,life:p.life})):[]})');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'samples':samples,'result':result,'coverage':'Real preview UI, ordinary rightward riding, deliberate four-fixed-sample throttle release/coasting and sampled standard Xbox B throws through real packet/mailbox physics. Input sampling is synchronized to the native poll, not Python wall-clock timing. No player-position, velocity, delivery, score, win, record or document assignments. Real 3D inspection then supported 2D complete CPU route. Not physical-controller or human-enjoyment qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
