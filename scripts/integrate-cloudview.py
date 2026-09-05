"""Integrate the approved visual direction into the real game; never change physics.
This is idempotent and deliberately excludes dinosaur/wiki application sources.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
game=root/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'cloudview-world.js' not in s:
 s=s.replace('<script src="./sky-visual.js"></script>','<script src="./sky-visual.js"></script>\n<script src="./cloudview-assets.js"></script>\n<script src="./cloudview-world.js"></script>')
 s=s.replace('<script src="./sky-game.js"></script>','<script src="./sky-game.js"></script>\n<script src="./cloudview-ui.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./sky-style.css">','<link rel="stylesheet" href="./sky-style.css">\n<link rel="stylesheet" href="./cloudview.css">')
 s=s.replace('window.__BUILD=1788562801;','window.__BUILD=1788568001;')
 s=s.replace('window.__merged = {THREE,', 'window.__merged = {cloudReplaced:()=>[gearMesh,packetMesh],THREE,')
p.write_text(s,newline='\r\n')
p=game/'sky-game.js';s=p.read_text()
s=s.replace('ahead=p.track?150:', 'ahead=p.track?45:')
s=s.replace('const targetX=p.x+13+ahead,targetY=-p.y+65-p.vy*6;', 'const targetX=p.x+13+ahead,targetY=-p.y+28-p.vy*4;')
s=s.replace('const desired=Math.max(.85,Math.min(1.5,view.w/(speed>15?1160:1000)));','const desired=Math.max(.8,Math.min(p.track?2.05:1.5,view.w/(p.track?650:980)));')
p.write_text(s)
p=game/'sw.js';s=p.read_text().replace('svgn-paper-route-sky-20260904','svgn-paper-route-cloudview-20260904');p.write_text(s)
p=game/'cloudview-world.js';s=p.read_text()
s=s.replace('if(engine.cloudReplaced)for(const o of engine.cloudReplaced())if(o)o.visible=false;','if(engine.cloudReplaced){const [gears]=engine.cloudReplaced();if(gears)gears.visible=false;}')
# Winding must agree with the sphere's outward vertex normals, otherwise
# DoubleSide flips the lighting on its visible surface. Correct the cached
# primitive once per freshly created art kit, before any model is batched.
if 'const spherePrimitive=kit.sphere()' not in s:
 s=s.replace('kit=CloudAssets.create(T);root=', '''kit=CloudAssets.create(T);
  const spherePrimitive=kit.sphere();
  for(let i=0;i<spherePrimitive.p.length;i+=9)for(const key of ['p','n'])for(let j=0;j<3;j++){const a=spherePrimitive[key][i+3+j];spherePrimitive[key][i+3+j]=spherePrimitive[key][i+6+j];spherePrimitive[key][i+6+j]=a;}
  root=''')
s=s.replace("if(goldSector)glow.box(cx,cy,29,12,16,.1,'#ffce65',angle);", "// Gold-sector chevrons remain legible; do not cover them with a luminous plate.")
p.write_text(s)
print('Integrated Cloudview geometry, correct surface normals, live HUD and play-only camera.')
