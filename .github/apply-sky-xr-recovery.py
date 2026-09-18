"""One-use reviewed source transformation; exact input/output hashes prevent drift."""
from pathlib import Path
import hashlib
ROOT=Path('mario-maker-clone/svgn-paper-route')
def edit(name,pairs):
 p=ROOT/name;s=p.read_text()
 assert hashlib.sha256(p.read_bytes()).hexdigest()==BEFORE[name],name+' preimage changed'
 for old,new in pairs:
  assert old in s,(name,old)
  s=s.replace(old,new)
 assert hashlib.sha256(s.encode()).hexdigest()==AFTER[name],name+' output differs'
 p.write_text(s)
BEFORE={'delivery-upgrade.js': '4f1e9e2678e835392cd0ae038a45494cb92180ea236c30d8a7bded5048cced36', 'flight-deck.js': '77ee32599bd79feb1f603b1b4cd74c72f3cf5008446a0583681d07786906f29d', 'xr-play.js': 'f63923fce60de309ea5c5d8499a3699ca88311df44fa556505c7aa40867ed451', 'tests/portal-network.test.mjs': '3046ebe30a72c79b702ee9299f04d391b1abb19cca56b8421571ba1f79ff0cba', 'tests/xr-workspace-browser.py': '165136fd0eec55e3951bca9cbe87fa99499cc999512d2aca43b1ece076b90a09', 'tests/xr-workspace-published.py': '59f34f45b68177f85d8979161f71e8983d215f0095c68a715aac8da8b6f6326e', 'sw.js': 'd87b6a353bca8e5123b3c28697c625861deb1fce1f788f02bc6fcd6e4a277457', 'release-status.js': 'cba7a541e38ce84619f8eb513396ca8a68cb1d0bb30fafa5e199b3f2f1bc6140'}
AFTER={'delivery-upgrade.js': '18d7bceeeb030133f34f8fc53a6f956fbd1eefd75f607fc0074b91b7e9109e7f', 'flight-deck.js': 'b9f6613930516452c13152e7c2ade2e813675259fb8487493be2f61f90e512de', 'xr-play.js': 'fd10f1997bf834e5bc90bede5456d7668807253b4557879d315d40c2468ee72a', 'tests/portal-network.test.mjs': '8649a9e651b8e6a935b21d14f63a8512cc1ec9894381c907343c444ded9c00bb', 'tests/xr-workspace-browser.py': '05824a136dc782c073713dc9cfa8541378fec1a670d423897fbe054320d1cf2c', 'tests/xr-workspace-published.py': 'd73b34613abfedd4cf469c483f6652648e85b9770f6a335a3748abe10b8bbffb', 'sw.js': '62778cebd09cf769d1df8f5ac2c1c7d4c7ac7b9b9f9aa5d4877f165a03eb08a2', 'release-status.js': '40c0bc9b1830c883fb7cf02ffab1587385727d88ec7f92e7e09e42afb667b659'}
edit('delivery-upgrade.js',[
 ('state.paused||state.menu||document.hidden','state.paused||state.menu||(document.hidden&&!window.SkyCycleXR?.inputVisible)'),
 ("clearKeys();if(document.hidden&&mode==='play'","if(window.SkyCycleXR?.inputVisible)return;clearKeys();if(document.hidden&&mode==='play'")])
edit('flight-deck.js',[
 ("!won && !document.hidden && !__delivery.paused","!won && (window.SkyCycleXR?.presenting ? window.SkyCycleXR.inputVisible : !document.hidden) && !__delivery.paused"),
 ("if (document.hidden || (!document.hasFocus()&&!window.SkyCycleXR?.presenting))","if (window.SkyCycleXR?.presenting ? !window.SkyCycleXR.inputVisible : document.hidden || !document.hasFocus())"),
 ("  if (waitNeutral) { previous = b;","  // B/Start must recover the top menu even when an unrelated grip is held.\n  if (window.SkyCycleXR?.presenting && ((panel&&pressed(1))||pressed(9))) { if(panel)back(panel);else if(mode==='play'&&!won){__delivery.act('pause');resetInput();}else window.SkyCycleXR.openMenu?.(); previous=b; return; }\n  if (waitNeutral) { previous = b;"),
 ("window.addEventListener('blur', () => { physical.clear(); resetInput(); if (active())","window.addEventListener('blur', () => { if(window.SkyCycleXR?.inputVisible)return; physical.clear(); resetInput(); if (active())"),
 ("if (document.hidden) { physical.clear(); resetInput(); }","if (document.hidden&&!window.SkyCycleXR?.inputVisible) { physical.clear(); resetInput(); }"),
 ("else if (pressed(0)) { const list = controls(panel)","else if (pressed(0)) { if(window.SkyCycleXR?.activateRay?.()){previous=b;return;} const list = controls(panel)")])
