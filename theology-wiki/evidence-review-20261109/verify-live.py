#!/usr/bin/env python3
"""Wait for exact published evidence-edition bytes; bounded, no mutation."""
# Compare original bytes only after validating the exact current publication blocks.
import sys
from pathlib import Path
sys.path.insert(0, str(next(p for p in Path(__file__).resolve().parents
    if (p / 'scripts/theology_publication_bytes.py').is_file()) / 'scripts'))
from theology_publication_bytes import source_bytes

import hashlib,json,time,urllib.request
from pathlib import Path
section=Path(__file__).resolve().parent;root=section.parent.parent
names=['theology-wiki/evidence-review-20261109/'+p.name for p in section.iterdir() if p.suffix in ['.html','.js','.css','.json']]
names+=['theology-wiki/assets/js/research-tools.js','theology-wiki/index.html','theology-wiki/san-reader.html']
expected={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in names}
remaining=dict(expected);end=time.monotonic()+720
while remaining and time.monotonic()<end:
 for name,digest in list(remaining.items()):
  try:
   request=urllib.request.Request('https://v5ma.github.io/'+name+'?evidence='+digest[:16],headers={'Cache-Control':'no-cache','User-Agent':'TheologyEvidenceVerification/1.0'})
   with urllib.request.urlopen(request,timeout=20) as r:data=r.read()
   if hashlib.sha256(source_bytes(data,name)).hexdigest()==digest:remaining.pop(name)
  except Exception as e:print(name,type(e).__name__,flush=True)
 print('Pending exact bytes:',len(remaining),flush=True)
 if remaining:time.sleep(15)
if remaining:raise SystemExit('Published bytes not yet verified: '+', '.join(remaining))
print(json.dumps({'status':'PASS','proofLevel':'exact preserved source bytes and verified publication blocks','files':len(expected)},indent=2))
