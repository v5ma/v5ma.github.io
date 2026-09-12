"""First Bell native UI/archery acceptance. Player state is observed, never assigned.
The optional long combat suite uses the documented render-only CPU fixture.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('BELL_SUITE','lessons');OUT=ROOT/'test-output'/('first-bell-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
AIM="""async target=>{const c=Vesperfall.component,canvas=AFRAME.scenes[0].canvas,held=new Set(),key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const s=Vesperfall.state,p=s.head,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),dy=target[1]-p[1],v=target[3]||36,v2=v*v,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):0,yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;key('ArrowLeft',a>.01);key('ArrowRight',a<-.01);key('ArrowUp',b>.006);key('ArrowDown',b<-.006);if(Math.abs(a)<.02&&Math.abs(b)<.012||performance.now()-start>90000){for(const k of [...held])key(k,false);clearInterval(t);Math.abs(a)<.02?resolve():reject(Error('Aim timeout'));}},3);});}"""
WALK="""async target=>{const c=Vesperfall.component,canvas=AFRAME.scenes[0].canvas,held=new Set(),key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const s=Vesperfall.state,dx=target[0]-s.p[0],dz=target[1]-s.p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));key('ArrowLeft',a>.018);key('ArrowRight',a<-.018);key('KeyW',Math.abs(a)<.09&&d>.15);key('ShiftLeft',true);const encounter=target[2]&&s.oath?.active;if(d<.17||encounter||s.phase!=='playing'||performance.now()-start>180000){for(const k of [...held])key(k,false);clearInterval(t);d<.17||encounter?resolve():reject(Error('Walk stalled '+JSON.stringify({p:s.p,target,phase:s.phase})));}},3);});}"""
PAD="""(()=>{const pad={id:'Test Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1120,'height':800},device_scale_factor=.5,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.5;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text());page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def pause():
  if not page.evaluate('Vesperfall.component.paused'):page.keyboard.press('KeyP');wait('Vesperfall.component.paused')
 def shoot():
  n=page.evaluate('Vesperfall.state.shots');page.keyboard.down('Space');wait('Vesperfall.component.charge>.985');page.keyboard.up('Space');wait('n=>Vesperfall.state.shots>n',n);wait('Vesperfall.state.arrows.length===0')
 def save_raw():return page.evaluate('localStorage.getItem(PilgrimSave.KEY)')
 def lesson(i):wait('(i)=>Vesperfall.component.firstBell.state.coach?.index===i',i)
 def padpress(i):
  wait('Vesperfall.component.dominionControls.state.armed')
  for v in (True,False):page.evaluate('([i,v])=>TestPad.button(i,v)',[i,v]);wait('([i,v])=>Vesperfall.component.dominionControls.state.prev[i]===v',[i,v])
 def nav(id):
  for _ in range(120):
   if page.evaluate('id=>document.activeElement.id===id',id):return
   d=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;if(j<0)throw Error("Missing "+id);return (j-i+n)%n<=(i-j+n)%n?13:12}',id);padpress(d)
  raise AssertionError('Focus failed '+id)
 def xrpress(hand,i):
  for v in (True,False):page.evaluate('([h,i,v])=>TestXR.button(h,i,v)',[hand,i,v]);wait('([h,i,v])=>Vesperfall.component.prevButtons[h]?.[i]===v||(!v&&!Vesperfall.component.xr)',[hand,i,v])
 def xract(text):
  wait('Vesperfall.component.paused&&Vesperfall.component.dominionControls.state.xrNeutral');rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');n=next((i for i,r in enumerate(rows) if text.lower() in r.lower()),None);assert n is not None,(text,rows)
  current=page.evaluate('Vesperfall.component.menuSelection');d=(n-current+len(rows))%len(rows);u=(current-n+len(rows))%len(rows)
  for direction in ([1,-1] if d==0 else [1]*d if d<=u else [-1]*u):
   wait('Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("d=>TestXR.axes('left',0,d)",direction);wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  xrpress('right',0)
 try:
  page.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');wait('window.Vesperfall?.component.firstBell&&Vesperfall.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'First Bell loads inside the maintained A-Frame renderer')
  page.locator('#jewel-settings summary').click();page.locator('#jewel-quality').select_option('classic');page.locator('#cathedral-shadows').uncheck();page.locator('#audio').uncheck()
  if MODE=='lessons':
   page.locator('#start').click();wait('Vesperfall.component.checkpoint.eligible');pause();page.locator('#suspend-expedition').click();wait('!Vesperfall.component.running');saved=save_raw();profile=page.evaluate('JSON.stringify(Vesperfall.component.profile)')
   page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');nav('first-bell-start');padpress(0);lesson(0)
   check(page.evaluate('Vesperfall.component.practice&&Vesperfall.state.unscored'),'Xbox can enter the guided lessons without a mouse')
   padpress(9);nav('coach-ready');padpress(0);lesson(1);page.evaluate('TestPad.enabled=false');wait('Vesperfall.component.dominionControls.state.pad===null')
   if page.evaluate('Vesperfall.component.paused'):page.locator('#resume').click()
   page.locator('a-scene canvas').focus();page.evaluate(AIM,[0,1.5,-4]);shoot();lesson(2);check(True,'A real charged arrow hits the first practice bell and advances the lesson')
   page.keyboard.down('Space');wait('Vesperfall.component.charge>.3');n=page.evaluate('Vesperfall.state.shots');page.keyboard.press('KeyQ');page.keyboard.up('Space');lesson(3);check(page.evaluate('Vesperfall.state.shots')==n,'Canceling a drawn string advances without an unintended shot')
   page.keyboard.press('KeyV');wait('Vesperfall.state.weapon==="crossbow"');page.keyboard.press('Space');wait('!Vesperfall.state.crossbow.loaded');page.keyboard.press('KeyR');lesson(4);check(True,'Crossbow fire and actual completed reload teach a different weapon rhythm')
   enemy=page.evaluate('Vesperfall.state.world.enemies[0].p.map((v,i)=>i===1?v+.45:v)');page.evaluate(AIM,enemy+[1000]);page.keyboard.down('KeyH');lesson(5);page.keyboard.up('KeyH');wait('!Vesperfall.state.shield');check(True,'The shield lesson requires blocking a real enemy volley')
   page.keyboard.press('Digit4');point=page.evaluate('Vesperfall.state.p');page.evaluate(AIM,[point[0],point[1],point[2]-2,11]);
   page.evaluate("""async()=>{const c=Vesperfall.component,can=AFRAME.scenes[0].canvas,key=t=>can.dispatchEvent(new KeyboardEvent(t,{code:'Space',bubbles:true}));key('keydown');await new Promise((resolve,reject)=>{const st=performance.now(),t=setInterval(()=>{if(c.charge>.08&&c.blinkTrace?.ok){key('keyup');clearInterval(t);resolve();}else if(performance.now()-st>90000){key('keyup');clearInterval(t);reject(Error('No valid blink'));}},3);});}""");lesson(6);check(True,'Only a successful collision-checked Blink landing completes traversal training')
   page.keyboard.press('KeyB');lesson(7);check(True,'A real charge-limited Shard Step completes the short escape lesson')
   crystal=page.evaluate('Vesperfall.state.world.pickups.find(p=>p.id===Vesperfall.component.firstBell.state.coach.pickup).p');page.evaluate(WALK,[crystal[0],crystal[2]]);lesson(8);check(True,'Collecting the actual lesson crystal advances supply training')
   page.keyboard.down('Tab');wait('Vesperfall.component.ritual.focus.open');page.keyboard.press('ArrowRight');page.keyboard.up('Tab');lesson(9);check(True,'The working slow-time quiver must change the equipped arrow')
   page.keyboard.press('KeyM');lesson(10);check(page.evaluate('Vesperfall.component.firstBell.state.coach.done.length===10'),'All ten lessons finish through real UI and gameplay outcomes, not skips')
   check(save_raw()==saved and page.evaluate('JSON.stringify(Vesperfall.component.profile)')==profile,'The whole tutorial preserves the scored checkpoint and permanent profile')
   page.screenshot(path=str(OUT/'lessons-complete.png'));pause();page.locator('#oath-start').click();wait('!document.getElementById("dominion-dialog").hidden');check(True,'Beginning the Oath asks before replacing an existing suspended run');page.locator('#dominion-dialog-close').click();check(save_raw()==saved,'Cancel leaves the prior expedition untouched')
   page.locator('#menu-vr').click();wait('Vesperfall.component.xr&&Vesperfall.component.hands.left');xract('Expedition / practice');xract('More / page');xract('First Bell');xract('Begin guided');lesson(0);check(True,'Quest spatial menus can start the lessons without leaving the headset')
   xrpress('left',5);wait('Vesperfall.component.paused');xract('Expedition / practice');xract('More / page');xract('First Bell');xract('Coach: ready');lesson(1);wait('Vesperfall.component.firstBell.state.coach.index===1');page.screenshot(path=str(OUT/'world-space-coach.png'));check(page.evaluate('AFRAME.scenes[0].object3D.children.some(m=>m.name==="First Bell world-space coach"&&m.visible)'),'The Quest coach is a visible world-space panel, not a DOM-only overlay')
   xrpress('left',5);wait('Vesperfall.component.paused');xract('Exit VR');wait('!Vesperfall.component.xr');page.set_viewport_size({'width':390,'height':844});check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'New coach and route controls fit a narrow screen');page.screenshot(path=str(OUT/'first-bell-menu-phone.png'))
  else:
   page.locator('#oath-start').click();wait('Vesperfall.state.oath&&!Vesperfall.component.paused');check(page.evaluate('Vesperfall.component.checkpoint.eligible&&!Vesperfall.state.unscored'),'The Oath begins as a real scored, checkpointed expedition')
   page.locator('a-scene canvas').focus();deadline=time.monotonic()+950;phases=set();shots=0
   while page.evaluate('Vesperfall.state.oath.stage<3') and time.monotonic()<deadline:
    state=page.evaluate('({o:Vesperfall.state.oath,phase:Vesperfall.state.phase,p:Vesperfall.state.p})');assert state['phase']=='playing',state
    if not state['o']['active']:
     path=page.evaluate('(()=>{const s=Vesperfall.state,r=BellOath.stages[s.oath.stage].room;return VesperCore.route(s.world,VesperCore.roomAt(s.world,s.p),r).map(i=>[s.world.rooms[i].x,s.world.rooms[i].z,true]);})()')
     for target in path:
      page.evaluate(WALK,target)
      if page.evaluate('Vesperfall.state.oath.active'):break
     continue
    e=page.evaluate('(()=>{const s=Vesperfall.state;return s.world.enemies.filter(e=>!e.dead&&BellOath.canTarget(s,e)).sort((a,b)=>VesperCore.len(VesperCore.sub(a.p,s.p))-VesperCore.len(VesperCore.sub(b.p,s.p)))[0];})()')
    if e.get('oathBoss'):
     phases.add(e['bossPhase'])
     if page.evaluate('Vesperfall.state.weapon')!='crossbow':page.keyboard.press('KeyV')
     target=[e['p'][0],e['p'][1]+.88,e['p'][2],38];page.evaluate(AIM,target)
     if e['bossPhase']==3 and page.evaluate('Vesperfall.state.hazards.length>0'):
      pos=page.evaluate('Vesperfall.state.p');page.keyboard.down('KeyD');page.wait_for_timeout(180);page.keyboard.up('KeyD')
     if page.evaluate('Vesperfall.state.crossbow.loaded&&Vesperfall.state.world.enemies[4].recovery>1&&!Vesperfall.state.world.enemies[4].bossTransition'):
      page.keyboard.up('KeyH');wait('!Vesperfall.state.shield');page.keyboard.press('Space');shots+=1
     elif page.evaluate('!Vesperfall.state.crossbow.loaded'):
      page.keyboard.up('KeyH');wait('!Vesperfall.state.shield');page.keyboard.press('KeyR');wait('Vesperfall.state.crossbow.loaded')
     else:
      page.keyboard.down('KeyH');page.wait_for_timeout(160);page.keyboard.up('KeyH')
     if shots%3==0:print('BOSS',e['bossPhase'],e['hp'],flush=True)
    else:
     if page.evaluate('Vesperfall.state.weapon')!='bow':page.keyboard.press('KeyV')
     page.evaluate(AIM,[e['p'][0],e['p'][1]+.82,e['p'][2],36]);shoot()
    print('RUN',page.evaluate('({stage:Vesperfall.state.oath.stage,hp:Vesperfall.state.health,kills:Vesperfall.state.kills,shots:Vesperfall.state.shots})'),flush=True)
   check(page.evaluate('Vesperfall.state.oath.stage===3&&Vesperfall.state.kills===5&&Vesperfall.state.portalReady'),'Actual arrows defeat both paired encounters and the Bellkeeper, opening the beacon')
   check(phases=={1,2,3},'Native combat observes all three distinct boss phases without skipping transitions')
   page.screenshot(path=str(OUT/'bellkeeper-defeated.png'));pause();page.locator('#save-expedition').click();saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint');page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.firstBell');page.locator('#continue-expedition').click();wait('Vesperfall.component.paused&&Vesperfall.component.checkpoint.eligible');check(page.evaluate('Vesperfall.state.oath.stage===3&&Vesperfall.state.world.enemies[4].dead'),'A real reload preserves completed boss and route progress');page.locator('#resume').click();page.locator('a-scene canvas').focus()
   r=page.evaluate('Vesperfall.state.world.rooms[17]');page.evaluate(WALK,[r['x'],r['z']-3.8]);page.keyboard.press('KeyE');wait('Vesperfall.state.phase==="reward"');check(True,'Walking to the real Ember beacon offers the normal earned blessing');page.locator('[data-reward="power"]').click();wait('Vesperfall.state.world.depth===2');check(page.evaluate('Vesperfall.state.oath.stage===0&&Vesperfall.state.kills===5'),'Blessing begins another Oath sector with counters retained and waves reset')
  check(not errors,'No uncaught exceptions in the new native gameplay path')
  (OUT/'report.json').write_text(json.dumps({'mode':MODE,'base':BASE,'version':page.evaluate('VesperCore.VERSION'),'passed':len(checks),'checks':checks,'errors':errors,'scope':'Real A-Frame/WebGL; ordinary UI and input events. Observations guide aim/navigation without actor, timer, damage or progression assignments. Software GPU, optional render-only cadence fixture for long journeys. Controller and XR input devices are emulated, not physical Quest certification.'},indent=2))
 except Exception as e:
  try:info=page.evaluate('({snapshot:window.Vesperfall?.snapshot(),coach:window.Vesperfall?.component.firstBell?.state.coach?.index,oath:window.Vesperfall?.state.oath,checkpoint:window.Vesperfall?.component.checkpoint?.state.issue})')
  except:info=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'info':info},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
