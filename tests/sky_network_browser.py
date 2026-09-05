"""Native HTTP/3D acceptance. State is read-only; control is keyboard and UI.
Geometry unit fixtures are intentionally separate from these actual playthroughs.
"""
import json,os,time,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('NETWORK_SUITE','survey');OUT=Path('test-output')/('network-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
def state(page):
 return page.evaluate('''()=>{const s=__network.state,p=player;return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,won,tries,deliveries,steps:__ground.state.steps,track:p.track?.sky.id,peg:p.peg?{x:p.peg.x,y:p.peg.y}:null,visits:[...s.visits],bestChain:s.bestChain,minY:s.minY,hooks:__grapple.state.hooks,releases:__grapple.state.releases,events:s.events};}''')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1280,'height':840},service_workers='block',record_video_dir=str(OUT/'video'))
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__network&&window.__gpuReady===true')
  original=page.evaluate('levelCode()');page.locator('[data-course="4"]').click();page.wait_for_function('__network.active()&&player.onGround');page.locator('#cv').focus()
  data=page.evaluate('''()=>{let art=null;__merged.scene.traverse(o=>{if(o.userData.skyNetworkArt)art=o.userData.skyNetworkArt;});return {surfaces:tracks.filter(t=>t.sky?.network).length,art,meta:__ground.meta.skyNetwork,three:__merged.camera.isPerspectiveCamera&&__delivery.state.view==='3d'};}''')
  check(data['surfaces']>=40,'The live course contains at least 40 actual track surfaces')
  check(data['art']['surfaces']==data['surfaces'],'Every playable network surface has corresponding extruded roadway')
  check(data['three'],'Tests use the real perspective 3D renderer')
  if MODE=='survey':
   page.locator('#network-map-button').click();page.wait_for_selector('#sky-network-map[open]');frozen=state(page);page.wait_for_timeout(250)
   check(state(page)['steps']==frozen['steps'],'The whole-world map pauses the rider')
   page.screenshot(path=str(OUT/'whole-connected-level.png'));page.keyboard.press('Escape');page.wait_for_function('!document.getElementById("sky-network-map").open')
   check(abs(state(page)['x']-frozen['x'])<2,'Closing the map does not teleport the rider')
   page.locator('#network-wide-button').click();check(page.evaluate('__network.wide'),'Wide view can show more of the connected tiers')
   page.screenshot(path=str(OUT/'first-neighborhood.png'))
   page.keyboard.down('KeyD');page.wait_for_function('player.x>=630',timeout=120000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="loop-0"',timeout=40000);page.keyboard.up('Space');page.keyboard.up('KeyD')
   page.screenshot(path=str(OUT/'ramp-cluster.png'))
   page.locator('#delivery-header [data-delivery="editor"]').click();check(page.evaluate('levelCode()')==original,'Create restores the preceding complete blueprint')
   page.on('dialog',lambda d:d.accept());page.locator('#beginner-blueprint').click();code=page.evaluate('levelCode()');meta=json.loads(__import__('base64').b64decode(code.split('.')[0]));check(len(meta['ct'])>=40 and all(m['network'] for m in meta['cm']),'An editable copy exports the entire network and its track metadata')
  elif MODE=='road':
   page.keyboard.down('KeyD');page.wait_for_function('won',timeout=650000);finished=state(page);page.keyboard.up('KeyD')
   if page.locator('#stay-results').count() and page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(finished['tries']==1 and finished['won'],'The complete ground route finishes on its first attempt')
   check(not finished['visits'] and finished['hooks']==0 and finished['deliveries']==0,'Neither aerial exploration, grappling nor deliveries are required to finish')
   page.screenshot(path=str(OUT/'street-finish.png'))
  else:
   page.keyboard.down('KeyD');page.wait_for_function('player.x>=630',timeout=120000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="loop-0"',timeout=40000);page.keyboard.up('Space')
   check(True,'A deliberate ordinary jump enters the first launch ramp')
   if MODE=='flight':
    page.wait_for_function('__network.state.bestChain>=4',timeout=240000)
    events=state(page)['events'];check(sum(e['type']=='catch' and e.get('airTicks',0)>3 for e in events)>=3,'At least three transfers cross real detached airborne frames')
    page.locator('#network-wide-button').click();page.screenshot(path=str(OUT/'linked-partial-ramps.png'))
    page.wait_for_function('won',timeout=650000);finished=state(page);page.keyboard.up('KeyD')
    if page.locator('#stay-results').count() and page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
    check(finished['won'] and finished['tries']==1,'The multi-ramp aerial route reaches the finish without a retry')
    check(finished['bestChain']>=6 and finished['minY']<1100,'One sustained run traverses six receiving surfaces and climbs several heights')
    check(finished['deliveries']==0,'The aerial route also finishes without a delivery requirement')
    page.screenshot(path=str(OUT/'aerial-finish.png'))
   elif MODE=='grapple':
    page.wait_for_function('player.x>2050&&__grapple.state.target',timeout=180000);page.keyboard.down('KeyZ');page.wait_for_function('!!player.peg',timeout=30000)
    check(True,'A real Z-key whip catches a physical peg within the network')
    start=time.monotonic();turn=0;last=None;ready=False
    while time.monotonic()-start<180:
     s=state(page)
     if not s['peg']:raise AssertionError('Whip detached before the intended release')
     angle=math.atan2(s['y']+15-s['peg']['y'],s['x']+13-s['peg']['x'])
     if last is not None:turn+=abs((angle-last+math.pi)%(2*math.pi)-math.pi)
     last=angle
     if turn>6.1 and s['vx']>6 and s['vy']<-2:ready=True;break
     page.wait_for_timeout(30)
    check(ready,'Ordinary steering winds the rider around the peg before a rightward upward release')
    check(page.evaluate('__grapple.graphics.ropeMesh.geometry.drawRange.count>0'),'The attached whip submits visible dynamic three-dimensional chain geometry')
    page.screenshot(path=str(OUT/'whip-in-network.png'));before=state(page);page.keyboard.up('KeyZ');page.wait_for_function('!player.peg')
    page.wait_for_function('(n)=>__network.state.visits.size>n||player.onGround',arg=len(before['visits']),timeout=180000)
    after=state(page);check(after['releases']>0,'Releasing Z produces a real momentum release')
    check(after['tries']==1,'The optional grapple attempt remains within the same live run')
    page.screenshot(path=str(OUT/'grapple-reconnection.png'));page.keyboard.up('KeyD')
  check(not errors,'No uncaught JavaScript errors in the tested 3D flow')
  final=state(page) if MODE!='survey' else {'mode':'editor'}
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'mode':MODE,'geometry':data,'state':final,'errors':errors,'scope':'Native HTTP software WebGL using ordinary keyboard/buttons. No rider position, velocity, score or progress assignments. Not proof of every optional branch or physical-device performance.'},indent=2))
 except Exception as e:
  try:debug=state(page)
  except Exception:debug=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':debug},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:context.close();browser.close()
