"""Native WebGL acceptance for the new render pipeline; ordinary public inputs.
No gameplay state writes. XR hardware boundary is tested separately with model
fixtures; unavailable headsets are reported, not silently faked here."""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from ui_flow import EXPECTED_VERSION,finish_transition
OUT=Path('test-output/cinematic');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS',label,flush=True)
def wait(p,q):p.wait_for_function(q,timeout=120000)
def frames(p,n=4):
 k=p.evaluate('Rainward.renderer.info.render.frame');p.wait_for_function('(k)=>Rainward.renderer.info.render.frame>k',arg=k+n)
def preserved(p):return p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,hp:Rainward.state.player.hp,puzzle:Rainward.state.puzzle,objectives:Rainward.state.objectives,taken:[...Rainward.state.taken]})')
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);ctx=b.new_context(viewport={'width':1280,'height':820},service_workers='block');ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:"classic",low:true,mute:true}))")
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 p=ctx.new_page();p.set_default_timeout(120000);p.on('dialog',lambda d:d.accept());p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 try:
  p.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');wait(p,'window.Rainward');wait(p,'!Rainward.snapshot().assets.pending');
  check(p.evaluate('Rainward.snapshot().version')==EXPECTED_VERSION,'The actual game reports the committed Reclaimed City build')
  for chapter in ['district','conservatory','terminus']:
   p.locator('#chapter-select').select_option(chapter);p.locator('#start').click();finish_transition(p,'play');wait(p,'!Rainward.snapshot().assets.pending');p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');before=preserved(p)
   p.locator('#low').uncheck();p.locator('#cinematic').uncheck();p.locator('#motion').uncheck();p.locator('#resume').click();frames(p);p.screenshot(path=str(OUT/(chapter+'-effects-off.png')))
   p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#cinematic').check();p.locator('#motion').check();p.locator('#resume').click();frames(p,12)
   check(p.evaluate('Rainward.snapshot().visuals.cinema.active'),chapter+' uses the actual HDR/depth post-processing targets')
   check(p.evaluate('Rainward.snapshot().visuals.cinema.renders>0'),chapter+' completes the AO/bloom/composite passes')
   check(preserved(p)==before,chapter+' visual switches preserve position, health, objectives and puzzle progress')
   check(p.evaluate('Rainward.snapshot().assets.errors.length===0'),chapter+' retains all imported CC0 assets')
   p.screenshot(path=str(OUT/(chapter+'-cinematic.png')))
   p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#low').check();p.locator('#resume').click();frames(p)
   check(not p.evaluate('Rainward.snapshot().visuals.cinema.active'),chapter+' bypasses expensive fullscreen effects in Reduced Graphics')
   p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#to-title').click();finish_transition(p,'title')
  # Reach real water in the terminus by holding a key; interaction/game state is not injected.
  p.locator('#start').click();finish_transition(p,'play');p.keyboard.down('KeyW');wait(p,'Rainward.state.player.z<20');p.keyboard.up('KeyW');p.keyboard.down('KeyA');wait(p,'Rainward.state.player.x<-6');p.keyboard.up('KeyA');frames(p,10)
  check(p.evaluate('Rainward.snapshot().visuals.living.rippleCount>0'),'Moving through an actual water footprint produces player-driven ripples')
  p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#low').uncheck();p.locator('#cinematic').check();p.locator('#resume').click();frames(p,10);p.screenshot(path=str(OUT/'water-ripples.png'))
  p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');t=p.evaluate('Rainward.state.t');frames(p,5);check(p.evaluate('Rainward.state.t')==t,'The new frame clock does not advance gameplay while paused')
  p.locator('#motion').uncheck();frames(p);check(not p.evaluate('Rainward.snapshot().visuals.living.motion'),'Environmental motion can be disabled without removing geometry')
  check(p.locator('#xr-start').is_disabled(),'No headset is falsely reported as a usable immersive session')
  check('not available' in p.locator('#xr-status').inner_text(),'The WebXR preview explains unsupported browsers honestly')
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Expanded graphics and WebXR settings fit phone-width UI');p.screenshot(path=str(OUT/'mobile-settings.png'))
  check(not errors,'No uncaught errors during repeated shader/scene/quality changes')
  check(not any('Shader Error' in s or 'VALIDATE_STATUS' in s or 'GL_INVALID' in s for s in console),'All new water, foliage and postprocessing shaders compile in actual WebGL')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':'Actual HTTP/WebGL and public UI inputs; no game-state writes. No physical headset/frame-rate certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'snapshot':p.evaluate('window.Rainward?Rainward.snapshot():null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();b.close()
