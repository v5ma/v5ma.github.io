"""Scoped, idempotent integration in the existing live game; no other projects."""
from pathlib import Path
r=Path(__file__).resolve().parents[1];g=r/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if 'src="./workshop-core.js"' not in s:
 s=s.replace('<script src="./open-course.js"></script>','<script src="./open-course.js"></script>\n<script src="./workshop-core.js"></script>\n<script src="./workshop-courses.js"></script>')
 s=s.replace('<script src="./whip-visual.js"></script>','<script src="./whip-visual.js"></script>\n<script src="./workshop-runtime.js"></script>\n<script src="./workshop-art.js"></script>\n<script src="./route-workshop.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./grapple.css">','<link rel="stylesheet" href="./grapple.css">\n<link rel="stylesheet" href="./workshop.css">')
 guard="""<script>for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(!window.RouteWorkshop?.active)return;RouteWorkshop.handleKey(e);if(e.key!=='Tab'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.stopImmediatePropagation();},true);</script>\n"""
 s=s.replace('<script>',guard+'<script>',1)
 s=s.replace('window.__BUILD=1788586201;', 'window.__BUILD=1788602401;')
p.write_text(s,newline='\r\n')
p=g/'cloudview-world.js';s=p.read_text()
if 'WorkshopArt.populate' not in s:
 start='   island(cx-45,by-57,-58,185,205,tag.stage+3,9);'
 s=s.replace(start,'   if(!course.wm){\n'+start)
 stop='  // Distant rail networks, scaled into the scenery for the sky-maze silhouette.'
 s=s.replace('  }\n'+stop,'   }\n  }\n'+stop)
 s=s.replace('  for(let k=0;k<course.stages+2;k++){','  if(!course.wm)for(let k=0;k<course.stages+2;k++){')
 s=s.replace('  cloudBank(T,course,night);','  if(course.wm?.style!==\'vault\')cloudBank(T,course,night);\n  if(course.wm&&window.WorkshopArt)WorkshopArt.populate({course,m,root,kit,metal,terrain,greenery,far,sign});')
p.write_text(s)
p=g/'cloudview-ui.js';s=p.read_text().replace('s.completed.size/count','s.completed.size/(count||1)');p.write_text(s)
p=g/'sw.js';s=p.read_text().replace('svgn-paper-route-depth-20260905','svgn-paper-route-workshop-20260905');p.write_text(s)
print('Integrated the live Route Workshop, two distinct courses, room exploration and wider framing.')
