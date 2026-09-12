"""Production soundtrack and renderer; emulated controller, real song duration.
Never writes scores, judged notes, game time, chart times or completion state.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-tidal';OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('PRISM_URL','http://127.0.0.1:4173/prism-current/')
LEGACY={'first-light/flow/keys':{'score':2500,'accuracy':75,'best':16},'first-light/flow/ar':{'score':900,'accuracy':60,'best':8}}
PAD=(ROOT/'prism-current/tests/standard-pad.js').read_text()
checks=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
 ctx.add_init_script(PAD)
 ctx.add_init_script("if(!localStorage.getItem('prism-current.v1.records'))localStorage.setItem('prism-current.v1.records',"+json.dumps(json.dumps(LEGACY))+");")
 p=ctx.new_page();p.set_default_timeout(45000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def press(button):
  p.evaluate('(b)=>PrismTestPad.press(b)',button)
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready&&Prism.snapshot().controller')
  p.bring_to_front();p.keyboard.press('Shift')
  check(p.locator('#tracks button').count()==4,'The existing catalog now contains four original tracks')
  p.locator('#scene-wrap').focus()
  for _ in range(4):press(13)
  check(p.locator('[data-track="tidal-bloom"]').evaluate('(e)=>e===document.activeElement'),'Controller focus reaches the fourth track')
  press(0)
  check(p.evaluate('Prism.snapshot().track')=='tidal-bloom','Controller selection loads the new track')
  check(p.locator('#song-journey span').count()==8,'The song journey exposes eight authored sections')
  check('92 notes' in p.locator('#song-stats').inner_text(),'Flow shows its authored note count')
  press(9);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.component.runMode')=='gamepad','The new song starts in the isolated gamepad score category')
  p.wait_for_function("document.getElementById('phrase-name').textContent==='Arrival'")
  check(p.locator('#phrase-name').inner_text()=='Arrival','The opening phrase is shown before the first notes')
  startup_stall=None
  p.wait_for_function("Prism.snapshot().time>2 || Prism.snapshot().phase==='paused'")
  if p.evaluate('Prism.snapshot().phase')=='paused':
   startup_stall=p.evaluate('Prism.component.lastStall || null')
   check(startup_stall is not None and 'Rendering stalled' in p.evaluate('Prism.snapshot().message'),'Any startup pause identifies an actual software-renderer frame gap')
   check(p.evaluate('Object.keys(Prism.component.state.judged).length')==0,'The startup pause occurs before any target judgment')
   p.wait_for_timeout(200)
   check(p.evaluate('Prism.snapshot().phase')=='paused','A startup frame pause does not auto-resume')
   press(9)
   p.wait_for_function("Prism.snapshot().phase==='playing'&&Prism.snapshot().time>2")
  press(9)
  before=p.evaluate('Prism.component.audio.time()');p.wait_for_timeout(350)
  check(abs(p.evaluate('Prism.component.audio.time()')-before)<.001,'Pausing freezes the new soundtrack')
  press(8);check(p.locator('#mixer-panel').is_visible(),'The existing controller mixer remains available')
  press(1);press(9);p.wait_for_function("Prism.snapshot().phase==='playing'")
  p.evaluate('''()=>{const done=new Set(),until={},map=[6,4,5,7];window.tidalDriver=setInterval(()=>{const g=Prism.component;if(g.phase==='complete'){for(const b of map)testPad.buttons[b]={pressed:false,value:0};clearInterval(tidalDriver);return;}if(g.phase!=='playing')return;const t=g.audio.time()+g.runOffset;for(const b of map)if(t>=(until[b]||0))testPad.buttons[b]={pressed:false,value:0};for(const n of g.state.song.notes){if(done.has(n.id)||t<n.time-.055||t>n.time+.10)continue;done.add(n.id);const b=map[n.lane];testPad.buttons[b]={pressed:true,value:1};until[b]=t+.09;}},4)}''')
  p.wait_for_function('Prism.snapshot().state.hits>=4',timeout=20000)
  p.wait_for_function("document.getElementById('phrase-name').textContent==='Glasswater'",timeout=15000)
  check(p.locator('#phrase-next').inner_text().startswith('Next: Gathering'),'The section cue follows the actual audio progression')
  p.wait_for_function("Prism.snapshot().phase==='complete'",timeout=150000)
  r=p.evaluate('Prism.snapshot().state');check(r['complete'] and r['hits']>=83,'A complete unaccelerated Tidal Bloom run scores at least 90% of its notes through controller input')
  check(p.locator('#section-results .section-result').count()==8,'Results report every authored section')
  check('Average absolute timing error' in p.locator('#timing-detail').inner_text(),'Results contain measured hit timing, not placeholder statistics')
  check(p.evaluate('PrismPhrases.summary(Prism.component.state).samples')==r['hits'],'Timing sample count agrees with actual hits')
  check(p.evaluate('Prism.snapshot().scoreRecords["first-light/flow/keys"].score')==2500,'Existing keyboard records survive the new content')
  check(p.evaluate('Prism.snapshot().scoreRecords["first-light/flow/ar"].score')==900,'Existing AR records survive the new content')
  check(p.evaluate('Prism.snapshot().scoreRecords["tidal-bloom/flow/gamepad"].score')==r['score'],'The new record has its own track and input key')
  p.screenshot(path=str(OUT/'tidal-results.png'))
  press(13);press(0);check(p.evaluate('Prism.snapshot().phase')=='menu','Controller navigation leaves the detailed results without a mouse')
  p.locator('[data-track="tidal-bloom"]').click();p.locator('#difficulty').select_option('pulse')
  check('170 notes' in p.locator('#song-stats').inner_text(),'Pulse has its distinct authored chart')
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The expanded song and section menu fits a phone-width viewport')
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready')
  check(p.evaluate('Prism.snapshot().scoreRecords["tidal-bloom/flow/gamepad"].score')==r['score'],'The completed new record survives reload')
  check(not errors,'No uncaught JavaScript errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'result':r,'errors':errors,'startup_software_frame_stall':startup_stall,'scope':'Native Chromium production renderer and 24 kHz synthesized stereo music. Emulated standard pad, one-eighth pixel ratio. Full song at real audio speed. Startup software-renderer pause recovery is tested via Menu if observed and recorded separately. Not a human playtest or physical-device performance claim.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':p.evaluate('window.Prism?.snapshot()'),'focus':p.evaluate('document.activeElement?.outerHTML'),'polls':p.evaluate('window.PrismTestPad?.polls'),'stall':p.evaluate('window.Prism?.component.lastStall || null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
