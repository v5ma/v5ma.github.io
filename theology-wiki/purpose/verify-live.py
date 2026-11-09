"""Verify this exact publication and exercise the public entrance."""
# Compare original bytes only after validating the exact current publication blocks.
import sys
from pathlib import Path
sys.path.insert(0, str(next(p for p in Path(__file__).resolve().parents
    if (p / 'scripts/theology_publication_bytes.py').is_file()) / 'scripts'))
from theology_publication_bytes import source_bytes

import hashlib, os, subprocess, sys, time
from pathlib import Path
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parent.parent
BASE='https://v5ma.github.io/theology-wiki/'
files=['purpose/index.html','purpose/letter.txt','purpose/reading-map.json','purpose/source-integrity.json','purpose/purpose.css','purpose/entrance.css','index.html','san-reader.html','assets/js/depth-tools.js','latest/index.html','latest/manifest.json']
expected={name:hashlib.sha256((ROOT/name).read_bytes()).digest() for name in files}
deadline=time.monotonic()+300
while True:
    try:
        for name,digest in expected.items():
            with urlopen(BASE+name+'?release='+os.environ.get('GITHUB_SHA','verification'),timeout=20) as response:
                assert response.status==200 and hashlib.sha256(source_bytes(response.read(),"theology-wiki/"+name)).digest()==digest,name
        break
    except Exception as e:
        if time.monotonic()>=deadline:raise
        print('Waiting for exact published bytes:',str(e),flush=True);time.sleep(10)
print('All 11 live publication files match this exact commit.',flush=True)
subprocess.run([sys.executable,str(ROOT/'purpose/browser-test.py')],check=True,env={**os.environ,'THEOLOGY_BASE_URL':BASE})
