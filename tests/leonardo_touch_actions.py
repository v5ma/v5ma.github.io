"""Independent ordinary-touch action and lifecycle acceptance, without state writes."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json,os
OUT=Path('guild-action-evidence');OUT.mkdir(exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=b.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1,service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(60000);cdp=ctx.new_cdp_session(page);page.on('pageerror',lambda e:errors.append(str(e)))
 def read():return page.evaluate('LeonardoGuild.inspect()')
 def ticks(n=4):
  t=read()['steps'];page.wait_for_function('(t)=>LeonardoGuild.inspect().steps>=t',arg=t+n,timeout=20000)
 def check(ok,label):
  assert ok,label
  checks.append(label);print('PASS',label,flush=True)
 def point(id,xy):return {'id':id,'x':xy[0],'y':xy[1],'radiusX':6,'radiusY':6,'force':1}
 def center(sel):
  r=page.locator(sel).bounding_box();return [r['x']+r['width']/2,r['y']+r['height']/2]
 def fingers(kind,*pts):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':list(pts)})
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.locator('#start').tap();ticks()
  page.locator('#touch-ride').tap();page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');ticks()
  check(page.locator('[data-action="attack"]').is_visible() and page.locator('[data-hold="guard"]').is_visible(),'Dismounting with touch reveals the staff and brace controls')
  check(len([e for e in read()['events'] if e['type']=='exit'])==1,'One tap dismounts once without a duplicate click remount')
  guard=center('[data-hold="guard"]');staff=center('[data-action="attack"]')
  fingers('touchStart',point(1,guard));ticks();fingers('touchStart',point(1,guard),point(2,staff));ticks()
  check(read()['guarding'] and any(e['type']=='swing' for e in read()['events']),'Two actual fingers can brace and swing the staff together')
  fingers('touchEnd',point(1,guard));ticks();check(read()['guarding'],'Releasing the staff finger does not cancel the brace finger')
  fingers('touchEnd');ticks();check(not read()['guarding'] and read()['input']['buttons']==0,'Lifting the brace finger releases defense')
  page.locator('[data-action="jump"]').tap();ticks();check(read()['lift']>0,'The touch Hop button jumps in the real world')
  page.wait_for_function('LeonardoGuild.inspect().lift===0')
  stick=center('#move-stick');r=page.locator('#move-stick').bounding_box()['width']*.31
  z=read()['z'];fingers('touchStart',point(3,[stick[0],stick[1]-r*.5]));ticks(12);fingers('touchEnd');ticks()
  check(read()['z']>z,'The same analogue joystick walks the dismounted apprentice')
  page.locator('#touch-ride').tap();page.wait_for_function('LeonardoGuild.inspect().mode==="bike"');ticks()
  check(page.locator('[data-action="attack"]').is_hidden(),'Remounting restores the bicycle action layout')
  inspect=center('[data-hold="hack"]');fingers('touchStart',point(4,inspect));ticks();fingers('touchEnd');check(read()['scan']>0,'Inspect combines the real scanning action with the held use control')
  # Rotation while a finger is held must not carry an obsolete axis into the new layout.
  stick=center('#move-stick');fingers('touchStart',point(5,[stick[0],stick[1]-r*.4]));ticks(4);page.set_viewport_size({'width':390,'height':844});ticks()
  check(read()['input']['pointer'] is None and read()['input']['axes']['strength']==0,'Device rotation clears a held joystick before the layout changes')
  fingers('touchEnd');page.locator('#pause-button').tap();page.wait_for_function('LeonardoGuild.inspect().paused');page.screenshot(path=str(OUT/'touch-actions-portrait.png'));page.locator('#resume').tap();page.wait_for_function('!LeonardoGuild.inspect().paused')
  # Tap accessibility buttons through their visible interface, not DOM dispatch.
  page.locator('#mission-toggle').tap();check(page.locator('#mission-description').is_visible(),'Mobile mission details remain accessible behind the collapse control')
  page.locator('#mission-toggle').tap();check(page.locator('#mission-description').is_hidden(),'Mission details collapse again to recover play space')
  check(not errors,'No uncaught errors in touch action and orientation checks')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native Chromium touch input on HTTP/software WebGL. No player, save, quest or clock assignment. Not a hardware-phone benchmark.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();b.close()
