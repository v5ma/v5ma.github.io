"""Reviewed, scoped candidate corrections. Remove before merge."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def replace(name,old,new):
 p=R/name;s=p.read_text()
 if new and new in s:return
 assert s.count(old)==1,(name,'divergent source',s.count(old));p.write_text(s.replace(old,new))
replace('app.mjs','WebXR immersive VR is unavailable.','WebXR immersive VR is not available.')
replace('app.mjs',"if(item==='bottle')bottle(state,view.yaw);if(item==='smoke')throwSmoke(state,view.yaw);","if(item==='bottle')bottle(state,immersive?quest.aimYaw():view.yaw);if(item==='smoke')throwSmoke(state,immersive?quest.aimYaw():view.yaw);")
replace('quest-xr.mjs','function recenter(){stamp=-1;layout++;}','function recenter(){if(headPose)calibration={x:headPose.position.x,y:headPose.position.y,z:headPose.position.z};previousHead=null;stamp=-1;layout++;}')
replace('controller-ui.mjs',"!el.closest('[hidden]')&&el.getClientRects().length>0", "!el.closest('[hidden]')&&el.getClientRects().length>0&&!(document.body.classList.contains('immersive-rainward')&&(el.id.startsWith('xr-')||el.tagName==='A'))")
replace('xr-panel.mjs',"let page=0,textPage=0,reading=false,lastMode='',lastSignature='',rows=[]", "let page=0,textPage=0,reading=false,lastMode='',lastSignature='',lastFocus=null,rows=[]")
replace('xr-panel.mjs',"el.dispatchEvent(new Event('change',{bubbles:true}));}));", "el.dispatchEvent(new Event('change',{bubbles:true}));},{element:el}));")
replace('xr-panel.mjs',"const pages=Math.max(1,Math.ceil(all.length/8));page=Math.min(page,pages-1);", "const focus=document.activeElement;if(mode!=='play'&&focus!==lastFocus){lastFocus=focus;const index=all.findIndex(row=>row.element===focus);if(index>=0&&!reading)page=Math.floor(index/8);}const pages=Math.max(1,Math.ceil(all.length/8));page=Math.min(page,pages-1);")
replace('xr-panel.mjs',"reading?lines:[],hold?.id]", "reading?lines:[],hold?.id,focus?.id]")
replace('xr-panel.mjs',"hold?.id===row.id?'#456b62':'#263b40'", "hold?.id===row.id?'#456b62':row.element===focus?'#4a5a71':'#263b40'")
replace('xr-panel.mjs',"function select(row){if(!row)return;if(row.held)", "function select(row){if(!row)return;row.element?.focus({preventScroll:true});lastFocus=document.activeElement;if(row.held)")
replace('app.mjs',"for(const [id,kind,host,label]of [['xr-title'", "const xrEntryStatus=document.createElement('p');xrEntryStatus.id='xr-entry-status';xrEntryStatus.setAttribute('role','status');$('title').append(xrEntryStatus);for(const [id,kind,host,label]of [['xr-title'")
replace('app.mjs',"$('xr-status').textContent=supported?'Immersive VR gameplay:","$('xr-entry-status').textContent=$('xr-status').textContent=supported?'Immersive VR gameplay:")
replace('app.mjs',"if(error)$('xr-status').textContent='XR could not start: '+error.message;", "if(error){$('xr-status').textContent='XR could not start: '+error.message;if($('xr-entry-status'))$('xr-entry-status').textContent=$('xr-status').textContent;}")
replace('quest-xr.mjs',"if(data.overUI&&side==='left'){sample.move=[0,0];sample.aim=false;}","if(data.overUI&&side==='left'){if(data.hand)sample.move=[0,0];sample.aim=false;}")
replace('quest-xr.mjs',"put(badge,0,playing?-.36:.89", "put(badge,0,playing?-.62:.89")
