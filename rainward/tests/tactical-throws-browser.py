"""Normal Start, earned rations/crafting/checkpoint, real HTTP/WebGL rendering.
Keyboard/mouse plus synthetic Xbox and XR controllers; no actor/resource/clock
assignments. This is not a full mission, a physical device or a performance test.
"""
import os,json,base64
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/tactical-throws');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
PAD="""window.padPolls=0;window.testPad={id:'Test Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [testPad];}});"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':760},service_workers='block')
 ctx.add_init_script(PAD+"window.REPAIR_LAYER='projection';\n"+Path('rainward/tests/quest-device-mock.js').read_text()+'\n'+Path('rainward/tests/xr-repair-device.js').read_text()+"\nlocalStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({low:true,scanned:false,cinematic:false,detailedHumans:false,mute:true}));")
 p=ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def check(v,label):
  assert v,label
  checks.append(label);print('PASS',label,flush=True);(OUT/'progress.json').write_text(json.dumps({'checks':checks},indent=2))
 def frames(n=4):
  key='questDevice.frames' if p.evaluate('Rainward.snapshot().xr.active') else 'padPolls';old=p.evaluate(key);p.wait_for_function('([key,old,n])=>eval(key)>=old+n',arg=[key,old,n])
 def pad(index,on):p.evaluate('([i,on])=>testPad.buttons[i]={pressed:on,value:on?1:0}',[index,on]);frames()
 def go(x,z):
  p.evaluate('''async ([x,z])=>{await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const a=Rainward.state.player,dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz),yaw=Rainward.view.yaw;
   if(d<.18||performance.now()-start>20000||Rainward.mode!=='play'){clearInterval(timer);testPad.axes=[0,0,0,0];d<.18?resolve():reject(Error('Ordinary movement blocked'));return;}
   const scale=Math.min(.6,Math.max(.28,d*.4));testPad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;testPad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;
  },16);});}''',[x,z]);frames()
 def equip(kind):
  p.keyboard.press('Tab');wait('Rainward.mode==="pack"');p.locator('#equip-'+kind).click();p.locator('#pack-close').click();wait('Rainward.mode==="play"');frames()
 def latestThrow():return p.evaluate('Rainward.state.events.filter(e=>e.type==="throw").at(-1)')
 def saves():return p.evaluate('JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes("checkpoint")).sort().map(k=>[k,localStorage.getItem(k)])))')
 def selectXR(id):
  frames();p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),s=Rainward.snapshot().xr,r=s.panelRows.find(r=>r.id===id);if(!r)throw Error('Missing XR row '+id);const at=new T.Vector3(((r.x+r.w/2)/1024-.5)*1.45,(.5-(r.y+r.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(s.panelMatrix)),src=questDevice.sources[1],q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),at.sub(new T.Vector3(src.position.x,src.position.y,src.position.z)).normalize());src.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',id);frames();p.evaluate("questDevice.pulse('right',0)")
  if id=='exit':wait('!Rainward.snapshot().xr.active')
  else:frames()
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>3');check(p.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'Normal title starts without a planted save');p.locator('#start').click();wait('Rainward.mode==="play"');frames()
  check(p.evaluate('Rainward.snapshot().freefield.freeStride&&Rainward.snapshot().controlPreset==="survival"'),'The journey retains default fast movement and Survival controls')
  go(1.3,25.5);p.keyboard.press('KeyE');wait('Rainward.state.taken.has("rations")');p.keyboard.press('Tab');wait('Rainward.mode==="pack"');p.locator('#craft-smoke').hover();p.mouse.down();wait('Rainward.state.player.smoke===1&&!Rainward.state.player.craft');p.mouse.up();p.locator('#equip-smoke').click();p.locator('#pack-close').click();wait('Rainward.mode==="play"');frames();go(0,27);p.keyboard.press('KeyE');wait('!!localStorage.getItem("svgn.rainward.v1.checkpoint")');saved=saves()
  check(p.evaluate('Rainward.state.player.smoke===1&&Rainward.state.player.bottles===2'),'Rations and normal held crafting supply the tools being tested')
  p.keyboard.down('ArrowLeft');wait('Math.sin(Rainward.view.yaw)>.995');p.keyboard.up('ArrowLeft');frames();pad(6,True);wait('Rainward.snapshot().visuals.throwGuide.visible');guide=p.evaluate('Rainward.snapshot().visuals.throwGuide')
  check(guide['valid'] and guide['shortened'] and 0.6<guide['range']<4,'Aiming at the shelter wall previews a nearer legal smoke landing')
  p.screenshot(path=str(OUT/'screen-smoke-preview.png'));pad(7,True);wait('Rainward.state.player.smoke===0');pad(7,False);event=latestThrow();check(event['to']==guide['landing'],'Actual smoke release uses the same endpoint shown before the throw');wait('Rainward.state.smokes.length===1');cloud=p.evaluate('Rainward.state.smokes[0]');check(abs(cloud['x']-guide['landing']['x'])<1e-7 and abs(cloud['z']-guide['landing']['z'])<1e-7,'The smoke cloud forms at the predicted landing, not beyond the wall');pad(6,False)
  equip('bottle');pad(6,True);wait('Rainward.snapshot().visuals.throwGuide.kind==="bottle"');guide=p.evaluate('Rainward.snapshot().visuals.throwGuide');pad(7,True);wait('Rainward.state.player.bottles===1');frames(18);check(p.evaluate('Rainward.state.player.bottles')==1,'Holding the throw trigger does not spend a second bottle');pad(7,False);check(latestThrow()['to']==guide['landing'],'Bottle launch shares its preview endpoint and finite inventory');pad(6,False)
  p.keyboard.press('KeyP');wait('Rainward.mode==="pause"');frames();check(not p.evaluate('Rainward.snapshot().visuals.throwGuide.visible'),'Pause stows the guide rather than leaving a floating gameplay overlay');check(saves()==saved,'Throws and previews never rewrite the earned checkpoint')
  p.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>3');p.locator('#continue').click();wait('Rainward.mode==="play"');frames();check(p.evaluate('Rainward.state.player.smoke===1&&Rainward.state.player.bottles===2') and saves()==saved,'Continue restores the earned pre-throw quantities through the unchanged save path')
  equip('smoke');p.keyboard.press('KeyP');wait('Rainward.mode==="pause"');p.locator('#xr-view-pause').select_option('diorama-ar');p.locator('#xr-start').click();wait('Rainward.snapshot().xr.active');selectXR('resume');wait('Rainward.mode==="play"');frames(8)
  p.evaluate('''async()=>{const T=await import('./vendor/three.module.js'),s=Rainward.snapshot(),a=s.player,at=new T.Vector3(a.x-8,a.y+.5,a.z).applyMatrix4(new T.Matrix4().fromArray(s.xr.diorama.worldMatrix)),src=questDevice.sources[1],q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),at.sub(new T.Vector3(src.position.x,src.position.y,src.position.z)).normalize());src.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''');frames(8);p.evaluate("questDevice.button('left',0,true)");wait('Rainward.snapshot().visuals.throwGuide.visible&&Rainward.snapshot().visuals.throwGuide.valid');frames();guide=p.evaluate('Rainward.snapshot().visuals.throwGuide')
  check(guide['kind']=='smoke' and guide['extraRenderTargets']==0,'Tracked AR aiming draws the same world-space tool guide without an extra render target')
  p.evaluate("questDevice.captureRequested='ar-throw-preview'");wait('questDevice.captures.some(c=>c.label==="ar-throw-preview")');capture=p.evaluate('questDevice.captures.find(c=>c.label==="ar-throw-preview")');(OUT/'ar-throw-preview.png').write_bytes(base64.b64decode(capture.pop('png').split(',')[1]));(OUT/'ar-throw-preview.json').write_text(json.dumps(capture,indent=2));check(all(e['solid']>50 and e['colorful']>20 for e in capture['eyes']),'Both actual compositor attachments contain rendered world/UI pixels during the aimed throw')
  p.evaluate("questDevice.button('right',0,true)");wait('Rainward.state.player.smoke===0');p.evaluate("questDevice.button('right',0,false);questDevice.button('left',0,false)");frames();check(latestThrow()['to']==guide['landing'],'Tracked-controller release agrees with the world-space preview');check(saves()==saved,'AR throwing preserves the same earned checkpoint bytes')
  p.evaluate("questDevice.pulse('right',3)");wait('Rainward.mode==="pause"');selectXR('exit');check(p.evaluate('Rainward.mode')=='pause','Exit XR retains the native pause recovery path')
  check(p.evaluate('Rainward.state.enemies.every(e=>e.hp>0)&&Rainward.state.stats.shots===0'),'All original enemies remain alive and no firearm ammunition was consumed')
  check(not errors and not console,'No captured script or graphics errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':__doc__},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
