"""Real song/renderer/audio; emulated standard controller, no score/clock writes."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-practice';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
PAD=(ROOT/'prism-current/tests/standard-pad.js').read_text()
LEGACY={'first-light/flow/keys':{'score':2500,'accuracy':75,'best':16},'tidal-bloom/flow/gamepad':{'score':4400,'accuracy':65,'best':18}}
checks=[];errors=[]
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
 ctx.add_init_script(PAD);ctx.add_init_script("if(!localStorage.getItem('prism-current.v1.records'))localStorage.setItem('prism-current.v1.records',"+json.dumps(json.dumps(LEGACY))+");")
 p=ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
 def press(button):p.evaluate('(b)=>PrismTestPad.press(b)',button)
 def focus(id):
  for _ in range(35):
   if p.evaluate('(id)=>document.activeElement?.id===id',id):return
   press(13)
  raise AssertionError('Controller could not reach '+id)
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready&&Prism.snapshot().controller');p.bring_to_front();p.keyboard.press('Shift')
  p.locator('#scene-wrap').focus()
  for _ in range(4):press(13)
  press(0);check(p.evaluate('Prism.snapshot().track')=='tidal-bloom','Controller selects Tidal Bloom')
  focus('session-mode');press(15);check(p.locator('#practice-options').is_visible(),'Controller opens section rehearsal without a mouse')
  check(p.locator('#practice-section option').count()==8,'All eight playable Tidal sections are selectable')
  focus('practice-speed');press(14);check(p.locator('#practice-speed').input_value()=='0.6','Controller adjusts speed to 60%');press(15)
  focus('practice-repeat');press(0);check(p.locator('#practice-repeat').is_checked(),'Automatic repetition requires explicit selection')
  focus('practice-clicks');press(0);check(not p.locator('#practice-clicks').is_checked(),'Controller can disable count-in clicks');press(0)
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Expanded practice controls fit a phone-width viewport');p.set_viewport_size({'width':1280,'height':1000})
  p.screenshot(path=str(OUT/'practice-settings.png'))
  press(9);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.snapshot().practice.active.speed')==.75,'The run uses the chosen 75% rehearsal speed')
  check(p.evaluate('Prism.component.runAudio')=='__prism-practice__','Playback uses the derived section soundtrack')
  check(p.evaluate('Prism.component.audio.cache.get(Prism.component.runAudio).sampleRate')==18000,'24 kHz source plays at 18 kHz for 75% pace and lower pitch')
  check(p.evaluate('Prism.snapshot().notes.length')==2,'Only Arrival targets enter this practice run')
  check(p.locator('#practice-ribbon').is_visible(),'Gameplay labels practice, section and speed')
  press(9);before=p.evaluate('Prism.component.audio.time()');p.wait_for_timeout(300);check(abs(p.evaluate('Prism.component.audio.time()')-before)<.001,'Pause freezes the cropped soundtrack and count-in')
  press(8);check(p.locator('#mixer-panel').is_visible(),'The existing mixer remains controller-accessible in practice');press(1);check(p.evaluate('Prism.snapshot().phase')=='paused','Closing the mixer leaves practice paused');press(9)
  p.evaluate('''()=>{const runs=new WeakMap(),until={},map=[6,4,5,7];window.practiceDriver=setInterval(()=>{const g=Prism.component;if(g.phase!=='playing'){for(const b of map)testPad&&(testPad.buttons[b]={pressed:false,value:0});return;}if(!g.state.song.practice)return;let done=runs.get(g.state);if(!done){done=new Set();runs.set(g.state,done);}const t=g.audio.time()+g.runOffset;for(const b of map)if(t>=(until[b]||0))testPad.buttons[b]={pressed:false,value:0};for(const n of g.state.song.notes){if(done.has(n.id)||t<n.time-.055||t>n.time+.1)continue;done.add(n.id);const b=map[n.lane];testPad.buttons[b]={pressed:true,value:1};until[b]=t+.09;}},4)}''')
  p.wait_for_function("Prism.snapshot().phase==='complete'",timeout=30000)
  check(p.evaluate('Prism.snapshot().state.hits')==2,'An unaccelerated practice pass scores both notes through controller input')
  check(p.evaluate('Prism.snapshot().scoreRecords')==LEGACY,'Practice completion leaves all standard records unchanged')
  check(p.evaluate('Object.values(Prism.snapshot().practice.records)[0].passes')==1,'Practice uses its own persisted completion counter')
  check(p.evaluate('Prism.snapshot().practice.pendingRepeat'),'Opted-in repetition is armed only after completion')
  p.screenshot(path=str(OUT/'practice-result.png'))
  p.wait_for_function("Prism.snapshot().phase==='playing'&&Prism.snapshot().practice.attempt===2",timeout=20000)
  check(p.evaluate('Prism.snapshot().state.hits')==0,'Repeating starts a new count-in with cleared run judgments')
  p.evaluate('window.testPad=null');p.wait_for_function("Prism.snapshot().phase==='paused'")
  check('disconnected' in p.evaluate('Prism.snapshot().message'),'Controller disconnect pauses practice')
  p.evaluate(PAD);p.wait_for_function('Prism.snapshot().controller');p.wait_for_timeout(200);check(p.evaluate('Prism.snapshot().phase')=='paused','Reconnect never automatically resumes practice');press(9)
  p.wait_for_function("Prism.snapshot().phase==='complete'",timeout=30000)
  check(p.evaluate('Object.values(Prism.snapshot().practice.records)[0].passes')==2,'Second completed pass updates only practice history')
  press(13);p.wait_for_timeout(5400);check(p.evaluate('Prism.snapshot().phase')=='complete' and not p.evaluate('Prism.snapshot().practice.pendingRepeat'),'Any controller interaction cancels the repeat countdown')
  focus('practice-full-song');press(0);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.component.state.song.practice || null') is None,'Return-to-song starts the original full chart')
  check(p.evaluate('Prism.component.runAudio')=='tidal-bloom','Return-to-song restores original-speed full audio')
  press(9);focus('back');press(0);check(p.evaluate('Prism.snapshot().phase')=='menu','Controller exits the partial full-song run')
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready')
  check(p.evaluate('Prism.snapshot().scoreRecords')==LEGACY,'Standard saves remain byte-equivalent after practice and reload')
  check(p.evaluate('Object.values(Prism.snapshot().practice.records)[0].passes')==2,'Practice history survives reload')
  check(p.evaluate('Prism.snapshot().practice.mode')=='full','A fresh page defaults to full-song mode, not an accidental rehearsal')
  check(not errors,'No uncaught browser errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'practice':p.evaluate('Prism.snapshot().practice'),'scope':'Native Chromium with production WebGL and audible derived stereo soundtrack. Emulated gamepad; one-eighth rendering ratio. Two real-time 75% practice passes, no clock or score writes. Not physical Xbox/Quest testing.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':p.evaluate('window.Prism?.snapshot()'),'focus':p.evaluate('document.activeElement?.outerHTML'),'stall':p.evaluate('window.Prism?.component.lastStall||null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
