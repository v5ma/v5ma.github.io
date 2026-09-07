"""Whole expedition via normal game input, never position/health/clock writes.
Observed geometry informs the test driver just as a player reads a route.
"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import os,time,json,math
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/unchained-combat';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def snap(p):return p.evaluate('Vesperfall.snapshot()')
DRIVE="""async options=>{
 const C=VesperCore,c=Vesperfall.component,held=new Set(),canvas=AFRAME.scenes[0].canvas;
 function key(code,on){if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);}
 const visible=()=>Vesperfall.state.world.enemies.filter(e=>!e.dead&&C.len(C.sub(e.p,Vesperfall.state.head))<16&&!C.segmentBlocked(Vesperfall.state.world,Vesperfall.state.head,C.add(e.p,[0,.62,0])));
 await new Promise((resolve,reject)=>{const start=performance.now();let lastShot=Vesperfall.state.shots;const timer=setInterval(()=>{
  const s=Vesperfall.state,p=s.p;let done=false;
  if(s.phase!=='playing'||c.paused||performance.now()-start>100000){for(const k of [...held])key(k,false);clearInterval(timer);reject(Error('Input stopped: '+JSON.stringify({phase:s.phase,p,options})));return;}
  if(options.target){const dx=options.target[0]-p[0],dz=options.target[1]-p[2],distance=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),angle=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));key('ArrowLeft',angle>.03);key('ArrowRight',angle<-.03);key('KeyW',Math.abs(angle)<.15&&distance>.7);key('ShiftLeft',true);done=distance<.7||(options.combat&&visible().length>0);}
  else{const e=s.world.enemies.find(e=>e.id===options.enemy);if(!e||e.dead)done=true;else{const head=c.head.object3D.getWorldPosition(new AFRAME.THREE.Vector3()),dx=e.p[0]-head.x,dz=e.p[2]-head.z,d=Math.hypot(dx,dz),dy=e.p[1]+.62-head.y,v2=36*36,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),yaw=Math.atan2(-dx,-dz),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):0,a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;
   key('ArrowLeft',a>.012);key('ArrowRight',a<-.012);key('ArrowUp',b>.008);key('ArrowDown',b<-.008);
   if(options.block){key('KeyH',Math.abs(a)<.08);done=s.blocks>options.blockStart;}
   else{key('Space',true);if(c.charge>.985&&Math.abs(a)<.03&&Math.abs(b)<.023){key('Space',false);done=true;}}
  }}
  if(done){for(const k of [...held])key(k,false);clearInterval(timer);resolve();}
 },3);});
}"""
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**args);ctx=browser.new_context(viewport={'width':640,'height':480},service_workers='block');host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort());page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.arsenal&&Vesperfall.component.rendererReady');page.locator('#start').click();page.locator('a-scene canvas').focus();deadline=time.monotonic()+730;blocked=False
  check(snap(page)['phase']=='playing' and not page.evaluate('Vesperfall.component.practice'),'Start a real scored run, not a practice encounter')
  while not snap(page)['portalReady'] and time.monotonic()<deadline:
   s=snap(page);assert s['phase']=='playing','The real run ended before the beacon'
   visible=page.evaluate('(()=>{const s=Vesperfall.state,C=VesperCore;return s.world.enemies.filter(e=>!e.dead&&C.len(C.sub(e.p,s.head))<16&&!C.segmentBlocked(s.world,s.head,C.add(e.p,[0,.62,0]))).sort((a,b)=>C.len(C.sub(a.p,s.p))-C.len(C.sub(b.p,s.p))).map(e=>e.id);})()')
   if visible:
    if not blocked:
     page.evaluate(DRIVE,{'enemy':visible[0],'block':True,'blockStart':s['blocks']});check(snap(page)['blocks']>0,'A real enemy bolt is stopped by the held directional shield');blocked=True;page.screenshot(path=str(OUT/'combat-block.png'));page.wait_for_function('!Vesperfall.state.shield')
    n=snap(page)['shots'];page.evaluate(DRIVE,{'enemy':visible[0]});page.wait_for_function('(n)=>Vesperfall.state.shots>n||Vesperfall.state.portalReady',arg=n);page.wait_for_function('Vesperfall.state.arrows.length===0',timeout=60000)
   else:
    route=page.evaluate('(()=>{const s=Vesperfall.state,C=VesperCore,w=s.world,here=C.roomAt(w,s.p),e=w.enemies.filter(e=>!e.dead).sort((a,b)=>C.route(w,here,a.room).length-C.route(w,here,b.room).length)[0];return C.route(w,here,e.room).map(i=>[w.rooms[i].x,w.rooms[i].z]);})()')
    for target in route:
     page.evaluate(DRIVE,{'target':target,'combat':True})
     if page.evaluate('Vesperfall.state.world.enemies.some(e=>!e.dead&&VesperCore.len(VesperCore.sub(e.p,Vesperfall.state.head))<16&&!VesperCore.segmentBlocked(Vesperfall.state.world,Vesperfall.state.head,VesperCore.add(e.p,[0,.62,0])))'):break
   print('PROGRESS',json.dumps({k:snap(page)[k] for k in ['player','health','kills','shots','headshots','blocks']}),flush=True)
  check(snap(page)['portalReady'] and snap(page)['kills']==5,'Five real wardens fall to actual arrows and open the beacon')
  check(snap(page)['headshots']>=3,'Aiming at exposed weak points earns real precision hits')
  route=page.evaluate('(()=>{const s=Vesperfall.state,C=VesperCore,w=s.world;return C.route(w,C.roomAt(w,s.p),w.exit).map(i=>[w.rooms[i].x,w.rooms[i].z]);})()')
  for target in route:page.evaluate(DRIVE,{'target':target})
  gate=snap(page)['rooms'][snap(page)['exit']];page.evaluate(DRIVE,{'target':[gate['x'],gate['z']-3.8]});page.keyboard.press('KeyE');page.wait_for_function('Vesperfall.state.phase==="reward"');page.locator('#reward').wait_for(state='visible')
  check(True,'The completed physical route reaches a real beacon and opens blessings')
  earned=snap(page)['profile'];check(earned['volley'] and earned['quickwind'] and earned['nightfall'],'Kill, precision and sector milestones unlock from the completed run')
  page.screenshot(path=str(OUT/'earned-chronicle.png'));page.locator('[data-reward="power"]').click();page.wait_for_function('Vesperfall.state.world.depth===2&&!Vesperfall.component.paused')
  check(snap(page)['kills']==5 and len([e for e in snap(page)['enemies'] if not e['dead']])==5,'The blessing opens a new seeded sector while preserving run counters')
  page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');page.locator('#start').click();page.wait_for_function('Vesperfall.state.world.depth===1&&!Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.state.ammo.volley===4&&Vesperfall.state.quickwind'),'Earned loadout improvements apply to the next run')
  check(snap(page)['profile']['stats']==earned['stats'],'Starting again does not bank the same completed kills twice')
  page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.arsenal')
  check(snap(page)['profile']['volley'] and snap(page)['profile']['nightfall'],'Permanent rewards persist through a real browser reload')
  check(not errors,'No uncaught errors in the complete scored expedition')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'earned':earned,'state':snap(page),'scope':'Actual HTTP A-Frame, 640x480 software-WebGL viewport. Ordinary keys/buttons, observed target/navigation controller. No actor/health/clock/progress assignments; one seed is not every seed or physical hardware testing.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
