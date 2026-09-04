"""Idempotent, scoped integration of the sky course into the existing game."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
game=root/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'sky-routes.js' not in s:
 s=s.replace('<script src="./delivery-upgrade.js"></script>','<script src="./sky-routes.js"></script>\n<script src="./sky-visual.js"></script>\n<script src="./delivery-upgrade.js"></script>\n<script src="./sky-game.js"></script>')
 s=s.replace('<link rel="stylesheet" href="./delivery-upgrade.css">','<link rel="stylesheet" href="./delivery-upgrade.css">\n<link rel="stylesheet" href="./sky-style.css">')
 s=s.replace('window.__BUILD=1788556801;', 'window.__BUILD=1788562801;')
 needle='  renderer.render(scene, camera);\n};'
 assert needle in s
 s=s.replace(needle,'  window.__skyView?.(camera, VIEW);\n  window.SkyVisual?.update();\n'+needle,1)
 s=s.replace('const _hTimeEl =','window.__engineStep = tick;\nconst _hTimeEl =',1)
 s=s.replace('customTracks[i] = fresh;', 'fresh.sky = customTracks[i].sky; customTracks[i] = fresh;')
p.write_text(s,newline='\r\n')
p=game/'delivery-upgrade.js';s=p.read_text()
if 'SkyVisual.build' not in s:
 s=s.replace('function buildEnvironment(m){','function buildEnvironment(m){\n      if(window.SkyVisual){destroyEnvironment();env=SkyVisual.build(m);return;}')
 s=s.replace('Good morning,<br><em>news travels<br>with you.</em>','Ride the loop.<br><em>Rocket into<br>the next.</em>')
 s=s.replace('Leap across the city. Time your newspaper throws. Deliver the news, find your rhythm, and build your own route.','A 3D side-scroller through a sky maze of launch loops. Build momentum, time the gold exit, and catch the next rail across open air.')
 s=s.replace('SPACE</span> JUMP','SPACE</span> ARM EXIT').replace('MOVE &nbsp;','THROTTLE / BRAKE &nbsp;')
 s=s.replace('<span class="key">X</span> NITRO','<span class="key">R</span> RETRY CATCH')
 s=s.replace('Original 3D couriers. Three curated routes. Your existing editor and saved machines are still here.','Four, five, or six full launch loops. Lower detours on advanced routes. No ground-level bypass. Your original editor and saved machines remain.')
 s=s.replace('${r.district} / ${r.difficulty}', '${r.district} / ${r.stages} LOOPS')
 s=s.replace('The news<br><em>is delivered.</em>','Sky route<br><em>delivered.</em>')
 s=s.replace('THE CITY IS WAITING FOR YOU.', 'LOOP. LAUNCH. CATCH. DELIVER.')
 s=s.replace('hud(now);','hud(now);window.__sky?.hud();')
 s=s.replace("levelCode().split('.')[1]===state.code.split('.')[1]", "levelCode()===state.code")
p.write_text(s)
p=game/'sw.js';s=p.read_text().replace('svgn-paper-route-delivery-20260904','svgn-paper-route-sky-20260904');p.write_text(s)
p=root/'index.html'
if p.exists():
 s=p.read_text().replace('A newspaper courier, a city full of mailboxes, and a route of your own. Play three editions, then make your own level.','A 3D side-scroller through a sky maze of loops. Build speed, time your launch, catch the next rail, and deliver papers in midair.').replace('THE CITY IS WAITING FOR YOU.','LOOP. LAUNCH. CATCH. DELIVER.')
 p.write_text(s)
# Preserve all existing dinosaur/wiki checks, replacing only the street-route
# fixture with the new full 3D input replay. Do not weaken its assertions.
p=root/'tests/interactive_browser.py';s=p.read_text()
if 'tests/sky_browser.py' not in s:
 a=s.index("        page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html'")
 b=s.index("        page.goto(BASE+'/dino-atlas/index.html'",a)
 s=s[:a]+"        import subprocess,sys\n        subprocess.run([sys.executable,str(ROOT/'tests/sky_browser.py')],check=True)\n        check((OUT/'sky/report.json').exists(),'Full 3D sky-route replays pass')\n\n"+s[b:]
 p.write_text(s)
p=root/'.github/workflows/public-interactive-upgrade.yml'
if p.exists():
 s=p.read_text().replace('node --test dino-atlas/tests/unit.test.mjs tests/interactive.test.mjs\n','node --test dino-atlas/tests/unit.test.mjs tests/interactive.test.mjs tests/sky_routes.test.mjs\n')
 p.write_text(s)
print('Sky loop courses integrated; original editor and other projects preserved.')
