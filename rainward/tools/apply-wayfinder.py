"""Single-use, scoped v0.14.0 patch; the preparation job deletes it before QA."""
from pathlib import Path
import json,subprocess
R=Path('rainward')
assert json.loads((R/'release.json').read_text())['version']=='0.14.0'
def rep(name,old,new):
 p=R/name;s=p.read_text();assert s.count(old)==1,(name,'source diverged',s.count(old));p.write_text(s.replace(old,new))
rep('xr-input.mjs','out.confirmHeld=!!(data.righttrigger||data.lefttrigger||data.rightprimary);','// Native A crafting has its own owner; ray holds are owned by the spatial panel.\n  out.confirmHeld=!!data.rightprimary;')
for old,new in [
 ('lastFocus=null,rows=[]','lastFocus=null,hoverId=null,rows=[]'),
 (".filter(el=>!el.disabled&&!el.closest('[hidden]')",".filter(el=>!el.closest('[hidden]')"),
 ('{element:el}));','{element:el,disabled:el.disabled}));'),
 ('{element:el,held:E.isHeld(el)}','{element:el,disabled:el.disabled,held:E.isHeld(el)}'),
 ('const signature=JSON.stringify([mode','const progress=E.progress?.();\n  const signature=JSON.stringify([mode'),
 ('rows.map(r=>r.label)','rows.map(r=>[r.label,!!r.disabled])'),
 ('hold?.id,focus?.id]','hold?.id,focus?.id,hoverId,progress?.percent]'),
 ("c.fillStyle='#e4d2a9';wrap(caption,71)","c.fillStyle='#e4d2a9';wrap(progress?.label||caption,71)"),
 ("hold?.id===row.id?'#456b62':row.element===focus?'#4a5a71':'#263b40'","row.disabled?'#1d2a2d':hold?.id===row.id?'#456b62':hoverId===row.id?'#426362':row.element===focus?'#4a5a71':'#263b40'"),
 ("c.strokeStyle='#819995';c.strokeRect","c.lineWidth=hoverId===row.id?4:1;c.strokeStyle=hoverId===row.id?'#f7df9d':'#819995';c.strokeRect"),
 ("c.fillStyle='#ffffff';c.font=(row.w","c.fillStyle=row.disabled?'#97aaa9':'#ffffff';c.font=(row.w"),
 ("(row.held?'HOLD: ':'')+row.label","(row.disabled?'UNAVAILABLE: ':row.held?'HOLD: ':'')+row.label"),
 ("  c.fillStyle='#b6cac6';","  if(progress){c.fillStyle='#294140';c.fillRect(28,196,968,8);c.fillStyle='#edcf84';c.fillRect(28,196,968*progress.percent/100,8);}\n  c.fillStyle='#b6cac6';"),
 ('function select(row){if(!row)return;','function select(row,sourceId=null){if(!row||row.disabled||row.element?.disabled)return;'),
 ('{hold=row;E.hold(row,true);','{hold={...row,sourceId};E.hold(row,true);'),
 ('return {mesh,collect,hit,select,release,held:','return {mesh,collect,hit,select,release,setHover(id){hoverId=id;},hover:()=>hoverId,held:'),
 ('rows.map(({id,x,y,w,h,label})=>({id,x,y,w,h,label}))','rows.map(({id,x,y,w,h,label,disabled})=>({id,x,y,w,h,label,disabled:!!disabled}))')]:rep('xr-panel.mjs',old,new)
