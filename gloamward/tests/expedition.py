"""Full native mission with ordinary UI and keyboard inputs only.
Read-only observed actors guide the driver. No avatar, health, timer or score writes.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output');OUT.mkdir(exist_ok=True);checks=[];errors=[]
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
def snap(p):return p.evaluate('GloamwardDemo.snapshot()')
def see(p):return p.evaluate('GloamwardDemo.observe()')
# All actuation below passes through the shipped keyboard handlers. These
# drivers deliberately do not call Run.fire, move, pick, or change game clocks.
SHOOT="""async id=>{
 const held=new Set(),canvas=document.querySelector('a-scene').canvas;
 function key(code,on){if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}));if(on)held.add(code);else held.delete(code);}
 await new Promise((resolve,reject)=>{const start=performance.now();const timer=setInterval(()=>{
  const s=GloamwardDemo.snapshot(),o=GloamwardDemo.observe(),e=o.enemies.find(e=>e.id===id);
  if(s.state!=='playing'||!e?.alive||performance.now()-start>35000){for(const k of [...held])key(k,false);clearInterval(timer);if(s.state==='dead')reject(Error('Rider defeated'));else if(performance.now()-start>35000)reject(Error('Cannot aim at '+id));else resolve();return;}
  const dx=e.pos.x-o.position.x,dz=e.pos.z-o.position.z,d=Math.hypot(dx,dz),dy=e.pos.y+1.28-o.position.y,v2=37*37,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2);
  const yaw=Math.atan2(-dx,-dz),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):Math.atan2(dy,d),a=Math.atan2(Math.sin(yaw-o.yaw),Math.cos(yaw-o.yaw)),b=pitch-o.pitch;
  key('ArrowLeft',a>.022);key('ArrowRight',a<-.022);key('ArrowUp',b>.017);key('ArrowDown',b<-.017);
  // Aim at the exposed upper torso above low cover (inside its real hit sphere).
  // Continue tracking while drawing; no auto-aim is installed in the game.
  key('KeyF',true);
  if(o.pull>.985&&Math.abs(a)<.045&&Math.abs(b)<.034){for(const k of [...held])key(k,false);clearInterval(timer);resolve();}
 },8);});
}"""
WALK="""async ({x,z,combat})=>{
 const held=new Set(),canvas=document.querySelector('a-scene').canvas;
 function key(code,on){if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}));if(on)held.add(code);else held.delete(code);}
 const C=await import('/gloamward/core.mjs');
 await new Promise((resolve,reject)=>{const start=performance.now();const timer=setInterval(()=>{
  const s=GloamwardDemo.snapshot(),o=GloamwardDemo.observe(),p=o.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),a=Math.atan2(Math.sin(Math.atan2(-dx,-dz)-o.yaw),Math.cos(Math.atan2(-dx,-dz)-o.yaw));
  const enemy=combat&&o.enemies.some(e=>e.alive&&e.room===o.room&&Math.hypot(e.pos.x-p.x,e.pos.z-p.z)<16&&!o.obstacles.some(b=>C.intersects(p,{x:e.pos.x,y:1.28,z:e.pos.z},b,.01)!==null));
  key('ArrowLeft',a>.035);key('ArrowRight',a<-.035);key('KeyW',Math.abs(a)<.13&&d>.65);
  if(d<.65||enemy||s.state!=='playing'||performance.now()-start>60000){for(const k of [...held])key(k,false);clearInterval(timer);if(d<.65||enemy||s.state==='won'||s.state==='upgrade')resolve();else reject(Error('Walk stopped at '+JSON.stringify(p)+' seeking '+x+','+z));}
 },8);});
}"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':900,'height':650},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/gloamward/',wait_until='domcontentloaded');page.wait_for_function('!!window.GloamwardDemo');page.locator('#menu-actions button').first.click()
  check(snap(page)['state']=='playing','The title starts the actual three-court game')
  total=0;deadline=time.monotonic()+550;upgrades=0
  while time.monotonic()<deadline:
   state=snap(page);o=see(page)
   assert state['state']!='dead','The ordinary-input expedition died'
   if state['state']=='won':break
   if state['state']=='upgrade':
    page.locator('#menu-actions button').first.wait_for(state='visible');page.screenshot(path=str(OUT/f'court-{upgrades+1}-cleared.png'));page.locator('#menu-actions button').first.click();upgrades+=1;page.wait_for_function('(n)=>GloamwardDemo.snapshot().room===n',arg=upgrades);check(True,'Courtyard completion and a deliberate upgrade open the next route');continue
   enemies=page.evaluate("""async ()=>{const C=await import('/gloamward/core.mjs'),o=GloamwardDemo.observe(),p=o.position;return o.enemies.filter(e=>e.alive&&e.room===o.room&&Math.hypot(e.pos.x-p.x,e.pos.z-p.z)<17&&!o.obstacles.some(b=>C.intersects(p,{x:e.pos.x,y:1.28,z:e.pos.z},b,.01)!==null)).sort((a,b)=>Math.hypot(a.pos.x-p.x,a.pos.z-p.z)-Math.hypot(b.pos.x-p.x,b.pos.z-p.z)).map(e=>e.id);} """)
   if enemies:
    page.evaluate(SHOOT,enemies[0]);total+=1;page.wait_for_timeout(500)
   else:
    if len(state['cleared'])==3:target=o['exit']
    else:
     r=o['rooms'][o['room']];prev=o['rooms'][max(0,o['room']-1)];p=o['position']
     if o['room']>0 and p['z']>prev['z']-7.7:target={'x':prev['x'],'z':prev['z']-8.1}
     elif o['room']>0 and p['z']>r['z']+10.8:target={'x':(r['x']+prev['x'])/2,'z':r['z']+10.4}
     else:target={'x':r['x'],'z':r['z']}
    page.evaluate(WALK,{**target,'combat':len(state['cleared'])<3})
   if total and total%5==0:print('PROGRESS',json.dumps(snap(page)),flush=True)
  end=snap(page);check(end['state']=='won','All three courts and the actual final exit are completed by ordinary controls')
  check(end['cleared']==[0,1,2] and end['score']==1700,'All nine opponents and all three encounters contribute their real rewards')
  check(end['hits']>=11 and end['shots']>=11,'Progress came from swept physical arrows, including the stronger keeper')
  check(upgrades==2,'Both between-court upgrade choices were exercised')
  page.locator('#menu').wait_for(state='visible');page.screenshot(path=str(OUT/'last-gate-won.png'))
  stored=page.evaluate('JSON.parse(localStorage.getItem("gloamward.record.v1"))');check(stored['runs']==1 and stored['best']==end['score'],'The completed run saves one local record, not duplicate rewards')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('!!window.GloamwardDemo');check(snap(page)['state']=='ready','Reload safely returns to the title; no unsupported checkpoint-resume claim')
  check(page.evaluate('JSON.parse(localStorage.getItem("gloamward.record.v1"))')==stored,'The local best and run count survive reload')
  check(not errors,'No uncaught browser exceptions in the full mission')
  (OUT/'expedition-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'state':end,'errors':errors,'scope':'Real HTTP/A-Frame WebGL. Ordinary UI and keyboard events. Read-only observations guide navigation/aim; no actor, health, kills or clock assignments. One seeded native mission is not a proof of every seed or physical headset acceptance.'},indent=2))
 except Exception as e:
  (OUT/'expedition-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':snap(page),'observation':see(page)},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();browser.close()
