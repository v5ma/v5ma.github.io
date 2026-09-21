"""Actual rendered expedition; controller input only for the full mission.
Read-only snapshots guide inputs. Never changes stage, position, oxygen or clock.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-water';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
URL=BASE+'/prism-current/water-mission/'
PAD=(ROOT/'prism-current/tests/standard-pad.js').read_text()
checks=[];errors=[]
def check(ok,msg):
 assert ok,msg
 checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
 c=b.new_context(viewport={'width':1280,'height':900},device_scale_factor=.25,service_workers='block');c.add_init_script(PAD)
 c.add_init_script("for(const k of ['prism-current.v1.records','prism-current.v1.practice','prism-current.v1.lessons'])if(!localStorage.getItem(k))localStorage.setItem(k,'{\"sentinel\":true}');")
 p=c.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'WebGL' in m.text) else None)
 def snap():return p.evaluate('PrismWater.snapshot()')
 def press(i):p.evaluate('(i)=>PrismTestPad.press(i)',i)
 def go(x,z):
  p.evaluate('''async ([x,z])=>{const began=performance.now();await new Promise((resolve,reject)=>{const tick=setInterval(()=>{const s=PrismWater.snapshot(),p=s.player,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.2){testPad.axes[0]=testPad.axes[1]=0;clearInterval(tick);resolve();return;}if(performance.now()-began>45000||s.mode!=='playing'){testPad.axes[0]=testPad.axes[1]=0;clearInterval(tick);reject(Error('Movement stalled: '+JSON.stringify(s)));return;}const side=(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/d,forward=(-dx*Math.sin(p.yaw)-dz*Math.cos(p.yaw))/d;const axis=v=>Math.abs(v)<.005?0:Math.sign(v)*(.16+.84*Math.abs(v));testPad.axes[0]=axis(side);testPad.axes[1]=-axis(forward);},12);});}''',[x,z])
 def vertical(button,condition):
  p.evaluate('(i)=>testPad.buttons[i]={pressed:true,value:1}',button);p.wait_for_function(condition,timeout=10000);p.evaluate('(i)=>testPad.buttons[i]={pressed:false,value:0}',button)
 try:
  p.goto(BASE+'/prism-current/index.html',wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda');p.keyboard.press('F2');p.locator('#water-launch').click();p.wait_for_function('!!window.PrismWater');p.bring_to_front();p.keyboard.press('Shift')
  check(snap()['mode']=='briefing','The rhythm menu opens the playable water expedition')
  press(0);p.wait_for_function("PrismWater.snapshot().mode==='playing'")
  check(snap()['stage']==0,'The mission begins at auxiliary power, not invented completion')
  go(5.4,1.2);check(snap()['near']=='power','Walk to the actual auxiliary console');press(2);check(snap()['stage']==1,'X restores power and advances the objective')
  press(9);before=snap();p.wait_for_timeout(300);check(snap()['elapsed']==before['elapsed'] and snap()['player']==before['player'],'Menu pauses movement, oxygen and mission time');press(9)
  go(0,-2);go(-5.7,-2.4);press(2);check(snap()['stage']==2,'The pump valve opens the floodgate')
  p.wait_for_function('PrismWater.snapshot().water<-.7');check(snap()['water']<-.7,'The water actually drains in the running environment')
  go(-4,-2.4);go(-4,-8);go(0,-12);go(0,-23)
  check(snap()['player']['y']<.2,'Movement descends into the water instead of teleporting')
  vertical(6,"PrismWater.snapshot().player.y < -2.65")
  check(snap()['oxygen']<32,'Diving consumes air')
  p.screenshot(path=str(OUT/'underwater.png'))
  go(0,-37.5);check(snap()['near']=='core','The submerged passage leads to a physical recoverable prism');press(2);check(snap()['stage']==3,'Recovery changes the mission and removes the core')
  go(0,-25);vertical(7,'PrismWater.snapshot().player.y > -.86')
  p.wait_for_function('PrismWater.snapshot().oxygen>30');check(snap()['oxygen']>30,'Surfacing refills air')
  p.evaluate('window.testPad=null');p.wait_for_function("PrismWater.snapshot().mode==='paused'")
  check('disconnected' in p.locator('#toast').inner_text(),'Controller disconnect pauses and explains recovery')
  p.evaluate(PAD);p.wait_for_timeout(250);check(snap()['mode']=='paused','Reconnect does not automatically resume');press(9)
  go(0,-12);go(-4,-8);go(-4,-2);go(2.5,3.7);press(2)
  check(snap()['mode']=='complete' and snap()['stage']==4,'Complete the full expedition through ordinary controller movement and interactions')
  check(snap()['rescues']==0,'The full route is possible within the air budget without forced respawns')
  for k in ['prism-current.v1.records','prism-current.v1.practice','prism-current.v1.lessons']:check(p.evaluate('(k)=>localStorage.getItem(k)',k)=='{"sentinel":true}','Preserve '+k)
  p.screenshot(path=str(OUT/'complete.png'));p.reload(wait_until='domcontentloaded');p.wait_for_function('!!window.PrismWater');check(snap()['stage']==4,'Completed mission persists separately after reload')
  check(snap()['graphics']['rippleSlots']==6 and snap()['graphics']['waterSurfaces']==3,'Water resources remain bounded')
  check(p.evaluate('PrismWater.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'Actual water and caustic shader programs compile')
  vc=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1);v=vc.new_page();v.set_default_timeout(60000);v.on('pageerror',lambda e:errors.append(str(e)));v.goto(URL,wait_until='domcontentloaded');v.wait_for_function('!!window.PrismWater');v.locator('#start').click();v.wait_for_timeout(1200);v.screenshot(path=str(OUT/'pool-1440.png'));vc.close()
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The briefing and controls fit a narrow screen')
  check(not errors,'No uncaught script or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Actual production WebGL and audio. Full mission driven by emulated Xbox inputs and read-only position observations, with no stage/position/oxygen/clock assignments. Quarter pixel ratio functional test; separate 1440x1000 pool capture. Not physical Xbox or touch-device qualification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':p.evaluate('window.PrismWater?.snapshot()')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