for old,new in [
 ("import {createXRPanel} from './xr-panel.mjs';","import {createXRPanel} from './xr-panel.mjs';\nimport {holdOwnerActive,hoverTarget,craftReadout} from './xr-interaction.mjs';"),
 ('const reset=()=>{input.reset();','const reset=()=>{panel.release();panel.setHover(null);input.reset();'),
 ('extraActions:presentationActions,hint:','extraActions:presentationActions,progress:()=>craftReadout(E.state().player),hint:'),
 ('const grip=new T.Group(),body=',"const cursor=new T.Mesh(new T.SphereGeometry(.007,8,6),new T.MeshBasicMaterial({color:0xffdf97,transparent:true,depthTest:false,depthWrite:false}));cursor.renderOrder=10002;cursor.visible=false;rig.add(cursor);\n  const grip=new T.Group(),body="),
 ('visuals[side]={group,laser,grip,joints,jointLines};','visuals[side]={group,laser,cursor,grip,joints,jointLines};'),
 ('visual.group.visible=visual.grip.visible=visual.joints.visible=visual.jointLines.visible=false;','visual.cursor.visible=visual.group.visible=visual.grip.visible=visual.joints.visible=visual.jointLines.visible=false;'),
 ('data.overUI=!!hit;data.row=','data.overUI=!!hit;visual.cursor.visible=!!hit;if(hit)visual.cursor.position.copy(rig.worldToLocal(hit.point.clone()));data.row='),
 ('else panel.select(data.row);','else panel.select(data.row,data.id);'),
 ('panelView:panel.view(),','panelView:panel.view(),panelHover:panel.hover(),panelHoldOwner:panel.held()?.sourceId||null,craftReadout:craftReadout(E.state().player),')]:rep('quest-xr.mjs',old,new)
needle="sample=input.sample(list,dt,{mode:E.mode(),key:E.mode()+':'+layout,handFire});safe=input.isArmed();"
rep('quest-xr.mjs',needle,needle+"\n  panel.setHover(hoverTarget(list));\n  if(panel.held()){\n   // Only the initiating ray may sustain this hold. The other trigger cannot\n   // take over on release, even if it remains pressed or pointing elsewhere.\n   if(!holdOwnerActive(panel.held(),list)){reset();return emptyXR();}\n   sample.confirm=false;sample.confirmHeld=false;sample.nav=sample.navX=sample.scroll=0;sample.fire=false;panel.collect();return sample;\n  }")
rep('hud.mjs','import {weapon}',"import {createClinicJournal,drawClinicRoutes} from './clinic-wayfinding.mjs';\nimport {weapon}")
rep('hud.mjs','const {setMode,closePanel}=E;','const {setMode,closePanel}=E;const clinicJournal=createClinicJournal();')
rep('hud.mjs','function drawMap(){journal.update();','function drawMap(){clinicJournal.update(E.state);journal.update();')
rep('hud.mjs',"}g.textAlign='center';g.font='bold 18px monospace';","}drawClinicRoutes(g,state,{x,z});g.textAlign='center';g.font='bold 18px monospace';")
rep('hud.mjs','function hud(){const {state','function hud(){clinicJournal.update(E.state);const {state')
rep('floodgate-recut-art.mjs','import * as T',"import {createClinicCues} from './clinic-wayfinding.mjs';\nimport * as T")
rep('floodgate-recut-art.mjs','const surfaces=[];','const cues=createClinicCues(scene),surfaces=[];')
rep('floodgate-recut-art.mjs'," A.label('YARD SHUTTER\\nRELEASE FROM INSIDE'"," const closedLabel=A.label('YARD SHUTTER\\nRELEASE FROM INSIDE'")
rep('floodgate-recut-art.mjs'," A.label('MARKET TERRACE"," const openLabel=A.label('YARD RETURN OPEN\\nRAIN GARDEN',-27.1,1.5,4.48,1.35,.4,'#344e4b','#f2dfb2');openLabel.visible=false;\n A.label('MARKET TERRACE")
rep('floodgate-recut-art.mjs','amber.material.color.setHex(open?','closedLabel.visible=!open;openLabel.visible=open;amber.material.color.setHex(open?')
rep('floodgate-recut-art.mjs','returnGateOpen:open,finalArtApproved:false',"returnGateOpen:open,routeChevrons:cues.count,gateLabel:open?'YARD RETURN OPEN':'RELEASE FROM INSIDE',finalArtApproved:false")
rep('tests/recut-browser.py','  go(-13,23);go(-19,16)', '''  check(page.evaluate('Rainward.snapshot().visuals.recut.routeChevrons')==10,'Ten low painted cues mark the actual clinic ramps')
  pulse(8);wait('Rainward.mode===\\"map\\"');nav('clinic-route-guide-open');pulse(0)
  check(page.locator('#clinic-route-guide').get_attribute('open') is not None,'Xbox navigation opens the route key without a pointer')
  check('CLOSED' in page.locator('#clinic-route-status').inner_text(),'The journal explains the initially locked return crossing')
  check('dotted = garden' in page.locator('#clinic-route-legend').inner_text(),'Route patterns have a textual key instead of relying on color alone')
  capture('00-route-journal-closed');pulse(1);wait('Rainward.mode===\\"play\\"')
  go(-13,23);go(-19,16)'''.replace('\\"','"'))
