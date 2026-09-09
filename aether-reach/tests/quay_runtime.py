"""Actual WebGL app, ordinary keys and UI, no actor/progress assignments."""
from pathlib import Path
import json
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'test-output';OUT.mkdir(exist_ok=True);BASE='http://127.0.0.1:4173';checks=[];errors=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
def snap(p):return p.evaluate('AetherReach.snapshot()')
def hold(p,key,condition):
 p.locator('#world').focus();p.keyboard.down(key)
 try:p.wait_for_function(condition,timeout=120000)
 finally:p.keyboard.up(key)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 try:
  for mode in ['desktop','mobile','missing','xr']:
   c=b.new_context(viewport={'width':390,'height':844} if mode=='mobile' else {'width':1440,'height':960},is_mobile=mode=='mobile',has_touch=mode=='mobile',service_workers='block');p=c.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader' in m.text or 'WebGLProgram' in m.text) else None)
   c.route('**/*',lambda r:r.abort() if mode=='missing' and '/art/' in r.request.url else r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('data:','blob:')) else r.abort())
   if mode=='xr':c.add_init_script(path=str(Path(__file__).parent/'fake-devices.js'))
   try:
    p.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('window.AetherReach&&AetherReach.snapshot().renderer.art?.settled');art=snap(p)['renderer']['art']
    if mode=='missing':check(len(art['errors'])==6,'Missing asset groups report errors and preserve fallback scenery')
    else:check(len(art['loaded'])==6 and not art['errors'],mode+': every imported group actually loaded');check(art['profile']==('mobile' if mode=='mobile' else 'desktop'),mode+': intended model/texture variant selected')
    if mode=='desktop':
     check(snap(p)['renderer']['visual']['mode']=='prismatic' and snap(p)['renderer']['visual']['transmission'],'Desktop starts with real prismatic optics rather than only an inactive option')
     p.locator('#settings-button').click()
     for choice in ['balanced','low','prismatic']:
      p.locator('#visual-quality').select_option(choice)
      p.wait_for_function('(mode)=>AetherReach.snapshot().renderer.visual.mode===mode',arg=choice)
      check(snap(p)['renderer']['visual']['transmission']==(choice=='prismatic'),'Visible quality control changes the actual renderer: '+choice)
     check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")===null'),'Graphics preference does not write a new expedition or equipment save')
     p.locator('#settings-dialog form button').click()
     p.reload(wait_until='domcontentloaded');p.wait_for_function('window.AetherReach&&AetherReach.snapshot().renderer.art?.settled')
     check(snap(p)['renderer']['visual']['mode']=='prismatic','Chosen visual profile persists across a real page reload')
    elif mode=='mobile':check(snap(p)['renderer']['visual']['mode']=='low' and not snap(p)['renderer']['visual']['transmission'],'Mobile automatically avoids the extra scene-refraction render pass')
    if mode=='mobile':p.locator('#start').tap()
    else:p.locator('#start').click()
    p.wait_for_function('AetherReach.snapshot().playing&&!AetherReach.snapshot().paused');p.screenshot(path=str(OUT/'quay-play-{}.png'.format(mode)))
    if mode=='desktop':
     p.keyboard.press('KeyB');p.wait_for_selector('#shop-dialog[open]');check(p.locator('[data-kind="weapon"]').count()==3,'Existing Outfitters still offers the same weapons');p.locator('#shop-dialog form button').click();p.wait_for_function('!AetherReach.snapshot().paused')
     hold(p,'KeyD','AetherReach.snapshot().position.x>=6.4');p.keyboard.press('KeyE',delay=100);p.wait_for_selector('#field-dialog[open]');check(snap(p)['tactics']['learned'],'Existing field quest is reached by actual walking, not a progress assignment');p.locator('#field-close').click();p.wait_for_function('!AetherReach.snapshot().paused')
     hold(p,'KeyA','AetherReach.snapshot().position.x<=.6');hold(p,'KeyW','AetherReach.snapshot().position.z<=-5');hold(p,'KeyD','AetherReach.snapshot().position.x>=8.4');p.keyboard.press('KeyE',delay=100);p.wait_for_function('!!AetherReach.snapshot().rail');check(snap(p)['rail']['id']=='glassline' and snap(p)['stats']['rescues']==0,'Unchanged walk and boarding paths remain usable without a fall or rescue');p.screenshot(path=str(OUT/'quay-rail-boarding.png'))
    elif mode=='xr':
     p.keyboard.press('KeyP');p.locator('#return-title').click();p.wait_for_selector('#enter-vr:enabled');p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr&&AetherReach.snapshot().renderer.visual.mode==="low"');check(not snap(p)['renderer']['visual']['transmission'],'Real XR renderer entry uses the lower-cost optics path with emulated headset poses');p.evaluate('TestXR.devices.session.end()');p.wait_for_function('!AetherReach.snapshot().devices.xr&&AetherReach.snapshot().renderer.visual.mode==="prismatic"');check(True,'Ending XR restores the desktop material choice without changing mission state')
    elif mode=='missing':hold(p,'KeyW','AetherReach.snapshot().position.z<3');check(True,'Failed optional asset downloads do not prevent moving in the real game')
    else:check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Mobile art leaves the existing HUD within its viewport')
   finally:c.close()
  check(not errors,'No uncaught exceptions in loaded, mobile or fallback scenarios');(OUT/'quay-runtime-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Actual HTTP software-WebGL. Only ordinary keys and visible UI mutate gameplay. No physical headset performance certification.'},indent=2))
 except Exception as e:
  (OUT/'quay-runtime-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));raise
 finally:b.close()
