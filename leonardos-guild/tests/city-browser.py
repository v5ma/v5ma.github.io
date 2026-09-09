"""Native keyboard/pointer acceptance for Lantern Hours.
Nearby and circuit start fresh. Services uses the recorded v0.4 save below.
No test writes live position, time, currency, quest completion or renderer state.
"""
from pathlib import Path
from urllib.parse import urlparse
import os, json, math, time, subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
MODE=os.environ.get('CITY_SUITE','nearby')
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=ROOT/'city-output'/MODE; OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]; held=set()
def check(ok,text):
    assert ok,text
    checks.append(text); print('PASS:',text,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def hold(codes):
    global held
    codes=set(codes)
    for k in held-codes:page.keyboard.up(k)
    for k in codes-held:page.keyboard.down(k)
    held=codes
def stop():
    hold([]); s=read()
    if abs(s['speed'])>.5:
        if s['mode']!='foot':
            sign=1 if s['speed']>0 else -1;hold(['KeyS' if sign>0 else 'KeyW'])
            page.wait_for_function('(sign)=>LeonardoGuild.inspect().speed*sign<=.5',arg=sign,timeout=25000);hold([])
        page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.5',timeout=25000)
def drive(x,z,radius=1.1,limit=160):
    page.wait_for_function('LeonardoGuild.inspect().running');page.locator('#world').focus();start=time.monotonic()
    while time.monotonic()-start<limit:
        s=read(); dx=x-s['x']; dz=z-s['z']; d=math.hypot(dx,dz)
        if d<radius:stop();return
        angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi;codes=[]
        desired=min(8 if s['mode']=='bike' else 4,math.sqrt(max(.1,d-radius)*4))
        if abs(angle)>.5:desired=min(desired,2.8)
        if s['mode']=='foot':
            if abs(angle)<.9:codes.append('KeyW')
        elif s['speed']>desired+.4:codes.append('KeyS')
        elif s['speed']<desired-.2:codes.append('KeyW')
        if angle>.045:codes.append('KeyA')
        elif angle<-.045:codes.append('KeyD')
        hold(codes);page.wait_for_timeout(50)
    raise AssertionError('Could not reach '+str((x,z))+' '+json.dumps(read()))
def choose(kind,id):
    page.locator('#world').focus();page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]')
    page.locator('[data-city-select="'+kind+':'+id+'"]').click()
def closecity():
    page.locator('#city-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');hold([])
def closestreet():
    page.locator('#street-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');hold([])
def mount():
    s=read();v=s['vehicles']['bike'];drive(v['x']+2.5,v['z']+.6,.7);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="bike"')
def fixture():
    if MODE!='services':return None
    code="""import {newState,saveData} from './model.mjs';
const s=newState();s.credits=100;s.relay=true;s.upgraded=true;s.life.flags={ink:true,pippa:true,prism:true,lantern:true,warrant:true,ledger:true,rocco:true,charter:true,cog:true,garden:true};
s.life.quests={ink:3,cat:3,lantern:3,receipts:5,orchard:4};s.street.done=['tonic','dinner','gardenbench','bell'];s.life.xp=700;s.life.paid=['quest-ink','quest-cat','quest-lantern','quest-receipts','quest-orchard'];
const save=saveData(s);delete save.city;console.log(JSON.stringify(save));"""
    return subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True).strip()