rep('tests/recut-browser.py',"  capture('01-inside-return-gate');",'''  check(page.evaluate('Rainward.snapshot().visuals.recut.gateLabel')=='YARD RETURN OPEN','The physical shutter sign changes to identify the newly opened return')
  pulse(8);wait('Rainward.mode===\\"map\\"');check('OPEN / YARD RETURN' in page.locator('#clinic-route-status').inner_text(),'The route journal reflects the actual opened collision gate')
  capture('00-route-journal-open');pulse(1);wait('Rainward.mode===\\"play\\"')
  capture('01-inside-return-gate');'''.replace('\\"','"'))
for name in ['world.mjs','index.html','tests/aquatic.test.mjs','tests/reclaimed.test.mjs','tests/handoff.test.mjs']:
 p=R/name;p.write_text(p.read_text().replace('0.14.0','0.14.1'))
p=R/'release.json';r=json.loads(p.read_text());r.update(version='0.14.1',build='rainward-wayfinder-20260915',changes=['Add floor-level clinic approach chevrons and an open/closed yard-return sign','Add a controller-accessible clinic route key and map patterns that distinguish the locked crossing','Show XR ray endpoint cursors, target highlighting and stable unavailable menu rows','Show actual crafting progress and bind each held ray action to its initiating tracked source','Retain all three XR views, Xbox presets, seven chapters, objectives, finite supplies and existing checkpoint formats']);p.write_text(json.dumps(r,indent=2)+'\n')
p=R/'production-plan.json';d=json.loads(p.read_text());d.update(release='0.14.1',edition='Wayfinder',updated='2026-09-15');d['references'].insert(0,{'title':'Wayfinder route and XR interaction polish','url':'WAYFINDER.md'});d['continuation']['wayfinder']={'status':'Implemented','scope':'Existing clinic route cues and journal, spatial hover feedback and per-source crafting holds. No new level or save migration.','evidence':'WAYFINDER.md','physicalHardware':'Not tested','unfamiliarPlayer':'Not reviewed'}
for t in d['items']:
 if t['id'] in ['RW-028','RW-063']:
  t['resumeNote']+=' Wayfinder adds route readability and per-source spatial hold safety; see WAYFINDER.md. Human/device approval is unchanged.'
p.write_text(json.dumps(d,indent=2)+'\n')
prefix='# Current release / Wayfinder v0.14.1\n\nRead WAYFINDER.md for clinic route chevrons, the gate/map/journal state, spatial pointer feedback and source-owned crafting holds. Open Diorama v0.14.0 is already merged in PR 154; do not revive its preparation branches. The next work remains graybox evaluation and the remaining Floodgate sequence, then chapter replacements, body/contact animation and physical Quest/Xbox review. All seven chapter identities, saves and Xbox presets are retained. The release PR and hash receipt establish publication.\n\nThe previous release records follow as historical context.\n\n'
for name in ['README.md','CONTROLLER.md','DEVELOPMENT-HANDOFF.md']:
 p=R/name;p.write_text(prefix+p.read_text())
subprocess.run(['python','rainward/tools/build-production-plan.py'],check=True)
