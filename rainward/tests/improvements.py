"""Native regression for v0.2 controls, camera and feedback. Only UI/key actions
change game state. The observer's path guidance is not a gameplay feature."""
import json,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-improvements');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS',label,flush=True)
def go(page,x,z):
 page.evaluate('''async ({x,z})=>{
 const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});
 const held=new Set(),cv=document.getElementById('world');cv.focus();
 const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));};
 await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),timer=setInterval(()=>{
 const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>100000){clearInterval(timer);for(const k of [...held])key(k,false);reject(Error('Navigation interrupted'));return;}
 const q=route[i],dx=q.x-p.x,dz=q.z-p.z;if(Math.hypot(dx,dz)<.27){if(++i===route.length){clearInterval(timer);for(const k of [...held])key(k,false);resolve();}return;}
 const yaw=Rainward.view.yaw,lx=Math.cos(yaw)*dx-Math.sin(yaw)*dz,lz=-Math.sin(yaw)*dx-Math.cos(yaw)*dz;
 key('KeyD',lx>.12);key('KeyA',lx<-.12);key('KeyW',lz>.12);key('KeyS',lz<-.12);
 },20);});}''',{'x':x,'z':z})
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**args);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block');c.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,sensitivity:85}))")
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(75000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');page.wait_for_function('window.Rainward');page.locator('#start').click();page.wait_for_function('Rainward.mode==="play"')
  check(page.evaluate('Rainward.snapshot().version==="0.2.0"'),'The loaded game identifies the v0.2 release')
  page.keyboard.press('KeyV');page.wait_for_function('Rainward.view.shoulder===-1&&Rainward.snapshot().camera.x<Rainward.state.player.x-.35');check(True,'V moves the actual camera to the left shoulder, not only a label')
  page.keyboard.press('KeyV');page.wait_for_function('Rainward.view.shoulder===1&&Rainward.snapshot().camera.x>Rainward.state.player.x+.35');check(True,'Shoulder switching works in both directions')
  check(page.locator('#noise-label').inner_text().endswith('STILL'),'The feedback recognizes standing still')
  page.keyboard.down('KeyW');page.wait_for_function('Rainward.state.player.speed>2.5');page.keyboard.up('KeyW');page.wait_for_function('Rainward.state.player.speed<.04');check(True,'Movement accelerates and brakes back to rest')
  go(page,-19,16);page.keyboard.press('KeyC');page.wait_for_function('document.getElementById("cover-label").textContent==="GRASS COVER"');check(True,'Actual crouch and level grass drive the concealment display')
  page.keyboard.press('KeyZ');page.wait_for_function('document.getElementById("cover-label").textContent==="DEEP COVER"');check(True,'Prone cover is shown distinctly without promising invisibility')
  page.screenshot(path=str(OUT/'deep-cover.png'));page.keyboard.press('KeyZ')
  go(page,-19,7);go(page,-24,6);go(page,-24,-1)
  # Look around a real small interior using arrows, checking every sampled camera.
  positions=[];page.keyboard.down('ArrowLeft')
  for _ in range(32):
   page.wait_for_timeout(75);positions.append(page.evaluate('Rainward.snapshot().camera'))
  page.keyboard.up('ArrowLeft')
  violations=page.evaluate('''async points=>{const W=await import('./world.mjs');return points.filter(p=>W.OBSTACLES.some(o=>Math.abs(p.x-o.x)<o.w/2-.01&&Math.abs(p.z-o.z)<o.d/2-.01&&p.y>o.bottom+.01&&p.y<o.bottom+o.h-.01)).length;}''',positions)
  check(violations==0,'The orbiting camera stays outside solid clinic geometry')
  page.screenshot(path=str(OUT/'clinic-camera.png'))
  page.keyboard.press('KeyP');page.wait_for_function('Rainward.mode==="pause"');t=page.evaluate('Rainward.state.t');page.wait_for_timeout(250);check(page.evaluate('Rainward.state.t')==t,'Pausing also freezes the new search and feedback time')
  page.locator('#resume').click();page.set_viewport_size({'width':390,'height':844});page.locator('[data-touch="shoulder"]').wait_for(state='visible');old=page.evaluate('Rainward.view.shoulder');page.locator('[data-touch="shoulder"]').click();page.wait_for_function('(old)=>Rainward.view.shoulder===-old',arg=old);check(True,'Touch players can also swap camera shoulder')
  page.locator('[data-hold="listen"]').hover();page.mouse.down();page.wait_for_function('Rainward.state.player.listen');page.mouse.up();page.wait_for_function('!Rainward.state.player.listen');check(True,'Touch listening engages and releases the real listening state')
  page.screenshot(path=str(OUT/'mobile-stealth.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The added feedback and touch controls fit a phone-width viewport')
  check(not errors,'No uncaught browser errors during the improvement regression')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP/WebGL, public reduced-graphics mode, ordinary inputs and read-only route guidance. No character, camera, AI or completion assignments. Not physical phone/controller certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':page.evaluate('window.Rainward?Rainward.snapshot():null')},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:c.close();b.close()