with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**opts)
    ctx=browser.new_context(viewport={'width':1000,'height':720},has_touch=MODE=='nearby',service_workers='block',record_video_dir=str(OUT/'video'))
    saved=fixture()
    if saved:ctx.add_init_script('if(!sessionStorage.getItem("city-fixture-loaded")){localStorage.setItem("svgn.leonardos-guild.v1",'+json.dumps(saved)+');sessionStorage.setItem("city-fixture-loaded","1");}')
    host=urlparse(BASE).hostname
    ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
    page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
        page.wait_for_function('LeonardoGuild.inspect().render.art.ready||LeonardoGuild.inspect().render.art.failed',timeout=120000)
        check(read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'Lantern Hours loads in the existing browser game')
        check(read()['render']['art']['ready'] and read()['render']['art']['models']==32,'The same 32 licensed art assets load successfully')
        page.locator('#start').click();page.wait_for_function('LeonardoGuild.inspect().render.atmosphere.loadedLanterns===3')
        check(read()['render']['articulatedPlayer'],'The existing player has actual articulated shoulder/head meshes')
        if MODE=='nearby':
            page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]');s=read();page.wait_for_timeout(250)
            check(read()['steps']==s['steps'] and read()['city']['minute']==s['city']['minute'],'The chooser pauses simulation and its town clock')
            page.locator('[data-city-tab="guide"]').click();page.locator('#city-filter').select_option('all')
            check(page.locator('#city-results .city-options button').count()==37,'The unified guide retains 9 quests, 22 work items and the 5 Lantern Hours services, plus the cycle bench')
            page.locator('#city-search').fill('Ada');check(page.locator('#city-results .city-options button').count()>=1,'Guide search finds existing Ada activities')
            before=read();page.locator('[data-city-route="work:tonic"]').click()
            check(read()['x']==before['x'] and read()['z']==before['z'] and read()['credits']==before['credits'],'Tracking only marks the destination; no movement or rewards are fabricated')
            page.screenshot(path=str(OUT/'unified-guide.png'));closecity()
            page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"')
            drive(10,24);drive(10,60);drive(17,61,.8);drive(23.5,59.7,.3)
            page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]')
            check(page.locator('[data-city-select="talk:ada"]').count()==1 and page.locator('[data-city-select="work:tonic"]').count()==1,'Nearby shows Ada and her recipe work at once instead of choosing the wrong interaction')
            page.screenshot(path=str(OUT/'ada-nearby-options.png'));page.locator('[data-city-select="talk:ada"]').click();page.wait_for_selector('#life-dialog[open]')
            check(not page.locator('#city-dialog').evaluate('(d)=>d.open') and read()['paused'],'Conversation handoff leaves exactly the intended dialog open and the world paused')
            check(page.locator('#life-title').inner_text()=='Ada','The chooser reaches the selected resident, not merely the closest one')
            page.locator('#life-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
            choose('work','tonic');page.wait_for_selector('#street-dialog[open]')
            check('Useful Cup' in page.locator('#street-title').inner_text(),'The same chooser reaches the existing recipe interface')
            closestreet();page.keyboard.press('KeyT');page.wait_for_selector('#life-dialog[open]');page.keyboard.press('Escape');page.wait_for_function('!LeonardoGuild.inspect().paused')
            page.keyboard.press('KeyY');page.wait_for_selector('#street-dialog[open]');closestreet()
            check(True,'Original T / Talk and Y / Work controls still operate and close safely')
            page.set_viewport_size({'width':390,'height':844});page.locator('#city-touch').tap();page.wait_for_selector('#city-dialog[open]')
            page.screenshot(path=str(OUT/'portrait-nearby.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The new touch chooser fits the portrait viewport')
            check(read()['input']['pointer'] is None and read()['input']['buttons']==0,'Opening Nearby releases touch ownership instead of holding the accelerator')
            closecity();check(read()['city']['circuit']==0 and not read()['completed'],'Exploring the guide never auto-completes either adventure')
        elif MODE=='circuit':
            drive(0,90,2);drive(-8,125,1.1);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-10,127,.7)
            choose('service','lamplighter');check(page.locator('[data-city-work="bell"]').count()==1,'The civic circuit first asks for the actual bell repair')
            page.locator('[data-city-work="bell"]').click();page.wait_for_selector('#street-dialog[open]')
            for a in ['brake','gear','cord']:page.locator('[data-street-action="'+a+'"]').click()
            check('bell' in read()['street']['done'],'The old bell repair is completed through its existing controls');closestreet()
            choose('service','lamplighter');page.locator('[data-city-action="accept"]').click()
            check(read()['city']['circuit']==1,'Accepting the new civic circuit starts only that task')
            page.locator('.city-tabs [data-city-tab="circuit"]').click();check(page.locator('.city-lamps .on').count()==1,'The diagram shows the real initial crossed-wire state')
            page.screenshot(path=str(OUT/'circuit-diagrams.png'));closecity()
            drive(-10,93,.7);choose('lamp','lane');page.locator('[data-city-action="toggle"]').click()
            check(read()['city']['switches']==2 and page.locator('.city-lamps .on').count()==1,'The B switch toggles its two declared lamp connections');closecity()
            drive(0,140);drive(10,157,.7);choose('lamp','market');money=read()['credits'];page.locator('[data-city-action="toggle"]').click()
            check(read()['city']['circuit']==2 and page.locator('.city-lamps .on').count()==3,'The C switch completes the actual spatial circuit')
            check(read()['credits']==money,'Solving the lights does not prematurely award the return-to-bell payment');closecity()
            page.wait_for_function('LeonardoGuild.inspect().render.atmosphere.litCircuitLamps===3');page.screenshot(path=str(OUT/'restored-market-lamp.png'))
            drive(0,140);drive(-10,127,.7);choose('service','lamplighter');page.locator('[data-city-action="report"]').click()
            check(read()['city']['circuit']==3 and read()['credits']==money+35,'Returning physically to the bell awards the one-time circuit reward')
            check(page.locator('[data-city-action="report"]').count()==0,'A completed circuit exposes no repeat reward button');closecity()
            s=read();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
            check(read()['city']['rewarded'] and read()['credits']==s['credits'],'Circuit result and reward survive an actual reload')
            check(read()['mission']==0 and 'bell' in read()['street']['done'],'The original folio and neighbourhood state remain independent of the new route')
        else:
            check(read()['city']['minute']>=480 and read()['city']['tonics']==0,'A documented v0.4 progressed save safely initializes the new city record')
            drive(10,60,1.5);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(17,61,.8);drive(23,59,.7)
            choose('service','brewing');money=read()['credits']
            for i in range(3):page.locator('[data-city-action="brew"]').click()
            check(read()['city']['tonics']==3 and read()['credits']==money-36,'Ada bottles three portable tonics using actual earned-florin purchases')
            page.locator('[data-city-action="brew"]').click();check(read()['credits']==money-36,'A full satchel refuses a fourth charge');closecity()
            page.keyboard.press('KeyR');page.wait_for_function('LeonardoGuild.inspect().life.aura>0');page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]');page.locator('[data-city-tab="pack"]').click();focus=read()['life']['focus'];page.locator('[data-city-drink]').click()
            check(read()['city']['tonics']==2 and read()['life']['focus']>focus,'A packed tonic is consumed and restores real focus after casting Lantern');page.screenshot(path=str(OUT/'portable-tonics.png'));closecity()
            drive(17,61);drive(10,61);mount();drive(0,140,2);drive(10,201,1.5);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(14,206,.7)
            page.keyboard.press('KeyR');page.wait_for_function('LeonardoGuild.inspect().life.aura>0');choose('service','meal');focus=read()['life']['focus'];coins=read()['credits'];page.locator('[data-city-action="use"]').click()
            check(read()['city']['servings']==1 and read()['life']['focus']>focus and read()['credits']==coins,'The completed community dinner now provides a real free restorative service')
            cooldown=read()['city']['mealCooldown'];page.locator('[data-city-action="use"]').click();check(read()['city']['servings']==1 and read()['city']['mealCooldown']==cooldown,'Repeated clicks cannot consume more servings or farm rewards');closecity()
            drive(10,201);mount();drive(0,240,2);drive(80,240,2);drive(90,178,1.3);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(97,178,.8);drive(100.7,177,.7)
            # Capture the same position/camera while changing time through the inn service.
            page.locator('#settings-button').click();page.locator('#graphics-quality').select_option('high');page.locator('#settings-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
            choose('service','hours');page.locator('[data-city-action="morning"]').click();closecity();page.wait_for_timeout(350);page.screenshot(path=str(OUT/'inn-morning.png'))
            choose('service','hours');before=read();page.locator('[data-city-action="evening"]').click();after=read()
            check(after['x']==before['x'] and after['z']==before['z'] and after['vehicles']==before['vehicles'],'Waiting at the inn changes no actor or parked-vehicle position')
            check(after['steps']==before['steps'] and after['city']['mealCooldown']==before['city']['mealCooldown'],'Waiting changes the visual hour, not simulation time or supply cooldowns')
            closecity();page.wait_for_function('LeonardoGuild.inspect().render.atmosphere.phase==="Evening"');page.screenshot(path=str(OUT/'inn-evening.png'))
            check(read()['render']['atmosphere']['pointLights']<=3 and read()['render']['atmosphere']['daylight']<.6,'Evening changes real scene illumination within its non-shadow light budget')
            s=read();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
            check(read()['city']['tonics']==2 and read()['city']['minute']>1100,'The satchel and chosen town hour persist after a real reload')
            check(read()['street']['done']==s['street']['done'] and read()['life']['quests']==s['life']['quests'],'Legacy completed commissions and work survive the service update')
        check(not errors,'No uncaught browser exceptions in this native journey')
        (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'final':read(),'initial_save_fixture':json.loads(saved) if saved else None,'scope':'Served native Chromium/software WebGL. Fresh Nearby and lamp circuit; services resumes explicitly recorded v0.4 save. Normal keyboard, pointer, UI and fixed game time. No live position, clock, currency or completion assignments; not physical phone FPS certification.'},indent=2))
    except Exception as e:
        try:state=read()
        except:state=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:ctx.close();browser.close()
