"""Native HUD regression. A declared initial save tracks an upstairs house job.
No live actor/progression writes, renderer rewrites or synthetic pointer clicks.
This is a layout fixture, separate from the fresh 41-check Xbox journey.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'doors-layout-output';OUT.mkdir(exist_ok=True)
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
fixture={'version':2,'credits':0,'score':0,'deliveries':[],'relay':False,'completed':False,'folio':False,'defeated':False,'upgraded':False,'doors':{'version':1,'homes':{'workshop':1},'tracked':{'kind':'home','id':'workshop'}}}
checks=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script('localStorage.setItem("svgn.leonardos-guild.v1",'+json.dumps(json.dumps(fixture))+');window.__pad={id:"Xbox virtual layout fixture",index:0,connected:true,mapping:"standard",axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,"getGamepads",{value:()=>[window.__pad]});')
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 def press(n):page.evaluate('(n)=>new Promise(done=>{const b=v=>Array.from({length:17},(_,i)=>({pressed:i===v,value:i===v?1:0}));window.__pad.buttons=b(n);requestAnimationFrame(()=>{window.__pad.buttons=b(-1);requestAnimationFrame(()=>requestAnimationFrame(done));});})',n)
 try:
  page.goto(base+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild?.inspect().controller.connected')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');page.wait_for_selector('#doors-objective:not([hidden])')
  for width,height in [(1280,800),(900,700),(390,844),(700,480)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(400)
   boxes=page.evaluate('''()=>{const a=document.getElementById('mission').getBoundingClientRect(),b=document.getElementById('doors-objective').getBoundingClientRect();return {mission:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},objective:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},overlap:a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y,inBounds:b.x>=0&&b.right<=innerWidth&&b.y>=0&&b.bottom<=innerHeight,progress:LeonardoGuild.inspect().doors.homes.workshop};}''')
   assert not boxes['overlap'],str((width,height,boxes));assert boxes['inBounds'],str(boxes);assert boxes['progress']==1
   checks.append({'viewport':[width,height],'boxes':boxes});page.screenshot(path=str(OUT/f'hud-{width}x{height}.png'))
  page.set_viewport_size({'width':1280,'height':800});press(9);assert page.evaluate('LeonardoGuild.inspect().controller.modal')=='pause-dialog';press(1);assert page.evaluate('LeonardoGuild.inspect().running')
  assert not errors,errors
 finally:
  (OUT/'report.json').write_text(json.dumps({'fixture':'Initial valid save with a tracked upstairs workshop task; no live state writes.','checks':checks,'errors':errors,'source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()},indent=2));page.screenshot(path=str(OUT/'last.png'));browser.close()
print('PASS: objective and original mission remain separate on four viewports; Xbox pause/back remains usable.')
