"""Actual A-Frame art/route acceptance with ordinary UI and keyboard events.
Routes read observations, but do not assign positions, health, time or progress.
"""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import os,json,time
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('CATHEDRAL_SUITE','visual');BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');OUT=ROOT/'test-output'/('cathedral-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def snap(p):return p.evaluate('Vesperfall.snapshot()')
WALK="""async targets=>{
 const held=new Set(),canvas=AFRAME.scenes[0].canvas;
 function key(code,on){if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);}
 await new Promise((resolve,reject)=>{let n=0,started=performance.now(),lastMovement=started,lastPosition=[...Vesperfall.state.p],startTime=Vesperfall.state.time;const timer=setInterval(()=>{
  const s=Vesperfall.state,c=Vesperfall.component,[x,y,z]=targets[n],dx=x-s.p[0],dz=z-s.p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));
  key('ArrowLeft',a>.017);key('ArrowRight',a<-.017);key('KeyW',Math.abs(a)<.065&&d>.09);key('ShiftLeft',true);
  if(VesperCore.len(VesperCore.sub(lastPosition,s.p))>.1){lastMovement=performance.now();lastPosition=[...s.p];}
  if(d<.10){for(const k of [...held])key(k,false);n++;started=performance.now();lastMovement=started;startTime=s.time;if(n===targets.length){clearInterval(timer);resolve();}}
  else if(c.paused||s.phase!=='playing'||performance.now()-lastMovement>35000||performance.now()-started>150000){for(const k of [...held])key(k,false);clearInterval(timer);reject(Error('Traversal incomplete '+JSON.stringify({target:targets[n],position:s.p,phase:s.phase,yaw:c.yaw,keys:c.keys,simSeconds:s.time-startTime,wallSeconds:(performance.now()-started)/1000,stationarySeconds:(performance.now()-lastMovement)/1000,calls:AFRAME.scenes[0].renderer.info.render.calls,triangles:AFRAME.scenes[0].renderer.info.render.triangles})));}
 },2);});
}"""
def capture(p,name):
 if MODE=='routes':p.set_viewport_size({'width':1120,'height':800})
 p.screenshot(path=str(OUT/name))
 if MODE=='routes':p.set_viewport_size({'width':640,'height':480})
