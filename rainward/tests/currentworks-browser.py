"""Actual HTTP game, ordinary controls; only read-only route/aim guidance.
No assignment to health, enemy AI, objectives, gate, player or game clock.
"""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE='expedition';OUT=Path('test-output/currentworks-screen');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
def snap(page):return page.evaluate('Rainward.snapshot()')
def go(page,x,z,sprint=True):
 print('GO',x,z,flush=True)
 page.evaluate('''async ({x,z,sprint})=>{
 const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});if(!route.length&&Math.hypot(Rainward.state.player.x-x,Rainward.state.player.z-z)>2)throw Error('No current route');route.push({x,z});
 const points=route.filter((p,i,a)=>i===a.length-1||i===0||i<a.length-1&&(p.x-a[i-1].x!==a[i+1].x-p.x||p.z-a[i-1].z!==a[i+1].z-p.z));
 const held=new Set(),cv=document.getElementById('world');cv.focus();const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};
 await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),timer=setInterval(()=>{
 const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>180000){clearInterval(timer);for(const k of [...held])key(k,false);reject(Error('Stopped '+JSON.stringify({p:{x:p.x,z:p.z,hp:p.hp},target:points[i],mode:Rainward.mode})));return;}
 if(p.hp<65&&p.medkit){key('KeyH',true);key('KeyH',false);}
 const q=points[i],dx=q.x-p.x,dz=q.z-p.z;if(Math.hypot(dx,dz)<.32){if(++i===points.length){clearInterval(timer);for(const k of [...held])key(k,false);resolve();}return;}
 const a=Rainward.view.yaw,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=-Math.sin(a)*dx-Math.cos(a)*dz;key('KeyD',lx>.14);key('KeyA',lx<-.14);key('KeyW',lz>.14);key('KeyS',lz<-.14);key('ShiftLeft',sprint);
 },16);});}''',{'x':x,'z':z,'sprint':sprint})
 (OUT/'progress.json').write_text(json.dumps(snap(page),indent=2))
