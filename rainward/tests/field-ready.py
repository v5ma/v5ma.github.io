"""Native HTTP/WebGL acceptance for chapter saves, equipment and production UI.
The initial validated legacy save removes enemies only for the equipment test.
New chapter starts use ordinary authored states. No live game-state assignments.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from ui_flow import finish_transition,EXPECTED_VERSION
OUT=Path('test-output/rainward-field-ready');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame();s.enemies.forEach(e=>e.hp=0);s.player.hp=47;s.player.medkit=1;console.log(checkpoint(s));"],text=True).strip()
checks=[];errors=[];dialogs=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS: '+text,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block')
 c.add_init_script("if(!localStorage.getItem('fixture-seeded')){localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('fixture-seeded','1');}localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false}));window.pad={connected:true,mapping:'standard',id:'Field ready standard pad',index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return[pad];}});")
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):p.wait_for_function(q)
 def frames(n=2):
  before=p.evaluate('padPolls');p.wait_for_function('([x,n])=>padPolls>=x+n',arg=[before,n])
 def button(i,on):p.evaluate('([i,on])=>pad.buttons[i]={pressed:on,value:on?1:0}',[i,on])
 def press(i,condition=None):
  # A mouse-triggered mode change resets the pad; observe neutral frames first.
  # Keep held-input suppression in the real game rather than bypassing it.
  frames()
  button(i,True)
  if condition:wait(condition)
  else:frames()
  button(i,False);frames()
 def nav(id):
  for _ in range(130):
   if p.evaluate('document.activeElement?.id')==id:return
   press(13)
  raise AssertionError('Controller could not reach '+id)
 def title():
  press(9,'Rainward.mode==="pause"');p.locator('#to-title').click();finish_transition(p,'title')
 try:
  p.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2')
  check(p.evaluate('Rainward.snapshot().version')==EXPECTED_VERSION,'The actual game loads the declared Field Ready release')
  check(p.evaluate('Rainward.snapshot().saves.filter(x=>x.occupied).length')==1,'An existing legacy shelter appears as one occupied chapter slot')
  check(p.evaluate("localStorage.getItem('svgn.rainward.v1.checkpoint')")==fixture,'Reading the save selector does not overwrite the legacy checkpoint')
  nav('chapter-continue');press(0,'Rainward.mode==="play"');check(p.evaluate('Rainward.state.player.hp')==47,'Continue Selected restores that chapter rather than starting over')
  press(13,'Rainward.mode==="pack"');nav('equip-rifle');press(0,'Rainward.state.player.gun==="rifle"');check(p.evaluate('Rainward.state.player.mag+Rainward.state.player.reserve')==0,'The controller equips an empty rifle without inventing ammunition')
  nav('equip-pistol');press(0,'Rainward.state.player.gun==="pistol"');check(p.evaluate('Rainward.state.player.mag')==6,'The controller restores the separate sidearm magazine')
  nav('equip-medkit');press(0,'Rainward.state.player.equipped==="medkit"');p.screenshot(path=str(OUT/'equipment-controller.png'));press(1,'Rainward.mode==="play"');button(7,True);wait('Rainward.state.player.hp===100');button(7,False);frames();check(p.evaluate('Rainward.state.player.medkit')==0,'An item selected in the satchel works with the same hold-RT healing action')
  title();chapters=['conservatory','terminus','meridian','breakwater','whiteout']
  for chapter in chapters:
   p.locator('#chapter-select').select_option(chapter);p.locator('#start').click();wait('Rainward.mode==="play"');check(p.evaluate('Rainward.state.level')==chapter,chapter+' starts without replacing a different chapter shelter');title()
  saved=p.evaluate("JSON.parse(localStorage.getItem('svgn.rainward.v2.chapter-checkpoints'))")
  check(len(saved['slots'])==6,'All six chapter save slots coexist in persistent storage')
  check(saved['slots']['district']['checkpoint']==fixture,'Starting five other chapters preserves the original district save byte-for-byte')
  p.locator('#chapter-select').select_option('district');p.locator('#chapter-continue').click();wait('Rainward.mode==="play"');check(p.evaluate('Rainward.state.player.hp')==47,'Continuing an older chapter restores its own previous shelter state');title()
  p.locator('#start').click();wait('Rainward.mode==="confirm"');check(p.evaluate('document.activeElement.id')=='confirm-no','Restarting an occupied chapter defaults to Cancel');press(1,'Rainward.mode==="title"');check(p.evaluate("JSON.parse(localStorage.getItem('svgn.rainward.v2.chapter-checkpoints')).slots.district.checkpoint")==fixture,'Cancel leaves the selected checkpoint unchanged')
  p.locator('#start').click();wait('Rainward.mode==="confirm"');press(15);press(0,'Rainward.mode==="play"');after=p.evaluate("JSON.parse(localStorage.getItem('svgn.rainward.v2.chapter-checkpoints'))");check(all(after['slots'][x]==saved['slots'][x] for x in chapters),'Confirming a district restart leaves the other five slots unchanged')
  p.reload(wait_until='domcontentloaded');wait('window.Rainward');check(p.evaluate('Rainward.snapshot().saves.filter(x=>x.occupied).length')==6,'All six slots remain available after a full page reload')
  p.goto(BASE+'/rainward/roadmap.html',wait_until='domcontentloaded');p.wait_for_function('document.querySelectorAll("details.task").length===64');check(p.locator('section.gate').count()==8,'The production board contains 64 tasks across eight acceptance gates')
  p.locator('#phase-filter').select_option('G5');check(p.locator('details.task').count()==8,'Production gate filtering shows the eight sound and music tasks')
  p.locator('#phase-filter').select_option('');p.locator('#status-filter').select_option('Blocked');check(p.locator('details.task').count()==3,'Unfinished approval gates remain explicitly blocked rather than marked complete')
  p.locator('#status-filter').select_option('');p.locator('#task-RW-001').click();p.locator('#review-RW-001').check();check(p.locator('#approved-count').inner_text()=='0','A local review checkmark cannot fabricate human acceptance sign-off');check('1 local review marks' in p.locator('#filter-result').inner_text(),'Local review count updates without rebuilding the focused task')
  p.reload(wait_until='domcontentloaded');p.wait_for_function('document.querySelectorAll("details.task").length===64');p.locator('#task-RW-001').click();check(p.locator('#review-RW-001').is_checked(),'Local review marks persist separately from delivery status')
  p.set_viewport_size({'width':390,'height':844});check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The production board fits a phone-width viewport');p.screenshot(path=str(OUT/'roadmap-phone.png'));p.set_viewport_size({'width':1180,'height':780});p.screenshot(path=str(OUT/'roadmap-desktop.png'))
  press(9,'document.activeElement?.id==="phase-filter"');press(15);check(p.locator('#phase-filter').input_value()=='G0','D-pad adjusts the production gate filter without a native popup')
  c.route('**/rainward/production-plan.json',lambda route:route.fulfill(status=503,body='Temporary plan outage'))
  p.goto(BASE+'/rainward/roadmap.html',wait_until='domcontentloaded');p.locator('#load-error').wait_for(state='visible');frames()
  check(p.locator('#checklist-source').is_visible(),'A failed plan request keeps the text checklist link available')
  press(1);wait('!!window.Rainward&&Rainward.mode==="title"')
  check(True,'B returns from a failed roadmap load without needing the mouse')
  check(not errors and not dialogs,'No uncaught browser errors or native blocking dialogs during the journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'scope':'Native HTTP/WebGL, ordinary menu actions and emulated standard gamepad. Legacy save fixture only; no physical controller certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'dialogs':dialogs}
  try:data['snapshot']=p.evaluate('window.Rainward?.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:b.close()
