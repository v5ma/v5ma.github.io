"""Integrate the approved visual direction into the real game; never change physics.
This is idempotent and deliberately excludes dinosaur/wiki application sources.
"""
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]
game=root/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'cloudview-world.js' not in s:
 s=s.replace('<script src="./sky-visual.js"></script>','<script src="./sky-visual.js"></script>\n<script src="./cloudview-assets.js"></script>\n<script src="./cloudview-world.js"></script>')
 s=s.replace('<script src="./sky-game.js"></script>','<script src="./sky-game.js"></script>\n<script src="./cloudview-ui.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./sky-style.css">','<link rel="stylesheet" href="./sky-style.css">\n<link rel="stylesheet" href="./cloudview.css">')
 s=s.replace('window.__BUILD=1788562801;','window.__BUILD=1788568001;')
 # Expose only renderer objects so the new meshes can replace the old visuals.
 s=s.replace('window.__merged = {THREE,', 'window.__merged = {cloudReplaced:()=>[gearMesh,packetMesh],THREE,')
p.write_text(s,newline='\r\n')
p=game/'sky-game.js';s=p.read_text()
# Camera framing only. Simulation and collision functions remain unchanged.
s=s.replace('ahead=p.track?150:', 'ahead=p.track?45:')
s=s.replace('const targetX=p.x+13+ahead,targetY=-p.y+65-p.vy*6;', 'const targetX=p.x+13+ahead,targetY=-p.y+28-p.vy*4;')
s=s.replace('const desired=Math.max(.85,Math.min(1.5,view.w/(speed>15?1160:1000)));','const desired=Math.max(.8,Math.min(p.track?2.05:1.5,view.w/(p.track?650:980)));')
p.write_text(s)
p=game/'sw.js';s=p.read_text().replace('svgn-paper-route-sky-20260904','svgn-paper-route-cloudview-20260904');p.write_text(s)
# Dynamic projectile replacement must never hide a packet without drawing it.
p=game/'cloudview-world.js';s=p.read_text()
s=s.replace('if(engine.cloudReplaced)for(const o of engine.cloudReplaced())if(o)o.visible=false;','if(engine.cloudReplaced){const [gears]=engine.cloudReplaced();if(gears)gears.visible=false;}')
p.write_text(s)
print('Integrated Cloudview geometry, live HUD and play-only camera. Physics untouched.')
