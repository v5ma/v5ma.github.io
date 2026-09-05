"""Install the open-course modules into the existing live app, not Studio."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
g=root/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if './grapple-core.js' not in s:
    assert '<script src="./sky-routes.js"></script>' in s and '<script src="./cloudview-ui.js"></script>' in s
    s=s.replace('<script src="./sky-routes.js"></script>', '<script src="./sky-routes.js"></script>\n<script src="./grapple-core.js"></script>\n<script src="./open-course.js"></script>')
    s=s.replace('<script src="./cloudview-ui.js"></script>', '<script src="./cloudview-ui.js"></script>\n<script src="./grapple-game.js"></script>')
    s=s.replace('<link rel="stylesheet" href="./cloudview.css">', '<link rel="stylesheet" href="./cloudview.css">\n<link rel="stylesheet" href="./grapple.css">')
    s=s.replace('window.__BUILD=1788568001;', 'window.__BUILD=1788583201;')
p.write_text(s,newline='\r\n')
p=g/'sw.js';s=p.read_text().replace('svgn-paper-route-cloudview-20260904','svgn-paper-route-whip-20260905');p.write_text(s)
p=root/'tests/sky_browser.py';s=p.read_text();s=s.replace("page.locator('[data-course]').count()==3,'Three loop-first routes appear in the main game menu'", "all(page.locator('[data-course=\"'+str(i)+'\"]').count()==1 for i in range(3)),'All three original loop routes remain in the main game menu'")
p.write_text(s)
print('Installed Hookline Run in the live game. Studio and other projects unchanged.')
