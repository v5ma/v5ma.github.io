"""Actual scene objects and panel textures, without GPU/device acceptance."""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/playability';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
 try:
  p=b.new_page();p.goto('about:blank');p.set_content('<div id="scene-wrap"></div><button id="play"></button>')
  for f in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/fire.js','river/difficulty.js','river/core.js','river/art.js','river/rotunda.js']:
   p.add_script_tag(content=(ROOT/'prism-current'/f).read_text())
  report=p.evaluate('''()=>{const T=AFRAME.THREE,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const scene={object3D:new T.Scene(),camera:new T.PerspectiveCamera(68,1.28,.05,100),is:()=>false,components:{}};
   const g={T,el:scene,phase:'playing',state:RiverCore.create(),difficulty:'easy',playerX:0,crouch:0,quality:'balanced',quiet:false,immersive:true,chapter:'duck-armada',audio:{volume:.55,effectsVolume:.22},point:()=>new T.Vector3(0,1,-2)};
   scene.components['river-game']=g;g.art=RiverArt.build(T,scene);const menu=g.art.panel(1.68,1.14),hud=g.art.panel(1.75,.28),dock=RiverRotunda.install(g,menu,hud);
   g.state.mode='playing';g.state.health=37;dock.update({hands:[]},{transform:{position:{x:0,y:1.65,z:0},orientation:{x:0,y:0,z:0,w:1}}});scene.object3D.updateMatrixWorld(true);
   const gauge=scene.object3D.getObjectByName('prism-health-gauge');check(gauge?.visible&&dock.diagnostics.health===37,'Scene health gauge uses the actual current health, not a static label');
   check(gauge.parent===g.art.stage&&gauge.parent!==scene.camera,'Health gauge belongs to the recentered game stage, not the camera');check(gauge.material.map.isCanvasTexture,'Health numerals and fill bar are drawn onto an in-scene texture');
   const matrix=gauge.matrixWorld.clone();scene.camera.position.x=2;scene.camera.rotation.y=.4;dock.update({hands:[]},{transform:{position:{x:2,y:1.65,z:0},orientation:{x:0,y:.2,z:0,w:.98}}});scene.object3D.updateMatrixWorld(true);check(gauge.matrixWorld.equals(matrix),'Head movement does not drag the health gauge');
   g.phase='paused';dock.update({hands:[]});check(!gauge.visible,'Pause stows the combat gauge while the main menu opens');
   g.phase='playing';g.state=RiverCore.create('duck-armada');g.state.mode='playing';let healthSeen=false,blockSeen=false,bossSeen=false;
   for(let t=0;t<89;t+=.1){RiverCore.advance(g.state,t);g.art.update(g.state,t,.1,false,false,true);const h=scene.object3D.getObjectByName('river-actor-health'),block=scene.object3D.getObjectByName('river-actor-block'),boss=scene.object3D.getObjectByName('river-actor-boss-duck');healthSeen=healthSeen||!!h?.visible;blockSeen=blockSeen||!!block?.visible;if(t<152*RiverCore.BEAT&&boss?.visible)throw Error('early boss model');bossSeen=bossSeen||!!boss?.visible;}
   check(healthSeen&&blockSeen,'Real core events create distinct health and block models');check(bossSeen,'The redesigned duck flagship appears only during the final phrase');
   dock.dispose();g.art.dispose();check(scene.object3D.children.length===0,'Menu, health gauge and art clean up without orphaned objects');return {passed:checks.length,checks,scope:'Actual Three objects and production HUD update; controlled host state fixtures, not native gameplay or physical Quest.'};}''')
  (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 finally:b.close()
