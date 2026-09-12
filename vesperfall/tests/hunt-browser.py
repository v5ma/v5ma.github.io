"""Hollow Hunt end-to-end checks. Read-only observations guide ordinary UI/key
inputs; the test never assigns actors, health, timers, kills, or progression.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/hollow-hunt';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
def snap(p):return p.evaluate('Vesperfall.snapshot()')
INPUT="""async o=>{
 const c=Vesperfall.component,C=VesperCore,canvas=AFRAME.scenes[0].canvas,held=new Set();
 function key(code,on){if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);}
 await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{
  const s=Vesperfall.state;let done=false;
  if(o.walk){const dx=o.walk[0]-s.p[0],dz=o.walk[1]-s.p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));key('ArrowLeft',a>.018);key('ArrowRight',a<-.018);key('KeyW',Math.abs(a)<.09&&d>.10);key('ShiftLeft',true);done=d<=.10;}
  else{const e=s.world.enemies[0],dx=e.p[0]-s.head[0],dz=e.p[2]-s.head[2],d=Math.hypot(dx,dz),v=12+24*o.charge,v2=v*v,dy=e.p[1]+o.height-s.head[1],disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),pitch=Math.atan((v2-Math.sqrt(Math.max(0,disc)))/(9.8*d)),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;
   key('ArrowLeft',a>.01);key('ArrowRight',a<-.01);key('ArrowUp',b>.006);key('ArrowDown',b<-.006);if(Math.abs(a)<.025&&Math.abs(b)<.016)key('Space',true);done=c.charge>=o.charge&&Math.abs(a)<.025&&Math.abs(b)<.016;
  }
  if(done||s.phase!=='playing'||performance.now()-start>240000){for(const k of [...held])key(k,false);clearInterval(timer);done?resolve():reject(Error('Input did not finish '+JSON.stringify(o)));}
 },3);});
}"""
def trial(page,kind):
 if page.evaluate('Vesperfall.component.running&&!Vesperfall.component.paused'):page.keyboard.press('KeyP')
 page.locator('#sparring-kind').select_option(kind);page.locator('#sparring').click();page.wait_for_function('(k)=>Vesperfall.component.training===k&&!Vesperfall.component.paused',arg=kind);page.locator('a-scene canvas').focus()
def shoot(page,charge=1,height=.78):
 # Aim at the exposed forehead, above the overlapping shoulder hit sphere.
 # Hold the drawn string until alignment converges; charge alone is not aim.
 page.wait_for_function('Vesperfall.state.guardLock===0')
 n=snap(page)['shots'];page.evaluate(INPUT,{'charge':charge,'height':height});page.wait_for_function('(n)=>Vesperfall.state.shots>n',arg=n);page.wait_for_function('Vesperfall.state.arrows.length===0')
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1000,'height':740},device_scale_factor=.65,service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.hunt&&Vesperfall.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
  check(snap(page)['version']==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'The native A-Frame browser loads the current release with preserved Hollow Hunt mechanics')
  page.locator('#jewel-settings summary').click();page.locator('#jewel-quality').select_option('classic');page.locator('#cathedral-shadows').uncheck();page.locator('#audio').uncheck()
  profile=snap(page)['profile'];trial(page,'cantor')
  check(page.evaluate('Vesperfall.component.enemyMeshes[0].name')=='Ash Cantor','The selected trial creates the distinct cantor actor and real AI')
  page.keyboard.down('KeyH');page.wait_for_function('Vesperfall.state.blocks>0');page.keyboard.up('KeyH');page.wait_for_function('!Vesperfall.state.shield')
  check(snap(page)['health']==100,'The shield stops an actual warned cantor volley')
  page.keyboard.press('Digit3');shoot(page,.27,0)
  check(page.evaluate('Vesperfall.state.world.enemies[0].frozen>0'),'A physical Frost arrow visibly interrupts and freezes the trial enemy')
  page.screenshot(path=str(OUT/'frozen-cantor.png'));page.keyboard.press('Digit1');shoot(page)
  check(page.evaluate('Vesperfall.state.world.enemies[0].dead'),'The real trial enemy can be defeated with ordinary bow inputs')
  check(snap(page)['profile']==profile,'A trial kill and shield block do not manufacture permanent rewards')
  trial(page,'stalker');page.wait_for_function('Vesperfall.state.world.enemies[0].wind>0')
  page.screenshot(path=str(OUT/'hound-windup.png'));page.keyboard.down('KeyD');page.wait_for_function('Vesperfall.state.p[0]>1.6');page.keyboard.up('KeyD');page.wait_for_function('Vesperfall.state.world.enemies[0].recovery>0')
  check(snap(page)['health']==100,'Sidestepping the announced hound line avoids its committed charge')
  trial(page,'warden');shoot(page,.4,0)
  check(page.evaluate('Vesperfall.state.events.some(e=>e.type==="enemy-deflect")'),'A frontal body arrow actually deflects from the sentinel shield')
  check(snap(page)['enemies'][0]['hp']==118,'A deflected arrow causes no fabricated damage')
  page.screenshot(path=str(OUT/'sentinel-guard.png'));shoot(page);shoot(page)
  check(snap(page)['enemies'][0]['dead'] and snap(page)['headshots']>=2,'Accurate head shots bypass the shield and defeat the sentinel')
  page.keyboard.press('KeyP');page.locator('#practice').click();page.locator('a-scene canvas').focus()
  loft=page.evaluate('Vesperfall.state.world.architecture.lofts[0]');rooms=snap(page)['rooms']
  route=page.evaluate('(id)=>VesperCore.route(Vesperfall.state.world,1,id)',arg=loft['room'])
  for id in route:page.evaluate(INPUT,{'walk':[rooms[id]['x'],rooms[id]['z']]})
  page.evaluate(INPUT,{'walk':[rooms[loft['room']]['x'],loft['entry'][2]]});page.evaluate(INPUT,{'walk':[loft['entry'][0],loft['entry'][2]]})
  page.evaluate(INPUT,{'walk':[loft['entry'][0],loft['pad'][2]]})
  check(snap(page)['player'][1]>3.19,'Ordinary walking ascends the new Archive Loft staircase')
  page.evaluate(INPUT,{'walk':[loft['pad'][0]+2.7,loft['pad'][2]]})
  check(page.evaluate('Vesperfall.state.world.pickups.find(p=>p.id==="loft-0").taken'),'Crossing the elevated route collects the actual upper-floor cache')
  page.screenshot(path=str(OUT/'archive-upper-route.png'))
  page.evaluate(INPUT,{'walk':[loft['otherEntry'][0],loft['pad'][2]]});page.evaluate(INPUT,{'walk':[loft['otherEntry'][0],loft['otherEntry'][2]]})
  check(snap(page)['player'][1]<.05,'The second staircase completes a real ground-to-gallery-to-ground loop')
  page.keyboard.press('KeyP');check(snap(page)['profile']==profile,'All sparring and exploration remains separate from the saved Chronicle')
  page.set_viewport_size({'width':390,'height':844});page.locator('#field-guide summary').click();page.screenshot(path=str(OUT/'phone-field-guide.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The expanded trial selector and field guide fit a narrow browser')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.hunt');check(snap(page)['profile']==profile,'The pre-existing local profile survives reload unchanged')
  check(not errors,'No uncaught browser exceptions throughout trials and vertical traversal')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Real HTTP A-Frame/WebGL. Ordinary UI/keyboard inputs only; read-only observations guide aiming/navigation. Pixel ratio .65 and public Classic materials, sun shadows off and audio muted isolate this long functional regression; full audio/materials are exercised separately. No geometry, clock or damage changes; not physical headset certification.','state':snap(page)},indent=2))
 except Exception as e:
  try:data=snap(page)
  except:data={}
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':data},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();browser.close()
