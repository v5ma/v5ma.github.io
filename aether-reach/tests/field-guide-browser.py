"""Full application with ordinary UI/Touch/hand input and read-only observations.
No writes to player, inventory, health, mission, save or clock. Not hardware QA.
"""
import json,os,base64,struct
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];shader=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport={'width':960,'height':640},device_scale_factor=1,service_workers='block')
 ctx.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));ctx.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
 ctx.add_init_script('''navigator.xr.isSessionSupported=async m=>['immersive-vr','immersive-ar'].includes(m);const req=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(m,o)=>{const s=await req(m,o);s.environmentBlendMode=m==='immersive-ar'?'alpha-blend':'opaque';s.inputSources.forEach(i=>i.gamepad.buttons=i.gamepad.buttons.slice(0,6));const raf=s.requestAnimationFrame.bind(s);s.requestAnimationFrame=fn=>raf((t,f)=>{fn(t,f);const g=window.AetherReach?.snapshot()?.devices?.presentation?.fieldGuide;if(!TestXR.noticeCanvas&&g?.notice?.startsWith('IONA:')&&g.noticeAlpha>0)TestXR.noticeCanvas=document.getElementById('world').toDataURL('image/png');if(TestXR.captureCanvas){const done=TestXR.captureCanvas;TestXR.captureCanvas=null;done(document.getElementById('world').toDataURL('image/png'));}});return s;};''')
 p=ctx.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(s in m.text for s in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def guide():return snap()['devices']['presentation']['fieldGuide']
 def work():return snap()['devices']['presentation']['workspace']
 def frames(n=3):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
 def settled():p.wait_for_function('AetherReach.snapshot().devices.presentation.workspace.progress>.995')
 def capture(name):
  # Read after the real XR draw, not a DOM screenshot obscured by accessible dialogs.
  data=p.evaluate("()=>new Promise(resolve=>{TestXR.captureCanvas=resolve;})")
  raw=base64.b64decode(data.split(',',1)[1]);assert raw[:8]==b'\x89PNG\r\n\x1a\n' and len(raw)>2000
  (OUT/name).write_bytes(raw)
  check(struct.unpack('>II',raw[16:24])==(960,640),'Actual stereo WebGL canvas capture: '+name)

 def tap(side,i):
  p.evaluate('([s,i])=>TestXR.button(s,i,true)',[side,i]);frames(2);p.evaluate('([s,i])=>TestXR.button(s,i,false)',[side,i]);frames(2)
 def pin(x,y,side='right'):
  settled();p.evaluate('([s,x,y])=>{TestXR.point(s,x,y);TestXR.pinch(s,false)}',[side,x,y]);frames(2);p.evaluate('s=>TestXR.pinch(s,true)',side);frames(2);p.evaluate('s=>TestXR.pinch(s,false)',side);frames(2)
 def indices(selector):return p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,textarea,a[href],summary')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getAttribute('aria-disabled')!=='true'&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');return [a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',selector)
 def choose(selector):
  for _ in range(12):
   active,target=indices(selector);assert target>=0,selector
   if active//5==target//5:pin(450,315+(target%5)*60);return
   pin(180 if active//5>target//5 else 500,633)
  raise AssertionError('Unreachable menu item '+selector)
 try:
  url=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/'
  p.goto(url);p.wait_for_function('!!window.AetherReach');p.locator('#settings-button').click();p.locator('#visual-quality').select_option('low');p.locator('#sound').uncheck();p.locator('#sound').check();check(not errors,'Sound can be re-enabled without the old undefined-function error');p.locator('#settings-dialog form button').click()
  p.locator('#presentation-button').click();p.locator('#xr-presentation').select_option('diorama-ar');p.locator('#presentation-back').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(5)
  g=guide();s=snap();version=json.loads((ROOT/'aether-reach/release.json').read_text())['version']
  check(p.evaluate('AetherReach.version')==version,'Actual application is the requested Field Guide revision')
  check(g['visible'] and g['liveMap'] and not g['headLocked'] and not g['interactive'],'Live floor map starts visible in the XR scene, never a head panel or input blocker')
  check(g['goal']['id']=='dispatch-board' and 'Iona' in g['nextStep'],'First next step names the actual noticeboard before a player buys anything')
  check(abs(s['devices']['presentation']['heightMeters']-2.625)<1e-8 and abs(s['devices']['presentation']['widthMeters']-1.8)<1e-8,'Default world window is 2.5 times taller without changing its footprint')
  p.evaluate('TestXR.devices.headPitch=-1.15');frames(5);capture('field-guide-initial-floor-canvas.png')
  anchor=guide()['anchor'];actor=snap()['position'];p.evaluate('TestXR.devices.headX=.17;TestXR.devices.headRoll=.3;TestXR.devices.headPitch=-.9');frames(4)
  check(guide()['anchor']==anchor,'Leaning and rolling the headset do not move the floor map or message anchor')
  now=snap()['position'];check(abs(now['x']-actor['x'])+abs(now['z']-actor['z'])+abs(now['yaw']-actor['yaw'])<1e-6,'Looking down or rolling the headset does not steer the character')
  capture('field-guide-rolled-floor-canvas.png');p.evaluate('TestXR.devices.headX=0;TestXR.devices.headRoll=0;TestXR.devices.headPitch=0');frames(2)
  # Walk the real unobstructed opening to Iona; never assign player coordinates.
  start=guide()['player'];paints=guide()['mapPaints'];p.evaluate('TestXR.axes("left",[0,0,.64,-.77])')
  p.wait_for_function('AetherReach.snapshot().interactionId==="dispatch-board"',timeout=90000)
  p.evaluate('TestXR.axes("left",[0,0,0,0])');frames(3)
  g=guide();check(g['mapPaints']>paints and g['player']!=start,'Map refreshes from real thumbstick locomotion without opening a paused atlas')
  check(g['interactionId']=='dispatch-board' and g['interaction'].startswith('Right grip /'),'Reachable noticeboard has a visible current-controller interaction prompt')
  check(g['goal']['distance']<s['devices']['presentation']['fieldGuide']['goal']['distance'],'Goal distance decreases along the actual approach')
  # Observe notices on actual render frames. This observer reads snapshots only.
  p.evaluate("""()=>{window.guideSamples=[];const stop=performance.now()+120000;function sample(){const g=AetherReach.snapshot().devices.presentation.fieldGuide;guideSamples.push({id:g.noticeId,age:g.noticeAge,alpha:g.noticeAlpha,text:g.notice});if(performance.now()<stop&&!(g.notice&&g.notice.startsWith('IONA:')&&g.noticeAge>=2300))requestAnimationFrame(sample);}requestAnimationFrame(sample);}""")
  p.evaluate('TestXR.devices.headPitch=-1.15');frames(2)
  tap('right',1);p.wait_for_function('AetherReach.snapshot().devices.menu==="expedition-dialog"');frames(2)
  check(snap()['expedition']['flags'].count('dispatch-started')==1,'Ordinary right-grip use really accepts the dispatch once')
  check(guide()['goal']['id']=='market-board' and 'west' in guide()['nextStep'],'Persistent guidance updates to the actual delivery destination')
  check('IONA:' in p.locator('#expedition-summary').inner_text() and 'long stair' in p.locator('#expedition-summary').inner_text(),'Auto-opened journal foregrounds the interaction message rather than only completion counts')
  p.wait_for_function('AetherReach.snapshot().devices.presentation.fieldGuide.noticeAge>=2100');frames(2)
  samples=p.evaluate('guideSamples');check(any(x['alpha']>0 and 'IONA:' in x['text'] for x in samples),'The real noticeboard event reaches rendered floor-message feedback')
  notice_image=p.evaluate('TestXR.noticeCanvas');check(bool(notice_image),'The notice has an actual post-render canvas capture, not only a status value')
  (OUT/'field-guide-notice-canvas.png').write_bytes(base64.b64decode(notice_image.split(',',1)[1]))
  p.evaluate('TestXR.devices.headPitch=0');frames(2)
  check(guide()['noticeAlpha']==0,'Floor message is gone after two wall-clock seconds, including while the journal pauses the game')
  check(guide()['liveMap'] and 'west' in guide()['nextStep'],'Message fade does not erase the live map or the next action')
  original_save=p.evaluate('localStorage.getItem("aether-reach.expedition.v1")');check(original_save is not None,'Actual interaction saved progress without test-written storage')
  p.evaluate('TestXR.useHands()');frames(4)
  choose('#journal-story');check(snap()['devices']['menu']=='story-dialog','Story opens in the existing spatial menu through an actual hand pinch')
  check('Why this assignment matters' in p.locator('#story-title').inner_text(),'Story opens on the currently tracked assignment instead of a forced cutscene')
  check(len(p.locator('#story-copy').inner_text())<=270,'The story page fits the spatial description without silent truncation')
  choose('#story-chapters');check(snap()['devices']['menu']=='story-index-dialog','Hand UI reaches a direct chapter index')
  check(p.locator('[data-story-id="dispatch-taken"]').count()==1 and p.locator('[data-story-id="dispatch-delivered"]').count()==0,'Only the accepted dispatch is unlocked, not its unearned delivery ending')
  choose('[data-story-id="dispatch-taken"]');check(snap()['devices']['menu']=='story-dialog' and 'IONA:' in p.locator('#story-copy').inner_text(),'Selecting an earned chapter returns to its actual readable text')
  cw=snap()['renderer']['currentworks'];check(cw['ready'] and cw['active'] and not cw['error'],'Currentworks is prepared and active in the actual AR story journey');check(cw['xr'] and all(w['quality']=='light' for w in cw['water']),'AR uses bounded water detail with the same gameplay state');
  before_cw=cw['time'];frames(3);check(snap()['renderer']['currentworks']['time']==before_cw,'Reading the story pauses Currentworks decorative time as well as gameplay');
  drawn=work()['panelDraws'];frames(2);check(work()['panelDraws']>drawn,'Story text panel is actually drawn in the stereo eye views, not only present in the DOM')
  capture('story-dispatch-hand-canvas.png')
  first=p.locator('#story-copy').inner_text();choose('#story-next-page');check(p.locator('#story-copy').inner_text()!=first,'Hand-operated text pagination reveals the remainder of the narrative')
  check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==original_save,'Reading, chapter selection and pagination do not write the expedition save')
  pin(830,633);check(snap()['devices']['menu']=='expedition-dialog' and snap()['paused'],'Back returns from Story to the paused journal without starting combat')
  pin(830,633);p.wait_for_function('!AetherReach.snapshot().paused');p.evaluate('TestXR.useControllers();TestXR.devices.rays={}');frames(3)
  tap('left',5);settled();p.evaluate('TestXR.useHands()');frames(3);choose('#pause-field-guide')
  check(snap()['devices']['menu']=='field-guide-dialog','What do I do? is reachable through actual hand-operated first-page pause controls')
  check('west' in p.locator('#field-guide-copy').inner_text(),'Help opens with the current actionable next step')
  choose('#field-guide-older');check('IONA:' in p.locator('#field-guide-copy').inner_text(),'Expired interaction message can be reread in the full message history')
  choose('#field-guide-size');check(snap()['devices']['menu']=='workspace-dialog','History/help provides a reachable menu and map sizing path')
  before=work()['config']['scale'];choose('#workspace-scale');pin(500,691);check(work()['config']['scale']>before,'Menu can be made larger with the actual hand-operated slider')
  before=work()['config']['mapScale'];choose('#workspace-mapScale');pin(500,691);frames(2);check(guide()['mapScale']>before,'Live map size adjusts independently of the game-world aperture')
  before=guide()['anchor']['y'];choose('#workspace-floorHeight');pin(500,691);frames(2);check(guide()['anchor']['y']>before,'Floor guide can be raised for seated reading without moving the diorama')
  choose('#workspace-map');frames(2);check(not guide()['liveMap'],'Optional map hiding removes its mesh from view')
  choose('#workspace-map');frames(2);check(guide()['liveMap'],'Map can be restored through the same visible setting')
  pin(830,633);choose('#field-guide-window');check(snap()['devices']['menu']=='presentation-dialog','Help reaches the separate diorama size and height controls')
  before=snap()['devices']['presentation']['boxHeight'];choose('#diorama-boxHeight');pin(500,691);frames(2);check(snap()['devices']['presentation']['boxHeight']>before,'Actual spatial control raises the aperture height independently')
  before=snap()['devices']['presentation']['scale'];choose('#diorama-scale');pin(180,691);frames(2);check(snap()['devices']['presentation']['scale']<before,'Actual spatial control makes the diorama smaller while preserving the height choice')
  check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==original_save,'Reading and resizing never overwrite earned mission state')
  config=work()['config'];box=snap()['devices']['presentation']['boxHeight'];scale=snap()['devices']['presentation']['scale']
  pin(830,633);choose('#field-guide-recall');frames(2);capture('field-guide-help-canvas.png');pin(830,633);choose('#resume');frames(3)
  check(work()['interactiveButtons']==0 and not snap()['paused'],'Closing help and rotunda leaves no invisible menu targets blocking play')
  p.evaluate('TestXR.useControllers();TestXR.devices.rays={};TestXR.devices.headPitch=-1.15');frames(3);capture('field-guide-delivery-floor-canvas.png')
  p.evaluate('TestXR.devices.headPitch=0');tap('left',5);settled();p.evaluate('TestXR.useHands()');frames(3);pin(830,691);p.wait_for_function('!AetherReach.snapshot().devices.xr')
  check(not guide()['visible'],'Exiting XR removes the floor stage')
  p.reload();p.wait_for_function('!!window.AetherReach');check(work()['config']==config,'Menu and floor-map settings survive reload in their existing preference namespace')
  p.locator('#start-story').click();p.locator('#story-chapters').click()
  check(p.locator('[data-story-id="dispatch-taken"]').count()==1,'Title-screen Story reconstructs the earned chapter from the existing save after reload')
  check(p.locator('[data-story-id="open-sky"]').count()==0,'Continuing does not invent the campaign ending')
  p.locator('#story-index-back').click();p.locator('#story-back').click()
  p.locator('#presentation-button').click();p.locator('#xr-presentation').select_option('first-person-ar');p.locator('#presentation-back').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(4)
  check(snap()['expedition']['flags'].count('dispatch-started')==1,'Continue in first-person AR preserves the real accepted dispatch')
  check(guide()['liveMap'] and guide()['goal']['id']=='market-board','Live map and next step also operate in first-person AR window mode')
  check(snap()['devices']['presentation']['boxHeight']==box and snap()['devices']['presentation']['scale']==scale,'Diorama height and size preferences survive mode change and reload')
  p.evaluate('TestXR.devices.headPitch=-1.15');frames(3);capture('field-guide-first-person-floor-canvas.png')
  check(not errors and not shader,'No application or shader errors in the new actual-input guidance journey')
  (OUT/'field-guide-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'noticeSamples':samples,'scope':'Real HTTP/HTTPS game using ordinary UI, Touch and tracked-hand test input. Real approach, dispatch event and saved continuation; no actor/progression/clock assignments. Actual post-render stereo canvas captures. Not physical Quest/Xbox or unfamiliar-player approval.'},indent=2))
 except Exception as e:
  try:s=snap()
  except Exception:s=None
  (OUT/'field-guide-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'snapshot':s},indent=2))
  try:p.screenshot(path=str(OUT/'field-guide-browser-failure.png'))
  except Exception:pass
  raise
 finally:ctx.close();b.close()
