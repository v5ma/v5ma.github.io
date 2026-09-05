"""Install the render-only depth pass on the live entry. No Studio or wiki edits."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
game=ROOT/'mario-maker-clone/svgn-paper-route'
p=game/'index.html';s=p.read_text()
if 'src="./cloudview-depth.js"' not in s:
    anchor='<script src="./cloudview-world.js"></script>'
    assert anchor in s,'The live Cloudview renderer must be present.'
    s=s.replace(anchor,anchor+'\n<script src="./cloudview-depth.js"></script>',1)
    s=s.replace('window.__BUILD=1788583201;', 'window.__BUILD=1788586201;')
p.write_text(s,newline='\r\n')
p=game/'sw.js';s=p.read_text().replace('svgn-paper-route-whip-20260905','svgn-paper-route-depth-20260905');p.write_text(s)
print('Installed the depth pass without changing gameplay or Studio sources.')
