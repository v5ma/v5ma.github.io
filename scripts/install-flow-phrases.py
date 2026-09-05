"""Scoped, idempotent entry integration. Existing authoring and save code stays."""
from pathlib import Path
r=Path(__file__).resolve().parents[1];g=r/'mario-maker-clone/svgn-paper-route'
p=g/'index.html';s=p.read_text()
if 'src="./phrase-data.js"' not in s:
 anchor='<script src="./sky-network-layout.js"></script>'
 assert anchor in s
 s=s.replace(anchor,anchor+'\n<script src="./phrase-geometry.js"></script>\n<script src="./phrase-data.js"></script>\n<script src="./phrase-layout.js"></script>')
 anchor='<script src="./route-workshop.js"></script>'
 assert anchor in s
 s=s.replace(anchor,anchor+'\n<script src="./phrase-playback.js"></script>\n<script src="./phrase-runtime.js"></script>\n<script src="./phrase-coach.js"></script>')
 s=s.replace('</head>','<link rel="stylesheet" href="./phrase.css">\n</head>',1)
 s=s.replace('window.__BUILD=1788655001;', 'window.__BUILD=1788659001;')
p.write_text(s,newline='\r\n')
p=g/'sw.js';s=p.read_text();import re
s=re.sub(r"const CACHE = '[^']+';","const CACHE = 'svgn-paper-route-authored-flow-20260905';",s);p.write_text(s)
print('Authored flow paths and read-only Workshop rehearsal installed.')
