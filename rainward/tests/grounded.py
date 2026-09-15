"""Real WebGL character benchmark. This is an explicitly synthetic motion/terrain
fixture, NOT a living-enemy mission, physical Xbox review or performance claim.
The release matrix separately runs normal-start missions and full controller UI.
"""
import json, os, subprocess, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=Path('test-output/rainward-grounded');OUT.mkdir(parents=True,exist_ok=True)
BASELINE='b87aeacb71d00b73992945daaba2fccdc66ab409'
fixture=Path('rainward/tests/grounded-baseline');fixture.mkdir(exist_ok=True)
for name in ['actors.mjs','rainworn-humans.mjs']:
 source=subprocess.check_output(['git','show',f'{BASELINE}:rainward/{name}'],text=True)
 source=source.replace("'./vendor/","'../../vendor/").replace("'./assets/","'../../assets/")
 (fixture/name).write_text(source)
checks=[];errors=[];console=[];results={}
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw)
 try:
  context=browser.new_context(viewport={'width':820,'height':720},service_workers='block')
  page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
  for variant in ['before','after']:
   page.goto(BASE+'/rainward/tests/grounded-harness.html?variant='+variant);page.wait_for_function('window.MotionFixture')
   records=[]
   for role,kind,view,grade in [('hero','stand','front',0),('hero','stand','side',0),('hero','walk','side',0),('hero','walk','side',.3),('hero','crouch','side',0),('hero','swim','side',0),('hero','tread','side',0),('watcher','walk','front',0),('raider','walk','side',0),('marksman','aim','front',0),('sentinel','walk','front',0),('drifter','walk','side',0)]:
    metrics=page.evaluate('(x)=>MotionFixture.scenario(x)',{'role':role,'kind':kind,'view':view,'grade':grade});records.append({'role':role,'kind':kind,'view':view,'grade':grade,'metrics':metrics})
    check(metrics['finite'] and metrics['bones']==17,variant+' '+role+' '+kind+' uses finite seventeen-bone transforms')
    page.screenshot(path=str(OUT/f'{variant}-{role}-{kind}-{view}-{grade}.png'))
   measures=[page.evaluate('(x)=>MotionFixture.measure(x)',{'speed':speed,'grade':grade}) for speed,grade in [(0,0),(.8,0),(2,0),(3.6,0),(6,0),(.8,.3),(.8,-.3)]]
   results[variant]={'poses':records,'measurements':measures}
  for m in results['after']['measurements']:
   check(m['settledPlantSamples']>10 and m['maxSettledPlantError']<(.012 if m['grade'] else .002),'Measured actual planted transforms remain bounded at speed '+str(m['speed'])+' grade '+str(m['grade']))
  before=results['before']['measurements'][2];after=results['after']['measurements'][2]
  check(before['lowFootSamples']>5 and after['lowFootSamples']>5 and after['lowFootRmsSpeed']<before['lowFootRmsSpeed'],'Matched walk fixture reduces near-ground foot sliding versus the immutable baseline')
  for kind in ['swim','tread']:
   m=next(p['metrics'] for p in results['after']['poses'] if p['kind']==kind)
   check(m['motion']['locked']==0 and m['motion']['groundSolves']==0,'No ground locks survive in '+kind)
  m=page.evaluate('MotionFixture.scenario({kind:"stand",detailed:false})');check(m['finite'] and m['detail']['active']==0,'Fallback geometry uses the same safe motion without imported detail')
  check(not errors,'No uncaught errors in before/after rig and material rendering');check(not any('Shader Error' in s or 'VALIDATE_STATUS' in s for s in console),'Character shaders compile without validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'results':results,'errors':errors,'console':console,'baseline':BASELINE,'scope':__doc__},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'results':results,'errors':errors,'console':console},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  browser.close();shutil.rmtree(fixture,ignore_errors=True)
