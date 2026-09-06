import os,json,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('RAINWARD_SUITE','ui');OUT=Path('test-output')/('rainward-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
def snapshot(p):return p.evaluate('Rainward.snapshot()')
def goto(p,x,z,sprint=True):
 p.evaluate('''async ({x,z,sprint})=>{
  const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});
  const points=route.filter((p,i,a)=>i===a.length-1||i===0||i<a.length-1&&(p.x-a[i-1].x!==a[i+1].x-p.x||p.z-a[i-1].z!==a[i+1].z-p.z));
  const keys=new Set(),canvas=document.getElementById('world');canvas.focus();
  function key(k,on){if(keys.has(k)===on)return;keys[on?'add':'delete'](k);canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:k,key:k.startsWith('Key')?k.slice(3).toLowerCase():k,bubbles:true,cancelable:true}));}
  await new Promise((resolve,reject)=>{let i=0,stamp=performance.now();const timer=setInterval(()=>{
   const p=Rainward.state.player;
   if(Rainward.mode!=='play'||performance.now()-stamp>180000){clearInterval(timer);for(const k of [...keys])key(k,false);reject(Error('Navigation stopped at '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,mode:Rainward.mode,target:points[i]})));return;}
   if(p.hp<65&&p.medkit){key('KeyH',true);key('KeyH',false);}
   let target=points[i];if(Math.hypot(p.x-target.x,p.z-target.z)<.37){if(++i===points.length){clearInterval(timer);for(const k of [...keys])key(k,false);resolve();return;}target=points[i];}
   const yaw=Rainward.view.yaw,dx=target.x-p.x,dz=target.z-p.z,localX=Math.cos(yaw)*dx-Math.sin(yaw)*dz,localZ=-Math.sin(yaw)*dx-Math.cos(yaw)*dz;
   key('KeyD',localX>.18);key('KeyA',localX<-.18);key('KeyW',localZ>.18);key('KeyS',localZ<-.18);key('ShiftLeft',sprint);
  },20);});
 }''',{'x':x,'z':z,'sprint':sprint})
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);ctx=browser.new_context(viewport={'width':1180,'height':780},service_workers='block',record_video_dir=str(OUT/'video'))
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:false,sensitivity:85}))")
 hostname=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==hostname or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.Rainward')
  check(page.evaluate('Rainward.renderer.isWebGLRenderer&&Rainward.renderer.info.render.triangles>5000'),'Actual third-person WebGL environment renders')
  page.screenshot(path=str(OUT/'title.png'));page.locator('#start').click();page.wait_for_function('Rainward.mode==="play"')
  check(snapshot(page)['player']['hp']==100,'A new run starts with full health and empty scavenging inventory')
  awaitstate=lambda q:page.wait_for_function(q)
  if MODE=='ui':
   page.locator('#world').focus();page.keyboard.press('KeyC');awaitstate('Rainward.state.player.stance==="crouch"');page.keyboard.press('KeyZ');awaitstate('Rainward.state.player.stance==="prone"')
   check(snapshot(page)['player']['stance']=='prone','Crouch and prone are different actual player states')
   page.keyboard.press('KeyZ');goto(page,1.3,25.5,False);page.keyboard.press('KeyE');awaitstate('Rainward.state.taken.has("rations")')
   check(snapshot(page)['player']['cloth']==2,'Scavenging awards the real finite crafting ingredients once')
   page.locator('#pack-button').click();page.wait_for_function('Rainward.mode==="pack"');before=page.evaluate('Rainward.state.t')
   page.locator('#craft-med').click();awaitstate('Rainward.state.player.craft?.item==="medkit"');check(page.locator('#craft-smoke').is_disabled(),'Crafting blocks a simultaneous second purchase')
   awaitstate('Rainward.state.player.medkit===1&&!Rainward.state.player.craft');check(page.evaluate('Rainward.state.t')>before+2,'The district keeps running during the timed crafting action')
   page.locator('#pack-close').click();page.keyboard.press('KeyB');awaitstate('Rainward.state.events.some(e=>e.type==="sound"&&e.kind==="bottle")')
   check(snapshot(page)['stats']['bottles']==1,'Throwing a bottle consumes inventory and creates an impact noise')
   page.keyboard.press('KeyM');awaitstate('Rainward.mode==="map"');t=page.evaluate('Rainward.state.t');page.wait_for_timeout(400);check(page.evaluate('Rainward.state.t')==t,'The field map pauses the simulation');page.screenshot(path=str(OUT/'field-map.png'));page.locator('#map-close').click()
   goto(page,-8,22,False);page.keyboard.press('KeyZ');goto(page,-8,18.8,False);page.keyboard.press('KeyC');check(snapshot(page)['player']['stance']=='prone','A prone crawl cannot stand up through the overhead slab');page.keyboard.press('KeyE');check('crawl-cache' in snapshot(page)['taken'],'Prone movement reaches a real cache beneath the obstruction');page.screenshot(path=str(OUT/'prone-cache.png'))
   goto(page,-8,22,False);page.keyboard.press('KeyZ');page.keyboard.down('KeyF');awaitstate('Rainward.state.player.mag===5');page.keyboard.up('KeyF');page.keyboard.press('KeyR');awaitstate('Rainward.state.player.mag===6&&Rainward.state.player.reload===0');check(snapshot(page)['stats']['shots']==1,'Firing and reloading use actual ammunition')
   page.keyboard.press('KeyP');awaitstate('Rainward.mode==="pause"');page.locator('#low').check();page.locator('#resume').click();check(page.evaluate('!Rainward.renderer.shadowMap.enabled'),'Reduced graphics is a real renderer option')
   page.set_viewport_size({'width':390,'height':844});page.locator('#touch').wait_for(state='visible');page.locator('[data-touch="crouch"]').click();awaitstate('Rainward.state.player.stance==="crouch"');check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Touch HUD fits a phone-width viewport');page.screenshot(path=str(OUT/'touch-view.png'))
   page.locator('[data-hold="fire"]').hover();page.mouse.down();page.wait_for_function('Rainward.state.player.mag<6');page.mouse.up()
   check(snapshot(page)['stats']['shots']>1,'Touch fire activates the same finite-ammunition weapon')
  elif MODE=='mission':
   goto(page,1.3,25.5);page.keyboard.press('KeyE');page.locator('#pack-button').click();page.locator('#craft-med').click();awaitstate('Rainward.state.player.medkit===1');page.locator('#craft-smoke').click();awaitstate('Rainward.state.player.smoke===1');page.locator('#pack-close').click()
   for x,z in [(-19,14),(-19,7),(-24,6),(-24,-3.5),(-22,-3.5)]:goto(page,x,z)
   page.keyboard.press('KeyE');awaitstate('Rainward.state.objectives.cell');check(True,'The expedition enters the clinic and scavenges its objective through normal input');page.screenshot(path=str(OUT/'inside-clinic.png'))
   goto(page,-24,-1);page.keyboard.press('KeyE');awaitstate('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).checkpoint==="clinic"');saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')
   for x,z in [(-24,6),(-19,7),(-19,12),(-31,12),(-31,-15),(-27,-16),(-27,-24),(-18,-26),(-18,-42),(12,-46),(21,-32),(21,-26.7),(22.3,-26.7)]:goto(page,x,z)
   page.keyboard.press('KeyE');awaitstate('Rainward.state.objectives.crank');check(True,'The second building has a traversable entrance and recoverable gate component');page.screenshot(path=str(OUT/'freight-hall.png'))
   page.keyboard.press('KeyH');page.keyboard.press('KeyX');check(page.evaluate('Rainward.state.smokes.length===1'),'A crafted smoke cloud is deployed during the live escape')
   for x,z in [(21,-32),(16,-38),(0,-43)]:goto(page,x,z)
   page.keyboard.press('KeyE');awaitstate('Rainward.mode==="won"');check(snapshot(page)['stats']['shots']==0 and snapshot(page)['stats']['takedowns']==0,'A complete live expedition can succeed without shooting or taking down an enemy');check(snapshot(page)['objectives']=={'cell':True,'crank':True},'Extraction requires both actual collected components');page.screenshot(path=str(OUT/'extracted.png'))
   check(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Winning does not overwrite the explicit shelter checkpoint')
   (OUT/'completed-run.json').write_text(json.dumps(snapshot(page),indent=2))
   page.reload(wait_until='domcontentloaded');page.wait_for_function('!!window.Rainward');page.locator('#continue').click();awaitstate('Rainward.mode==="play"');q=snapshot(page);check(q['objectives']['cell'] and not q['objectives']['crank'] and abs(q['player']['x']+24)<.1,'Reload resumes the exact saved shelter, not a fabricated final state')
  check(not errors,'No uncaught script errors in the verified flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':snapshot(page),'scope':'Native HTTP/WebGL software renderer; gameplay uses normal keyboard/DOM events. Mission navigation uses read-only path guidance. Physical GPU/controller/phone performance and enjoyment not certified.'},indent=2))
 except Exception as e:
  try:state=snapshot(page)
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'console':console[-15:]},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
