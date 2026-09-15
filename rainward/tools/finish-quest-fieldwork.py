"""XR map parity and normal-play route acceptance. Remove after integration."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def replace(name,old,new):
 p=R/name;s=p.read_text()
 if new in s:return
 assert s.count(old)==1,(name,s.count(old));p.write_text(s.replace(old,new))
replace('xr-panel.mjs',"reading=false,lastMode=''","reading=false,mapView=false,lastMode=''")
replace('xr-panel.mjs',"textPage=0;reading=false;release();","textPage=0;reading=false;mapView=false;release();")
replace('xr-panel.mjs',"const toolbar=[action('BACK'", "const mapCanvas=r?.querySelector('canvas#map');const toolbar=[action('BACK'")
replace('xr-panel.mjs',"action(reading?'CONTROLS':'READ TEXT','read',()=>{reading=!reading;textPage=0;})", "action(mapView?'CONTROLS':reading&&mapCanvas?'VIEW MAP':reading?'CONTROLS':'READ TEXT','read',()=>{if(mapView){mapView=false;reading=false;}else if(reading&&mapCanvas){reading=false;mapView=true;}else reading=!reading;textPage=0;})")
replace('xr-panel.mjs','if(reading)rows=rows.filter','if(reading||mapView)rows=rows.filter')
replace('xr-panel.mjs','page,textPage,reading,reading?lines:[]','page,textPage,reading,mapView,reading?lines:[]')
replace('xr-panel.mjs',"if(reading){c.fillStyle='#e5eeee';", "if(mapView&&mapCanvas){const height=565,width=height*mapCanvas.width/mapCanvas.height;c.drawImage(mapCanvas,(1024-width)/2,214,width,height);c.fillStyle='#e5eeee';c.font='22px sans-serif';wrap(r.querySelector('#map-legend')?.textContent,75).slice(0,2).forEach((l,i)=>c.fillText(l,28,807+i*25));}if(reading){c.fillStyle='#e5eeee';")
replace('xr-panel.mjs','held:()=>hold,page:()=>page,rows:', "held:()=>hold,page:()=>page,view:()=>mapView?'map':reading?'text':'controls',rows:")
replace('quest-xr.mjs','panelPage:panel.page(),panelRows:', 'rigVisible:rig.visible,safetyFade:veil.material.opacity,panelView:panel.view(),panelPage:panel.page(),panelRows:')
p=R/'tests/quest-browser.py';s=p.read_text();needle="  select('musicVolume-minus');check"
if 'The original field map is drawn' not in s:
 s=s.replace(needle,"  select('resume');wait('Rainward.mode===\"play\"');select('map');wait('Rainward.mode===\"map\"');click_visible('read');click_visible('read');check(p.evaluate('Rainward.snapshot().xr.panelView')=='map','The original field map is drawn inside the immersive panel');p.screenshot(path=str(OUT/'04-xr-map.png'));click_visible('back');wait('Rainward.mode===\"play\"');select('pause');wait('Rainward.mode===\"pause\"')\n"+needle)
needle="  check(not errors,'No uncaught JavaScript errors in the native XR journey')"
if 'Permission denial leaves' not in s:
 s=s.replace(needle,"  check(not p.evaluate('Rainward.snapshot().xr.rigVisible'),'XR-only panels and tracked visuals are hidden after returning to desktop')\n  p.evaluate('questDevice.deny=true');p.locator('#xr-start').click();wait('document.getElementById(\"xr-status\").textContent.includes(\"Mock user denial\")');check(not p.evaluate('Rainward.snapshot().xr.active') and p.evaluate('Rainward.mode')=='pause','Permission denial leaves the preserved expedition paused with visible feedback')\n"+needle)
# Preserve the failed exposed route. New journey uses ordinary dive cover and the
# existing normal-speed option, not difficulty edits, health grants or dead enemies.
if 'The public comfort option selects' not in s:
 a=s.index("  if KIND=='hands':select('hand-fire')\n  away();")
 b=s.index('  go(3,29);go(15,23.5);go(15,18);',a)
 fire=s[a:b].replace("if KIND=='hands'","if quest_kind()=='hands'").replace("if KIND=='controllers'","if quest_kind()=='controllers'")
 s=s[:a]+"  select('comfort-speed');check(not p.evaluate('Rainward.snapshot().xr.comfortSpeed'),'The public comfort option selects normal speed without altering the simulation')\n"+s[b:]
 s=s.replace("  go(15,-13)\n  if KIND=='controllers':button('right',5,'Rainward.state.player.submerged')\n  else:select('prone');wait('Rainward.state.player.submerged')\n", "  if KIND=='controllers':button('right',5,'Rainward.state.player.submerged')\n  else:select('prone');wait('Rainward.state.player.submerged')\n  go(15,-13)\n")
 s=s.replace("  ammo=p.evaluate('Rainward.state.player.mag');", "  if KIND=='hands':select('hand-fire')\n  ammo=p.evaluate('Rainward.state.player.mag');")
 s=s.replace("  go(15,23.5);go(3,29);go(0,48);interact();", "  if KIND=='controllers':button('right',5,'Rainward.state.player.submerged')\n  else:select('prone');wait('Rainward.state.player.submerged')\n  go(15,18)\n  if KIND=='controllers':button('right',4)\n  else:select('traverse')\n  wait('!Rainward.state.player.submerged');go(15,23.5);go(3,29);go(0,48);interact();")
 s=s.replace("  p.screenshot(path=str(OUT/'03-second-chapter.png'));select('exit');",fire+"  p.screenshot(path=str(OUT/'03-second-chapter.png'));select('exit');")
p.write_text(s)