def walk(p,targets):p.evaluate(WALK,targets)
def rooms_to(p,room):walk(p,p.evaluate('(r)=>VesperCore.route(Vesperfall.state.world,VesperCore.roomAt(Vesperfall.state.world,Vesperfall.state.p),r).map(i=>{const q=Vesperfall.state.world.rooms[i];return [q.x,0,q.z]})',room))
def aim(p,yaw,pitch=0):
 p.evaluate("""async ({yaw,pitch})=>{const held=new Set(),canvas=AFRAME.scenes[0].canvas,key=(c,on)=>{if(held.has(c)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:c,bubbles:true}));on?held.add(c):held.delete(c);};await new Promise(resolve=>{const t=setInterval(()=>{const c=Vesperfall.component,a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;key('ArrowLeft',a>.017);key('ArrowRight',a<-.017);key('ArrowUp',b>.012);key('ArrowDown',b<-.012);if(Math.abs(a)<.018&&Math.abs(b)<.013){for(const k of [...held])key(k,false);clearInterval(t);resolve();}},2);});}""",{'yaw':yaw,'pitch':pitch})
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport=({'width':640,'height':480} if MODE=='routes' else {'width':1120,'height':800}),device_scale_factor=.5 if MODE=='routes' else 1,service_workers='block');host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort());p=ctx.new_page();p.set_default_timeout(95000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  if MODE=='visual':
   p.goto(BASE+'/baseline/vesperfall/',wait_until='domcontentloaded');p.wait_for_function('window.Vesperfall?.component.rendererReady');p.locator('#practice').click();p.wait_for_function('!Vesperfall.component.paused&&Vesperfall.component.running');p.wait_for_timeout(400);p.screenshot(path=str(OUT/'before-choir.png'));p.goto('about:blank')
  p.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');p.wait_for_function('window.Vesperfall?.component.cathedral&&Vesperfall.component.rendererReady&&Vesperfall.component.art.cathedralStatus.textures===6&&Vesperfall.component.worldArt.group.userData.loadedSculptures>0')
  check(p.evaluate('VesperCore.VERSION==="0.5.0"'),'The current renderer identifies the Living Cathedral release')
  check(p.evaluate('Vesperfall.component.art.cathedralStatus.errors.length===0'),'All six local material maps and the modeled sculpture load without an external CDN')
  p.locator('#practice').click();p.wait_for_function('!Vesperfall.component.paused&&Vesperfall.component.running');p.wait_for_function('Vesperfall.component.worldArt.group.userData.loadedSculptures>0');profile=p.evaluate('JSON.stringify(Vesperfall.component.profile)');w=p.evaluate('JSON.parse(JSON.stringify(Vesperfall.state.world))')
  check(len({r['planFamily'] for r in w['rooms']})==6,'The actual scene contains six architecture families with real dimensions')
  if MODE=='visual':
   p.screenshot(path=str(OUT/'after-choir.png'));p.locator('a-scene canvas').focus();aim(p,-1.87,0);p.screenshot(path=str(OUT/'masonry-and-sculpture.png'))
   p.keyboard.press('KeyM');p.wait_for_function('!document.getElementById("map").hidden&&Vesperfall.component.cathedral.atlasBounds');bounds=p.evaluate('Vesperfall.component.cathedral.atlasBounds')
   check(bounds['maxX']-bounds['minX']>60 and bounds['maxZ']-bounds['minZ']>65,'The atlas scales to actual nonuniform room extents')
   check(p.evaluate('Vesperfall.component.worldArt.group.children.some(o=>o.name.includes("Marble Bust"))'),'The detailed sculpture is a loaded mesh inside the live game, not a preview image')
   p.screenshot(path=str(OUT/'scaled-route-atlas.png'));p.keyboard.press('KeyM');p.locator('#menu-button').click();p.wait_for_function('Vesperfall.component.paused');p.locator('#cathedral-shadows').uncheck();p.locator('#lighting').select_option('daylight');p.locator('#seed').fill('STONE-13');p.locator('#practice').click();p.wait_for_function('Vesperfall.state.world.seed==="STONE-13"&&!Vesperfall.component.paused');p.wait_for_function('Vesperfall.component.worldArt.group.userData.loadedSculptures>0')
   current=p.evaluate('Vesperfall.state.world.rooms');check(current!=w['rooms'],'Another seed rebuilds the differently shaped layout')
   p.keyboard.press('KeyM');p.screenshot(path=str(OUT/'second-seed-atlas.png'));p.keyboard.press('KeyP');p.wait_for_function('Vesperfall.component.paused');p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(OUT/'mobile-menu.png'))
   check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Graphics/settings remain inside a narrow viewport')
  else:
   p.keyboard.press('KeyP');p.wait_for_function('Vesperfall.component.paused');p.locator('#cathedral-shadows').uncheck();p.locator('#resume').click();p.locator('a-scene canvas').focus();br=w['architecture']['routes'][0];rooms_to(p,br['from']);walk(p,[br['entry'],[br['entry'][0],3.2,br['a'][2]],br['a']]);check(abs(snap(p)['player'][1]-3.2)<.02,'Normal movement ascends the first room stair to the high-route entrance')
   midpoint=[(br['a'][0]+br['b'][0])/2,3.2,br['a'][2]];score=snap(p)['score'];walk(p,[midpoint]);check(snap(p)['score']==score+100,'Crossing the upper route collects its elevation-gated 100-point reliquary')
   p.keyboard.press('KeyM');capture(p,'between-rooms-skywalk.png');p.keyboard.press('KeyM');walk(p,[br['b'],[br['exit'][0],3.2,br['b'][2]],br['exit']]);check(snap(p)['player'][1]<.05,'The skywalk ends at another real stair and reconnects with the ground route')
   walk(p,[[br['exit'][0],3.2,br['b'][2]],br['b'],br['a'],[br['entry'][0],3.2,br['a'][2]],br['entry']]);check(snap(p)['score']==score+100,'Reverse traversal works and does not award the same relic twice')
   t=w['architecture']['tower'];rooms_to(p,t['room']);room=w['rooms'][t['room']];entry=[room['x']-4.85,0,room['z']+4.75];walk(p,[entry,[entry[0],3.2,room['z']-4.85],t['entry'],t['top'],t['reward']]);check(abs(snap(p)['player'][1]-6.4)<.02,'The second flight of stairs reaches the playable 6.4-metre belfry crown')
   check(snap(p)['score']==score+200,'The high belfry reward is collected only after reaching its floor');aim(p,0,-.30);capture(p,'belfry-crown.png');walk(p,[t['top'],t['entry'],[entry[0],3.2,room['z']-4.85],entry]);check(snap(p)['player'][1]<.05,'The entire two-level belfry route returns to the street without a reset')
   check(p.evaluate('JSON.stringify(Vesperfall.component.profile)')==profile,'Exploration practice never changes permanent Chronicle progression')
   p.keyboard.press('KeyP');p.wait_for_function('Vesperfall.component.paused');p.locator('#practice').click();p.wait_for_function('Vesperfall.component.worldArt.group.userData.loadedSculptures>0');check(p.evaluate('Vesperfall.component.art.cathedralStatus.textures===6&&Vesperfall.component.art.cathedralStatus.sculptures===1'),'Sector rebuild reuses the six decoded maps and one sculpture model')
  check(not errors,'No uncaught errors in the checked native A-Frame flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'world':w['architecture'],'state':snap(p),'assets':p.evaluate('Vesperfall.component.art.cathedralStatus'),'renderer':p.evaluate('({calls:AFRAME.scenes[0].renderer.info.render.calls,triangles:AFRAME.scenes[0].renderer.info.render.triangles,textures:AFRAME.scenes[0].renderer.info.memory.textures})'),'scope':'Actual HTTP A-Frame with ordinary inputs. Routes use 640x480 CSS / 320x240 drawing buffer; 1120x800 CSS captures. Half pixel ratio and disabled desktop sun shadows for CPU-only verification; visual frames use full ratio. Observations guide inputs but never assign actors or progression. Not physical Quest acceptance.'},indent=2))
 except Exception as e:
  try:debug=p.evaluate('({state:window.Vesperfall?.snapshot(),art:window.Vesperfall?.component.art.cathedralStatus,world:window.Vesperfall?.state.world.architecture})')
  except:debug=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'debug':debug},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
