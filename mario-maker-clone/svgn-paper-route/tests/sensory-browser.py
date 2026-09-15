"""Actual game, native Web Audio, normal input and explicit storage fault injection.
No position, velocity, wins or progression values are assigned. No mocked audio.
"""
from pathlib import Path
import os,json,subprocess,threading,functools,time
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-sensory'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
BASE=origin+'/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;failure=None;samples={}
PAD="""window.testPad={id:'Acceptance Xbox sample',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad];"""
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script(PAD)
 ctx.add_init_script("""window.audioContextCount=0;window.AudioContext=new Proxy(window.AudioContext,{construct(C,args){window.audioContextCount++;return Reflect.construct(C,args);}});if(!localStorage.getItem('quiet-water-old-save')){localStorage.setItem('quiet-water-old-save','preserve');localStorage.setItem('svgn.skycycle.sunrise.v1',JSON.stringify({marketPilot:true,finishes:3}));localStorage.setItem('sprocket_muted','0');}""")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):page.evaluate('(n)=>new Promise(resolve=>{function step(){if(--n<=0)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);})',n)
 def tap(i):
  frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:true,value:1}',i);frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:false,value:0}',i);frames()
 def seek(target):
  for _ in range(45):
   if page.evaluate('(id)=>document.activeElement?.id===id',target):return
   tap(5)
  raise AssertionError('Controller cannot reach '+target)
 def mix():page.locator('#score-settings').click();page.wait_for_function('document.getElementById("score-dialog").open')
 def done():page.locator('#score-dialog form button').click();page.wait_for_function('!__delivery.paused')
 def slider(id,key):page.locator('#'+id).focus();page.keyboard.press(key)
 try:
  page.goto(BASE+'?destination=tideglass-baths&xr=1',wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('window.SkyCycleSensory && window.SkyCycleFlightDeck && player.onGround && SkyCycleBathhouse.art?.waterDraws>0')
  page.locator('#cv').click();page.wait_for_function('__score.context?.state==="running" && SkyCycleSensory.diagnostics.audio.sources===2')
  check(page.evaluate('audioContextCount===1'),'Bathhouse sound uses exactly the original AudioContext')
  page.wait_for_function('!!__score.source');page.evaluate('window.originalMusic=__score.source')
  check(page.evaluate('__score.desired==="canal" || __score.desired==="morning"'),'Existing instrumental soundtrack retains ownership')
  page.evaluate('''(()=>{const a=__score.context;window.audioAnalyser=a.createAnalyser();audioAnalyser.fftSize=2048;const sink=a.createGain();sink.gain.value=0;__score.effectsBus.connect(audioAnalyser);audioAnalyser.connect(sink);sink.connect(a.destination);window.audioRMS=()=>{const x=new Float32Array(audioAnalyser.fftSize);audioAnalyser.getFloatTimeDomainData(x);return Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);};})()''')
  page.wait_for_function('audioRMS()>1e-5');samples['ambience_rms']=page.evaluate('audioRMS()');check(True,'Native Web Audio produces a non-silent water signal on the real effects bus')
  code=page.evaluate('levelCode()');old=page.evaluate('localStorage.getItem("svgn.skycycle.sunrise.v1")')
  tap(9);page.wait_for_function('__delivery.paused && SkyCycleSensory.diagnostics.audio.sources===0');check(True,'Pausing disposes the ambience sources instead of leaving hidden loops')
  tap(8);page.wait_for_function('document.getElementById("flight-deck").open');seek('fd-audio');tap(0);page.wait_for_function('document.getElementById("score-dialog").open')
  seek('sensory-transients');tap(14);check(page.evaluate('SkyCycleSensory.settings.transients==="gentle"'),'Xbox D-pad directly adjusts effect intensity in the existing sound panel')
  seek('sensory-notices');tap(15);tap(15);check(page.evaluate('SkyCycleSensory.settings.notices==="essential"'),'Xbox chooses Essential only for optional notices')
  seek('sensory-ambience');tap(15);check(page.evaluate('Math.abs(SkyCycleSensory.settings.ambience-.40)<1e-9'),'Xbox adjusts ambience in five-percentage-point steps')
  page.screenshot(path=str(OUT/'comfort-desktop.png'))
  page.set_viewport_size({'width':390,'height':844});frames(6);page.screenshot(path=str(OUT/'comfort-mobile.png'))
  check(page.evaluate('(()=>{const d=document.getElementById("score-dialog"),r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth;})()'),'Sound settings fit a narrow viewport with vertical scrolling and no horizontal overflow')
  page.set_viewport_size({'width':1100,'height':800});tap(1);check(page.evaluate('__delivery.paused && document.getElementById("flight-deck").open && !document.getElementById("score-dialog").open'),'B closes only the sound dialog and keeps the Flight Deck parent paused')
  tap(1);tap(9);page.wait_for_function('!__delivery.paused && SkyCycleSensory.diagnostics.audio.sources===2')
  check(page.evaluate('__score.source===originalMusic && audioContextCount===1'),'Comfort changes neither restart the soundtrack nor create another audio context')
  # Native storage failure injection is confined to the new comfort key, never gameplay.
  mix();page.evaluate("window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='svgn.skycycle.sensory.v1')throw new DOMException('quota test','QuotaExceededError');return originalStorageSet.call(this,k,v);};")
  slider('sensory-ambience','ArrowRight');check(page.evaluate('!SkyCycleSensory.saveOK && document.getElementById("sensory-save").textContent.includes("session only")'),'A blocked comfort save is visibly session-only and does not clear older records')
  page.evaluate('Storage.prototype.setItem=originalStorageSet');slider('sensory-ambience','ArrowLeft');check(page.evaluate('SkyCycleSensory.saveOK'),'A later successful preference write restores honest save status')
  slider('score-effects','Home');done();page.wait_for_function('SkyCycleSensory.diagnostics.audio.sources===0 && audioRMS()<1e-6');check(page.evaluate('__score.source===originalMusic'),'Effects-only mute silences the water bus without stopping or replacing music')
  mix();slider('score-effects','End');slider('score-music','Home');done();page.wait_for_function('SkyCycleSensory.diagnostics.audio.sources===2 && audioRMS()>1e-5');check(page.evaluate('__score.prefs.music===0 && __score.prefs.effects===1'),'Music-only mute leaves independently controlled water effects available')
  mix();page.locator('#score-mute').check();done();page.wait_for_function('SkyCycleSensory.diagnostics.audio.sources===0 && __score.effectVoices===0');check(page.evaluate('muted && !__score.source'),'Master mute clears ambience, transient voices and music playback')
  mix();page.locator('#score-mute').uncheck();done();page.locator('#cv').click();page.wait_for_function('SkyCycleSensory.diagnostics.audio.sources===2')
  # Clear optional density remains essential-only; the actual sluice still works and cues once.
  if page.evaluate('__delivery.state.view')!='2d':page.locator('#delivery-header [data-delivery="view"]').click()
  page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=1710 && player.onGround');page.keyboard.up('KeyD')
  tap(13);page.wait_for_function('SkyCycleBathhouse.state.opened');page.wait_for_function('SkyCycleBathhouse.state.drain===150')
  events=page.evaluate('SkyCycleSensory.diagnostics.events');check(events['sluice']==1 and events['waterline']==1,'Actual sluice and rail reveal emit one cue each from real simulation transitions')
  tap(13);frames(10);check(page.evaluate('SkyCycleSensory.diagnostics.events')==events,'Repeated interaction and observation do not replay completed water cues')
  check(page.evaluate('SkyCycleSensory.diagnostics.notices.suppressed>=2'),'Essential-only suppresses the real optional sluice and reveal pop-ups')
  check(page.evaluate('levelCode()')==code,'Sound and sluice observation leave the authored source document unchanged')
  # Browser focus loss must leave no ambience; returning stays paused until explicitly resumed.
  other=ctx.new_page();other.goto('about:blank');other.bring_to_front();page.wait_for_timeout(500);page.bring_to_front();page.wait_for_function('__delivery.paused && SkyCycleSensory.diagnostics.audio.sources===0');other.close();check(True,'Background/focus loss releases ambient ownership and leaves a safe paused game')
  page.locator('#bathhouse-open').click();page.locator('#bathhouse-return').click();page.wait_for_function('__delivery.state.route===4 && !won');check(page.evaluate('SkyCycleSensory.diagnostics.audio.sources===0'),'Portal travel to Sunrise removes all bathhouse audio sources')
  check(page.evaluate('localStorage.getItem("svgn.skycycle.sunrise.v1")')==old and page.evaluate('localStorage.getItem("quiet-water-old-save")==="preserve"'),'Existing chapter records and unrelated storage survive every comfort operation and portal travel')
  expected=page.evaluate('SkyCycleSensory.settings');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SkyCycleSensory && __delivery.state.route===7');check(page.evaluate('SkyCycleSensory.settings')==expected,'Comfort preferences survive a real reload in their own namespace')
  check(page.evaluate('DeliveryCampaign.routes.length===8 && DeliveryCampaign.routes[4].id==="first-neighborhood" && DeliveryCampaign.routes[7].id==="tideglass-baths"'),'All eight route identities remain intact')
  check(not errors,'No uncaught exceptions in the native audio and controller flows')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'));samples['failure_state']=page.evaluate('({sensory:window.SkyCycleSensory?.diagnostics,prefs:window.SkyCycleSensory?.settings,score:{context:window.__score?.context?.state,desired:window.__score?.desired,effects:window.__score?.prefs},paused:window.__delivery?.paused,mode:typeof mode!=="undefined"?mode:null})')
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'samples':samples,'origin':origin,'coverage':'Real game, real native Web Audio with analyser, ordinary inputs, sampled Xbox Gamepad and explicit new-key quota injection. No physics/win/progression assignments. Not physical audio listening or device qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