edit('xr-play.js',[
 ("import {stageSettings","import {createWorldAperture} from './xr-world-aperture.mjs';\nimport {stageSettings"),
 ('let keyboardDialog=null;','let keyboardDialog=null,aperture=null,rayFocus=null;'),
 ("clip=new T.ClippingGroup();clip.enabled=sessionMode==='immersive-ar';","clip=new T.Group();clip.enabled=sessionMode==='immersive-ar';aperture=createWorldAperture(T);"),
 ('clip.clippingPlanes=clipPlanes(T,anchor.matrixWorld,spatial);',"aperture.update(anchor.matrixWorld,spatial,sessionMode==='immersive-ar');\n  aperture.sync(originalScene);"),
 ('if(xrScene)disposeObject(xrScene);','aperture?.dispose();aperture=null;\n    if(xrScene)disposeObject(xrScene);'),
 ('sourcesNeutral([...sources,...physical])','sourcesNeutral([...sources,...physical],{panel:!!panel()||!!typing})'),
 ('if(!ui||!sourceRay(source,frame))','if(!ui?.visible||!sourceRay(source,frame))'),
 ('lastUI=now;rects=[];context.clearRect',"lastUI=now;rects=[];\n  ui.visible=!!current||!!typing||[...(session?.inputSources||[])].some(s=>s.hand)||screenMode==='workshop'||screenMode==='editor';\n  if(!ui.visible)return;\n  context.clearRect"),
 ("enabled:!neutral&&session.visibilityState==='visible'","enabled:!neutral&&session.visibilityState==='visible',allowRecovery:session.visibilityState==='visible'"),
 ('get presenting(){return presenting;},',"get presenting(){return presenting;},get inputVisible(){return presenting&&session?.visibilityState==='visible';},"),
 ("version:'0.26.0'","version:'0.26.1'"),
 ('get diagnostics(){return {presenting,starting,','get diagnostics(){return {presenting,starting,uiVisible:!!ui?.visible,aperture:aperture?.diagnostics||null,'),
 ('clipped:!!clip?.enabled','clipped:!!aperture?.diagnostics.active'),
 ('The hand action bar stays below the riding view.','Either stick navigates menus. Gripping a controller never blocks Back. The action bar appears for hands only; controller play has no floating menu slab.'),
 ('function back(current=panel()){',"function resumeWorkspace(){\n  fd()?.releaseForTravel();if(typing)back();\n  for(const d of document.querySelectorAll('dialog[open]'))d.close();\n  for(const id of ['ctrlov','hangov','machov','shopov','commov','lvlov','acctov']){const p=$(id);if(p?.classList.contains('show'))fd()?.back(p);}\n  virtualRoot=null;release();lastUI=0;\n  if(!window.RouteWorkshop?.active&&typeof mode!=='undefined'&&mode==='play'&&!won)__delivery.act('resume');\n}\nfunction back(current=panel()){"),
 ("  button('Recenter',35,822,255,62,","  if(current)button(window.RouteWorkshop?.active?'Resume editing now':'Resume play',895,10,270,62,resumeWorkspace);\n  button('Recenter',35,822,255,62,"),
 ('back,activate,focusControl,show,','back,activate,focusControl,show,activateRay,openMenu:openWorkspace,'),
 ('text(title,35,44,1,1130,29)','text(title,35,44,1,820,29)'),
 ('held.clear();presses.clear();pulses.clear();','rayFocus=null;held.clear();presses.clear();pulses.clear();'),
 ("document.addEventListener('focusin',e=>{if(presenting)focusControl(e.target);});","document.addEventListener('focusin',e=>{if(presenting){rayFocus=null;focusControl(e.target);}});"),
 ('if(v.hover!==r.label){v.hover=r.label;focusLabel=r.label;r.hover?.();lastUI=0;}',"if(v.hover!==r.label||v.menuKey!==lastMenuKey){v.hover=r.label;v.menuKey=lastMenuKey;focusLabel=r.label;rayFocus=r.hover?null:r.label;r.hover?.();lastUI=0;}"),
 ('function focusControl(el){',"function activateRay(){\n  if(!presenting||session?.visibilityState!=='visible'||!panel())return false;\n  const r=rects.find(r=>r.label===rayFocus&&!r.hover&&typeof r.action==='function');\n  if(!r)return false;r.action();lastUI=0;return true;\n}\nfunction focusControl(el){")])
edit('tests/portal-network.test.mjs',[('assert(p.buttons[1].pressed)','assert(p.buttons[9].pressed)'),('for(const i of [5,7,9])','for(const i of [1,5,7])')])
edit('tests/xr-workspace-browser.py',[(" def choose(label):\n"," def choose(label):\n  if label=='Pause' and not page.evaluate('SkyCycleXR.diagnostics.uiVisible'):\n   press(5);return\n")])
edit('tests/xr-workspace-published.py',[("FILES=['xr-ui-core.mjs'","FILES=['xr-world-aperture.mjs','xr-ui-core.mjs'")])
edit('sw.js',[('sky-cycle-spatial-workspace-20260917','sky-cycle-xr-recovery-20260918')])
edit('release-status.js',[('0.26.0','0.26.1'),('sky-cycle-spatial-workspace-2026.09.17','sky-cycle-xr-recovery-2026.09.18')])
