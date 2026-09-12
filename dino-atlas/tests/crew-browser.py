"""Native HTTP/WebGL acceptance. Synthetic Xbox; distant staff reached with explicit position fixtures.
No local-memory DOM renderer and no remote asset host are used. No physical-hardware claim.
"""
from pathlib import Path
import os,json,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'crew-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Crew Xbox acceptance',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[];shader_errors=[];requests=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);ctx=b.new_context(viewport={'width':1180,'height':820});ctx.add_init_script(PAD);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:shader_errors.append(m.text) if m.type=='error' and ('Shader' in m.text or 'GL_INVALID' in m.text) else None);page.on('request',lambda r:requests.append(r.url))
  def wait(s,t=90000):page.wait_for_function(s,timeout=t)
  def press(i):
   page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);page.wait_for_timeout(340);page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);page.wait_for_timeout(340)
  def choose(id):
   for _ in range(70):
    if page.evaluate('document.activeElement.id')==id:press(0);return
    press(13)
   raise AssertionError('Cannot focus '+id)
  def snap(n):page.screenshot(path=str(OUT/n),timeout=45000)
  def foot(x,z,y=1.1):page.evaluate('([x,z,y])=>{const f=__dinoRanger.fleet;f.active="foot";f.person.setActive(true,{x,y,z});__dinoRanger.setAim(0);}',[x,z,y]);page.wait_for_timeout(400)
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready&&window.__dinoCrew?.state.ready',120000)
   check(page.evaluate('__dinoCrew.state.people.every(p=>p.loaded&&p.bones===45)'),'All seven crew members load the real CC0 rig')
   check(page.evaluate('__dinoCrew.state.clips.map(c=>c.name).join(",")')=='Idle,Run','Both imported animation clips are available')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'All previous 64 dinosaur residents retained')
   check(page.evaluate('__dinoCrew.state.fieldlight.waterSurfaces')>=4,'Fieldlight covers existing sea, canal and ponds')
   check(page.evaluate('__dinoCrew.state.fieldlight.canopyPanels')>0,'Research canopy uses the new glass shader')
   press(0);wait('__dinoRanger.state.started')
   if page.locator('#info-dialog[open]').count():press(1)
   foot(-6,64);wait('document.getElementById("interact-label").textContent.includes("Mara")');snap('01-chief-ranger.png');press(0);wait('document.getElementById("crew-talk").open')
   check(page.evaluate('__dinoCrew.state.progress.met.includes("mara")'),'Xbox A introduces Chief Ranger Mara')
   snap('02-crew-briefing.png');press(1);wait('!__dinoRanger.state.paused');check(True,'Xbox B closes the staff dialogue')
   press(9);wait('document.getElementById("menu-dialog").open');choose('menu-crew');wait('document.getElementById("crew-dialog").open');check(True,'Staff roster and shaders are reachable through controller navigation')
   choose('crew-tour');wait('__dinoCrew.state.progress.tour');check(page.evaluate('__dinoCrew.state.task.name').startswith('Meet '),'Introductions create a real world/map target')
   for id,x,z in [('leon',-175,47),('tess',-85,-71),('ivo',-36,-326),('rhea',75,-216),('owen',218,-137),('ada',208,106)]:
    foot(x,z+2);wait('document.getElementById("interact-label").textContent.startsWith("Talk to")');press(0);wait('document.getElementById("crew-talk").open');check(page.evaluate(f'__dinoCrew.state.progress.met.includes("{id}")'),'In-world staff contact: '+id);press(1);wait('!__dinoRanger.state.paused')
   foot(-6,64);wait('document.getElementById("interact-label").textContent.includes("File crew")');before=page.evaluate('__dinoEconomy.state.credits');press(0);wait('document.getElementById("info-dialog").open');check(page.evaluate('__dinoEconomy.state.credits')==before+600,'All-staff report awards exactly 600 credits');press(1)
   press(9);choose('menu-crew');
   # Navigate to the actual native select and change without a mouse.
   for _ in range(50):
    if page.evaluate('document.activeElement.id')=='crew-shaders':break
    press(13)
   press(15);check(not page.evaluate('__dinoCrew.state.fieldlight.enabled'),'Classic preset restores original materials with D-pad')
   press(15);check(page.evaluate('__dinoCrew.state.fieldlight.enabled'),'Fieldlight can be re-enabled without reloading')
   press(13);press(15);check(page.evaluate('__dinoCrew.state.avatar')=='female','D-pad selects the female on-foot ranger');press(1)
   foot(-35,-328);page.wait_for_timeout(500);snap('03-northstar-approach.png');foot(-38,-355,25.1);page.wait_for_timeout(500);snap('04-research-canopy.png')
   foot(-90,-146);page.wait_for_timeout(600);snap('05-wetland-water.png')
   check(not shader_errors,'No WebGL shader compilation errors in tested views')
   check(page.evaluate('__dinoRanger.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'Compiled renderer programs are runnable')
   press(9);choose('menu-crew');page.evaluate('document.getElementById("crew-avatar").focus()');press(15);check(page.evaluate('__dinoCrew.state.avatar')=='classic','Original procedural avatar remains selectable');press(1)
   # Lost model request falls back rather than breaking existing game entry.
   page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoCrew?.state.ready',120000)
   check(page.evaluate('__dinoCrew.state.progress.met.length')==7,'Introductions persist across actual reload')
   check(page.evaluate('__dinoEconomy.state.credits')==before+600,'Crew reward survives reload');check(not page.evaluate('__dinoEconomy.grant(600,"aaa:crew-introductions")'),'Persisted ledger blocks duplicate staff reward')
   origin=BASE.split('/dino-atlas/')[0];check(all(u.startswith(origin) or u.startswith('data:') or u.startswith('blob:') for u in requests),'Runtime model and texture loading remains on the game origin')
   check(not errors,'No uncaught JavaScript errors')
   # Separate new browser context simulates asset loss only; gameplay must still load.
   fallback=ctx.new_page();fallback.route('**/assets/crew/ranger.glb',lambda route:route.abort());fallback.goto(BASE+'?test=1',wait_until='domcontentloaded');fallback.wait_for_function('window.__dinoRanger?.state.ready&&window.__dinoCrew?.state.loadError',timeout=120000);check(fallback.evaluate('__dinoCrew.state.avatar')=='classic','Missing model asset preserves procedural fallback and game boot');fallback.close()
   (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shader_errors':shader_errors,'limitations':'Native software WebGL, synthetic Xbox, distant staff positioning fixtures, no physical hardware or human art/playability review.'},indent=2))
  except Exception as e:
   d={}
   try:d=page.evaluate('({crew:window.__dinoCrew?.state,game:window.__dinoRanger?.state,focus:document.activeElement.id,label:document.getElementById("interact-label")?.textContent})');snap('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shader_errors':shader_errors,'diagnostic':d},indent=2));raise
  finally:b.close()
finally:
 if server:server.terminate()
