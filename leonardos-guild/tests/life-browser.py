"""Served 3D journeys using real keyboard, pointer and dialog controls.
interiors begins fresh. watch/north explicitly load a documented progressed
save fixture; they test a resumed stage, not a claimed new-game playthrough.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time,math,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];MODE=os.getenv('LIFE_SUITE','interiors');OUT=ROOT/'life-output'/MODE;OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];held=set()
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def hold(codes):
 global held
 codes=set(codes)
 for k in held-codes:page.keyboard.up(k)
 for k in codes-held:page.keyboard.down(k)
 held=codes
def stop():
 hold([]);s=read()
 if abs(s['speed'])>.45:
  if s['mode']!='foot':
   sign=1 if s['speed']>0 else -1;hold(['KeyS' if sign>0 else 'KeyW'])
   # A reverse-capable brake may cross zero between software-rendered frames.
   # Release on crossing instead of waiting forever in a tiny absolute window.
   page.wait_for_function('(sign)=>LeonardoGuild.inspect().speed*sign<=.45',arg=sign,timeout=30000);hold([])
  page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.45',timeout=30000)
def drive(x,z,radius=1.1,limit=160):
 page.wait_for_function('LeonardoGuild.inspect().running');page.locator('#world').focus();start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
  if d<radius:stop();return
  angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(2*math.pi)-math.pi;keys=[]
  desired=min(9 if s['mode']=='car' else 8 if s['mode']=='bike' else 4,math.sqrt(max(.1,d-radius)*4))
  if abs(angle)>.5:desired=min(desired,2.8)
  if s['mode']=='foot':
   if abs(angle)<.9:keys.append('KeyW')
  elif s['speed']>desired+.4:keys.append('KeyS')
  elif s['speed']<desired-.2:keys.append('KeyW')
  if angle>.045:keys.append('KeyA')
  if angle<-.045:keys.append('KeyD')
  hold(keys);page.wait_for_timeout(40)
 raise AssertionError('Cannot reach '+str((x,z))+' '+json.dumps(read()))
def interact(action,title=None):
 page.locator('#world').focus();page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]')
 if title:check(title.lower() in page.locator('#life-title').inner_text().lower(),'In-world interaction reaches '+title)
 button=page.locator('[data-use="'+action+'"]');button.click()
 if action!='stairs':page.locator('#life-close').click()
 page.wait_for_function('!LeonardoGuild.inspect().paused');hold([])
def mount():
 s=read();v=s['vehicles']['bike'];drive(v['x']+2.6,v['z']+.6,.7);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="bike"')
def profile(mode):
 if mode=='interiors':return None
 # This is a starting save, never a live actor write. Individual prerequisites
 # and the complete 9-commission dependency chain have deterministic tests.
 code="""import {newState,saveData} from './model.mjs';
 const s=newState();s.credits=250;s.score=700;s.relay=true;s.upgraded=true;s.deliveries=new Set(['mail-0','mail-1','mail-2','mail-3']);
 Object.assign(s.life,{xp:420,quests:{ink:3,cat:3,lantern:3,receipts:2},flags:{ink:true,pippa:true,lantern:true,prism:true,warrant:true}});
 s.life.paid=['quest-ink','quest-cat','quest-lantern'];
 if(process.argv[1]==='north'){s.life.quests.receipts=5;s.life.quests.orchard=2;s.life.flags.charter=true;s.life.flags.ledger=true;s.life.flags.rocco=true;s.life.flags.cog=true;s.life.enemies.rocco=0;s.life.paid.push('quest-receipts');}
 console.log(JSON.stringify(saveData(s)));"""
 return subprocess.check_output(['node','--input-type=module','-e',code,mode],cwd=ROOT,text=True).strip()
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1000,'height':720},service_workers='block',accept_downloads=True,record_video_dir=str(OUT/'video'))
 saved=profile(MODE)
 if saved:context.add_init_script('localStorage.setItem("svgn.leonardos-guild.v1",'+json.dumps(saved)+');')
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/leonardos-guild/index.html?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.locator('#start').click()
  check(read()['version']=='0.3.0','The same hosted game runs the living-town release')
  check(read()['render']['interior']['rooms']==6 and read()['render']['interior']['basements']==2,'Actual renderer constructs six interiors and two basements')
  check(read()['townSize']['zMax']==566,'The same map extends north rather than replacing the starting district')
  page.locator('#notebook-button').click();check(page.locator('.quest').count()==9,'The notebook exposes nine distinct side commissions')
  page.screenshot(path=str(OUT/'commission-notebook.png'));page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
  if MODE=='interiors':
   page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-8,3,1.3);interact('start:ink','Leonardo')
   drive(-9,20);drive(10,24);drive(10,55);drive(16.5,61,.8);drive(22.5,61.5,.8)
   check(read()['render']['interior']['room']=='apothecary','A normal walking route passes the actual doorway into Ada’s shop')
   page.screenshot(path=str(OUT/'adas-apothecary.png'));interact('progress:ink','Ada')
   drive(17,61,.8);drive(10,61);drive(-9,61);drive(-9,24);drive(-17,24,.8);drive(-23,24,.8)
   check(read()['render']['interior']['room']=='workshop','The workshop annex has a physically reachable interior')
   page.screenshot(path=str(OUT/'workshop-interior.png'));drive(-28,20,.8);parked=read()['vehicles'];interact('stairs')
   check(read()['life']['inside']=='workshop' and read()['render']['interior']['below'],'Taking the stairs loads the downstairs room while remaining in the same building')
   check(read()['vehicles']==parked,'Entering a basement leaves the bicycle and carriage parked outside')
   drive(-26,23,1);page.screenshot(path=str(OUT/'workshop-basement.png'));drive(-25,27,.8)
   page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');page.locator('[data-use="rune:water"]').click();check(not read()['life']['flags'].get('prism'),'An incorrect puzzle input does not open the lock')
   for rune in ['leaf','water','star']:page.locator('[data-use="rune:'+rune+'"]').click()
   check(read()['life']['flags']['prism'],'Reading and entering the three-symbol sequence opens the real prism lock')
   page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');drive(-28,20.7,.8);interact('stairs')
   drive(-23,24);drive(-17,24,.8);drive(-9,24);drive(-8,3,1.2);interact('progress:ink','Leonardo')
   check(read()['life']['quests']['ink']==3 and read()['life']['xp']==80,'The complete new ink commission awards experience once after a physical return')
   before=read()['credits'];page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');check(page.locator('[data-use="progress:ink"]').count()==0,'The finished quest cannot be clicked again for repeat rewards');page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
   page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');check(read()['life']['quests']['ink']==3 and read()['credits']==before,'The added quest and rewards survive an actual page reload');page.locator('#start').click()
  elif MODE=='watch':
   drive(0,136,2);drive(80,140,2);drive(90,178,1.3);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(97,178,.7);drive(102,178,.7)
   check(read()['render']['interior']['room']=='inn','The Copper Cat is a walkable inn with a resident innkeeper')
   page.screenshot(path=str(OUT/'copper-cat-inn.png'));drive(108,174.5,.8);interact('stairs');drive(101,175,.6)
   page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');check(page.locator('[data-use="progress:receipts"]').is_disabled(),'Hidden evidence cannot be read without Lantern')
   page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');focus=read()['life']['focus'];page.keyboard.press('KeyR');page.wait_for_function('LeonardoGuild.inspect().life.aura>0')
   check(read()['life']['focus']<focus,'The actual magic action consumes focus')
   page.screenshot(path=str(OUT/'lantern-in-cellar.png'));interact('progress:receipts','ledger');drive(105,179,.8);interact('progress:receipts','Rocco')
   check(read()['life']['flags']['rocco'] and read()['life']['enemies']['rocco']==0,'A warrant and actual discovered evidence permit a peaceful surrender')
   drive(108,174.5,.8);interact('stairs');drive(102,178);drive(97,178);mount()
   drive(80,240,2.5);drive(-80,240,2.5);drive(-90,178,1.3);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-96,178,.8);drive(-102.5,178.5,.8)
   check(read()['render']['interior']['room']=='hall','The mayor is inside an accessible town hall')
   page.screenshot(path=str(OUT/'mayors-hall.png'));interact('progress:receipts','Mayor')
   check(read()['life']['flags']['charter'] and read()['life']['quests']['receipts']==5,'Returning the investigation awards the actual garden charter')
  else:
   drive(0,140,2.5);drive(0,240,2.5);drive(0,390,2.5);stop();page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(0,400,.8)
   check(not read()['life']['flags'].get('garden'),'The extension begins locked in this resumed repair-stage save')
   interact('progress:orchard','pump');check(read()['life']['flags']['garden'],'The actual pump action opens the northern gate')
   drive(0,414,1);page.screenshot(path=str(OUT/'north-gate-open.png'));check(read()['z']>410,'Ordinary movement can now cross the former map boundary')
   drive(0,459,2);drive(17,496,1);drive(23,496,1)
   check(read()['render']['interior']['room']=='observatory','The new garden leads to an actual conservatory interior with Sofia')
   page.screenshot(path=str(OUT/'sofia-conservatory.png'));page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');check('Sofia' in page.locator('#life-title').inner_text(),'The new region has an interactive named resident, not just scenery');page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
   drive(17,496);drive(0,496);drive(0,415);mount();drive(0,218,2);drive(-12,215,1);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-18,215,.7);drive(-23,216,.8)
   check(read()['render']['interior']['room']=='smith','Bartolo’s cycle shop is a real furnished interior')
   interact('progress:orchard','Bartolo');check(read()['life']['quests']['orchard']==4,'Returning to the smith completes the garden-opening quest')
   page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');money=read()['credits'];page.locator('[data-use="buy:cargo"]').click();check(read()['life']['bike']=='cargo' and read()['credits']<money,'The expanded shop sells and equips an actual cargo bicycle')
   page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');page.locator('#notebook-button').click();page.locator('[data-tab="character"]').click();before=read()['attributes']['maxHealth'];page.locator('[data-attribute="vitality"]').click();check(read()['attributes']['maxHealth']==before+12,'A level point changes an actual character attribute')
   page.screenshot(path=str(OUT/'character-progression.png'));page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
  page.set_viewport_size({'width':390,'height':844});page.locator('#notebook-button').click();page.screenshot(path=str(OUT/'portrait-notebook.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'New journal and progression controls fit a narrow screen')
  check(not errors,'No uncaught exceptions during the tested in-world journey')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'final':read(),'initial_save_fixture':json.loads(saved) if saved else None,'scope':'Native HTTP software WebGL. Actual keyboard/UI journeys. Fresh ink quest; documented resumed saves for investigation and garden repair. No live actor, clock, quest or reward assignments.'},indent=2))
 except Exception as e:
  try:s=read()
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
