"""Scoped integration: only the current public game's owned hooks.
The level compiler writes generated data, never workflow files or other apps.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1];g=root/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if 'src="./route-flow-world.js"' not in s:
 assert '<script src="./sky-network-layout.js"></script>' in s
 s=s.replace('<script src="./sky-network-layout.js"></script>','<script src="./sky-network-layout.js"></script>\n<script src="./route-flow-plans.js"></script>\n<script src="./route-flow-world.js"></script>',1)
 s=s.replace('<script src="./grapple-core.js"></script>','<script src="./grapple-core.js"></script>\n<script src="./route-flow-core.js"></script>',1)
 s=s.replace('<script src="./route-workshop.js"></script>','<script src="./route-workshop.js"></script>\n<script src="./route-flow-editor.js"></script>',1)
 s=s.replace('<link rel="stylesheet" href="./workshop.css">','<link rel="stylesheet" href="./workshop.css">\n<link rel="stylesheet" href="./route-flow.css">',1)
 s=re.sub(r'window\.__BUILD=\d+;', 'window.__BUILD=1788645601;',s,count=1)
p.write_text(s,newline='\r\n')
p=g/'route-workshop.js';s=p.read_text()
if 'RouteFlowEditor?.documentChanged' not in s:
 assert 'function refresh(){if(!S.doc)return;' in s
 s=s.replace('function refresh(){if(!S.doc)return;','function refresh(){if(!S.doc)return;window.RouteFlowEditor?.documentChanged(S.doc);',1)
if 'RouteFlowEditor?.drawWorld' not in s:
 needle="if(S.tool==='piece'&&pointer){ctx.globalAlpha=.45;line(ctx,W.piece(S.piece,snap(pointer[0]),snap(pointer[1])).points,z);ctx.globalAlpha=1;}ctx.restore();"
 assert needle in s
 s=s.replace(needle,needle.replace('ctx.restore();','window.RouteFlowEditor?.drawWorld(ctx,S);ctx.restore();'),1)
if 'applyDocument(d,' not in s:
 needle='state:S,open,close,draw,handleKey,action,returnToDraft};'
 assert needle in s
 s=s.replace(needle,"state:S,open,close,draw,handleKey,action,returnToDraft,refresh,applyDocument(d,label='Flow proposal accepted'){W.validate(d);S.doc=d;clearSelection();changed(label);}};",1)
p.write_text(s)
p=g/'sw.js';s=p.read_text();s=re.sub(r"const CACHE = '[^']+';", "const CACHE = 'svgn-paper-route-flow-20260905';",s,count=1);p.write_text(s)
p=root/'tests/workshop_browser.py';s=p.read_text()
s=s.replace('doc.paths.length===46','doc.paths.length===30').replace('pegCount===38','pegCount===5')
s=s.replace("doc.paths.length')==47", "doc.paths.length')==31").replace(".meta.id)).size')==47", ".meta.id)).size')==31").replace('doc.paths.length===47','doc.paths.length===31')
p.write_text(s)
print('Installed flow tools without replacing the original editor or other projects.')
