"""Native HTTP regressions for clue discovery and a distinct third chapter.
Read-only route observation sends ordinary DOM keyboard events. No game state
writes, invincibility, time stepping, remote interactions or renderer mocks.
"""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from ui_flow import EXPECTED_VERSION,finish_transition
MODE=os.getenv('TERMINUS_SUITE','guidance');OUT=Path('test-output')/('terminus-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
def snap(page):return page.evaluate('Rainward.snapshot()')
def wait(page,q):page.wait_for_function(q,timeout=120000)
def go(page,x,z):
 print('GO',x,z,flush=True)
 page.evaluate('''async ({x,z})=>{
 const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});if(!route.length&&Math.hypot(Rainward.state.player.x-x,Rainward.state.player.z-z)>2)throw Error('No route to '+x+','+z);route.push({x,z});
 const points=route.filter((p,i,a)=>i===0||i===a.length-1||p.x-a[i-1].x!==a[i+1].x-p.x||p.z-a[i-1].z!==a[i+1].z-p.z);
 const held=new Set(),cv=document.getElementById('world');cv.focus();const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};
 await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),timer=setInterval(()=>{
  const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>180000){clearInterval(timer);for(const k of [...held])key(k,false);reject(Error('Navigation stopped '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,target:points[i]})));return;}
  if(p.hp<60&&p.medkit){key('KeyH',true);key('KeyH',false);}
  const q=points[i],dx=q.x-p.x,dz=q.z-p.z;if(Math.hypot(dx,dz)<.32){if(++i===points.length){clearInterval(timer);for(const k of [...held])key(k,false);resolve();}return;}
  const a=Rainward.view.yaw,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=-Math.sin(a)*dx-Math.cos(a)*dz;key('KeyD',lx>.14);key('KeyA',lx<-.14);key('KeyW',lz>.14);key('KeyS',lz<-.14);key('ShiftLeft',true);
 },16);});}''',{'x':x,'z':z})
 (OUT/'progress.json').write_text(json.dumps(snap(page),indent=2))
def quality(page,low):
 page.keyboard.press('KeyP');wait(page,'Rainward.mode==="pause"');page.locator('#low').set_checked(low);page.locator('#resume').click();wait(page,'Rainward.mode==="play"');n=page.evaluate('Rainward.renderer.info.render.frame');page.wait_for_function('(n)=>Rainward.renderer.info.render.frame>=n+2',arg=n)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);ctx=b.new_context(viewport={'width':1280,'height':820},service_workers='block')
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:"classic",mute:true,low:true,sensitivity:85}))")
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');wait(page,'window.Rainward');check(page.locator('#chapter-select option').count()==6,'Six separate authored chapters are present')
  chapter='conservatory' if MODE=='guidance' else 'terminus';page.locator('#chapter-select').select_option(chapter);page.locator('#start').click();wait(page,f'Rainward.state.level==="{chapter}"&&Rainward.mode==="play"')
  check(snap(page)['version']==EXPECTED_VERSION,'The running game identifies the committed release version')
  if MODE=='guidance':
   page.keyboard.press('KeyM');wait(page,'Rainward.mode==="map"');page.locator('#puzzle-assistance').wait_for(state='visible');before=snap(page)
   check('Western archive' in page.locator('#puzzle-journal').inner_text(),'The unread journal supplies an actionable physical clue location')
   for n,term in enumerate(['western archive','Garden wheel','SUN']):
    page.locator('#puzzle-hint').click();wait(page,f'document.getElementById("puzzle-hint-text").textContent.includes({json.dumps(term)})')
   check('WAVE' in page.locator('#puzzle-hint-text').inner_text(),'The third optional hint reveals the full named-wheel solution')
   after=snap(page);check(before['puzzle']==after['puzzle'] and before['objectives']==after['objectives'] and before['player']==after['player'],'Reading all hints changes neither puzzle nor actor nor inventory')
   check(page.locator('#journal-controls .journal-control').count()==3,'The notebook names and numbers all three current controls')
   page.screenshot(path=str(OUT/'progressive-puzzle-help.png'));page.locator('#puzzle-reset-hints').click();check('Stuck?' in page.locator('#puzzle-hint-text').inner_text(),'Spoiler hints can be hidden again');page.locator('#map-close').click()
   quality(page,False);page.screenshot(path=str(OUT/'conservatory-new-materials.png'));quality(page,True)
   go(page,-29,7);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.clueRead');page.keyboard.press('KeyM');wait(page,'Rainward.mode==="map"');check('first welcomes the SUN' in page.locator('#puzzle-journal').inner_text(),'The original physical inscription still records its actual clue')
   page.set_viewport_size({'width':390,'height':844});page.locator('#puzzle-hint').click();check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The notebook remains within a phone-width viewport');page.screenshot(path=str(OUT/'phone-notebook.png'))
  else:
   quality(page,False);page.screenshot(path=str(OUT/'terminus-concourse.png'));quality(page,True)
   go(page,2,38);page.keyboard.press('KeyE');wait(page,'Rainward.state.taken.has("terminus-kit")');page.locator('#pack-button').click()
   for i in range(2):page.locator('#craft-med').click();wait(page,f'Rainward.state.player.medkit==={i+1}&&!Rainward.state.player.craft')
   page.locator('#craft-smoke').click();wait(page,'Rainward.state.player.smoke===1');page.locator('#pack-close').click()
   go(page,-28,21);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.clueRead');check(True,'The station power diagram is a real, reachable interaction')
   page.keyboard.press('KeyM');wait(page,'Rainward.mode==="map"');check('FLOODED PUMP' in page.locator('#journal-controls').inner_text(),'The linked-circuit notebook identifies the flooded pump separately');page.locator('#map-close').click()
   go(page,-28,16.4);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.wheels[0]===1&&Rainward.state.puzzle.wheels[1]===1');check(not snap(page)['puzzle']['solved'],'Breaker A actually energizes two circuits and does not solve the route alone')
   go(page,-28,4.4);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.solved');check(snap(page)['puzzle']['wheels']==[1,0,1],'The second outer breaker cancels the pump and opens the signal gate')
   go(page,-32,-13);page.keyboard.press('KeyE');wait(page,'Rainward.state.checkpoint==="workshop"');go(page,-34,-20);page.keyboard.press('KeyE');wait(page,'Rainward.state.objectives.crank');check(True,'The workshop objective can be collected through normal play')
   go(page,-32,-13);page.keyboard.press('KeyE');saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')
   go(page,-16,8);go(page,22,10);go(page,30,4);go(page,26,-22);page.keyboard.press('KeyX');go(page,32,-21);page.keyboard.press('KeyE');wait(page,'Rainward.state.objectives.cell');check(True,'A separate dispatch route and creature encounter lead to the second objective')
   page.screenshot(path=str(OUT/'dispatch-gallery.png'));go(page,26,10);go(page,0,10);go(page,0,-32);go(page,0,-42);go(page,0,-62.6);page.keyboard.press('KeyE');wait(page,'Rainward.mode==="won"')
   check(snap(page)['puzzle']['solved'] and all(snap(page)['objectives'].values()),'The complete station mission requires real objects and the physical gate')
   check(snap(page)['stats']['shots']==0 and snap(page)['stats']['takedowns']==0,'A no-kill station route remains possible');page.screenshot(path=str(OUT/'station-complete.png'));(OUT/'completed.json').write_text(json.dumps(snap(page),indent=2))
   check(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Completing the station preserves the earlier explicit shelter save')
   page.reload(wait_until='domcontentloaded');wait(page,'window.Rainward');page.locator('#continue').click();wait(page,'Rainward.mode==="play"');q=snap(page);check(q['level']=='terminus' and q['puzzle']['solved'] and q['objectives']['crank'] and not q['objectives']['cell'],'Continue restores the third-chapter shelter and correct partial objectives')
  check(not errors and not any('Shader Error' in x or 'VALIDATE_STATUS' in x for x in console),'The actual renderer compiles the new materials without shader or script errors')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':'Native HTTP/WebGL. Ordinary keyboard/menu interactions and read-only route guidance. Public Reduced Graphics for travel; actual full-quality screenshots. No game-state writes, copied art or hardware-performance claims.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
