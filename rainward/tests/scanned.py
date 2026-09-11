"""Real HTTP/WebGL asset loading, comparison, fallback and scene lifetimes.
No actor, puzzle, AI or game-clock writes. Asset failure is injected only at the
network boundary; successful scenery must come from the committed binary files.
"""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from ui_flow import EXPECTED_VERSION,finish_transition
OUT=Path('test-output/scanned');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];requests=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS',label,flush=True)
def settle(p):p.wait_for_function('window.Rainward&&!Rainward.snapshot().assets.pending',timeout=120000)
def wait(p,q):p.wait_for_function(q,timeout=120000)
def start(p,chapter):
 p.locator('#chapter-select').select_option(chapter);p.locator('#start').click();finish_transition(p,'play');settle(p)
def compare_fields(p):return p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,hp:Rainward.state.player.hp,mag:Rainward.state.player.mag,objectives:{...Rainward.state.objectives},puzzle:Rainward.state.puzzle,taken:[...Rainward.state.taken]})')
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw)
 ctx=browser.new_context(viewport={'width':1280,'height':820},service_workers='block');ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:true,sensitivity:85}))")
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 p=ctx.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None);p.on('dialog',lambda d:d.accept());p.on('request',lambda r:requests.append(r.url))
 try:
  p.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');settle(p);a=p.evaluate('Rainward.snapshot().assets');check(a['errors']==[],f'All eight self-hosted asset groups load: {a["errors"]}');check(a['surfaces']==4 and a['modelVariants']==11,'Four actual scanned surfaces and eleven source-textured model variants are decoded')
  for chapter in ['district','conservatory','terminus']:
   start(p,chapter);check(p.evaluate('Rainward.snapshot().assets.errors.length===0'),'Chapter '+chapter+' receives its own valid asset objects')
   before=compare_fields(p);p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#low').uncheck();p.locator('#scanned').uncheck();check(compare_fields(p)==before,'Disabling enhanced '+chapter+' art preserves the actual game state');p.locator('#resume').click();n=p.evaluate('Rainward.renderer.info.render.frame');p.wait_for_function('(n)=>Rainward.renderer.info.render.frame>=n+3',arg=n);p.screenshot(path=str(OUT/(chapter+'-procedural.png')))
   p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#scanned').check();p.locator('#resume').click();n=p.evaluate('Rainward.renderer.info.render.frame');p.wait_for_function('(n)=>Rainward.renderer.info.render.frame>=n+3',arg=n);p.screenshot(path=str(OUT/(chapter+'-scanned.png')))
   check(p.evaluate('Rainward.snapshot().assets.enabled&&Rainward.snapshot().renderer.scannedMeshes>0'),'Enhanced '+chapter+' view uses real imported scene meshes')
   p.keyboard.press('KeyP');wait(p,'Rainward.mode==="pause"');p.locator('#low').check();p.locator('#to-title').click();finish_transition(p,'title')
  for url in set(requests):
   if '/assets/scanned/' in url:check(requests.count(url)==1,'Tab byte cache fetched '+url.rsplit('/',1)[1]+' only once')
  check(not errors,'No uncaught exceptions after repeated chapter/resource disposal')
  check(not any('Shader Error' in x or 'VALIDATE_STATUS' in x or 'GL_INVALID' in x for x in console),'Full and reduced materials plus glTF models compile without renderer errors')
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Asset status and controls fit a phone-width screen');p.screenshot(path=str(OUT/'phone-title.png'))
  # Explicit missing-resource test in a NEW browser context, not a warmed cache.
  c=browser.new_context(viewport={'width':900,'height':650});c.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true}))")
  def intercept(r):
   if r.request.url.endswith('/stone/color.webp'):r.fulfill(status=404,body='missing test texture')
   elif urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')):r.continue_()
   else:r.abort()
  c.route('**/*',intercept);q=c.new_page();q.on('pageerror',lambda e:errors.append(str(e)));q.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');settle(q);s=q.evaluate('Rainward.snapshot().assets');check(any('stone' in e for e in s['errors']) and s['surfaces']==3,'Missing photo material reports partial loading instead of pretending all assets succeeded');q.locator('#start').click();settle(q);z=q.evaluate('Rainward.state.player.z');q.keyboard.down('KeyW');q.wait_for_function('(z)=>Rainward.state.player.z<z-.5',arg=z);q.keyboard.up('KeyW');check(True,'A missing visual texture leaves the actual game playable with fallback');q.screenshot(path=str(OUT/'partial-asset-fallback.png'));c.close()
  check(not errors,'Missing assets do not cause an uncaught game exception')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':'Native HTTP/WebGL with self-hosted textures and GLB meshes. Normal menu inputs; no gameplay writes. Full and reduced visual captures. Network fault only for isolated fallback. No physical Xbox, phone, Quest or performance certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'state':p.evaluate('window.Rainward?Rainward.snapshot():null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();browser.close()
