"""Sequential input-only campaign acceptance. Synthetic Xbox, real renderer and simulation.
No player/enemy/mission state setters; inspection only steers ordinary controls."""
import asyncio,json,os,traceback
from pathlib import Path
from playwright.async_api import async_playwright
BASE=os.getenv('WARD_BASE','http://127.0.0.1:8765/svgn-planet/lantern-ward.html')
OUT=Path(os.getenv('CAMPAIGN_OUT','campaign-results'));OUT.mkdir(parents=True,exist_ok=True)
PAD="""window.__pad={id:'Xbox / campaign acceptance',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad]});"""
async def main():
 report={'suite':'campaign','checks':[],'errors':[],'consoleErrors':[],'physicalHardwareTested':False,'inputOnly':True}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.getenv('CHROMIUM_EXECUTABLE'),headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':1100,'height':800});await context.add_init_script(PAD);page=await context.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:report['errors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None)
  async def state():return await page.evaluate('LanternWard.inspect()')
  async def wait(q):await page.wait_for_function(q,timeout=90000)
  async def frames(n=3):
   before=(await state())['frames'];await wait('LanternWard.inspect().frames>='+str(before+n))
  async def press(i,n=2):
   await page.evaluate('(i)=>__pad.buttons[i]={pressed:true,value:1}',i);await frames(n);await page.evaluate('(i)=>__pad.buttons[i]={pressed:false,value:0}',i);await frames(3)
  async def hold(indices,n):
   await page.evaluate('(ids)=>ids.forEach(i=>__pad.buttons[i]={pressed:true,value:1})',indices);await frames(n);await page.evaluate('(ids)=>ids.forEach(i=>__pad.buttons[i]={pressed:false,value:0})',indices);await frames(4)
  async def neutral():await page.evaluate('__pad.axes=[0,0,0,0];__pad.buttons.forEach(b=>{b.pressed=false;b.value=0})');await frames(4)
  async def pilot(x,z,limit=3000):
   for _ in range(limit):
    q=await page.evaluate("""([x,z])=>{const q=LanternWard.inspect(),s=q.state,dx=x-s.x,dz=z-s.z,d=Math.hypot(dx,dz),stop=d<.25;__pad.axes[0]=stop?0:(dx*q.basis.right[0]+dz*q.basis.right[1])/(d||1);__pad.axes[1]=stop?0:-(dx*q.basis.forward[0]+dz*q.basis.forward[1])/(d||1);__pad.buttons[6]={pressed:stop,value:stop?1:0};return {d,speed:s.speed,failed:q.failed,paused:q.paused};}""",[x,z])
    assert not q['failed'] and not q['paused'],q
    if q['d']<.30 and q['speed']<.06:await neutral();return
    await frames(2)
   raise AssertionError('Cannot reach '+str((x,z))+' '+str(q))
  async def route(points):
   for x,z in points:await pilot(x,z)
  async def mission(mid):
   if not (await state())['paused']:await press(13)
   await wait('LanternWard.inspect().paused')
   sel='[data-mission='+json.dumps(mid)+']'
   await page.locator(sel).click();await wait('!LanternWard.inspect().paused');await wait('LanternWard.inspect().controllerReady')
  async def aim_enemy():
   return await page.evaluate("""()=>{const q=LanternWard.inspect(),s=q.state,e=q.campaign.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0];if(!e)return null;const dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz),target=Math.atan2(-dx,-dz),error=Math.atan2(Math.sin(target-q.yaw),Math.cos(target-q.yaw));__pad.axes[2]=Math.abs(error)>.07?-Math.sign(error)*Math.min(1,Math.abs(error)*3):0;return {id:e.id,role:e.role,d,phase:e.phase,timer:e.timer,hp:e.hp,x:e.x,z:e.z,y:e.y,yaw:e.yaw};}""")
  async def fight_all(level=None):
   for _ in range(500):
    q=await state();alive=[e for e in q['campaign']['enemies'] if e['hp']>0]
    if not alive:await neutral();return
    if level is not None and all(abs(e['y']-level)>1.5 for e in alive):await neutral();return
    e=await aim_enemy();assert e
    if e['d']>1.8:
     await page.evaluate("""()=>{const q=LanternWard.inspect(),s=q.state,e=q.campaign.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0],dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz);__pad.axes[0]=(dx*q.basis.right[0]+dz*q.basis.right[1])/(d||1);__pad.axes[1]=-(dx*q.basis.forward[0]+dz*q.basis.forward[1])/(d||1);}""");await frames(5)
    else:
     await page.evaluate('__pad.axes[0]=__pad.axes[1]=0')
     if e['phase']=='windup' and e['timer']>.28:
      await hold([6],5) # freshly raised LT guard
     elif e['role']=='Shield':
      # R3 cycles grapple->pulse once, LB uses selected field tool.
      if q['campaign']['selected']!='pulse':await press(11)
      await press(4);await frames(8);await press(7)
     else:await press(7)
     await frames(6)
   raise AssertionError('Freeflow encounter did not finish '+str((await state())['campaign']))
  async def silent_all():
   # Approach each current patrol from behind using its read-only heading, then X.
   for _ in range(12):
    q=await state();alive=[e for e in q['campaign']['enemies'] if e['hp']>0]
    if not alive:return
    e=alive[0];import math
    bx=e['x']-math.sin(e['yaw'])*1.05;bz=e['z']-math.cos(e['yaw'])*1.05
    await pilot(bx,bz,1800);await press(2);await frames(5)
   raise AssertionError('Predator patrols did not clear '+str((await state())['campaign']))
  def ok(name):print('PASS',name,flush=True);report['checks'].append(name)
  async def shot(name):await page.screenshot(path=str(OUT/(name+'.png')))
  async def complete_watch():
   await mission('watch');await pilot(-10,14);await press(2)
   await route([[-12.5,8.2],[-12.5,6],[-9.6,6],[-9.6,2.3]]);await press(14)
   await route([[-12.5,5.2],[-12.5,-3.7],[-6,-3.5],[6,-3.5],[12,-3.5],[12,-2.2]]);await press(2)
   await route([[19.5,1.5],[19.5,10.5],[16,10.5],[14,8],[6,8],[4.5,18]]);await press(2);await route([[0,18],[-10,14]]);await press(2)
   assert (await state())['state']['watch']['stage']==4
  try:
   await page.goto(BASE,wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');await page.bring_to_front();await press(0);await wait('LanternWard.inspect().controllerReady');assert (await state())['version']=='0.15.0';ok('Campaign build boots with the real WebGL chapter')
   await complete_watch();ok('Night Watch prerequisite is completed through ordinary movement and interactions')

   # Case 02 / cape traversal.
   await mission('campaign:flight');await route([[0,18],[4.5,18],[6,8],[14,8],[19.5,10.5],[19.5,1.5],[15,0],[12,0]]);await press(2)
   await route([[12,-3.5],[6,-3.5],[-6,-3.5],[-12,-4.4],[-14.5,-4.4]]);await press(2);assert (await state())['campaign']['progress']['progress']['flight']==2
   await route([[-6,-3.5],[6,-3.5],[12,-2.2]]);await press(2);mode=(await state())['mode'];await pilot(9,-2.2);await press(0);before=(await state())['state']['distance'];await page.evaluate('__pad.buttons[4]={pressed:true,value:1};__pad.buttons[5]={pressed:true,value:1}')
   await wait('LanternWard.inspect().state.x<-9');await page.evaluate('__pad.buttons[4]={pressed:false,value:0};__pad.buttons[5]={pressed:false,value:0}');await wait('LanternWard.inspect().state.speed<.2');q=await state();assert q['state']['distance']>before+8 and q['mode']==mode;ok('Both-bumper cape glide moves through the real level without toggling camera or firing a tool')
   await pilot(-11.5,-4.5);await press(2);await route([[-6,-3.5],[6,-3.5],[12,0]]);await press(2);q=await state();assert 'flight' in q['state']['campaign']['completed'] and q['state']['campaign']['credits']==150;await shot('cape-route');ok('Rooftop Run persists a separate campaign reward and permanent cape traversal')

   # Case 03 / predator space.
   await mission('campaign:predator');await route([[19.5,1.5],[19.5,10.5],[14,8],[6,8],[4.5,18],[0,18],[-10,14]]);await press(2)
   await route([[-12.5,8],[-12.5,5],[-12.5,-3.7],[-10,-4.2]]);await press(2);assert (await state())['state']['campaign']['progress']['predator']==2;await shot('predator-vantage');ok('Predator case first teaches patrol timing from an existing elevated observation route')
   await route([[-18.5,-4],[-18.5,-10],[-14,-15.5]]);await silent_all();await pilot(-10,-17.5);await press(2);assert (await state())['state']['campaign']['progress']['predator']>=3;ok('Patrols can be disabled through close behind takedowns instead of compulsory combat')
   await pilot(-20.5,-2.7);await press(2);await route([[-21,-13.5],[-5,-13.5],[5,-13.5],[18,-17]]);await press(2);await route([[6,-13.5],[4.5,18],[0,18],[-10,14]]);await press(2);assert 'predator' in (await state())['state']['campaign']['completed'];ok('Service vent and greenhouse relay create a complete stealth route with return')

   # Case 04 / functional interiors.
   await mission('campaign:interiors');
   for points in [[[-9.6,1.1]],[[-20.5,-2.7]],[[-10,-17.5]],[[18,-16.5]],[[15,6]]]:
    await route(points);await press(2)
   await pilot(5.8,-13);await press(2);await wait('LanternWard.inspect().state.transition===null&&LanternWard.inspect().state.water==="low"');await route([[-.5,-11],[-.5,-7]]);await press(2);await route([[-.5,-11],[5,-13],[ -9.5,4.5]]);await press(2);assert 'interiors' in (await state())['state']['campaign']['completed'];await shot('interior-systems');ok('Rooms of the Ward links print, kitchen, storehouse, greenhouse, workshop and canal service interiors')

   # Case 05 / freeflow multi-wave combat.
   await mission('campaign:freeflow');await route([[-10,14]]);await press(2);await route([[0,18],[4.5,18],[6,8]]);await fight_all(0);q=await state();assert q['state']['campaign']['progress']['freeflow']>=2;ok('Freeflow court wave uses real lunges, shield tools and timed counters')
   await route([[14,8],[19.5,10.5],[19.5,1.5],[15,0]]);await fight_all(4.4);await route([[19.5,1.5],[19.5,10.5],[14,8],[4.5,18],[0,18],[-10,14]]);await press(2);q=await state();assert 'freeflow' in q['state']['campaign']['completed'] and q['campaign']['bestCombo']>=1;await shot('freeflow-return');ok('Second upper-floor combat wave reconnects to the familiar depot return')

   # Case 06 / finale lets player intentionally change approach.
   await mission('campaign:finale');await route([[0,18],[4.5,18],[6,8],[14,8],[19.5,10.5],[19.5,1.5],[12,0]]);await press(2);await page.keyboard.press('KeyU');await frames(5);assert (await state())['state']['campaign']['route']=='combat';ok('Finale approach can be changed without erasing prior evidence')
   await route([[19.5,1.5],[19.5,10.5],[14,8],[6,8]]);await fight_all();await press(2);await route([[14,8],[19.5,10.5],[19.5,1.5],[20,-3]]);await press(2);await route([[19.5,1.5],[19.5,10.5],[14,8],[4.5,18],[0,18],[-10,14]]);await press(2);q=await state();assert 'finale' in q['state']['campaign']['completed'];assert q['state']['campaign']['credits']==950;ok('Five-case campaign completes through the learned neighborhood with an exactly-once campaign ledger')
   await page.reload(wait_until='domcontentloaded');await wait('window.LanternWard&&!document.querySelector("#start").disabled');q=await state();assert q['state']['campaign']['credits']==950 and len(q['state']['campaign']['completed'])==5;assert q['state']['credits'] in (0,600);assert q['state']['watch']['credits']==180;ok('Reload preserves campaign, Watch and courier ledgers independently')

   assert not report['errors'],report['errors'];assert not report['consoleErrors'],report['consoleErrors'];report['success']=True;report['final']=await state()
  except Exception as e:
   report['success']=False;report['failure']=str(e);report['traceback']=traceback.format_exc();print(report['traceback'],flush=True)
   try:report['final']=await state();await shot('failure')
   except Exception:pass
  finally:(OUT/'report.json').write_text(json.dumps(report,indent=2));await browser.close()
 if not report.get('success'):raise SystemExit(1)
asyncio.run(main())