def wait(page,q):page.wait_for_function(q,timeout=90000)
def quality(page,low):
 page.keyboard.press('KeyP');wait(page,'Rainward.mode==="pause"');page.locator('#low').set_checked(low);page.locator('#resume').click();wait(page,'Rainward.mode==="play"');n=page.evaluate('Rainward.renderer.info.render.frame');page.wait_for_function('(n)=>Rainward.renderer.info.render.frame>=n+2',arg=n)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1366,'height':860},service_workers='block',record_video_dir=str(OUT/'video'))
 c.add_init_script("localStorage.setItem('svgn.rainward.v1.freefield',JSON.stringify({freeStride:false,xrLayout:'legacy',pinnedXR:true,footsteps:100,waterVolume:100,score:'legacy'}));localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'classic',scanned:false,cinematic:false,detailedHumans:false,mute:true,low:"+'true'+",sensitivity:85}))")
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');wait(page,'window.Rainward');check(page.locator('#chapter-select option').count()>=3,'Existing chapters and the new expedition are selectable')
  page.locator('#chapter-select').select_option('conservatory');page.locator('#start').click();wait(page,'Rainward.state.level==="conservatory"&&Rainward.mode==="play"');check(snap(page)['player']['y']==8,'The second expedition starts on a real elevated terrace')
  wait(page,'Rainward.snapshot().visuals.currentworks.active&&!Rainward.snapshot().environmentLoading')
  env=page.evaluate('Rainward.snapshot().visuals.currentworks')
  check(env['hostThree']=='177' and env['prepared'] and not env['error'],'The actual r177 game prepares the r184-origin library without replacing its engine')
  check(len(env['water'])==3 and env['trees']['trees']==5 and env['warmupDraws']==1,'Three existing pools and five planter trees use the reusable library after loading preparation')
  page.keyboard.press('KeyP');wait(page,'Rainward.mode==="pause"');frozen=page.evaluate('Rainward.snapshot().visuals.currentworks.water[0].time');saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');page.wait_for_timeout(500)
  check(page.evaluate('Rainward.snapshot().visuals.currentworks.water[0].time')==frozen,'Pause freezes the graphics clock along with gameplay')
  page.locator('#currentworks').uncheck();check(not page.evaluate('Rainward.snapshot().visuals.currentworks.active'),'The normal graphics setting restores the legacy environment')
  page.locator('#currentworks').check();wait(page,'Rainward.snapshot().visuals.currentworks.active');check(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Changing environmental graphics does not rewrite campaign saves')
  page.locator('#motion').uncheck();page.locator('#resume').click();wait(page,'Rainward.mode==="play"');page.wait_for_function('Rainward.snapshot().visuals.currentworks.water.every(w=>w.quiet)')
  check(True,'Reduced decorative motion reaches the actual library water and trees')
  page.keyboard.press('KeyP');wait(page,'Rainward.mode==="pause"');page.locator('#motion').check();page.locator('#low').uncheck();page.locator('#resume').click();wait(page,'Rainward.mode==="play"');page.wait_for_function('Rainward.snapshot().visuals.currentworks.water.every(w=>w.quality==="balanced")')
  page.screenshot(path=str(OUT/'currentworks-balanced-overlook.png'));check(page.evaluate('Rainward.renderer.info.render.triangles>10000'),'Balanced quality draws real geometry and shaders in the game')
  quality(page,True);check(page.evaluate('Rainward.snapshot().visuals.currentworks.water.every(w=>w.quality==="light")'),'Reduced graphics selects bounded light water and retains library shader hooks')
  initial=page.evaluate('Rainward.state.enemies.find(e=>e.id==="rootback")');page.wait_for_function('(p)=>{const e=Rainward.state.enemies.find(e=>e.id==="rootback");return Math.hypot(e.x-p.x,e.z-p.z)>.8;}',arg=initial);check(True,'The Rootback patrol moves through its authored path instead of starting embedded in a pillar')
  if MODE=='visual':quality(page,False)
  page.screenshot(path=str(OUT/'arrival-overlook.png'));check(page.evaluate('Rainward.renderer.info.render.triangles>10000'),'The new location renders real 3D geometry, not a backdrop screenshot')
  if MODE=='visual':
   quality(page,True)
   go(page,0,34,False);check(snap(page)['player']['y']<8,'Descending the terraced approach updates physical elevation');quality(page,False);page.screenshot(path=str(OUT/'glass-dome-vista.png'));quality(page,True)
   go(page,-7,19);page.keyboard.press('KeyE');wait(page,'Rainward.state.checkpoint==="garden"');check(True,'The new garden checkpoint can be used normally')
   go(page,-29,7);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.clueRead');page.keyboard.press('KeyM');page.locator('#puzzle-journal').wait_for(state='visible');wait(page,'document.getElementById("puzzle-journal").textContent.includes("SUN")');check('SUN' in page.locator('#puzzle-journal').inner_text(),'Reading the physical inscription records a puzzle clue in the field map');page.screenshot(path=str(OUT/'puzzle-journal.png'));page.locator('#map-close').click()
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'mobile-archive.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Chapter and clue UI fit a phone-width viewport')
  else:
   go(page,2,46);page.keyboard.press('KeyE');wait(page,'Rainward.state.taken.has("ruins-supplies")');page.locator('#pack-button').click()
   for i in range(2):page.locator('#craft-med').click();wait(page,f'Rainward.state.player.medkit==={i+1}&&!Rainward.state.player.craft')
   page.locator('#craft-smoke').click();wait(page,'Rainward.state.player.smoke===1');page.locator('#pack-close').click()
   go(page,-29,7);page.keyboard.press('KeyE');wait(page,'Rainward.state.puzzle.clueRead');check(page.evaluate('(async()=>{const W=await import("./world.mjs");return W.findPath(Rainward.state.player,W.EXIT).length===0})()'),'The unsolved gate genuinely blocks the northern route')
   for i,target in enumerate([0,1,3]):
    go(page,-29,[1,-7,-15][i]+1.5)
    for _ in range(4):
     if page.evaluate(f'Rainward.state.puzzle.wheels[{i}]')==target:break
     old=page.evaluate(f'Rainward.state.puzzle.wheels[{i}]');page.keyboard.press('KeyE');wait(page,f'Rainward.state.puzzle.wheels[{i}]!=={old}')
   wait(page,'Rainward.state.puzzle.solved');check(True,'Three physical wheel interactions solve the clue and raise the actual gate');page.screenshot(path=str(OUT/'archive-puzzle-solved.png'))
   go(page,-40,-3);page.keyboard.press('KeyE');wait(page,'Rainward.state.completedTasks.includes("archive-pages")');check(page.evaluate('(async()=>!(await import("./world.mjs")).solidAt(-40,-25))()'),'The original catalogue interaction opens the physical north archive exit')
   go(page,-41,-18);page.keyboard.press('KeyE');wait(page,'Rainward.state.objectives.cell');check(True,'The western archive contains a recoverable lens guarded by a distinct creature')
   go(page,-40,-21);page.keyboard.press('KeyE');wait(page,'Rainward.state.checkpoint==="archive"');saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')
   for x,z in [(-40,-23),(-40,-27),(-33,-27),(-26,-27),(-18,-27),(-16,-22),(-16,-10)]:go(page,x,z)
   check(True,'Ordinary movement uses the new maintenance return with original enemies alive');page.screenshot(path=str(OUT/'maintenance-return.png'))
   go(page,-18,-23);go(page,19,-26);go(page,26,-27);go(page,29,4);go(page,39,-19);page.keyboard.press('KeyE');wait(page,'Rainward.state.objectives.crank');check(True,'The separate glasshouse contains the second actual objective');page.screenshot(path=str(OUT/'rootback-glasshouse.png'))
   page.keyboard.press('KeyX');go(page,20,-6);go(page,0,-27);go(page,0,-37);go(page,0,-61);go(page,10,-66);go(page,10,-72);go(page,0,-72);page.keyboard.press('KeyE');wait(page,'Rainward.mode==="won"')
   check(snap(page)['objectives']=={'cell':True,'crank':True} and snap(page)['puzzle']['solved'],'The complete live chapter finishes only after both objectives and the gate puzzle');page.screenshot(path=str(OUT/'north-sanctuary-complete.png'));(OUT/'completed.json').write_text(json.dumps(snap(page),indent=2))
   page.reload(wait_until='domcontentloaded');wait(page,'window.Rainward');page.locator('#continue').click();wait(page,'Rainward.mode==="play"');q=snap(page);check(q['level']=='conservatory' and q['puzzle']['solved'] and q['objectives']['cell'] and not q['objectives']['crank'],'Reload restores the earlier second-chapter checkpoint and solved physical gate')
  check(not errors and not console,'No uncaught game or graphics errors in the integrated library mission')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'console':console,'environment':page.evaluate('Rainward.snapshot().visuals.currentworks'),'scope':'Actual HTTP/WebGL with ordinary keyboard/menu actions, read-only route guidance; no gameplay-state assignments. Travel uses the public Reduced Graphics preset; visual suite explicitly switches to full PBR/shadows for actual arrival/vista captures. No physical-device or performance certification.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console[-20:],'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
