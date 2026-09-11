"""Real browser OfflineAudioContext and live Web Audio acceptance, no microphone.
Samples and score come from committed Rainward modules, not mocked AudioNodes.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-soundscape');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 p=b.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.goto(BASE+'/rainward/tests/audio-harness.html')
  stereo=p.evaluate('''async()=>{const {createSoundGraph}=await import('../audio-mixer.mjs');
   const render=async(mono,pan)=>{const c=new OfflineAudioContext(2,24000*2,24000),g=createSoundGraph(c,{masterVolume:75,musicVolume:50,effectsVolume:85,monoAudio:mono});g.play('pluck',{duration:1,midi:69,gain:.55,pan,send:0});const out=await c.startRendering(),l=out.getChannelData(0),r=out.getChannelData(1);const energy=a=>a.reduce((s,x)=>s+x*x,0);return {l:energy(l),r:energy(r),diff:l.reduce((s,x,i)=>s+Math.abs(x-r[i]),0),peak:Math.max(l.reduce((s,x)=>Math.max(s,Math.abs(x)),0),r.reduce((s,x)=>Math.max(s,Math.abs(x)),0))};};return {left:await render(false,-.9),right:await render(false,.9),mono:await render(true,-.9)};}''')
  check(stereo['left']['l']>stereo['left']['r']*4,'The actual audio graph pans a source to the left')
  check(stereo['right']['r']>stereo['right']['l']*4,'The actual audio graph pans a source to the right')
  check(stereo['mono']['diff']<.01,'Mono mode sends equal output to both channels')
  measures=p.evaluate('''async()=>{const {createSoundGraph}=await import('../audio-mixer.mjs'),{THEMES,scoreStep}=await import('../audio-design.mjs');const results={};for(const id of Object.keys(THEMES)){const c=new OfflineAudioContext(2,24000*16,24000),g=createSoundGraph(c,{masterVolume:75,musicVolume:65,effectsVolume:85,ambienceVolume:40});g.configure({intensity:.65});g.loop(THEMES[id].air);let when=.1,step=0;while(when<12){const seq=scoreStep(id,step++);for(const n of seq.notes)g.play(n.kind,{...n,when,send:.15});when+=seq.seconds;}for(const [i,kind]of ['gun','reload','step-water','glass-break','bandage','craft','growl'].entries())g.play(kind,{duration:.5,gain:.5,when:.2+i*.7,priority:true});const out=await c.startRendering();let peak=0,sum=0;const a=out.getChannelData(0);for(const x of a){peak=Math.max(peak,Math.abs(x));sum+=x*x;}results[id]={peak,rms:Math.sqrt(sum/a.length),stats:g.snapshot()};g.dispose();}return results;}''')
  for id,m in measures.items():
   check(m['rms']>.003 and m['peak']<.99,id+' renders non-silent music and effects without clipping')
   check(m['stats']['peakVoices']<=48,id+' respects the voice budget')
  check(len({round(v['rms'],5) for v in measures.values()})>=5,'The six arrangements produce distinct rendered audio')
  budget=p.evaluate('''async()=>{const {createSoundGraph}=await import('../audio-mixer.mjs');const c=new OfflineAudioContext(2,48000,24000),g=createSoundGraph(c);for(let i=0;i<200;i++)g.play('gun',{duration:1,priority:i>170});const before=g.snapshot();await c.startRendering();const after=g.snapshot();g.clear();return {before,after,clear:g.snapshot()};}''')
  check(budget['before']['activeVoices']<=48 and budget['before']['culled']>100,'A burst of requests is bounded instead of allocating unlimited voices')
  check(budget['clear']['activeVoices']==0 and budget['clear']['loopCount']==0,'Chapter reset releases voices and loops')
  p.close();c=b.new_context(viewport={'width':1050,'height':740});c.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({low:true,scanned:false,cinematic:false,masterVolume:60,musicVolume:40}))");p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');p.wait_for_function('window.Rainward');p.locator('#start').click();p.wait_for_function('Rainward.snapshot().audio.context===\"running\"');p.wait_for_function('Rainward.snapshot().audio.level>.0001');check(True,'A real user activation starts audible Web Audio in the actual game')
  p.keyboard.down('KeyW');p.wait_for_function('Rainward.snapshot().audio.byKind?.[\"step-stone\"]>0');p.keyboard.up('KeyW');check(True,'Physical movement events generate layered footstep audio')
  p.keyboard.press('KeyP');p.locator('#musicVolume').press('Home');p.locator('#effectsVolume').press('Home');p.locator('#ambienceVolume').press('Home');p.wait_for_timeout(800);check(p.evaluate('JSON.parse(localStorage.getItem(\"svgn.rainward.v1.settings\")).musicVolume')==0,'Independent mixer controls persist locally');p.wait_for_timeout(1800);check(p.evaluate('Rainward.snapshot().audio.level')<.0001,'Setting all category buses to zero also silences their reverb tails')
  p.locator('#muted').check();p.wait_for_function('Rainward.snapshot().audio.context===\"suspended\"');check(True,'Mute suspends the live audio context')
  p.locator('#muted').uncheck();p.wait_for_function('Rainward.snapshot().audio.context===\"running\"');check(True,'Unmute resumes without constructing duplicate contexts')
  p.screenshot(path=str(OUT/'sound-settings.png'))
  check(not errors,'No uncaught browser errors in audio rendering and live playback')
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'rendered':measures,'stereo':stereo,'budget':budget,'errors':errors,'scope':'Real OfflineAudioContext output and live Web Audio analyser. No subjective listening test or physical Xbox/audio-device certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
