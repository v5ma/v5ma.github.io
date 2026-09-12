"""First Steps acceptance with the production renderer/audio and emulated input.
No game-state, chart-time, hit-count or audio-clock assignments.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-lessons';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
PAD=(ROOT/'prism-current/tests/standard-pad.js').read_text()
LEGACY={'first-light/flow/keys':{'score':2500,'accuracy':75,'best':16}}
checks=[];errors=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=args)
 ctx=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
 ctx.add_init_script(PAD)
 ctx.add_init_script("if(!localStorage.getItem('prism-current.v1.records'))localStorage.setItem('prism-current.v1.records',"+json.dumps(json.dumps(LEGACY))+");")
 p=ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
 def press(button):p.evaluate('(b)=>PrismTestPad.press(b)',button)
 def focus(id):
  for _ in range(40):
   if p.evaluate('(id)=>document.activeElement?.id===id',id):return
   press(13)
  raise AssertionError('Controller cannot reach '+id)
 def finished():p.wait_for_function("Prism.snapshot().phase==='complete'",timeout=20000)
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready&&Prism.snapshot().controller');p.bring_to_front();p.keyboard.press('Shift')
  check(p.evaluate('Prism.snapshot().phase')=='menu','Lessons never launch automatically')
  focus('input');press(15);press(15);check(p.evaluate('Prism.snapshot().input')=='gamepad','Controller selects timing input for its lesson')
  focus('lesson-start');press(0);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.component.runAudio')=='__prism-lesson__','A lesson uses its own bounded educational soundtrack')
  check(p.locator('#lesson-guide').is_visible(),'Current lesson and input-specific guidance appear during gameplay')
  # Deliberately provide no note inputs: a finished soundtrack is NOT a pass.
  finished();check(not p.evaluate('Prism.snapshot().lessons.verdict.passed'),'Missing every note cannot advance the curriculum')
  check(p.evaluate("localStorage.getItem('prism-current.v1.lessons')") is None,'An unfinished curriculum creates no completion flag')
  check('Retry' in p.locator('#replay').inner_text(),'An unsuccessful exercise clearly offers retry')
  press(0);p.wait_for_function("Prism.snapshot().phase==='playing'");check(p.evaluate('Prism.snapshot().lessons.step')==0,'Retry retains the failed exercise')
  p.evaluate('''()=>{const done=new WeakMap(),until={},map=[6,4,5,7];window.lessonDriver=setInterval(()=>{const g=Prism.component;if(!window.testPad)return;if(g.phase!=='playing'||!g.state?.song.lesson){for(const i of map)testPad.buttons[i]={pressed:false,value:0};return;}let seen=done.get(g.state);if(!seen){seen=new Set();done.set(g.state,seen);}const t=g.audio.time()+g.runOffset;for(const b of map)if(t>=(until[b]||0))testPad.buttons[b]={pressed:false,value:0};for(const n of g.state.song.notes){if(seen.has(n.id)||t<n.time-.055||t>n.time+.1)continue;seen.add(n.id);const b=map[n.lane];testPad.buttons[b]={pressed:true,value:1};until[b]=t+.09;}},4);}''')
  for step in range(4):
   check(p.evaluate('Prism.snapshot().lessons.step')==step,'Exercise '+str(step+1)+' starts in order')
   if step==2:check('not graded' in p.locator('#lesson-instruction').inner_text(),'Timing-mode instructions do not claim to grade sword direction')
   if step==3:
    # An interruption is not deliberate pause evidence.
    p.evaluate('window.testPad=null');p.wait_for_function("Prism.snapshot().phase==='paused'")
    check(not p.evaluate('Prism.snapshot().lessons.proof.paused'),'Disconnection cannot satisfy the pause lesson')
    p.evaluate(PAD);p.wait_for_function('Prism.snapshot().controller');p.wait_for_timeout(150)
    check(p.evaluate('Prism.snapshot().phase')=='paused','Reconnect requires an explicit resume')
    press(9);p.wait_for_function("Prism.snapshot().phase==='playing'")
    press(9);check(p.evaluate('Prism.snapshot().lessons.proof.paused'),'Menu records a deliberate pause')
    t=p.evaluate('Prism.component.audio.time()');p.wait_for_timeout(300)
    check(p.evaluate('Prism.component.audio.time()')==t,'The lesson audio clock is frozen while paused')
    press(9);p.wait_for_function("Prism.snapshot().phase==='playing'")
    check(p.evaluate('Prism.snapshot().lessons.proof.resumed'),'Resume finishes the deliberate pause demonstration')
   finished();check(p.evaluate('Prism.snapshot().lessons.verdict.passed'),'Actual controller connections pass exercise '+str(step+1))
   check(p.evaluate('Prism.snapshot().scoreRecords')==LEGACY,'Exercise '+str(step+1)+' preserves standard song records')
   check(p.evaluate("localStorage.getItem('prism-current.v1.practice')") is None,'Exercise '+str(step+1)+' cannot create practice scores')
   if step<3:
    check(p.evaluate("localStorage.getItem('prism-current.v1.lessons')") is None,'Partial curriculum '+str(step+1)+' is not recorded as complete')
    press(0);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.snapshot().lessons.completed')==['gamepad'],'Only the demonstrated input mode is marked complete')
  check('Play First Light' in p.locator('#replay').inner_text(),'Graduation offers the original full song')
  p.screenshot(path=str(OUT/'lesson-graduation.png'))
  press(0);p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.component.state.song.lesson||null') is None,'Graduation leaves the tutorial chart')
  check(p.evaluate('Prism.component.runAudio')=='first-light','Graduation restores the original full-song audio')
  press(9);focus('back');press(0)
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready')
  check(p.evaluate('Prism.snapshot().lessons.completed')==['gamepad'],'Lesson completion survives reload separately')
  check(p.evaluate('Prism.snapshot().phase')=='menu','Returning players are not forced back into lessons')
  # A keyboard lesson uses ordinary DOM keys and can be abandoned without saving.
  p.locator('#input').select_option('keys');p.locator('#lesson-start').click();p.wait_for_function("Prism.snapshot().phase==='playing'")
  p.evaluate((ROOT/'prism-current/tests/input-driver.js').read_text());p.evaluate('PrismTestInput.keys()');finished()
  check(p.evaluate('Prism.snapshot().lessons.verdict.passed'),'Keyboard input passes its own first exercise')
  press(1);check(p.evaluate('Prism.snapshot().phase')=='menu','B exits a partial lesson without a mouse')
  check(p.evaluate('Prism.snapshot().lessons.completed')==['gamepad'],'Abandoned keyboard curriculum stays incomplete')
  # Actual pointer path through the unchanged swept collision handler.
  p.locator('#input').select_option('slice');p.locator('#lesson-start').click();p.wait_for_function("Prism.snapshot().phase==='playing'&&Prism.snapshot().time>1")
  point=p.evaluate('(()=>{const n=Prism.snapshot().notes[0],v=PrismCore.position(n,n.time),p=new AFRAME.THREE.Vector3(v[0],v[1]+.28,v[2]).project(AFRAME.scenes[0].camera),r=document.getElementById("scene-wrap").getBoundingClientRect();return [r.x+(p.x*.5+.5)*r.width,r.y+(-p.y*.5+.5)*r.height]})()')
  p.mouse.move(*point);p.mouse.down();p.evaluate('PrismTestInput.pointer()');p.mouse.up()
  check(p.evaluate('Prism.snapshot().judged[0]')=='hit','A swept pointer blade earns a real tutorial hit')
  if p.evaluate('Prism.snapshot().phase')=='playing':p.locator('#pause').click()
  p.wait_for_function("Prism.snapshot().phase==='paused'");p.locator('#back').click()
  check(p.evaluate('Prism.snapshot().scoreRecords')==LEGACY,'Pointer teaching never overwrites song records')
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Lesson entry fits a phone-width viewport')
  # Full-resolution rendering capture is separate from reduced-buffer input tests.
  vctx=b.new_context(viewport={'width':1440,'height':1050},device_scale_factor=1)
  v=vctx.new_page();v.on('pageerror',lambda e:errors.append(str(e)));v.goto(URL,wait_until='domcontentloaded');v.wait_for_function('window.Prism?.snapshot().ready')
  v.locator('#lesson-card').scroll_into_view_if_needed();v.screenshot(path=str(OUT/'first-steps-menu.png'));vctx.close()
  check(not errors,'No uncaught browser errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Production renderer/audio in Chromium; emulated controller full curriculum plus native keyboard/pointer handlers. Input drivers read audio time; no score or clock writes. One-eighth gameplay pixel ratio; separate full-resolution menu. Not five human novice playtests or physical Xbox/Quest acceptance.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':p.evaluate('window.Prism?.snapshot()'),'focus':p.evaluate('document.activeElement?.outerHTML'),'stall':p.evaluate('window.Prism?.component.lastStall||null')},indent=2))
  p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
