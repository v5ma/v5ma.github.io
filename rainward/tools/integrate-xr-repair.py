"""Temporary scoped assembly; committed before validation, removed before release."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def patch(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,old[:85],s.count(old));p.write_text(s.replace(old,new))
patch('direct-xr-input.mjs',"snap=false,flick=false,held={};","snap=false,flick=false,held={},menuHold=0,menuSent=false;")
patch('direct-xr-input.mjs',"flick=false;held={};};","flick=false;held={};menuHold=0;menuSent=false;};")
patch('direct-xr-input.mjs',"  if(!armed){neutral=", "  if(mode==='play'){menuHold=data.rightsecondary?menuHold+Math.max(0,Math.min(.1,dt)):0;if((data.rightstick&&!old.rightstick)||(menuHold>=.55&&!menuSent)){menuSent=true;old={...data};out.actions=['pause'];return out;}}\n  if(!armed){neutral=")
patch('direct-xr-input.mjs',"if(side?.hand)continue;", "if(side?.hand)continue;\n   if(button==='rightsecondary'){if(release(button)&&!menuSent&&action!=='none')out.actions.push(action);continue;}")
patch('direct-xr-input.mjs',"out.actions=[...new Set(out.actions)];old={...data};", "out.actions=[...new Set(out.actions)];if(!data.rightsecondary)menuSent=false;old={...data};")
patch('combat.mjs',"import {weapon}","import {authorizedMuzzle} from './xr-shot.mjs';\nimport {weapon}")
patch('combat.mjs','function fire(s,direction){','function fire(s,direction,trackedOrigin){')
patch('combat.mjs',' const spec=weapon(p);',' const muzzle=trackedOrigin===undefined?undefined:authorizedMuzzle(s,trackedOrigin);if(trackedOrigin!==undefined&&!muzzle)return false;\n const spec=weapon(p);')
patch('combat.mjs','},o={x:p.x,y:heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,z:p.z};','},o=muzzle||{x:p.x,y:heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,z:p.z};')
patch('xr-panel.mjs',"import * as T from './vendor/three.module.js';","import * as T from './vendor/three.module.js';\nimport {readingPages} from './xr-reading.mjs';")
patch('xr-panel.mjs',"rows=[],all=[],caption='',hold=null;", "rows=[],all=[],caption='',hold=null,documentText=null,drawnDocument=null;")
patch('xr-panel.mjs',"lastMode=mode;page=0;", "lastMode=mode;if(mode!=='pause'){documentText=null;drawnDocument=null;}page=0;")
patch('xr-panel.mjs',"const r=root();caption=mode==='play'", "const r=root();caption=documentText?.title||(mode==='play'")
patch('xr-panel.mjs',"||mode.toUpperCase();", "||mode.toUpperCase());")
patch('xr-panel.mjs',"action('BACK','back',()=>E.back())", "action(documentText?'CLOSE':'BACK','back',()=>{documentText=null;reading=false;E.back();})")
patch('xr-panel.mjs',"action(mapView?'CONTROLS':reading&&mapCanvas?", "action(documentText?'CLOSE':mapView?'CONTROLS':reading&&mapCanvas?")
patch('xr-panel.mjs',"()=>{if(mapView){mapView=false;reading=false;}","()=>{if(documentText){documentText=null;reading=false;E.back();return;}if(mapView){mapView=false;reading=false;}")
patch('xr-panel.mjs',"const lines=wrap(r?.innerText||E.instructions(),64),maxText=Math.max(1,Math.ceil(lines.length/19));textPage=Math.min(textPage,maxText-1);", "const documentPages=documentText?readingPages(documentText.text):null,lines=wrap(r?.innerText||E.instructions(),64),maxText=documentPages?.length||Math.max(1,Math.ceil(lines.length/19));textPage=Math.min(textPage,maxText-1);drawnDocument=documentText?{title:documentText.title,text:documentText.text,page:textPage,pages:maxText,visibleLines:documentPages[textPage]}:null;")
patch('xr-panel.mjs',"reading?lines:[],hold?.id", "reading?(documentPages||lines):[],hold?.id")
patch('xr-panel.mjs',"lines.slice(textPage*19,textPage*19+19).forEach", "(documentPages?documentPages[textPage]:lines.slice(textPage*19,textPage*19+19)).forEach")
patch('xr-panel.mjs',"return {mesh,collect,hit,select,release,", "return {mesh,collect,hit,select,release,showDocument(value){collect();documentText={title:String(value.title||'Field message'),text:String(value.text||'')};reading=true;mapView=false;textPage=0;lastSignature='';collect();},clearDocument(){documentText=null;drawnDocument=null;reading=false;},document:()=>drawnDocument,")
patch('quest-xr.mjs',"import {goalText}", "import {interactionReading} from './xr-reading.mjs';\nimport {createXRNotice} from './xr-notice.mjs';\nimport {goalText}")
patch('quest-xr.mjs',"let currentRay={origin:", "let lastReading=null;const notice=createXRNotice();rig.add(notice.mesh);\n let currentRay={origin:")
patch('quest-xr.mjs',"action('SATCHEL / CRAFT','pack'", "action('LAST FIELD MESSAGE','last-reading',()=>{if(lastReading)panel.showDocument(lastReading);}),\n   action('SATCHEL / CRAFT','pack'")
patch('quest-xr.mjs',"Right stick snap-turns; click pauses.","Right stick snap-turns; click pauses. HOLD B FOR MENU; release a short B press to reload.")
patch('quest-xr.mjs',"function bind(next){renderContext=next;", "function bind(next){sight.reset();notice.clear();lastReading=null;panel.clearDocument();headPose=null;renderContext=next;")
patch('quest-xr.mjs',"optionalFeatures:['local-floor']", "optionalFeatures:['local-floor','layers']")
patch('quest-xr.mjs',"optionalFeatures:['local-floor','hand-tracking']", "optionalFeatures:['local-floor','hand-tracking','layers']")
patch('quest-xr.mjs',"'WRIST STATUS / PAUSE'", "'HOLD B / R3 MENU'")
patch('quest-xr.mjs',"const playing=E.mode()==='play',pinned=!!E.freefield?.pinnedXR;", "const playing=E.mode()==='play',pinned=!!E.freefield?.pinnedXR;notice.update(playing);")
patch('quest-xr.mjs',"visual.grip.quaternion.copy(gripPose.transform.orientation)", "visual.grip.quaternion.copy(side==='right'?rayPose.transform.orientation:gripPose.transform.orientation)")
patch('quest-xr.mjs',"const raw=rays.right||{origin:camera.getWorldPosition(V()),direction:hd};", "weapons.root.updateWorldMatrix(true,true);const raw=isDiorama()?rays.right:weapons.ray();")
patch('quest-xr.mjs',"weapon:weapons.stats(),sight:sight.stats(),", "weapon:weapons.stats(),reading:panel.document(),notice:notice.stats(),sight:sight.stats(),")
patch('quest-xr.mjs',"const api={camera,rig,bind,", "const api={camera,rig,notifyInteraction(target,accepted){const item=interactionReading(E.state(),target,accepted);if(!item)return;lastReading=item;if(item.persistent){E.pause();panel.showDocument(item);recenter(false);}else notice.show(item.text,headPose);},bind,")
p=R/'quest-xr.mjs';s=p.read_text()
if 'automatic=renderer.xr.cameraAutoUpdate' not in s:
 a=s.index('  render(){const p=E.state().player;');b=s.index('\n  ray:()=>currentRay',a)
 s=s[:a]+'''  render(){const p=E.state().player,automatic=renderer.xr.cameraAutoUpdate;
   try{renderer.xr.cameraAutoUpdate=false;
    const ray=isDiorama()?{origin:new T.Vector3(p.x,heightAt(p.x,p.z)+HEIGHT[p.stance]*.82,p.z),direction:new T.Vector3(...Object.values(renderContext.aimDirection(E.state())))}:currentRay;
    sight.render(renderer,scene,rig,renderContext.hero.root,ray.origin,ray.direction,E.state().t,E.freefield?.scope!==false&&safe&&E.mode()==='play'&&p.aim&&p.waterMode!=='swim'&&['pistol','rifle'].includes(p.equipped));
    if(isDiorama())diorama.render(renderer,scene,camera,rig,renderContext.portalEnvironment);else if(viewMode==='first-person-ar')renderContext.renderAR(camera,E.state());else renderer.render(scene,camera);
   }finally{renderer.xr.cameraAutoUpdate=automatic;}
  },'''+s[b:];p.write_text(s)
patch('quest-xr.mjs',"panel.dispose();sight.dispose();", "panel.dispose();notice.dispose();sight.dispose();")
patch('scene.mjs',"const center=new T.Vector3(0,0,.5).unproject(camera),xrRay=", "if(xr.isActive()&&!miniature){const d=xr.ray().direction;return {x:d.x,y:d.y,z:d.z};}\n  const center=new T.Vector3(0,0,.5).unproject(camera),xrRay=")
patch('app.mjs',"if(interact(state)&&target?.kind==='shelter')save();", "const accepted=interact(state);if(accepted&&target?.kind==='shelter')save();if(quest?.isActive())quest.notifyInteraction(target,accepted);")
patch('app.mjs',"fire(state,scene.aimDirection(state));", "fire(state,scene.aimDirection(state),immersive&&!quest.isDiorama()?quest.ray().origin:undefined);")
patch('freefield.mjs',"freeStride:true,runSpeed:9", "freeStride:true,autoRun:true,runSpeed:9")
patch('freefield.mjs',"return {freeStride:v.freeStride!==false,runSpeed:", "return {freeStride:v.freeStride!==false,autoRun:v.freeStride!==false&&v.autoRun!==false,runSpeed:")
patch('freefield-ui.mjs',"['freeStride','Free Stride / no running fatigue','checkbox'],", "['freeStride','Free Stride / no running fatigue','checkbox'],['autoRun','Run by default / partial stick for precise movement','checkbox'],")
patch('freefield-ui.mjs',"Quest R3 pause", "Quest hold-B / R3 pause")
patch('app.mjs',"sprint:keys.has('ShiftLeft')", "sprint:(freefield.autoRun&&freefield.freeStride&&state.player.stance==='stand')||keys.has('ShiftLeft')")
p=R/'portal-view.mjs';s=p.read_text().replace('overlay.add(rig);scene.background=null;','scene.add(shell);scene.background=null;').replace('occlusion.active=false;materials.active=false;renderer.autoClear=false;renderer.render(overlay,camera);','occlusion.active=false;materials.active=false;').replace('scene.remove(world);scene.add(rig);','scene.remove(world);overlay.add(shell);');p.write_text(s)
p=R/'tests/freefield-portal.test.mjs';s=p.read_text().replace("f.press(f[side],index);assert.ok(f.step().actions.includes(action));","f.press(f[side],index);let v=f.step();if(index===5&&side==='R'){f.press(f.R,5,false);v=f.step();}assert.ok(v.actions.includes(action));");p.write_text(s)
p=R/'tests/freefield-browser.py';s=p.read_text().replace('weapon.loaded.includes','weapon.ready.includes').replace('a visible loaded local GLB, not a controller cylinder','a visible original mechanical firearm, not a controller cylinder');p.write_text(s)
