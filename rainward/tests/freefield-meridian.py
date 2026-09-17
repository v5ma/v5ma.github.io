"""Earned Meridian expedition with actual Xbox events and no actor-state writes.
Synthetic read-only route/health guidance is not unfamiliar-player approval.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/freefield-meridian');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];trace=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);ctx=browser.new_context(viewport={'width':1024,'height':700},service_workers='block',record_video_dir=str(OUT/'video'))
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'classic',toggleSprint:false,mute:true,low:true,scanned:false,cinematic:false,detailedHumans:true}));window.pad={connected:true,mapping:'standard',index:0,id:'Meridian virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.polls=0;window.pulses=[];Object.defineProperty(navigator,'getGamepads',{value:()=>{polls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of pulses)buttons[i]={pressed:true,value:1};pulses=[];return [{...pad,axes:[...pad.axes],buttons}];}});")
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):page.wait_for_function(q)
 def frames(n=2):
  old=page.evaluate('polls');page.wait_for_function('([old,n])=>polls>=old+n',arg=[old,n])
 def tap(i):frames();page.evaluate('(i)=>pulses=[i]',i);frames(3)
 def nav(id):
  for _ in range(130):
   if page.evaluate('document.activeElement.id')==id:return
   tap(13)
  raise AssertionError('No controller route to '+id)
 def check(v,label):
  assert v,label
  checks.append(label);print('PASS',label,flush=True)
 def use(q):tap(3);wait(q)
 def record(label):
  trace.append({'label':label,'state':page.evaluate('Rainward.snapshot()')});(OUT/'trace.json').write_text(json.dumps(trace,indent=2))
 def capture(label):
  tap(9);wait('Rainward.mode==="pause"');page.screenshot(path=str(OUT/(label+'.png')));tap(1);wait('Rainward.mode==="play"')
 def go(x,z):
  page.evaluate('pad.axes=[0,0,0,0];pad.buttons[10]={pressed:false,value:0}');frames(3)
  page.evaluate('''async({x,z})=>{const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});if(!route.length&&W.dist(Rainward.state.player,{x,z})>1)throw Error('No route');route.push({x,z});await new Promise((resolve,reject)=>{let i=0,lastHeal=-Infinity;const begin=performance.now(),timer=setInterval(()=>{const p=Rainward.state.player,stop=()=>{clearInterval(timer);pad.axes=[0,0,0,0];pad.buttons[10]={pressed:false,value:0};};if(Rainward.mode!=='play'||performance.now()-begin>100000){stop();reject(Error('Movement interrupted '+JSON.stringify({goal:route[i],hp:p.hp,x:p.x,z:p.z})));return;}if(p.hp<55&&p.medkit>0&&performance.now()-lastHeal>700){pulses.push(12);lastHeal=performance.now();}const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.35){if(++i===route.length){stop();resolve();}return;}const yaw=Rainward.view.yaw,scale=Math.max(.35,Math.min(1,d));pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;pad.buttons[10]={pressed:true,value:1};},20);});}''',{'x':x,'z':z});frames(3);record('arrive '+str((x,z)))
 def craft():
  tap(13);wait('Rainward.mode==="pack"');nav('craft-med');before=page.evaluate('Rainward.state.player.medkit');tap(0);page.wait_for_function('(n)=>Rainward.state.player.medkit===n+1&&!Rainward.state.player.craft',arg=before);tap(1);wait('Rainward.mode==="play"')
 try:
  page.goto(BASE+'/rainward/?chapter=meridian',wait_until='domcontentloaded');wait('window.Rainward&&polls>2');check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No planted checkpoint starts the new level')
  nav('start');tap(0);wait('Rainward.mode==="play"');check(page.evaluate('Rainward.state.enemies.length===9&&Rainward.state.enemies.every(e=>e.hp>0)'),'Meridian starts with all nine authored enemies alive')
  go(2,56);use('Rainward.state.taken.has("meridian-kit")');craft();craft();check(page.evaluate('Rainward.state.player.medkit===2&&Rainward.state.player.cloth===0&&Rainward.state.player.canister===0'),'Preparation uses only the original finite arrival cache')
  tap(8);wait('Rainward.mode==="map"');check('Sealed water filter' in page.locator('#next-goal').text_content(),'The actual map clearly names the next required goal');page.screenshot(path=str(OUT/'01-goal-map.png'));tap(1);wait('Rainward.mode==="play"')
  go(-42,35);use('Rainward.state.puzzle.clueRead');go(-43,20);use('Rainward.state.objectives.cell');check(page.evaluate('Rainward.state.player.y>2.3'),'The clinic objective sits on a genuinely raised walkable terrace')
  go(-34,34);use('Rainward.state.completedTasks.includes("clinic-power")');go(-41,29);go(-42,29);use('Rainward.state.puzzle.wheels[0]===1');use('Rainward.state.puzzle.wheels[0]===2');go(-47,31);use('Rainward.state.checkpoint==="meridian-clinic"');capture('02-clinic-courtyard')
  go(0,-29);check(page.evaluate('Rainward.state.player.y< -2.3'),'Actual movement descends into the sunken drainage route')
  go(42,-27);use('Rainward.state.objectives.crank');check(page.evaluate('Rainward.state.player.y>5.9'),'Actual movement climbs the reading-hall ridge to recover its original key')
  go(42,-15);use('Rainward.state.puzzle.solved');go(45,-12);use('Rainward.state.checkpoint==="meridian-library"');capture('03-reading-hall')
  check(page.evaluate('Rainward.state.puzzle.wheels.join(",")==="2,0,1"'),'The original three-part pressure mechanism still opens the gate')
  go(0,-72);use('Rainward.state.completedTasks.includes("meridian-signal")');go(0,-80);use('Rainward.mode==="won"');final=page.evaluate('Rainward.snapshot()')
  check(final['objectives']=={'cell':True,'crank':True} and final['player']['hp']>0,'The real redesigned expedition reaches extraction with its original requirements')
  check(all(e['hp']>0 for e in final['enemies']) and final['stats']['shots']==0,'Faster movement and learned routes can finish without removing or killing enemies')
  page.screenshot(path=str(OUT/'04-extraction.png'));page.reload(wait_until='domcontentloaded');wait('window.Rainward');nav('continue');tap(0);wait('Rainward.mode==="play"');check(page.evaluate('Rainward.state.checkpoint==="meridian-library"&&Rainward.state.objectives.cell&&Rainward.state.objectives.crank&&Rainward.state.puzzle.solved'),'Browser reload restores the earned reading-hall shelter with unchanged checkpoint format')
  check(not errors and not console,'No captured JavaScript or shader errors in the complete new-level journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'final':final,'errors':errors,'console':console,'scope':'Normal-start Meridian with all enemies, real HTTP/WebGL and synthetic standard Xbox input. Read-only path and finite-medkit guidance, no planted save, actor assignment, damage override or reward grant. Not unfamiliar-player, physical Xbox/Quest, final-art or comfort approval.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['state']=page.evaluate('Rainward.snapshot()');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
