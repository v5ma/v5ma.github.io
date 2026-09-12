"""Render-budget fixture for long CPU-only native input regressions.

No simulation, requestAnimationFrame, input, position, health, damage, geometry,
AI, progression or clock is replaced. Ordinary A-Frame ticks continue. Only the
main desktop draw call is decimated; actual WebGL rendering is retained every
24 ticks and screenshots restore full rendering. The separate visual, sound,
Xbox and XR suites never use this fixture. This is NOT an FPS benchmark.
"""
from pathlib import Path
import json, os, runpy, sys
from urllib.parse import urlparse
from playwright.sync_api import Page, BrowserContext
ROOT=Path(__file__).resolve().parents[2]
ALLOWED={'browser.py','unchained-combat.py','hunt-browser.py','cathedral-browser.py','first-bell-browser.py'}
name=sys.argv[1] if len(sys.argv)==2 else ''
if name not in ALLOWED:
    raise SystemExit('Provide one approved native regression filename.')
active=(name in {'unchained-combat.py','hunt-browser.py'} or
        name=='first-bell-browser.py' or
        name=='browser.py' and os.getenv('VESPER_SUITE') in {'ui','gallery','expedition'} or
        name=='cathedral-browser.py' and os.getenv('CATHEDRAL_SUITE')=='routes')
if not active:
    runpy.run_path(str(Path(__file__).parent/name),run_name='__main__')
    raise SystemExit(0)
INSTALL="""() => {
 const a=AFRAME.scenes[0],r=a.renderer;
 if(window.VesperTestDrawBudget)return;
 const original=r.render,b=window.VesperTestDrawBudget={enabled:true,stride:24,calls:0,draws:0,skipped:0};
 r.render=function(scene,camera){
   if(scene===a.object3D&&camera===a.camera&&!r.xr.isPresenting){
     b.calls++;
     if(b.enabled&&(b.calls-1)%b.stride!==0){b.skipped++;return;}
     b.draws++;
   }
   return original.call(this,scene,camera);
 };
}"""
old_goto,old_shot,old_close=Page.goto,Page.screenshot,BrowserContext.close
records=[]
def goto(self,url,*args,**kwargs):
    result=old_goto(self,url,*args,**kwargs)
    if urlparse(str(url)).path.startswith('/vesperfall/'):
        self.wait_for_function('window.Vesperfall?.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0',timeout=95000)
        self.evaluate(INSTALL)
    return result
def screenshot(self,*args,**kwargs):
    enabled=False
    try:
        enabled=self.evaluate('()=>{const b=window.VesperTestDrawBudget;if(!b)return false;const was=b.enabled;b.enabled=false;const a=AFRAME.scenes[0];a.renderer.render(a.object3D,a.camera);return was;}')
        return old_shot(self,*args,**kwargs)
    finally:
        if enabled and not self.is_closed():
            self.evaluate('()=>{if(window.VesperTestDrawBudget)VesperTestDrawBudget.enabled=true;}')
def close(self,*args,**kwargs):
    for page in self.pages:
        try:
            record=page.evaluate('()=>window.VesperTestDrawBudget?{...VesperTestDrawBudget,url:location.href}:null')
            if record:records.append(record)
        except Exception:pass
    return old_close(self,*args,**kwargs)
Page.goto,Page.screenshot,BrowserContext.close=goto,screenshot,close
print('FUNCTIONAL RENDER FIXTURE: draw every 24 desktop ticks; normal A-Frame simulation and input. Full rendering for screenshots. Not hardware performance acceptance.',flush=True)
try:
    runpy.run_path(str(Path(__file__).parent/name),run_name='__main__')
finally:
    Page.goto,Page.screenshot,BrowserContext.close=old_goto,old_shot,old_close
    out=ROOT/'test-output';out.mkdir(parents=True,exist_ok=True)
    (out/'functional-render-profile.json').write_text(json.dumps({'test':name,'records':records,'scope':'Render-only decimation on the software GPU; actual WebGL every 24 desktop ticks and full-cadence screenshots. No simulation, geometry, input, AI, damage, actor, score or clock modifications. Dedicated graphics/audio/Xbox/XR acceptance runs without this fixture. Not an FPS or hardware benchmark.'},indent=2))
