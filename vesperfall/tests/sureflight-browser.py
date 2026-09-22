"""Normal-start HTTP gameplay. Keyboard and WebXR inputs are synthetic.
No actor, enemy, health, reward, clock or completion assignments are made.
"""
from pathlib import Path
import os,json,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/sureflight';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':850},device_scale_factor=.45,service_workers='block')
 page=ctx.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def observe():return page.evaluate('({p:[...Vesperfall.state.p],health:Vesperfall.state.health,blinks:Vesperfall.state.blinks,score:Vesperfall.state.score,targets:[...Vesperfall.state.targets],phase:Vesperfall.state.phase})')
 def aim(yaw,pitch):
  page.evaluate("""async ([yaw,pitch])=>{const g=Vesperfall.component,canvas=g.scene.canvas,held=new Set();const key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw)),b=pitch-g.pitch;key('ArrowLeft',a>.012);key('ArrowRight',a<-.012);key('ArrowUp',b>.012);key('ArrowDown',b<-.012);if(Math.abs(a)<.025&&Math.abs(b)<.025||performance.now()-start>40000){for(const k of [...held])key(k,false);clearInterval(timer);Math.abs(a)<.025&&Math.abs(b)<.025?resolve():reject(Error('Aim deadline'));}},4);});}""",[yaw,pitch])
 try:
  page.goto(BASE+'/vesperfall/?acceptance=sureflight',wait_until='domcontentloaded');wait('window.Vesperfall?.component.echoes&&Vesperfall.component.stats.drawCalls>0')
  page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(page.evaluate("document.querySelector('#xr-bow-controls').value==='goldwind'"),'Goldwind remains the fresh control default')
  before=observe();page.locator('a-scene canvas').focus();page.keyboard.press('KeyE');wait('Vesperfall.component.echoes.state.found.includes("causeway-dispatch")')
  after=observe();check(after['score']==before['score'] and after['targets']==before['targets'],'Reading the physical shelter dispatch grants no score or objective bypass')
  check(page.evaluate('Vesperfall.component.echoes.floor.mesh.parent===Vesperfall.component.scene.object3D&&Vesperfall.component.echoes.floor.mesh.position.y<Vesperfall.state.p[1]+.2'),'Feedback is rendered at floor level, not attached to the head')
  check(page.evaluate('Vesperfall.component.echoes.floor.mesh.material.transparent&&!Vesperfall.component.echoes.floor.mesh.material.depthWrite'),'Floor feedback uses actual alpha blending without hiding world depth')
  check(page.evaluate('getComputedStyle(document.querySelector("#toast")).opacity')=='0','The old window toast does not obscure the game canvas')
  image=page.evaluate('Vesperfall.component.echoes.floor.canvas.toDataURL("image/png").split(",")[1]');(OUT/'floor-message-texture.png').write_bytes(base64.b64decode(image))
  wait('performance.now()-Vesperfall.component.echoes.state.shownAt>=2100');check(page.evaluate('!Vesperfall.component.echoes.floor.mesh.visible'),'The actual message panel disappears after two seconds')
  # Pick a reachable real rail by evaluating trajectories only. The input driver
  # then turns/draws through ordinary keyboard events; it never places the actor.
  plan=page.evaluate("""()=>{const g=Vesperfall.component,C=VesperCore,T=g.T,s=g.game,head=g.head.object3D.getWorldPosition(new T.Vector3()).toArray();for(const b of s.world.solids.filter(b=>b.type==='balustrade')){const x=(b.min[0]+b.max[0])/2,z=b.max[2]-.25,yaw=Math.atan2(-(x-head[0]),-(z-head[2]));for(let pitch=.12;pitch<1.2;pitch+=.02){const d=[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)],origin=C.add(head,C.mul(d,.18)),p=C.predictBlink(s,origin,d,1);if(p.ok&&p.reason==='rail / stone perch')return {yaw,pitch,p};}}throw Error('No accessible first rail');}""")
  page.keyboard.press('Digit4');aim(plan['yaw'],plan['pitch']);page.keyboard.down('Space');wait('Vesperfall.component.charge===1');page.keyboard.up('Space');wait('Vesperfall.state.blinks>0');
  check(page.evaluate('SureflightModel.perchAt(Vesperfall.state.world,Vesperfall.state.p,.01,.01)!==null'),'An actual released golden projectile places the player on a structural rail')
  page.keyboard.press('KeyP');wait('Vesperfall.component.paused');page.locator('#save-expedition').click();saved=observe()
  page.screenshot(path=str(OUT/'rail-arrival.png'))
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.echoes');page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused')
  check(observe()['p']==saved['p'],'A real save and page reload retains the exact narrow-rail perch')
  check(page.evaluate('Vesperfall.component.echoes.state.found.includes("causeway-dispatch")'),'The original story note persists separately from the expedition checkpoint')
  page.locator('#story-journal').click();wait('!document.querySelector("#dominion-dialog").hidden')
  check('Ilyra' in page.locator('#dominion-dialog-body').inner_text(),'The complete dispatch can be reread rather than lost with its two-second message')
  check(not errors,'No uncaught application errors');check(not console,'No captured console or shader errors')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'plan':plan,'arrival':saved,'scope':'Normal-start rendered HTTP gameplay with generated keyboard input; not physical Quest approval.'},indent=2))
 except Exception as e:
  snapshot=None
  try:snapshot=observe();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'snapshot':snapshot},indent=2));raise
 finally:ctx.close();browser.close()
