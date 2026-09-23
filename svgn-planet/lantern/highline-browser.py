"""Highline on the real main entry using controller inputs, never assigned game state.
Rendered Chromium with an emulated Xbox is not a physical Quest/Xbox playtest.
"""
import asyncio, base64, json, os, traceback
from PIL import Image
from pathlib import Path
from playwright.async_api import async_playwright
BASE = os.getenv('MAIN_BASE', 'http://127.0.0.1:8765/svgn-planet/')
OUT = Path(os.getenv('HIGHLINE_OUT', 'published-results/highline' if BASE.startswith('https:') else 'highline-results'))
OUT.mkdir(parents=True, exist_ok=True)
PAD = """window.__highlinePad={id:'Highline Xbox input fixture',mapping:'standard',connected:true,index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__highlinePad]});"""

async def main():
 report={'source':os.getenv('GITHUB_SHA'),'base':BASE,'checks':[],'errors':[],'consoleErrors':[], 'inputOnly':True,'physicalDevicesTested':False,'scope':'Desktop real renderer and synthetic Xbox. Native XR and hardware approval remain separate.'}
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':960,'height':640});page.set_default_timeout(180000)
  await page.add_init_script(PAD)
  await page.add_init_script(Path(__file__).with_name("xr-fixture.js").read_text())
  page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def snapshot():return await page.evaluate('NeighborhoodMissions.inspect()')
  def ok(text):report['checks'].append(text);(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('PASS',text,flush=True)
  async def frames(n=5):
   before=(await snapshot())['frames'];await page.wait_for_function('(v)=>NeighborhoodMissions.inspect().frames>=v',arg=before+n)
  async def ready():
   await page.wait_for_function('window.NeighborhoodMissions&&!document.querySelector("#start").disabled')
   await page.click('#play-highline');await page.wait_for_function('NeighborhoodMissions.inspect().district==="lantern"&&!NeighborhoodMissions.inspect().paused');await frames(8)
   await page.keyboard.press('KeyC');await frames(4)
  async def xbox_interact():
   await page.evaluate('__highlinePad.buttons[2]={pressed:true,value:1}')
   await frames(5)
   await page.evaluate('__highlinePad.buttons[2]={pressed:false,value:0}')
   await frames(6)
  async def circuit_ar_capture():
   await page.click('#pause');await page.click('#ward-xr');await page.click('#xr-diorama-third-ar')
   await page.wait_for_function('NeighborhoodMissions.inspect().xr.active&&NeighborhoodMissions.inspect().xr.console.progress>=.99');await frames(5)
   await page.evaluate("""async()=>{const T=await import('./vendor/three.module.js'),p=NeighborhoodMissions.panel(),r=p.rows.find(r=>r.id==='ward-resume');if(!r)throw Error('Missing native Resume');const v=new T.Vector3(((r.x+r.w/2)/1024-.5)*p.width,(.5-(r.y+r.h/2)/1024)*p.height,.03).applyMatrix4(new T.Matrix4().fromArray(p.referenceMatrix)),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),v.normalize()),m=new T.Matrix4().makeRotationFromQuaternion(q);__xrFixture.right.targetRaySpace.pose={position:{x:0,y:0,z:0,w:1},orientation:q,matrix:m.elements};}""")
   await frames(4);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:true,value:1}');await frames(4);await page.evaluate('__xrFixture.right.gamepad.buttons[0]={pressed:false,value:0}');await page.wait_for_function('!NeighborhoodMissions.inspect().paused');await frames(6)
   q=await snapshot();assert q['xr']['eyes']==2 and q['spatial']['centerError']<1e-5 and q['channel']['visible'];assert not q['xr']['actionPanelVisible'];assert q['channel']['publicLampIntensity']==0
   await page.evaluate("""()=>{window.__channelPixels=null;const s=__xrFixture.session,old=s.requestAnimationFrame.bind(s);s.requestAnimationFrame=cb=>old((time,frame)=>{cb(time,frame);if(window.__channelPixels===null){const gl=document.querySelector('#world').getContext('webgl2'),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let raw='';for(let i=0;i<p.length;i+=32768)raw+=String.fromCharCode(...p.subarray(i,i+32768));window.__channelPixels={w,h,bytes:btoa(raw)};}});}""")
   await page.wait_for_function('window.__channelPixels!==null');capture=await page.evaluate('__channelPixels');image=Image.frombytes('RGBA',(capture['w'],capture['h']),base64.b64decode(capture['bytes'])).transpose(Image.Transpose.FLIP_TOP_BOTTOM);assert len(image.getcolors(image.width*image.height) or [])>12;assert any(a==0 for a in image.getchannel('A').getdata());image.save(OUT/'07-channel-diorama-ar.png')
   await page.evaluate('__xrFixture.session.end()');await page.wait_for_function('!NeighborhoodMissions.inspect().xr.active');await frames(5)
   if (await snapshot())['paused']:await page.click('#ward-resume')
   await frames(5);ok('Active circuit renders in stereo AR, keeps passthrough and uses native ray Resume without a permanent menu')
  async def walk(x,z,y=None):
   value=await page.evaluate("""async ([x,z,y])=>{
    const start=performance.now();let closest=Infinity,progressAt=start;
    try{while(performance.now()-start<180000){
     const n=NeighborhoodMissions.inspect(),s=n.ward;if(n.failed||n.blocked||n.paused)throw Error('Unexpected pause/save/runtime failure '+JSON.stringify(n));
     const dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),u=Math.min(1,d/.65);
     __highlinePad.axes[0]=d>.12?dx/(d||1)*u:0;__highlinePad.axes[1]=d>.12?dz/(d||1)*u:0;
     __highlinePad.buttons[1]={pressed:d<=.12,value:d<=.12?1:0};
     if(d<closest-.03){closest=d;progressAt=performance.now();}
     if(d<.18&&s.speed<.08&&Math.abs(s.vy)<.02){if(y!==null&&Math.abs(s.y-y)>.22)throw Error('Wrong landing '+JSON.stringify({target:[x,y,z],at:[s.x,s.y,s.z]}));return {x:s.x,y:s.y,z:s.z};}
     if(performance.now()-progressAt>20000)throw Error('No movement progress '+JSON.stringify({target:[x,y,z],at:[s.x,s.y,s.z],message:s.message}));
     await new Promise(requestAnimationFrame);
    }throw Error('Movement timeout');}finally{__highlinePad.axes[0]=__highlinePad.axes[1]=0;__highlinePad.buttons[1]={pressed:false,value:0};}
   }""",[x,z,y]);report.setdefault('landings',[]).append(value)
  async def route(points):
   for pt in points:await walk(*pt)
  async def interact(stage,case='highline'):
   await page.keyboard.press('KeyE');await frames(5)
   state=(await snapshot())['ward'];assert state['campaign']['progress'][case]==stage,state
   ok('Reached and interacted: '+case+' stage '+str(stage))
  async def ascend(first,second,start,end):
   for i in range(start,end):
    forward=i%2==0;x=first if forward else second
    await walk(x,-4.5 if forward else 2.5,4.4+i*3.2);await walk(x,2.5 if forward else -5.05,4.4+(i+1)*3.2)
  async def descend(first,second,start,end):
   for i in range(start-1,end-1,-1):
    forward=i%2==0;x=first if forward else second
    await walk(x,2.5 if forward else -5.05,4.4+(i+1)*3.2);await walk(x,-5.05 if forward else 2.5,4.4+i*3.2)
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await ready()
   state=(await snapshot())['ward'];assert state['campaign']['active']=='highline' and state['campaign']['credits']==0 and state['watch']['stage']==0
   await page.screenshot(path=str(OUT/'01-new-skyline.png'));ok('Direct Highline button starts the actual district without granting kit or old campaign completion')
   await route([[-12.5,8.2],[-12.5,5.1],[-12.5,-3.7,4.4],[-6,-3.5],[6,-3.5],[12,0]])
   await interact(1)
   await route([[12,-3.5],[6,-3.5],[-6,-3.5],[-15,-4.5,4.4]]);await ascend(-15,-10,0,2);await walk(-12.5,-5.05,10.8);await interact(2)
   await ascend(-15,-10,2,4);await walk(-12.5,-5.05,17.2);await interact(3)
   await page.screenshot(path=str(OUT/'02-print-exchange-17m.png'))
   await route([[-6,-5.05,17.2],[6,-5.05,17.2],[15,-5.05,17.2]]);await ascend(18,12,4,6);await walk(15,-5.05,23.6)
   assert len([e for e in (await snapshot())['campaign']['enemies'] if e['hp']==3])==2
   await interact(4);await page.screenshot(path=str(OUT/'03-radio-tower-24m.png'));ok('Two upper towers and the upper bypass are traversed without attacking either sentry')
   raw=await page.evaluate('localStorage.getItem("svgn.lantern-ward.v1")');assert abs(json.loads(raw)['y']-23.6)<.22
   await page.reload(wait_until='domcontentloaded');await ready();restored=await snapshot()
   assert restored['ward']['campaign']['progress']['highline']==4 and abs(restored['ward']['y']-23.6)<.22
   assert not restored['campaign']['enemies'];ok('Actual 23.6 m save reload retains progress and does not revive the restored network')
   await descend(18,12,6,0);await route([[15,-3.5,4.4],[12,0,4.4]]);await interact(5)
   await route([[12,-3.5],[6,-3.5],[-6,-3.5],[-12.5,-3.7],[-12.5,5.1,0],[-12.5,8.2],[-10,14,0]]);await interact(6)
   state=(await snapshot())['ward'];assert state['campaign']['credits']==240 and state['campaign']['active'] is None
   assert state['credits']==state['city']['credits']==state['watch']['credits']==0
   await page.keyboard.press('KeyE');await frames();assert (await snapshot())['ward']['campaign']['credits']==240
   await page.screenshot(path=str(OUT/'04-homecoming.png'));ok('Homecoming records exactly 240 credits and leaves the original chapter, resident and Watch ledgers unchanged')
   # Continue only through the real mission board, movement and interactions.
   await page.click('#pause');await page.click('[data-mission="campaign:unsent"]');await frames()
   await route([[-12.5,8.2],[-12.5,5.1],[-9.5,4.5,0]]);await interact(1,'unsent')
   await route([[-9.5,5.1],[-12.5,5.1],[-12.5,-3.7,4.4],[-15,-4.5,4.4]]);await ascend(-15,-10,0,2)
   await route([[-12.5,-5.05,10.8],[-17.4,-5.05,10.8],[-19.1,-6,10.8]]);await interact(2,'unsent')
   await route([[-20,-5.05,10.8],[-21.5,-4.6,10.8]]);await interact(3,'unsent');await page.screenshot(path=str(OUT/'05-upper-archive.png'))
   await route([[-20,-5.05],[-17.4,-5.05],[-12.5,-5.05]]);await descend(-15,-10,2,0)
   await route([[-6,-3.5,4.4],[6,-3.5,4.4],[12,0,4.4]]);await interact(4,'unsent')
   state=(await snapshot())['ward'];assert state['campaign']['credits']==360 and 'unsent' in state['campaign']['completed']
   assert state['credits']==state['city']['credits']==state['watch']['credits']==0
   await page.keyboard.press('KeyE');await frames();assert (await snapshot())['ward']['campaign']['credits']==360
   ok('The Unsent Call reaches every real upper-room control and awards only 120 additional credits')
   # The power puzzle starts at the genuinely earned endpoint above. No save
   # preload, stage assignment or synthetic actor teleport is used here.
   await page.click('#pause');await page.click('[data-mission="campaign:channel"]');await frames();await xbox_interact()
   assert (await snapshot())['ward']['campaign']['progress']['channel']==1
   await route([[12,-3.5,4.4],[6,-3.5,4.4],[-6,-3.5,4.4],[-15,-4.5,4.4]]);await ascend(-15,-10,0,2)
   await route([[-12.5,-5.05,10.8],[-17.4,-5.05,10.8],[-20,-5.05,10.8],[-21.5,-4.6,10.8]])
   await xbox_interact();q=await snapshot();assert q['ward']['campaign']['progress']['channel']==1 and q['ward']['campaign']['credits']==360;assert 'only 2 are free' in q['ward']['message'];assert q['channel']['publicLampIntensity']==.4
   await page.screenshot(path=str(OUT/'06-channel-power-deficit.png'));ok('Real uplink denies an unpowered transmission without moving the courier, erasing progress or awarding credits')
   await route([[-20,-5.05,10.8],[-18.4,-4.15,10.8]]);await xbox_interact();q=await snapshot();assert q['channel']['state']['available']==4 and q['channel']['publicLampIntensity']==0
   await circuit_ar_capture()
   await page.reload(wait_until='domcontentloaded');await ready();q=await snapshot();assert q['ward']['campaign']['progress']['channel']==1 and not q['ward']['campaign']['routing']['street'];assert q['channel']['publicLampIntensity']==0
   await xbox_interact();q=await snapshot();assert q['channel']['state']['available']==2 and q['channel']['publicLampIntensity']==.4
   ok('Xbox toggles the short diversion, actual bulbs dim, saved circuit survives reload, and toggling back restores service')
   await route([[-20,-5.05,10.8],[-17.4,-5.05,10.8],[-12.5,-5.05,10.8]]);await descend(-15,-10,2,0)
   await route([[-6,-3.5,4.4],[6,-3.5,4.4],[15,-3.5,4.4],[19.5,2.4,4.4],[19.5,10.7,0],[17.5,7.7,0]])
   await xbox_interact();q=await snapshot();assert q['ward']['campaign']['routing']['reserve'] and q['channel']['state']['available']==4 and q['channel']['publicLampIntensity']==.4
   await route([[19.5,10.7,0],[19.5,2.4,4.4],[15,-3.5,4.4],[6,-3.5,4.4],[-6,-3.5,4.4],[-15,-4.5,4.4]]);await ascend(-15,-10,0,2)
   await route([[-12.5,-5.05,10.8],[-17.4,-5.05,10.8],[-20,-5.05,10.8],[-21.5,-4.6,10.8]])
   await xbox_interact();q=await snapshot();assert q['ward']['campaign']['progress']['channel']==2 and q['ward']['campaign']['routing']['outcome']=='reserve';assert q['channel']['publicLampIntensity']==.4
   await page.screenshot(path=str(OUT/'08-channel-reserve-transmission.png'));ok('Actual workshop reserve supports a successful archive transmission with public lights still on')
   await route([[-20,-5.05,10.8],[-19.1,-6,10.8]]);await xbox_interact();q=await snapshot();assert q['ward']['campaign']['progress']['channel']==3 and not q['ward']['campaign']['routing']['reserve'] and q['ward']['campaign']['routing']['street']
   await route([[-20,-5.05,10.8],[-17.4,-5.05,10.8],[-12.5,-5.05,10.8]]);await descend(-15,-10,2,0)
   await route([[-6,-3.5,4.4],[6,-3.5,4.4],[12,0,4.4]]);await xbox_interact();state=(await snapshot())['ward'];assert state['campaign']['progress']['channel']==4 and state['campaign']['credits']==500;assert state['credits']==state['watch']['credits']==state['city']['credits']==0
   await xbox_interact();assert (await snapshot())['ward']['campaign']['credits']==500
   ok('Acknowledgement releases temporary routing and homecoming awards only 140 additional credits, once')
   report['channelFinalOutcome']='reserve';report['channelDiversionExercisedAndReversed']=True
   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True
  except Exception as exc:
   report.update(success=False,failure=str(exc),traceback=traceback.format_exc());print(report['traceback'],flush=True)
   try:report['final']=await snapshot();await page.screenshot(path=str(OUT/'failure.png'))
   except Exception:pass
  finally:
   (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');await browser.close()
 if not report.get('success'):raise SystemExit(1)

asyncio.run(main())
