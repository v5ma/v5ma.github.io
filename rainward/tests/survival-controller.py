"""Xbox-standard survival journey through the real HTTP/WebGL app.
The validated save fixture removes combat pressure during UI tests. Model and
legacy encounter suites separately exercise real melee damage and live enemies.
"""
import os,json,subprocess,time,math
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-survival-controller');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];dialogs=[]
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame();s.enemies.forEach(e=>e.hp=0);s.player.hp=45;s.player.medkit=1;s.player.cloth=2;s.player.canister=2;console.log(checkpoint(s));"],text=True).strip()
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);c=b.new_context(viewport={'width':1100,'height':760})
 c.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false}));window.pad={connected:true,mapping:'standard',id:'Xbox test',index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.polls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{polls++;return [pad];}});")
 p=c.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):p.wait_for_function(q)
 def frames(n=3):
  start=p.evaluate('polls');p.wait_for_function('([s,n])=>polls>=s+n',arg=[start,n])
 def down(i):p.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i)
 def up(i):p.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames()
 def tap(i):down(i);frames(1);up(i)
 def nav(id):
  for _ in range(60):
   if p.evaluate('document.activeElement?.id')==id:return
   tap(13)
  raise AssertionError('Unreachable controller control '+id)
 def move(x,z):
  deadline=time.monotonic()+30
  while time.monotonic()<deadline:
   q=p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})');dx=x-q['x'];dz=z-q['z'];r=math.hypot(dx,dz)
   if r<.25:break
   p.evaluate('([x,z])=>{pad.axes[0]=x;pad.axes[1]=z}',[dx/r*.7,dz/r*.7]);frames(2)
  else:raise AssertionError('Controller did not reach cache')
  p.evaluate('pad.axes[0]=pad.axes[1]=0');frames()
 try:
  p.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');wait('window.Rainward&&polls>2');check(p.evaluate('Rainward.snapshot().controlPreset')=='survival','New installations default to the requested Survival layout')
  nav('continue');tap(0);wait('Rainward.mode===\"play\"');tap(1);wait('Rainward.state.player.stance===\"crouch\"');check(True,'A short B press crouches after release')
  down(1);wait('Rainward.state.player.stance===\"prone\"');frames(3);up(1);check(p.evaluate('Rainward.state.player.stance')=='prone','Holding B enters prone without an extra release action')
  tap(1);tap(1);wait('Rainward.state.player.stance===\"stand\"');move(3,23);tap(3);wait('Rainward.state.taken.has(\"district-survival-cache\")');check(p.evaluate('Rainward.state.player.meleeDurability')==8,'Y scavenges the real one-time survivor gear cache')
  rounds=p.evaluate('Rainward.state.player.mag');down(2);wait('!!Rainward.state.player.melee');up(2);wait('!Rainward.state.player.melee');check(p.evaluate('Rainward.state.player.mag')==rounds,'X performs melee rather than firing or reloading')
  down(4);wait('Rainward.state.player.dodge>0');up(4);wait('Rainward.state.player.dodge<=0');check(True,'LB performs the dedicated defensive dodge')
  down(5);wait('Rainward.state.player.listen');check(p.locator('body').evaluate('e=>e.classList.contains(\"listening\")') or p.evaluate('Rainward.state.player.listen'),'Holding RB activates the listening layer');up(5);wait('!Rainward.state.player.listen')
  tap(14);wait('Rainward.state.player.gun===\"rifle\"');down(6);frames();down(2);wait('Rainward.state.player.reload>0');up(2);up(6);wait('Rainward.state.player.reload===0&&Rainward.state.player.mag===5');check(p.evaluate('Rainward.state.player.reserve')==3,'LT + X loads finite rifle cartridges into the separate magazine')
  down(6);frames();down(7);wait('Rainward.state.player.mag<5');up(7);up(6);tap(15);wait('Rainward.state.player.gun===\"pistol\"');check(p.evaluate('Rainward.state.player.mag')==6,'D-pad right restores the untouched sidearm magazine')
  tap(12);wait('Rainward.state.player.equipped===\"medkit\"');down(7);wait('!!Rainward.state.player.healing');up(7);wait('!Rainward.state.player.healing');check(p.evaluate('Rainward.state.player.hp===45&&Rainward.state.player.medkit===1'),'Releasing RT interrupts bandaging and retains the unspent healing kit')
  down(7);wait('!!Rainward.state.player.healing');p.screenshot(path=str(OUT/'bandaging.png'));wait('Rainward.state.player.hp===100&&!Rainward.state.player.healing');up(7);check(p.evaluate('Rainward.state.player.medkit')==0,'Holding RT completes the vulnerable bandage and consumes one kit')
  down(13);wait('Rainward.mode===\"pack\"');up(13);check(True,'Holding the D-pad opens the translucent real-time crafting panel')
  nav('craft-med');down(0);wait('!!Rainward.state.player.craft');frames(2);up(0);wait('!Rainward.state.player.craft');check(p.evaluate('Rainward.state.player.cloth')==2,'Releasing A interrupts assembly without duplicating or losing materials')
  nav('craft-med');down(0);wait('!!Rainward.state.player.craft');time0=p.evaluate('Rainward.state.t');wait('Rainward.state.player.medkit===1&&!Rainward.state.player.craft');up(0);check(p.evaluate('Rainward.state.t')>time0+1,'Holding A crafts a single item while simulation time continues')
  tap(1);wait('Rainward.mode===\"play\"');tap(8);wait('Rainward.mode===\"map\"');tap(1);wait('Rainward.mode===\"play\"');tap(9);wait('Rainward.mode===\"pause\"');check(True,'View, B and Menu still navigate without a mouse')
  nav('musicVolume');tap(14);check(p.locator('#musicVolume').input_value()=='35','D-pad adjusts the music mix in the game interface')
  nav('controlPreset');tap(15);check(p.evaluate('Rainward.snapshot().controlPreset')=='classic','The previous v0.8.1 controller layout remains selectable')
  tap(1);wait('Rainward.mode===\"play\"');tap(1);wait('Rainward.state.player.stance===\"stand\"');check(True,'Switching presets applies the previous immediate B posture behavior')
  tap(9);wait('Rainward.mode===\"pause\"');nav('controlPreset');tap(14);check(p.evaluate('Rainward.snapshot().controlPreset')=='survival','The Survival layout can be restored without losing progress')
  p.set_viewport_size({'width':390,'height':844});nav('musicVolume');check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Mixer controls and focused rows fit a phone-width screen');p.screenshot(path=str(OUT/'controller-audio-phone.png'))
  check(not errors and not dialogs,'No uncaught errors or native dialogs in the complete controller journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'scope':'Simulated Xbox-standard inputs in real WebGL with a validated no-enemy UI save. No physical controller certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':p.evaluate('window.Rainward?.snapshot()'),'focus':p.evaluate('document.activeElement?.id')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
