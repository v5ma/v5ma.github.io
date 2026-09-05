"""Integrate the Cloudview renderer without changing simulation or route data."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
game=ROOT/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'cloudview-world.js' not in s:
    shapes='PointLight,HemisphereLight,SphereGeometry,CylinderGeometry,ConeGeometry,TorusGeometry,DodecahedronGeometry,CircleGeometry,RepeatWrapping,CanvasTexture'
    assert s.count('PointLight,CanvasTexture')==2, 'Review the renderer import before integrating.'
    s=s.replace('PointLight,CanvasTexture',shapes)
    s=s.replace('<script src="./sky-visual.js"></script>','<script src="./sky-visual.js"></script>\n<script src="./cloudview-world.js"></script>')
    s=s.replace('<script src="./sky-game.js"></script>','<script src="./sky-game.js"></script>\n<script src="./cloudview-ui.js"></script>')
    s=s.replace('<link rel="stylesheet" href="./sky-style.css">','<link rel="stylesheet" href="./sky-style.css">\n<link rel="stylesheet" href="./cloudview.css">')
    s=s.replace('window.__BUILD=1788562801;','window.__BUILD=1788567901;')
p.write_text(s,newline='\r\n')
p=game/'sky-game.js';s=p.read_text()
s=s.replace('Math.max(.85,Math.min(1.5,view.w/(speed>15?1160:1000)))','Math.max(.85,Math.min(2.0,view.w/(speed>15?950:820)))')
s=s.replace('camera.position.set(cx+90,cy+60,650);camera.lookAt(cx,cy,0);','camera.position.set(cx+135,cy+140,800);camera.lookAt(cx,cy,0);')
p.write_text(s)
p=game/'sw.js';s=p.read_text().replace('svgn-paper-route-sky-20260904','svgn-paper-route-cloudview-20260904');p.write_text(s)
print('Cloudview 3D world, courier and HUD integrated; simulation and routes preserved.')
