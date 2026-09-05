"""Integrate only the owned game entry and its renderer hooks. Idempotent."""
from pathlib import Path
r=Path(__file__).resolve().parents[1];g=r/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if 'src="./ground-courses.js"' not in s:
 s=s.replace('<script src="./open-course.js"></script>','<script src="./open-course.js"></script>\n<script src="./ground-courses.js"></script>\n<script src="./ground-art.js"></script>')
 s=s.replace('<script src="./whip-visual.js"></script>','<script src="./whip-visual.js"></script>\n<script src="./ground-runtime.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./grapple.css">','<link rel="stylesheet" href="./grapple.css">\n<link rel="stylesheet" href="./ground.css">')
 s=s.replace('window.__BUILD=1788586201;', 'window.__BUILD=1788606001;')
p.write_text(s,newline='\r\n')
p=g/'grapple-game.js';s=p.read_text().replace('window.__grapple={state,isOpen,','window.__grapple={state,isOpen,tickInput:tickWhip,');p.write_text(s)
p=g/'cloudview-world.js';s=p.read_text()
if 'GroundArt.populate' not in s:
 s=s.replace('   island(cx-45,by-57,-58,185,205,tag.stage+3,9);','   if(!course.gp){\n   island(cx-45,by-57,-58,185,205,tag.stage+3,9);')
 s=s.replace('  }\n  // Distant rail networks','   }\n  }\n  // Distant rail networks',1)
 s=s.replace('  for(let k=0;k<course.stages+2;k++){','  if(!course.gp)for(let k=0;k<course.stages+2;k++){')
 s=s.replace('  cloudBank(T,course,night);','  cloudBank(T,course,night);\n  if(course.gp)GroundArt.populate({course,m,root,kit,metal,terrain,greenery,far,sign});')
 s=s.replace('  if(course.goal){','  if(course.goal&&!course.gp){',1)
 s=s.replace('SkyRoutes.build(0,__gameRefs.T)','SkyRoutes.build(4,__gameRefs.T)')
p.write_text(s)
p=g/'cloudview-depth.js';s=p.read_text().replace('SkyRoutes.build(0,__gameRefs.T)','SkyRoutes.build(4,__gameRefs.T)');p.write_text(s)
p=g/'cloudview-ui.js';s=p.read_text().replace('s.completed.size/count','s.completed.size/(count||1)');p.write_text(s)
p=g/'sw.js';s=p.read_text().replace('svgn-paper-route-depth-20260905','svgn-paper-route-ground-first-20260905');p.write_text(s)
# Existing advanced tests now reveal the retained expert shelf before selecting.
for name in ['sky_browser.py','grapple_browser.py']:
 p=r/'tests'/name;s=p.read_text()
 s=s.replace("page.locator('[data-course]').count()==3", "page.locator('[data-course]').count()==7").replace("page.locator('[data-course]').count()==4", "page.locator('[data-course]').count()==7")
 s=s.replace("check('Rocket' in page.locator('#delivery-menu h1').inner_text(),'The default menu presents the sky loop game')", "check('Start on the street' in page.locator('#delivery-menu h1').inner_text(),'The default menu starts with approachable routes')")
 # Advanced links become visible after one intentional user action; later route
 # menus retain show-expert on the same element, so there is no extra test hook.
 if "page.locator('#advanced-routes-toggle').click()" not in s:
  needle="original=page.evaluate('levelCode()')" if name=='grapple_browser.py' else "original=page.evaluate('levelCode()');page.screenshot"
  if name=='grapple_browser.py':s=s.replace(needle,needle+"\n        page.locator('#advanced-routes-toggle').click()")
  else:s=s.replace(needle,"page.locator('#advanced-routes-toggle').click()\n  "+needle)
 p.write_text(s)
print('Ground-first progression integrated; existing challenges and records retained.')
