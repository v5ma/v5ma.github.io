"""Native loot encounter. Aim assistance is a test observer sending arrow and
fire keys, not a gameplay API or a write to actor/enemy health."""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-loot');OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block');c.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,sensitivity:85}))");host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort());page=c.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');page.wait_for_function('window.Rainward');page.locator('#start').click();page.wait_for_function('Rainward.mode==="play"')
  # Reuse the native navigation helper source without executing another suite.
  source=Path('rainward/tests/conservatory.py').read_text();scope={'print':print,'json':json,'OUT':OUT,'snap':lambda p:p.evaluate('Rainward.snapshot()')};exec(source[source.index('def go('):source.index('def wait(')],scope);go=scope['go']
  go(page,12,17);page.locator('#world').focus();page.mouse.click(590,400,button='right');page.mouse.down(button='right')
  page.evaluate('''async ()=>{const W=await import('./world.mjs'),cv=document.getElementById('world'),held=new Set();const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};
   await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const s=Rainward.state,e=s.enemies.find(e=>e.id==='watch-1');
    if(e.hp<=0||Rainward.mode!=='play'||performance.now()-start>150000){clearInterval(timer);for(const k of [...held])key(k,false);if(e.hp<=0)resolve();else reject(Error('Encounter did not finish'));return;}
    const a=Rainward.project(e.x,W.heightAt(e.x,e.z)+1.1,e.z),dx=e.x-s.player.x,dz=e.z-s.player.z,desired=Math.atan2(-dx,-dz),angle=Math.atan2(Math.sin(desired-Rainward.view.yaw),Math.cos(desired-Rainward.view.yaw));
    key('ArrowLeft',!a.visible?angle>0:a.x<.495);key('ArrowRight',!a.visible?angle<0:a.x>.505);key('ArrowUp',a.visible&&a.y<.495);key('ArrowDown',a.visible&&a.y>.505);
    key('KeyF',a.visible&&Math.abs(a.x-.5)<.05&&Math.abs(a.y-.5)<.06);if(s.player.mag===0&&!s.player.reload){key('KeyR',true);key('KeyR',false);}
   },16);});}''');page.mouse.up(button='right')
  page.wait_for_function('Rainward.state.drops.length>0');check(page.evaluate('Rainward.state.enemies[0].hp===0&&Rainward.state.stats.shots>=2'),'Ordinary aimed shots defeat a real patrol and produce a physical loot drop')
  d=page.evaluate('Rainward.state.drops[0]');before=page.evaluate('Rainward.state.player.reserve');go(page,d['x'],d['z']);page.keyboard.press('KeyE');page.wait_for_function('(n)=>Rainward.state.player.reserve>n',arg=before)
  check(page.evaluate('Rainward.state.drops[0].items.ammo===0'),'Scavenging transfers the drop ammunition into the real inventory');after=page.evaluate('Rainward.state.player.reserve');page.keyboard.press('KeyE');check(page.evaluate('Rainward.state.player.reserve')==after,'Repeated interaction cannot collect the same drop twice');page.screenshot(path=str(OUT/'scavenged-patrol.png'))
  go(page,0,27);page.keyboard.press('KeyE');page.wait_for_function('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).defeated.length>0');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Rainward');page.locator('#continue').click();page.wait_for_function('Rainward.mode==="play"');check(page.evaluate('Rainward.state.enemies[0].hp===0&&Rainward.state.drops[0].items.ammo===0'),'A real saved checkpoint preserves the defeated patrol and exhausted drop')
  check(not errors,'No browser exceptions in the complete loot/save interaction');(OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Actual browser, normal DOM movement/aim/fire keys using read-only path and projection guidance. No enemy-health, resource or position assignments.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':page.evaluate('window.Rainward?Rainward.snapshot():null')},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:c.close();b.close()
