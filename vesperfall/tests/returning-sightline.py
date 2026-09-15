"""Isolated art review of actual chapter geometry; not a gameplay traversal.
The review camera never changes the player's pose, resources or save state.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output'/'sightline';OUT.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1000,'height':700},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:4173/vesperfall/',wait_until='domcontentloaded')
 page.wait_for_function('window.Vesperfall?.component.returningBell&&AFRAME.scenes[0].renderer.info.render.calls>0',timeout=120000)
 result=page.evaluate("""()=>{const g=Vesperfall.component,T=g.T,pane=g.worldArt.group.getObjectByName('Return gate glazed sightline');
  const before=JSON.stringify({p:g.game.p,chapter:g.game.chapter,storage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))});
  if(!pane||!pane.material.transparent||pane.material.opacity>.3)throw Error('Missing actual glazing');
  const blocker=g.game.world.solids.find(s=>s.id==='return-gate');if(!blocker)throw Error('Gate collision removed');
  pane.updateWorldMatrix(true,false);const bounds=new T.Box3().setFromObject(pane);
  if(Math.abs(bounds.min.x-blocker.min[0])>.001||Math.abs(bounds.max.x-blocker.max[0])>.001||Math.abs(bounds.min.y-.9)>.001)throw Error('Glazing/solid mismatch');
  const scene=new T.Scene();scene.background=new T.Color('#718d96');scene.add(g.worldArt.group.clone(true));
  scene.add(new T.HemisphereLight('#ffffff','#354042',2.2));const light=new T.DirectionalLight('#fff2db',2.4);light.position.set(-4,9,7);scene.add(light);
  const camera=new T.PerspectiveCamera(64,1000/700,.05,100);camera.position.set(9.5,1.65,8);camera.lookAt(-2,1.2,8);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,700);renderer.render(scene,camera);
  renderer.domElement.id='sightline-review';Object.assign(renderer.domElement.style,{position:'fixed',inset:'0',zIndex:999999});document.body.append(renderer.domElement);
  const after=JSON.stringify({p:g.game.p,chapter:g.game.chapter,storage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))});
  if(before!==after)throw Error('Art review mutated game or storage');
  return {version:VesperCore.VERSION,opacity:pane.material.opacity,collision:blocker,playerUnchanged:true,renderCalls:renderer.info.render.calls,scope:'Isolated camera viewing the actual closed chapter gate from its service side. No gameplay path or hardware claim.'};}""")
 page.screenshot(path=str(OUT/'closed-gate-service-view.png'))
 assert result['renderCalls']>0 and not errors
 result['errors']=errors;(OUT/'report.json').write_text(json.dumps(result,indent=2))
 browser.close()
