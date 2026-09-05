"""Scoped, hash-verified transfer/integration of the editor into the live game.
The temporary source envelope is removed before the verified commit is tested.
This script never changes workflow permissions, accounts or unrelated apps.
"""
from pathlib import Path
import hashlib,json,lzma,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'mario-maker-clone/svgn-paper-route'
ALLOWED={'mario-maker-clone/svgn-paper-route/'+n for n in ['workshop-core.js','route-workshop.js','workshop.css','workshop-input.js']}|{'tests/workshop_live.test.cjs','tests/workshop_browser.py'}
incoming=ROOT/'.workshop-incoming'
if incoming.exists():
    data=b''.join((incoming/f'part-{i}.bin').read_bytes() for i in range(6))
    assert hashlib.sha256(data).hexdigest()=='d198f86faae963d5adec9aa2d5c77c2a93f57ca69d3db517b6e0e9bb0329afb8','Incomplete source transfer'
    raw=lzma.decompress(data,memlimit=256*1024*1024)
    assert len(raw)<1000000,'Oversized editor source envelope'
    files=json.loads(raw);assert set(files)==ALLOWED,'Unexpected source path'
    for name,item in files.items():
        text=item['text'];assert hashlib.sha256(text.encode()).hexdigest()==item['sha256'],name
        p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
    for p in incoming.iterdir():p.unlink()
    incoming.rmdir()
assert all((ROOT/n).exists() for n in ALLOWED),'Required editor files are missing'
p=GAME/'index.html';s=p.read_text()
if 'src="./workshop-input.js"' not in s:
    s=s.replace('</head>','<link rel="stylesheet" href="./workshop.css">\n<script src="./workshop-input.js"></script>\n</head>',1)
    s=s.replace('</body>','<script src="./workshop-core.js"></script>\n<script src="./route-workshop.js"></script>\n</body>')
    s=s.replace('window.__BUILD=1788651001;', 'window.__BUILD=1788655001;')
p.write_text(s,newline='\r\n')
p=GAME/'sky-network-runtime.js';s=p.read_text().replace('Math.min(...ext.map(p=>p[1]))-90','(ext.length?Math.min(...ext.map(p=>p[1])):ground-600)-90');p.write_text(s)
p=GAME/'sw.js';s=re.sub(r"const CACHE = '[^']+';", "const CACHE = 'svgn-paper-route-workshop-live-20260905';",p.read_text());p.write_text(s)
subprocess.run([sys.executable,str(ROOT/'scripts/polish-workshop-live.py')],check=True)
print('Live editor source integrated. Campaign, physics and all other applications retained.')
